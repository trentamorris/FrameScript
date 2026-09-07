declare const process: any;
import { extractRegexAll } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING EXTRACTREGEXALL TESTS...");
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

    assertEqual(extractRegexAll("a1 b2 c3", /\d+/), ["1", "2", "3"], "extracts all matches");
    assertEqual(extractRegexAll("no numbers", /\d+/), null, "returns null on no match");


    console.log(`SUCCESS: All extractRegexAll tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: extractRegexAll test failed!`, err);
    process.exit(1);
}
