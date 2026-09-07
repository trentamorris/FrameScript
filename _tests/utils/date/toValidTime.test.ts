declare const process: any;
import { toValidTime } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING TOVALIDTIME TESTS...");
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
    assertEqual(toValidTime(null), null, "toValidTime(null) should be null");
    assertEqual(toValidTime(undefined), null, "toValidTime(undefined) should be null");
    assertEqual(toValidTime(NaN), null, "toValidTime(NaN) should be null");
    assertEqual(toValidTime(Infinity), null, "toValidTime(Infinity) should be null");
    assertEqual(toValidTime(true), null, "toValidTime(true) should be null");
    assertEqual(toValidTime(false), null, "toValidTime(false) should be null");
    assertEqual(toValidTime({}), null, "toValidTime({}) should be null");
    assertEqual(toValidTime([]), null, "toValidTime([]) should be null");
    assertEqual(toValidTime(""), null, "toValidTime('') should be null");
    assertEqual(toValidTime("   "), null, "toValidTime('   ') should be null");
    assertEqual(toValidTime("not-a-date-or-time"), null, "toValidTime('not-a-date-or-time') should be null");
    assertEqual(toValidTime("25:00:00"), null, "toValidTime('25:00:00') should be null");
    assertEqual(toValidTime("12:65:00"), null, "toValidTime('12:65:00') should be null");
    assertEqual(toValidTime("14:30"), "14:30:00.000", "toValidTime '14:30' failed");
    assertEqual(toValidTime("14:30:15"), "14:30:15.000", "toValidTime standard failed");
    assertEqual(toValidTime("14:30:15.123"), "14:30:15.123", "toValidTime standard with ms failed");
    assertEqual(toValidTime("14:30:15.123456"), "14:30:15.123", "toValidTime standard with microseconds failed");
    assertEqual(toValidTime("14:30:15+02:00"), "12:30:15.000", "toValidTime zone offset failed");
    assertEqual(toValidTime("14:30:15-05:00"), "19:30:15.000", "toValidTime negative zone offset failed");
    assertEqual(toValidTime("14:30:15Z"), "14:30:15.000", "toValidTime Z zone offset failed");
    assertEqual(toValidTime("2026-05-20T10:15:30.500Z"), "10:15:30.500", "toValidTime ISO date string failed");
    assertEqual(toValidTime(new Date("2026-05-20T08:00:00.123Z")), "08:00:00.123", "toValidTime Date object failed");
    assertEqual(toValidTime(1700000000000), "22:13:20.000", "toValidTime timestamp failed");


    console.log(`SUCCESS: All toValidTime tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toValidTime test failed!`, err);
    process.exit(1);
}
