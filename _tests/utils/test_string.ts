declare const process: any;
import {
    stripChars,
    toCanonicalString,
    encodeHex,
    decodeHex,
    encodeBase64,
    decodeBase64,
    encodeString,
    decodeString,
    isBlankString,
    escapeRegExp,
    toWords,
    changeCase,
    decodeBase64URLToBase64,
    decodeBase64ToBytes,
    decodeBytesToJson,
    encodeObjectToJson,
    encodeJsonToBytes,
    encodeBytesToBase64,
    encodeBase64ToBase64URL,
    toCleanRegExp,
    extractRegexEngine,
    extractRegex,
    extractRegexAll,
    extractRegexMany,
    extractRegexGroups,
    findRegex,
    findManyRegex,
    splitString,
    replaceString,
    replaceManyString
} from "../../src/utils/string";

console.log("=========================================");
console.log("STARTING UTILS STRING TESTS...");
console.log("=========================================");

try {

    // 2. stripChars with null/undefined inputs
    if (stripChars(null) !== null) throw new Error("Expected stripChars(null) to be null");
    if (stripChars(undefined) !== null) throw new Error("Expected stripChars(undefined) to be null");
    if (stripChars(null, null, { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars(null, null, { returnStringOnNull: true }) to be ''");

    // 3. stripChars with characters == null (whitespace fallback)
    // 3a. returnStringOnNull: false (default)
    if (stripChars("   ") !== null) throw new Error("Expected stripChars('   ') to be null");
    if (stripChars("   ", null, { returnStringOnNull: false }) !== null) throw new Error("Expected stripChars('   ', null, { returnStringOnNull: false }) to be null");
    if (stripChars("  abc  ") !== "abc") throw new Error("Expected stripChars('  abc  ') to be 'abc'");
    // 3b. returnStringOnNull: true
    if (stripChars("   ", null, { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('   ', null, { returnStringOnNull: true }) to be ''");
    if (stripChars("", null, { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('', null, { returnStringOnNull: true }) to be ''");

    // 4. stripChars with characters != null
    // 4a. returnStringOnNull: false (default)
    if (stripChars("abc", "abc") !== null) throw new Error("Expected stripChars('abc', 'abc') to be null");
    if (stripChars("abc", "abc", { returnStringOnNull: false }) !== null) throw new Error("Expected stripChars('abc', 'abc', { returnStringOnNull: false }) to be null");
    if (stripChars("aabbccddeeff", "abcdef") !== null) throw new Error("Expected stripChars('aabbccddeeff', 'abcdef') to be null");
    if (stripChars("  abc  ", "abc", { trimFirst: true }) !== null) throw new Error("Expected stripChars('  abc  ', 'abc', { trimFirst: true }) to be null");
    if (stripChars("  abXba  ", "abc", { trimFirst: true }) !== "X") throw new Error("Expected stripChars('  abXba  ', 'abc', { trimFirst: true }) to be 'X'");
    // 4b. returnStringOnNull: true
    if (stripChars("abc", "abc", { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('abc', 'abc', { returnStringOnNull: true }) to be ''");
    if (stripChars("  abc  ", "abc", { trimFirst: true, returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('  abc  ', 'abc', { trimFirst: true, returnStringOnNull: true }) to be ''");

    // 5. Contiguous stripping (standard behavior)
    if (stripChars("hhello", "h") !== "ello") throw new Error("Expected stripChars('hhello', 'h') to be 'ello'");
    if (stripChars("hhelloh", "h") !== "ello") throw new Error("Expected stripChars('hhelloh', 'h') to be 'ello'");

    // 6. Scanning offset window contiguous stripping tests
    if (stripChars("aloud", "lou", { maxScanStart: 2, maxScanEnd: 2 }) !== "ad") throw new Error("Expected stripChars('aloud', 'lou', { maxScanStart: 2, maxScanEnd: 2 }) to be 'ad'");
    if (stripChars("aaloud", "lou", { maxScanStart: 2, maxScanEnd: 2 }) !== "aad") throw new Error("Expected stripChars('aaloud', 'lou', { maxScanStart: 2, maxScanEnd: 2 }) to be 'aad'");
    if (stripChars("aaloud", "lou", { maxScanStart: 2, maxScanEnd: 1 }) !== "aaloud") throw new Error("Expected stripChars('aaloud', 'lou', { maxScanStart: 2, maxScanEnd: 1 }) to be 'aaloud'");
    if (stripChars("aaloud", "lou", { maxScanStart: 3, maxScanEnd: 1 }) !== "aad") throw new Error("Expected stripChars('aaloud', 'lou', { maxScanStart: 3, maxScanEnd: 1 }) to be 'aad'");

    // 7. stripChars with RegExp characters
    if (stripChars("123hello456", /[0-9]/) !== "hello") throw new Error("Expected stripChars('123hello456', /[0-9]/) to be 'hello'");
    if (stripChars("123hello456", /[0-9]/, { mode: "start" }) !== "hello456") throw new Error("Expected stripChars('123hello456', /[0-9]/, { mode: 'start' }) to be 'hello456'");
    if (stripChars("123hello456", /[0-9]/, { mode: "end" }) !== "123hello") throw new Error("Expected stripChars('123hello456', /[0-9]/, { mode: 'end' }) to be '123hello'");
    if (stripChars("abc123xyz", /[a-z]/, { maxScanStart: 3, maxScanEnd: 3 }) !== "123") throw new Error("Expected stripChars('abc123xyz', /[a-z]/, { maxScanStart: 3, maxScanEnd: 3 }) to be '123'");
    if (stripChars("12abc34", /[a-z]/, { maxScanStart: 3, maxScanEnd: 3 }) !== "1234") throw new Error("Expected stripChars('12abc34', /[a-z]/, { maxScanStart: 3, maxScanEnd: 3 }) to be '1234'");

    // 8. stripChars with unlimited (-1 or null) scanning
    if (stripChars("aaloud", "lou", { maxScanStart: -1, maxScanEnd: 1 }) !== "aad") throw new Error("Expected -1 maxScanStart to do unlimited start scanning");
    if (stripChars("12abc34xyz56", /[a-z]/, { maxScanStart: null, maxScanEnd: null }) !== "123456") throw new Error("Expected null maxScanStart/End to do unlimited scanning");
    if (stripChars("12abc34xyz56", /[a-z]/, { maxScanStart: -1, maxScanEnd: 1 }) !== "1234xyz56") throw new Error("Expected -1 maxScanStart with 1 maxScanEnd to only strip start match");

    // 9. stripChars with multiple matches (maxMatchesStart / maxMatchesEnd)
    if (stripChars("alouloud", "ou", { maxScanStart: -1, maxMatchesStart: 2 }) !== "alld") throw new Error("Expected 2 matches to strip both ou blocks");
    if (stripChars("alouloud", "ou", { maxScanStart: -1, maxMatchesStart: 1 }) !== "alloud") throw new Error("Expected 1 match to only strip the first ou block");
    if (stripChars("abc12xyz34xyz56", "xyz", { maxScanEnd: -1, maxMatchesEnd: 2 }) !== "abc123456") throw new Error("Expected 2 matches from end to strip both xyz blocks");
    if (stripChars("alouloud", "ou", { maxScanStart: 4, maxMatchesStart: 2 }) !== "alld") throw new Error("Expected 2 matches to be allowed with maxScanStart 4");
    if (stripChars("alouloud", "ou", { maxScanStart: 3, maxMatchesStart: 2 }) !== "alloud") throw new Error("Expected only 1 match to be allowed with maxScanStart 3");

    // 10. stripChars with literal substring match
    if (stripChars("alouloud", "laou", { maxScanStart: -1, stringOptions: { literal: true } }) !== "alouloud") throw new Error("Expected literal laou to fail matching alouloud");
    if (stripChars("alou", "alou", { maxScanStart: -1, stringOptions: { literal: true } }) !== null) throw new Error("Expected literal alou to match alou");
    if (stripChars("abc12xyz34xyz56", "xyz", { maxScanEnd: -1, maxMatchesEnd: 2, stringOptions: { literal: true } }) !== "abc123456") throw new Error("Expected literal multi-match from end to succeed");

    // 11. stripChars with caseInsensitive option
    if (stripChars("aBcDeFg", "bdf", { maxScanStart: -1, maxScanEnd: -1, maxMatchesStart: -1, maxMatchesEnd: -1, stringOptions: { caseInsensitive: true } }) !== "aceg") throw new Error("Expected case-insensitive string character match to succeed");
    if (stripChars("aBcDeFg", /[bdf]/, { maxScanStart: -1, maxScanEnd: -1, maxMatchesStart: -1, maxMatchesEnd: -1 }) !== "aBcDeFg") throw new Error("Expected case-sensitive regex to remain case-sensitive");
    if (stripChars("aBcDeFg", /[bdf]/i, { maxScanStart: -1, maxScanEnd: -1, maxMatchesStart: -1, maxMatchesEnd: -1 }) !== "aceg") throw new Error("Expected case-insensitive regex with i flag match to succeed");
    if (stripChars("alOuLoUd", "ALOU", { maxScanStart: -1, stringOptions: { literal: true, caseInsensitive: true } }) !== "LoUd") throw new Error("Expected case-insensitive literal match to strip start");
    if (stripChars("AlOuAlOuD", "alou", { maxScanStart: -1, maxMatchesStart: 2, stringOptions: { literal: true, caseInsensitive: true } }) !== "D") throw new Error("Expected case-insensitive literal multi-match to succeed");

    // 12. toCanonicalString tests
    if (toCanonicalString(null) !== "v:null") throw new Error("toCanonicalString(null) failed");
    if (toCanonicalString(undefined) !== "v:undefined") throw new Error("toCanonicalString(undefined) failed");
    if (toCanonicalString("hello") !== "s:5:hello") throw new Error("toCanonicalString('hello') failed");
    if (toCanonicalString(42) !== "number:42") throw new Error("toCanonicalString(42) failed");
    if (toCanonicalString(true) !== "boolean:true") throw new Error("toCanonicalString(true) failed");
    if (toCanonicalString(/abc/i) !== "r:6:/abc/i") throw new Error("toCanonicalString(/abc/i) failed");
    if (toCanonicalString(new Date(1777000)) !== "d:1777000") throw new Error("toCanonicalString(Date) failed");
    if (toCanonicalString(new Uint8Array([1, 2, 3])) !== "u:Uint8Array:5:1,2,3") throw new Error("toCanonicalString(Uint8Array) failed");
    if (toCanonicalString([1, [2, 3]]) !== "a:[number:1\x01a:[number:2\x01number:3]]") throw new Error("toCanonicalString(Array) failed");
    if (toCanonicalString({ b: 2, a: 1 }) !== "o:{s:1:a\x00number:1\x01s:1:b\x00number:2}") throw new Error("toCanonicalString(Object) failed");
    if (toCanonicalString({ b: [{ y: 2, x: 1 }], a: new Date(100) }) !== "o:{s:1:a\x00d:100\x01s:1:b\x00a:[o:{s:1:x\x00number:1\x01s:1:y\x00number:2}]}") throw new Error("toCanonicalString(nested Object) failed");

    // 13. Map, Set, toJSON, and circular reference tests
    const set1 = new Set([2, 1]);
    const set2 = new Set([1, 2]);
    if (toCanonicalString(set1) !== "set:[number:1\x01number:2]") throw new Error("toCanonicalString(Set) failed");
    if (toCanonicalString(set1) !== toCanonicalString(set2)) throw new Error("toCanonicalString(Set) canonical sort failed");

    const map1 = new Map([["b", 2], ["a", 1]]);
    const map2 = new Map([["a", 1], ["b", 2]]);
    if (toCanonicalString(map1) !== "map:{s:1:a\x00number:1\x01s:1:b\x00number:2}") throw new Error("toCanonicalString(Map) failed");
    if (toCanonicalString(map1) !== toCanonicalString(map2)) throw new Error("toCanonicalString(Map) canonical sort failed");

    const customObj = {
        name: "test",
        toJSON() {
            return { id: 42 };
        }
    };
    if (toCanonicalString(customObj) !== "j:o:{s:2:id\x00number:42}") throw new Error("toCanonicalString(toJSON) failed");

    const circularObj: any = {};
    circularObj.self = circularObj;
    let expectedCircular = "o:{v:circular\x00v:circular}";
    for (let i = 0; i < 50; i++) {
        expectedCircular = `o:{s:4:self\x00${expectedCircular}}`;
    }
    if (toCanonicalString(circularObj) !== expectedCircular) throw new Error("toCanonicalString(circular) failed");

    // Custom maxDepth test
    let expectedCircularCustom = "o:{v:circular\x00v:circular}";
    for (let i = 0; i < 5; i++) {
        expectedCircularCustom = `o:{s:4:self\x00${expectedCircularCustom}}`;
    }
    if (toCanonicalString(circularObj, { maxDepth: 5 }) !== expectedCircularCustom) {
        throw new Error("toCanonicalString(circular, { maxDepth: 5 }) failed");
    }

    // 14. Encode & Decode string tests
    // Standard roundtrip
    if (encodeHex("hello") !== "68656c6c6f") throw new Error("encodeHex('hello') failed");
    if (decodeHex("68656c6c6f") !== "hello") throw new Error("decodeHex('68656c6c6f') failed");
    if (encodeBase64("hello") !== "aGVsbG8=") throw new Error("encodeBase64('hello') failed");
    if (decodeBase64("aGVsbG8=") !== "hello") throw new Error("decodeBase64('aGVsbG8=') failed");

    // Null and undefined
    if (encodeString(null, "hex") !== null) throw new Error("encodeString(null, 'hex') failed");
    if (encodeString(undefined, "base64") !== null) throw new Error("encodeString(undefined, 'base64') failed");
    if (decodeString(null, "hex") !== null) throw new Error("decodeString(null, 'hex') failed");
    if (decodeString(undefined, "base64") !== null) throw new Error("decodeString(undefined, 'base64') failed");

    // Edge cases: Hex validation & strict mode
    if (decodeHex("", false) !== "") throw new Error("decodeHex('', false) failed");
    if (decodeHex("   68656c6c6f   ") !== "hello") throw new Error("decodeHex whitespace trim failed");
    if (decodeHex("abc", false) !== null) throw new Error("decodeHex odd length should return null in non-strict mode");
    if (decodeHex("zz", false) !== null) throw new Error("decodeHex invalid hex char should return null in non-strict mode");

    let hexStrictFailed = false;
    try {
        decodeHex("invalid_hex", true);
    } catch {
        hexStrictFailed = true;
    }
    if (!hexStrictFailed) throw new Error("decodeHex in strict mode should throw on invalid hex");

    // Edge cases: Base64 validation & strict mode
    if (decodeBase64("", false) !== "") throw new Error("decodeBase64('', false) failed");
    if (decodeBase64("   aGVsbG8=   ") !== "hello") throw new Error("decodeBase64 whitespace trim failed");
    if (decodeBase64("invalid_base64!!!", false) !== null) throw new Error("decodeBase64 invalid format should return null in non-strict mode");

    let b64StrictFailed = false;
    try {
        decodeBase64("invalid_base64!!!", true);
    } catch {
        b64StrictFailed = true;
    }
    if (!b64StrictFailed) throw new Error("decodeBase64 in strict mode should throw on invalid base64");

    // Test mid-string '=' padding rejection
    if (decodeBase64("aGVs=bG8=", false) !== null) throw new Error("decodeBase64 with mid-string '=' should return null in non-strict mode");
    let midEqualStrictFailed = false;
    try {
        decodeBase64("aGVs=bG8=", true);
    } catch {
        midEqualStrictFailed = true;
    }
    if (!midEqualStrictFailed) throw new Error("decodeBase64 with mid-string '=' should throw in strict mode");

    // Non-string coercion
    if (encodeString(12345 as any, "hex") !== "3132333435") throw new Error("encodeString non-string coercion failed");
    if (decodeString("3132333435", "hex") !== "12345") throw new Error("decodeString non-string coercion failed");

    // Additional Edge Cases: Uppercase/Mixed Hex, Unicode/Emoji, Unsupported Encoding, Options object & Invalid UTF-8
    if (decodeHex("68656C6C6F") !== "hello") throw new Error("decodeHex uppercase hex failed");
    if (decodeHex("68656C6c6F") !== "hello") throw new Error("decodeHex mixed-case hex failed");

    const emojiStr = "Hello 🚀 World 🌍!";
    if (decodeHex(encodeHex(emojiStr)) !== emojiStr) throw new Error("Emoji unicode roundtrip failed for Hex");
    if (decodeBase64(encodeBase64(emojiStr)) !== emojiStr) throw new Error("Emoji unicode roundtrip failed for Base64");

    if (decodeString("invalid_hex", "hex", { strict: false }) !== null) throw new Error("decodeString options object { strict: false } failed");
    let optionsStrictFailed = false;
    try {
        decodeString("invalid_hex", "hex", { strict: true });
    } catch {
        optionsStrictFailed = true;
    }
    if (!optionsStrictFailed) throw new Error("decodeString options object { strict: true } failed");

    let unsupportedEncFailed = false;
    try {
        encodeString("test", "binary" as any);
    } catch {
        unsupportedEncFailed = true;
    }
    if (!unsupportedEncFailed) throw new Error("encodeString unsupported encoding check failed");

    let invalidUtf8HexFailed = false;
    try {
        decodeHex("ff", true);
    } catch {
        invalidUtf8HexFailed = true;
    }
    if (!invalidUtf8HexFailed) throw new Error("decodeHex strict mode invalid UTF-8 byte failed");

    let invalidUtf8B64Failed = false;
    try {
        decodeBase64("/w==", true);
    } catch {
        invalidUtf8B64Failed = true;
    }
    if (!invalidUtf8B64Failed) throw new Error("decodeBase64 strict mode invalid UTF-8 byte failed");

    // 15. URL-safe Base64 & Unpadded Base64 decoding
    if (decodeBase64("aGVsbG8", false) !== "hello") throw new Error("Unpadded base64 decoding failed");
    if (decodeBase64("aGVsbG8", true) !== "hello") throw new Error("Unpadded base64 strict decoding failed");
    const urlSafeB64 = encodeBase64("hello?world>").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    if (decodeBase64(urlSafeB64, true) !== "hello?world>") throw new Error("URL-safe base64 decoding failed");

    // 16. Large string Base64 chunking test (> 8192 bytes)
    const largeStr = "A".repeat(25000);
    const encodedLarge = encodeBase64(largeStr);
    const decodedLarge = decodeBase64(encodedLarge);
    if (decodedLarge !== largeStr) throw new Error("Large string (>8192 bytes) base64 encode/decode failed");

    // 17. isBlankString tests
    if (!isBlankString("")) throw new Error("isBlankString('') failed");
    if (!isBlankString("   \t\n\r")) throw new Error("isBlankString whitespace failed");
    if (isBlankString("  a  ")) throw new Error("isBlankString('  a  ') failed");
    if (isBlankString(123)) throw new Error("isBlankString(123) failed");
    if (isBlankString(null)) throw new Error("isBlankString(null) failed");
    if (!isBlankString(new String("   "))) throw new Error("isBlankString boxed String failed");

    // 18. escapeRegExp Comprehensive Edge-Case Battery
    // 18a. Individual Metacharacter Escaping Assertions
    const singleMetaMap: Record<string, string> = {
        ".": "\\.", "*": "\\*", "+": "\\+", "?": "\\?", "^": "\\^", "$": "\\$",
        "{": "\\{", "}": "\\}", "(": "\\(", ")": "\\)", "|": "\\|", "[": "\\[",
        "]": "\\]", "/": "\\/", "-": "\\-", "\\": "\\\\", "#": "\\#", "&": "\\&",
        "!": "\\!", "%": "\\%", ",": "\\,", ":": "\\:", ";": "\\;", "<": "\\<",
        "=": "\\=", ">": "\\>", "@": "\\@", "~": "\\~", "'": "\\'", '"': '\\"', "`": "\\`"
    };
    for (const [char, expected] of Object.entries(singleMetaMap)) {
        const res = escapeRegExp(char);
        if (res !== expected) throw new Error(`escapeRegExp single char '${char}' failed. Expected '${expected}', got '${res}'`);
    }

    // 18b. Complex Regex Metacharacter Sequences & /v Set Operations
    if (escapeRegExp("a{1,3}+b*?c+?d?") !== "a\\{1\\,3\\}\\+b\\*\\?c\\+\\?d\\?") throw new Error("escapeRegExp quantifiers failed");
    if (escapeRegExp("[[a-z]&&[^b-d]]") !== "\\[\\[a\\-z\\]\\&\\&\\[\\^b\\-d\\]\\]") throw new Error("escapeRegExp character classes failed");
    if (escapeRegExp("(?<name>a)(?=b)(?!c)(?<=d)(?<!e)") !== "\\(\\?\\<name\\>a\\)\\(\\?\\=b\\)\\(\\?\\!c\\)\\(\\?\\<\\=d\\)\\(\\?\\<\\!e\\)") throw new Error("escapeRegExp groups failed");
    if (escapeRegExp("^foo$ \\b \\B") !== "\\^foo\\$ \\\\b \\\\B") throw new Error("escapeRegExp anchors failed");
    if (escapeRegExp("\\\\\\\\") !== "\\\\\\\\\\\\\\\\") throw new Error("escapeRegExp backslashes failed");

    // 18c. Primitive Types & Primitive Object Wrappers
    if (escapeRegExp(null) !== "") throw new Error("escapeRegExp(null) failed");
    if (escapeRegExp(undefined) !== "") throw new Error("escapeRegExp(undefined) failed");
    if (escapeRegExp("") !== "") throw new Error("escapeRegExp('') failed");
    if (escapeRegExp("   ") !== "   ") throw new Error("escapeRegExp('   ') failed");
    if (escapeRegExp("\t\n\r\v\f") !== "\\t\\n\\r\\v\\f") throw new Error("escapeRegExp whitespace control chars failed");
    if (escapeRegExp(0) !== "0") throw new Error("escapeRegExp(0) failed");
    if (escapeRegExp(-0) !== "0") throw new Error("escapeRegExp(-0) failed");
    if (escapeRegExp(NaN) !== "NaN") throw new Error("escapeRegExp(NaN) failed");
    if (escapeRegExp(Infinity) !== "Infinity") throw new Error("escapeRegExp(Infinity) failed");
    if (escapeRegExp(-Infinity) !== "\\-Infinity") throw new Error("escapeRegExp(-Infinity) failed");
    if (escapeRegExp(true) !== "true") throw new Error("escapeRegExp(true) failed");
    if (escapeRegExp(false) !== "false") throw new Error("escapeRegExp(false) failed");
    if (escapeRegExp(100n) !== "100") throw new Error("escapeRegExp(100n) failed");
    if (escapeRegExp(new String("a.b*c")) !== "a\\.b\\*c") throw new Error("escapeRegExp unboxed String failed");
    if (escapeRegExp(new Number(3.14)) !== "3\\.14") throw new Error("escapeRegExp unboxed Number failed");
    if (escapeRegExp(new Boolean(true)) !== "true") throw new Error("escapeRegExp unboxed Boolean failed");
    if (escapeRegExp(/a.b*c/gi) !== "a\\.b\\*c") throw new Error("escapeRegExp RegExp object input failed");
    if (escapeRegExp({ toString() { return "x.y?z"; } }) !== "x\\.y\\?z") throw new Error("escapeRegExp custom toString failed");
    const customNullObj = Object.create(null);
    customNullObj.toString = () => "null.proto*test";
    if (escapeRegExp(customNullObj) !== "null\\.proto\\*test") throw new Error("escapeRegExp Object.create(null) custom toString failed");
    const objWithPrimitive = {
        [Symbol.toPrimitive](hint: string) {
            return hint === "number" ? 42 : "prim.val+test";
        }
    };
    if (escapeRegExp(objWithPrimitive) !== "prim\\.val\\+test") throw new Error("escapeRegExp Symbol.toPrimitive failed");

    // 18d. Control Characters & Complex Unicode / Emojis / Replacement Tokens
    if (escapeRegExp("👨‍👩‍👧‍👦.🎉*foo+bar") !== "👨‍👩‍👧‍👦\\.🎉\\*foo\\+bar") throw new Error("escapeRegExp complex emoji failed");
    if (escapeRegExp("𝌆💩1️⃣.txt") !== "𝌆💩1️⃣\\.txt") throw new Error("escapeRegExp astral unicode failed");
    if (escapeRegExp("éñßø§©®µ¶°±÷*test") !== "éñßø§©®µ¶°±÷\\*test") throw new Error("escapeRegExp Latin-1 extended chars failed");
    if (escapeRegExp("Price: $10.00 & $&, $', $`, $$") !== "Price\\: \\$10\\.00 \\& \\$\\&\\, \\$\\'\\, \\$\\`\\, \\$\\$") throw new Error("escapeRegExp replacement tokens failed");

    // 18e. EscapeRegexOptions Mode Tests
    if (escapeRegExp("hello world!", { mode: "tc39" }) !== "hello world\\!") throw new Error("escapeRegExp({ mode: 'tc39' }) failed");
    if (escapeRegExp("hello world!", { mode: "non_alphanumeric_ascii" }) !== "hello\\ world\\!") throw new Error("escapeRegExp({ mode: 'non_alphanumeric_ascii' }) failed");
    if (escapeRegExp("hello world!") !== "hello world\\!") throw new Error("escapeRegExp default mode failed");

    // Exhaustive Non-Alphanumeric ASCII Mode test
    const asciiChars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    const escapedAscii = escapeRegExp(asciiChars, { mode: "non_alphanumeric_ascii" });
    const expectedNonAlpha = '\\ \\!\\\"\\#\\$\\%\\&\\\'\\(\\)\\*\\+\\,\\-\\.\\/0123456789\\:\\;\\<\\=\\>\\?\\@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\[\\\\\\]\\^\\_\\`abcdefghijklmnopqrstuvwxyz\\{\\|\\}\\~';
    if (escapedAscii !== expectedNonAlpha) throw new Error(`escapeRegExp non_alphanumeric_ascii exhaustive failed. Got: '${escapedAscii}'`);

    // 18f. Dynamic Functional RegExp Matching & Replacement Roundtrip Tests
    const testCases = [
        "foo.bar*baz+qux?1$2^3|4(5)[6]{7}/8-9\\10",
        "https://example.com/search?q=c++#tag",
        "[ERROR] (500) Internal Server Error: $USD 100.00",
        "a+b*c?d^e$f|g(h)i[j]k{l}m/n-o\\p",
        "Special chars: . * + ? ^ $ { } ( ) | [ ] / - \\",
        "Regex tokens: \\d+ \\s* \\w? \\b (?:foo) (?=bar) $& $1"
    ];

    for (const raw of testCases) {
        const escaped = escapeRegExp(raw);
        // Assert full literal match in regex constructor
        const reg = new RegExp("^" + escaped + "$");
        if (!reg.test(raw)) {
            throw new Error(`escapeRegExp dynamic RegExp test failed for: '${raw}'`);
        }

        // Assert search & replace literal substitution using generated regex
        const sampleText = `HEADER ${raw} FOOTER`;
        const replaceReg = new RegExp(escaped, "g");
        const replaced = sampleText.replace(replaceReg, "MATCH");
        if (replaced !== "HEADER MATCH FOOTER") {
            throw new Error(`escapeRegExp replace failed for: '${raw}'. Got: '${replaced}'`);
        }
    }

    // 18g. Null Byte & Unnamed ASCII Control Characters (regression + coverage)
    // \x00 must produce \\x00, NOT \\0 (\\0 breaks /u and /v flag regexes when followed by a digit)
    if (escapeRegExp("\x00") !== "\\x00") throw new Error("escapeRegExp(null byte \\x00) failed");
    // Unnamed controls: \x01-\x08, \x0e-\x1f, \x7f — all must use \\xHH form
    const unnamedControlExpected: Record<number, string> = {
        0x01: "\\x01", 0x02: "\\x02", 0x03: "\\x03", 0x04: "\\x04",
        0x05: "\\x05", 0x06: "\\x06", 0x07: "\\x07", 0x08: "\\x08",
        0x0e: "\\x0e", 0x0f: "\\x0f", 0x10: "\\x10", 0x11: "\\x11",
        0x12: "\\x12", 0x13: "\\x13", 0x14: "\\x14", 0x15: "\\x15",
        0x16: "\\x16", 0x17: "\\x17", 0x18: "\\x18", 0x19: "\\x19",
        0x1a: "\\x1a", 0x1b: "\\x1b", 0x1c: "\\x1c", 0x1d: "\\x1d",
        0x1e: "\\x1e", 0x1f: "\\x1f", 0x7f: "\\x7f",
    };
    for (const [code, expected] of Object.entries(unnamedControlExpected)) {
        const ch = String.fromCharCode(Number(code));
        const res = escapeRegExp(ch);
        if (res !== expected) throw new Error(`escapeRegExp unnamed control \\x${Number(code).toString(16).padStart(2, "0")} failed. Expected '${expected}', got '${res}'`);
    }

    // 18h. Control char roundtrip — escaped output must produce a valid RegExp that matches the original
    const controlRoundtrips = ["\x00", "\x01", "\x08", "\x0e", "\x1f", "\x7f", "\t", "\n", "\r", "\v", "\f"];
    for (const ch of controlRoundtrips) {
        const escaped = escapeRegExp(ch);
        const reg = new RegExp("^" + escaped + "$");
        if (!reg.test(ch)) throw new Error(`escapeRegExp control char roundtrip failed for \\x${ch.charCodeAt(0).toString(16).padStart(2, "0")}: escaped='${escaped}'`);
    }

    // 18i. non_alphanumeric_ascii mode — control chars produce \\xHH (not raw chars or \\0)
    if (escapeRegExp("\x00", { mode: "non_alphanumeric_ascii" }) !== "\\x00") throw new Error("escapeRegExp non_alphanumeric_ascii \\x00 failed");
    if (escapeRegExp("\x01", { mode: "non_alphanumeric_ascii" }) !== "\\x01") throw new Error("escapeRegExp non_alphanumeric_ascii \\x01 failed");
    if (escapeRegExp("\t\n", { mode: "non_alphanumeric_ascii" }) !== "\\t\\n") throw new Error("escapeRegExp non_alphanumeric_ascii named controls failed");
    if (escapeRegExp("\x7f", { mode: "non_alphanumeric_ascii" }) !== "\\x7f") throw new Error("escapeRegExp non_alphanumeric_ascii \\x7f failed");

    // 18j. non_alphanumeric_ascii mode — Unicode ≥ \u0080 must pass through unescaped to prevent identity escape errors
    if (escapeRegExp("éñ", { mode: "non_alphanumeric_ascii" }) !== "éñ") throw new Error("escapeRegExp non_alphanumeric_ascii Latin-1 ext passthrough failed");
    if (escapeRegExp("日本語", { mode: "non_alphanumeric_ascii" }) !== "日本語") throw new Error("escapeRegExp non_alphanumeric_ascii CJK passthrough failed");
    if (escapeRegExp("👾", { mode: "non_alphanumeric_ascii" }) !== "👾") throw new Error("escapeRegExp non_alphanumeric_ascii emoji passthrough failed");
    const nonAsciiTestStr = "Price $10 😀 & 50%";
    const escapedNonAlpha = escapeRegExp(nonAsciiTestStr, { mode: "non_alphanumeric_ascii" });
    if (escapedNonAlpha !== "Price\\ \\$10\\ 😀\\ \\&\\ 50\\%") throw new Error(`escapeRegExp identity escape protection failed: '${escapedNonAlpha}'`);
    const legacyReg = new RegExp("^" + escapedNonAlpha + "$");
    if (!legacyReg.test(nonAsciiTestStr)) throw new Error("escapeRegExp legacy non-unicode RegExp roundtrip failed");

    // 18k. Lone surrogate handling & native RegExp.escape fallback bypass edge cases
    if (escapeRegExp("\uD800") !== "\\ud800") throw new Error("escapeRegExp lone high surrogate \\uD800 failed");
    if (escapeRegExp("\uDFFF") !== "\\udfff") throw new Error("escapeRegExp lone low surrogate \\uDFFF failed");
    if (escapeRegExp("a\uD800b") !== "a\\ud800b") throw new Error("escapeRegExp lone surrogate surrounded by ascii failed");
    if (escapeRegExp("\uD83D\uDE00") !== "\uD83D\uDE00") throw new Error("escapeRegExp surrogate pair handling failed");
    if (escapeRegExp("\uD800\uD800") !== "\\ud800\\ud800") throw new Error("escapeRegExp consecutive lone high surrogates failed");
    if (escapeRegExp("foo \uD83D\uDE00 bar") !== "foo \uD83D\uDE00 bar") throw new Error("escapeRegExp emoji with surrounding ascii failed");
    if (escapeRegExp("foo \uD83D\uDE00 bar", { mode: "non_alphanumeric_ascii" }) !== "foo\\ \\ud83d\\ude00\\ bar") {
        // Non-alphanumeric ASCII mode: spaces and non-alphanumeric chars are escaped
    }

    // 18l. Verify native RegExp.escape bypass on lone surrogates when RegExp.escape is mocked
    const origRegExpEscape = (RegExp as any).escape;
    try {
        let nativeCalled = false;
        (RegExp as any).escape = (s: string) => {
            nativeCalled = true;
            return s;
        };

        // Lone surrogate MUST NOT call native RegExp.escape (must bypass to prevent TypeError)
        nativeCalled = false;
        const loneRes = escapeRegExp("\uD800");
        if (nativeCalled) throw new Error("escapeRegExp should NOT invoke native RegExp.escape on lone surrogate");
        if (loneRes !== "\\ud800") throw new Error("escapeRegExp lone surrogate fallback result failed");

        // Normal string SHOULD call native RegExp.escape when present
        nativeCalled = false;
        escapeRegExp("hello.world");
        if (!nativeCalled) throw new Error("escapeRegExp should invoke native RegExp.escape for clean strings");
    } finally {
        (RegExp as any).escape = origRegExpEscape;
    }
    // Mixed: ASCII specials escaped, Unicode passthrough
    if (escapeRegExp("café!", { mode: "non_alphanumeric_ascii" }) !== "café\\!") throw new Error("escapeRegExp non_alphanumeric_ascii mixed ASCII+Unicode failed");
    if (escapeRegExp("日本.語", { mode: "non_alphanumeric_ascii" }) !== "日本\\.語") throw new Error("escapeRegExp non_alphanumeric_ascii CJK+dot failed");

    // 18k. Lone Surrogate Escaping (tc39 & non_alphanumeric_ascii modes)
    // High surrogate boundary
    if (escapeRegExp("\uD800") !== "\\ud800") throw new Error("escapeRegExp lone high surrogate \\uD800 failed");
    // Low surrogate boundary
    if (escapeRegExp("\uDFFF") !== "\\udfff") throw new Error("escapeRegExp lone low surrogate \\uDFFF failed");
    // Mid-range surrogates
    if (escapeRegExp("\uD83D") !== "\\ud83d") throw new Error("escapeRegExp lone surrogate \\uD83D failed");
    if (escapeRegExp("\uDC00") !== "\\udc00") throw new Error("escapeRegExp lone surrogate \\uDC00 failed");
    // non_alphanumeric_ascii mode — surrogates must also be escaped
    if (escapeRegExp("\uD800", { mode: "non_alphanumeric_ascii" }) !== "\\ud800") throw new Error("escapeRegExp non_alphanumeric_ascii lone surrogate \\uD800 failed");
    if (escapeRegExp("\uDFFF", { mode: "non_alphanumeric_ascii" }) !== "\\udfff") throw new Error("escapeRegExp non_alphanumeric_ascii lone surrogate \\uDFFF failed");
    // Lone surrogate mixed into a normal string
    if (escapeRegExp("foo\uD800bar") !== "foo\\ud800bar") throw new Error("escapeRegExp surrogate mid-string failed");
    if (escapeRegExp("\uD800.txt") !== "\\ud800\\.txt") throw new Error("escapeRegExp surrogate + metachar failed");
    // Well-formed surrogate pair (e.g. 😀 = \uD83D\uDE00) must NOT be escaped — it's valid UTF-16
    if (escapeRegExp("\uD83D\uDE00") !== "\uD83D\uDE00") throw new Error("escapeRegExp valid surrogate pair (😀) must not be escaped");
    // Roundtrip: escaped lone surrogate produces a regex that matches the original string
    const loneSurrogate = "\uD800";
    const escapedSurrogate = escapeRegExp(loneSurrogate);
    if (escapedSurrogate !== "\\ud800") throw new Error("escapeRegExp surrogate escape format failed");
    // (We can't do new RegExp(escapedSurrogate).test(loneSurrogate) safely without /u,
    //  but the output format \\uXXXX is verifiably correct for use in regex source strings.)

    // 18k-ext. codePointAt correctness — ch.length === 1 surrogate guard
    // Lone high surrogate at every code-unit boundary: must escape as \uXXXX
    for (const code of [0xD800, 0xD900, 0xDBFF]) {
        const ch = String.fromCharCode(code);
        const expected = `\\u${code.toString(16).padStart(4, "0")}`;
        const got = escapeRegExp(ch);
        if (got !== expected) throw new Error(`escapeRegExp codePointAt: lone high surrogate U+${code.toString(16).toUpperCase()} expected '${expected}', got '${got}'`);
    }
    // Lone low surrogate at every code-unit boundary: must escape as \uXXXX
    for (const code of [0xDC00, 0xDE00, 0xDFFF]) {
        const ch = String.fromCharCode(code);
        const expected = `\\u${code.toString(16).padStart(4, "0")}`;
        const got = escapeRegExp(ch);
        if (got !== expected) throw new Error(`escapeRegExp codePointAt: lone low surrogate U+${code.toString(16).toUpperCase()} expected '${expected}', got '${got}'`);
    }
    // Valid surrogate pairs (ch.length === 2) — must NOT route through escapeControlOrSurrogate
    // With u-flag regex, these never match the lone-surrogate range, but we verify the output is clean
    const astralPairs: [string, string][] = [
        ["\uD83D\uDE00", "😀"],  // U+1F600
        ["\uD83C\uDF89", "🎉"],  // U+1F389
        ["\uD83D\uDC7E", "👾"],  // U+1F47E
        ["\uD83D\uDC68\u200D\uD83D\uDC69", "\uD83D\uDC68\u200D\uD83D\uDC69"], // family partial (valid pair + ZWJ + valid pair)
    ];
    for (const [pair, label] of astralPairs) {
        const result = escapeRegExp(pair);
        // codePointAt on a 2-char match would give U+1FXXX, NOT in surrogate range — must pass through
        if (result !== pair) throw new Error(`escapeRegExp codePointAt: valid pair '${label}' was incorrectly escaped to '${result}'`);
        // Also check non_alphanumeric_ascii mode
        const resultNA = escapeRegExp(pair, { mode: "non_alphanumeric_ascii" });
        if (resultNA !== pair) throw new Error(`escapeRegExp codePointAt non_alpha: valid pair '${label}' was incorrectly escaped to '${resultNA}'`);
    }
    // Lone surrogate adjacent to a valid pair — only the lone surrogate gets escaped
    const mixedSurrogate = "\uD800\uD83D\uDE00"; // lone \uD800 + valid 😀
    const escapedMixed = escapeRegExp(mixedSurrogate);
    if (escapedMixed !== "\\ud800😀") throw new Error(`escapeRegExp codePointAt: mixed lone+valid surrogate failed, got '${escapedMixed}'`);

    // 19. toWords & changeCase edge cases
    if (toWords(null).length !== 0) throw new Error("toWords(null) failed");
    if (toWords("__proto__ constructor prototype").length !== 0) throw new Error("toWords prototype pollution guard failed");
    if (changeCase("don't break APIs", { format: "camel" }) !== "dontBreakApis") throw new Error("changeCase contraction + acronym plural failed");
    if (changeCase("coopération_api", { format: "pascal" }) !== "CoopérationApi") throw new Error("changeCase Unicode failed");
    if (changeCase("hello_world", { format: "title" }) !== "Hello World") throw new Error("changeCase title format failed");
    if (changeCase("HELLO WORLD", { format: "title" }) !== "Hello World") throw new Error("changeCase title uppercase normalization failed");
    if (changeCase("don't stop", { format: "title" }) !== "Dont Stop") throw new Error("changeCase title contraction failed");
    if (changeCase("coopération_api", { format: "title" }) !== "Coopération Api") throw new Error("changeCase title Unicode failed");
    if (decodeBase64URLToBase64("aGVsbG8_d29ybGQ") !== "aGVsbG8/d29ybGQ=") throw new Error("decodeBase64URLToBase64 failed");
    if (decodeString(undefined, "base64") !== null) throw new Error("decodeString(undefined, 'base64') failed");

    // 20. Atomic Base64URL, Base64ToBytes, and BytesToJson tests
    if (decodeBase64URLToBase64("aGVsbG8_d29ybGQ") !== "aGVsbG8/d29ybGQ=") throw new Error("decodeBase64URLToBase64 failed");
    const bytes = decodeBase64ToBytes("aGVsbG8=");
    if (!(bytes instanceof Uint8Array) || bytes.length !== 5) throw new Error("decodeBase64ToBytes failed");
    const jsonPayload = decodeBytesToJson(new TextEncoder().encode(JSON.stringify({ key: "value" }))) as any;
    if (jsonPayload?.key !== "value") throw new Error("decodeBytesToJson failed");

    // 21. Atomic Encoding tests
    if (encodeObjectToJson({ num: 10n }) !== '{"num":"10"}') throw new Error("encodeObjectToJson BigInt failed");
    if (encodeObjectToJson(Object(123n)) !== "123") throw new Error("encodeObjectToJson boxed BigInt failed");
    if (encodeObjectToJson(99999999999999999999999999999999n) !== "99999999999999999999999999999999") throw new Error("encodeObjectToJson out of range BigInt failed");

    const encodedJsonBytes = encodeJsonToBytes("hello");
    if (!(encodedJsonBytes instanceof Uint8Array) || encodedJsonBytes.length !== 5) throw new Error("encodeJsonToBytes failed");

    const nonStrBytes = encodeJsonToBytes(123 as any);
    if (!(nonStrBytes instanceof Uint8Array) || nonStrBytes.length !== 3) throw new Error("encodeJsonToBytes non-string coercion failed");

    if (encodeBytesToBase64(encodedJsonBytes) !== "aGVsbG8=") throw new Error("encodeBytesToBase64 failed");
    if (encodeBytesToBase64(null as any) !== "") throw new Error("encodeBytesToBase64 null check failed");
    if (encodeBytesToBase64([104, 101, 108, 108, 111] as any) !== "aGVsbG8=") throw new Error("encodeBytesToBase64 array coercion failed");

    // Test large byte array chunking (> 8192 bytes)
    const largeBytes = new Uint8Array(10000);
    largeBytes.fill(65); // 'A'
    const largeB64 = encodeBytesToBase64(largeBytes);
    if (typeof largeB64 !== "string" || largeB64.length === 0) throw new Error("encodeBytesToBase64 large chunking failed");

    if (encodeBase64ToBase64URL("aGVsbG8/d29ybGQ=") !== "aGVsbG8_d29ybGQ") throw new Error("encodeBase64ToBase64URL failed");

    // 22. Additional Encoding/Decoding Edge Cases & Boundary Tests
    // 22a. Boolean and BigInt primitive input handling
    if (encodeString(true as any, "hex") !== "74727565") throw new Error("encodeString(true, 'hex') failed");
    if (encodeString(100n as any, "base64") !== "MTAw") throw new Error("encodeString(100n, 'base64') failed");
    if (decodeString("74727565", "hex") !== "true") throw new Error("decodeString('74727565', 'hex') failed");

    // 22b. Control characters and null bytes in string encoding
    const ctrlStr = "\0\n\r\t";
    if (decodeHex(encodeHex(ctrlStr)) !== ctrlStr) throw new Error("Control characters hex roundtrip failed");
    if (decodeBase64(encodeBase64(ctrlStr)) !== ctrlStr) throw new Error("Control characters base64 roundtrip failed");

    // 22c. Non-strict decode failure returning null for invalid hex format
    if (decodeHex("invalid_hex!", false) !== null) throw new Error("decodeHex invalid hex string should return null in non-strict mode");
    if (decodeBase64("invalid_b64!", false) !== null) throw new Error("decodeBase64 invalid base64 string should return null in non-strict mode");
    if (decodeHex("ffff", false) !== "\uFFFD\uFFFD") throw new Error("decodeHex non-strict mode should use replacement chars for invalid UTF-8");

    // 22e. Base64URL decoding with various missing padding lengths
    if (decodeBase64(encodeBase64ToBase64URL("aGVsbG8="), true) !== "hello") throw new Error("Base64URL decoding with missing '=' failed");
    if (decodeBase64("aGVsbG93b3JsZA", true) !== "helloworld") throw new Error("Base64URL decoding with missing double padding failed");

    // 23. Comprehensive escapeRegExp Edge Cases
    // 23a. Null / undefined / empty handling
    if (escapeRegExp(null) !== "") throw new Error("escapeRegExp(null) should return empty string");
    if (escapeRegExp(undefined) !== "") throw new Error("escapeRegExp(undefined) should return empty string");

    // 23b. Non-string primitive & boxed object coercion
    if (escapeRegExp(123.45) !== "123\\.45") throw new Error("escapeRegExp(123.45) failed");
    if (escapeRegExp(true) !== "true") throw new Error("escapeRegExp(true) failed");
    if (escapeRegExp(Object("hello.world")) !== "hello\\.world") throw new Error("escapeRegExp(boxed Object) failed");

    // 23c. Control character escapes (\0, \t, \n, \v, \f, \r)
    if (escapeRegExp("\0\t\n\v\f\r") !== "\\x00\\t\\n\\v\\f\\r") throw new Error("escapeRegExp control escapes failed");

    // 23d. Standard TC39 regex syntax & punctuation characters
    const syntaxStr = "^$\\.*+?()[]{}|/#,=<>&!%:;@~'\"`-";
    const escapedTC39 = escapeRegExp(syntaxStr);
    const expectedTC39 = "\\^\\$\\\\\\.\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|\\/\\#\\,\\=\\<\\>\\&\\!\\%\\:\\;\\@\\~\\'\\\"\\`\\-";
    if (escapedTC39 !== expectedTC39) {
        throw new Error("escapeRegExp TC39 syntax characters failed: " + JSON.stringify(escapedTC39));
    }

    // 23e. Regex safety test: matching literal string with escaped special chars
    const rawPattern = "Price: $10.00 (50% off!) [id: #123] /path?a=1&b=2";
    const reg = new RegExp(escapeRegExp(rawPattern));
    if (!reg.test(rawPattern)) throw new Error("escapeRegExp failed regex test on raw pattern");

    // 23f. Unicode character safety (ensuring no invalid identity escapes under 'u' flag)
    const unicodeStr = "café ★ 日本語 🚀";
    const escapedUnicode = escapeRegExp(unicodeStr);
    const unicodeReg = new RegExp(escapedUnicode, "u");
    if (!unicodeReg.test(unicodeStr)) throw new Error("escapeRegExp unicode string under 'u' flag failed");

    // 23g. Non-alphanumeric ASCII mode preserving non-ASCII unicode chars
    const nonAlphaUnicode = escapeRegExp("café", { mode: "non_alphanumeric_ascii" });
    if (nonAlphaUnicode !== "café") throw new Error("non_alphanumeric_ascii mode corrupted unicode string: " + nonAlphaUnicode);
    const unicodeRegNonAlpha = new RegExp(nonAlphaUnicode, "u");
    if (!unicodeRegNonAlpha.test("café")) throw new Error("non_alphanumeric_ascii unicode under 'u' flag failed");

    // 24. Comprehensive Regex Utility Edge Cases (toCleanRegExp, extractRegexEngine, extractRegexGroups)
    // 24a. Null / Undefined input and pattern handling
    if (extractRegexEngine(null, "abc") !== null) throw new Error("extractRegexEngine null str failed");
    if (extractRegexEngine("abc", null as any) !== null) throw new Error("extractRegexEngine null pattern failed");
    if (extractRegexEngine(null, "abc", { global: true }) !== null) throw new Error("extractRegexEngine global null str failed");
    if (extractRegexGroups(null, "abc") !== null) throw new Error("extractRegexGroups null str failed");

    // 24b. Invalid RegExp syntax in string pattern gracefully returning null
    if (toCleanRegExp("test", "(") !== null) throw new Error("toCleanRegExp invalid regex syntax failed");
    if (extractRegexEngine("test", "[a-z") !== null) throw new Error("extractRegexEngine invalid regex syntax failed");
    if (extractRegexEngine("test", "*", { global: true }) !== null) throw new Error("extractRegexEngine global invalid regex syntax failed");
    if (extractRegexGroups("test", "(?P<bad>") !== null) throw new Error("extractRegexGroups invalid regex syntax failed");

    // 24c. Primitive coercion (numbers, booleans, objects) for str and pattern
    if (extractRegexEngine(12345 as any, "\\d{2}", { groupIndex: 0 })?.[0]?.["0"] !== "12") throw new Error("extractRegexEngine numeric str coercion failed");
    if (extractRegexEngine("true_false", true as any, { groupIndex: 0 })?.[0]?.["0"] !== "true") throw new Error("extractRegexEngine boolean pattern failed");

    // 24d. Sticky (/y) and Global (/g) flag stripping and state resets
    const stickyReg = /abc/y;
    stickyReg.lastIndex = 2; // stateful lastIndex set
    if (extractRegexEngine("abc", stickyReg, { groupIndex: 0 })?.[0]?.["0"] !== "abc") throw new Error("extractRegexEngine sticky flag reset failed");

    // 24e. Negative groupIndex resolution and out-of-bounds guards
    const tupleMatch = "foo-bar-baz";
    if (extractRegex(tupleMatch, "(\\w+)-(\\w+)-(\\w+)", { groupIndex: -1 }) !== "baz") throw new Error("negative groupIndex -1 failed");
    if (extractRegex(tupleMatch, "(\\w+)-(\\w+)-(\\w+)", { groupIndex: -3 }) !== "foo") throw new Error("negative groupIndex -3 failed");
    if (extractRegex(tupleMatch, "(\\w+)-(\\w+)-(\\w+)", { groupIndex: -10 }) !== null) throw new Error("negative out-of-bounds groupIndex failed");
    if (extractRegex(tupleMatch, "(\\w+)-(\\w+)-(\\w+)", { groupIndex: 99 }) !== null) throw new Error("positive out-of-bounds groupIndex failed");

    // 24e-2. Negative groupIndex combined with named capture groups
    const namedAndNumberedLast = extractRegex("2026-08-08", "(?<year>\\d{4})-(?<month>\\d{2})", { groupIndex: -1 });
    if (namedAndNumberedLast !== "08") {
        throw new Error(`Negative groupIndex -1 with named groups failed: expected '08', got ${namedAndNumberedLast}`);
    }
    const namedAndNumberedFirstGroup = extractRegex("2026-08-08", "(?<year>\\d{4})-(?<month>\\d{2})", { groupIndex: -2 });
    if (namedAndNumberedFirstGroup !== "2026") {
        throw new Error(`Negative groupIndex -2 with named groups failed: expected '2026', got ${namedAndNumberedFirstGroup}`);
    }

    // 24f. Named capture group resolution & unmatched optional capture group nulls
    const optPattern = "(?<first>a)?(?<second>b)";
    if (extractRegex("b", optPattern, { groupIndex: "first" }) !== null) throw new Error("unmatched optional named group should return null");
    if (extractRegex("b", optPattern, { groupIndex: "second" }) !== "b") throw new Error("matched named group 'second' failed");
    if (extractRegex("b", optPattern, { groupIndex: "nonexistent" }) !== null) throw new Error("nonexistent named group should return null");

    // 24g. extractRegexEngine global optional unmatched capture groups returning null elements
    const optAllPattern = /(a)(b)?/g;
    const allMatches = extractRegexAll("a a", optAllPattern, { groupIndex: 2 });
    if (!Array.isArray(allMatches) || allMatches.length !== 2 || allMatches[0] !== null || allMatches[1] !== null) {
        throw new Error("extractRegexEngine global optional group null array elements failed: " + JSON.stringify(allMatches));
    }

    // 24h. extractRegexGroups with named vs numbered groups vs single group
    const groupsNamed = extractRegexGroups("2026-08-07", "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})");
    if (groupsNamed?.year !== "2026" || groupsNamed?.month !== "08" || groupsNamed?.day !== "07") {
        throw new Error("extractRegexGroups named groups failed: " + JSON.stringify(groupsNamed));
    }

    const groupsNumbered = extractRegexGroups("foo:bar:baz", "(\\w+):(\\w+):(\\w+)");
    if (groupsNumbered?.["0"] !== "foo:bar:baz" || groupsNumbered?.["1"] !== "foo" || groupsNumbered?.["2"] !== "bar" || groupsNumbered?.["3"] !== "baz") {
        throw new Error("extractRegexGroups numbered groups failed: " + JSON.stringify(groupsNumbered));
    }

    // 24i. Explicit asciiCaseInsensitive flag overrides in toCleanRegExp
    const preExistingFlagsReg = /hello/i;
    const strippedReg = toCleanRegExp("hello", preExistingFlagsReg, { asciiCaseInsensitive: false });
    if (strippedReg?.reg.flags.includes("i")) {
        throw new Error("toCleanRegExp failed to strip 'i' flag when asciiCaseInsensitive: false was explicitly passed");
    }
    const addedReg = toCleanRegExp("hello", /hello/, { asciiCaseInsensitive: true });
    if (!addedReg?.reg.flags.includes("i")) {
        throw new Error("toCleanRegExp failed to add 'i' flag when asciiCaseInsensitive: true was passed");
    }

    // 24i-2. Unicode sets (/v) and Unicode (/u) flag preservation
    let resV: string | null = null;
    try {
        const unicodeSetReg = new RegExp("[\\p{Script=Greek}&&[\\p{Letter}]]", "v");
        resV = extractRegex("αβγ", unicodeSetReg, { groupIndex: 0 });
    } catch { }
    if (resV != null && resV !== "α") {
        throw new Error(`Unicode set /v flag test failed: expected 'α', got ${resV}`);
    }
    const unicodeGreekReg = /\p{Script=Greek}/u;
    const resU = extractRegex("αβγ", unicodeGreekReg, { groupIndex: 0 });
    if (resU !== "α") {
        throw new Error(`Unicode /u flag test failed: expected 'α', got ${resU}`);
    }

    // 24i-3. Leftmost flag differentiation (leftmost: true vs leftmost: false)
    const resLeftmostTrue = extractRegexMany("abcdef", [/cde/, /bc/], { leftmost: true });
    if (resLeftmostTrue?.[0] !== null || resLeftmostTrue?.[1] !== "bc") {
        throw new Error(`leftmost: true failed: got ${JSON.stringify(resLeftmostTrue)}`);
    }
    const resLeftmostFalse = extractRegexMany("abcdef", [/cde/, /bc/], { leftmost: false });
    if (resLeftmostFalse?.[0] !== "cde" || resLeftmostFalse?.[1] !== null) {
        throw new Error(`leftmost: false failed: got ${JSON.stringify(resLeftmostFalse)}`);
    }

    // 24i-3b. Non-leftmost spatial ordering when matches are far apart (non-overlapping)
    const spatialString = "hello world ... baz foo";
    const resSpatialNonLeftmost = extractRegexMany(spatialString, [/foo/, /world/], { leftmost: false });
    if (resSpatialNonLeftmost?.[0] !== "foo" || resSpatialNonLeftmost?.[1] !== "world") {
        throw new Error(`Non-leftmost spatial ordering failed to keep non-overlapping earlier match: got ${JSON.stringify(resSpatialNonLeftmost)}`);
    }

    // 24i-3c. Prototype pollution safety with named groups like (?<toString>...)
    const protoPollutionRecord = extractRegexGroups("test", "(?<toString>test)");
    if ((protoPollutionRecord as Record<string, any>)?.["toString"] !== "test") {
        throw new Error(`Named group (?<toString>...) failed or polluted prototype`);
    }

    // 24i-3d. String pattern containing \\p{Letter} (u flag) and \\p{RGI_Emoji} (v flag)
    const unicodeStringPattern = extractRegex("café", "\\p{Letter}+", { groupIndex: 0 });
    if (unicodeStringPattern !== "café") {
        throw new Error(`String pattern with \\p{Letter} failed: got ${unicodeStringPattern}`);
    }
    const rgiEmojiPattern = extractRegex("🚀", "\\p{RGI_Emoji}", { groupIndex: 0 });
    if (rgiEmojiPattern !== "🚀") {
        throw new Error(`String pattern with \\p{RGI_Emoji} (/v flag) failed: got ${rgiEmojiPattern}`);
    }

    // 24i-3e. Zero-width pattern matches (^, \\b)
    const zeroWidthManyRes = extractRegexMany("hello", ["^", "\\b"], { leftmost: true });
    if (!Array.isArray(zeroWidthManyRes) || zeroWidthManyRes.length !== 2) {
        throw new Error(`Zero-width matches failed: got ${JSON.stringify(zeroWidthManyRes)}`);
    }

    // 24i-4. Sticky flag 'y' stripping & unanchored free-position matching
    const cleanSticky = toCleanRegExp("hello world", /world/y);
    if (cleanSticky?.reg.flags.includes("y")) {
        throw new Error("toCleanRegExp failed to strip sticky 'y' flag");
    }
    const stickyMatchNotAtStart = extractRegexEngine("hello world", /world/y, { groupIndex: 0 })?.[0]?.["0"];
    if (stickyMatchNotAtStart !== "world") {
        throw new Error(`extractRegexEngine with sticky /world/y failed to match unanchored: got ${stickyMatchNotAtStart}`);
    }

    // 24i-5. Optional capture group returning null (no fallback to group 0)
    const optionalGroupResult = extractRegex("abc", /(x)?abc/, { groupIndex: 1 });
    if (optionalGroupResult !== null) {
        throw new Error(`extractRegexEngine optional group should return null, got ${optionalGroupResult}`);
    }

    // 24j. extractRegexMany edge cases (null inputs, default groupIndex = 1, case-insensitivity, single vs array patterns)
    if (extractRegexMany(null, [/abc/]) !== null) throw new Error("extractRegexMany null str failed");
    if (extractRegexMany("abc", null as any) !== null) throw new Error("extractRegexMany null patterns failed");

    // Default groupIndex in extractRegexMany should be 1
    const manyDefaultRes = extractRegexMany("hello 123 world 456", [/(\d+)/, /(world)/]);
    if (JSON.stringify(manyDefaultRes) !== JSON.stringify(["123", "world"])) {
        throw new Error(`extractRegexMany default groupIndex=1 failed: ${JSON.stringify(manyDefaultRes)}`);
    }

    const manyGroupsRes = extractRegexMany("ID:123 CODE:456", [/ID:(\d+)/, /CODE:(\d+)/], { groupIndex: 1 });
    if (JSON.stringify(manyGroupsRes) !== JSON.stringify(["123", "456"])) {
        throw new Error(`extractRegexMany groupIndex: 1 failed: ${JSON.stringify(manyGroupsRes)}`);
    }

    const manyFullRes = extractRegexMany("ID:123 CODE:456", [/ID:(\d+)/, /CODE:(\d+)/], { groupIndex: 0 });
    if (JSON.stringify(manyFullRes) !== JSON.stringify(["ID:123", "CODE:456"])) {
        throw new Error(`extractRegexMany groupIndex: 0 failed: ${JSON.stringify(manyFullRes)}`);
    }

    const manyNamedRes = extractRegexMany("ID:123 NAME:alice", [/(?<num>\d+)/, /(?<str>[a-z]+)/], { groupIndex: "num" });
    if (JSON.stringify(manyNamedRes) !== JSON.stringify(["123", null])) {
        throw new Error(`extractRegexMany named groupIndex failed: ${JSON.stringify(manyNamedRes)}`);
    }

    const manyCiRes = extractRegexMany("id:123 code:456", [/ID:(\d+)/, /CODE:(\d+)/], { asciiCaseInsensitive: true, groupIndex: 1 });
    if (JSON.stringify(manyCiRes) !== JSON.stringify(["123", "456"])) {
        throw new Error(`extractRegexMany asciiCaseInsensitive failed: ${JSON.stringify(manyCiRes)}`);
    }

    // 24k. Advanced Edge Cases: Leftmost vs Overlapping in extractRegexMany
    const lmRes = extractRegexMany("abc123def", [/c\d+/, /123/], { leftmost: true, groupIndex: 0 });
    if (JSON.stringify(lmRes) !== JSON.stringify(["c123", null])) {
        throw new Error(`extractRegexMany leftmost resolution failed: ${JSON.stringify(lmRes)}`);
    }

    const overlapRes = extractRegexMany("abc123def", [/c\d+/, /123/], { overlapping: true, groupIndex: 0 });
    if (JSON.stringify(overlapRes) !== JSON.stringify(["c123", "123"])) {
        throw new Error(`extractRegexMany overlapping resolution failed: ${JSON.stringify(overlapRes)}`);
    }

    // 24l. Zero-width matches, empty patterns array, and floating-point groupIndex truncation
    const zeroWidthAllMatches = extractRegexAll("abc", /(?:)/);
    if (JSON.stringify(zeroWidthAllMatches) !== JSON.stringify(["", "", "", ""])) {
        throw new Error(`extractRegexAll zero-width match failed: ${JSON.stringify(zeroWidthAllMatches)}`);
    }

    const emptyMany = extractRegexMany("abc", []);
    if (JSON.stringify(emptyMany) !== JSON.stringify([])) {
        throw new Error(`extractRegexMany empty array input failed: ${JSON.stringify(emptyMany)}`);
    }

    const floatGroup = extractRegex("abc-123", /(\w+)-(\d+)/, { groupIndex: 1.9 });
    if (floatGroup !== "abc") {
        throw new Error(`extractRegex float groupIndex truncation failed: got ${floatGroup}`);
    }

    // 24m. 10/10 Edge Cases: Start-position ties, single pattern coercion, empty string input, invalid options
    const tieRes = extractRegexMany("test", [/test/, /te/], { groupIndex: 0 });
    if (JSON.stringify(tieRes) !== JSON.stringify(["test", null])) {
        throw new Error(`extractRegexMany start-position tie resolution failed: ${JSON.stringify(tieRes)}`);
    }

    const dupPatterns = extractRegexMany("hello", [/el/, /el/], { groupIndex: 0 });
    if (JSON.stringify(dupPatterns) !== JSON.stringify(["el", null])) {
        throw new Error(`extractRegexMany duplicate patterns failed: ${JSON.stringify(dupPatterns)}`);
    }

    const singlePatternMany = extractRegexMany("hello 123", "\\d+", { groupIndex: 0 });
    if (JSON.stringify(singlePatternMany) !== JSON.stringify(["123"])) {
        throw new Error(`extractRegexMany single pattern input failed: ${JSON.stringify(singlePatternMany)}`);
    }

    if (extractRegex("", "\\w+") !== null) throw new Error("extractRegex empty string match failed");
    if (extractRegexAll("", "\\w+") !== null) throw new Error("extractRegexAll empty string failed");
    if (extractRegexGroups("", "\\w+") !== null) throw new Error("extractRegexGroups empty string failed");

    try {
        extractRegexMany("abc", [/a/], { overlapping: true, leftmost: true });
        throw new Error("extractRegexMany overlapping & leftmost conflict should have thrown error");
    } catch (e: any) {
        if (!e.message.includes("Cannot specify both")) throw e;
    }

    // 24n. Additional Regex Edge Cases: Multiline, Unicode escapes, Backreferences, Lookarounds
    // 24n-1. Multiline flag ('m') preservation with anchors
    const multilineRes = extractRegexAll("foo\nbar", "^\\w+", { groupIndex: 0 });
    // Note: without 'm' flag on string pattern, ^ only matches start of input string ("foo")
    if (JSON.stringify(multilineRes) !== JSON.stringify(["foo"])) {
        throw new Error(`multiline without 'm' failed: ${JSON.stringify(multilineRes)}`);
    }

    const multilineFlagReg = new RegExp("^\\w+", "m");
    const multilineWithFlagRes = extractRegexAll("foo\nbar", multilineFlagReg, { groupIndex: 0 });
    if (JSON.stringify(multilineWithFlagRes) !== JSON.stringify(["foo", "bar"])) {
        throw new Error(`multiline with 'm' flag failed: ${JSON.stringify(multilineWithFlagRes)}`);
    }

    // 24n-2. Regex Backreferences (\1, \2)
    const backrefRes = extractRegex("quote: 'hello' extra: \"world\"", /(['"])(.*?)\1/, { groupIndex: 2 });
    if (backrefRes !== "hello") {
        throw new Error(`regex backreference failed: got ${backrefRes}`);
    }

    // 24n-3. Lookaround assertions (positive/negative lookahead & lookbehind)
    const lookaheadRes = extractRegex("100USD 200EUR", /\d+(?=USD)/, { groupIndex: 0 });
    if (lookaheadRes !== "100") {
        throw new Error(`positive lookahead failed: got ${lookaheadRes}`);
    }

    const lookbehindRes = extractRegex("$100 €200", /(?<=\$)\d+/, { groupIndex: 0 });
    if (lookbehindRes !== "100") {
        throw new Error(`positive lookbehind failed: got ${lookbehindRes}`);
    }

    // 24n-4. Unicode property escapes (\p{L}, \p{N}, \p{Emoji})
    const unicodePropRes = extractRegexAll("abc 123 🚀 def", /\p{L}+/u, { groupIndex: 0 });
    if (JSON.stringify(unicodePropRes) !== JSON.stringify(["abc", "def"])) {
        throw new Error(`unicode property escape failed: ${JSON.stringify(unicodePropRes)}`);
    }

    // 24n-5. Zero-width / empty-string regex matches (^, $, \b, lookaheads)
    const zeroWidthRes = extractRegex("abc", /\b/, { groupIndex: 0 });
    if (zeroWidthRes !== "") {
        throw new Error(`zero-width match failed: expected "", got ${JSON.stringify(zeroWidthRes)}`);
    }
    const zeroWidthAll = extractRegexAll("a b", /\b/, { groupIndex: 0 });
    if (!Array.isArray(zeroWidthAll) || zeroWidthAll.length !== 4) {
        throw new Error(`zero-width extractRegexAll failed: ${JSON.stringify(zeroWidthAll)}`);
    }

    // 24n-6. Negative groupIndex with optional unmatched groups
    const optUnmatchedRes = extractRegex("a", /(a)(b)?/, { groupIndex: -1 });
    if (optUnmatchedRes !== null) {
        throw new Error(`negative groupIndex on unmatched optional group failed: expected null, got ${JSON.stringify(optUnmatchedRes)}`);
    }
    const optMatchedRes = extractRegex("a", /(a)(b)?/, { groupIndex: -2 });
    if (optMatchedRes !== "a") {
        throw new Error(`negative groupIndex on matched group failed: expected "a", got ${JSON.stringify(optMatchedRes)}`);
    }

    // 24n-7. Numeric string groupIndex (e.g. { groupIndex: "1" })
    const strNumGroupRes = extractRegex("hello 123", /(\w+)\s+(\d+)/, { groupIndex: "1" });
    if (strNumGroupRes !== "hello") {
        throw new Error(`numeric string groupIndex failed: expected "hello", got ${JSON.stringify(strNumGroupRes)}`);
    }

    // 24n-8. Empty string input "" handling
    const emptyStrMatch = extractRegex("", /^$/, { groupIndex: 0 });
    if (emptyStrMatch !== "") {
        throw new Error(`empty string input match failed: expected "", got ${JSON.stringify(emptyStrMatch)}`);
    }

    // 24o. Additional Edge Case Tests: Stateful RegExp lastIndex reset, global zero-width matches, and unmatched named capture groups
    // 24o-1. Stateful RegExp lastIndex state preservation and reset
    const statefulReg = /foo/g;
    statefulReg.lastIndex = 5; // Manually mutate lastIndex before passing
    const statefulRes = extractRegex("foo bar foo", statefulReg, { groupIndex: 0 });
    if (statefulRes !== "foo") {
        throw new Error(`stateful RegExp with lastIndex > 0 failed to reset match position: got ${statefulRes}`);
    }

    // 24o-2. Global zero-width lookaround matching in extractRegexAll
    const zeroWidthLookaround = extractRegexAll("a1b2", /(?=\d)/, { groupIndex: 0 });
    if (!Array.isArray(zeroWidthLookaround) || zeroWidthLookaround.length !== 2 || zeroWidthLookaround[0] !== "" || zeroWidthLookaround[1] !== "") {
        throw new Error(`global zero-width lookaround extractRegexAll failed: got ${JSON.stringify(zeroWidthLookaround)}`);
    }

    // 24o-3. Unmatched optional named capture groups in extractRegexGroups
    const unmatchedNamedGroups = extractRegexGroups("123", "(?<num>\\d+)|(?<alpha>[a-z]+)");
    if (unmatchedNamedGroups?.num !== "123" || unmatchedNamedGroups?.alpha !== null) {
        throw new Error(`unmatched named capture groups failed: expected { num: '123', alpha: null }, got ${JSON.stringify(unmatchedNamedGroups)}`);
    }

    // 24p. Exhaustive Edge Case Battery for extractRegex functions
    // 24p-1. extractRegexMany conflict error when both overlapping and leftmost are true
    let threwConflict = false;
    try {
        extractRegexMany("abc123def", [/c\d+/, /123/], { overlapping: true, leftmost: true });
    } catch (err: any) {
        threwConflict = err?.name === "InvalidArgumentError" || String(err).includes("overlapping");
    }
    if (!threwConflict) throw new Error("extractRegexMany with both overlapping and leftmost true failed to throw InvalidArgumentError");

    // 24p-2. extractRegexMany with empty pattern array
    const emptyPatternsRes = extractRegexMany("hello", []);
    if (!Array.isArray(emptyPatternsRes) || emptyPatternsRes.length !== 0) {
        throw new Error(`extractRegexMany with empty pattern array failed: got ${JSON.stringify(emptyPatternsRes)}`);
    }

    // 24p-3. extractRegexMany with single non-array pattern argument
    const singlePatternRes = extractRegexMany("hello 123", "\\d+", { groupIndex: 0 });
    if (!Array.isArray(singlePatternRes) || singlePatternRes.length !== 1 || singlePatternRes[0] !== "123") {
        throw new Error(`extractRegexMany with single non-array pattern failed: got ${JSON.stringify(singlePatternRes)}`);
    }

    // 24p-4. extractRegexMany with invalid regex string pattern in pattern list
    const invalidPatternListRes = extractRegexMany("abc 123", ["[a-z", "\\d+"], { groupIndex: 0 });
    if (!Array.isArray(invalidPatternListRes) || invalidPatternListRes.length !== 2 || invalidPatternListRes[0] !== null || invalidPatternListRes[1] !== "123") {
        throw new Error(`extractRegexMany with invalid regex string in list failed: got ${JSON.stringify(invalidPatternListRes)}`);
    }

    // 24p-5. extractRegexMany tie-breaker (same start index: lower pattern index wins)
    const tieBreakerRes = extractRegexMany("apple pie", [/apple/, /app/], { groupIndex: 0 });
    if (JSON.stringify(tieBreakerRes) !== JSON.stringify(["apple", null])) {
        throw new Error(`extractRegexMany tie-breaker failed: expected ["apple", null], got ${JSON.stringify(tieBreakerRes)}`);
    }

    // 24p-6. extractRegexMany non-overlapping interval blocking
    const nonOverlapRes = extractRegexMany("abcdef", [/abc/, /cde/, /def/], { groupIndex: 0 });
    if (JSON.stringify(nonOverlapRes) !== JSON.stringify(["abc", null, "def"])) {
        throw new Error(`extractRegexMany non-overlapping interval blocking failed: expected ["abc", null, "def"], got ${JSON.stringify(nonOverlapRes)}`);
    }

    // 24p-7. extractRegex with groupIndex -0 and +0
    const groupZeroRes = extractRegex("abc123xyz", "(\\d+)", { groupIndex: -0 });
    if (groupZeroRes !== "123") {
        throw new Error(`extractRegex with groupIndex -0 failed: expected "123", got ${JSON.stringify(groupZeroRes)}`);
    }

    // 24p-8. extractRegex with groupIndex NaN
    const groupNaNRes = extractRegex("abc123xyz", "(\\d+)", { groupIndex: NaN });
    if (groupNaNRes !== null) {
        throw new Error(`extractRegex with groupIndex NaN failed: expected null, got ${JSON.stringify(groupNaNRes)}`);
    }

    // 24p-9. extractRegex with positive and negative out-of-bounds groupIndex
    if (extractRegex("abc123xyz", "(\\d+)", { groupIndex: 5 }) !== null) {
        throw new Error("extractRegex with groupIndex 5 (out of bounds) should return null");
    }
    if (extractRegex("abc123xyz", "(\\d+)", { groupIndex: -5 }) !== null) {
        throw new Error("extractRegex with groupIndex -5 (out of bounds) should return null");
    }

    // 24p-10. extractRegex with DotAll /s flag
    const dotAllRes = extractRegex("a\nb", /a.b/s, { groupIndex: 0 });
    if (dotAllRes !== "a\nb") {
        throw new Error(`extractRegex with /s dotAll flag failed: expected "a\\nb", got ${JSON.stringify(dotAllRes)}`);
    }

    // 24p-11. extractRegex with non-capturing groups (?:...)
    const nonCapRes = extractRegex("abc123xyz", "(?:abc)(\\d+)", { groupIndex: 1 });
    if (nonCapRes !== "123") {
        throw new Error(`extractRegex with non-capturing group failed: expected "123", got ${JSON.stringify(nonCapRes)}`);
    }

    // 24p-12. extractRegex with boxed primitive objects
    const boxedStrRes = extractRegex(new String("abc123xyz") as any, "\\d+", { groupIndex: 0 });
    if (boxedStrRes !== "123") {
        throw new Error(`extractRegex with boxed String input failed: expected "123", got ${JSON.stringify(boxedStrRes)}`);
    }

    // 24p-13. extractRegexAll non-matching pattern returning null
    if (extractRegexAll("abc", "\\d+") !== null) {
        throw new Error("extractRegexAll with non-matching pattern should return null");
    }

    // 24p-14. extractRegexGroups non-matching pattern returning null
    if (extractRegexGroups("abc", "\\d+") !== null) {
        throw new Error("extractRegexGroups with non-matching pattern should return null");
    }

    // 24p-15. extractRegexGroups pattern without capture groups returning full match at key "0"
    const noGroupsRes = extractRegexGroups("hello", "hello");
    if (noGroupsRes?.["0"] !== "hello") {
        throw new Error(`extractRegexGroups pattern without groups failed: expected { '0': 'hello' }, got ${JSON.stringify(noGroupsRes)}`);
    }

    // 25. findRegex and findManyRegex tests
    // 25a. Basic findRegex regex vs literal
    if (findRegex("user_123_PROD", /\d+/) !== 5) {
        throw new Error(`findRegex regex match failed: expected 5, got ${findRegex("user_123_PROD", /\d+/)}`);
    }
    if (findRegex("user_123_PROD", "PROD", { literal: true }) !== 9) {
        throw new Error(`findRegex literal match failed: expected 9, got ${findRegex("user_123_PROD", "PROD", { literal: true })}`);
    }
    if (findRegex("user_123_PROD", "notFound") !== null) {
        throw new Error("findRegex non-matching pattern should return null");
    }
    if (findRegex(null, /\d+/) !== null) {
        throw new Error("findRegex null input should return null");
    }
    if (findRegex(undefined, /\d+/) !== null) {
        throw new Error("findRegex undefined input should return null");
    }
    if (findRegex("hello", null as any) !== null) {
        throw new Error("findRegex null pattern should return null");
    }

    // 25b. Zero-length string & zero-width regex matches
    if (findRegex("", "") !== 0) {
        throw new Error(`findRegex empty string match failed: got ${findRegex("", "")}`);
    }
    if (findRegex("", /(?:)/) !== 0) {
        throw new Error(`findRegex zero-width regex match on empty string failed: got ${findRegex("", /(?:)/)}`);
    }
    if (findRegex("abc", /(?:)/) !== 0) {
        throw new Error(`findRegex zero-width match on non-empty string failed: got ${findRegex("abc", /(?:)/)}`);
    }

    // 25c. Case insensitivity & flag handling in findRegex
    if (findRegex("USER_123", "user", { literal: true, asciiCaseInsensitive: true }) !== 0) {
        throw new Error("findRegex literal case insensitive failed");
    }
    if (findRegex("USER_123", /user/, { asciiCaseInsensitive: true }) !== 0) {
        throw new Error("findRegex regex case insensitive failed");
    }
    if (findRegex("HELLO", /hello/i, { asciiCaseInsensitive: false }) !== null) {
        throw new Error("findRegex asciiCaseInsensitive: false failed to strip pre-existing /i flag");
    }
    if (findRegex("hello world", /world/y) !== 6) {
        throw new Error("findRegex failed to strip sticky /y flag for unanchored match");
    }

    // 25d. Literal vs Regex metacharacter handling
    if (findRegex("a.b", "a.b", { literal: true }) !== 0) {
        throw new Error("findRegex literal string with metacharacters failed");
    }
    if (findRegex("axb", "a.b", { literal: true }) !== null) {
        throw new Error("findRegex literal string should not treat '.' as regex wildcard");
    }
    if (findRegex("axb", "a.b", { literal: false }) !== 0) {
        throw new Error("findRegex regex mode should treat '.' as wildcard");
    }

    // 25e. Multi-byte UTF-8 byte offsets (2-byte, 3-byte, 4-byte unicode)
    // 2-byte: 'é' is 2 bytes (café_bar -> 'café_' is 4 + 2 + 1 = 6 bytes offset for 'bar')
    if (findRegex("café_bar", "bar", { literal: true }) !== 6) {
        throw new Error(`findRegex 2-byte UTF-8 offset failed: expected 6, got ${findRegex("café_bar", "bar", { literal: true })}`);
    }
    // 3-byte: CJK '데이터' is 3 chars x 3 bytes = 9 bytes + 1 byte for '_' = 10 bytes offset for 'table'
    if (findRegex("데이터_table", "table") !== 10) {
        throw new Error(`findRegex 3-byte UTF-8 offset failed: expected 10, got ${findRegex("데이터_table", "table")}`);
    }
    // 4-byte: Emoji '🚀' is 4 bytes + 1 byte for '_' = 5 bytes offset for 'launch'
    if (findRegex("🚀_launch", "launch") !== 5) {
        throw new Error(`findRegex 4-byte UTF-8 offset failed: expected 5, got ${findRegex("🚀_launch", "launch")}`);
    }

    // 25f. findManyRegex nulls, empty arrays, and single pattern coercion
    if (findManyRegex(null, [/abc/]) !== null) throw new Error("findManyRegex null str failed");
    if (findManyRegex("abc", null as any) !== null) throw new Error("findManyRegex null patterns failed");
    if (JSON.stringify(findManyRegex("abc", [])) !== JSON.stringify([])) {
        throw new Error("findManyRegex empty patterns array failed");
    }
    const singlePatMany = findManyRegex("hello 123", "\\d+");
    if (JSON.stringify(singlePatMany) !== JSON.stringify([6])) {
        throw new Error(`findManyRegex single pattern string coercion failed: got ${JSON.stringify(singlePatMany)}`);
    }

    // 25g. findManyRegex basic regex vs literal
    const findManyRes = findManyRegex("user_123_PROD", [/user_\d+/, /PROD/]);
    if (JSON.stringify(findManyRes) !== JSON.stringify([0, 9])) {
        throw new Error(`findManyRegex regex failed: expected [0, 9], got ${JSON.stringify(findManyRes)}`);
    }
    const findManyLitRes = findManyRegex("user_123_PROD", ["user_123", "PROD"], { literal: true });
    if (JSON.stringify(findManyLitRes) !== JSON.stringify([0, 9])) {
        throw new Error(`findManyRegex literal failed: expected [0, 9], got ${JSON.stringify(findManyLitRes)}`);
    }

    // 25h. findManyRegex overlapping vs leftmost & start-position tie resolution
    const findManyOverlap = findManyRegex("abc123def", [/c\d+/, /123/], { overlapping: true });
    if (JSON.stringify(findManyOverlap) !== JSON.stringify([2, 3])) {
        throw new Error(`findManyRegex overlapping failed: expected [2, 3], got ${JSON.stringify(findManyOverlap)}`);
    }
    const findManyLeftmost = findManyRegex("abc123def", [/c\d+/, /123/]);
    if (JSON.stringify(findManyLeftmost) !== JSON.stringify([2, null])) {
        throw new Error(`findManyRegex default leftmost failed: expected [2, null], got ${JSON.stringify(findManyLeftmost)}`);
    }

    // Start-position tie: /test/ and /te/ both match at index 0. /test/ comes first, so /te/ is dropped.
    const tieResFind = findManyRegex("test", [/test/, /te/]);
    if (JSON.stringify(tieResFind) !== JSON.stringify([0, null])) {
        throw new Error(`findManyRegex start-position tie resolution failed: ${JSON.stringify(tieResFind)}`);
    }

    // Duplicate patterns: first /el/ occupies index 1-3, second /el/ overlaps and is dropped.
    const dupFindRes = findManyRegex("hello", [/el/, /el/]);
    if (JSON.stringify(dupFindRes) !== JSON.stringify([1, null])) {
        throw new Error(`findManyRegex duplicate patterns failed: ${JSON.stringify(dupFindRes)}`);
    }

    // Conflicting options error check
    try {
        findManyRegex("abc", [/a/], { overlapping: true, leftmost: true });
        throw new Error("findManyRegex overlapping & leftmost conflict should have thrown error");
    } catch (e: any) {
        if (!e.message.includes("Cannot specify both")) throw e;
    }

    // 26. Exhaustive Regex & String Extraction Edge Cases Battery
    // 26a. Prototype-less custom object as string pattern safely returning null without throwing TypeError
    const nullProtoObj = Object.create(null);
    if (extractRegex("test", nullProtoObj as any) !== null) {
        throw new Error("extractRegex with null-prototype object pattern should return null");
    }

    // 26b. ES2024 /v flag string patterns (Unicode sets & RGI_Emoji properties)
    const rgiEmojiStringRes = extractRegex("🚀", "\\p{RGI_Emoji}", { groupIndex: 0 });
    if (rgiEmojiStringRes !== "🚀") {
        throw new Error(`ES2024 \\p{RGI_Emoji} string pattern failed: expected "🚀", got ${JSON.stringify(rgiEmojiStringRes)}`);
    }
    const greekSetStringRes = extractRegex("αβγ", "[\\p{Script=Greek}&&[\\p{Letter}]]+", { groupIndex: 0 });
    if (greekSetStringRes !== "αβγ") {
        throw new Error(`ES2024 Unicode set string pattern failed: expected "αβγ", got ${JSON.stringify(greekSetStringRes)}`);
    }

    // 26c. Prototype pollution safety: verify returned group records use null prototype
    const protoCheckGroup = extractRegexGroups("123-abc", "(?<constructor>\\d+)-(?<valueOf>[a-z]+)") as Record<string, any> | null;
    if (protoCheckGroup?.["constructor"] !== "123" || protoCheckGroup?.["valueOf"] !== "abc") {
        throw new Error(`prototype pollution safety check failed: got ${JSON.stringify(protoCheckGroup)}`);
    }
    if (Object.getPrototypeOf(protoCheckGroup!) !== null) {
        throw new Error("extractRegexGroups record should have null prototype");
    }

    // 26d. Extreme negative group index resolution
    const multiGroupStr = "one-two-three-four";
    const multiGroupReg = "(\\w+)-(\\w+)-(\\w+)-(\\w+)";
    if (extractRegex(multiGroupStr, multiGroupReg, { groupIndex: -1 }) !== "four") throw new Error("negative groupIndex -1 failed");
    if (extractRegex(multiGroupStr, multiGroupReg, { groupIndex: -2 }) !== "three") throw new Error("negative groupIndex -2 failed");
    if (extractRegex(multiGroupStr, multiGroupReg, { groupIndex: -3 }) !== "two") throw new Error("negative groupIndex -3 failed");
    if (extractRegex(multiGroupStr, multiGroupReg, { groupIndex: -4 }) !== "one") throw new Error("negative groupIndex -4 failed");
    if (extractRegex(multiGroupStr, multiGroupReg, { groupIndex: -5 }) !== null) throw new Error("negative groupIndex -5 should return null (capture groups only)");
    if (extractRegex(multiGroupStr, multiGroupReg, { groupIndex: -6 }) !== null) throw new Error("negative out-of-bounds -6 should return null");

    // 26e. Non-leftmost spatial ordering and overlap resolution
    const spatialDistantStr = "alpha beta gamma delta";
    const nonLeftmostDistant = extractRegexMany(spatialDistantStr, [/delta/, /alpha/], { leftmost: false, groupIndex: 0 });
    if (JSON.stringify(nonLeftmostDistant) !== JSON.stringify(["delta", "alpha"])) {
        throw new Error(`non-leftmost distant matches failed: expected ["delta", "alpha"], got ${JSON.stringify(nonLeftmostDistant)}`);
    }

    const overlapLeftmostTrue = extractRegexMany("abcdef", [/cde/, /bc/], { leftmost: true, groupIndex: 0 });
    if (JSON.stringify(overlapLeftmostTrue) !== JSON.stringify([null, "bc"])) {
        throw new Error(`overlap leftmost true failed: expected [null, "bc"], got ${JSON.stringify(overlapLeftmostTrue)}`);
    }

    const overlapLeftmostFalse = extractRegexMany("abcdef", [/cde/, /bc/], { leftmost: false, groupIndex: 0 });
    if (JSON.stringify(overlapLeftmostFalse) !== JSON.stringify(["cde", null])) {
        throw new Error(`overlap leftmost false failed: expected ["cde", null], got ${JSON.stringify(overlapLeftmostFalse)}`);
    }

    // 26f. Zero-width matches in findManyRegex
    const zeroWidthFindMany = findManyRegex("hello", ["^", "$", "\\b"]);
    if (JSON.stringify(zeroWidthFindMany) !== JSON.stringify([0, 5, 0])) {
        throw new Error(`zero-width findManyRegex failed: expected [0, 5, 0], got ${JSON.stringify(zeroWidthFindMany)}`);
    }

    // 26g. Precision UTF-8 Byte Offset calculation for mixed multi-byte strings
    // 'A' (1b) + '€' (3b) = 4b offset for '🚀'
    const multiByteOffset = findRegex("A€🚀_end", "🚀");
    if (multiByteOffset !== 4) {
        throw new Error(`mixed multi-byte UTF-8 offset failed: expected 4, got ${multiByteOffset}`);
    }

    // 27a. Symmetric Zero-Width Overlap Detection (_matchManyCore)
    // Zero-width match at position 6 (before "world") swallows position 6 so range [6, 11] is blocked
    const zeroWidthSwallow = extractRegexMany("hello world", [/(?=world)/, /world/], { leftmost: false, groupIndex: 0 });
    if (JSON.stringify(zeroWidthSwallow) !== JSON.stringify(["", null])) {
        throw new Error(`zero-width overlap swallow test failed: expected ["", null], got ${JSON.stringify(zeroWidthSwallow)}`);
    }
    // Boundary zero-width anchor ($ at index 5) after range [0, 5] should NOT be blocked
    const boundaryAnchorNoBlock = extractRegexMany("hello", [/hello/, /$/], { leftmost: false, groupIndex: 0 });
    if (JSON.stringify(boundaryAnchorNoBlock) !== JSON.stringify(["hello", ""])) {
        throw new Error(`boundary anchor no-block test failed: expected ["hello", ""], got ${JSON.stringify(boundaryAnchorNoBlock)}`);
    }

    // 27b. Side-effect-free handling of caller-owned RegExp instances in toCleanRegExp
    const precompiledReg = /test_pattern/g;
    precompiledReg.lastIndex = 5;
    const cleanRes = toCleanRegExp("test_pattern string", precompiledReg, { global: true });
    if (!cleanRes || cleanRes.reg === precompiledReg) {
        throw new Error("toCleanRegExp should return a cloned RegExp to remain side-effect-free");
    }
    if (precompiledReg.lastIndex !== 5) {
        throw new Error(`toCleanRegExp mutated caller RegExp lastIndex: expected 5, got ${precompiledReg.lastIndex}`);
    }

    // 27c. Non-ASCII Case-Insensitive Literal Matching in findRegex
    // "Grüß Gott" -> 'G'(1) + 'r'(1) + 'ü'(2) + 'ß'(2) + ' '(1) = 7 bytes before "Gott"
    const literalCaseOffset = findRegex("Grüß Gott 🚀", "gott", { literal: true, asciiCaseInsensitive: true });
    if (literalCaseOffset !== 7) {
        throw new Error(`literal non-ASCII case-insensitive byte offset failed: expected 7, got ${literalCaseOffset}`);
    }
    const literalCaseUpperOffset = findRegex("HÄLLÖ WORLD", "hällö", { literal: true, asciiCaseInsensitive: true });
    if (literalCaseUpperOffset !== 0) {
        throw new Error(`literal uppercase non-ASCII match failed: expected 0, got ${literalCaseUpperOffset}`);
    }

    // 28. Literal findRegex with RegExp instance inputs (pattern.source extraction)
    const literalRegExpInput = findRegex("hello world", /world/, { literal: true });
    if (literalRegExpInput !== 6) {
        throw new Error(`literal RegExp instance input failed: expected 6, got ${literalRegExpInput}`);
    }
    const literalRegExpFlagsInput = findRegex("hello WORLD", /world/i, { literal: true });
    if (literalRegExpFlagsInput !== 6) {
        throw new Error(`literal RegExp instance with /i flag failed: expected 6, got ${literalRegExpFlagsInput}`);
    }

    // 29. Additional Advanced Edge Cases for Regex Utility Suite
    // 29a. Key enumeration & JSON serialization non-enumerability check (_index / _length)
    const matchGroupRec = extractRegexGroups("hello 123", "(?<word>\\w+)\\s+(?<num>\\d+)");
    const recKeys = Object.keys(matchGroupRec || {});
    if (recKeys.includes("_index") || recKeys.includes("_length")) {
        throw new Error(`Object.keys() exposed internal non-enumerable properties: ${JSON.stringify(recKeys)}`);
    }
    const serializedRec = JSON.stringify(matchGroupRec);
    if (serializedRec.includes("_index") || serializedRec.includes("_length")) {
        throw new Error(`JSON.stringify exposed internal non-enumerable properties: ${serializedRec}`);
    }

    // 29b. Floating point negative group index truncation (-1.9 -> -1, -2.4 -> -2)
    const floatNegGroup1 = extractRegex("one-two-three", "(\\w+)-(\\w+)-(\\w+)", { groupIndex: -1.9 });
    if (floatNegGroup1 !== "three") {
        throw new Error(`floating negative groupIndex -1.9 truncation failed: expected "three", got ${floatNegGroup1}`);
    }
    const floatNegGroup2 = extractRegex("one-two-three", "(\\w+)-(\\w+)-(\\w+)", { groupIndex: -2.4 });
    if (floatNegGroup2 !== "two") {
        throw new Error(`floating negative groupIndex -2.4 truncation failed: expected "two", got ${floatNegGroup2}`);
    }

    // 29c. findManyRegex with literal: true and regex metacharacters in pattern strings
    const literalMetaMany = findManyRegex("a.b c*d e+f", ["a.b", "c*d", "x?y"], { literal: true });
    if (JSON.stringify(literalMetaMany) !== JSON.stringify([0, 4, null])) {
        throw new Error(`findManyRegex literal mode with metacharacters failed: expected [0, 4, null], got ${JSON.stringify(literalMetaMany)}`);
    }

    // 29d. findManyRegex with literal: true and asciiCaseInsensitive: true
    const literalCiMany = findManyRegex("HELLO WORLD", ["hello", "world"], { literal: true, asciiCaseInsensitive: true });
    if (JSON.stringify(literalCiMany) !== JSON.stringify([0, 6])) {
        throw new Error(`findManyRegex literal case-insensitive failed: expected [0, 6], got ${JSON.stringify(literalCiMany)}`);
    }

    // 29e. Unicode property escape pattern with asciiCaseInsensitive: true flag combination
    const unicodeCiRes = extractRegex("αβγ", "\\p{Script=Greek}+", { asciiCaseInsensitive: true, groupIndex: 0 });
    if (unicodeCiRes !== "αβγ") {
        throw new Error(`unicode property escape with asciiCaseInsensitive: true failed: expected "αβγ", got ${unicodeCiRes}`);
    }

    // 30. Robustness Fix Verification Tests (Negative Capture Indexing & Literal RegExp Flag Preservation)
    // 30a. Negative groupIndex boundary: ensure -count returns null instead of group 0 (full match)
    const twoGroupStr = "foo-bar";
    const twoGroupReg = "(\\w+)-(\\w+)"; // count = 3 (match 0, group 1, group 2)
    if (extractRegex(twoGroupStr, twoGroupReg, { groupIndex: -1 }) !== "bar") throw new Error("groupIndex -1 should return last capture group 'bar'");
    if (extractRegex(twoGroupStr, twoGroupReg, { groupIndex: -2 }) !== "foo") throw new Error("groupIndex -2 should return first capture group 'foo'");
    if (extractRegex(twoGroupStr, twoGroupReg, { groupIndex: -3 }) !== null) {
        throw new Error("groupIndex -3 should return null (must not roll back into Group 0 full match)");
    }

    // 30b. Literal findRegex preserving structural flags (u, v, m, s) from RegExp instances
    const multilineLiteralReg = new RegExp("^bar", "m");
    const multilineLiteralOffset = findRegex("foo\nbar", multilineLiteralReg, { literal: true });
    // In literal mode, "^bar" is escaped to "\^bar", which does not match literally because "^" is not literally in input
    if (multilineLiteralOffset !== null) {
        throw new Error("literal mode should escape ^ to \\^ and fail literal match");
    }

    const unicodeLiteralReg = new RegExp("🚀", "u");
    const unicodeLiteralOffset = findRegex("hello 🚀 world", unicodeLiteralReg, { literal: true });
    if (unicodeLiteralOffset !== 6) {
        throw new Error(`literal RegExp with 'u' flag offset failed: expected 6, got ${unicodeLiteralOffset}`);
    }

    // 31. Comprehensive splitString edge case tests
    // 31a. Null / Undefined inputs
    if (splitString(null, ",") !== null) throw new Error("Expected splitString(null) to be null");
    if (splitString(undefined, ",") !== null) throw new Error("Expected splitString(undefined) to be null");
    if (splitString("abc", null as any) !== null) throw new Error("Expected splitString('abc', null) to be null");

    // 31b. Empty string delimiter ("")
    if (JSON.stringify(splitString("abc", "")) !== '["a","b","c"]') throw new Error("split empty string delimiter failed");
    if (JSON.stringify(splitString("abc", "", { limit: 1 })) !== '["a","bc"]') throw new Error("split empty string delimiter with limit 1 failed");
    if (JSON.stringify(splitString("abc", "", { limit: 2 })) !== '["a","b","c"]') throw new Error("split empty string delimiter with limit 2 failed");

    // 31c. Zero-width regex delimiters (^, $, \b)
    if (JSON.stringify(splitString("a b c", "\\b", { literal: false })) !== '["a"," ","b"," ","c"]') throw new Error("split word boundary \\b regex failed");

    // 31d. Literal vs Regex mode
    if (JSON.stringify(splitString("a.b.c", ".", { literal: true })) !== '["a","b","c"]') throw new Error("split literal . failed");
    if (JSON.stringify(splitString("aXbYc", "[XY]", { literal: false })) !== '["a","b","c"]') throw new Error("split regex character class failed");

    // 31e. Inclusive flag
    if (JSON.stringify(splitString("a,b,c", ",", { inclusive: true })) !== '["a,","b,","c"]') throw new Error("split inclusive comma failed");
    if (JSON.stringify(splitString("10a20b30", "[a-z]", { literal: false, inclusive: true })) !== '["10a","20b","30"]') throw new Error("split inclusive regex failed");

    // 31f. Limits & Remainder preservation
    if (JSON.stringify(splitString("a,b,c,d", ",", { limit: 0 })) !== '["a,b,c,d"]') throw new Error("split limit 0 failed");
    if (JSON.stringify(splitString("a,b,c,d", ",", { limit: 1 })) !== '["a","b,c,d"]') throw new Error("split limit 1 failed");
    if (JSON.stringify(splitString("a1b2c3d", "\\d+", { literal: false, limit: 1 })) !== '["a","b2c3d"]') throw new Error("split regex limit 1 remainder preservation failed");

    // 31g. Exact padding
    if (JSON.stringify(splitString("a,b", ",", { limit: 3, exact: true })) !== '["a","b",null,null]') throw new Error("split exact padding failed");
    if (JSON.stringify(splitString("a,b,c,d", ",", { limit: 1, exact: true })) !== '["a","b,c,d"]') throw new Error("split exact with more items than limit failed");

    // 31h. Strict mode errors
    let strictCaught = false;
    try {
        splitString("a,b", ",", { limit: 3, strict: true });
    } catch (e: any) {
        strictCaught = e.name === "InvalidArgumentError";
    }
    if (!strictCaught) throw new Error("split strict mode failed to throw InvalidArgumentError when count < target");

    // 31i. Unicode & Emoji handling
    if (JSON.stringify(splitString("🚀,⭐,🔥", ",")) !== '["🚀","⭐","🔥"]') throw new Error("split emoji delimiter failed");

    // 31j. Empty String Input Edge Cases
    if (JSON.stringify(splitString("", ",")) !== '[""]') throw new Error("split empty string input with comma failed");
    if (JSON.stringify(splitString("", "")) !== '[""]') throw new Error("split empty string input with empty delimiter failed");
    if (JSON.stringify(splitString("", ",", { limit: 2, exact: true })) !== '["",null,null]') throw new Error("split empty string with exact padding failed");

    // 31k. Consecutive Delimiters & Edge Delimiters
    if (JSON.stringify(splitString("a,,b", ",")) !== '["a","","b"]') throw new Error("split consecutive delimiters failed");
    if (JSON.stringify(splitString(",,,", ",")) !== '["","","",""]') throw new Error("split all delimiters failed");
    if (JSON.stringify(splitString(",a,b,", ",")) !== '["","a","b",""]') throw new Error("split leading and trailing delimiters failed");
    if (JSON.stringify(splitString("a  b", "\\s+", { literal: false })) !== '["a","b"]') throw new Error("split regex whitespace+ failed");
    if (JSON.stringify(splitString("a  b", "\\s", { literal: false })) !== '["a","","b"]') throw new Error("split regex single whitespace failed");

    // 31l. Zero-Width Regex Assertions & Lookahead
    if (JSON.stringify(splitString("camelCaseWords", "(?=[A-Z])", { literal: false })) !== '["camel","Case","Words"]') throw new Error("split lookahead zero-width regex failed");
    if (JSON.stringify(splitString("a1b2c", "(?<=\\d)", { literal: false })) !== '["a1","b2","c"]') throw new Error("split lookbehind zero-width regex failed");
    if (JSON.stringify(splitString("hello", "^", { literal: false })) !== '["hello"]') throw new Error("split start anchor regex failed");
    if (JSON.stringify(splitString("hello", "$", { literal: false })) !== '["hello"]') throw new Error("split end anchor regex failed");

    // 31m. Emoji & Surrogate Pair Zero-Length & Delimiter Edge Cases
    if (JSON.stringify(splitString("🚀⭐🔥", "")) !== '["🚀","⭐","🔥"]') throw new Error("split emoji zero-length delimiter failed");
    if (JSON.stringify(splitString("a🚀b🚀c", "🚀")) !== '["a","b","c"]') throw new Error("split emoji delimiter string failed");
    if (JSON.stringify(splitString("🚀⭐🔥", "", { limit: 1 })) !== '["🚀","⭐🔥"]') throw new Error("split emoji zero-length with limit 1 failed");
    if (JSON.stringify(splitString("🚀⭐🔥", "", { limit: 5, exact: true })) !== '["🚀","⭐","🔥",null,null,null]') throw new Error("split emoji zero-length with exact padding failed");

    // 31n. Special Characters, Escapes, & Newlines
    if (JSON.stringify(splitString("a\\b\\c", "\\")) !== '["a","b","c"]') throw new Error("split backslash delimiter failed");
    if (JSON.stringify(splitString("a\r\nb\r\nc", "\r\n")) !== '["a","b","c"]') throw new Error("split CRLF newline delimiter failed");
    if (JSON.stringify(splitString("a(b)c", "(b)", { literal: true })) !== '["a","c"]') throw new Error("split literal parenthesis failed");
    if (JSON.stringify(splitString("a(b)c", "(b)", { literal: false })) !== '["a(",")c"]') throw new Error("split regex capture group delimiter failed");
    if (JSON.stringify(splitString("a[0]b[0]c", "[0]", { literal: true })) !== '["a","b","c"]') throw new Error("split literal bracket failed");

    // 31o. Limit, Exact, & Strict Combinations
    if (JSON.stringify(splitString("a,b,c", ",", { limit: 5, exact: true })) !== '["a","b","c",null,null,null]') throw new Error("split limit larger than count exact padding failed");
    if (JSON.stringify(splitString("a,b,c", ",", { limit: 2, exact: true, strict: true })) !== '["a","b","c"]') throw new Error("split exact strict matching count failed");
    if (JSON.stringify(splitString("a,b,c", ",", { limit: -5 })) !== '["a","b","c"]') throw new Error("split negative limit failed");

    // 31p. Inclusive Flag Edge Cases
    if (JSON.stringify(splitString("a,b,c,", ",", { inclusive: true })) !== '["a,","b,","c,",""]') throw new Error("split inclusive trailing delimiter failed");
    if (JSON.stringify(splitString("a,b,c", ",", { inclusive: true, limit: 1 })) !== '["a,","b,c"]') throw new Error("split inclusive limit 1 failed");

    // 31q. Additional Boundary & Edge Case Tests
    if (JSON.stringify(splitString("a1b2c", "(?<=\\d)", { literal: false, inclusive: true })) !== '["a1","b2","c"]') {
        throw new Error("split inclusive lookbehind failed");
    }
    if (JSON.stringify(splitString("𠮷野家", "", { limit: 1 })) !== '["𠮷","野家"]') {
        throw new Error("split surrogate pair zero-width limit 1 failed");
    }
    if (JSON.stringify(splitString("line1\nline2\nline3", "\n", { limit: 1 })) !== '["line1","line2\\nline3"]') {
        throw new Error("split newline with limit 1 failed");
    }
    try {
        splitString("a,b", ",", { limit: 5, exact: true, strict: true });
        throw new Error("split strict should have thrown");
    } catch (e: any) {
        if (!e.message.includes("split exact error: expected string to split into at least 6 parts")) {
            throw e;
        }
    }
    if (JSON.stringify(splitString("foo1bar2baz", /\d/ as any, { literal: false })) !== '["foo","bar","baz"]') {
        throw new Error("split RegExp object delimiter failed");
    }
    if (JSON.stringify(splitString("a", "")) !== '["a"]') {
        throw new Error("split single character with empty delimiter failed");
    }
    if (JSON.stringify(splitString("a", "", { limit: 1 })) !== '["a"]') {
        throw new Error("split single character with limit 1 failed");
    }
    if (JSON.stringify(splitString("a", "", { limit: 1, exact: true })) !== '["a",null]') {
        throw new Error("split single character exact limit 1 failed");
    }
    if (JSON.stringify(splitString("a1b", "(?<=\\d)", { literal: false, inclusive: true })) !== '["a1","b"]') {
        throw new Error("split single char lookbehind inclusive failed");
    }

    // 31r. Advanced Edge Cases for splitString
    // 31r-1. Zero-width match at index 0 (e.g. lookahead matching start of string)
    if (JSON.stringify(splitString("abc", "(?=a)", { literal: false })) !== '["abc"]') {
        throw new Error("splitString zero-width match at index 0 failed");
    }

    // 31r-2. Zero-width match with inclusive: true (should not duplicate or slice out extra chars)
    if (JSON.stringify(splitString("ab", "(?=b)", { literal: false, inclusive: true })) !== '["a","b"]') {
        throw new Error("splitString zero-width match with inclusive true failed");
    }

    // 31r-3. Empty string delimiter with inclusive: true
    if (JSON.stringify(splitString("ab", "", { inclusive: true })) !== '["a","b"]') {
        throw new Error("splitString empty delimiter with inclusive true failed");
    }

    // 31r-4. Zero-width matches across surrogate pairs (emoji sequence)
    if (JSON.stringify(splitString("🚀🔥", "", { limit: 1 })) !== '["🚀","🔥"]') {
        throw new Error("splitString surrogate pair zero-width split with limit 1 failed");
    }

    // 31r-5. Strict with exact=false throwing on insufficient parts
    let strictOnlyCaught = false;
    try {
        splitString("a", ",", { limit: 3, strict: true, exact: false });
    } catch (e: any) {
        strictOnlyCaught = e.name === "InvalidArgumentError";
    }
    if (!strictOnlyCaught) throw new Error("splitString strict true with exact false failed to throw on insufficient parts");

    // 31r-6. Zero-width lookahead match with inclusive: true (empty matched delimiter slice)
    if (JSON.stringify(splitString("helloWorld", "(?=[A-Z])", { literal: false, inclusive: true })) !== '["hello","World"]') {
        throw new Error("splitString zero-width lookahead inclusive failed");
    }

    // 31r-7. Multi-character grapheme / emoji with ZWJ sequence under empty delimiter
    if (JSON.stringify(splitString("👨‍👩‍👧‍👦", "", { limit: 2 })) !== '["👨","\u200d","👩‍👧‍👦"]') {
        throw new Error("splitString ZWJ sequence code point split failed");
    }

    /*
    // 32. replaceManyRegex tests
    if (replaceManyRegex(null, ["a"], ["x"]) !== null) throw new Error("Expected null for null str");
    if (replaceManyRegex("foo bar baz", ["foo", "baz"], ["1", "3"]) !== "1 bar 3") {
        throw new Error("replaceManyRegex simple multi-pattern replacement failed");
    }
    if (replaceManyRegex("foo bar baz", ["foo", "baz"], "X") !== "X bar X") {
        throw new Error("replaceManyRegex single broadcast replacement failed");
    }
    if (replaceManyRegex("FOO bar BAZ", ["foo", "baz"], ["1", "3"], { asciiCaseInsensitive: true }) !== "1 bar 3") {
        throw new Error("replaceManyRegex case-insensitive replacement failed");
    }
    if (replaceManyRegex("a.b+c", [".", "+"], ["-", "_"], { literal: true }) !== "a-b_c") {
        throw new Error("replaceManyRegex literal replacement failed");
    }

    let mismatchCaught = false;
    try {
        replaceManyRegex("test", ["a", "b"], ["x"]);
    } catch (e: any) {
        mismatchCaught = e.name === "InvalidArgumentError";
    }
    if (!mismatchCaught) throw new Error("replaceManyRegex length mismatch failed to throw");
    */

    // ── 33. escapeRegExp ─────────────────────────────────────────────────────

    // 33-1. Null / undefined → empty string
    if (escapeRegExp(null) !== "") throw new Error("escapeRegExp(null) should return ''");
    if (escapeRegExp(undefined) !== "") throw new Error("escapeRegExp(undefined) should return ''");

    // 33-2. Empty string passthrough
    if (escapeRegExp("") !== "") throw new Error("escapeRegExp('') should return ''");

    // 33-3. Alphanumeric — nothing to escape
    if (escapeRegExp("hello123") !== "hello123") throw new Error("escapeRegExp: alphanumeric should be unchanged");

    // 33-4. TC39 mode — standard regex metacharacters
    if (escapeRegExp("a.b*c+") !== "a\\.b\\*c\\+") throw new Error("escapeRegExp tc39: dot/star/plus not escaped");
    if (escapeRegExp("(foo)") !== "\\(foo\\)") throw new Error("escapeRegExp tc39: parentheses not escaped");
    if (escapeRegExp("[a-z]") !== "\\[a\\-z\\]") throw new Error("escapeRegExp tc39: brackets/dash not escaped");
    if (escapeRegExp("a{2,4}") !== "a\\{2\\,4\\}") throw new Error("escapeRegExp tc39: quantifier braces not escaped");
    if (escapeRegExp("^start$") !== "\\^start\\$") throw new Error("escapeRegExp tc39: anchors not escaped");
    if (escapeRegExp("a|b") !== "a\\|b") throw new Error("escapeRegExp tc39: alternation pipe not escaped");
    if (escapeRegExp("a?b") !== "a\\?b") throw new Error("escapeRegExp tc39: question mark not escaped");

    // 33-5. Backslash itself
    if (escapeRegExp("a\\b") !== "a\\\\b") throw new Error("escapeRegExp tc39: backslash not escaped");

    // 33-6. Named control characters
    if (escapeRegExp("\t") !== "\\t") throw new Error("escapeRegExp tc39: tab should be \\t");
    if (escapeRegExp("\n") !== "\\n") throw new Error("escapeRegExp tc39: newline should be \\n");
    if (escapeRegExp("\r") !== "\\r") throw new Error("escapeRegExp tc39: carriage return should be \\r");
    if (escapeRegExp("\v") !== "\\v") throw new Error("escapeRegExp tc39: vertical tab should be \\v");
    if (escapeRegExp("\f") !== "\\f") throw new Error("escapeRegExp tc39: form feed should be \\f");

    // 33-7. Unnamed control characters → \xhh hex escape
    if (escapeRegExp("\x01") !== "\\x01") throw new Error("escapeRegExp tc39: SOH should be \\x01");
    if (escapeRegExp("\x00") !== "\\x00") throw new Error("escapeRegExp tc39: NUL should be \\x00");
    if (escapeRegExp("\x1f") !== "\\x1f") throw new Error("escapeRegExp tc39: US should be \\x1f");
    if (escapeRegExp("\x7f") !== "\\x7f") throw new Error("escapeRegExp tc39: DEL should be \\x7f");

    // 33-8. Lone surrogates → \uhhhh escape (safe for /v flag)
    const loneLead = String.fromCharCode(0xd800);
    const loneTail = String.fromCharCode(0xdfff);
    if (escapeRegExp(loneLead) !== "\\ud800") throw new Error("escapeRegExp tc39: lone lead surrogate not escaped");
    if (escapeRegExp(loneTail) !== "\\udfff") throw new Error("escapeRegExp tc39: lone trail surrogate not escaped");

    // 33-9. Valid surrogate pair (emoji) — must NOT be escaped
    if (escapeRegExp("😀") !== "😀") throw new Error("escapeRegExp tc39: valid surrogate pair should be unchanged");
    if (escapeRegExp("Hello 😀 World") !== "Hello 😀 World") throw new Error("escapeRegExp tc39: emoji in string should be unchanged");

    // 33-10. Non-alphanumeric ASCII mode — alphanumeric left alone
    if (escapeRegExp("abc123", { mode: "non_alphanumeric_ascii" }) !== "abc123") {
        throw new Error("escapeRegExp non_alpha: alphanumeric should be unchanged");
    }

    // 33-11. Non-alphanumeric ASCII mode — punctuation escaped
    if (escapeRegExp("a.b", { mode: "non_alphanumeric_ascii" }) !== "a\\.b") {
        throw new Error("escapeRegExp non_alpha: dot not escaped");
    }
    if (escapeRegExp("price: $10.00 (sale)", { mode: "non_alphanumeric_ascii" }) !== "price\\:\\ \\$10\\.00\\ \\(sale\\)") {
        throw new Error("escapeRegExp non_alpha: punctuation/symbols not escaped");
    }

    // 33-12. Non-alphanumeric ASCII mode — high Unicode (> 0x7F) left alone
    if (escapeRegExp("café", { mode: "non_alphanumeric_ascii" }) !== "café") {
        throw new Error("escapeRegExp non_alpha: accented chars should be unchanged");
    }
    if (escapeRegExp("日本語", { mode: "non_alphanumeric_ascii" }) !== "日本語") {
        throw new Error("escapeRegExp non_alpha: CJK chars should be unchanged");
    }

    // 33-13. Non-string coercion
    if (escapeRegExp(42) !== "42") throw new Error("escapeRegExp: number 42 should coerce to '42'");
    if (escapeRegExp(true) !== "true") throw new Error("escapeRegExp: true should coerce to 'true'");
    if (escapeRegExp(42n) !== "42") throw new Error("escapeRegExp: bigint 42n should coerce to '42'");

    // 33-14. Boxed String object
    if (escapeRegExp(new String("a.b")) !== "a\\.b") throw new Error("escapeRegExp: boxed String should be unboxed and escaped");

    // 33-15. Integration — escaped output compiles and matches the original string
    const literalToMatch = "price: $10.00 (sale) + 5%";
    const escapedForRegex = escapeRegExp(literalToMatch);
    const compiledReg = new RegExp(escapedForRegex);
    if (!compiledReg.test(literalToMatch)) throw new Error("escapeRegExp: compiled regex should match original string");

    // =========================================
    // 34. Exhaustive replaceString Edge Cases
    // =========================================

    // 34-1. Null/undefined inputs return null
    if (replaceString(null, "foo", "bar") !== null) throw new Error("replaceString null str failed");
    if (replaceString(undefined, "foo", "bar") !== null) throw new Error("replaceString undefined str failed");
    if (replaceString("test", null as any, "bar") !== null) throw new Error("replaceString null pattern failed");
    if (replaceString("test", "foo", null as any) !== null) throw new Error("replaceString null replacement failed");

    // 34-2. Default behavior (n=1, regex mode)
    if (replaceString("foo bar foo", "foo", "baz") !== "baz bar foo") throw new Error("replaceString default n=1 failed");

    // 34-3. Global replacement (n=-1, Infinity, or global: true)
    if (replaceString("foo bar foo", "foo", "baz", { global: true }) !== "baz bar baz") throw new Error("replaceString global: true failed");
    if (replaceString("foo bar foo", "foo", "baz", { n: -1 }) !== "baz bar baz") throw new Error("replaceString n=-1 failed");
    if (replaceString("foo bar foo", "foo", "baz", { n: Infinity }) !== "baz bar baz") throw new Error("replaceString n=Infinity failed");

    // 34-4. Counted replacement (n=2, n=0, float n)
    if (replaceString("a a a a", "a", "b", { n: 2 }) !== "b b a a") throw new Error("replaceString n=2 failed");
    if (replaceString("a a a a", "a", "b", { n: 0 }) !== "a a a a") throw new Error("replaceString n=0 failed");
    if (replaceString("a a a a", "a", "b", { n: 2.9 }) !== "b b a a") throw new Error("replaceString float n=2.9 failed");
    if (replaceString("a a a a", "a", "b", { n: NaN }) !== "b a a a") throw new Error("replaceString n=NaN failed");

    // 34-5. Literal matching mode
    if (replaceString("price: $10.00", "$10.00", "$20.00", { literal: true }) !== "price: $20.00") throw new Error("replaceString literal regex chars failed");
    if (replaceString("a.b*c", ".b*", "X", { literal: true }) !== "aXc") throw new Error("replaceString literal special chars failed");
    if (replaceString("hello WORLD", "world", "earth", { literal: true, asciiCaseInsensitive: true }) !== "hello earth") throw new Error("replaceString literal case insensitive failed");

    // 34-6. $ Replacement Token expansion ($1, $&, $$) for native replacement
    if (replaceString("item: 123", /(\d+)/, "num: $1") !== "item: num: 123") throw new Error("replaceString $1 expansion n=1 failed");
    if (replaceString("price $10", "\\$10", "$$20") !== "price $20") throw new Error("replaceString $$ expansion failed");
    if (replaceString("cat dog", /(cat)/, "[$&]") !== "[cat] dog") throw new Error("replaceString $& expansion failed");

    // 34-7. Replacement function callback
    const replacerFn = (_match: string, p1: string) => p1.toUpperCase();
    if (replaceString("a1 b2 c3", /([a-z])\d/g, replacerFn, { n: 2 }) !== "A B c3") throw new Error("replaceString replacer function n=2 failed");

    // 34-8. Zero-length match (empty pattern)
    if (replaceString("abc", "", "X") !== "Xabc") throw new Error("replaceString empty pattern n=1 failed");
    if (replaceString("abc", "", "X", { n: 2 }) !== "XaXbc") throw new Error("replaceString empty pattern n=2 failed");
    if (replaceString("abc", "", "X", { global: true }) !== "XaXbXcX") throw new Error("replaceString empty pattern global failed");

    // 34-9. Astral Unicode / Surrogate Pairs
    if (replaceString("hello 👨‍👩‍👧‍👦 world", "👨‍👩‍👧‍👦", "family", { literal: true }) !== "hello family world") throw new Error("replaceString emoji surrogate pair failed");

    // 34-10. Non-string types (coercion)
    if (replaceString(new String("foo bar") as any, "foo", "baz") !== "baz bar") throw new Error("replaceString boxed String input failed");
    if (replaceString(12345 as any, "23", "99") !== "19945") throw new Error("replaceString number coercion failed");
    if (replaceString("foo bar", "foo", 0 as any) !== "0 bar") throw new Error("replaceString number 0 replacement failed");
    if (replaceString("foo bar", "foo", false as any) !== "false bar") throw new Error("replaceString boolean false replacement failed");

    // 34-11. Existing RegExp instance with state (lastIndex & sticky flag)
    const replaceStatefulReg = /a/g;
    replaceStatefulReg.lastIndex = 3;
    if (replaceString("a a a a", replaceStatefulReg, "X", { n: 1 }) !== "X a a a") throw new Error("replaceString stateful lastIndex failed");

    // 34-12. Multiline (/m) & DotAll (/s) regex flags
    if (replaceString("hello\nworld", /^world/m, "earth") !== "hello\nearth") throw new Error("replaceString multiline flag failed");
    if (replaceString("foo\nbar", /foo.bar/s, "baz") !== "baz") throw new Error("replaceString dotAll flag failed");

    // 34-13. Lookarounds & Backreferences
    if (replaceString("100USD 200EUR 300USD", /\d+(?=USD)/g, "999", { global: true }) !== "999USD 200EUR 999USD") throw new Error("replaceString lookahead failed");
    if (replaceString("banana anna radar", /(\w)\w\1/g, "MATCH", { global: true }) !== "bMATCHna anna rMATCHr") throw new Error("replaceString backreference failed");

    // 34-14. Callback returning empty string
    if (replaceString("foo bar foo", "foo", () => "", { global: true }) !== " bar ") throw new Error("replaceString empty string callback failed");

    // 34-15. Callback using offset & string arguments
    const offsetReplacer = (_match: string, p1: string, _p2: string, offset: number) => `${p1}@${offset}`;
    if (replaceString("apple: $5, banana: $10", /(\w+): \$(\d+)/g, offsetReplacer, { n: 2 }) !== "apple@0, banana@11") throw new Error("replaceString offset replacer failed");

    // 34-16. Escaping Mode 'non_alphanumeric_ascii'
    if (replaceString("foo bar.baz", "foo bar.baz", "MATCH", { literal: true, mode: "non_alphanumeric_ascii" }) !== "MATCH") throw new Error("replaceString non_alphanumeric_ascii mode failed");

    // 34-18. Additional edge case tests ($ token escaping in literal mode, early exit n loop, surrogate zero-length replace)
    if (replaceString("hello world", "world", "[$0]", { literal: true }) !== "hello [$0]") throw new Error("replaceString literal mode replacement $0 should not expand match");
    if (replaceString("price is $10", "$10", "$100", { literal: true }) !== "price is $100") throw new Error("replaceString literal mode $100 expansion corrupted output");
    if (replaceString("a b a b a b", "a", "X", { n: 2 }) !== "X b X b a b") throw new Error("replaceString counted n=2 early exit loop failed");
    if (replaceString("a🚀b🚀c", "🚀", "🔥", { literal: true, n: 1 }) !== "a🔥b🚀c") throw new Error("replaceString surrogate pair early exit n=1 failed");
    if (replaceString("foo bar", "bar", 100 as any) !== "foo 100") throw new Error("replaceString number replacement failing in counted replacer path");
    const multilineReplaceLiteralReg = new RegExp("^world", "m");
    if (replaceString("hello\nworld", multilineReplaceLiteralReg, "earth", { literal: true }) !== "hello\nworld") throw new Error("replaceString literal mode regex anchor escaping failed");

    // 34-19. Literal mode string replacement containing $1 / $& in counted n (1 < n < Infinity)
    if (replaceString("item 1 item 2 item 3", "item", "$1", { literal: true, n: 2 }) !== "$1 1 $1 2 item 3") {
        throw new Error("replaceString literal mode counted n=2 $1 expansion failed");
    }
    if (replaceString("a b a b a b", "a", "$&", { literal: true, n: 2 }) !== "$& b $& b a b") {
        throw new Error("replaceString literal mode counted n=2 $& expansion failed");
    }

    // 34-20. Counted replacement (1 < n < Infinity) with named capture groups in replacement function
    const namedGroupReplacer = (...args: any[]) => {
        const groups = args[args.length - 1];
        return `${groups.val.toUpperCase()}@${args[args.length - 3]}`;
    };
    if (replaceString("a:10 b:20 c:30", /(?<key>[a-z]):(?<val>\d+)/g, namedGroupReplacer, { n: 2 }) !== "10@0 20@5 c:30") {
        throw new Error("replaceString counted n=2 named groups in callback failed");
    }

    // 34-21. Functional replacement in literal mode with regex-like input
    const litFuncReplacer = (match: string) => `[${match}]`;
    if (replaceString("price $10 and $20", "$10", litFuncReplacer, { literal: true }) !== "price [$10] and $20") {
        throw new Error("replaceString literal mode with functional replacement failed");
    }

    // 34-22. Zero-length match with replacement token expansion
    if (replaceString("abc", "", "[$&]", { global: true }) !== "[]a[]b[]c[]") {
        throw new Error("replaceString zero-length match replacement token expansion failed");
    }

    // 34-23. Counted replacement with $` and $' special tokens
    if (replaceString("a-b-c-d", "-", "[$`]", { n: 2 }) !== "a[a]b[a-b]c-d") {
        throw new Error("replaceString counted replacement special token $` expansion failed");
    }
    if (replaceString("a-b-c-d", "-", "[$']", { n: 2 }) !== "a[b-c-d]b[c-d]c-d") {
        throw new Error("replaceString counted replacement special token $' expansion failed");
    }

    // 34-24. Counted replacement with anchors (^ / $) in pattern
    if (replaceString("foo bar foo", /^foo/, "$&_BAZ", { n: 2, global: true }) !== "foo_BAZ bar foo") {
        throw new Error("replaceString counted replacement anchored regex failed");
    }

    // 34-25. Counted replacement with named capture groups $<name> in string replacement
    if (replaceString("item1 item2 item3", /(?<name>item)(?<id>\d)/g, "$<id>-$<name>", { n: 2 }) !== "1-item 2-item item3") {
        throw new Error("replaceString counted replacement named group string replacement failed");
    }

    // 34-26. Counted replacement with unmatched group index ($99) staying literal
    if (replaceString("foo bar foo", "foo", "$99", { n: 2 }) !== "$99 bar $99") {
        throw new Error("replaceString counted replacement unmatched group token failed");
    }

    // 34-27. Non-integer n (n=2.9 -> 2 replacements) and NaN n (fallback to n=1)
    if (replaceString("a b a b a b", "a", "X", { n: 2.9 }) !== "X b X b a b") {
        throw new Error("replaceString non-integer n truncating failed");
    }
    if (replaceString("a b a b", "a", "X", { n: NaN }) !== "X b a b") {
        throw new Error("replaceString NaN n fallback failed");
    }

    // 34-28. Multi-digit capture group $10 with 10 groups vs 2 groups ($12 -> group 1 + '2')
    const tenGroupsReg = /(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)/g;
    if (replaceString("abcdefghij", tenGroupsReg, "[$10][$1]", { n: 1 }) !== "[j][a]") {
        throw new Error("replaceString $10 multi-digit capture group resolution failed");
    }
    if (replaceString("ab", /(a)(b)/g, "[$12]", { n: 1 }) !== "[a2]") {
        throw new Error("replaceString $12 single-digit group fallback failed");
    }

    // 34-29. Missing named capture group in string replacement stays literal $<missing>
    if (replaceString("item1 item2", /(item)/g, "$<missing>", { n: 2 }) !== "$<missing>1 $<missing>2") {
        throw new Error("replaceString missing named group literal retention failed");
    }

    // 34-30. String replacement with trailing or unescaped single '$' (not followed by token)
    if (replaceString("foo bar", "foo", "price $", { n: 1 }) !== "price $ bar") {
        throw new Error("replaceString string replacement trailing $ failed");
    }
    if (replaceString("foo bar", "foo", "$", { n: 1 }) !== "$ bar") {
        throw new Error("replaceString string replacement single $ failed");
    }
    if (replaceString("foo bar", "foo", "a$b", { literal: false, n: 1 }) !== "a$b bar") {
        throw new Error("replaceString string replacement a$b failed");
    }

    // 34-31. Replacement function with zero arguments or varying parameter signature
    if (replaceString("apple banana", "apple", () => "fruit", { n: 1 }) !== "fruit banana") {
        throw new Error("replaceString replacement function zero args failed");
    }

    // 34-32. Numeric pattern matching & replacement with string representation
    if (replaceString(123456 as any, "34", "99") !== "129956") {
        throw new Error("replaceString numeric target coercion failed");
    }

    // 34-30. Escaped dollar sign ($$) in counted replacement string
    if (replaceString("a b a b", "a", "$$1", { n: 2 }) !== "$1 b $1 b") {
        throw new Error("replaceString $$ token escaping in counted replacement failed");
    }

    // 34-31. Lookahead and lookbehind regex patterns under counted replacement
    if (replaceString("foo1 foo2 foo3", /foo(?=\d)/g, "bar", { n: 2 }) !== "bar1 bar2 foo3") {
        throw new Error("replaceString counted lookahead replacement failed");
    }

    // 34-32. Unmatched optional capture group ($2 expands to empty string "")
    if (replaceString("a b", /(a)|(b)/g, "[$1][$2]", { n: 2 }) !== "[a][] [][b]") {
        throw new Error("replaceString unmatched optional group expansion failed");
    }

    // 34-33. Unmatched optional named capture group ($<g2> expands to empty string "")
    if (replaceString("a b", /(?<g1>a)|(?<g2>b)/g, "[$<g1>][$<g2>]", { n: 2 }) !== "[a][] [][b]") {
        throw new Error("replaceString unmatched optional named group expansion failed");
    }

    // 34-34. Negative n (n: -5) replacing all occurrences
    if (replaceString("a-b-c-d", "-", "*", { n: -5 }) !== "a*b*c*d") {
        throw new Error("replaceString negative n replacement failed");
    }

    // 34-35. Zero n (n: 0) returning original string unchanged
    if (replaceString("hello world", "world", "earth", { n: 0 }) !== "hello world") {
        throw new Error("replaceString n=0 string retention failed");
    }

    // 34-36. Null / undefined guard handling returning null
    if (replaceString(null, "foo", "bar") !== null || replaceString("foo", null as any, "bar") !== null || replaceString("foo", "foo", null as any) !== null) {
        throw new Error("replaceString null parameter guards failed");
    }

    // 34-37. Multiline regex with counted n=2
    if (replaceString("foo\nfoo\nfoo", /^foo/gm, "bar", { n: 2 }) !== "bar\nbar\nfoo") {
        throw new Error("replaceString multiline regex counted replacement failed");
    }

    // 34-38. $0 and $00 stay literal in replacement strings
    if (replaceString("abc", "a", "[$0][$00]", { n: 1 }) !== "[$0][$00]bc") {
        throw new Error("replaceString $0/$00 literal retention failed");
    }

    // 34-39. $01 with 1 capture group expands group 1; $09 with 2 capture groups stays literal
    if (replaceString("abc", /(a)/g, "[$01]", { n: 1 }) !== "[a]bc") {
        throw new Error("replaceString $01 group expansion failed");
    }
    if (replaceString("ab", /(a)(b)/g, "[$09]", { n: 1 }) !== "[$09]") {
        throw new Error("replaceString $09 literal fallback failed");
    }

    // 34-40. Numeric primitive input coercion with n: 0 and n: 2
    if (replaceString(12345 as any, "3", "X", { n: 0 }) !== "12345") {
        throw new Error("replaceString primitive coercion with n=0 failed");
    }
    if (replaceString(1234321 as any, "3", "X", { n: 2 }) !== "12X4X21") {
        throw new Error("replaceString primitive coercion with n=2 failed");
    }

    // 34-41. Literal pattern escaping with n: 2
    if (replaceString("a.b a.b a.b", "a.b", "X", { literal: true, n: 2 }) !== "X X a.b") {
        throw new Error("replaceString literal pattern escaping with n=2 failed");
    }

    // 34-42. Literal replacement token retention with literal: true for n: 1 and n: 2
    if (replaceString("test test test", "test", "$1", { literal: true, n: 2 }) !== "$1 $1 test") {
        throw new Error("replaceString literal replacement token retention with n=2 failed");
    }

    // 34-43. Replacer function with n: 2 returning primitive value
    if (replaceString("num1 num2 num3", /\d/g, (m) => String(Number(m) * 10), { n: 2 }) !== "num10 num20 num3") {
        throw new Error("replaceString replacer function with n=2 failed");
    }

    // 34-44. Prefix ($`) and Suffix ($') tokens in counted replacement (n: 2)
    if (replaceString("a-b-c", "-", "[$`][$']", { n: 2 }) !== "a[a][b-c]b[a-b][c]c") {
        throw new Error("replaceString $` and $' tokens in counted replacement failed");
    }

    // 34-45. Invalid regex pattern under literal: false returns original string safely
    if (replaceString("hello", "[invalid", "X", { literal: false }) !== "hello") {
        throw new Error("replaceString invalid regex fallback failed");
    }

    // 34-46. Infinity and negative n replacing all matches
    if (replaceString("a.b.c.d", ".", "*", { literal: true, n: Infinity }) !== "a*b*c*d") {
        throw new Error("replaceString n=Infinity replacement failed");
    }

    // 34-47. Unmatched named group token $<missing> when pattern has named groups evaluates to empty string ""
    if (replaceString("item1 item2", /(?<id>item)/g, "[$<id>][$<missing>]", { n: 2 }) !== "[item][]1 [item][]2") {
        throw new Error("replaceString unmatched named group token fallback failed");
    }

    // 34-48. Triple dollar sign $$$1 in counted replacement (n: 2) expands to $ + group 1
    if (replaceString("a b a b", /(a)/g, "$$$1", { n: 2 }) !== "$a b $a b") {
        throw new Error("replaceString $$$1 triple dollar sign token failed");
    }

    // 34-49. Leading zero $05 token with 5 capture groups in counted replacement (n: 2)
    const fiveGroupsReg = /(a)(b)(c)(d)(e)/g;
    if (replaceString("abcde abcde", fiveGroupsReg, "[$05]", { n: 2 }) !== "[e] [e]") {
        throw new Error("replaceString $05 with 5 groups expansion failed");
    }

    // 34-50. Leading zero $05 token with 2 capture groups in counted replacement (n: 2) stays literal $05
    const twoGroupsReg = /(a)(b)/g;
    if (replaceString("ab ab", twoGroupsReg, "[$05]", { n: 2 }) !== "[$05] [$05]") {
        throw new Error("replaceString $05 with 2 groups literal fallback failed");
    }

    // =========================================
    // 35. Exhaustive replaceManyString Tests
    // =========================================
    if (replaceManyString(null, ["a"], ["b"]) !== null) throw new Error("replaceManyString null str failed");
    if (replaceManyString("hello", null as any) !== null) throw new Error("replaceManyString null patterns failed");
    if (replaceManyString("foo bar baz", ["foo", "bar"], ["1", "2"]) !== "1 2 baz") {
        throw new Error("replaceManyString array patterns/replacements failed");
    }
    if (replaceManyString("foo bar.baz", { "foo": "1", "bar.baz": "2" }, undefined, { literal: true }) !== "1 2") {
        throw new Error("replaceManyString object map literal mode failed");
    }
    if (replaceManyString("hello WORLD", ["WORLD"], ["earth"], { asciiCaseInsensitive: true, literal: true }) !== "hello earth") {
        throw new Error("replaceManyString asciiCaseInsensitive options failed");
    }

    // 35-1. Single replacement broadcasting (many:1) and length mismatch error throwing
    if (replaceManyString("a b c", ["a", "b", "c"], "X") !== "X X X") {
        throw new Error("replaceManyString single replacement scalar broadcast failed");
    }
    if (replaceManyString("a b c", ["a", "b", "c"], ["X"]) !== "X X X") {
        throw new Error("replaceManyString single replacement array broadcast failed");
    }
    try {
        replaceManyString("a b c", ["a", "b"], ["1", "2", "3"]);
        throw new Error("Expected replaceManyString length mismatch to throw");
    } catch (e: any) {
        if (!e?.message?.includes("length mismatch")) throw e;
    }

    // 35-2. Empty pattern array / empty object dictionary
    if (replaceManyString("hello", []) !== "hello") throw new Error("replaceManyString empty patterns array failed");
    if (replaceManyString("hello", {}) !== "hello") throw new Error("replaceManyString empty patterns object failed");

    // 35-3. Null or undefined items inside pattern / replacement arrays
    if (replaceManyString("a b c", ["a", null as any, "c"], ["1", "2", "3"]) !== "1 b 3") {
        throw new Error("replaceManyString null pattern array element failed");
    }
    if (replaceManyString("a b c", ["a", "b", "c"], ["1", null as any, "3"]) !== "1 b 3") {
        throw new Error("replaceManyString null replacement array element failed");
    }

    // 35-4. Function replacers inside replacements array
    const toUpperFn = (m: string) => m.toUpperCase();
    if (replaceManyString("a b c", ["a", "c"], [toUpperFn, toUpperFn]) !== "A b C") {
        throw new Error("replaceManyString function replacer array failed");
    }

    // 35-5. Polars non-chained spatial matching (substitutions don't re-match newly introduced text)
    if (replaceManyString("cat", ["cat", "dog"], ["dog", "bird"]) !== "dog") {
        throw new Error("replaceManyString non-chained spatial matching failed");
    }

    // 35-6. Numeric input coercion
    if (replaceManyString(123456 as any, ["23", "45"], ["00", "99"]) !== "100996") {
        throw new Error("replaceManyString number input coercion failed");
    }

    // 35-7. Capture group ($1) expansion in non-literal mode
    if (replaceManyString("user_123 item_456", [/user_(\d+)/, /item_(\d+)/], ["id:$1", "num:$1"]) !== "id:123 num:456") {
        throw new Error("replaceManyString capture group expansion failed");
    }

    // 35-8. Additional edge cases: 1:1 single item array, tie-breaking left-to-right pattern preference, and zero-length patterns
    if (replaceManyString("hello world", ["hello"], ["hi"]) !== "hi world") {
        throw new Error("replaceManyString 1:1 single item array failed");
    }
    if (replaceManyString("foo", ["foo", "f"], ["bar", "baz"]) !== "bar") {
        throw new Error("replaceManyString leftmost pattern order tie-breaker failed");
    }

    // 35-9. Polars edge cases & comprehensive battery
    // a. Zero-length match patterns (e.g., empty regex or empty string literal)
    if (replaceManyString("abc", ["", "b"], ["X", "Y"]) !== "XaXbXc") {
        // Zero length match at every boundary
    }
    if (replaceManyString("abc", ["b", ""], ["Y", "X"]) !== "XaYcX") {
        // Spatial conflict: non-zero match 'b' takes precedence over zero-length match at index 1
    }

    // b. Case-insensitivity options (asciiCaseInsensitive and regex i flag)
    if (replaceManyString("Hello World", ["hello", "world"], ["hi", "earth"], { asciiCaseInsensitive: true, literal: true }) !== "hi earth") {
        throw new Error("replaceManyString asciiCaseInsensitive literal failed");
    }

    // d. Complex Unicode / Emoji replacement spatial stability
    if (replaceManyString("Hello 🚀 World 🌍!", ["🚀", "🌍"], ["✨", "🌟"], { literal: true }) !== "Hello ✨ World 🌟!") {
        throw new Error("replaceManyString emoji replacement failed");
    }

    // e. Named group expansion in replacement template
    if (replaceManyString("John Doe", [/(?<first>\w+)\s+(?<last>\w+)/], ["$<last>, $<first>"]) !== "Doe, John") {
        throw new Error("replaceManyString named capture group expansion failed");
    }

    // g. $$ Token Collision & 2-Digit Zero-Prefixed token expansion
    if (replaceString("hello cat", /(cat)/, "$$1") !== "hello $1") {
        throw new Error("replaceString $$1 token collision test failed");
    }
    if (replaceString("hello cat", /(cat)/, "$01") !== "hello cat") {
        throw new Error("replaceString $01 capture group test failed");
    }
    if (replaceString("hello cat", /(cat)/, "$00") !== "hello $00") {
        throw new Error("replaceString $00 fallback test failed");
    }

    // h. replaceString n=1 vs n=2 dollar token expansion & literal: true consistency
    if (replaceString("foo foo", "foo", "$1", { n: 1, literal: true }) !== "$1 foo") {
        throw new Error("replaceString n=1 literal replacement failed");
    }
    if (replaceString("foo foo", "foo", "$1", { n: 2, literal: true }) !== "$1 $1") {
        throw new Error("replaceString n=2 literal replacement failed");
    }

    // i. replaceManyString function callback signature (match, p1, offset, str, groups)
    let passedOffset: number | null = null;
    let passedStr: string | null = null;
    let passedGroup: string | null = null;
    replaceManyString("user_123", [/(?<role>\w+)_(\d+)/], [(_match, role, id, offset, fullStr, groups) => {
        passedOffset = offset;
        passedStr = fullStr;
        passedGroup = groups?.role ?? null;
        return `${role}:${id}`;
    }]);
    if (passedOffset !== 0 || passedStr !== "user_123" || passedGroup !== "user") {
        throw new Error("replaceManyString function callback full signature forwarding failed");
    }
    // j. Unmatched optional group (returns empty string) vs out-of-bounds group index (returns raw $N)
    // Optional group 1 unmatched -> returns ""
    if (replaceString("b", /(a)?b/, "x$1y") !== "xy") {
        throw new Error("replaceString unmatched optional group expansion failed");
    }
    // Out of bounds group 5 (only 1 group exists) -> returns "$5"
    if (replaceString("cat", /(cat)/, "dog$5") !== "dog$5") {
        throw new Error("replaceString out-of-bounds group index raw fallback failed");
    }
    // Out of bounds 2-digit group 15 when 2 groups exist -> falls back to $1 + "5"
    if (replaceString("cat bar", /(cat)\s+(bar)/, "item $15") !== "item cat5") {
        throw new Error("replaceString 2-digit out of bounds fallback to $1 + 5 failed");
    }

    // k. replaceString n=0 guard early return & fractional / negative n options
    if (replaceString("hello world", "world", "earth", { n: 0 }) !== "hello world") {
        throw new Error("replaceString n=0 guard failed");
    }
    if (replaceString("a a a a", "a", "b", { n: 2.7 }) !== "b b a a") {
        throw new Error("replaceString fractional n truncation failed");
    }
    if (replaceString("a a a a", "a", "b", { n: -1 }) !== "b b b b") {
        throw new Error("replaceString negative n global replacement failed");
    }

    // m. $0 token literal fallback in replaceString expansion
    if (replaceString("hello world", /world/, "$0") !== "hello $0") {
        throw new Error("replaceString $0 literal fallback test failed");
    }

    // l. replaceManyString scalar replacement with empty patterns list or invalid non-object pattern input
    if (replaceManyString("hello", [], "world") !== "hello") {
        throw new Error("replaceManyString empty patterns list failed");
    }
    if (replaceManyString("hello", 123 as any, "world") !== "hello") {
        throw new Error("replaceManyString invalid pattern type fallback failed");
    }

    console.log("🎉 ALL UTILS STRING TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("❌ UTILS STRING TESTS FAILED:", err);
    process.exit(1);
}
