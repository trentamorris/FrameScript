declare const process: any;
import { strptime } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING STRPTIME TESTS...");
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
    // Parsing year 0-99
    const parsedYear50 = strptime("0050-05-25 10:37:16.123", { format: "%Y-%m-%d %H:%M:%S.%ms" });
    assert(parsedYear50 !== null && parsedYear50.getUTCFullYear() === 50 && parsedYear50.getUTCMonth() === 4 && parsedYear50.getUTCDate() === 25, "parsed year 50");

    // Invalid timezone fallback
    const dInvalidTz = new Date("2026-05-25T10:37:16.123Z");
    const parsedInvalidTz = strptime("2026-05-25 10:37:16.123", { format: "%Y-%m-%d %H:%M:%S.%ms", strict: true, defaultTimeZone: "Invalid/TimeZone_Name" });
    assertEqual(parsedInvalidTz?.getTime(), dInvalidTz.getTime(), "invalid timezone fallback to UTC");

    // Standard format parsing
    const parsedStd = strptime("2026-05-20 15:07:09", { format: "%Y-%m-%d %H:%M:%S" });
    assertEqual(parsedStd?.toISOString(), "2026-05-20T15:07:09.000Z", "standard format parsing");

    // defaultTimeZone EST / EDT
    const parsedEST = strptime("2026-01-15 12:00:00", { format: "%Y-%m-%d %H:%M:%S", defaultTimeZone: "America/New_York" });
    assertEqual(parsedEST?.toISOString(), "2026-01-15T17:00:00.000Z", "EST defaultTimeZone");

    const parsedEDT = strptime("2026-07-15 12:00:00", { format: "%Y-%m-%d %H:%M:%S", defaultTimeZone: "America/New_York" });
    assertEqual(parsedEDT?.toISOString(), "2026-07-15T16:00:00.000Z", "EDT defaultTimeZone");

    // Explicit offset in string overrides defaultTimeZone
    const parsedExplicitOffset = strptime("2026-01-15 12:00:00 +0900", { format: "%Y-%m-%d %H:%M:%S %z", defaultTimeZone: "America/New_York" });
    assertEqual(parsedExplicitOffset?.toISOString(), "2026-01-15T03:00:00.000Z", "explicit offset overrides defaultTimeZone");

    // defaultTimeZone: "UTC"
    const parsedUTC = strptime("2026-01-15 12:00:00", { format: "%Y-%m-%d %H:%M:%S", defaultTimeZone: "UTC" });
    assertEqual(parsedUTC?.toISOString(), "2026-01-15T12:00:00.000Z", "UTC defaultTimeZone");

    // Invalid string syntax returns null
    assertEqual(strptime("not-a-date", { format: "%Y-%m-%d" }), null, "invalid date string returns null");
    assertEqual(strptime("2026-02-31", { format: "%Y-%m-%d", strict: true }), null, "strict rejects invalid calendar date Feb 31");


    console.log(`SUCCESS: All strptime tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: strptime test failed!`, err);
    process.exit(1);
}
