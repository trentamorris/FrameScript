declare const process: any;
import { isError } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISERROR TESTS...");
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

    assert(isError(new Error("boom")), "Error is Error");
    assert(isError(new TypeError("type")), "TypeError is Error");
    assert(isError(new RangeError("range")), "RangeError is Error");
    assert(!isError({ message: "boom" }), "duck-typed object is not Error");
    assert(!isError(null), "null is not Error");


    console.log(`SUCCESS: All isError tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isError test failed!`, err);
    process.exit(1);
}
