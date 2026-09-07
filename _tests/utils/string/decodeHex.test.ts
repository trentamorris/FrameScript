declare const process: any;
import { decodeHex } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING DECODEHEX TESTS...");
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

    assertEqual(decodeHex("68656c6c6f"), "hello", "decodes hex string");


    console.log(`SUCCESS: All decodeHex tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: decodeHex test failed!`, err);
    process.exit(1);
}
