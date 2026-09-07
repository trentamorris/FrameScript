declare const process: any;
import { isValidBigInt } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING ISVALIDBIGINT TESTS...");
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
    assert(isValidBigInt(0n), "isValidBigInt: 0n failed");
    assert(isValidBigInt(10n), "isValidBigInt: primitive bigint failed");
    assert(!isValidBigInt(10 as any), "isValidBigInt: primitive number should return false");
    assert(isValidBigInt(9223372036854775807n, { range: "Int64" }), "Int64 max valid");
    assert(!isValidBigInt(-1n, { range: "UInt64" }), "UInt64 negative invalid");


    console.log(`SUCCESS: All isValidBigInt tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isValidBigInt test failed!`, err);
    process.exit(1);
}
