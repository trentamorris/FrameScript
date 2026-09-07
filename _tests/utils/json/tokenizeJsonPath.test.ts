declare const process: any;
import { tokenizeJsonPath } from "../../../src/utils/json";
import { InvalidArgumentError, IOStreamError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING TOKENIZEJSONPATH TESTS...");
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
    // A. tokenizeJsonPath edge cases
    assertEqual(tokenizeJsonPath(""), [], "tokenizeJsonPath on empty string returns empty array");
    assertEqual(tokenizeJsonPath("$"), [], "tokenizeJsonPath on single $ returns empty array");
    assertEqual(tokenizeJsonPath("   $   "), [], "tokenizeJsonPath on padded $ returns empty array");
    assertEqual(tokenizeJsonPath("$.user.name"), [{ type: "prop", key: "user" }, { type: "prop", key: "name" }], "parses dot properties");
    assertEqual(tokenizeJsonPath("$['user'][\"name\"]"), [{ type: "prop", key: "user" }, { type: "prop", key: "name" }], "parses bracket quoted properties");
    assertEqual(tokenizeJsonPath("$['escaped\\'quote']"), [{ type: "prop", key: "escaped'quote" }], "parses escaped quotes inside brackets");
    assertEqual(tokenizeJsonPath("$.items[0]"), [{ type: "prop", key: "items" }, { type: "idx", idx: 0 }], "parses array index");
    assertEqual(tokenizeJsonPath("$.items[-1]"), [{ type: "prop", key: "items" }, { type: "idx", idx: -1 }], "parses negative array index");
    assertEqual(tokenizeJsonPath("$.items[*]"), [{ type: "prop", key: "items" }, { type: "wildcard" }], "parses bracket wildcard");
    assertEqual(tokenizeJsonPath("$.items.*"), [{ type: "prop", key: "items" }, { type: "wildcard" }], "parses dot wildcard");
    assertEqual(tokenizeJsonPath("$..name"), [{ type: "rec", key: "name" }], "parses recursive dot key");
    assertEqual(tokenizeJsonPath("$..*"), [{ type: "rec", key: "*" }], "parses recursive star wildcard");
    assertEqual(tokenizeJsonPath("$..['deep']"), [{ type: "rec", key: "deep" }], "parses recursive bracket single quote key");
    assertEqual(tokenizeJsonPath("$..[\"deep\"]"), [{ type: "rec", key: "deep" }], "parses recursive bracket double quote key");
    assertEqual(tokenizeJsonPath("$.items[1:5:2]"), [{ type: "prop", key: "items" }, { type: "slice", start: 1, end: 5, step: 2 }], "parses full slice with step");
    assertEqual(tokenizeJsonPath("$.items[:3]"), [{ type: "prop", key: "items" }, { type: "slice", start: undefined, end: 3, step: 1 }], "parses slice with omitted start");
    assertEqual(tokenizeJsonPath("$.items[2:]"), [{ type: "prop", key: "items" }, { type: "slice", start: 2, end: undefined, step: 1 }], "parses slice with omitted end");
    assertEqual(tokenizeJsonPath("$.items[::-1]"), [{ type: "prop", key: "items" }, { type: "slice", start: undefined, end: undefined, step: -1 }], "parses reverse slice");

    // Invalid path syntaxes return null
    assertEqual(tokenizeJsonPath("$.user..[invalid"), null, "invalid bracket syntax returns null");
    assertEqual(tokenizeJsonPath("$.user[abc]"), null, "unquoted string inside bracket returns null");
    assertEqual(tokenizeJsonPath("$.user.@#$!"), null, "illegal syntax returns null");


    console.log(`SUCCESS: All tokenizeJsonPath tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: tokenizeJsonPath test failed!`, err);
    process.exit(1);
}
