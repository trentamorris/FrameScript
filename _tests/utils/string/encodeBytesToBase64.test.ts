declare const process: any;
import { encodeBytesToBase64 } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ENCODEBYTESTOBASE64 TESTS...");
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

    const bytes = new Uint8Array([104, 101, 108, 108, 111]);
    assertEqual(encodeBytesToBase64(bytes), "aGVsbG8=", "encodes bytes to base64");


    console.log(`SUCCESS: All encodeBytesToBase64 tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: encodeBytesToBase64 test failed!`, err);
    process.exit(1);
}
