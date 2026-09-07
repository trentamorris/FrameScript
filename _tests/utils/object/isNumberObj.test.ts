declare const process: any;
import { isNumberObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISNUMBEROBJ TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    if (typeof actual === "bigint" || typeof expected === "bigint") {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${msg}\n  Expected: ${expected}\n  Actual:   ${actual}`);
        }
    } else {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) {
            throw new Error(`Assertion failed: ${msg}\n  Expected: ${e}\n  Actual:   ${a}`);
        }
    }
    testsPassed++;
}

try {

    assert(isNumberObj(Object(123)), "Object(123) is NumberObj");
    assert(!isNumberObj(123), "primitive number is not NumberObj");
    assert(!isNumberObj({ [Symbol.toStringTag]: "Number" }), "spoofed Number is not NumberObj");
    assert(!isNumberObj(null), "null is not NumberObj");


    console.log(`SUCCESS: All isNumberObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isNumberObj test failed!`, err);
    process.exit(1);
}
