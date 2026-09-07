declare const process: any;
import { isStringObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISSTRINGOBJ TESTS...");
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

    assert(isStringObj(Object("hello")), "Object('hello') is StringObj");
    assert(!isStringObj("hello"), "primitive string is not StringObj");
    assert(!isStringObj({ [Symbol.toStringTag]: "String" }), "spoofed String is not StringObj");
    assert(!isStringObj(null), "null is not StringObj");


    console.log(`SUCCESS: All isStringObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isStringObj test failed!`, err);
    process.exit(1);
}
