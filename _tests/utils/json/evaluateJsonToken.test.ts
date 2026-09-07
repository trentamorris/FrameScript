declare const process: any;
import { evaluateJsonToken } from "../../../src/utils/json";
import { InvalidArgumentError, IOStreamError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING EVALUATEJSONTOKEN TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error(`Assertion failed: ${msg}\n  Expected: ${e}\n  Actual:   ${a}`);
    }
    testsPassed++;
}

try {
    // Security & Prototype Pollution Protection
    const protoPollutionTokens = [
        { type: "prop" as const, key: "__proto__" },
        { type: "prop" as const, key: "constructor" },
        { type: "prop" as const, key: "prototype" }
    ];
    for (const tok of protoPollutionTokens) {
        const out: any[] = [];
        evaluateJsonToken({ safe: "val" }, tok, out);
        assertEqual(out.length, 0, `evaluateJsonToken blocks prototype pollution key: ${tok.key}`);
    }

    // Negative Index & OOB index
    const testArr = ["a", "b", "c"];
    const negIdxOut: any[] = [];
    evaluateJsonToken(testArr, { type: "idx", idx: -1 }, negIdxOut);
    assertEqual(negIdxOut, ["c"], "evaluates negative array index -1");

    const oobIdxOut: any[] = [];
    evaluateJsonToken(testArr, { type: "idx", idx: 99 }, oobIdxOut);
    assertEqual(oobIdxOut, [], "evaluates out-of-bounds index to empty array");

    // Slicing evaluations
    const sliceOut: any[] = [];
    evaluateJsonToken(testArr, { type: "slice", start: 0, end: 2, step: 1 }, sliceOut);
    assertEqual(sliceOut, ["a", "b"], "evaluates slice range");

    // Wildcard on objects and arrays
    const wildArrOut: any[] = [];
    evaluateJsonToken(["x", "y"], { type: "wildcard" }, wildArrOut);
    assertEqual(wildArrOut, ["x", "y"], "wildcard on array collects all items");

    const wildObjOut: any[] = [];
    evaluateJsonToken({ k1: "v1", k2: "v2" }, { type: "wildcard" }, wildObjOut);
    assertEqual(wildObjOut, ["v1", "v2"], "wildcard on object collects all values");

    // Recursive search with circular references
    const recCyclic: any = { tag: "root", child: { tag: "nested" } };
    recCyclic.self = recCyclic;
    const recOut: any[] = [];
    evaluateJsonToken(recCyclic, { type: "rec", key: "tag" }, recOut);
    assertEqual(recOut, ["root", "nested"], "recursive token traversal avoids infinite loop on circular references");


    console.log(`SUCCESS: All evaluateJsonToken tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: evaluateJsonToken test failed!`, err);
    process.exit(1);
}
