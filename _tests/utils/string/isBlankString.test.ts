declare const process: any;
import { isBlankString } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ISBLANKSTRING TESTS...");
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

    assert(isBlankString(""), "empty string is blank");
    assert(isBlankString("   "), "whitespace string is blank");
    assert(isBlankString("\t\n\r"), "tab/newline string is blank");
    assert(!isBlankString("a"), "'a' is not blank");
    assert(!isBlankString("  a  "), "'  a  ' is not blank");
    assert(!isBlankString(null as any), "null is not blank string");
    assert(!isBlankString(undefined as any), "undefined is not blank string");


    console.log(`SUCCESS: All isBlankString tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isBlankString test failed!`, err);
    process.exit(1);
}
