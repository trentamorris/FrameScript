/** @internalfile */
import { isPlainObj, isRegExp, isValidDateObj, isSet, isMap, unboxPrimitiveObj } from "./object";
import { isTypedArray, toValidArray } from "./array";
import { createSafeJsonReplacer } from "./json";
import { toValidBinary } from "./binary";
import { KEY_SEPARATOR, KEY_PAIR_SEPARATOR } from "../constants";
import { InvalidArgumentError } from "../exceptions";
import type { StringEncoding, EscapeRegexOptions, ExtractManyOptions, ExtractRegexEngineOptions } from "../types";


export function isBlankString(v: unknown): v is string {
    const unwrapped = unboxPrimitiveObj(v);
    if (typeof unwrapped === "string") {
        return unwrapped.trim().length === 0;
    }
    return false;
}

const CONTROL_ESCAPES: Record<string, string> = {
    "\0": "\\0",
    "\t": "\\t",
    "\n": "\\n",
    "\v": "\\v",
    "\f": "\\f",
    "\r": "\\r",
};

// Escapes all TC39 syntax characters & ASCII control characters cleanly
const TC39_ESCAPE_CHARS_REGEX = /[\\^$*+?.()|[\]{}/#,=<>&!%:;@~'"\`\0\t\n\v\f\r\-]/g;

// Escapes non-alphanumeric ASCII characters without breaking Unicode ('u' / 'v' flag) strings
const NON_ALPHANUMERIC_ASCII_REGEX = /[^A-Za-z0-9\u0080-\uFFFF]/g;

export function escapeRegExp(
    val: unknown,
    options?: EscapeRegexOptions
): string {
    const cleanVal = unboxPrimitiveObj(val);
    if (cleanVal == null) return "";

    const str = typeof cleanVal === "string" ? cleanVal : String(cleanVal);
    const mode = options?.mode ?? "tc39";

    if (mode === "tc39") {
        if (typeof (RegExp as any).escape === "function") {
            return (RegExp as any).escape(str);
        }
        return str.replace(TC39_ESCAPE_CHARS_REGEX, (ch) => CONTROL_ESCAPES[ch] ?? ("\\" + ch));
    }

    return str.replace(NON_ALPHANUMERIC_ASCII_REGEX, "\\$&");
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

const TEXT_ENCODER = new TextEncoder();

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

export function toCleanRegExp(
    str: string | null | undefined,
    pattern: string | RegExp,
    options?: Omit<ExtractRegexEngineOptions, "groupIndex">
): { reg: RegExp; input: string } | null {
    if (str == null || pattern == null) return null;

    const input = typeof str === "string" ? str : String(str);
    const isGlobal = options?.global ?? false;

    try {
        if (!isRegExp(pattern)) {
            let flags = isGlobal ? "g" : "";
            if (options?.asciiCaseInsensitive) flags += "i";
            return { reg: new RegExp(String(pattern), flags), input };
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
    const result: Record<string, string | null> = {};
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

    let count = 0;
    while (String(count) in record) count++;
    const targetIndex = count + index;
    return targetIndex >= 0 ? (record[String(targetIndex)] ?? null) : null;
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
    const groupIndex = options?.groupIndex ?? 1;
    const res = extractRegexEngine(str, pattern, options);
    return res ? _resolveGroupRecord(res[0], groupIndex) : null;
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

export function extractRegexMany(
    str: string | null | undefined,
    patterns: (string | RegExp)[] | (string | RegExp),
    options?: ExtractManyOptions
): (string | null)[] | null {
    const { groupIndex = 0, overlapping = false, leftmost = false, ...engineOpts } = options ?? {};

    if (overlapping && leftmost) {
        throw new InvalidArgumentError("Cannot specify both 'overlapping' and 'leftmost' as true in extract_many.");
    }
    if (str == null || patterns == null) return null;
    const list = toValidArray(patterns);
    const len = list.length;
    if (len === 0) return [];

    const fullOpts = { groupIndex, ...engineOpts };

    if (overlapping) {
        const result = new Array<string | null>(len);
        for (let i = 0; i < len; i++) {
            result[i] = extractRegex(str, list[i], fullOpts);
        }
        return result;
    }

    type Candidate = { i: number; start: number; end: number; val: string | null };
    const candidates: Candidate[] = [];

    for (let i = 0; i < len; i++) {
        const cleaned = toCleanRegExp(str, list[i], { ...engineOpts, global: false });
        if (!cleaned) continue;
        const match = cleaned.input.match(cleaned.reg);
        if (match?.index !== undefined) {
            candidates.push({
                i,
                start: match.index,
                end: match.index + match[0].length,
                val: _resolveGroupRecord(_matchToRecord(match), groupIndex)
            });
        }
    }

    const result = new Array<string | null>(len).fill(null);
    if (candidates.length === 0) return result;

    candidates.sort((a, b) => a.start !== b.start ? a.start - b.start : a.i - b.i);

    let lastPos = 0;
    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        if (c.start >= lastPos) {
            result[c.i] = c.val;
            lastPos = c.end;
        }
    }

    return result;
}

export function extractRegexGroups(
    str: string | null | undefined,
    pattern: string | RegExp,
    options?: ExtractManyOptions
): Record<string, string | null> | null {
    return extractRegexEngine(str, pattern, options)?.[0] ?? null;
}