declare const process: any;
import { isDetachedBuffer } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISDETACHEDBUFFER TESTS...");
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

    const ab = new ArrayBuffer(8);
    assert(!isDetachedBuffer(ab), "fresh ArrayBuffer is not detached");
    assert(!isDetachedBuffer(null), "null is not detached buffer");
    assert(!isDetachedBuffer({}), "plain object is not detached buffer");


    console.log(`SUCCESS: All isDetachedBuffer tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isDetachedBuffer test failed!`, err);
    process.exit(1);
}
