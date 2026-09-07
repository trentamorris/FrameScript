declare const process: any;
import { jsonPathMatch } from "../../../src/utils/json";
import { InvalidArgumentError, IOStreamError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING JSONPATHMATCH TESTS...");
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
    // Direct parsed object and JSON string input
    const sampleData = {
        store: {
            book: [
                { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
                { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 }
            ]
        }
    };
    const sampleDataJson = JSON.stringify(sampleData);

    assertEqual(jsonPathMatch(sampleData, "$.store.book[0].title"), "Sayings of the Century", "matches nested string property from object input");
    assertEqual(jsonPathMatch(sampleDataJson, "$.store.book[0].title"), "Sayings of the Century", "matches nested string property from string input");
    assertEqual(jsonPathMatch(sampleData, "$.store.book[0].price"), "8.95", "matches nested number property");
    assertEqual(jsonPathMatch(sampleData, "$.store.book[-1].author"), "Evelyn Waugh", "matches negative index from end");
    assertEqual(jsonPathMatch(sampleData, "$..author"), "Nigel Rees", "recursive descent returns first matched item");
    assertEqual(jsonPathMatch(sampleData, "$.store.book[0]"), JSON.stringify(sampleData.store.book[0]), "returns object result serialized as JSON string");

    // Root-level array and root-level match
    const rootArr = [{ id: 1 }, { id: 2 }];
    assertEqual(jsonPathMatch(rootArr, "$[1].id"), "2", "matches root level array indexing");
    assertEqual(jsonPathMatch(rootArr, "$"), JSON.stringify(rootArr), "returns entire root when path is $");

    // Circular object returned by jsonPathMatch uses safe serialization
    const cyclicMatchTarget: any = { name: "cyclicNode" };
    cyclicMatchTarget.loop = cyclicMatchTarget;
    assertEqual(
        jsonPathMatch({ target: cyclicMatchTarget }, "$.target"),
        '{"name":"cyclicNode","loop":"[Circular]"}',
        "jsonPathMatch safely serializes circular matched objects using safe replacer"
    );

    // Boundary & invalid inputs
    assertEqual(jsonPathMatch(null, "$.a"), null, "null input returns null");
    assertEqual(jsonPathMatch(undefined, "$.a"), null, "undefined input returns null");
    assertEqual(jsonPathMatch({}, ""), null, "empty path returns null");
    assertEqual(jsonPathMatch({}, "   "), null, "blank whitespace path returns null");
    assertEqual(jsonPathMatch({ a: 1 }, "$.nonexistent"), null, "nonexistent path returns null");
    assertEqual(jsonPathMatch({ a: null }, "$.a"), null, "path pointing to null value returns null");

    let invalidJsonThrew = false;
    try {
        jsonPathMatch("{ malformed: json }", "$.a");
    } catch (err: any) {
        invalidJsonThrew = err instanceof InvalidArgumentError;
    }
    assert(invalidJsonThrew, "jsonPathMatch throws InvalidArgumentError on malformed JSON string input");

    // ============================================================================
    // 70. Extreme & Insane Edge Case Battery
    // ============================================================================

    // 1. Unicode, Emoji, and whitespace keys in bracket notation
    const emojiAndWeirdKeys = {
        "🚀 rocket": {
            "hello\nworld": {
                "key with spaces and.dots": "found me!",
                "": "empty key value",
                "null": "literal null key",
                "true": "literal true key",
                "123": "numeric string key"
            }
        }
    };
    assertEqual(
        jsonPathMatch(emojiAndWeirdKeys, "$['🚀 rocket']['hello\\nworld']['key with spaces and.dots']"),
        "found me!",
        "matches unicode emoji keys and keys with newlines and dots"
    );
    assertEqual(
        jsonPathMatch(emojiAndWeirdKeys, "$['🚀 rocket']['hello\\nworld']['']"),
        "empty key value",
        "matches empty string object key"
    );
    assertEqual(
        jsonPathMatch(emojiAndWeirdKeys, "$['🚀 rocket']['hello\\nworld']['null']"),
        "literal null key",
        "matches string key named 'null'"
    );
    assertEqual(
        jsonPathMatch(emojiAndWeirdKeys, "$['🚀 rocket']['hello\\nworld']['123']"),
        "numeric string key",
        "matches numeric string key in bracket notation"
    );

    // 2. Deep slice & reverse slice on empty and single-element arrays
    assertEqual(jsonPathMatch({ arr: [] }, "$.arr[0]"), null, "index 0 on empty array returns null");
    assertEqual(jsonPathMatch({ arr: [] }, "$.arr[-1]"), null, "index -1 on empty array returns null");
    assertEqual(jsonPathMatch({ arr: [] }, "$.arr[:]"), null, "slice on empty array returns null");
    assertEqual(jsonPathMatch({ arr: [42] }, "$.arr[::-1]"), "42", "reverse slice on single element returns element");
    assertEqual(jsonPathMatch({ arr: [1, 2, 3, 4, 5] }, "$.arr[10:20]"), null, "slice completely out of bounds returns null");

    // 3. Object with prototype null or weird prototype properties
    const nullProto: any = Object.create(null);
    nullProto.nested = { deep: "null-proto-val" };
    assertEqual(
        jsonPathMatch(nullProto, "$.nested.deep"),
        "null-proto-val",
        "traverses objects with Object.create(null) prototype"
    );

    // 4. Recursive search matching multiple levels including arrays of objects
    const deepTree = {
        level1: {
            target: "L1",
            level2: [
                { target: "L2_item0" },
                { level3: { target: "L3" } }
            ]
        }
    };
    assertEqual(
        jsonPathMatch(deepTree, "$..target"),
        "L1",
        "recursive search extracts first target at shallowest depth"
    );

    // 5. Deep nested structure with primitive JSON string input
    assertEqual(jsonPathMatch('"plain string json"', "$"), "plain string json", "jsonPathMatch parses and returns top-level string JSON");
    assertEqual(jsonPathMatch('12345', "$"), "12345", "jsonPathMatch parses and returns top-level number JSON");
    assertEqual(jsonPathMatch('true', "$"), "true", "jsonPathMatch parses and returns top-level boolean JSON");
    assertEqual(jsonPathMatch('null', "$"), null, "jsonPathMatch parses top-level null JSON and returns null");

    // 6. Mutated prototype attempts (verifying prototype isolation)
    const pollutedPayload: any = JSON.parse('{"__proto__": {"injected": "dangerous"}, "normal": "ok"}');
    assertEqual(jsonPathMatch(pollutedPayload, "$.__proto__.injected"), null, "blocks attempts to query __proto__ via dot notation");
    assertEqual(jsonPathMatch(pollutedPayload, "$['__proto__']['injected']"), null, "blocks attempts to query __proto__ via bracket notation");
    assertEqual(jsonPathMatch(pollutedPayload, "$.constructor"), null, "blocks attempts to query constructor via dot notation");
    assertEqual(jsonPathMatch(pollutedPayload, "$..__proto__"), null, "blocks attempts to query __proto__ via recursive scan");

    // 7. Highly recursive array nests
    const nestedArrays = [[[[["deepestValue"]]]]];
    assertEqual(
        jsonPathMatch(nestedArrays, "$[0][0][0][0][0]"),
        "deepestValue",
        "handles 5 levels of deeply nested array indexing"
    );


    console.log(`SUCCESS: All jsonPathMatch tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: jsonPathMatch test failed!`, err);
    process.exit(1);
}
