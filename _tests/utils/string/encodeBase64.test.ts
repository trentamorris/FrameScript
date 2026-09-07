declare const process: any;
import { encodeBase64 } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ENCODEBASE64 TESTS...");
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

    assertEqual(encodeBase64("hello"), "aGVsbG8=", "encodes string to base64");


    console.log(`SUCCESS: All encodeBase64 tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: encodeBase64 test failed!`, err);
    process.exit(1);
}
