declare const process: any;
import { isBooleanObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISBOOLEANOBJ TESTS...");
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

    assert(isBooleanObj(Object(true)), "Object(true) is BooleanObj");
    assert(!isBooleanObj(true), "primitive boolean is not BooleanObj");
    assert(!isBooleanObj({ [Symbol.toStringTag]: "Boolean" }), "spoofed Boolean is not BooleanObj");
    assert(!isBooleanObj(null), "null is not BooleanObj");


    console.log(`SUCCESS: All isBooleanObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isBooleanObj test failed!`, err);
    process.exit(1);
}
