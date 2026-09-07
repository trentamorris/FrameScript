declare const process: any;
import { isBusinessDay } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING ISBUSINESSDAY TESTS...");
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
    // Invalid / non-date inputs
    const invalidInputs: any[] = [
        new Date("invalid"),
        null,
        undefined,
        "2026-05-25",
        123456789,
        true,
        false,
        {},
        [],
        NaN,
        Symbol("d")
    ];
    for (const inp of invalidInputs) {
        assertEqual(isBusinessDay(inp), null, `Expected isBusinessDay(${String(inp)}) to return null`);
    }

    // Standard 7 weekdays verification (2026-05-17 to 2026-05-23: Sun -> Sat)
    const week2026 = [
        { date: new Date("2026-05-17T00:00:00Z"), day: "Sun", isBday: false },
        { date: new Date("2026-05-18T00:00:00Z"), day: "Mon", isBday: true },
        { date: new Date("2026-05-19T00:00:00Z"), day: "Tue", isBday: true },
        { date: new Date("2026-05-20T00:00:00Z"), day: "Wed", isBday: true },
        { date: new Date("2026-05-21T00:00:00Z"), day: "Thu", isBday: true },
        { date: new Date("2026-05-22T00:00:00Z"), day: "Fri", isBday: true },
        { date: new Date("2026-05-23T00:00:00Z"), day: "Sat", isBday: false },
    ];
    for (const w of week2026) {
        assertEqual(isBusinessDay(w.date), w.isBday, `Default isBusinessDay failed for ${w.day}`);
    }

    // Sub-day timestamps
    const timeVariations = [
        new Date("2026-05-18T00:00:00.000Z"),
        new Date("2026-05-18T00:00:00.001Z"),
        new Date("2026-05-18T06:30:15.500Z"),
        new Date("2026-05-18T12:00:00.000Z"),
        new Date("2026-05-18T18:45:00.999Z"),
        new Date("2026-05-18T23:59:59.999Z"),
    ];
    for (const tv of timeVariations) {
        assertEqual(isBusinessDay(tv), true, `Expected time variation ${tv.toISOString()} to be business day`);
    }

    // excludeWeekdays permutations
    const monDate = new Date("2026-05-18T12:00:00Z");
    const satDate = new Date("2026-05-23T12:00:00Z");
    const sunDate = new Date("2026-05-24T12:00:00Z");

    for (const w of week2026) {
        assertEqual(isBusinessDay(w.date, { excludeWeekdays: [] }), true, `Expected ${w.day} with excludeWeekdays=[] to be true`);
        assertEqual(isBusinessDay(w.date, { excludeWeekdays: [0, 1, 2, 3, 4, 5, 6] }), false, `Expected ${w.day} with all days excluded to be false`);
    }

    assertEqual(isBusinessDay(monDate, { excludeWeekdays: [1, 2, 3, 4, 5] }), false, "Expected Mon excluded in inverted week");
    assertEqual(isBusinessDay(satDate, { excludeWeekdays: [1, 2, 3, 4, 5] }), true, "Expected Sat to be business day in inverted week");
    assertEqual(isBusinessDay(sunDate, { excludeWeekdays: [1, 2, 3, 4, 5] }), true, "Expected Sun to be business day in inverted week");

    // Holidays
    const mixedHolidayArray: any[] = [
        "2026-05-18",
        "2026-05-19T14:30:00Z",
        new Date("2026-05-20T00:00:00Z"),
        new Date("2026-05-21T23:59:59Z"),
        Date.UTC(2026, 4, 22),
        "invalid-date-string",
        null,
        undefined,
        NaN,
        {},
    ];
    assertEqual(isBusinessDay(new Date("2026-05-18T00:00:00Z"), { holidays: mixedHolidayArray }), false, "holiday 05-18");
    assertEqual(isBusinessDay(new Date("2026-05-19T00:00:00Z"), { holidays: mixedHolidayArray }), false, "holiday 05-19");
    assertEqual(isBusinessDay(new Date("2026-05-20T12:00:00Z"), { holidays: mixedHolidayArray }), false, "holiday 05-20");
    assertEqual(isBusinessDay(new Date("2026-05-21T08:00:00Z"), { holidays: mixedHolidayArray }), false, "holiday 05-21");
    assertEqual(isBusinessDay(new Date("2026-05-22T00:00:00Z"), { holidays: mixedHolidayArray }), false, "holiday 05-22");
    assertEqual(isBusinessDay(new Date("2026-05-25T00:00:00Z"), { holidays: mixedHolidayArray }), true, "next week not holiday");

    // Holiday Set
    const holidaySet = new Set<number>([Date.UTC(2026, 4, 18), Date.UTC(2026, 4, 20)]);
    assertEqual(isBusinessDay(new Date("2026-05-18T00:00:00Z"), { holidays: holidaySet }), false, "Set holiday Mon");
    assertEqual(isBusinessDay(new Date("2026-05-19T00:00:00Z"), { holidays: holidaySet }), true, "Tue not in set");
    assertEqual(isBusinessDay(new Date("2026-05-20T00:00:00Z"), { holidays: holidaySet }), false, "Set holiday Wed");

    // Leap day & new year
    const leapDay = new Date("2024-02-29T12:00:00Z");
    assertEqual(isBusinessDay(leapDay), true, "leap day default");
    assertEqual(isBusinessDay(leapDay, { holidays: ["2024-02-29"] }), false, "leap day holiday");


    console.log(`SUCCESS: All isBusinessDay tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isBusinessDay test failed!`, err);
    process.exit(1);
}
