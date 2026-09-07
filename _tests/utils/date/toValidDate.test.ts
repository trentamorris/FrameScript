declare const process: any;
import { toValidDate } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING TOVALIDDATE TESTS...");
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
    // Exhaustive toValidDate edge cases
    assertEqual(toValidDate(null), null, "toValidDate(null) should be null");
    assertEqual(toValidDate(undefined), null, "toValidDate(undefined) should be null");
    assertEqual(toValidDate(NaN), null, "toValidDate(NaN) should be null");
    assertEqual(toValidDate(Infinity), null, "toValidDate(Infinity) should be null");
    assertEqual(toValidDate(-Infinity), null, "toValidDate(-Infinity) should be null");
    assertEqual(toValidDate(true), null, "toValidDate(true) should be null");
    assertEqual(toValidDate(false), null, "toValidDate(false) should be null");
    assertEqual(toValidDate(Symbol("date") as any), null, "toValidDate(Symbol) should be null");
    assertEqual(toValidDate({}), null, "toValidDate({}) should be null");
    assertEqual(toValidDate([]), null, "toValidDate([]) should be null");
    assertEqual(toValidDate((() => { }) as any), null, "toValidDate(function) should be null");
    assertEqual(toValidDate(""), null, "toValidDate('') should be null");
    assertEqual(toValidDate("   "), null, "toValidDate('   ') should be null");
    assertEqual(toValidDate("invalid-date-string"), null, "toValidDate('invalid-date-string') should be null");
    assertEqual(toValidDate(new Date(NaN)), null, "toValidDate(InvalidDate) should be null");

    // Boxed objects
    assertEqual(toValidDate(Object(1700000000000))?.getTime(), 1700000000000, "toValidDate boxed number failed");
    assertEqual(toValidDate(Object("2026-01-01T00:00:00Z"))?.getTime(), new Date("2026-01-01T00:00:00Z").getTime(), "toValidDate boxed string failed");

    // Numeric & bigint multi-scale epoch auto-detection (positive and negative)
    const baseSec = 1716200000;
    const baseMs = 1716200000000;
    const baseUs = 1716200000000000n;
    const baseNs = 1716200000000000000n;
    assertEqual(toValidDate(baseSec)?.getTime(), baseMs, "toValidDate numeric seconds failed");
    assertEqual(toValidDate(baseMs)?.getTime(), baseMs, "toValidDate numeric milliseconds failed");
    assertEqual(toValidDate(baseUs)?.getTime(), baseMs, "toValidDate bigint microseconds failed");
    assertEqual(toValidDate(baseNs)?.getTime(), baseMs, "toValidDate bigint nanoseconds failed");
    assertEqual(toValidDate(-baseSec)?.getTime(), -baseMs, "toValidDate negative numeric seconds failed");
    assertEqual(toValidDate(-baseUs)?.getTime(), -baseMs, "toValidDate negative bigint microseconds failed");
    assertEqual(toValidDate(-baseNs)?.getTime(), -baseMs, "toValidDate negative bigint nanoseconds failed");

    // BigInt negative epoch normalization
    const negBigIntDate = toValidDate(-1000n);
    assertEqual(negBigIntDate?.getTime(), -1000000, "Negative bigint epoch sec failed");

    // toValidDate dateOnly: true option
    const fullDateSample = new Date("2026-05-20T14:30:45.999Z");
    const strippedDate = toValidDate(fullDateSample, { dateOnly: true });
    assertEqual(strippedDate?.toISOString(), "2026-05-20T00:00:00.000Z", "toValidDate dateOnly Date failed");

    const strippedStr = toValidDate("2026-05-20T14:30:45.999Z", { dateOnly: true });
    assertEqual(strippedStr?.toISOString(), "2026-05-20T00:00:00.000Z", "toValidDate dateOnly string failed");

    const strippedNum = toValidDate(fullDateSample.getTime(), { dateOnly: true });
    assertEqual(strippedNum?.toISOString(), "2026-05-20T00:00:00.000Z", "toValidDate dateOnly number failed");


    console.log(`SUCCESS: All toValidDate tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toValidDate test failed!`, err);
    process.exit(1);
}
