declare const process: any;
import { decodeBase64 } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING DECODEBASE64 TESTS...");
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

    assertEqual(decodeBase64("aGVsbG8="), "hello", "decodes base64 string");


    console.log(`SUCCESS: All decodeBase64 tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: decodeBase64 test failed!`, err);
    process.exit(1);
}
