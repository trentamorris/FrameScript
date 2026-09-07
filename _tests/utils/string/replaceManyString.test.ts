declare const process: any;
import { replaceManyString } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING REPLACEMANYSTRING TESTS...");
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

    const map = { a: "1", b: "2" };
    assertEqual(replaceManyString("a b a b", map), "1 2 1 2", "replaces many from map");


    console.log(`SUCCESS: All replaceManyString tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: replaceManyString test failed!`, err);
    process.exit(1);
}
