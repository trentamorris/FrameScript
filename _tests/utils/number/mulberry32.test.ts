declare const process: any;
import { mulberry32 } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING MULBERRY32 TESTS...");
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
    const rng = mulberry32(12345);
    const r1 = rng();
    const r2 = rng();
    assert(typeof r1 === "number" && r1 >= 0 && r1 < 1, "mulberry32 value 1 out of range");
    assert(typeof r2 === "number" && r2 >= 0 && r2 < 1 && r1 !== r2, "mulberry32 value 2 invalid");


    console.log(`SUCCESS: All mulberry32 tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: mulberry32 test failed!`, err);
    process.exit(1);
}
