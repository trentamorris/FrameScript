declare const process: any;
import { isValidFloat } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING ISVALIDFLOAT TESTS...");
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
    assert(isValidFloat(12.3), "isValidFloat(12.3) failed");
    assert(isValidFloat(0), "isValidFloat(0) failed");
    assert(!isValidFloat(NaN), "isValidFloat(NaN) should be false by default");
    assert(!isValidFloat(Infinity), "isValidFloat(Infinity) should be false by default");
    assert(isValidFloat(Infinity, { allowNonFiniteNumbers: true }), "isValidFloat(Infinity, allowNonFiniteNumbers)");
    assert(isValidFloat(12.3, { floatPrecision: "Float32" }), "isValidFloat Float32");


    console.log(`SUCCESS: All isValidFloat tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isValidFloat test failed!`, err);
    process.exit(1);
}
