declare const process: any;
import { decodeString } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING DECODESTRING TESTS...");
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

    assertEqual(decodeString("68656c6c6f", "hex"), "hello", "decodes string hex");
    assertEqual(decodeString("aGVsbG8=", "base64"), "hello", "decodes string base64");
    assertEqual(decodeString(null, "hex"), null, "null returns null");


    console.log(`SUCCESS: All decodeString tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: decodeString test failed!`, err);
    process.exit(1);
}
