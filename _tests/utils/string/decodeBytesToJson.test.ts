declare const process: any;
import { decodeBytesToJson } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING DECODEBYTESTOJSON TESTS...");
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

    const bytes = new TextEncoder().encode('{"a":1}');
    assertEqual(decodeBytesToJson(bytes), { a: 1 }, "decodes bytes to json");


    console.log(`SUCCESS: All decodeBytesToJson tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: decodeBytesToJson test failed!`, err);
    process.exit(1);
}
