declare const process: any;
import { isDataView } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISDATAVIEW TESTS...");
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

    const dv = new DataView(new ArrayBuffer(8));
    assert(isDataView(dv), "DataView is true");
    assert(!isDataView(new ArrayBuffer(8)), "ArrayBuffer is not DataView");
    assert(!isDataView({ [Symbol.toStringTag]: "DataView" }), "spoofed DataView is false");
    assert(!isDataView(null), "null is false");


    console.log(`SUCCESS: All isDataView tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isDataView test failed!`, err);
    process.exit(1);
}
