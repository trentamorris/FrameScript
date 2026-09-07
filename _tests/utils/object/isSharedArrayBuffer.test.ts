declare const process: any;
import { isSharedArrayBuffer } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISSHAREDARRAYBUFFER TESTS...");
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

    if (typeof SharedArrayBuffer !== "undefined") {
        assert(isSharedArrayBuffer(new SharedArrayBuffer(8)), "SharedArrayBuffer is true");
    }
    assert(!isSharedArrayBuffer(new ArrayBuffer(8)), "ArrayBuffer is not SharedArrayBuffer");
    assert(!isSharedArrayBuffer({ [Symbol.toStringTag]: "SharedArrayBuffer" }), "spoofed is false");
    assert(!isSharedArrayBuffer(null), "null is false");


    console.log(`SUCCESS: All isSharedArrayBuffer tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isSharedArrayBuffer test failed!`, err);
    process.exit(1);
}
