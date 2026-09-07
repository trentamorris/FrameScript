declare const process: any;
import { isSymbolObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISSYMBOLOBJ TESTS...");
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

    assert(isSymbolObj(Object(Symbol("s"))), "Object(Symbol) is SymbolObj");
    assert(!isSymbolObj(Symbol("s")), "primitive symbol is not SymbolObj");
    assert(!isSymbolObj({ [Symbol.toStringTag]: "Symbol" }), "spoofed Symbol is not SymbolObj");
    assert(!isSymbolObj(null), "null is not SymbolObj");


    console.log(`SUCCESS: All isSymbolObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isSymbolObj test failed!`, err);
    process.exit(1);
}
