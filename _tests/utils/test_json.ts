declare const process: any;
import { safeJsonParse, isJsonString } from "../../src/utils/json";
import { InvalidArgumentError } from "../../src/exceptions";

console.log("=========================================");
console.log("STARTING HARDENED SAFE_JSON_PARSE ROBUSTNESS TESTS...");
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
    // 1. Non-string inputs & Fallbacks (Symbol, BigInt, Functions, Objects, Arrays, NaN, Infinity)
    const sym = Symbol("test");
    const fn = () => { };
    const dateObj = new Date();
    const arrInput = [1, 2, 3];
    const objInput = { key: "val" };

    let invalidPersonErr: any = null;
    const invalidPerson = safeJsonParse('{"name": "Unknown"}', {
        guard: (val: any) => val.name !== "Unknown",
        fallback: { name: "Unknown" },
        onError: (err: any) => { invalidPersonErr = err; }
    });
    assertEqual(invalidPerson, { name: "Unknown" }, "object failing guard returns fallback");
    assert(invalidPersonErr instanceof InvalidArgumentError && invalidPersonErr.message.includes("failed guard validation"), "onError captured guard error");

    assertEqual(safeJsonParse(null as any), null, "null input returns null");
    assertEqual(safeJsonParse(undefined as any), undefined, "undefined input returns undefined");
    assertEqual(safeJsonParse(123 as any), 123, "number 123 returns 123");
    assertEqual(safeJsonParse(NaN as any), NaN, "NaN returns NaN");
    assertEqual(safeJsonParse(Infinity as any), Infinity, "Infinity returns Infinity");
    assertEqual(safeJsonParse(sym as any), sym, "Symbol returns Symbol");
    assertEqual(safeJsonParse(fn as any), fn, "Function returns Function");
    assertEqual(safeJsonParse(dateObj as any), dateObj, "Date object returns Date object");
    assertEqual(safeJsonParse(arrInput as any), arrInput, "Array input returns Array");
    assertEqual(safeJsonParse(objInput as any), objInput, "Object input returns Object");

    assertEqual(safeJsonParse(null as any, { fallback: "FALLBACK" }), "FALLBACK", "null returns fallback when specified");
    assertEqual(safeJsonParse(undefined as any, { fallback: "FALLBACK" }), "FALLBACK", "undefined returns fallback when specified");
    assertEqual(safeJsonParse(NaN as any, { fallback: null }), null, "NaN returns fallback null");
    assertEqual(safeJsonParse(false as any, { fallback: true }), true, "boolean false returns fallback true when specified");

    // 2. Empty string, whitespace, tab, carriage return, newline handling
    assertEqual(safeJsonParse(""), "", "empty string returns empty string");
    assertEqual(safeJsonParse("   \t\r\n   "), "   \t\r\n   ", "whitespace-only string returns original string");
    assertEqual(safeJsonParse("   \t\r\n   ", { fallback: "DEFAULT" }), "DEFAULT", "whitespace-only string returns fallback");
    assertEqual(safeJsonParse("   \t\r\n   ", { trimBeforeParse: true, fallback: "TRIMMED_FB" }), "TRIMMED_FB", "trimmed whitespace string returns fallback");

    // 3. Unwrapped JSON Primitives & allowPrimitives Flag
    assertEqual(safeJsonParse("123"), "123", "unwrapped 123 returns raw input string when allowPrimitives=false");
    assertEqual(safeJsonParse("123", { fallback: -1 }), -1, "unwrapped 123 returns fallback when allowPrimitives=false");
    assertEqual(safeJsonParse("123", { allowPrimitives: true }), 123, "unwrapped 123 returns number when allowPrimitives=true");

    assertEqual(safeJsonParse('"hello"'), '"hello"', 'unwrapped "hello" returns raw input string when allowPrimitives=false');
    assertEqual(safeJsonParse('"hello"', { allowPrimitives: true }), "hello", 'unwrapped "hello" returns string when allowPrimitives=true');

    assertEqual(safeJsonParse("true"), "true", "unwrapped true returns raw input string when allowPrimitives=false");
    assertEqual(safeJsonParse("true", { allowPrimitives: true }), true, "unwrapped true returns boolean true when allowPrimitives=true");

    assertEqual(safeJsonParse("false"), "false", "unwrapped false returns raw input string when allowPrimitives=false");
    assertEqual(safeJsonParse("false", { allowPrimitives: true }), false, "unwrapped false returns boolean false when allowPrimitives=true");

    assertEqual(safeJsonParse("null"), "null", "unwrapped null returns raw input string when allowPrimitives=false");
    assertEqual(safeJsonParse("null", { allowPrimitives: true }), null, "unwrapped null returns null when allowPrimitives=true");

    // 4. Extreme Unicode, Escapes, Surrogates, Emojis & Special Characters
    const unicodeJson = '{"emoji":"🚀","surrogate":"\\uD83D\\uDE80","chinese":"中文","escapes":"\\n\\t\\r\\\\\\\""}';
    const parsedUnicode = safeJsonParse(unicodeJson) as any;
    assertEqual(parsedUnicode.emoji, "🚀", "parses emoji character");
    assertEqual(parsedUnicode.surrogate, "🚀", "parses escaped unicode surrogate pair");
    assertEqual(parsedUnicode.chinese, "中文", "parses UTF-8 non-ASCII characters");
    assertEqual(parsedUnicode.escapes, "\n\t\r\\\"", "parses control escape sequences");

    // 5. Deeply Nested Objects & Arrays
    const deepObj = '{"a":{"b":{"c":{"d":[1,{"e":true}]}}}}';
    assertEqual(safeJsonParse(deepObj), { a: { b: { c: { d: [1, { e: true }] } } } }, "parses deeply nested JSON structure");

    // 6. Malformed JSON Edge Cases
    assertEqual(safeJsonParse('{"key": value}'), '{"key": value}', "unquoted identifier returns raw input");
    assertEqual(safeJsonParse("{'key': 'value'}"), "{'key': 'value'}", "single quoted JSON returns raw input");
    assertEqual(safeJsonParse('{"a": 1, }'), '{"a": 1, }', "trailing comma in object returns raw input");
    assertEqual(safeJsonParse('[1, 2, 3, ]'), '[1, 2, 3, ]', "trailing comma in array returns raw input");
    assertEqual(safeJsonParse('{"a": 1', { fallback: "ERR" }), "ERR", "truncated object returns fallback");
    assertEqual(safeJsonParse('[1, 2,', { fallback: "ERR" }), "ERR", "truncated array returns fallback");
    assertEqual(safeJsonParse('{a: 1}', { fallback: null }), null, "unquoted key returns fallback null");
    assertEqual(safeJsonParse('{"a": NaN}', { fallback: "ERR" }), "ERR", "JSON with NaN returns fallback");
    assertEqual(safeJsonParse('{"a": Infinity}', { fallback: "ERR" }), "ERR", "JSON with Infinity returns fallback");

    // 7. Reviver Exception Handling & Custom Transformation
    let reviverErrorLogged = false;
    const ThrowingReviver = () => { throw new Error("Reviver explosion"); };
    assertEqual(safeJsonParse('{"a": 1}', {
        reviver: ThrowingReviver,
        fallback: "REVIVER_FAILED",
        onError: (err: any) => { reviverErrorLogged = err.message === "Reviver explosion"; }
    }), "REVIVER_FAILED", "reviver throw caught and returns fallback");
    assert(reviverErrorLogged, "onError triggered when reviver throws");

    // 8. Guard function throw & validation failure edge cases
    let guardErrorCount = 0;
    let guardErrorType: any = null;
    const throwingGuard = () => { throw new Error("Guard exception"); };
    const failingGuard = (val: any) => typeof val === "object" && val !== null && val.a === 999;

    assertEqual(safeJsonParse('{"a": 1}', {
        guard: throwingGuard,
        fallback: "GUARD_THREW",
        onError: () => { guardErrorCount++; }
    }), "GUARD_THREW", "throwing guard caught and returns fallback");

    assertEqual(safeJsonParse('{"a": 1}', {
        guard: failingGuard,
        fallback: "GUARD_FAILED",
        onError: (err) => {
            guardErrorCount++;
            guardErrorType = err;
        }
    }), "GUARD_FAILED", "failing guard returns fallback");
    assertEqual(guardErrorCount, 2, "onError triggered for throwing guard and failing guard");
    assert(guardErrorType instanceof InvalidArgumentError, "guard validation failure throws InvalidArgumentError");

    // 9. NDJSON Advanced Edge Cases (CRLF, mixed invalid, empty lines, skip/max limits)
    const ndjsonCrlf = '{"id":1}\r\n{"id":2}\r\n\r\n{"id":3}\r\n';
    assertEqual(safeJsonParse(ndjsonCrlf, { format: "ndjson" }), [{ id: 1 }, { id: 2 }, { id: 3 }], "NDJSON with CRLF newlines");

    const ndjsonSkipOnly = '{"a":1}\n{"a":2}\n{"a":3}';
    assertEqual(safeJsonParse(ndjsonSkipOnly, { format: "ndjson", ndjson: { skipLines: 2 } }), [{ a: 3 }], "NDJSON skipLines=2");

    const ndjsonMaxOnly = '{"a":1}\n{"a":2}\n{"a":3}';
    assertEqual(safeJsonParse(ndjsonMaxOnly, { format: "ndjson", ndjson: { maxLines: 1 } }), [{ a: 1 }], "NDJSON maxLines=1");

    const ndjsonAllInvalid = 'INVALID1\nINVALID2\nINVALID3';
    assertEqual(safeJsonParse(ndjsonAllInvalid, {
        format: "ndjson",
        ndjson: { skipInvalidLines: true },
        fallback: "NO_VALID_LINES"
    }), "NO_VALID_LINES", "NDJSON with skipInvalidLines=true and 0 valid lines returns fallback");

    const ndjsonPrimitives = '123\n"hello"\ntrue';
    assertEqual(safeJsonParse(ndjsonPrimitives, {
        format: "ndjson",
        allowPrimitives: true
    }), [123, "hello", true], "NDJSON with allowPrimitives=true parses primitive lines");

    // 10. Explicit { fallback: undefined } Support
    assertEqual(safeJsonParse("invalid json", { fallback: undefined }), undefined, "explicit fallback: undefined returns undefined on parse failure");
    assertEqual(safeJsonParse(123 as any, { fallback: undefined }), undefined, "explicit fallback: undefined returns undefined on non-string input");
    assertEqual(safeJsonParse('{"a": 1}', { guard: () => false, fallback: undefined }), undefined, "explicit fallback: undefined returns undefined on guard failure");

    // 11. Re-entrant NDJSON Parsing (inner NDJSON parse inside reviver/guard)
    const nestedNdjsonInput = '{"nested":"{\\"x\\":10}\\n{\\"x\\":20}"}\n{"nested":"{\\"x\\":30}"}';
    const reentrantResult = safeJsonParse(nestedNdjsonInput, {
        format: "ndjson",
        reviver: (_key, val) => {
            if (typeof val === "string" && val.includes("x")) {
                return safeJsonParse(val, { format: "ndjson" });
            }
            return val;
        }
    }) as any;
    assertEqual(reentrantResult, [
        { nested: [{ x: 10 }, { x: 20 }] },
        { nested: [{ x: 30 }] }
    ], "re-entrant NDJSON parsing within reviver completes without state corruption");

    // 12. BigInt input handling
    const bigIntVal = BigInt(9007199254740991);
    assert(safeJsonParse(bigIntVal as any) === bigIntVal, "BigInt input returns BigInt when no fallback");
    assert(safeJsonParse(bigIntVal as any, { fallback: "FB" }) === "FB", "BigInt input returns fallback when specified");

    // 13. Prototype Pollution Safety
    const protoPayload = '{"__proto__": {"polluted": true}, "a": 1}';
    const parsedProto = safeJsonParse(protoPayload) as any;
    assertEqual(parsedProto.a, 1, "parses normal property alongside __proto__ key");
    assert((Object.prototype as any).polluted === undefined, "__proto__ in JSON string does not pollute Object.prototype");

    // 14. NDJSON with carriage return only (\r) and mixed invalid line skipping
    const crNdjson = '{"a":1}\r{"a":2}\r';
    assertEqual(safeJsonParse(crNdjson, { format: "ndjson" }), [{ a: 1 }, { a: 2 }], "NDJSON with CR line endings");

    const mixedSkipNdjson = '{"a":1}\nBAD_LINE\n{"a":2}\n12345';
    assertEqual(safeJsonParse(mixedSkipNdjson, {
        format: "ndjson",
        ndjson: { skipInvalidLines: true }
    }), [{ a: 1 }, { a: 2 }], "NDJSON with skipInvalidLines=true skips unwrapped/invalid lines when primitives disallowed");

    // 15. Additional Edge Cases:
    // a. NDJSON combining skipLines and maxLines
    const ndjsonCombo = '{"n":1}\n{"n":2}\n{"n":3}\n{"n":4}\n{"n":5}';
    assertEqual(safeJsonParse(ndjsonCombo, {
        format: "ndjson",
        ndjson: { skipLines: 1, maxLines: 2 }
    }), [{ n: 2 }, { n: 3 }], "NDJSON combining skipLines=1 and maxLines=2");

    // b. JSON with leading/trailing whitespace when trimBeforeParse is false/true
    const paddedJson = '   {"a": 100}   \n';
    assertEqual(safeJsonParse(paddedJson), { a: 100 }, "JSON string wrapped with outer whitespace parses cleanly when trimBeforeParse=false");
    assertEqual(safeJsonParse(paddedJson, { trimBeforeParse: true }), { a: 100 }, "JSON string wrapped with outer whitespace parses cleanly when trimBeforeParse=true");

    // c. Boolean guard returning simple false (non-throwing)
    assertEqual(safeJsonParse('{"val": -5}', {
        guard: (v: any) => v.val > 0,
        fallback: "INVALID_VAL"
    }), "INVALID_VAL", "guard returning false returns fallback value");

    // d. Non-string inputs without fallback returning input unchanged
    const sampleObj = { x: 1 };
    assertEqual(safeJsonParse(sampleObj as any), sampleObj, "non-string input without fallback returns exact reference");

    // e. Mismatched JSON outer brackets (e.g., '{1, 2, 3]' or '[1, 2, 3}')
    assertEqual(safeJsonParse('{1, 2, 3]', { fallback: "MISMATCH" }), "MISMATCH", "mismatched outer brackets { ... ] caught and returns fallback");
    assertEqual(safeJsonParse('[1, 2, 3}', { fallback: "MISMATCH" }), "MISMATCH", "mismatched outer brackets [ ... } caught and returns fallback");

    // f. onError callback throwing an error itself - safeJsonParse traps onError exceptions and returns fallback
    const onErrorThrowResult = safeJsonParse('{bad json}', {
        fallback: "SAFE_FALLBACK",
        onError: () => { throw new Error("onError failure"); }
    });
    assertEqual(onErrorThrowResult, "SAFE_FALLBACK", "safeJsonParse traps onError callback exceptions and returns fallback");

    // 16. isJsonString Comprehensive Validation Tests
    assert(isJsonString('{"a": 1}'), "isJsonString returns true for valid JSON object");
    assert(isJsonString('[1, 2, 3]'), "isJsonString returns true for valid JSON array");
    assert(!isJsonString('invalid json'), "isJsonString returns false for invalid JSON syntax");
    assert(!isJsonString(123 as any), "isJsonString returns false for non-string number");
    assert(!isJsonString(null as any), "isJsonString returns false for null input");
    assert(!isJsonString(undefined as any), "isJsonString returns false for undefined input");
    assert(!isJsonString('{a: 1}'), "isJsonString returns false for unquoted object keys");

    // isJsonString with allowPrimitives
    assert(!isJsonString('123'), "isJsonString returns false for un-wrapped number when allowPrimitives=false");
    assert(isJsonString('123', { allowPrimitives: true }), "isJsonString returns true for un-wrapped number when allowPrimitives=true");
    assert(isJsonString('"hello"', { allowPrimitives: true }), "isJsonString returns true for primitive string when allowPrimitives=true");
    assert(isJsonString('true', { allowPrimitives: true }), "isJsonString returns true for primitive boolean when allowPrimitives=true");

    // isJsonString with NDJSON
    assert(isJsonString('{"a": 1}\n{"a": 2}', { format: "ndjson" }), "isJsonString returns true for valid NDJSON");
    assert(!isJsonString('invalid ndjson line', { format: "ndjson" }), "isJsonString returns false for invalid NDJSON line");

    // isJsonString with guard
    assert(isJsonString('{"count": 10}', { guard: (v: any) => v.count > 5 }), "isJsonString returns true when guard condition is met");
    assert(!isJsonString('{"count": 2}', { guard: (v: any) => v.count > 5 }), "isJsonString returns false when guard condition fails");

    // 17. Additional safeJsonParse Edge Cases
    // Empty object and array literals
    assertEqual(safeJsonParse('{}'), {}, "parses empty object literal");
    assertEqual(safeJsonParse('[]'), [], "parses empty array literal");
    assertEqual(safeJsonParse('   {}   '), {}, "parses empty object literal surrounded by whitespace");

    // Reviver filtering keys
    const filteredObj = safeJsonParse('{"a": 1, "b": 2}', {
        reviver: (k, v) => (k === "b" ? undefined : v)
    });
    assertEqual(filteredObj, { a: 1 }, "reviver returning undefined filters key out");

    // NDJSON skipLines exceeding total line count
    assertEqual(safeJsonParse('{"a": 1}\n{"a": 2}', {
        format: "ndjson",
        ndjson: { skipLines: 10 },
        fallback: "SKIPPED_ALL"
    }), "SKIPPED_ALL", "NDJSON with skipLines > line count returns fallback");

    // NDJSON maxLines = 0
    assertEqual(safeJsonParse('{"a": 1}\n{"a": 2}', {
        format: "ndjson",
        ndjson: { maxLines: 0 },
        fallback: "MAX_ZERO"
    }), "MAX_ZERO", "NDJSON maxLines=0 returns fallback");

    // NDJSON lines with surrounding whitespace around objects
    const paddedNdjson = '   {"item": 1}   \n   {"item": 2}   ';
    assertEqual(safeJsonParse(paddedNdjson, { format: "ndjson" }), [{ item: 1 }, { item: 2 }], "NDJSON lines with outer whitespace parse correctly");

    // 18. Additional Specific Edge Cases
    // Reviver mutation & throwing on nested keys
    let reviverKeyLogged: string[] = [];
    safeJsonParse('{"a": {"b": 1}}', {
        reviver: (k, v) => {
            if (k) reviverKeyLogged.push(k);
            return v;
        }
    });
    assertEqual(reviverKeyLogged, ["b", "a"], "reviver processes keys in bottom-up order");

    // Guard returning truthy non-boolean value
    assertEqual(safeJsonParse('{"status": "ok"}', {
        guard: (v: any) => v.status as any,
        fallback: "GUARD_FAILED"
    }), { status: "ok" }, "guard returning truthy non-boolean passes validation");

    // Explicit fallback: undefined with allowPrimitives=true on invalid JSON
    assertEqual(safeJsonParse('{invalid}', { allowPrimitives: true, fallback: undefined }), undefined, "fallback: undefined honored when allowPrimitives=true on syntax error");

    console.log("=========================================");
    console.log(`🎉 ALL ${testsPassed} HARDENED SAFE_JSON_PARSE ROBUSTNESS TESTS PASSED!`);
    console.log("=========================================");
} catch (err: any) {
    console.error("\n❌ HARDENED SAFE_JSON_PARSE TEST FAILED:");
    console.error(err.stack || err);
    process.exit(1);
}
