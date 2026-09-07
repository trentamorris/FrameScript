declare const process: any;
import { encodeBase64ToBase64URL } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING ENCODEBASE64TOBASE64URL TESTS...");
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

    assertEqual(encodeBase64ToBase64URL("a+b/c=="), "a-b_c", "converts base64 to base64url");


    console.log(`SUCCESS: All encodeBase64ToBase64URL tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: encodeBase64ToBase64URL test failed!`, err);
    process.exit(1);
}
