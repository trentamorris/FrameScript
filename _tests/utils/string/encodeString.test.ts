declare const process: any;
import { encodeString } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ENCODESTRING TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error(`Assertion failed: ${msg}\n  Expected: ${e}\n  Actual:   ${a}`);
    }
    testsPassed++;
}

function assertThrows(fn: () => void, msg: string) {
    try {
        fn();
        throw new Error(`Expected function to throw: ${msg}`);
    } catch (err: any) {
        if (err.message.startsWith("Expected function to throw")) throw err;
        testsPassed++;
    }
}

try {
    // 1. Basic sanity
    assertEqual(encodeString("hello", "hex"), "68656c6c6f", "encodes simple ascii string to hex");
    assertEqual(encodeString("hello", "base64"), "aGVsbG8=", "encodes simple ascii string to base64");

    // 2. Null, undefined guards
    assertEqual(encodeString(null, "hex"), null, "null input returns null for hex");
    assertEqual(encodeString(null, "base64"), null, "null input returns null for base64");
    assertEqual(encodeString(undefined, "hex"), null, "undefined input returns null for hex");
    assertEqual(encodeString(undefined, "base64"), null, "undefined input returns null for base64");

    // 3. Empty string
    assertEqual(encodeString("", "hex"), "", "empty string produces empty hex");
    assertEqual(encodeString("", "base64"), "", "empty string produces empty base64");

    // 4. Whitespace variations
    assertEqual(encodeString(" ", "hex"), "20", "single space in hex");
    assertEqual(encodeString(" ", "base64"), "IA==", "single space in base64");
    assertEqual(encodeString("\t\r\n", "hex"), "090d0a", "whitespace controls in hex");
    assertEqual(encodeString("\t\r\n", "base64"), "CQ0K", "whitespace controls in base64");

    // 5. Binary zero & C0 Control Characters (NUL, SOH, etc.)
    assertEqual(encodeString("\0", "hex"), "00", "NUL byte in hex");
    assertEqual(encodeString("\0", "base64"), "AA==", "NUL byte in base64");
    assertEqual(encodeString("\x00\x01\x02\x7f", "hex"), "0001027f", "control codes in hex");

    // 6. Multibyte UTF-8 characters (Accented Latin, Greek, Cyrillic, CJK, Emoji)
    // "café" -> c (63) a (61) f (66) é (c3 a9)
    assertEqual(encodeString("café", "hex"), "636166c3a9", "multibyte utf-8 accent in hex");
    assertEqual(encodeString("café", "base64"), "Y2Fmw6k=", "multibyte utf-8 accent in base64");

    // CJK characters (3 bytes each)
    assertEqual(encodeString("中文", "hex"), "e4b8ade69687", "CJK characters in hex");
    assertEqual(encodeString("中文", "base64"), "5Lit5paH", "CJK characters in base64");

    // Astral plane emojis (4 bytes surrogate pairs)
    assertEqual(encodeString("🚀", "hex"), "f09f9a80", "rocket emoji in hex");
    assertEqual(encodeString("🚀", "base64"), "8J+agA==", "rocket emoji in base64");
    assertEqual(encodeString("👨‍👩‍👧‍👦", "hex"), "f09f91a8e2808df09f91a9e2808df09f91a7e2808df09f91a6", "complex ZWJ emoji in hex");

    // 7. Large input chunking edge cases (>8192 bytes threshold)
    const largeAscii = "A".repeat(16384);
    assertEqual(encodeString(largeAscii, "hex"), "41".repeat(16384), "large ASCII string (>16KB) encodes to hex");
    const encodedB64Large = encodeString(largeAscii, "base64");
    assert(encodedB64Large !== null && encodedB64Large.length > 0, "large ASCII string encodes to base64");

    // 8. Single byte edge cases (Padding variations in base64)
    // 1 char -> 2 padding '='
    assertEqual(encodeString("a", "base64"), "YQ==", "1 byte padding '=' x2");
    // 2 chars -> 1 padding '='
    assertEqual(encodeString("ab", "base64"), "YWI=", "2 bytes padding '=' x1");
    // 3 chars -> 0 padding
    assertEqual(encodeString("abc", "base64"), "YWJj", "3 bytes padding none");

    // 9. Primitive type coercion (numbers, booleans, objects passed as string)
    assertEqual(encodeString(12345 as any, "hex"), "3132333435", "coerces number to string");
    assertEqual(encodeString(true as any, "hex"), "74727565", "coerces boolean to string");

    // 10. Unsupported encoding throwing
    assertThrows(() => encodeString("test", "binary" as any), "throws on unsupported encoding 'binary'");
    assertThrows(() => encodeString("test", "utf8" as any), "throws on unsupported encoding 'utf8'");
    assertThrows(() => encodeString("test", "" as any), "throws on unsupported empty encoding");

    console.log(`SUCCESS: All encodeString tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: encodeString test failed!`, err);
    process.exit(1);
}
