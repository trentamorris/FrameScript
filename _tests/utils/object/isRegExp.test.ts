declare const process: any;
import { isRegExp } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISREGEXP TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    if (typeof actual === "bigint" || typeof expected === "bigint") {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${msg}\n  Expected: ${expected}\n  Actual:   ${actual}`);
        }
    } else {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) {
            throw new Error(`Assertion failed: ${msg}\n  Expected: ${e}\n  Actual:   ${a}`);
        }
    }
    testsPassed++;
}

try {

    assert(isRegExp(/abc/), "literal RegExp is RegExp");
    assert(isRegExp(new RegExp("abc")), "new RegExp is RegExp");
    assert(!isRegExp({ [Symbol.toStringTag]: "RegExp" }), "spoofed RegExp is not RegExp");
    assert(!isRegExp("/abc/"), "string regex is not RegExp");
    assert(!isRegExp(null), "null is not RegExp");


    console.log(`SUCCESS: All isRegExp tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isRegExp test failed!`, err);
    process.exit(1);
}
