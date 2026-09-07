declare const process: any;
import { BIGINT_RANGES } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING BIGINT_RANGES TESTS...");
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
    assert(BIGINT_RANGES.Int64.min === -9223372036854775808n, "Int64 min");
    assert(BIGINT_RANGES.Int64.max === 9223372036854775807n, "Int64 max");
    assert(BIGINT_RANGES.UInt64.min === 0n, "UInt64 min");
    assert(BIGINT_RANGES.UInt64.max === 18446744073709551615n, "UInt64 max");


    console.log(`SUCCESS: All BIGINT_RANGES tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: BIGINT_RANGES test failed!`, err);
    process.exit(1);
}
