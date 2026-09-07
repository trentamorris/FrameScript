declare const process: any;
import { isArrayBuffer } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISARRAYBUFFER TESTS...");
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

    assert(isArrayBuffer(new ArrayBuffer(8)), "new ArrayBuffer is ArrayBuffer");
    assert(!isArrayBuffer(new Uint8Array(8)), "Uint8Array is not ArrayBuffer");
    assert(!isArrayBuffer({ [Symbol.toStringTag]: "ArrayBuffer" }), "spoofed ArrayBuffer is not ArrayBuffer");
    assert(!isArrayBuffer(null), "null is not ArrayBuffer");


    console.log(`SUCCESS: All isArrayBuffer tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isArrayBuffer test failed!`, err);
    process.exit(1);
}
