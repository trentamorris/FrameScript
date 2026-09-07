declare const process: any;
import { encodeHex } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ENCODEHEX TESTS...");
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

    assertEqual(encodeHex("hello"), "68656c6c6f", "encodes hex");


    console.log(`SUCCESS: All encodeHex tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: encodeHex test failed!`, err);
    process.exit(1);
}
