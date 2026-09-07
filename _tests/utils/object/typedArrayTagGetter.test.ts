declare const process: any;
import { typedArrayTagGetter } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING TYPEDARRAYTAGGETTER TESTS...");
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

    assert(typeof typedArrayTagGetter === "function", "typedArrayTagGetter is a function getter");
    const u8 = new Uint8Array(2);
    assertEqual(typedArrayTagGetter?.call(u8), "Uint8Array", "gets tag for Uint8Array");
    const f64 = new Float64Array(2);
    assertEqual(typedArrayTagGetter?.call(f64), "Float64Array", "gets tag for Float64Array");


    console.log(`SUCCESS: All typedArrayTagGetter tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: typedArrayTagGetter test failed!`, err);
    process.exit(1);
}
