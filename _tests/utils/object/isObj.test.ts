declare const process: any;
import { isObj } from "../../../src/utils/object";

console.log("=========================================");
console.log("STARTING ISOBJ TESTS...");
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

    assert(!isObj(null), "null is not isObj");
    assert(!isObj(undefined), "undefined is not isObj");
    assert(!isObj(42), "number is not isObj");
    assert(!isObj("abc"), "string is not isObj");
    assert(!isObj(true), "boolean is not isObj");
    assert(!isObj(Symbol("test")), "symbol is not isObj");
    assert(!isObj(100n), "bigint is not isObj");
    assert(!isObj([]), "array is excluded from isObj");
    assert(isObj({}), "plain object is isObj");
    assert(isObj(new Date()), "Date is isObj");

    const bombHandler: ProxyHandler<any> = {
        get() { throw new Error("TRAP: property get attempted!"); },
        has() { throw new Error("TRAP: 'in' operator attempted!"); },
        getPrototypeOf() { return Object.prototype; },
        getOwnPropertyDescriptor() { throw new Error("TRAP: getOwnPropertyDescriptor attempted!"); }
    };
    const proxyBomb = new Proxy({}, bombHandler);
    assert(isObj(proxyBomb), "Proxy is recognized as isObj without triggering throwing property get traps");


    console.log(`SUCCESS: All isObj tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: isObj test failed!`, err);
    process.exit(1);
}
