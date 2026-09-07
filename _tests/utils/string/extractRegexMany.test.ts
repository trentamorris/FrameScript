declare const process: any;
import { extractRegexMany } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING EXTRACTREGEXMANY TESTS...");
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

    const patterns = [/\d+/, /[a-z]+/];
    assertEqual(extractRegexMany("123 abc", patterns), ["123", "abc"], "extracts many regex patterns");


    console.log(`SUCCESS: All extractRegexMany tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: extractRegexMany test failed!`, err);
    process.exit(1);
}
