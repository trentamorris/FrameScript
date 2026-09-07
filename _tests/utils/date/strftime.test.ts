declare const process: any;
import { strftime } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING STRFTIME TESTS...");
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
    // Inline time formatting & basic replacement
    const dStrftime = new Date("2026-05-25T10:37:16.123Z");
    assertEqual(strftime(dStrftime, { format: "%Y-%m-%d %H:%M:%S.%ms %Z %z" }), "2026-05-25 10:37:16.123 UTC +0000", "strftime format correctness");

    // Year 0-99
    const dYear50 = new Date(0);
    dYear50.setUTCFullYear(50, 4, 25);
    dYear50.setUTCHours(10, 37, 16, 123);
    assertEqual(strftime(dYear50, { format: "%Y-%m-%d %H:%M:%S.%ms" }), "0050-05-25 10:37:16.123", "strftime year 50");

    // Invalid timezone fallback
    assertEqual(strftime(dStrftime, { format: "%Y-%m-%d %H:%M:%S.%ms %Z %z", timeZone: "Invalid/TimeZone_Name" }), "2026-05-25 10:37:16.123 UTC +0000", "fallback to UTC");

    // All directives
    const refDate = new Date("2026-05-20T15:07:09.045Z");
    const allDirectivesFormatted = strftime(refDate, {
        format: "%Y|%y|%m|%d|%e|%H|%I|%p|%M|%S|%ms|%f|%u|%w|%V|%G|%j|%%"
    });
    assertEqual(allDirectivesFormatted, "2026|26|05|20|20|15|03|PM|07|09|045|045000|3|3|21|2026|140|%", "all directives");

    // Shorthands
    assertEqual(strftime(refDate, { format: "%F %T %R %D" }), "2026-05-20 15:07:09 15:07 05/20/26", "shorthands");

    // ISO week & year edge cases
    const dDec30 = new Date("2024-12-30T00:00:00.000Z");
    assertEqual(strftime(dDec30, { format: "%G-W%V" }), "2025-W01", "2024-12-30 ISO week 1 of 2025");
    const dJan1 = new Date("2027-01-01T00:00:00.000Z");
    assertEqual(strftime(dJan1, { format: "%G-W%V" }), "2026-W53", "2027-01-01 ISO week 53 of 2026");

    // Timezone specific formatting
    const nyFormatted = strftime(refDate, { format: "%Y-%m-%d %H:%M:%S %Z %z", timeZone: "America/New_York" });
    assertEqual(nyFormatted, "2026-05-20 11:07:09 EDT -0400", "NY timezone format");


    console.log(`SUCCESS: All strftime tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: strftime test failed!`, err);
    process.exit(1);
}
