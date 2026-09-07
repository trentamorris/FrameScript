declare const process: any;
import { isUint8Array } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISUINT8ARRAY TESTS...");
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

    assert(isUint8Array(new Uint8Array(4)), "Uint8Array is true");
    assert(!isUint8Array(new Uint8ClampedArray(4)), "Uint8ClampedArray is not Uint8Array");
    assert(!isUint8Array(new Int8Array(4)), "Int8Array is not Uint8Array");
    assert(!isUint8Array({ [Symbol.toStringTag]: "Uint8Array" }), "spoofed Uint8Array is false");
    assert(!isUint8Array(null), "null is false");


    console.log(`SUCCESS: All isUint8Array tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isUint8Array test failed!`, err);
    process.exit(1);
}
