declare const process: any;
import { extractRegexEngine } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING EXTRACTREGEXENGINE TESTS...");
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

    const res = extractRegexEngine("hello 123 world", /(\d+)/);
    assertEqual(res?.[0]?.["0"], "123", "full match '0'");
    assertEqual(res?.[0]?.["1"], "123", "capture group '1'");
    assertEqual(extractRegexEngine(null, /\d+/), null, "null returns null");


    console.log(`SUCCESS: All extractRegexEngine tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: extractRegexEngine test failed!`, err);
    process.exit(1);
}
