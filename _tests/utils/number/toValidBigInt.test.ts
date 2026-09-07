declare const process: any;
import { toValidBigInt } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING TOVALIDBIGINT TESTS...");
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
    assertEqual(toValidBigInt(9223372036854775807n), 9223372036854775807n, "BigInt: native bigint failed");
    assertEqual(toValidBigInt(true), 1n, "BigInt: boolean true failed");
    assertEqual(toValidBigInt("9223372036854775807"), 9223372036854775807n, "BigInt: string parsing precision failed");
    assertEqual(toValidBigInt("1.234,56", { truncate: true }), 1234n, "BigInt: European mixed truncate failed");
    assertEqual(toValidBigInt("1.234,56", { truncate: false }), null, "BigInt: European mixed strict float check failed");
    assertEqual(toValidBigInt("1.234,00", { truncate: false }), 1234n, "BigInt: European mixed trailing zero float check failed");
    assertEqual(toValidBigInt("(1,234.00)"), -1234n, "BigInt: accounting layout parsing failed");
    assertEqual(toValidBigInt("1_000_000"), 1000000n, "BigInt: underscores failed");


    console.log(`SUCCESS: All toValidBigInt tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toValidBigInt test failed!`, err);
    process.exit(1);
}
