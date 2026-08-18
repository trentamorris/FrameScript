declare const process: any;
import { safeJsonParse, isJsonString, createSafeJsonReplacer, tokenizeJsonPath, evaluateJsonToken, jsonPathMatch } from "../../src/utils/json";
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

    // NDJSON skipLines exceeding total line count returns []
    assertEqual(safeJsonParse('{"a": 1}\n{"a": 2}', {
        format: "ndjson",
        ndjson: { skipLines: 10 }
    }), [], "NDJSON with skipLines > line count successfully returns empty array");

    // NDJSON maxLines = 0 returns []
    assertEqual(safeJsonParse('{"a": 1}\n{"a": 2}', {
        format: "ndjson",
        ndjson: { maxLines: 0 }
    }), [], "NDJSON maxLines=0 successfully returns empty array");

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

    // 19. Additional In-depth Edge Case Tests
    // Mixed newline styles in NDJSON (CRLF, LF, CR)
    const mixedNewlines = '{"id": 1}\r\n{"id": 2}\n{"id": 3}\r{"id": 4}';
    assertEqual(safeJsonParse(mixedNewlines, { format: "ndjson" }), [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }], "handles mixed CRLF, LF, CR newlines");

    // NDJSON with consecutive blank lines and trailing newlines
    const spacedNdjson = '\n\n  {"x": 10}  \r\n\r\n  {"x": 20}  \n\n';
    assertEqual(safeJsonParse(spacedNdjson, { format: "ndjson" }), [{ x: 10 }, { x: 20 }], "handles leading/trailing/intermediate empty lines in NDJSON");

    // NDJSON with skipLines, maxLines, and skipInvalidLines together
    const complexNdjson = 'invalid_line_1\n{"valid": 1}\ninvalid_line_2\n{"valid": 2}\n{"valid": 3}\n{"valid": 4}';
    const complexResult = safeJsonParse(complexNdjson, {
        format: "ndjson",
        ndjson: {
            skipInvalidLines: true,
            maxLines: 2,
            skipLines: 1 // skips 'invalid_line_1' as the 1st non-empty line
        }
    });
    assertEqual(complexResult, [{ valid: 1 }, { valid: 2 }], "complex combination of skipInvalidLines, maxLines, and skipLines works seamlessly");

    // JSON Primitive edge cases with allowPrimitives: true vs false
    assertEqual(safeJsonParse("true", { allowPrimitives: true }), true, "parses boolean literal true when allowPrimitives=true");
    assertEqual(safeJsonParse("false", { allowPrimitives: true }), false, "parses boolean literal false when allowPrimitives=true");
    assertEqual(safeJsonParse("null", { allowPrimitives: true }), null, "parses null literal when allowPrimitives=true");
    assertEqual(safeJsonParse("0", { allowPrimitives: true }), 0, "parses 0 when allowPrimitives=true");
    assertEqual(safeJsonParse("-123.456", { allowPrimitives: true }), -123.456, "parses negative float when allowPrimitives=true");

    assertEqual(safeJsonParse("true", { allowPrimitives: false, fallback: "NOT_ALLOWED" }), "NOT_ALLOWED", "rejects boolean true when allowPrimitives=false");
    assertEqual(safeJsonParse("false", { allowPrimitives: false, fallback: "NOT_ALLOWED" }), "NOT_ALLOWED", "rejects boolean false when allowPrimitives=false");
    assertEqual(safeJsonParse("null", { allowPrimitives: false, fallback: "NOT_ALLOWED" }), "NOT_ALLOWED", "rejects null when allowPrimitives=false");
    assertEqual(safeJsonParse("0", { allowPrimitives: false, fallback: "NOT_ALLOWED" }), "NOT_ALLOWED", "rejects 0 when allowPrimitives=false");

    // NDJSON with allowPrimitives: true
    const primitiveNdjson = '10\n"text"\ntrue\nnull\n{"obj": 1}';
    assertEqual(safeJsonParse(primitiveNdjson, { format: "ndjson", allowPrimitives: true }), [10, "text", true, null, { obj: 1 }], "NDJSON parses primitives when allowPrimitives=true");

    // NDJSON with allowPrimitives: false rejecting unwrapped line
    assertEqual(safeJsonParse(primitiveNdjson, { format: "ndjson", allowPrimitives: false, fallback: "REJECTED" }), "REJECTED", "NDJSON with allowPrimitives=false rejects primitive lines");

    // NDJSON with allowPrimitives: false and skipInvalidLines: true skips primitive lines
    assertEqual(safeJsonParse(primitiveNdjson, { format: "ndjson", allowPrimitives: false, ndjson: { skipInvalidLines: true } }), [{ obj: 1 }], "NDJSON with skipInvalidLines skips primitive lines when allowPrimitives=false");

    // Mismatched composite wrappers should fail
    assertEqual(safeJsonParse('{"a": 1]', { fallback: "MISMATCH" }), "MISMATCH", "mismatched { and ] fails parsing");
    assertEqual(safeJsonParse('["a", 1}', { fallback: "MISMATCH" }), "MISMATCH", "mismatched [ and } fails parsing");

    // Malformed expressions with wrapped edges (e.g. "{ a: 1 } + { b: 2 }" or "{ valid } trailing junk")
    assertEqual(safeJsonParse('{ "a": 1 } + { "b": 2 }', { fallback: "INVALID_EXPR" }), "INVALID_EXPR", "fails concatenated objects with wrapped outer braces");
    assertEqual(safeJsonParse('{ "a": 1 } trailing_text', { fallback: "TRAILING_JUNK" }), "TRAILING_JUNK", "fails object with trailing junk");
    assertEqual(safeJsonParse('[1, 2] [3, 4]', { fallback: "TWO_ARRAYS" }), "TWO_ARRAYS", "fails multiple arrays in single JSON string");

    // Guard receiving full array in NDJSON
    assert(isJsonString('{"a": 1}\n{"a": 2}', { format: "ndjson", guard: (arr: any) => Array.isArray(arr) && arr.length === 2 }), "isJsonString passes guard on NDJSON array");
    assert(!isJsonString('{"a": 1}\n{"a": 2}', { format: "ndjson", guard: (arr: any) => Array.isArray(arr) && arr.length === 5 }), "isJsonString fails when guard predicate is false on NDJSON array");

    // onError handler throws an exception - safeJsonParse must NOT crash and must return fallback
    const crashOnError = safeJsonParse("invalid json", {
        fallback: "SAFE_RECOVERY",
        onError: () => {
            throw new Error("Logger crashed internally");
        }
    });
    assertEqual(crashOnError, "SAFE_RECOVERY", "safeJsonParse catches errors thrown inside custom onError callbacks");

    // 20. Ultra-Complex & Adversarial JSON Tests
    // Escaped quotes, newlines, and Unicode inside JSON strings
    const complexJsonPayload = JSON.stringify({
        nested: {
            arr: [1, "line1\nline2\r\nline3\t", { "unicode": "\u0041\u0042\u0043 \uD83D\uDE00", flag: true }],
            emptyObj: {},
            emptyArr: []
        },
        nullVal: null,
        num: -9007199254740991
    });
    const parsedComplex = safeJsonParse(complexJsonPayload);
    assertEqual((parsedComplex as any)?.nested?.arr?.[1], "line1\nline2\r\nline3\t", "safely parses complex multi-line escaped strings");
    assertEqual((parsedComplex as any)?.nested?.arr?.[2]?.unicode, "ABC 😀", "safely parses surrogate pair emojis and unicode escapes");

    // Prototype pollution payload check - ensure standard Object prototype is untouched
    const maliciousPayload = '{"__proto__": {"polluted": true}, "constructor": {"prototype": {"admin": true}}}';
    const parsedMalicious = safeJsonParse(maliciousPayload);
    assert(parsedMalicious !== null, "malicious payload parses without throwing");
    assert(({} as any).polluted === undefined, "global Object.prototype is not polluted by __proto__ JSON key");
    assert(({} as any).admin === undefined, "global Object.prototype is not polluted by constructor.prototype JSON key");

    // Deeply nested JSON tree
    let deepJson = '{"leaf": 42}';
    for (let d = 0; d < 20; d++) {
        deepJson = `{"level_${d}": ${deepJson}}`;
    }
    const parsedDeep = safeJsonParse(deepJson);
    let curr: any = parsedDeep;
    for (let d = 19; d >= 0; d--) {
        curr = curr?.[`level_${d}`];
    }
    assertEqual(curr?.leaf, 42, "safely parses 20 levels of nested JSON objects");

    // 21. Prototype Pollution via JSON.parse Native Quirk & Deep Clones
    const parsedPollution = safeJsonParse('{"__proto__": {"admin": true}}') as any;
    const mergedObj = Object.assign({}, parsedPollution);
    assert((Object.prototype as any).admin === undefined, "Object.prototype.admin remains unpolluted");
    assert(Object.prototype.hasOwnProperty.call(parsedPollution, "__proto__"), "JSON.parse creates an own property '__proto__'");
    assert(mergedObj.admin === true, "Object.assign invokes target prototype setter when copying __proto__ property");

    // 22. Large Precision Integer Truncation (BigInt / 64-bit Integers)
    const bigIdJson = '{"id": 9007199254740999}';
    const parsedBigId = safeJsonParse(bigIdJson) as any;
    assertEqual(parsedBigId.id, 9007199254741000, "asserts standard IEEE-754 rounding behavior for integers above Number.MAX_SAFE_INTEGER");

    // 23. NDJSON Valid Empty Lines / Whitespace-Only File
    assertEqual(
        safeJsonParse("\n\n   \n", { format: "ndjson" }),
        [],
        "NDJSON with only blank lines returns empty array without throwing"
    );

    // 24. NDJSON with maxLines on Trailing Newlines
    const ndjsonTrailing = '{"a": 1}\n{"a": 2}\n\n\n';
    assertEqual(
        safeJsonParse(ndjsonTrailing, { format: "ndjson", ndjson: { maxLines: 2 } }),
        [{ a: 1 }, { a: 2 }],
        "NDJSON with maxLines=2 terminates cleanly even with trailing empty newlines"
    );

    // 25. Type-Narrowing with Guard in isJsonString
    interface TestUser { name: string }
    const isUser = (val: unknown): val is TestUser => typeof val === "object" && val !== null && "name" in val;
    const rawUserStr: unknown = '{"name": "Alice"}';
    if (isJsonString(rawUserStr, { guard: isUser })) {
        assert(typeof rawUserStr === "string", "rawUserStr narrowed to string");
    }

    // 26. Control Characters Inside JSON Strings (RFC 8259 Compliance)
    const rawNewlineInString = '{"key": "line1\nline2"}';
    assertEqual(
        safeJsonParse(rawNewlineInString, { fallback: "FAIL" }),
        "FAIL",
        "rejects raw unescaped ASCII control characters in JSON strings"
    );

    // 27. UTF-8 Byte Order Mark (BOM) (\uFEFF)
    assertEqual(
        safeJsonParse("\uFEFF{\"a\":1}", { trimBeforeParse: true }),
        { a: 1 },
        "strips leading BOM character when trimBeforeParse is true"
    );

    // 28. Number Precision & Safe Primitives Edge Cases (-0 and Subnormals)
    const negZero = safeJsonParse("-0", { allowPrimitives: true });
    assert(Object.is(negZero, -0), "preserves sign on negative zero -0");

    // 29. ReDoS / Catastrophic Regex Backtracking on Very Large Lines (50k chars)
    const longJsonLine = `{"data":"${"x".repeat(50000)}"}\n{"data":"y"}`;
    const parsedLong = safeJsonParse(longJsonLine, { format: "ndjson" }) as any;
    assertEqual(parsedLong.length, 2, "handles massive 50k character single-line NDJSON without choking");

    // 30. NDJSON Lines Containing Unicode Whitespace (NBSP, Tab, etc.)
    const nbspNdjson = '{"a":1}\n \u00A0 \t \n{"b":2}';
    assertEqual(
        safeJsonParse(nbspNdjson, { format: "ndjson" }),
        [{ a: 1 }, { b: 2 }],
        "correctly ignores lines with NBSP and tabs as empty whitespace"
    );

    // 31. Reviver Mutating Objects to undefined on Root
    const strippedRoot = safeJsonParse('{"a":1}', {
        reviver: (key, val) => (key === "" ? undefined : val),
        fallback: "FB"
    });
    assertEqual(strippedRoot, undefined, "reviver returning undefined on root produces undefined without triggering fallback");

    // 32. Lone JSON Escaped Null Bytes (\u0000)
    const nullByteJson = '{"key":"foo\\u0000bar"}';
    const parsedNullByte = safeJsonParse(nullByteJson) as any;
    assertEqual(parsedNullByte.key, "foo\u0000bar", "preserves encoded null bytes in strings");

    // 33. Guard Parameter In-Place Mutation
    const mutatingGuard = (val: any): boolean => {
        if (typeof val === "object" && val !== null) {
            val.injected = true;
            return true;
        }
        return false;
    };
    const mutatedResult = safeJsonParse('{"a":1}', { guard: mutatingGuard }) as any;
    assertEqual(mutatedResult.injected, true, "handles guard mutating the parsed object in-place");

    // 34. Maximum Call Stack via Extreme Object Depth & Recursive Revivers (RangeError handling)
    let deepNestedJson = '{"a": 1}';
    for (let i = 0; i < 5000; i++) {
        deepNestedJson = `{"child": ${deepNestedJson}}`;
    }
    const recursiveReviver = (k: string, v: any) => {
        if (k === "child") {
            return safeJsonParse(JSON.stringify(v), { reviver: recursiveReviver });
        }
        return v;
    };
    assertEqual(
        safeJsonParse(deepNestedJson, { reviver: recursiveReviver, fallback: "STACK_OVERFLOW" }),
        "STACK_OVERFLOW",
        "catches RangeError from recursion depth limits and returns fallback"
    );

    // 35. _isWrappedJsonComposite Boundary & Escape Edge Cases
    assertEqual(
        safeJsonParse('"{ hello }"', { allowPrimitives: false, fallback: "PRIMITIVE_STRING" }),
        "PRIMITIVE_STRING",
        "rejects primitive string that looks like an object when allowPrimitives=false"
    );
    assertEqual(
        safeJsonParse('{"escaped": "\\\"}"}'),
        { escaped: '"}' },
        "handles escaped quotes and braces at string boundaries"
    );

    // 36. Duplicate Object Keys (ECMAScript silent overwrite behavior)
    const dupKeyJson = '{"key": "first", "key": "second"}';
    assertEqual(
        safeJsonParse(dupKeyJson),
        { key: "second" },
        "V8 standard behavior: subsequent duplicate keys overwrite previous values"
    );

    // 37. Lone and Unpaired UTF-16 Surrogates
    const loneSurrogate = '{"lone": "\\uD800"}';
    const parsedSurrogate = safeJsonParse(loneSurrogate) as any;
    assertEqual(parsedSurrogate.lone, "\uD800", "preserves lone surrogate code points without throwing");

    // 38. JSON Superset Unicode Separators (\u2028 / \u2029)
    const lineSepJson = '{"line": "foo\u2028bar"}';
    assertEqual(
        (safeJsonParse(lineSepJson) as any).line,
        "foo\u2028bar",
        "correctly parses ECMAScript JSON superset line separators"
    );

    // 39. Object.freeze fallback integrity
    const frozenFallback = Object.freeze({ status: "error" });
    const fallbackRes = safeJsonParse("invalid json", { fallback: frozenFallback });
    assertEqual(fallbackRes, frozenFallback, "returns exact reference of frozen fallback object without attempting mutation");

    // 40. Additional Edge Case Tests:
    // a. isJsonString with empty string or pure whitespace
    assert(!isJsonString(""), "isJsonString returns false for empty string");
    assert(!isJsonString("   \n\t  "), "isJsonString returns false for whitespace-only string");
    assert(isJsonString("   {}   "), "isJsonString returns true for object wrapped in whitespace");
    assert(isJsonString("   []   "), "isJsonString returns true for array wrapped in whitespace");

    // b. Reviver returning primitive false and null values
    const reviverReturningNull = safeJsonParse('{"a": 1, "b": 2}', {
        reviver: (k, v) => (k === "b" ? null : v)
    });
    assertEqual(reviverReturningNull, { a: 1, b: null }, "reviver returning null sets property to null");

    const reviverReturningFalse = safeJsonParse('{"a": 1}', {
        reviver: (_k, v) => (typeof v === "number" ? false : v)
    });
    assertEqual(reviverReturningFalse, { a: false }, "reviver returning false sets property to false");

    // c. Leading/trailing whitespace preserved inside object keys
    const spaceKeys = safeJsonParse('{"  spaced_key  ": 42}');
    assertEqual(spaceKeys, { "  spaced_key  ": 42 }, "preserves intentional leading/trailing spaces inside JSON object keys");

    // d. Strict JSON number formats (e.g. +10 is invalid JSON, 1e+10 is valid)
    assertEqual(safeJsonParse('{"num": +10}', { fallback: "INVALID_PLUS" }), "INVALID_PLUS", "rejects numbers with leading plus sign (+10) per JSON spec");
    assertEqual(safeJsonParse('{"num": 1e+10}'), { num: 1e10 }, "accepts scientific exponential notation with plus sign (1e+10)");
    assertEqual(safeJsonParse('{"num": .5}', { fallback: "INVALID_DECIMAL" }), "INVALID_DECIMAL", "rejects numbers without leading zero (.5) per JSON spec");

    // e. NDJSON empty string / only newlines behavior
    assertEqual(safeJsonParse("", { format: "ndjson" }), [], "empty string NDJSON returns empty array");
    assertEqual(safeJsonParse("   ", { format: "ndjson" }), [], "whitespace-only NDJSON returns empty array");

    // f. NDJSON with trailing spaces on intermediate blank lines
    assertEqual(safeJsonParse('{"a": 1}\n   \t  \n{"a": 2}', { format: "ndjson" }), [{ a: 1 }, { a: 2 }], "NDJSON ignores lines containing only spaces and tabs");

    // g. trimBeforeParse: true with outer whitespace around invalid composite characters
    assertEqual(safeJsonParse("  { invalid JSON }  ", { trimBeforeParse: true, fallback: "TRIMMED_BAD" }), "TRIMMED_BAD", "trimBeforeParse handles invalid JSON surrounded by whitespace");

    // h. allowPrimitives: true with JSON string primitives containing composite-like syntax
    assertEqual(safeJsonParse('"[1, 2, 3]"', { allowPrimitives: true }), "[1, 2, 3]", "parses string primitive containing array syntax without composite unwrapping confusion");
    assertEqual(safeJsonParse('"{\\"nested\\": true}"', { allowPrimitives: true }), '{"nested": true}', "parses string primitive containing object syntax");

    // i. guard function receiving null when allowPrimitives: true and input is literal null
    let guardReceivedNull = false;
    const guardedNull = safeJsonParse("null", {
        allowPrimitives: true,
        guard: (v: unknown): v is null => {
            if (v === null) guardReceivedNull = true;
            return v === null;
        }
    });
    assertEqual(guardedNull, null, "guard receives null value correctly on literal null parse with allowPrimitives=true");
    assert(guardReceivedNull, "guard was executed with null argument");

    // 41. createSafeJsonReplacer with bigintStrategy ("string" vs "number")
    const bigIntObj = {
        safeNumber: 123n,
        unsafeLarge: 9007199254740999n,
        negativeSafe: -50n
    };

    const strReplacer = createSafeJsonReplacer({ bigintStrategy: "string" });
    const strSerialized = JSON.parse(JSON.stringify(bigIntObj, strReplacer));
    assertEqual(strSerialized.safeNumber, "123", "safe BigInt serializes to string when bigintStrategy=string");
    assertEqual(strSerialized.unsafeLarge, "9007199254740999", "large BigInt serializes to string when bigintStrategy=string");

    const numReplacer = createSafeJsonReplacer({ bigintStrategy: "number" });
    const numSerialized = JSON.parse(JSON.stringify(bigIntObj, numReplacer));
    assertEqual(numSerialized.safeNumber, 123, "safe BigInt serializes to number when bigintStrategy=number");
    assertEqual(numSerialized.negativeSafe, -50, "negative safe BigInt serializes to number when bigintStrategy=number");
    assertEqual(numSerialized.unsafeLarge, "9007199254740999", "unsafe large BigInt falls back to string to preserve precision when bigintStrategy=number");

    // 42. Boxed BigInt Object(123n) serialization via unboxPrimitiveObj
    const boxedObj = { boxed: Object(BigInt(456)) };
    const boxedSerialized = JSON.parse(JSON.stringify(boxedObj, numReplacer));
    assertEqual(boxedSerialized.boxed, 456, "boxed BigInt Object(456n) unboxed and serialized to number");

    // 43. Circular Reference Handling (handleCircular: true vs custom onCircular)
    const circularObj: any = { name: "root" };
    circularObj.self = circularObj;
    circularObj.nested = { parent: circularObj };

    const defaultCircReplacer = createSafeJsonReplacer({ handleCircular: true });
    const circSerialized = JSON.parse(JSON.stringify(circularObj, defaultCircReplacer));
    assertEqual(circSerialized.name, "root", "serializes non-circular fields on circular structure");
    assertEqual(circSerialized.self, "[Circular]", "default circular placeholder string applied");
    assertEqual(circSerialized.nested.parent, "[Circular]", "nested circular reference replaced with [Circular]");

    const customCircReplacer = createSafeJsonReplacer({
        handleCircular: true,
        onCircular: (_k, v) => ({ $ref: `#/${v.name}` })
    });
    const customCircSerialized = JSON.parse(JSON.stringify(circularObj, customCircReplacer));
    assertEqual(customCircSerialized.self, { $ref: "#/root" }, "custom onCircular callback override works");

    // 44. Set, Map, RegExp, and TypedArray Serialization
    const complexStructures = {
        setVal: new Set([1, 2, 3]),
        mapVal: new Map([["k1", "v1"], ["k2", "v2"]]),
        regexVal: /test-[a-z]+/gi,
        typedArr: new Uint8Array([10, 20, 30])
    };
    const defaultComplexReplacer = createSafeJsonReplacer();
    const serializedComplex = JSON.parse(JSON.stringify(complexStructures, defaultComplexReplacer));
    assertEqual(serializedComplex.setVal, [1, 2, 3], "Set serialized to Array");
    assertEqual(serializedComplex.mapVal, [["k1", "v1"], ["k2", "v2"]], "Map serialized to Array of entries");
    assertEqual(serializedComplex.regexVal, "/test-[a-z]+/gi", "RegExp serialized to string format");
    assertEqual(serializedComplex.typedArr, [10, 20, 30], "Uint8Array serialized to number array");

    // 45. Date formatting: custom onDate vs formatDate vs default ISO string
    const testDate = new Date("2026-05-20T12:00:00.000Z");
    const dateObjContainer = { d: testDate };

    const defaultDateRep = createSafeJsonReplacer();
    assertEqual(JSON.parse(JSON.stringify(dateObjContainer, defaultDateRep)).d, "2026-05-20T12:00:00.000Z", "default Date serialized as ISO string");

    const customFormatDateRep = createSafeJsonReplacer({
        formatDate: (d) => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`
    });
    assertEqual(JSON.parse(JSON.stringify(dateObjContainer, customFormatDateRep)).d, "2026-5", "formatDate callback produces custom date string");

    const onDatePrecedenceRep = createSafeJsonReplacer({
        formatDate: () => "IGNORED",
        onDate: (d) => ({ timestamp: d.getTime() })
    });
    assertEqual(JSON.parse(JSON.stringify(dateObjContainer, onDatePrecedenceRep)).d, { timestamp: 1779278400000 }, "onDate takes precedence over formatDate");

    // 46. Error Objects Serialization (name, message, stack vs custom onError)
    const errObj = { error: new TypeError("Invalid argument supplied") };
    const errRep = createSafeJsonReplacer();
    const serializedErr = JSON.parse(JSON.stringify(errObj, errRep));
    assertEqual(serializedErr.error.name, "TypeError", "Error name preserved");
    assertEqual(serializedErr.error.message, "Invalid argument supplied", "Error message preserved");
    assert(typeof serializedErr.error.stack === "string", "Error stack trace preserved as string");

    const customErrRep = createSafeJsonReplacer({
        onError: (e) => `[ERR: ${e.name} - ${e.message}]`
    });
    assertEqual(JSON.parse(JSON.stringify(errObj, customErrRep)).error, "[ERR: TypeError - Invalid argument supplied]", "custom onError callback formats error");

    // 47. URLSearchParams Serialization
    const paramsObj = { query: new URLSearchParams("page=2&sort=desc&tag=a&tag=b") };
    const paramsRep = createSafeJsonReplacer();
    assertEqual(JSON.parse(JSON.stringify(paramsObj, paramsRep)).query, "page=2&sort=desc&tag=a&tag=b", "URLSearchParams serialized to query string");

    // 48. Voiding default Replacements (voidSetReplacement, voidMapReplacement, voidRegExpReplacement, etc.)
    const voidReplacer = createSafeJsonReplacer({
        voidSetReplacement: true,
        voidMapReplacement: true,
        voidRegExpReplacement: true,
        voidDateReplacement: true,
        voidBigIntReplacement: true
    });
    const voidTestObj = {
        set: new Set([1]),
        map: new Map([["a", 1]]),
        reg: /abc/,
        date: new Date("2026-01-01T00:00:00.000Z")
    };
    const voidSerialized = JSON.parse(JSON.stringify(voidTestObj, voidReplacer));
    assertEqual(voidSerialized.set, {}, "voidSetReplacement leaves Set as raw object ({})");
    assertEqual(voidSerialized.map, {}, "voidMapReplacement leaves Map as raw object ({})");
    assertEqual(voidSerialized.reg, {}, "voidRegExpReplacement leaves RegExp as raw object ({})");
    assertEqual(voidSerialized.date, "2026-01-01T00:00:00.000Z", "voidDateReplacement falls back to native Date.prototype.toJSON");

    // 49. Whitelist Array filtering vs custom function replacer composition
    const multiKeyObj = { a: 1, b: 2, c: 3, d: 4 };
    const whitelistRep = createSafeJsonReplacer({ replacer: ["a", "c"] });
    assertEqual(JSON.parse(JSON.stringify(multiKeyObj, whitelistRep)), { a: 1, c: 3 }, "array whitelist filters out unlisted keys");

    const composedFnRep = createSafeJsonReplacer({
        replacer: (k, v) => (k === "b" ? v * 10 : v)
    });
    assertEqual(JSON.parse(JSON.stringify(multiKeyObj, composedFnRep)), { a: 1, b: 20, c: 3, d: 4 }, "custom function replacer mutates target key");

    // 50. onCustom catch-all handler execution order
    const customTypeObj = { symbolKey: "SPECIAL_MARKER", other: 100 };
    const customCatchAllRep = createSafeJsonReplacer({
        onCustom: (_k, v) => {
            if (v === "SPECIAL_MARKER") return { transformed: true };
            return v;
        }
    });
    assertEqual(JSON.parse(JSON.stringify(customTypeObj, customCatchAllRep)), { symbolKey: { transformed: true }, other: 100 }, "onCustom transforms matched values");

    // ============================================================================
    // SAFE_JSON_REPLACER ROBUSTNESS & EDGE-CASE TEST BATTERY
    // ============================================================================

    // 51. Basic & BigInt Serialization Strategies
    const bigintObj = { big: 9007199254740991n, huge: 9007199254740999n };

    // 51a. BigInt default ("string")
    assertEqual(
        JSON.stringify(bigintObj, createSafeJsonReplacer()),
        '{"big":"9007199254740991","huge":"9007199254740999"}',
        "converts BigInts to string by default"
    );

    // 51b. BigInt "number" strategy (safe int -> number, unsafe int -> string fallback)
    assertEqual(
        JSON.stringify(bigintObj, createSafeJsonReplacer({ bigintStrategy: "number" })),
        '{"big":9007199254740991,"huge":"9007199254740999"}',
        "converts safe BigInt to number and unsafe BigInt to string"
    );

    // 51c. BigInt custom onBigInt hook
    assertEqual(
        JSON.stringify({ val: 42n }, createSafeJsonReplacer({ onBigInt: (b) => `BI:${b}` })),
        '{"val":"BI:42"}',
        "custom onBigInt override format"
    );

    // 51d. BigInt voidBigIntReplacement flag
    let threwBigIntVoid = false;
    try {
        JSON.stringify({ val: 42n }, createSafeJsonReplacer({ voidBigIntReplacement: true }));
    } catch (e: any) {
        threwBigIntVoid = e instanceof TypeError;
    }
    assert(threwBigIntVoid, "voidBigIntReplacement causes native BigInt TypeError");

    // 52. Collection Serializations (Map & Set)
    // 52a. Set conversion to array
    const setObj = { tags: new Set(["a", "b", "c"]) };
    assertEqual(
        JSON.stringify(setObj, createSafeJsonReplacer()),
        '{"tags":["a","b","c"]}',
        "serializes Set to Array"
    );

    // 52b. Map conversion to entries array
    const mapObj = { lookup: new Map([["key1", 1], ["key2", 2]]) };
    assertEqual(
        JSON.stringify(mapObj, createSafeJsonReplacer()),
        '{"lookup":[["key1",1],["key2",2]]}',
        "serializes Map to array of key-value pairs"
    );

    // 52c. Nested and Empty Maps/Sets
    assertEqual(
        JSON.stringify({ emptySet: new Set(), emptyMap: new Map() }, createSafeJsonReplacer()),
        '{"emptySet":[],"emptyMap":[]}',
        "serializes empty Set and Map"
    );

    // 53. TypedArray & Buffer Serializations
    const typedArrayObj = {
        u8: new Uint8Array([1, 2, 3]),
        i32: new Int32Array([10, -20, 30]),
        f64: new Float64Array([1.5, 2.5])
    };
    assertEqual(
        JSON.stringify(typedArrayObj, createSafeJsonReplacer()),
        '{"u8":[1,2,3],"i32":[10,-20,30],"f64":[1.5,2.5]}',
        "serializes TypedArrays into number arrays"
    );

    // 54. RegExp, URLSearchParams, & Error Objects
    // 54a. RegExp to string
    assertEqual(
        JSON.stringify({ pattern: /abc/gi }, createSafeJsonReplacer()),
        '{"pattern":"/abc/gi"}',
        "serializes RegExp to string representation"
    );

    // 54b. URLSearchParams to query string
    const searchParams = new URLSearchParams({ search: "query", page: "1" });
    assertEqual(
        JSON.stringify({ params: searchParams }, createSafeJsonReplacer()),
        '{"params":"search=query&page=1"}',
        "serializes URLSearchParams to standard string"
    );

    // 54c. Error object serialization (prevents empty {})
    const errObjBattery = new Error("Database failed");
    const serializedErrBattery = JSON.parse(JSON.stringify({ error: errObjBattery }, createSafeJsonReplacer()));
    assertEqual(serializedErrBattery.error.name, "Error", "preserves error name");
    assertEqual(serializedErrBattery.error.message, "Database failed", "preserves error message");
    assert(typeof serializedErrBattery.error.stack === "string", "preserves error stack trace");

    // 55. Date Formatting & Invalid Date Handling
    // 55a. Valid Date with custom formatDate
    const fixedDate = new Date("2026-08-16T12:00:00.000Z");
    assertEqual(
        JSON.stringify({ date: fixedDate }, createSafeJsonReplacer({
            formatDate: (d) => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`
        })),
        '{"date":"2026-8"}',
        "applies custom formatDate"
    );

    // 55b. onDate custom override
    assertEqual(
        JSON.stringify({ date: fixedDate }, createSafeJsonReplacer({
            onDate: (d) => ({ timestamp: d.getTime() })
        })),
        `{"date":{"timestamp":${fixedDate.getTime()}}}`,
        "applies onDate object override"
    );

    // 55c. Invalid Date (new Date(NaN))
    const invalidDate = new Date(NaN);
    assertEqual(
        JSON.stringify({ date: invalidDate }, createSafeJsonReplacer()),
        '{"date":null}',
        "safely serializes invalid Date without throwing RangeError"
    );

    // 56. Circular Reference Handling
    // 56a. Direct Self-Reference
    const selfCircular: any = { name: "Root" };
    selfCircular.self = selfCircular;
    assertEqual(
        JSON.stringify(selfCircular, createSafeJsonReplacer({ handleCircular: true })),
        '{"name":"Root","self":"[Circular]"}',
        "replaces direct self-circular reference with [Circular]"
    );

    // 56b. Deep/Mutual Circular Reference
    const nodeA: any = { id: "A" };
    const nodeB: any = { id: "B", toA: nodeA };
    nodeA.toB = nodeB;
    assertEqual(
        JSON.stringify(nodeA, createSafeJsonReplacer({ handleCircular: true })),
        '{"id":"A","toB":{"id":"B","toA":"[Circular]"}}',
        "replaces mutual circular reference with [Circular]"
    );

    // 56c. Custom onCircular replacer
    assertEqual(
        JSON.stringify(selfCircular, createSafeJsonReplacer({
            handleCircular: true,
            onCircular: (_k, v) => `<Ref to ${v.name}>`
        })),
        '{"name":"Root","self":"<Ref to Root>"}',
        "uses custom onCircular formatter"
    );

    // 56d. Repeated (Non-Circular) Identical Object References (Deduplicated as [Circular] by WeakSet replacer)
    const sharedLeaf = { leaf: true };
    const dagObj = { left: sharedLeaf, right: sharedLeaf };
    assertEqual(
        JSON.stringify(dagObj, createSafeJsonReplacer({ handleCircular: true })),
        '{"left":{"leaf":true},"right":"[Circular]"}',
        "treats repeated object instances as circular references in single pass"
    );

    // 56e. Circular Array Reference
    const circularArr: any = [1, 2];
    circularArr.push(circularArr);
    assertEqual(
        JSON.stringify(circularArr, createSafeJsonReplacer({ handleCircular: true })),
        '[1,2,"[Circular]"]',
        "handles circular references inside arrays"
    );

    // 57. Whitelist & User Replacer Interoperability
    // 57a. Array Whitelist filtering
    const multiKeyObjBattery = { a: 1, b: 2, c: 3 };
    assertEqual(
        JSON.stringify(multiKeyObjBattery, createSafeJsonReplacer({ replacer: ["a", "c"] })),
        '{"a":1,"c":3}',
        "filters object keys using array whitelist"
    );

    // 57b. Numeric vs String Whitelist keys
    assertEqual(
        JSON.stringify({ 0: "zero", 1: "one", test: "no" }, createSafeJsonReplacer({ replacer: [0, "1"] })),
        '{"0":"zero","1":"one"}',
        "matches numeric and string whitelist keys seamlessly"
    );

    // 57c. User Replacer Function returning undefined (Key Deletion)
    assertEqual(
        JSON.stringify({ secret: "hidden", public: "visible" }, createSafeJsonReplacer({
            replacer: (k, v) => (k === "secret" ? undefined : v)
        })),
        '{"public":"visible"}',
        "user replacer can strip keys by returning undefined"
    );

    // 58. Boxed Primitives (String, Number, Boolean, BigInt)
    const boxedObjBattery = {
        str: new String("boxed text"),
        num: new Number(42),
        bool: new Boolean(false),
        big: Object(100n)
    };
    assertEqual(
        JSON.stringify(boxedObjBattery, createSafeJsonReplacer()),
        '{"str":"boxed text","num":42,"bool":false,"big":"100"}',
        "unboxes String, Number, Boolean, and BigInt object wrappers"
    );

    // 59. Replacer Instance Re-use & State Isolation
    const sharedReplacerInstance = createSafeJsonReplacer({ handleCircular: true });
    const payload1: any = { id: 1 };
    payload1.self = payload1;
    const payload2: any = { id: 2 };
    payload2.self = payload2;

    const res1 = JSON.stringify(payload1, sharedReplacerInstance);
    const res2 = JSON.stringify(payload2, sharedReplacerInstance);
    assertEqual(res1, '{"id":1,"self":"[Circular]"}', "first serialization succeeds with circular check");
    assertEqual(res2, '{"id":2,"self":"[Circular]"}', "second run on same replacer instance resets seen cache cleanly");

    // 60. onCustom Hook Hierarchy
    // 60a. Intercepting custom classes
    class Point {
        constructor(public x: number, public y: number) {}
    }
    const customObjPoint = { pt: new Point(10, 20) };
    assertEqual(
        JSON.stringify(customObjPoint, createSafeJsonReplacer({
            onCustom: (_k, v) => (v instanceof Point ? `(${v.x},${v.y})` : v)
        })),
        '{"pt":"(10,20)"}',
        "onCustom catches and serializes custom class instances"
    );

    // 60b. onCustom returning undefined (property omission)
    assertEqual(
        JSON.stringify({ removeMe: "bad", keepMe: "good" }, createSafeJsonReplacer({
            onCustom: (_k, v) => (v === "bad" ? undefined : v)
        })),
        '{"keepMe":"good"}',
        "onCustom returning undefined omits property"
    );

    // 61. Edge Values & Prototype Security
    // 61a. Object with Object.create(null) (No Prototype)
    const nullProtoObj = Object.create(null);
    nullProtoObj.key = "val";
    nullProtoObj.big = 50n;
    assertEqual(
        JSON.stringify({ item: nullProtoObj }, createSafeJsonReplacer()),
        '{"item":{"key":"val","big":"50"}}',
        "handles objects without prototype (Object.create(null))"
    );

    // 61b. Negative Zero, NaN, Infinity
    assertEqual(
        JSON.stringify({ negZero: -0, nan: NaN, inf: Infinity }, createSafeJsonReplacer()),
        '{"negZero":0,"nan":null,"inf":null}',
        "maintains standard JSON serialization for IEEE-754 edge numbers"
    );

    // 61c. Objects with overridden toJSON methods
    const objWithToJSON = {
        data: "raw",
        toJSON() {
            return { transformed: true, big: 99n };
        }
    };
    assertEqual(
        JSON.stringify({ custom: objWithToJSON }, createSafeJsonReplacer()),
        '{"custom":{"transformed":true,"big":"99"}}',
        "safely processes BigInts produced by native toJSON() methods"
    );

    // 62. Remaining `void*Replacement` Flags
    assertEqual(
        JSON.stringify({ set: new Set([1, 2]), map: new Map([["a", 1]]) }, createSafeJsonReplacer({
            voidSetReplacement: true,
            voidMapReplacement: true
        })),
        '{"set":{},"map":{}}',
        "voidSetReplacement and voidMapReplacement fall back to native empty object serialization"
    );

    assertEqual(
        JSON.stringify({ u8: new Uint8Array([1, 2]) }, createSafeJsonReplacer({ voidTypedArrayReplacement: true })),
        '{"u8":{"0":1,"1":2}}',
        "voidTypedArrayReplacement falls back to native typed array serialization"
    );

    assertEqual(
        JSON.stringify({ reg: /xyz/ }, createSafeJsonReplacer({ voidRegExpReplacement: true })),
        '{"reg":{}}',
        "voidRegExpReplacement falls back to native RegExp serialization"
    );

    assertEqual(
        JSON.stringify({ date: new Date("2026-01-01T00:00:00.000Z") }, createSafeJsonReplacer({ voidDateReplacement: true })),
        '{"date":"2026-01-01T00:00:00.000Z"}',
        "voidDateReplacement allows native toJSON to handle Date"
    );

    // 63. Type-Specific Custom Overrides
    assertEqual(
        JSON.stringify({ bytes: new Uint8Array([0xde, 0xad]) }, createSafeJsonReplacer({
            onTypedArray: (arr) => Array.from(arr).map((b: any) => b.toString(16)).join("")
        })),
        '{"bytes":"dead"}',
        "onTypedArray custom formatter"
    );

    assertEqual(
        JSON.stringify({ tags: new Set(["a", "b"]) }, createSafeJsonReplacer({
            onSet: (s) => ({ size: s.size, values: Array.from(s) })
        })),
        '{"tags":{"size":2,"values":["a","b"]}}',
        "onSet custom formatter"
    );

    assertEqual(
        JSON.stringify({ lookup: new Map([["a", 1], ["b", 2]]) }, createSafeJsonReplacer({
            onMap: (m) => Object.fromEntries(m)
        })),
        '{"lookup":{"a":1,"b":2}}',
        "onMap custom object transformer"
    );

    assertEqual(
        JSON.stringify({ re: /hello/i }, createSafeJsonReplacer({
            onRegExp: (r) => ({ source: r.source, flags: r.flags })
        })),
        '{"re":{"source":"hello","flags":"i"}}',
        "onRegExp custom structured object transformer"
    );

    assertEqual(
        JSON.stringify({ err: new TypeError("bad type") }, createSafeJsonReplacer({
            onError: (e) => `[${e.name}] ${e.message}`
        })),
        '{"err":"[TypeError] bad type"}',
        "onError custom string formatter"
    );

    assertEqual(
        JSON.stringify({ q: new URLSearchParams("a=1&b=2") }, createSafeJsonReplacer({
            onURLSearchParams: (usp) => Object.fromEntries(usp)
        })),
        '{"q":{"a":"1","b":"2"}}',
        "onURLSearchParams custom transformer"
    );

    // 64. Nested & Deeply Nested Collections Containing BigInts / Special Values
    const complexNested = {
        setOfBigInts: new Set([10n, 20n]),
        mapWithSets: new Map([["items", new Set([1n, 2n])]]),
        arrayOfErrors: [new Error("E1")]
    };
    const complexSerialized = JSON.parse(JSON.stringify(complexNested, createSafeJsonReplacer()));
    assertEqual(complexSerialized.setOfBigInts, ["10", "20"], "safely traverses BigInts inside Sets");
    assertEqual(complexSerialized.mapWithSets, [["items", ["1", "2"]]], "safely traverses Sets of BigInts inside Maps");
    assertEqual(complexSerialized.arrayOfErrors[0].message, "E1", "safely traverses Error objects inside Arrays");

    // 65. Array Whitelist and Array Handling
    const objWithArray = { keep: [1, 2, 3], drop: "skip" };
    assertEqual(
        JSON.stringify(objWithArray, createSafeJsonReplacer({ replacer: ["keep"] })),
        '{"keep":[1,2,3]}',
        "whitelist filters top-level keys without discarding inner array indices"
    );

    assertEqual(
        JSON.stringify({ bigA: 100n, bigB: 200n }, createSafeJsonReplacer({ replacer: ["bigA"] })),
        '{"bigA":"100"}',
        "whitelist preserves BigInt serialization on allowed keys"
    );

    // 66. `this` Context Binding & Top-Level Value Handling
    let rootContainerSeen = false;
    JSON.stringify({ a: 1 }, createSafeJsonReplacer({
        replacer(k, v) {
            if (k === "a" && this.a === 1) rootContainerSeen = true;
            return v;
        }
    }));
    assert(rootContainerSeen, "replacer correctly binds `this` to container object");

    assertEqual(
        JSON.stringify(123n, createSafeJsonReplacer()),
        '"123"',
        "handles top-level primitive BigInt serialization directly"
    );

    assertEqual(
        JSON.stringify(new Set([1, 2]), createSafeJsonReplacer()),
        '[1,2]',
        "handles top-level Set passed directly to JSON.stringify"
    );

    // 67. Sparse Arrays & Symbol-keyed Properties
    const sparseArr = [1, , 3]; // eslint-disable-line no-sparse-arrays
    assertEqual(
        JSON.stringify(sparseArr, createSafeJsonReplacer()),
        '[1,null,3]',
        "sparse array empty slots serialize to null"
    );

    const symKey = Symbol("test");
    const symKeyObj = { [symKey]: "symbolValue", regular: "normal" };
    assertEqual(
        JSON.stringify(symKeyObj, createSafeJsonReplacer()),
        '{"regular":"normal"}',
        "symbol-keyed properties are cleanly ignored"
    );

    // 68. Additional Edge Cases for createSafeJsonReplacer
    // A. Top-level primitive / object variants
    assertEqual(
        JSON.stringify(null, createSafeJsonReplacer()),
        'null',
        "handles top-level null"
    );
    assertEqual(
        JSON.stringify(true, createSafeJsonReplacer()),
        'true',
        "handles top-level boolean true"
    );
    assertEqual(
        JSON.stringify(false, createSafeJsonReplacer()),
        'false',
        "handles top-level boolean false"
    );
    assertEqual(
        JSON.stringify(42, createSafeJsonReplacer()),
        '42',
        "handles top-level number"
    );
    assertEqual(
        JSON.stringify("hello", createSafeJsonReplacer()),
        '"hello"',
        "handles top-level string"
    );
    assertEqual(
        JSON.stringify(new Map([["x", 10], ["y", 20]]), createSafeJsonReplacer()),
        '[["x",10],["y",20]]',
        "handles top-level Map passed directly"
    );
    assertEqual(
        JSON.stringify(/abc/g, createSafeJsonReplacer()),
        '"/abc/g"',
        "handles top-level RegExp passed directly"
    );
    assertEqual(
        JSON.stringify(new Uint8Array([1, 2, 3]), createSafeJsonReplacer()),
        '[1,2,3]',
        "handles top-level Uint8Array passed directly"
    );
    assertEqual(
        JSON.stringify(new Int32Array([100, 200]), createSafeJsonReplacer()),
        '[100,200]',
        "handles top-level Int32Array passed directly"
    );

    // B. BigInt safe integer boundary cases with bigintStrategy: "number"
    const maxSafe = BigInt(Number.MAX_SAFE_INTEGER); // 9007199254740991n
    const minSafe = BigInt(Number.MIN_SAFE_INTEGER); // -9007199254740991n
    const overMaxSafe = maxSafe + 1n;
    const underMinSafe = minSafe - 1n;

    assertEqual(
        JSON.stringify({ maxSafe, minSafe, overMaxSafe, underMinSafe }, createSafeJsonReplacer({ bigintStrategy: "number" })),
        `{"maxSafe":9007199254740991,"minSafe":-9007199254740991,"overMaxSafe":"9007199254740992","underMinSafe":"-9007199254740992"}`,
        "bigintStrategy number converts in-range safe BigInts to numbers and out-of-range BigInts to strings"
    );

    assertEqual(
        JSON.stringify({ zero: 0n, negZero: -0n }, createSafeJsonReplacer({ bigintStrategy: "number" })),
        '{"zero":0,"negZero":0}',
        "bigintStrategy number handles 0n correctly"
    );

    // C. Objects with custom .toJSON() returning non-standard types
    const objToBigInt = { toJSON: () => 999n };
    assertEqual(
        JSON.stringify({ nested: objToBigInt }, createSafeJsonReplacer()),
        '{"nested":"999"}',
        "handles .toJSON() returning a BigInt"
    );

    const objToSet = { toJSON: () => new Set(["alpha", "beta"]) };
    assertEqual(
        JSON.stringify({ nested: objToSet }, createSafeJsonReplacer()),
        '{"nested":["alpha","beta"]}',
        "handles .toJSON() returning a Set"
    );

    const objToMap = { toJSON: () => new Map([["key", "val"]]) };
    assertEqual(
        JSON.stringify({ nested: objToMap }, createSafeJsonReplacer()),
        '{"nested":[["key","val"]]}',
        "handles .toJSON() returning a Map"
    );

    // D. onCustom context, returning undefined to omit property, returning primitive, returning object
    let onCustomThisChecks: any[] = [];
    const customContextObj = { propA: "testA", propB: 123, propDrop: "remove" };
    const customResult = JSON.stringify(customContextObj, createSafeJsonReplacer({
        onCustom(k, v) {
            onCustomThisChecks.push({ k, v, hasSelf: this?.propA === "testA" });
            if (k === "propDrop") return undefined;
            if (k === "propA") return "MODIFIED_" + v;
            return v;
        }
    }));
    assertEqual(
        customResult,
        '{"propA":"MODIFIED_testA","propB":123}',
        "onCustom correctly modifies values and omits undefined returns"
    );
    assert(
        onCustomThisChecks.some(c => c.k === "propA" && c.hasSelf),
        "onCustom receives correct `this` binding"
    );

    // E. DAG vs. Circular graphs (multiple references without cycle)
    const leaf = { name: "sharedLeaf", val: 42 };
    const dag = { branchA: { item: leaf }, branchB: { item: leaf }, direct: leaf };
    assertEqual(
        JSON.stringify(dag, createSafeJsonReplacer({ handleCircular: true })),
        '{"branchA":{"item":{"name":"sharedLeaf","val":42}},"branchB":{"item":"[Circular]"},"direct":"[Circular]"}',
        "DAG with shared nodes is deduplicated by single-pass WeakSet circular detection"
    );

    // Multiple independent cycles in different branches
    const cycle1: any = { id: 1 };
    cycle1.self = cycle1;
    const cycle2: any = { id: 2 };
    cycle2.self = cycle2;
    const multiCycle = { first: cycle1, second: cycle2 };
    assertEqual(
        JSON.stringify(multiCycle, createSafeJsonReplacer({ handleCircular: true })),
        '{"first":{"id":1,"self":"[Circular]"},"second":{"id":2,"self":"[Circular]"}}',
        "handles multiple independent circular structures in one object tree"
    );

    // Circular array referencing itself
    const selfArr: any[] = [1, 2];
    selfArr.push(selfArr);
    assertEqual(
        JSON.stringify({ list: selfArr }, createSafeJsonReplacer({ handleCircular: true })),
        '{"list":[1,2,"[Circular]"]}',
        "handles circular array nested inside object"
    );

    // Custom onCircular handler
    assertEqual(
        JSON.stringify({ list: selfArr }, createSafeJsonReplacer({
            handleCircular: true,
            onCircular: (k) => `<CYCLE_AT_${k}>`
        })),
        '{"list":[1,2,"<CYCLE_AT_2>"]}',
        "custom onCircular receives key and returns custom placeholder"
    );

    // F. Nested array whitelist filtering behavior
    const deepWhitelistObj = {
        includeMe: [{ subA: 1, subB: 2 }, { subA: 3, subB: 4 }],
        ignoreMe: { subA: 5 }
    };
    assertEqual(
        JSON.stringify(deepWhitelistObj, createSafeJsonReplacer({ replacer: ["includeMe", "subA"] })),
        '{"includeMe":[{"subA":1},{"subA":3}]}',
        "whitelist preserves elements inside arrays while filtering sub-properties"
    );

    // G. Boxed primitive objects (String, Number, Boolean)
    const boxedObjs = {
        str: new String("boxedStr"),
        num: new Number(42),
        bool: new Boolean(true)
    };
    assertEqual(
        JSON.stringify(boxedObjs, createSafeJsonReplacer()),
        '{"str":"boxedStr","num":42,"bool":true}',
        "unboxes String, Number, Boolean wrapper objects"
    );

    // H. Special float values (NaN, Infinity, -Infinity)
    assertEqual(
        JSON.stringify({ a: NaN, b: Infinity, c: -Infinity }, createSafeJsonReplacer()),
        '{"a":null,"b":null,"c":null}',
        "NaN and Infinity serialize to null according to standard JSON spec"
    );

    // ============================================================================
    // 69. JSONPath Robustness Tests (tokenizeJsonPath, evaluateJsonToken, jsonPathMatch)
    // ============================================================================

    // A. tokenizeJsonPath edge cases
    assertEqual(tokenizeJsonPath(""), [], "tokenizeJsonPath on empty string returns empty array");
    assertEqual(tokenizeJsonPath("$"), [], "tokenizeJsonPath on single $ returns empty array");
    assertEqual(tokenizeJsonPath("   $   "), [], "tokenizeJsonPath on padded $ returns empty array");
    assertEqual(tokenizeJsonPath("$.user.name"), [{ type: "prop", key: "user" }, { type: "prop", key: "name" }], "parses dot properties");
    assertEqual(tokenizeJsonPath("$['user'][\"name\"]"), [{ type: "prop", key: "user" }, { type: "prop", key: "name" }], "parses bracket quoted properties");
    assertEqual(tokenizeJsonPath("$['escaped\\'quote']"), [{ type: "prop", key: "escaped'quote" }], "parses escaped quotes inside brackets");
    assertEqual(tokenizeJsonPath("$.items[0]"), [{ type: "prop", key: "items" }, { type: "idx", idx: 0 }], "parses array index");
    assertEqual(tokenizeJsonPath("$.items[-1]"), [{ type: "prop", key: "items" }, { type: "idx", idx: -1 }], "parses negative array index");
    assertEqual(tokenizeJsonPath("$.items[*]"), [{ type: "prop", key: "items" }, { type: "wildcard" }], "parses bracket wildcard");
    assertEqual(tokenizeJsonPath("$.items.*"), [{ type: "prop", key: "items" }, { type: "wildcard" }], "parses dot wildcard");
    assertEqual(tokenizeJsonPath("$..name"), [{ type: "rec", key: "name" }], "parses recursive dot key");
    assertEqual(tokenizeJsonPath("$..*"), [{ type: "rec", key: "*" }], "parses recursive star wildcard");
    assertEqual(tokenizeJsonPath("$..['deep']"), [{ type: "rec", key: "deep" }], "parses recursive bracket single quote key");
    assertEqual(tokenizeJsonPath("$..[\"deep\"]"), [{ type: "rec", key: "deep" }], "parses recursive bracket double quote key");
    assertEqual(tokenizeJsonPath("$.items[1:5:2]"), [{ type: "prop", key: "items" }, { type: "slice", start: 1, end: 5, step: 2 }], "parses full slice with step");
    assertEqual(tokenizeJsonPath("$.items[:3]"), [{ type: "prop", key: "items" }, { type: "slice", start: undefined, end: 3, step: 1 }], "parses slice with omitted start");
    assertEqual(tokenizeJsonPath("$.items[2:]"), [{ type: "prop", key: "items" }, { type: "slice", start: 2, end: undefined, step: 1 }], "parses slice with omitted end");
    assertEqual(tokenizeJsonPath("$.items[::-1]"), [{ type: "prop", key: "items" }, { type: "slice", start: undefined, end: undefined, step: -1 }], "parses reverse slice");

    // Invalid path syntaxes return null
    assertEqual(tokenizeJsonPath("$.user..[invalid"), null, "invalid bracket syntax returns null");
    assertEqual(tokenizeJsonPath("$.user[abc]"), null, "unquoted string inside bracket returns null");
    assertEqual(tokenizeJsonPath("$.user.@#$!"), null, "illegal syntax returns null");

    // B. evaluateJsonToken edge cases
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

    // C. jsonPathMatch end-to-end edge cases
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

    console.log("=========================================");
    console.log(`🎉 ALL ${testsPassed} HARDENED SAFE_JSON_PARSE ROBUSTNESS TESTS PASSED!`);
    console.log("=========================================");
} catch (err: any) {
    console.error("\n❌ HARDENED SAFE_JSON_PARSE TEST FAILED:");
    console.error(err.stack || err);
    process.exit(1);
}
