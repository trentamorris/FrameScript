declare const process: any;
import { escapeRegExp } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ESCAPEREGEXP TESTS...");
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

    assertEqual(escapeRegExp(".*+?^${}()|[]\\"), "\\.\\*\\+\\?\\^\\$\\\{\\}%(%)\\|\\[\\]\\\\".replace("%(%)", "\\(\\)"), "escapes special regex characters");
    assertEqual(escapeRegExp("hello"), "hello", "plain text unchanged");


    console.log(`SUCCESS: All escapeRegExp tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: escapeRegExp test failed!`, err);
    process.exit(1);
}
