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

try {

    assertEqual(encodeString("hello", "hex"), "68656c6c6f", "encodes string hex");
    assertEqual(encodeString("hello", "base64"), "aGVsbG8=", "encodes string base64");
    assertEqual(encodeString(null, "hex"), null, "null returns null");


    console.log(`SUCCESS: All encodeString tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: encodeString test failed!`, err);
    process.exit(1);
}
