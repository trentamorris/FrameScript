declare const process: any;
import { toValidDecimal } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING TOVALIDDECIMAL TESTS...");
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
    assertEqual(toValidDecimal(12.345, { scale: 2 }), 12.35, "toValidDecimal failed");
    assertEqual(toValidDecimal(null), null, "toValidDecimal null");
    assertEqual(toValidDecimal(100, { precision: 3, scale: 0 }), 100, "toValidDecimal precision 3 max 999");


    console.log(`SUCCESS: All toValidDecimal tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toValidDecimal test failed!`, err);
    process.exit(1);
}
