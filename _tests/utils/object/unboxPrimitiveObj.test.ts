declare const process: any;
import { unboxPrimitiveObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING UNBOXPRIMITIVEOBJ TESTS...");
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

    assertEqual(unboxPrimitiveObj(Object(123)), 123, "unboxes number");
    assertEqual(unboxPrimitiveObj(Object("abc")), "abc", "unboxes string");
    assertEqual(unboxPrimitiveObj(Object(true)), true, "unboxes boolean");
    assertEqual(unboxPrimitiveObj(Object(100n)), 100n, "unboxes bigint");
    const sym = Symbol("s");
    assert(unboxPrimitiveObj(Object(sym)) === sym, "unboxes symbol");
    assertEqual(unboxPrimitiveObj(123), 123, "primitive number returned as-is");
    assertEqual(unboxPrimitiveObj(null), null, "null returned as-is");
    const plain = { a: 1 };
    assert(unboxPrimitiveObj(plain) === plain, "plain object returned as-is");


    console.log(`SUCCESS: All unboxPrimitiveObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: unboxPrimitiveObj test failed!`, err);
    process.exit(1);
}
