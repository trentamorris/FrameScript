declare const process: any;
import { isClass } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISCLASS TESTS...");
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

    class BaseClass {}
    class SubClass extends BaseClass {}
    assert(isClass(BaseClass), "ES6 class is class");
    assert(isClass(SubClass), "extended ES6 class is class");
    assert(!isClass(function() {}), "standard function is not class");
    assert(!isClass(() => {}), "arrow function is not class");
    assert(isClass(Date), "Date constructor is class");
    assert(isClass(Map), "Map constructor is class");
    assert(isClass(Set), "Set constructor is class");
    assert(!isClass(Math), "Math is not class");
    assert(!isClass(JSON), "JSON is not class");
    assert(!isClass(null), "null is not class");
    assert(!isClass(undefined), "undefined is not class");
    assert(!isClass(123), "number is not class");


    console.log(`SUCCESS: All isClass tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isClass test failed!`, err);
    process.exit(1);
}
