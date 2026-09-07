declare const process: any;
import { isUint8ClampedArray } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISUINT8CLAMPEDARRAY TESTS...");
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

    assert(isUint8ClampedArray(new Uint8ClampedArray(4)), "Uint8ClampedArray is true");
    assert(!isUint8ClampedArray(new Uint8Array(4)), "Uint8Array is not Uint8ClampedArray");
    assert(!isUint8ClampedArray({ [Symbol.toStringTag]: "Uint8ClampedArray" }), "spoofed Uint8ClampedArray is false");
    assert(!isUint8ClampedArray(null), "null is false");


    console.log(`SUCCESS: All isUint8ClampedArray tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isUint8ClampedArray test failed!`, err);
    process.exit(1);
}
