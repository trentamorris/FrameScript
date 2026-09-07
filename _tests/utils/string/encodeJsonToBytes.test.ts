declare const process: any;
import { encodeJsonToBytes } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ENCODEJSONTOBYTES TESTS...");
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

    const bytes = encodeJsonToBytes("hello");
    assert(bytes instanceof Uint8Array, "returns Uint8Array");
    assertEqual(bytes.length, 5, "byte length of 'hello'");


    console.log(`SUCCESS: All encodeJsonToBytes tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: encodeJsonToBytes test failed!`, err);
    process.exit(1);
}
