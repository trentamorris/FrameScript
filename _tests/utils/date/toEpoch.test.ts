declare const process: any;
import { toEpoch } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING TOEPOCH TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    if (actual !== expected) {
        throw new Error(`Assertion failed: ${msg}\n  Expected: ${expected}\n  Actual:   ${actual}`);
    }
    testsPassed++;
}

try {
    const epochDate = new Date("1970-01-01T00:00:01.500Z");
    assertEqual(toEpoch(epochDate, "s"), 1, "toEpoch s failed");
    assertEqual(toEpoch(epochDate, "ms"), 1500, "toEpoch ms failed");
    assertEqual(toEpoch(epochDate, "us"), 1500000n, "toEpoch us failed");
    assertEqual(toEpoch(epochDate, "ns"), 1500000000n, "toEpoch ns failed");


    console.log(`SUCCESS: All toEpoch tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toEpoch test failed!`, err);
    process.exit(1);
}
