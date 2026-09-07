declare const process: any;
import { decodeBase64ToBytes } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING DECODEBASE64TOBYTES TESTS...");
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

    const bytes = decodeBase64ToBytes("aGVsbG8=");
    assertEqual(Array.from(bytes), [104, 101, 108, 108, 111], "decodes base64 to bytes");


    console.log(`SUCCESS: All decodeBase64ToBytes tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: decodeBase64ToBytes test failed!`, err);
    process.exit(1);
}
