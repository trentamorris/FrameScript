declare const process: any;
import { _trimByMode } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING _TRIMBYMODE TESTS...");
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

    assertEqual(_trimByMode("  abc  ", "both"), "abc", "trims both");
    assertEqual(_trimByMode("  abc  ", "start"), "abc  ", "trims start");
    assertEqual(_trimByMode("  abc  ", "end"), "  abc", "trims end");
    assertEqual(_trimByMode("abc", "both"), "abc", "unchanged when no whitespace");


    console.log(`SUCCESS: All _trimByMode tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: _trimByMode test failed!`, err);
    process.exit(1);
}
