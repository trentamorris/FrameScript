declare const process: any;
import { findManyRegex } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING FINDMANYREGEX TESTS...");
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

    const res = findManyRegex("hello 123 world", [/\d+/, /world/]);
    assertEqual(res.length, 2, "finds multiple regex matches");


    console.log(`SUCCESS: All findManyRegex tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: findManyRegex test failed!`, err);
    process.exit(1);
}
