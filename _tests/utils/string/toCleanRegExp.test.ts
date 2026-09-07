declare const process: any;
import { toCleanRegExp } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING TOCLEANREGEXP TESTS...");
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

    const r1 = toCleanRegExp("hello", "abc");
    assert(r1?.reg instanceof RegExp, "creates RegExp from string");
    assertEqual(r1?.reg.source, "abc", "regex source");
    assertEqual(r1?.input, "hello", "input string preserved");
    const r2 = toCleanRegExp("hello", /xyz/i);
    assertEqual(r2?.reg.source, "xyz", "existing RegExp source");
    assertEqual(r2?.reg.flags, "i", "existing RegExp flags");
    assertEqual(toCleanRegExp(null, "abc"), null, "null input returns null");


    console.log(`SUCCESS: All toCleanRegExp tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toCleanRegExp test failed!`, err);
    process.exit(1);
}
