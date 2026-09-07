declare const process: any;
import { toValidInt } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING TOVALIDINT TESTS...");
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
    assertEqual(toValidInt("42"), 42, "toValidInt('42') failed");
    assertEqual(toValidInt("42.8", { coerce: "truncate" }), 42, "toValidInt truncate failed");
    assertEqual(toValidInt("42.8", { coerce: "round" }), 43, "toValidInt round failed");
    assertEqual(toValidInt("42.8", { coerce: "floor" }), 42, "toValidInt floor failed");
    assertEqual(toValidInt("42.2", { coerce: "ceil" }), 43, "toValidInt ceil failed");
    assertEqual(toValidInt("invalid"), null, "toValidInt invalid should be null");
    assertEqual(toValidInt(300, { range: "UInt8" }), 255, "toValidInt out of range clamps to limits.max (255)");
    assertEqual(toValidInt(-50, { range: "UInt8" }), 0, "toValidInt negative value clamps to limits.min (0)");


    console.log(`SUCCESS: All toValidInt tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toValidInt test failed!`, err);
    process.exit(1);
}
