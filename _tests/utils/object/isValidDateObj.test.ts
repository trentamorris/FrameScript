declare const process: any;
import { isValidDateObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISVALIDDATEOBJ TESTS...");
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

    assert(isValidDateObj(new Date()), "valid Date is valid date obj");
    assert(!isValidDateObj(new Date(NaN)), "invalid Date (NaN) is not valid date obj");
    assert(!isValidDateObj({ [Symbol.toStringTag]: "Date" }), "spoofed Date is not valid date obj");
    assert(!isValidDateObj(Object.create(Date.prototype)), "Date.prototype clone without slot is not valid date obj");
    assert(!isValidDateObj(null), "null is not valid date obj");
    assert(!isValidDateObj("2026-01-01"), "string date is not valid date obj");


    console.log(`SUCCESS: All isValidDateObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isValidDateObj test failed!`, err);
    process.exit(1);
}
