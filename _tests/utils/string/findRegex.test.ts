declare const process: any;
import { findRegex } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING FINDREGEX TESTS...");
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

    const res = findRegex("hello 123 world", /\d+/);
    assertEqual(res, 6, "finds byte offset index 6");
    assertEqual(findRegex("hello", /\d+/), null, "returns null when no match");


    console.log(`SUCCESS: All findRegex tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: findRegex test failed!`, err);
    process.exit(1);
}
