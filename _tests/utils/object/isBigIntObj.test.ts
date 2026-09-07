declare const process: any;
import { isBigIntObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISBIGINTOBJ TESTS...");
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

    assert(isBigIntObj(Object(100n)), "Object(100n) is BigIntObj");
    assert(!isBigIntObj(100n), "primitive bigint is not BigIntObj");
    assert(!isBigIntObj({ [Symbol.toStringTag]: "BigInt" }), "spoofed BigInt is not BigIntObj");
    assert(!isBigIntObj(null), "null is not BigIntObj");


    console.log(`SUCCESS: All isBigIntObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isBigIntObj test failed!`, err);
    process.exit(1);
}
