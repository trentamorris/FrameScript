declare const process: any;
import { encodeObjectToJson } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ENCODEOBJECTTOJSON TESTS...");
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

    assertEqual(encodeObjectToJson({ a: 1 }), '{"a":1}', "encodes plain object");
    assertEqual(encodeObjectToJson([1, 2, 3]), '[1,2,3]', "encodes array");


    console.log(`SUCCESS: All encodeObjectToJson tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: encodeObjectToJson test failed!`, err);
    process.exit(1);
}
