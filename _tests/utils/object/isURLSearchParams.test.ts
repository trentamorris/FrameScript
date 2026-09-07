declare const process: any;
import { isURLSearchParams } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISURLSEARCHPARAMS TESTS...");
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

    assert(isURLSearchParams(new URLSearchParams("a=1")), "URLSearchParams is true");
    assert(!isURLSearchParams({ [Symbol.toStringTag]: "URLSearchParams" }), "spoofed URLSearchParams is false");
    assert(!isURLSearchParams("a=1"), "string is not URLSearchParams");
    assert(!isURLSearchParams(null), "null is not URLSearchParams");


    console.log(`SUCCESS: All isURLSearchParams tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isURLSearchParams test failed!`, err);
    process.exit(1);
}
