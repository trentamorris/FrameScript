declare const process: any;
import { isValidNumber } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING ISVALIDNUMBER TESTS...");
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
    assert(isValidNumber(12.3), "isValidNumber(12.3) failed");
    assert(isValidNumber(0), "isValidNumber(0) failed");
    assert(!isValidNumber(NaN), "isValidNumber(NaN) should be false");
    assert(!isValidNumber(Infinity), "isValidNumber(Infinity) should be false");
    assert(isValidNumber(NaN, { allowNaN: true }), "isValidNumber(NaN, allowNaN) failed");
    assert(isValidNumber(Infinity, { allowNonFiniteNumbers: true }), "isValidNumber(Infinity, allowNonFiniteNumbers) failed");
    assert(!isValidNumber("123" as any), "isValidNumber string should be false");
    assert(!isValidNumber(null as any), "isValidNumber null should be false");


    console.log(`SUCCESS: All isValidNumber tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isValidNumber test failed!`, err);
    process.exit(1);
}
