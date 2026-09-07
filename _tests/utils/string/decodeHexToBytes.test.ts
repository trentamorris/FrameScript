declare const process: any;
import { decodeHexToBytes } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING DECODEHEXTOBYTES TESTS...");
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

    const bytes = decodeHexToBytes("68656c6c6f");
    assertEqual(Array.from(bytes), [104, 101, 108, 108, 111], "decodes hex to bytes");


    console.log(`SUCCESS: All decodeHexToBytes tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: decodeHexToBytes test failed!`, err);
    process.exit(1);
}
