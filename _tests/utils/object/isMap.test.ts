declare const process: any;
import { isMap } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISMAP TESTS...");
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

    assert(isMap(new Map()), "new Map is Map");
    assert(isMap(new Map([["a", 1]])), "Map with entries is Map");
    assert(!isMap({ [Symbol.toStringTag]: "Map" }), "spoofed Map is not Map");
    assert(!isMap(new Set()), "Set is not Map");
    assert(!isMap({}), "object is not Map");


    console.log(`SUCCESS: All isMap tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isMap test failed!`, err);
    process.exit(1);
}
