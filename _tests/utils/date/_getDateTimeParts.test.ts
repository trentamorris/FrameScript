declare const process: any;
import { _getDateTimeParts } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING _GETDATETIMEPARTS TESTS...");
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
    const d = new Date("2026-05-25T10:37:16.123Z");
    const partsUTC = _getDateTimeParts(d, "UTC");
    assertEqual(partsUTC, {
        year: 2026,
        month: 5,
        day: 25,
        hour: 10,
        minute: 37,
        second: 16,
        ms: 123,
        dayOfWeek: 1,
        timeZone: "UTC"
    }, "UTC date time parts");

    const partsNY = _getDateTimeParts(d, "America/New_York");
    assertEqual(partsNY.year, 2026, "NY year");
    assertEqual(partsNY.month, 5, "NY month");
    assertEqual(partsNY.day, 25, "NY day");
    assertEqual(partsNY.hour, 6, "NY EDT hour");
    assertEqual(partsNY.minute, 37, "NY minute");
    assertEqual(partsNY.second, 16, "NY second");
    assertEqual(partsNY.ms, 123, "NY ms");
    assertEqual(partsNY.timeZone, "America/New_York", "NY timezone tag");

    // Invalid timezone fallback to UTC
    const partsInvalid = _getDateTimeParts(d, "Invalid/TimeZone");
    assertEqual(partsInvalid.timeZone, "UTC", "invalid timezone falls back to UTC");
    assertEqual(partsInvalid.hour, 10, "invalid timezone uses UTC hour");


    console.log(`SUCCESS: All _getDateTimeParts tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: _getDateTimeParts test failed!`, err);
    process.exit(1);
}
