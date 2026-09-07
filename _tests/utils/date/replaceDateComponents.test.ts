declare const process: any;
import { replaceDateComponents } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING REPLACEDATECOMPONENTS TESTS...");
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
    const baseD = new Date("2026-05-20T14:30:15.500Z");
    const replacedYear = replaceDateComponents(baseD, { year: 2030, timeZone: "UTC" });
    assertEqual(replacedYear.toISOString(), "2030-05-20T14:30:15.500Z", "replace year failed");
    const replacedAll = replaceDateComponents(baseD, { year: 2024, month: 2, day: 29, hour: 0, minute: 0, second: 0, ms: 0, timeZone: "UTC" });
    assertEqual(replacedAll.toISOString(), "2024-02-29T00:00:00.000Z", "replace leap day failed");

    // negative day indexing (from month end)
    const lastDayMay = replaceDateComponents(baseD, { day: -1, timeZone: "UTC" });
    assertEqual(lastDayMay.toISOString(), "2026-05-31T14:30:15.500Z", "replace day: -1 failed");
    const secondLastDayMay = replaceDateComponents(baseD, { day: -2, timeZone: "UTC" });
    assertEqual(secondLastDayMay.toISOString(), "2026-05-30T14:30:15.500Z", "replace day: -2 failed");
    const lastDayFebLeap = replaceDateComponents(baseD, { year: 2024, month: 2, day: -1, timeZone: "UTC" });
    assertEqual(lastDayFebLeap.toISOString(), "2024-02-29T14:30:15.500Z", "replace Feb leap -1 failed");
    const lastDayFebNonLeap = replaceDateComponents(baseD, { year: 2023, month: 2, day: -1, timeZone: "UTC" });
    assertEqual(lastDayFebNonLeap.toISOString(), "2023-02-28T14:30:15.500Z", "replace Feb non-leap -1 failed");

    // negative month and time component indexing
    const endOfYear = replaceDateComponents(baseD, { month: -1, day: -1, hour: -1, minute: -1, second: -1, ms: -1, timeZone: "UTC" });
    assertEqual(endOfYear.toISOString(), "2026-12-31T23:59:59.999Z", "replace end of year failed");
    const secondToLastMonth = replaceDateComponents(baseD, { month: -2, timeZone: "UTC" });
    assertEqual(secondToLastMonth.toISOString(), "2026-11-20T14:30:15.500Z", "replace month: -2 failed");

    // Full negative month spectrum (-1 to -12)
    const expectedMonths = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    for (let i = 1; i <= 12; i++) {
        const rMonth = replaceDateComponents(baseD, { month: -i, day: 1, timeZone: "UTC" });
        const expectedM = expectedMonths[i - 1];
        assertEqual(rMonth.getUTCMonth() + 1, expectedM, `Negative month -${i} failed`);
    }

    // All 12 months last day (-1) with leap/non-leap year checks
    const daysIn2024 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const daysIn2025 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (let m = 1; m <= 12; m++) {
        const leapEnd = replaceDateComponents(baseD, { year: 2024, month: m, day: -1, timeZone: "UTC" });
        assertEqual(leapEnd.getUTCDate(), daysIn2024[m - 1], `2024 month ${m} day: -1 failed`);

        const nonLeapEnd = replaceDateComponents(baseD, { year: 2025, month: m, day: -1, timeZone: "UTC" });
        assertEqual(nonLeapEnd.getUTCDate(), daysIn2025[m - 1], `2025 month ${m} day: -1 failed`);
    }

    // Deep negative day offsets within a month (-1 to -31)
    for (let offset = 1; offset <= 31; offset++) {
        const janDay = replaceDateComponents(baseD, { month: 1, day: -offset, timeZone: "UTC" });
        const expectedDay = 31 + 1 - offset;
        assertEqual(janDay.getUTCDate(), expectedDay, `Jan negative day -${offset} failed`);
    }

    // Hour negative indexing (-1 = 23, -24 = 0)
    for (let h = 1; h <= 24; h++) {
        const rHour = replaceDateComponents(baseD, { hour: -h, timeZone: "UTC" });
        assertEqual(rHour.getUTCHours(), 24 - h, `Hour -${h} failed`);
    }

    // Minute negative indexing (-1 = 59, -60 = 0)
    for (let min = 1; min <= 60; min++) {
        const rMin = replaceDateComponents(baseD, { minute: -min, timeZone: "UTC" });
        assertEqual(rMin.getUTCMinutes(), 60 - min, `Minute -${min} failed`);
    }

    // Second negative indexing (-1 = 59, -60 = 0)
    for (let s = 1; s <= 60; s++) {
        const rSec = replaceDateComponents(baseD, { second: -s, timeZone: "UTC" });
        assertEqual(rSec.getUTCSeconds(), 60 - s, `Second -${s} failed`);
    }

    // Millisecond negative indexing
    const msChecks = [
        { neg: -1, expected: 999 },
        { neg: -250, expected: 750 },
        { neg: -500, expected: 500 },
        { neg: -999, expected: 1 },
        { neg: -1000, expected: 0 },
    ];
    for (const { neg, expected } of msChecks) {
        const rMs = replaceDateComponents(baseD, { ms: neg, timeZone: "UTC" });
        assertEqual(rMs.getUTCMilliseconds(), expected, `Ms ${neg} failed`);
    }

    // Complex combination of negative and positive components
    const combo1 = replaceDateComponents(baseD, {
        year: 2028,
        month: -11,
        day: -1,
        hour: -1,
        minute: -1,
        second: -1,
        ms: -1,
        timeZone: "UTC"
    });
    assertEqual(combo1.toISOString(), "2028-02-29T23:59:59.999Z", "Complex negative leap combo failed");

    // Preserving unspecified fields while replacing negative fields
    const morningD = new Date("2026-07-04T08:15:30.100Z");
    const replacedOnlyDay = replaceDateComponents(morningD, { day: -1, timeZone: "UTC" });
    assertEqual(replacedOnlyDay.toISOString(), "2026-07-31T08:15:30.100Z", "Preserving hours/mins with negative day failed");

    // Timezone awareness with negative components
    const nyDate = new Date("2026-01-15T00:00:00Z");
    const nyMonthEnd = replaceDateComponents(nyDate, { day: -1, timeZone: "America/New_York" });
    assertEqual(nyMonthEnd.toISOString(), "2026-01-31T19:00:00.000Z", "Timezone aware negative day failed");


    console.log(`SUCCESS: All replaceDateComponents tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: replaceDateComponents test failed!`, err);
    process.exit(1);
}
