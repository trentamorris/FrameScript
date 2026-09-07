declare const process: any;
import { isValidInt } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING ISVALIDINT TESTS...");
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
    assert(isValidInt(42), "isValidInt(42) failed");
    assert(!isValidInt(42.5), "isValidInt(42.5) should be false");
    assert(isValidInt(-128, { range: "Int8" }), "isValidInt(-128, Int8)");
    assert(!isValidInt(128, { range: "Int8" }), "isValidInt(128, Int8) out of range");
    assert(isValidInt(255, { range: "UInt8" }), "isValidInt(255, UInt8)");
    assert(!isValidInt(-1, { range: "UInt8" }), "isValidInt(-1, UInt8) out of range");


    console.log(`SUCCESS: All isValidInt tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isValidInt test failed!`, err);
    process.exit(1);
}
