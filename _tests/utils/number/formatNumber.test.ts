declare const process: any;
import { formatNumber } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING FORMATNUMBER TESTS...");
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
    const format = formatNumber({ locale: "en-US", minimumFractionDigits: 2, useGrouping: true });
    assertEqual(format(1234567.89), "1,234,567.89", "formatNumber formatted 1234567.89");
    assertEqual(format(-1234.5), "-1,234.50", "formatNumber negative");
    assertEqual(format(100n), "100.00", "formatNumber bigint");
    assertEqual(format("invalid"), "NaN", "formatNumber fallback on invalid defaults to 'NaN'");
    const formatCustomFallback = formatNumber({ fallback: "" });
    assertEqual(formatCustomFallback("invalid"), "", "formatNumber custom fallback");


    console.log(`SUCCESS: All formatNumber tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: formatNumber test failed!`, err);
    process.exit(1);
}
