declare const process: any;
import { getTimeZoneOffset } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING GETTIMEZONEOFFSET TESTS...");
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
    const janDate = new Date("2026-01-15T12:00:00.000Z");
    const julDate = new Date("2026-07-15T12:00:00.000Z");

    // Total offset for New York: -300 min (EST) / -240 min (EDT)
    assertEqual(getTimeZoneOffset(janDate, "America/New_York", { format: "minutes" }), -300, "Jan NY total minutes");
    assertEqual(getTimeZoneOffset(julDate, "America/New_York", { format: "minutes" }), -240, "Jul NY total minutes");

    // DST offset: 0 in winter, 60 in summer
    assertEqual(getTimeZoneOffset(janDate, "America/New_York", { type: "daylightSavingTime", format: "minutes" }), 0, "Jan NY DST");
    assertEqual(getTimeZoneOffset(julDate, "America/New_York", { type: "daylightSavingTime", format: "minutes" }), 60, "Jul NY DST");

    // Base (standard) offset: -300 for both
    assertEqual(getTimeZoneOffset(janDate, "America/New_York", { type: "base", format: "minutes" }), -300, "Jan NY base");
    assertEqual(getTimeZoneOffset(julDate, "America/New_York", { type: "base", format: "minutes" }), -300, "Jul NY base");

    // UTC should always be 0
    assertEqual(getTimeZoneOffset(janDate, "UTC", { format: "minutes" }), 0, "UTC should be 0");

    // ISO format output
    assertEqual(getTimeZoneOffset(janDate, "America/New_York", { format: "iso" }), "-05:00", "iso format");

    // Basic format output
    assertEqual(getTimeZoneOffset(janDate, "America/New_York", { format: "basic" }), "-0500", "basic format");


    console.log(`SUCCESS: All getTimeZoneOffset tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: getTimeZoneOffset test failed!`, err);
    process.exit(1);
}
