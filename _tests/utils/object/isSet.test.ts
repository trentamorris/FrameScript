declare const process: any;
import { isSet } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISSET TESTS...");
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

    assert(isSet(new Set()), "new Set is Set");
    assert(isSet(new Set([1, 2, 3])), "Set with items is Set");
    assert(!isSet({ [Symbol.toStringTag]: "Set" }), "spoofed Set is not Set");
    assert(!isSet(new Map()), "Map is not Set");
    assert(!isSet([]), "array is not Set");


    console.log(`SUCCESS: All isSet tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isSet test failed!`, err);
    process.exit(1);
}
