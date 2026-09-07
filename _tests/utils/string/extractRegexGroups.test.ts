declare const process: any;
import { extractRegexGroups } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING EXTRACTREGEXGROUPS TESTS...");
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

    const res = extractRegexGroups("2026-05-25", /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/);
    assertEqual(res?.year, "2026", "named capture year");
    assertEqual(res?.month, "05", "named capture month");
    assertEqual(res?.day, "25", "named capture day");
    assertEqual(res?.["0"], "2026-05-25", "full match '0'");


    console.log(`SUCCESS: All extractRegexGroups tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: extractRegexGroups test failed!`, err);
    process.exit(1);
}
