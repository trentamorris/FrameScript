import { $df } from "../../src/index";
import { jsonPathMatch } from "../../src/utils/json";

console.log("=========================================");
console.log("TESTING .str.json_path_match & jsonPathMatch ROBUST EDGE CASES...");
console.log("=========================================");

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// 1. Array Slices & Bounds
assert(jsonPathMatch([1, 2, 3], "$[0:3:0]") === null, "Slice with step = 0 does not hang and returns null");
assert(jsonPathMatch([1, 2, 3, 4], "$[3:0:-1]") === "4", "Negative step array reverse slice");
assert(jsonPathMatch([10, 20], "$[-10]") === null, "Out of bounds negative index clamps safely");

// 2. Syntax Malformation & Unanchored Regex Bleed
assert(jsonPathMatch({ user: ["Alice"] }, "$.user!BAD![0]") === null, "Malformed path syntax fails cleanly without partial execution");
assert(jsonPathMatch({ user: ["Alice"] }, "$.user.0") === null, "Invalid dot syntax on array number fails cleanly");

// 3. Special Characters in Keys
const specialData = { "a.b.c": "target", "x[0]": "found" };
assert(jsonPathMatch(specialData, "$['a.b.c']") === "target", "Keys containing dots inside quotes");
assert(jsonPathMatch(specialData, "$['x[0]']") === "found", "Keys containing brackets inside quotes");

// 4. Wildcards & Structural Edge Cases
assert(jsonPathMatch(12345, "$.*") === null, "Wildcard matching against non-object primitive returns null");
const recData = { a: [1, { b: 2 }] };
assert(jsonPathMatch(recData, "$..b") === "2", "Recursive search on primitives nested inside arrays");

// 5. Primitive & Null Returns
assert(jsonPathMatch({ key: null }, "$.key") === null, "Explicit null values in JSON preserve null return");
assert(jsonPathMatch({ flag: false, count: 0 }, "$.flag") === "false", "Boolean false coerces to string 'false'");
assert(jsonPathMatch({ flag: false, count: 0 }, "$.count") === "0", "Zero count coerces to string '0'");

// 6. Prototype Property Access Protection
assert(jsonPathMatch({}, "$.toString") === null, "Prototype function toString returns null and is isolated");
assert(jsonPathMatch({}, "$.valueOf") === null, "Prototype function valueOf returns null and is isolated");
assert(jsonPathMatch([], "$.length") === null, "Array property length via dot access returns null if not own property");

// 7. Primitives as Root Input
assert(jsonPathMatch(100, "$") === "100", "Numeric primitive root match");
assert(jsonPathMatch(true, "$") === "true", "Boolean primitive root match");
assert(jsonPathMatch('"hello"', "$") === "hello", "String primitive root match");

// 8. Absolute Edge Cases: Slices, Special Characters & Out-Of-Bounds
const complexObj = {
    "hello world! @#%": "special_val",
    "if": "keyword_val",
    arr: [10, 20, 30, 40, 50],
    nested: { deep: { a: { b: 99 } } }
};

assert(jsonPathMatch(complexObj, "$['hello world! @#%']") === "special_val", "Keys with spaces and special symbols");
assert(jsonPathMatch(complexObj, "$['if']") === "keyword_val", "Keys matching JS reserved keywords");
assert(jsonPathMatch(complexObj, "$.arr[:]") === "10", "Full default array slice returns first element");
assert(jsonPathMatch(complexObj, "$.arr[1:]") === "20", "Array slice with start only");
assert(jsonPathMatch(complexObj, "$.arr[:2]") === "10", "Array slice with end only");
assert(jsonPathMatch(complexObj, "$.arr[::2]") === "10", "Array slice with step only");
assert(jsonPathMatch(complexObj, "$.arr[-3:-1]") === "30", "Array slice with negative indices");
assert(jsonPathMatch(complexObj, "$.arr[999]") === null, "Out of bounds positive index returns null");
assert(jsonPathMatch(complexObj, "$.arr[-999]") === null, "Out of bounds negative index returns null");
assert(jsonPathMatch(complexObj, "$..b") === "99", "Deeply nested recursive key match");
assert(jsonPathMatch(complexObj, "$.arr[0]trailing") === null, "Trailing invalid syntax fails cleanly");

// 9. Ultra-Complex 10/10 Difficult JSONPath Edge Cases
const ultraData = {
    "store": {
        "catalog": {
            "..meta": {
                "item-types": ["book", "electronics"]
            },
            "inventory": [
                {
                    "id": "item1",
                    "matrix": [
                        { "tags": ["alpha", "beta"] },
                        { "tags": ["gamma", "delta"] }
                    ]
                },
                {
                    "id": "item2",
                    "matrix": [
                        { "tags": ["omega", "sigma"] }
                    ]
                }
            ]
        }
    },
    "numbers": [0, 1, 2, 3, 4, 5, 6, 7],
    "operators": {
        "..store": {
            ".items[*]": {
                "[1:5]": "matched_operator_key"
            }
        }
    }
};

assert(jsonPathMatch(ultraData, "$..matrix[::-1].tags[1]") === "delta", "Recursive descent + reverse slice + property + sub-index");
assert(jsonPathMatch(ultraData, "$.numbers[::-2]") === "7", "Negative step slice [::-2]");
assert(jsonPathMatch(ultraData, "$.numbers[1:6:2]") === "1", "Positive step slice [1:6:2]");
assert(jsonPathMatch(ultraData, "$['operators']['..store']['.items[*]']['[1:5]']") === "matched_operator_key", "Quoted keys containing literal JSONPath syntax characters");
assert(jsonPathMatch(ultraData, "$..item-types[1]") === "electronics", "Recursive search matching dotted key with dash");

// 10. Empty String Property Keys & Integer Parse Safety
assert(jsonPathMatch({ "": "empty_key" }, "$['']") === "empty_key", "Empty string property key in single quotes");
assert(jsonPathMatch({ "": "empty_key_dq" }, '$[""]') === "empty_key_dq", "Empty string property key in double quotes");
assert(jsonPathMatch({ items: [10, 20] }, "$.items[99999999999999999999]") === null, "Huge overflow index returns null without crashing or parsing to NaN/Infinity");

// 11. Hyper-Complex Complex JSON Structures
const megaComplexObj = {
    "a.b": [
        {
            "c[d]": {
                "e:f": [
                    { "g": 100 },
                    { "g": 200 }
                ]
            }
        }
    ],
    "deep": [
        null,
        123,
        true,
        {
            "target": [
                { "val": "found_me" }
            ]
        }
    ]
};

assert(jsonPathMatch(megaComplexObj, "$['a.b'][0]['c[d]']['e:f'][1].g") === "200", "Complex object with escaped character keys");
assert(jsonPathMatch(megaComplexObj, "$.deep[*].target[0].val") === "found_me", "Wildcard array search ignoring primitives and nulls in array");

// 12. Robust Array Slice Edge Cases (Omits, Empty Bounds & Default Steps)
const sliceTestObj = { arr: [10, 20, 30, 40, 50] };
assert(jsonPathMatch(sliceTestObj, "$.arr[:]") === "10", "Slice with empty start and end [:]");
assert(jsonPathMatch(sliceTestObj, "$.arr[::]") === "10", "Slice with empty start, end, and step [::]");
assert(jsonPathMatch(sliceTestObj, "$.arr[1::]") === "20", "Slice with start only and empty step [1::]");
assert(jsonPathMatch(sliceTestObj, "$.arr[:3:]") === "10", "Slice with end only and empty step [:3:]");
assert(jsonPathMatch(sliceTestObj, "$.arr[::1]") === "10", "Slice with explicit step 1 [::1]");

// 6. DataFrame Column Expression Verification
const dfValid = $df.data({
    json_str: [
        '{"user": {"name": "Alice", "age": 30, "tags": ["admin", "dev"]}, "active": true}',
        '{"user": {"name": "Bob", "age": 25, "tags": ["user", "guest", "tester"]}, "active": false}',
        null
    ]
});

const res = dfValid.with_columns([
    $df.col("json_str").str.json_path_match("$").alias("root"),
    $df.col("json_str").str.json_path_match("$.user.name").alias("name"),
    $df.col("json_str").str.json_path_match("$['user']['name']").alias("single_quoted_name"),
    $df.col("json_str").str.json_path_match('$["user"]["name"]').alias("double_quoted_name"),
    $df.col("json_str").str.json_path_match("$.user.age").alias("age"),
    $df.col("json_str").str.json_path_match("$.active").alias("active"),
    $df.col("json_str").str.json_path_match("$.user.tags[0]").alias("first_tag"),
    $df.col("json_str").str.json_path_match("$.user.tags[-1]").alias("last_tag"),
    $df.col("json_str").str.json_path_match("$.user.tags[:2]").alias("tags_slice"),
    $df.col("json_str").str.json_path_match("$..tags").alias("recursive_tags"),
    $df.col("json_str").str.json_path_match("$..name").alias("recursive_name"),
    $df.col("json_str").str.json_path_match("$.user.*").alias("user_wildcard"),
    $df.col("json_str").str.json_path_match("$.missing").alias("missing")
]);

const records = res.to_dicts() as any[];

assert(records[0].name === "Alice", "Row 0 name");
assert(records[0].single_quoted_name === "Alice", "Row 0 single quoted name");
assert(records[0].double_quoted_name === "Alice", "Row 0 double quoted name");
assert(records[0].age === "30", "Row 0 age");
assert(records[0].active === "true", "Row 0 active");
assert(records[0].first_tag === "admin", "Row 0 first tag");
assert(records[0].last_tag === "dev", "Row 0 last tag");
assert(records[0].tags_slice === "admin", "Row 0 tags slice");
assert(records[0].recursive_name === "Alice", "Row 0 recursive name");
assert(records[0].missing === null, "Row 0 missing");

assert(records[1].name === "Bob", "Row 1 name");
assert(records[1].last_tag === "tester", "Row 1 last tag");
assert(records[1].active === "false", "Row 1 active");
assert(records[2].name === null, "Row 2 null row");

// Verify error thrown on invalid JSON string
const dfInvalid = $df.data({ json_str: ["{ invalid_json: 123 }"] });
let errorThrown = false;
try {
    dfInvalid.with_columns($df.col("json_str").str.json_path_match("$.user.name"));
} catch (e: any) {
    errorThrown = true;
}
assert(errorThrown, "Expected error to be thrown on invalid JSON string");

// 13. Hardest Extreme Edge Case Tests: Escaped Quotes & Advanced Recursion
const extremeEscapedObj = {
    "key with 'single' quote": "val_single",
    'key with "double" quote': "val_double",
    "key\\with\\backslash": "val_slash"
};
assert(jsonPathMatch(extremeEscapedObj, "$['key with \\'single\\' quote']") === "val_single", "Escaped single quotes inside bracket key match");
assert(jsonPathMatch(extremeEscapedObj, '$["key with \\"double\\" quote"]') === "val_double", "Escaped double quotes inside bracket key match");

// 14. 11/10 Difficulty Edge Case Tests: Ultra-Complex Structural & Syntactic Traps
const nightmareData = {
    "foo": [
        { "bar": { "target\\key": "escaped_slash_success" } },
        { "bar": null },
        "primitive_in_array",
        [10, 20, { "target\\key": "nested_in_arr" }]
    ],
    "__proto__": { "polluted": "yes" },
    "constructor": { "prototype": "dangerous" },
    "empty_arr": []
};

// Test A: Escaped backslashes inside quoted key syntax
assert(jsonPathMatch(nightmareData, "$['foo'][0]['bar']['target\\\\key']") === "escaped_slash_success", "11/10: Escaped backslashes in quoted key");

// Test B: Prototype pollution & reserved property security
assert(jsonPathMatch(nightmareData, "$.__proto__.polluted") === null, "11/10: Prototype pollution block for __proto__");
assert(jsonPathMatch(nightmareData, "$.constructor.prototype") === null, "11/10: Prototype pollution block for constructor");

// Test C: Out-of-bounds slice on empty array
assert(jsonPathMatch(nightmareData, "$.empty_arr[0:5:1]") === null, "11/10: Slicing empty array returns null");
assert(jsonPathMatch(nightmareData, "$.empty_arr[-1]") === null, "11/10: Negative index on empty array returns null");

// Test D: Deep recursive search traversing past primitives and nulls
assert(jsonPathMatch(nightmareData, "$..['target\\\\key']") === "escaped_slash_success", "11/10: Recursive descent across array of mixed primitives and nulls");

// Test E: Unclosed / Mismatched Quotes Syntax Rejection
assert(jsonPathMatch(nightmareData, "$.foo['bar\"") === null, "11/10: Unmatched quote bracket syntax fails cleanly with null");
assert(jsonPathMatch(nightmareData, "$.foo['bar") === null, "11/10: Unclosed single quote bracket syntax fails cleanly with null");

// 15. 15/10 Ultimate Difficult Edge Case Gauntlet
const cyclicObj: any = { name: "root" };
cyclicObj.self = cyclicObj;
cyclicObj.nested = { target: "found_in_cyclic", parent: cyclicObj };

assert(jsonPathMatch(cyclicObj, "$..target") === "found_in_cyclic", "15/10: Circular object graph does not infinite loop / stack overflow and finds target");
assert(jsonPathMatch({ self: cyclicObj }, "$.self") === null, "15/10: Circular object result fails stringification safely returning null without throw");

const escapeObj = {
    "line\nbreak": "yes_newline",
    "tab\tkey": "yes_tab",
    "carriage\rreturn": "yes_cr"
};
assert(jsonPathMatch(escapeObj, "$['line\\nbreak']") === "yes_newline", "15/10: Escaped newline \\n in single quoted bracket syntax");
assert(jsonPathMatch(escapeObj, '$["tab\\tkey"]') === "yes_tab", "15/10: Escaped tab \\t in double quoted bracket syntax");

const recBracketData = { catalog: { items: [100, 200] } };
assert(jsonPathMatch(recBracketData, "$..[*]") === '{"items":[100,200]}', "15/10: Recursive bracket wildcard $..[*]");
assert(jsonPathMatch(recBracketData, "$..items[0]") === "100", "15/10: Recursive descent + items index match");

assert(jsonPathMatch(nightmareData, "$..__proto__") === null, "15/10: Recursive search for __proto__ blocked safely");
assert(jsonPathMatch(nightmareData, "$..constructor") === null, "15/10: Recursive search for constructor blocked safely");

// 16. 20/10 Apex Nightmare Gauntlet Test
const apexObj: any = {
    hasOwnProperty: null,
    "[0]": {
        ".key": "escaped_syntax_key_val"
    },
    matrix: [
        { tags: ["v0", "v1"] },
        { tags: ["v2", "v3"] }
    ]
};
apexObj.self = apexObj; // cyclic link

assert(jsonPathMatch(apexObj, "$['hasOwnProperty']") === null, "20/10: Overridden hasOwnProperty property set to null returns null safely");
assert(jsonPathMatch(apexObj, "$['[0]']['.key']") === "escaped_syntax_key_val", "20/10: Quoted bracket keys containing array index & dot syntax");
assert(jsonPathMatch(apexObj, "$..matrix[::-1].tags[0]") === "v2", "20/10: Recursive descent + reverse slice + array sub-index on cyclic graph");
assert(jsonPathMatch(apexObj, "$.matrix[99999999999999999999]") === null, "20/10: BigInt overflow index returns null cleanly");
assert(jsonPathMatch(apexObj, "$.matrix['unclosed") === null, "20/10: Unclosed single quote bracket returns null cleanly");

console.log("🎉 All .str.json_path_match & jsonPathMatch robust edge case tests passed successfully!");
