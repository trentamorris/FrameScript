declare const process: any;
import { clamp } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING CLAMP TESTS...");
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
    assertEqual(clamp(5, { min: 0, max: 10 }), 5, "clamp middle failed");
    assertEqual(clamp(-5, { min: 0, max: 10 }), 0, "clamp min failed");
    assertEqual(clamp(15, { min: 0, max: 10 }), 10, "clamp max failed");
    assertEqual(clamp(5n, { min: 0n, max: 10n }), 5n, "clamp bigint");


    console.log(`SUCCESS: All clamp tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: clamp test failed!`, err);
    process.exit(1);
}
