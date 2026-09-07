declare const process: any;
import { replaceString } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING REPLACESTRING TESTS...");
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

    assertEqual(replaceString("hello world", "world", "there"), "hello there", "replaces substring");
    assertEqual(replaceString("foo bar foo", "foo", "baz", { n: -1 }), "baz bar baz", "replaces all with n: -1");


    console.log(`SUCCESS: All replaceString tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: replaceString test failed!`, err);
    process.exit(1);
}
