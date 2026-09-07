declare const process: any;
import { createUTCDate } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING CREATEUTCDATE TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error(`Assertion failed: ${msg}\n  Expected: ${e}\n  Actual:   ${a}`);
    }
    testsPassed++;
}

try {
    const d = createUTCDate(2026, 4, 25, 10, 37, 16, 123);
    assertEqual(d.toISOString(), "2026-05-25T10:37:16.123Z", "createUTCDate constructs accurate UTC date");

    // Default parameters
    const dDefault = createUTCDate(2026);
    assertEqual(dDefault.toISOString(), "2026-01-01T00:00:00.000Z", "createUTCDate defaults month=0, day=1, time=0");

    // Days in month calculation check
    const testDates = [
        new Date("2024-02-15T00:00:00Z"),
        new Date("2023-02-15T00:00:00Z"),
        new Date("2026-12-15T00:00:00Z"),
    ];
    for (const td of testDates) {
        const endOfMonthDate = createUTCDate(td.getUTCFullYear(), td.getUTCMonth() + 1, 0);
        const days = endOfMonthDate ? endOfMonthDate.getUTCDate() : null;
        const expectedDays = new Date(Date.UTC(td.getUTCFullYear(), td.getUTCMonth() + 1, 0)).getUTCDate();
        assertEqual(days, expectedDays, `daysInMonth for ${td.toISOString()}`);
    }

    // Historical year 50
    const d50 = createUTCDate(50, 1, 28);
    assertEqual(d50.getUTCFullYear(), 50, "handles year 50 correctly without Date 1900 bias");


    console.log(`SUCCESS: All createUTCDate tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: createUTCDate test failed!`, err);
    process.exit(1);
}
