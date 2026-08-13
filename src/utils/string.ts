/** @internalfile */
import { isPlainObj, isRegExp, isValidDateObj, isSet, isMap, unboxPrimitiveObj } from "./object";
import { isTypedArray, toValidArray } from "./array";
import { createSafeJsonReplacer } from "./json";
import { toValidBinary } from "./binary";
import { isValidNumber } from "./number";
import {
    KEY_SEPARATOR,
    KEY_PAIR_SEPARATOR,
    TEXT_ENCODER,
    MAX_C0_CONTROL_CODE,
    ASCII_DEL_CODE,
    SURROGATE_MIN_CODE,
    SURROGATE_MAX_CODE,
    NAMED_CONTROL_ESCAPES,
} from "../constants";
import { InvalidArgumentError } from "../exceptions";
import type { StringEncoding, EscapeRegexOptions, ExtractManyOptions, ExtractRegexEngineOptions, RegexEngineOptions, FindOptions, FindManyOptions, SplitOptions, ReplaceOptions, ReplaceManyOptions } from "../types";


export function isBlankString(v: unknown): v is string {
    const unwrapped = unboxPrimitiveObj(v);
    if (typeof unwrapped === "string") {
        return unwrapped.trim().length === 0;
    }
    return false;
}

export type StripMode = "both" | "start" | "end";

export type StripCharsOptions = {
    /**
     * The strip mode: "both" (default), "start", or "end".
     */
    mode?: StripMode;
    /**
     * If true, returns an empty string instead of null when the result is empty or input is null.
     */
    returnStringOnNull?: boolean;
    /**
     * The maximum number of non-matching characters allowed to be skipped from the start
     * before a match block is found. Passing -1 or null means scan the full length.
     */
    maxScanStart?: number | null;
    /**
     * The maximum number of non-matching characters allowed to be skipped from the end
     * before a match block is found. Passing -1 or null means scan the full length.
     */
    maxScanEnd?: number | null;
    /**
     * The maximum number of non-contiguous matching blocks allowed to be stripped from the start.
     * Passing -1 or null means strip all matching blocks.
     */
    maxMatchesStart?: number | null;
    /**
     * The maximum number of non-contiguous matching blocks allowed to be stripped from the end.
     * Passing -1 or null means strip all matching blocks.
     */
    maxMatchesEnd?: number | null;
    /**
     * If true, trims standard whitespace first before performing character stripping.
     */
    trimFirst?: boolean;
    /**
     * Options that apply only when the characters parameter is a string (and not a RegExp).
     */
    stringOptions?: {
        /**
         * If true, treats the characters string as a literal substring rather than a set of characters.
         */
        literal?: boolean;
        /**
         * If true, performs case-insensitive character and substring matching.
         */
        caseInsensitive?: boolean;
    };
};

export function stripChars(
    str: string | null | undefined,
    characters: string | RegExp | null = null,
    options: StripCharsOptions = {}
): string | null {
    if (str == null) {
        return options.returnStringOnNull ? "" : null;
    }

    const {
        mode = "both",
        returnStringOnNull = false,
        maxScanStart = 1,
        maxScanEnd = 1,
        maxMatchesStart = 1,
        maxMatchesEnd = 1,
        trimFirst = false,
        stringOptions
    } = options;

    const { literal = false, caseInsensitive = false } = stringOptions ?? {};

    const trimString = (s: string, m: StripMode = "both"): string => {
        if (m === "start") return s.trimStart();
        if (m === "end") return s.trimEnd();
        return s.trim();
    };

    let workStr = str;
    if (trimFirst && characters != null) {
        workStr = trimString(str, mode);
    }

    if (characters == null) {
        const result = trimString(workStr, mode);
        return (returnStringOnNull || result !== "") ? result : null;
    }

    const matches = isRegExp(characters)
        ? (char: string) => {
            try {
                characters.lastIndex = 0;
            } catch { }
            return characters.test(char);
        }
        : (() => {
            const targetSet = new Set(caseInsensitive ? (characters as string).toLowerCase() : characters);
            return (char: string) => targetSet.has(caseInsensitive ? char.toLowerCase() : char);
        })();

    const len = workStr.length;

    const isDefaultScan = maxScanStart === 1 && maxMatchesStart === 1 && maxScanEnd === 1 && maxMatchesEnd === 1;
    if (isDefaultScan && !literal) {
        let startIndex = 0;
        let endIndex = len;

        if (mode === "both" || mode === "start") {
            while (startIndex < len && matches(workStr[startIndex])) {
                startIndex++;
            }
        }

        if (mode === "both" || mode === "end") {
            while (endIndex > startIndex && matches(workStr[endIndex - 1])) {
                endIndex--;
            }
        }

        const result = startIndex === 0 && endIndex === len ? workStr : workStr.substring(startIndex, endIndex);
        return (returnStringOnNull || result !== "") ? result : null;
    }

    const stripped = new Uint8Array(len);

    const scanNonLiteral = (
        isStart: boolean,
        limit: number | null,
        maxMatches: number | null
    ): void => {
        if (len === 0 || maxMatches === 0) {
            return;
        }

        const start = isStart ? 0 : len - 1;
        const end = isStart ? len : -1;
        const step = isStart ? 1 : -1;

        let inBlock = false;
        let matchesFound = 0;
        let totalSkipped = 0;

        for (let i = start; i !== end; i += step) {
            if (matches(workStr[i])) {
                if (!inBlock) {
                    if (limit !== null && limit >= 0 && totalSkipped >= limit) {
                        break;
                    }
                    if (maxMatches !== null && maxMatches >= 0 && matchesFound >= maxMatches) {
                        break;
                    }
                    inBlock = true;
                    matchesFound++;
                }
                stripped[i] = 1;
            } else {
                inBlock = false;
                totalSkipped++;
                if (limit !== null && limit >= 0 && totalSkipped >= limit) {
                    break;
                }
            }
        }
    };

    const scanLiteral = (
        patStr: string,
        patLen: number,
        isStart: boolean,
        limit: number | null,
        maxMatches: number | null
    ): void => {
        if (len === 0 || maxMatches === 0 || patLen === 0) {
            return;
        }

        let currentIdx = isStart ? 0 : len - 1;
        let matchesFound = 0;
        let totalSkipped = 0;
        const searchStr = caseInsensitive ? workStr.toLowerCase() : workStr;

        while (currentIdx >= 0 && currentIdx < len) {
            if (maxMatches !== null && maxMatches >= 0 && matchesFound >= maxMatches) {
                break;
            }

            const searchStart = isStart ? currentIdx : (currentIdx - patLen + 1);
            if (!isStart && searchStart < 0) {
                break;
            }

            const matchIdx = isStart
                ? searchStr.indexOf(patStr, searchStart)
                : searchStr.lastIndexOf(patStr, searchStart);

            if (matchIdx === -1) {
                break;
            }

            const skippedInThisStep = isStart
                ? (matchIdx - currentIdx)
                : (currentIdx - (matchIdx + patLen - 1));
            totalSkipped += skippedInThisStep;

            if (limit !== null && limit >= 0 && totalSkipped >= limit) {
                break;
            }

            for (let i = 0; i < patLen; i++) {
                stripped[matchIdx + i] = 1;
            }
            matchesFound++;
            currentIdx = isStart ? (matchIdx + patLen) : (matchIdx - 1);
        }
    };

    if (mode === "both" || mode === "start") {
        if (literal && typeof characters === "string") {
            const patStr = caseInsensitive ? characters.toLowerCase() : characters;
            scanLiteral(patStr, characters.length, true, maxScanStart, maxMatchesStart);
        } else {
            scanNonLiteral(true, maxScanStart, maxMatchesStart);
        }
    }

    if (mode === "both" || mode === "end") {
        if (literal && typeof characters === "string") {
            const patStr = caseInsensitive ? characters.toLowerCase() : characters;
            scanLiteral(patStr, characters.length, false, maxScanEnd, maxMatchesEnd);
        } else {
            scanNonLiteral(false, maxScanEnd, maxMatchesEnd);
        }
    }

    let result = "";
    for (let i = 0; i < len; i++) {
        if (stripped[i] === 0) {
            result += workStr[i];
        }
    }
    return (returnStringOnNull || result !== "") ? result : null;
}

export function toCanonicalString(
    val: any,
    { depth = 0, maxDepth = 50 }: { depth?: number; maxDepth?: number } = {}
): string {
    if (depth > maxDepth) {
        return "v:circular";
    }
    if (val === null) {
        return "v:null";
    }
    if (val === undefined) {
        return "v:undefined";
    }

    if (isValidDateObj(val)) {
        return `d:${val.getTime()}`;
    }

    if (isTypedArray(val)) {
        const s = val.toString();
        return `u:${val.constructor.name}:${s.length}:${s}`;
    }

    if (Array.isArray(val)) {
        const len = val.length;
        const parts = new Array(len);
        const nextOpt = { depth: depth + 1, maxDepth };
        for (let i = 0; i < len; i++) {
            parts[i] = toCanonicalString(val[i], nextOpt);
        }
        return `a:[${parts.join(KEY_PAIR_SEPARATOR)}]`;
    }

    if (isSet(val)) {
        const arr = Array.from(val);
        const len = arr.length;
        const parts = new Array(len);
        const nextOpt = { depth: depth + 1, maxDepth };
        for (let i = 0; i < len; i++) {
            parts[i] = toCanonicalString(arr[i], nextOpt);
        }
        parts.sort();
        return `set:[${parts.join(KEY_PAIR_SEPARATOR)}]`;
    }

    if (isMap(val)) {
        const keys = Array.from(val.keys());
        const len = keys.length;
        const parts = new Array(len);
        const nextOpt = { depth: depth + 1, maxDepth };
        for (let i = 0; i < len; i++) {
            const k = keys[i];
            parts[i] = `${toCanonicalString(k, nextOpt)}${KEY_SEPARATOR}${toCanonicalString(val.get(k), nextOpt)}`;
        }
        parts.sort();
        return `map:{${parts.join(KEY_PAIR_SEPARATOR)}}`;
    }

    if (typeof val === "object" && typeof val.toJSON === "function") {
        const jsonVal = val.toJSON();
        if (jsonVal !== val) {
            return `j:${toCanonicalString(jsonVal, { depth: depth + 1, maxDepth })}`;
        }
    }

    if (isRegExp(val)) {
        const s = val.toString();
        return `r:${s.length}:${s}`;
    }

    if (isPlainObj(val)) {
        const keys = Object.keys(val).sort();
        const len = keys.length;
        const parts = new Array(len);
        const nextOpt = { depth: depth + 1, maxDepth };
        for (let i = 0; i < len; i++) {
            const k = keys[i];
            parts[i] = `${toCanonicalString(k, nextOpt)}${KEY_SEPARATOR}${toCanonicalString(val[k], nextOpt)}`;
        }
        return `o:{${parts.join(KEY_PAIR_SEPARATOR)}}`;
    }

    if (typeof val === "function") {
        const s = val.toString();
        return `f:${s.length}:${s}`;
    }

    if (typeof val === "string") {
        return `s:${val.length}:${val}`;
    }

    if (typeof val === "symbol") {
        const s = val.toString();
        return `y:${s.length}:${s}`;
    }

    if (typeof val === "number" || typeof val === "boolean" || typeof val === "bigint") {
        return `${typeof val}:${val}`;
    }

    const s = String(val);
    return `${typeof val}:${s.length}:${s}`;
}

export interface ChangeCaseOptions {
    format: "camel" | "kebab" | "pascal" | "snake" | "title";
}

const CONTRACTION_REGEX = /(\p{L})['’](\p{L})/gu;
const WORDS_REGEX = new RegExp(
    [
        // Rule A: Acronym Plurals (e.g., 'KPIs', 'APIs')
        `\\p{Lu}+s(?!\\p{Ll})`,
        // Rule B: Acronym Transitions (e.g., 'HTTP' in 'HTTPClient')
        `\\p{Lu}+(?=\\p{Lu}\\p{Ll})`,
        // Rule C: TitleCase / PascalCase words (e.g., 'Client')
        `\\p{Lu}+\\p{Ll}*`,
        // Rule D: Pure lowercase words
        `\\p{Ll}+`,
        // Rule E: Numeric digit groups
        `\\p{N}+`,
        // Rule F: Non-cased global scripts (e.g., Kanji, Cyrillic variants, Arabic)
        `\\p{L}+`
    ].join("|"),
    "gu"
);

// JavaScript language-level reserved keywords to block prototype pollution attacks
const DANGEROUS_PROPERTIES = new Set(["__proto__", "proto", "constructor", "prototype"]);

/**
 * Fully robust, Unicode-aware string tokenization engine.
 * Guarded against prototype pollution, type errors, and NFD text formatting.
 */
export function toWords(str: any): string[] {
    if (str === null || str === undefined) return [];
    const primitiveStr = String(str);
    if (!primitiveStr) return [];

    const normalized = primitiveStr
        .normalize("NFC")
        .replace(CONTRACTION_REGEX, "$1$2");

    const matches = normalized.match(WORDS_REGEX) || [];

    const safeTokens: string[] = [];
    for (let i = 0; i < matches.length; i++) {
        const token = matches[i];
        if (!DANGEROUS_PROPERTIES.has(token)) {
            safeTokens.push(token);
        }
    }

    return safeTokens;
}

/**
 * High-performance, predictable case converter
 */
export function changeCase(str: any, options: ChangeCaseOptions): string {
    const words = toWords(str);
    const len = words.length;
    if (len === 0) return "";

    const { format } = options;

    if (format === "camel" || format === "pascal" || format === "title") {
        const joinChar = format === "title" ? " " : "";
        const formattedWords = new Array(len);
        for (let i = 0; i < len; i++) {
            const w = words[i];
            formattedWords[i] = (i === 0 && format === "camel")
                ? w.toLowerCase()
                : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        }
        return formattedWords.join(joinChar);
    }

    if (format === "kebab" || format === "snake") {
        const joinChar = format === "kebab" ? "-" : "_";
        const lowerWords = new Array(len);
        for (let i = 0; i < len; i++) {
            lowerWords[i] = words[i].toLowerCase();
        }
        return lowerWords.join(joinChar);
    }

    return String(str);
}


const BUFFER_REF = typeof globalThis !== "undefined" ? (globalThis as any).Buffer : undefined;
const HAS_BUFFER = typeof BUFFER_REF !== "undefined";

const HAS_NATIVE_HEX = typeof Uint8Array !== "undefined" && typeof (Uint8Array as any).fromHex === "function";
const HAS_NATIVE_BASE64 = typeof Uint8Array !== "undefined" && typeof (Uint8Array as any).fromBase64 === "function";
const MAX_BYTE_CHUNK_SIZE = 8192;
const HEX_TABLE: string[] = new Array(256);
for (let i = 0; i < 256; i++) {
    HEX_TABLE[i] = i.toString(16).padStart(2, "0");
}

const B64_TO_B64URL_MAP: Record<string, string> = { "+": "-", "/": "_", "=": "" };
const B64URL_TO_B64_MAP: Record<string, string> = { "-": "+", "_": "/" };
const B64_URL_ENCODE_REGEX = /[+/=]/g;
const B64_URL_DECODE_REGEX = /[-_]/g;
const STRICT_B64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const HEX_REGEX = /^[0-9a-fA-F]*$/;

// ============================================================================
// ENCODING FUNCTIONS
// ============================================================================

const DEFAULT_SAFE_JSON_REPLACER = createSafeJsonReplacer({ handleCircular: true });

/**
 * Serializes a value to a JSON string with BigInt support using createSafeJsonReplacer.
 */
export function encodeObjectToJson(value: unknown): string {
    const topUnboxed = unboxPrimitiveObj(value);
    if (typeof topUnboxed === "bigint") {
        return topUnboxed.toString();
    }
    try {
        return JSON.stringify(value, DEFAULT_SAFE_JSON_REPLACER);
    } catch {
        return String(value);
    }
}

/**
 * Encodes a JSON string into a UTF-8 Uint8Array byte array.
 */
export function encodeJsonToBytes(json: string): Uint8Array {
    if (typeof json !== "string") json = String(json);
    return TEXT_ENCODER.encode(json);
}

/**
 * Encodes a byte array or binary-coercible input into a standard Base64 string representation.
 * Uses 8192-byte chunking or native methods to prevent stack overflow errors.
 */
export function encodeBytesToBase64(bytes: unknown): string {
    const validBytes = toValidBinary(bytes);
    if (!validBytes) return "";

    if (HAS_NATIVE_BASE64 && typeof (Uint8Array as any).prototype.toBase64 === "function") {
        return (validBytes as any).toBase64();
    }
    if (HAS_BUFFER) {
        return BUFFER_REF.from(validBytes).toString("base64");
    }

    let bin = "";
    const len = validBytes.length;
    for (let i = 0; i < len; i += MAX_BYTE_CHUNK_SIZE) {
        const chunk = validBytes.subarray(i, i + MAX_BYTE_CHUNK_SIZE);
        bin += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(bin);
}

/**
 * Converts a standard Base64 string into a URL-safe Base64URL string.
 * Replaces '+' with '-', '/' with '_', and strips trailing '=' padding in a single pass.
 */
export function encodeBase64ToBase64URL(b64: string): string {
    if (typeof b64 !== "string") b64 = String(b64);
    return b64.replace(B64_URL_ENCODE_REGEX, (char) => B64_TO_B64URL_MAP[char]);
}

/**
 * Encodes a string into a hexadecimal string representation.
 */
export function encodeHex(str: string): string {
    if (typeof str !== "string") str = String(str);
    if (HAS_BUFFER) return BUFFER_REF.from(str, "utf-8").toString("hex");

    const bytes = encodeJsonToBytes(str);
    const len = bytes.length;
    let hex = "";
    for (let i = 0; i < len; i++) {
        hex += HEX_TABLE[bytes[i]];
    }
    return hex;
}

/**
 * Encodes a string into a Base64 string representation.
 */
export function encodeBase64(str: string): string {
    if (typeof str !== "string") str = String(str);
    const bytes = encodeJsonToBytes(str);
    return encodeBytesToBase64(bytes);
}

const ENCODERS: Record<StringEncoding, (str: string) => string> = {
    hex: encodeHex,
    base64: encodeBase64
};

/**
 * Encodes string to hex or base64 based on specified encoding option.
 */
export function encodeString(str: string | null | undefined, encoding: StringEncoding): string | null {
    if (str == null) return null;
    const encoder = ENCODERS[encoding];
    if (!encoder) {
        throw new Error(`Unsupported encoding: '${encoding}'. Supported encodings are 'hex' and 'base64'.`);
    }
    return encoder(String(str));
}

// ============================================================================
// DECODING FUNCTIONS
// ============================================================================

/**
 * Converts a Base64URL string back into standard Base64 format.
 * Restores URL-safe characters ('-' to '+', '_' to '/') in a single pass and appends '=' padding.
 */
export function decodeBase64URLToBase64(b64Url: string): string {
    if (typeof b64Url !== "string") b64Url = String(b64Url);
    const clean = b64Url.replace(B64_URL_DECODE_REGEX, (char) => B64URL_TO_B64_MAP[char]);
    const mod = clean.length % 4;
    return mod === 0 ? clean : clean.padEnd(clean.length + (4 - mod), "=");
}

/**
 * Decodes a standard Base64 string directly into a Uint8Array byte array.
 */
export function decodeBase64ToBytes(b64: string, strict: boolean = true): Uint8Array {
    if (typeof b64 !== "string") b64 = String(b64);

    if (b64 !== "") {
        if (b64.length % 4 !== 0 || !STRICT_B64_REGEX.test(b64)) {
            throw new Error("Invalid base64 encoding format");
        }
    }

    if (HAS_NATIVE_BASE64) {
        return (Uint8Array as any).fromBase64(b64, { strict });
    }
    if (HAS_BUFFER) {
        return new Uint8Array(BUFFER_REF.from(b64, "base64"));
    }
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}

/**
 * Decodes a Uint8Array byte array back into a parsed JSON object.
 */
export function decodeBytesToJson(bytes: Uint8Array): unknown {
    const jsonStr = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(jsonStr);
}

/**
 * Decodes a Hex-encoded string directly into a Uint8Array byte array.
 */
export function decodeHexToBytes(hex: string): Uint8Array {
    if (typeof hex !== "string") hex = String(hex);
    const cleanHex = hex.trim();

    if (cleanHex.length % 2 !== 0 || !HEX_REGEX.test(cleanHex)) {
        throw new Error("Invalid hex string format");
    }

    if (HAS_NATIVE_HEX) {
        return (Uint8Array as any).fromHex(cleanHex);
    }
    if (HAS_BUFFER) {
        const buf = BUFFER_REF.from(cleanHex, "hex");
        if (buf.length !== cleanHex.length / 2) {
            throw new Error("Invalid hex string format");
        }
        return new Uint8Array(buf);
    }

    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        const byte = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
        if (Number.isNaN(byte)) {
            throw new Error("Invalid hex string format");
        }
        bytes[i] = byte;
    }
    return bytes;
}

/**
 * Decodes a Hex-encoded string into a standard UTF-8 string.
 */
export function decodeHex(str: string, strict: boolean = true): string | null {
    try {
        const bytes = decodeHexToBytes(str);
        return new TextDecoder("utf-8", { fatal: strict }).decode(bytes);
    } catch (err) {
        if (strict) throw err;
        return null;
    }
}

/**
 * Decodes a Base64 or Base64URL-encoded string into a standard UTF-8 string.
 */
export function decodeBase64(str: string, strict: boolean = true): string | null {
    try {
        if (typeof str !== "string") str = String(str);
        const cleanStr = str.trim();
        const stdB64 = decodeBase64URLToBase64(cleanStr);
        const bytes = decodeBase64ToBytes(stdB64, strict);
        return new TextDecoder("utf-8", { fatal: strict }).decode(bytes);
    } catch (err) {
        if (strict) throw err;
        return null;
    }
}

const DECODERS: Record<StringEncoding, (str: string, strict: boolean) => string | null> = {
    hex: decodeHex,
    base64: decodeBase64
};

/**
 * Decodes hex or base64 encoded string back to standard UTF-8 string.
 */
export function decodeString(
    str: string | null | undefined,
    encoding: StringEncoding,
    options: { strict?: boolean } | boolean = {}
): string | null {
    if (str == null) return null;
    const decoder = DECODERS[encoding];
    if (!decoder) {
        throw new Error(`Unsupported encoding: '${encoding}'. Supported encodings are 'hex' and 'base64'.`);
    }
    const strict = typeof options === "boolean" ? options : (options.strict ?? true);
    return decoder(String(str), strict);
}






// ============================================================================
// REGEX UTILITIES & EXTRACTION HELPERS
// ============================================================================



// Lone surrogate check to prevent native RegExp.escape from throwing a TypeError on unpaired surrogates.
const LONE_SURROGATE_REGEX = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;

// Shared control & lone-surrogate pattern fragment (C0 controls, DEL, lone surrogates)
const BASE_CONTROL_PATTERN = "\\x00-\\x1F\\x7F\\u{D800}-\\u{DFFF}";

// TC39 mode: Syntax characters + C0 controls + DEL + lone/unpaired surrogates
const TC39_REGEX = new RegExp(`[${BASE_CONTROL_PATTERN}\\\\^$*+?.()|[\\]{}/#,=<>&!%:;@~'"\`-]`, "gu");

// nonAlphanumeric mode: C0 controls/surrogates + ASCII non-alphanumerics (< 0x80)
const NON_ALPHANUMERIC_ASCII_REGEX = new RegExp(`[${BASE_CONTROL_PATTERN}]|[\\x20-\\x2F\\x3A-\\x40\\x5B-\\x5E\\x5F\\x60\\x7B-\\x7E]`, "gu");

const _replaceRegexChar = (ch: string): string => {
    const code = ch.codePointAt(0)!;
    const isControl = code <= MAX_C0_CONTROL_CODE || code === ASCII_DEL_CODE;
    const isSurrogate = ch.length === 1 && code >= SURROGATE_MIN_CODE && code <= SURROGATE_MAX_CODE;

    if (isControl || isSurrogate) {
        const named = NAMED_CONTROL_ESCAPES[code];
        if (named) return named;
        const hex = code.toString(16);
        return isControl ? `\\x${hex.padStart(2, "0")}` : `\\u${hex.padStart(4, "0")}`;
    }
    return "\\" + ch;
};

export function escapeRegExp(
    val: unknown,
    options?: EscapeRegexOptions
): string {
    const cleanVal = unboxPrimitiveObj(val);
    if (cleanVal == null) return "";

    const str = isRegExp(cleanVal) ? cleanVal.source : (typeof cleanVal === "string" ? cleanVal : String(cleanVal));
    const mode = options?.mode ?? "tc39";

    if (mode === "tc39") {
        if (typeof (RegExp as any).escape === "function" && !LONE_SURROGATE_REGEX.test(str)) {
            return (RegExp as any).escape(str);
        }
        return str.replace(TC39_REGEX, _replaceRegexChar);
    }

    return str.replace(NON_ALPHANUMERIC_ASCII_REGEX, _replaceRegexChar);
}

export function toCleanRegExp(
    str: string | null | undefined,
    pattern: string | RegExp,
    options?: RegexEngineOptions
): { reg: RegExp; input: string } | null {
    if (str == null || pattern == null) return null;

    const input = typeof str === "string" ? str : String(str);
    const isGlobal = options?.global ?? false;

    try {
        if (!isRegExp(pattern)) {
            const patStr = typeof pattern === "string" ? pattern : String(pattern);
            let flags = isGlobal ? "g" : "";
            if (options?.asciiCaseInsensitive) flags += "i";

            if ((patStr.includes("\\p{") || patStr.includes("\\P{")) && !flags.includes("u") && !flags.includes("v")) {
                try {
                    return { reg: new RegExp(patStr, flags + "u"), input };
                } catch {
                    try {
                        return { reg: new RegExp(patStr, flags + "v"), input };
                    } catch {
                        // Fall through to standard compilation
                    }
                }
            }

            try {
                return { reg: new RegExp(patStr, flags), input };
            } catch {
                return null;
            }
        }

        let flags = pattern.flags.replace(/y/g, "");
        if (isGlobal) {
            if (!flags.includes("g")) flags += "g";
        } else {
            flags = flags.replace(/g/g, "");
        }

        if (options?.asciiCaseInsensitive !== undefined) {
            flags = options.asciiCaseInsensitive
                ? (flags.includes("i") ? flags : flags + "i")
                : flags.replace(/i/g, "");
        }

        const reg = new RegExp(pattern.source, flags);
        reg.lastIndex = 0;
        return { reg, input };
    } catch {
        return null;
    }
}

function _matchToRecord(match: RegExpMatchArray | RegExpExecArray): Record<string, string | null> {
    const result: Record<string, string | null> = Object.create(null);
    if (match.index !== undefined) {
        Object.defineProperty(result, "_index", {
            value: String(match.index),
            writable: true,
            enumerable: false,
            configurable: true
        });
    }
    Object.defineProperty(result, "_length", {
        value: match.length,
        writable: true,
        enumerable: false,
        configurable: true
    });
    for (let i = 0; i < match.length; i++) {
        result[String(i)] = match[i] !== undefined ? match[i] : null;
    }
    if (match.groups) {
        for (const key in match.groups) {
            const val = match.groups[key];
            result[key] = val !== undefined ? val : null;
        }
    }
    return result;
}

function _resolveGroupRecord(
    record: Record<string, string | null>,
    groupIndex: number | string
): string | null {
    if (typeof groupIndex === "string") return groupIndex in record ? record[groupIndex] : null;

    const num = Number(groupIndex);
    if (Number.isNaN(num)) return null;

    const index = Math.trunc(num);
    if (index >= 0) return record[String(index)] ?? null;

    const count = (record as any)._length ?? 0;
    const targetIndex = count + index;
    return targetIndex >= 1 ? (record[String(targetIndex)] ?? null) : null;
}

function _collectPatternCandidates<T>(
    input: string,
    pattern: string | RegExp,
    patternIndex: number,
    options: { literal?: boolean; mode?: EscapeRegexOptions["mode"]; asciiCaseInsensitive?: boolean } | undefined,
    createPayload: (match: RegExpExecArray, start: number, end: number) => T
): { start: number; end: number; patternIndex: number; payload: T }[] {
    const { literal = false, mode, asciiCaseInsensitive = false } = options ?? {};
    const escapedPat = literal ? escapeRegExp(pattern, { mode }) : pattern;
    const cleanObj = toCleanRegExp(input, escapedPat, { global: true, asciiCaseInsensitive });
    const reg = cleanObj?.reg ?? null;
    if (!reg) return [];

    const candidates: { start: number; end: number; patternIndex: number; payload: T }[] = [];
    reg.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = reg.exec(input)) !== null) {
        const start = match.index;
        const end = reg.lastIndex;
        const payload = createPayload(match, start, end);

        candidates.push({ start, end, patternIndex, payload });

        if (start === end) {
            if (start === input.length) break;
            const cp = input.codePointAt(start);
            const step = cp != null && cp > 0xffff ? 2 : 1;
            reg.lastIndex = start + step;
        }
    }
    return candidates;
}

function _selectLeftmostCandidates<T extends { start: number; end: number; patternIndex?: number; i?: number }>(candidates: T[]): T[] {
    if (candidates.length <= 1) return candidates;
    candidates.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        const idxA = a.patternIndex ?? a.i ?? 0;
        const idxB = b.patternIndex ?? b.i ?? 0;
        return idxA - idxB;
    });
    const selected: T[] = [];
    let lastPos = 0;
    const len = candidates.length;
    for (let i = 0; i < len; i++) {
        const c = candidates[i];
        if (c.start >= lastPos) {
            selected.push(c);
            lastPos = c.end;
        }
    }
    return selected;
}

function _matchManyCore<T>(
    str: string | null | undefined,
    patterns: (string | RegExp)[] | (string | RegExp),
    options: ExtractManyOptions | undefined,
    resolveSingle: (pat: string | RegExp) => T | null,
    resolvePayload: (res: Record<string, string | null>, start: number) => T
): (T | null)[] | null {
    const { overlapping = false, leftmost, ...engineOpts } = options ?? {};
    const isLeftmost = leftmost ?? true;

    if (overlapping && leftmost) {
        throw new InvalidArgumentError("Cannot specify both 'overlapping' and 'leftmost' as true.");
    }
    if (str == null || patterns == null) return null;
    const list = toValidArray(patterns);
    const len = list.length;
    if (len === 0) return [];

    if (overlapping) {
        const result = new Array<T | null>(len);
        for (let i = 0; i < len; i++) {
            result[i] = resolveSingle(list[i]);
        }
        return result;
    }

    type Candidate = { i: number; start: number; end: number; payload: T };
    const candidates: Candidate[] = [];

    for (let i = 0; i < len; i++) {
        const res = extractRegexEngine(str, list[i], { ...engineOpts, global: false });
        if (res && res[0] && res[0]._index != null) {
            const start = Number(res[0]._index);
            const matchLen = res[0]["0"]?.length ?? 0;
            candidates.push({
                i,
                start,
                end: start + matchLen,
                payload: resolvePayload(res[0], start)
            });
        }
    }

    const result = new Array<T | null>(len).fill(null);
    if (candidates.length === 0) return result;

    if (isLeftmost) {
        const selected = _selectLeftmostCandidates(candidates);
        for (let i = 0; i < selected.length; i++) {
            const c = selected[i];
            result[c.i] = c.payload;
        }
    } else {
        const accepted: Candidate[] = [];
        candidates.sort((a, b) => a.i - b.i);
        const candLen = candidates.length;
        for (let i = 0; i < candLen; i++) {
            const c = candidates[i];
            let overlaps = false;
            const accLen = accepted.length;
            for (let j = 0; j < accLen; j++) {
                const a = accepted[j];
                let isOverlapping = false;
                if (c.start === c.end && a.start === a.end) {
                    isOverlapping = c.start === a.start;
                } else if (a.start === a.end) {
                    isOverlapping = a.start >= c.start && a.start < c.end;
                } else if (c.start === c.end) {
                    isOverlapping = c.start >= a.start && c.start < a.end;
                } else {
                    isOverlapping = c.start < a.end && c.end > a.start;
                }
                if (isOverlapping) {
                    overlaps = true;
                    break;
                }
            }
            if (!overlaps) {
                accepted.push(c);
            }
        }
        const accLen = accepted.length;
        for (let i = 0; i < accLen; i++) {
            const c = accepted[i];
            result[c.i] = c.payload;
        }
    }

    return result;
}

export function extractRegexEngine(
    str: string | null | undefined,
    pattern: string | RegExp,
    options?: ExtractRegexEngineOptions
): Record<string, string | null>[] | null {
    const cleaned = toCleanRegExp(str, pattern, options);
    if (!cleaned) return null;

    if (!options?.global) {
        const match = cleaned.input.match(cleaned.reg);
        if (!match) return null;
        return [_matchToRecord(match)];
    }

    const matches = Array.from(cleaned.input.matchAll(cleaned.reg));
    if (matches.length === 0) return null;

    const result = new Array<Record<string, string | null>>(matches.length);
    for (let i = 0; i < matches.length; i++) {
        result[i] = _matchToRecord(matches[i]);
    }
    return result;
}

export function extractRegex(
    str: string | null | undefined,
    pattern: string | RegExp,
    options?: ExtractRegexEngineOptions
): string | null {
    const res = extractRegexEngine(str, pattern, options);
    return res ? _resolveGroupRecord(res[0], options?.groupIndex ?? 1) : null;
}

export function extractRegexAll(
    str: string | null | undefined,
    pattern: string | RegExp,
    options?: ExtractRegexEngineOptions
): (string | null)[] | null {
    const res = extractRegexEngine(str, pattern, { ...options, global: true });
    if (!res) return null;

    const groupIndex = options?.groupIndex ?? 0;
    const result = new Array<string | null>(res.length);
    for (let i = 0; i < res.length; i++) result[i] = _resolveGroupRecord(res[i], groupIndex);
    return result;
}

export function extractRegexGroups(
    str: string | null | undefined,
    pattern: string | RegExp,
    options?: ExtractManyOptions
): Record<string, string | null> | null {
    return extractRegexEngine(str, pattern, options)?.[0] ?? null;
}



export function extractRegexMany(
    str: string | null | undefined,
    patterns: (string | RegExp)[] | (string | RegExp),
    options?: ExtractManyOptions
): (string | null)[] | null {
    const groupIndex = options?.groupIndex ?? 0;
    return _matchManyCore(
        str,
        patterns,
        options,
        (pat) => extractRegex(str, pat, { ...options, groupIndex }),
        (res) => _resolveGroupRecord(res, groupIndex)
    );
}

export function findRegex(
    str: string | null | undefined,
    pattern: string | RegExp,
    options?: FindOptions
): number | null {
    if (str == null || pattern == null) return null;
    const { literal = false, asciiCaseInsensitive = false, mode } = options ?? {};

    if (literal) {
        const isReg = isRegExp(pattern);
        const patStr = escapeRegExp(pattern, { mode });
        let flags = asciiCaseInsensitive ? "i" : "";
        if (isReg) {
            for (const f of ["i", "u", "v", "m", "s"]) {
                if (pattern.flags.includes(f) && !flags.includes(f)) {
                    flags += f;
                }
            }
        }
        const reg = new RegExp(patStr, flags);
        const match = str.match(reg);
        if (!match || match.index == null) return null;
        return TEXT_ENCODER.encode(str.slice(0, match.index)).length;
    }

    const res = extractRegexEngine(str, pattern, { ...options, global: false });
    if (!res || !res[0] || res[0]._index == null) return null;
    const charIdx = Number(res[0]._index);
    return TEXT_ENCODER.encode(str.slice(0, charIdx)).length;
}

export function findManyRegex(
    str: string | null | undefined,
    patterns: (string | RegExp)[] | (string | RegExp),
    options?: FindManyOptions
): (number | null)[] | null {
    if (options?.literal) {
        if (str == null || patterns == null) return null;
        const list = toValidArray(patterns);
        const result = new Array<number | null>(list.length);
        for (let i = 0; i < list.length; i++) result[i] = findRegex(str, list[i], options);
        return result;
    }

    return _matchManyCore(
        str,
        patterns,
        options,
        (pat) => findRegex(str, pat, options),
        (_, start) => TEXT_ENCODER.encode(str!.slice(0, start)).length
    );
}

export function splitString(
    str: string | null | undefined,
    delimiter: string,
    options?: SplitOptions
): (string | null)[] | null {
    if (str == null || delimiter == null) return null;

    const {
        literal = true,
        inclusive = false,
        limit,
        exact = false,
        strict = false,
        mode,
        ...engineOpts
    } = options ?? {};

    const patStr = literal ? escapeRegExp(delimiter, { mode }) : delimiter;
    const cleanObj = toCleanRegExp(str, patStr, { ...engineOpts, global: true });
    if (!cleanObj) return null;
    const { reg: pattern } = cleanObj;

    pattern.lastIndex = 0;

    let parts: (string | null)[] = [];
    let lastIndex = 0;
    let matchCount = 0;
    const maxSplits = limit != null && limit >= 0 ? limit : Infinity;
    let match: RegExpExecArray | null;

    while (matchCount < maxSplits && (match = pattern.exec(str)) !== null) {
        const matchStart = match.index;
        const matchEnd = pattern.lastIndex;

        if (matchStart === matchEnd) {
            if (matchStart === str.length) break;

            const cp = str.codePointAt(matchStart);
            const step = cp != null && cp > 0xffff ? 2 : 1;

            if (matchStart > 0 && matchStart >= lastIndex) {
                parts.push(str.slice(lastIndex, matchStart));
                matchCount++;
                lastIndex = matchStart;
                if (matchCount >= maxSplits) break;
            }

            pattern.lastIndex = matchStart + step;
            continue;
        }

        parts.push(str.slice(lastIndex, inclusive ? matchEnd : matchStart));
        lastIndex = matchEnd;
        matchCount++;
    }

    parts.push(str.slice(lastIndex));

    if (limit == null || limit < 0) return parts;

    const targetCount = limit + 1;

    if (strict && parts.length < targetCount) {
        throw new InvalidArgumentError(
            `split exact error: expected string to split into at least ${targetCount} parts, but got ${parts.length}`
        );
    }

    if (exact) {
        while (parts.length < targetCount) {
            parts.push(null);
        }
    }

    return parts;
}

function _expandReplacementString(
    template: string,
    match: string,
    offset: number,
    fullStr: string,
    captures: (string | undefined)[],
    groups?: Record<string, string>
): string {
    return template.replace(/\$\$|\$([$'`&]|\d{1,2}|<[^>]+>)/g, (m, token?: string) => {
        if (m === "$$") return "$";
        if (!token) return m;
        if (token === "$") return "$";
        if (token === "&") return match;
        if (token === "`") return fullStr.slice(0, offset);
        if (token === "'") return fullStr.slice(offset + match.length);
        if (token.startsWith("<")) {
            if (groups === undefined) return m;
            const name = token.slice(1, -1);
            return groups[name] ?? "";
        }
        const groupIndex = Number(token);
        if (groupIndex > 0 && groupIndex <= captures.length) {
            return captures[groupIndex - 1] ?? "";
        }

        if (token.length === 2) {
            const firstDigit = Number(token[0]);
            if (firstDigit > 0 && firstDigit <= captures.length) {
                return (captures[firstDigit - 1] ?? "") + token[1];
            }
        }
        return m;
    });
}

export function replaceString(
    str: string | null | undefined,
    pattern: string | RegExp,
    replacement: string | ((match: string, ...args: any[]) => string),
    options?: ReplaceOptions
): string | null {
    if (str == null || pattern == null || replacement == null) return null;
    const input = typeof str === "string" ? str : String(str);

    const { literal = false, n, mode, ...engineOpts } = options ?? {};
    const rawN = n ?? (engineOpts?.global ? Infinity : 1);
    const effectiveN = isValidNumber(rawN, { allowNonFiniteNumbers: true, allowNaN: false }) ? Math.trunc(rawN) : 1;

    if (effectiveN === 0) return input;

    const pat = literal ? escapeRegExp(pattern, { mode }) : pattern;
    const cleanObj = toCleanRegExp(input, pat, { ...engineOpts, global: engineOpts?.global ?? (effectiveN !== 1) });
    if (!cleanObj) return input;
    const { reg } = cleanObj;

    const isFn = typeof replacement === "function";

    if (effectiveN === 1 || effectiveN < 0 || effectiveN === Infinity) {
        if (literal && !isFn) {
            const literalRepStr = String(replacement);
            return input.replace(reg, () => literalRepStr);
        }
        return input.replace(reg, replacement as any);
    }

    let count = 0;
    const repStr = isFn ? "" : String(replacement);

    return input.replace(reg, (...args: any[]) => {
        if (count++ >= effectiveN) return args[0];
        if (isFn) return String((replacement as Function)(...args));
        if (literal) return repStr;

        const len = args.length;
        const hasGroups = typeof args[len - 1] === "object" && args[len - 1] !== null;
        const groups = hasGroups ? args[len - 1] : undefined;
        const offset = (hasGroups ? args[len - 3] : args[len - 2]) as number;
        const captures = args.slice(1, hasGroups ? len - 3 : len - 2);

        return _expandReplacementString(repStr, args[0], offset, input, captures, groups);
    });
}

export function replaceManyString(
    str: string | null | undefined,
    patterns: (string | RegExp)[] | Record<string, string>,
    replaceWith?: (string | ((match: string, ...args: any[]) => string))[] | string | ((match: string, ...args: any[]) => string),
    options?: ReplaceManyOptions
): string | null {
    if (str == null || patterns == null) return null;
    const input = typeof str === "string" ? str : String(str);

    let patList: (string | RegExp)[];
    let repList: (string | ((match: string, ...args: any[]) => string))[] | null = null;
    let scalarRep: string | ((match: string, ...args: any[]) => string) | null = null;

    if (!Array.isArray(patterns) && typeof patterns === "object") {
        patList = Object.keys(patterns);
        repList = Object.values(patterns);
    } else if (Array.isArray(patterns)) {
        patList = patterns;
        if (Array.isArray(replaceWith)) {
            if (replaceWith.length === 1 && patList.length > 1) {
                scalarRep = replaceWith[0];
            } else if (replaceWith.length !== patList.length) {
                throw new InvalidArgumentError(
                    `replace_many length mismatch: expected ${patList.length} replacement strings, got ${replaceWith.length}`
                );
            } else {
                repList = replaceWith;
            }
        } else if (replaceWith != null) {
            scalarRep = replaceWith;
        } else {
            return input;
        }
    } else {
        return input;
    }

    const len = patList.length;
    if (len === 0) return input;

    type Candidate = { start: number; end: number; patternIndex: number; payload: string };
    const candidates: Candidate[] = [];

    for (let i = 0; i < len; i++) {
        const pat = patList[i];
        const rawRep = repList ? repList[i] : scalarRep;
        if (pat == null || rawRep == null) continue;

        const items = _collectPatternCandidates(input, pat, i, options, (match, start) => {
            const captures: (string | undefined)[] = Array.prototype.slice.call(match, 1);
            if (typeof rawRep === "function") {
                const fnArgs: any[] = [match[0], ...captures, start, input];
                if (match.groups !== undefined) fnArgs.push(match.groups);
                return String((rawRep as Function)(...fnArgs));
            }
            return options?.literal
                ? String(rawRep)
                : _expandReplacementString(String(rawRep), match[0], start, input, captures, match.groups);
        });

        for (let j = 0; j < items.length; j++) candidates.push(items[j]);
    }

    if (candidates.length === 0) return input;

    const selected = _selectLeftmostCandidates(candidates);
    let result = "";
    let lastIndex = 0;
    const selLen = selected.length;

    for (let i = 0; i < selLen; i++) {
        const c = selected[i];
        result += input.slice(lastIndex, c.start) + c.payload;
        lastIndex = c.end;
    }

    result += input.slice(lastIndex);
    return result;
}