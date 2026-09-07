declare const process: any;
import { INT_RANGES } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING INT_RANGES TESTS...");
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
    assertEqual(INT_RANGES.Int8.min, -128, "Int8 min");
    assertEqual(INT_RANGES.Int8.max, 127, "Int8 max");
    assertEqual(INT_RANGES.UInt8.min, 0, "UInt8 min");
    assertEqual(INT_RANGES.UInt8.max, 255, "UInt8 max");
    assertEqual(INT_RANGES.Int16.min, -32768, "Int16 min");
    assertEqual(INT_RANGES.Int16.max, 32767, "Int16 max");
    assertEqual(INT_RANGES.UInt16.min, 0, "UInt16 min");
    assertEqual(INT_RANGES.UInt16.max, 65535, "UInt16 max");
    assertEqual(INT_RANGES.Int32.min, -2147483648, "Int32 min");
    assertEqual(INT_RANGES.Int32.max, 2147483647, "Int32 max");
    assertEqual(INT_RANGES.UInt32.min, 0, "UInt32 min");
    assertEqual(INT_RANGES.UInt32.max, 4294967295, "UInt32 max");


    console.log(`SUCCESS: All INT_RANGES tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: INT_RANGES test failed!`, err);
    process.exit(1);
}
