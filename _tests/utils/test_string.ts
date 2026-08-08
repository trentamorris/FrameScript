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
    extractRegexGroups
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
    if (escapeRegExp(/a.b*c/gi) !== "\\/a\\.b\\*c\\/gi") throw new Error("escapeRegExp RegExp object input failed");
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
    if (escapeRegExp("\0\t\n\v\f\r") !== "\\0\\t\\n\\v\\f\\r") throw new Error("escapeRegExp control escapes failed");

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

    // 24i-2. Sticky flag 'y' stripping & unanchored free-position matching
    const cleanSticky = toCleanRegExp("hello world", /world/y);
    if (cleanSticky?.reg.flags.includes("y")) {
        throw new Error("toCleanRegExp failed to strip sticky 'y' flag");
    }
    const stickyMatchNotAtStart = extractRegexEngine("hello world", /world/y, { groupIndex: 0 })?.[0]?.["0"];
    if (stickyMatchNotAtStart !== "world") {
        throw new Error(`extractRegexEngine with sticky /world/y failed to match unanchored: got ${stickyMatchNotAtStart}`);
    }

    // 24i-3. Optional capture group returning null (no fallback to group 0)
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

    // 24p-16. extractRegex asciiCaseInsensitive: false stripping existing /i flag
    const stripCaseInsensitiveRes = extractRegex("HELLO", /hello/i, { asciiCaseInsensitive: false, groupIndex: 0 });
    if (stripCaseInsensitiveRes !== null) {
        throw new Error(`extractRegex asciiCaseInsensitive: false failed to strip /i flag: expected null, got ${JSON.stringify(stripCaseInsensitiveRes)}`);
    }

    console.log("🎉 ALL UTILS STRING TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("❌ UTILS STRING TESTS FAILED:", err);
    process.exit(1);
}
