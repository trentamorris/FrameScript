declare const process: any;
import { splitString } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING SPLITSTRING TESTS...");
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

    assertEqual(splitString("a,b,c", ","), ["a", "b", "c"], "splits by comma");
    assertEqual(splitString("a,b,c,d", ",", { limit: 1 }), ["a", "b,c,d"], "splits with limit 1");
    assertEqual(splitString("a.b.c", ".", { literal: true }), ["a", "b", "c"], "splits literal dot");


    console.log(`SUCCESS: All splitString tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: splitString test failed!`, err);
    process.exit(1);
}
