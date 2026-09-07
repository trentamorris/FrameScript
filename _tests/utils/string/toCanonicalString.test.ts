declare const process: any;
import { toCanonicalString } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING TOCANONICALSTRING TESTS...");
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

    assertEqual(toCanonicalString(null), "v:null", "toCanonicalString null");
    assertEqual(toCanonicalString(undefined), "v:undefined", "toCanonicalString undefined");
    assertEqual(toCanonicalString("hello"), "s:5:hello", "toCanonicalString string");
    assertEqual(toCanonicalString(42), "number:42", "toCanonicalString number");
    assertEqual(toCanonicalString(true), "boolean:true", "toCanonicalString boolean");
    assertEqual(toCanonicalString(/abc/i), "r:6:/abc/i", "toCanonicalString regex");
    assertEqual(toCanonicalString(new Date(1777000)), "d:1777000", "toCanonicalString date");
    assertEqual(toCanonicalString(new Uint8Array([1, 2, 3])), "u:Uint8Array:5:1,2,3", "toCanonicalString Uint8Array");
    assertEqual(toCanonicalString([1, 2]), "a:[number:1\x01number:2]", "toCanonicalString array");
    assertEqual(toCanonicalString({ b: 2, a: 1 }), "o:{s:1:a\x00number:1\x01s:1:b\x00number:2}", "toCanonicalString object keys sorted");


    console.log(`SUCCESS: All toCanonicalString tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toCanonicalString test failed!`, err);
    process.exit(1);
}
