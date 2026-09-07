declare const process: any;
import { isPlainObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISPLAINOBJ TESTS...");
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

    assert(isPlainObj({}), "literal {} is plain obj");
    assert(isPlainObj(Object.create(null)), "Object.create(null) is plain obj");
    assert(isPlainObj(new Object()), "new Object is plain obj");
    assert(!isPlainObj(null), "null is not plain obj");
    assert(!isPlainObj([]), "array is not plain obj");
    assert(!isPlainObj(new Date()), "Date is not plain obj");
    assert(!isPlainObj(new Map()), "Map is not plain obj");
    class MyClass {}
    assert(!isPlainObj(new MyClass()), "class instance is not plain obj");
    const HostProto = Object.create(Object.prototype, {
        [Symbol.toStringTag]: { value: "HTMLDivElement" }
    });
    const hostLikeObj = Object.create(HostProto);
    assert(!isPlainObj(hostLikeObj), "Host-like object with custom prototype is not plain");


    console.log(`SUCCESS: All isPlainObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isPlainObj test failed!`, err);
    process.exit(1);
}
