declare const process: any;
import { extractRegex } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING EXTRACTREGEX TESTS...");
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

    assertEqual(extractRegex("hello 123 world", /(\d+)/), "123", "extracts first capture group");
    assertEqual(extractRegex("hello 123 world", /\d+/, { groupIndex: 0 }), "123", "extracts group 0 full match");
    assertEqual(extractRegex("no numbers", /\d+/), null, "returns null on no match");


    console.log(`SUCCESS: All extractRegex tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: extractRegex test failed!`, err);
    process.exit(1);
}
