declare const process: any;
import { toValidFloat } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING TOVALIDFLOAT TESTS...");
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
    assertEqual(toValidFloat(12.3), 12.3, "toValidFloat(12.3) failed");
    assertEqual(toValidFloat(true), 1, "toValidFloat(true) failed");
    assertEqual(toValidFloat(10n), 10, "toValidFloat(10n) failed");
    assertEqual(toValidFloat(new Date(1000)), 1000, "toValidFloat(Date) failed");
    assertEqual(toValidFloat("12.3"), 12.3, "toValidFloat('12.3') failed");
    assertEqual(toValidFloat("Infinity"), Infinity, "toValidFloat('Infinity') failed");
    assertEqual(toValidFloat("-Infinity"), -Infinity, "toValidFloat('-Infinity') failed");
    assertEqual(toValidFloat(Infinity), Infinity, "toValidFloat(Infinity) failed");
    assert(Number.isNaN(toValidFloat("NaN") as number), "toValidFloat('NaN') should return NaN");
    assert(Number.isNaN(toValidFloat(NaN) as number), "toValidFloat(NaN) should return NaN");
    assertEqual(toValidFloat("invalid"), null, "toValidFloat('invalid') should return null");

    // options checks
    assertEqual(toValidFloat("12.3", { floatPrecision: "Float32" }), Math.fround(12.3), "toValidFloat precision option failed");
    assertEqual(toValidFloat("Infinity", { allowNonFiniteNumbers: false }), null, "toValidFloat allowNonFiniteNumbers: false failed");


    console.log(`SUCCESS: All toValidFloat tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toValidFloat test failed!`, err);
    process.exit(1);
}
