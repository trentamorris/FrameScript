declare const process: any;
import { roundToScale } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING ROUNDTOSCALE TESTS...");
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
    assertEqual(roundToScale(1234, -1), 1230, "roundToScale negative scale -1 failed");
    assertEqual(roundToScale(1234, -2), 1200, "roundToScale negative scale -2 failed");
    assertEqual(roundToScale(1.005, 2), 1.01, "roundToScale positive scale failed");


    console.log(`SUCCESS: All roundToScale tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: roundToScale test failed!`, err);
    process.exit(1);
}
