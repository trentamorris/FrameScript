/**
 * Comprehensive Edge-Case and Stress Test Suite for src/utils/object.ts
 */
import {
    isObj,
    isPlainObj,
    isClass,
    isValidDateObj,
    isRegExp,
    isSet,
    isMap,
    isURLSearchParams,
    isError,
    isStringObj,
    isNumberObj,
    isBooleanObj,
    isBigIntObj,
    isSymbolObj,
    isArrayBuffer,
    isSharedArrayBuffer,
    isDataView,
    isUint8Array,
    isUint8ClampedArray,
    isDetachedBuffer,
    unboxPrimitiveObj,
} from "../../src/utils/object";
import { isBinaryObj } from "../../src/utils/binary";

console.log("=========================================");
console.log("STARTING OBJECT UTILS ROBUSTNESS TESTS...");
console.log("=========================================");

function assert(condition: boolean, msg: string) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${msg}`);
    }
}

// 1. Primitives vs Object checks
assert(isObj(null) === false, "null is not isObj");
assert(isObj(undefined) === false, "undefined is not isObj");
assert(isObj(42) === false, "number is not isObj");
assert(isObj("abc") === false, "string is not isObj");
assert(isObj(true) === false, "boolean is not isObj");
assert(isObj(Symbol("test")) === false, "symbol is not isObj");
assert(isObj(100n) === false, "bigint is not isObj");
assert(isObj([]) === false, "array is excluded from isObj");
assert(isObj({}) === true, "plain object is isObj");
assert(isObj(new Date()) === true, "Date is isObj");

// 1.1 Proxy traps that throw on property access
const bombHandler: ProxyHandler<any> = {
    get() { throw new Error("TRAP: property get attempted!"); },
    has() { throw new Error("TRAP: 'in' operator attempted!"); },
    getPrototypeOf() { return Object.prototype; },
    getOwnPropertyDescriptor() { throw new Error("TRAP: getOwnPropertyDescriptor attempted!"); }
};
const proxyBomb = new Proxy({}, bombHandler);
assert(isObj(proxyBomb) === true, "Proxy is recognized as isObj without triggering throwing property get traps");

// 2. isPlainObj edge cases
assert(isPlainObj({}) === true, "literal object is plain");
assert(isPlainObj(Object.create(null)) === true, "Object.create(null) is plain");
assert(isPlainObj(new Object()) === true, "new Object() is plain");
assert(isPlainObj(new Date()) === false, "Date is not plain");
assert(isPlainObj(new Map()) === false, "Map is not plain");
assert(isPlainObj(new (class Foo { })()) === false, "Class instance is not plain");

// Multi-level / custom prototype chain
const cycleProto: any = {};
const cycleObj = Object.create(cycleProto);
Object.setPrototypeOf(cycleProto, Object.prototype);
assert(isPlainObj(cycleObj) === false, "Object with custom multi-level prototype chain is not plain");

// Inherited constructor trick
const fakeCtorObj = Object.create({ constructor: Object });
assert(isPlainObj(fakeCtorObj) === false, "Inherited Object constructor does not trick isPlainObj");

// Host-like prototype
const HostProto = Object.create(Object.prototype, {
    [Symbol.toStringTag]: { value: "HTMLDivElement" }
});
const hostLikeObj = Object.create(HostProto);
assert(isPlainObj(hostLikeObj) === false, "Host-like object with custom prototype is not plain");

// 3. isClass edge cases
class BaseClass { }
class DerivedClass extends BaseClass { }
const CommentedClass1 = /* leading comment */ class ClassWithComment { };
const CommentedClass2 = // single line comment
    class ClassWithSingleComment { };
const MultiLineCommented = /*
    Multi-line comment
    with symbols /* and stuff
*/ class MultiComment { };
const InterleavedComments = /* c1 */ /* c2 */ // c3
    /* c4 */ class Interleaved { };

// User defined class deliberately named Symbol or BigInt
class UserNamedSymbol { }
Object.defineProperty(UserNamedSymbol, "name", { value: "Symbol" });
class UserNamedBigInt { }
Object.defineProperty(UserNamedBigInt, "name", { value: "BigInt" });

// Bound Class
const BoundClass = BaseClass.bind(null);

// Throwing constructor (should still be recognized as class without crashing)
class ThrowingConstructor {
    constructor() {
        throw new Error("I THROW ON NEW");
    }
}

function StandardFunction() { }
const arrowFn = () => { };
const boundFn = StandardFunction.bind(null);
const asyncFn = async () => { };
const genFn = function* () { };
const asyncGenFn = async function* () { };

assert(isClass(BaseClass) === true, "Base ES6 class is class");
assert(isClass(DerivedClass) === true, "Derived ES6 class is class");
assert(isClass(CommentedClass1) === true, "Class with leading block comment is class");
assert(isClass(CommentedClass2) === true, "Class with leading line comment is class");
assert(isClass(MultiLineCommented) === true, "Class with multi-line comment is class");
assert(isClass(InterleavedComments) === true, "Class with interleaved comments is class");
assert(isClass(UserNamedSymbol) === true, "User class named 'Symbol' is class");
assert(isClass(UserNamedBigInt) === true, "User class named 'BigInt' is class");
assert(isClass(BoundClass) === false, "Bound class is a bound function (not an un-bound ES6 class/native constructor)");
assert(isClass(ThrowingConstructor) === true, "Class with throwing constructor is class");

// 3.1 Extended isClass Edge Cases
const FormattedCommentClass = /* comment 1 */ /* comment 2 */
    // line comment 1
    // line comment 2
    class HeavilyCommented { };
assert(isClass(FormattedCommentClass) === true, "Heavily commented multiline class is class");

// Decorated classes simulation with dotted and parameterized decorators
const decoratedClassWithArgsMock = function () { };
Object.defineProperty(decoratedClassWithArgsMock, "toString", {
    value: () => "@decorators.log({ level: 'info' }) @core.validation.sanitize(1, 2) class DecoratedUser {}"
});
// Also test ES6 class expressions
const DecoratedActualClass = class DecoratedUser {};
assert(isClass(DecoratedActualClass) === true, "Class expression is class");

// Native classes that require mandatory arguments or are exotic
assert(isClass(Promise) === true, "Promise (requires executor arg) is class");
assert(isClass(WeakMap) === true, "WeakMap is class");
assert(isClass(WeakSet) === true, "WeakSet is class");
assert(isClass(DataView) === true, "DataView is class");
assert(isClass(RegExp) === true, "RegExp is class");
assert(isClass(Error) === true, "Error is class");
assert(isClass(TypeError) === true, "TypeError is class");

// Non-constructible builtins / objects / primitives
assert(isClass(Symbol) === false, "Native Symbol is not class");
assert(isClass(BigInt) === false, "Native BigInt is not class");
assert(isClass(Math) === false, "Math namespace is not class");
assert(isClass(JSON) === false, "JSON namespace is not class");
assert(isClass(Reflect) === false, "Reflect namespace is not class");
assert(isClass(Atomics) === false, "Atomics namespace is not class");
if (typeof Intl !== "undefined") {
    assert(isClass(Intl) === false, "Intl namespace is not class");
    assert(isClass(Intl.DateTimeFormat) === true, "Intl.DateTimeFormat is class");
    assert(isClass(Intl.NumberFormat) === true, "Intl.NumberFormat is class");
}

// Custom function impersonating native Symbol / BigInt
const fakeNativeSymbol = function () { };
Object.defineProperty(fakeNativeSymbol, "name", { value: "Symbol" });
Object.defineProperty(fakeNativeSymbol, "toString", { value: () => "function Symbol() { [native code] }" });
assert(isClass(fakeNativeSymbol) === false, "Spoofed native Symbol function without non-writable prototype is not class");

// Proxied class and Proxy object edge cases
const ClassProxy = new Proxy(BaseClass, {});
assert(isClass(ClassProxy) === true, "Proxied ES6 class is recognized as class");

const nonConstructibleFnWithThrowingToString = function () { };
nonConstructibleFnWithThrowingToString.toString = () => { throw new Error("Throwing toString"); };
assert(isClass(nonConstructibleFnWithThrowingToString) === false, "Function with throwing toString returns false safely");

// Method definitions on objects (not constructible)
const plainObjWithMethod = {
    myMethod() { },
    get myGetter() { return 1; }
};
assert(isClass(plainObjWithMethod.myMethod) === false, "Object concise method is not class");

assert(isClass(StandardFunction) === false, "Standard function is not class");
assert(isClass(arrowFn) === false, "Arrow function is not class");
assert(isClass(boundFn) === false, "Bound function is not class");
assert(isClass(asyncFn) === false, "Async function is not class");
assert(isClass(genFn) === false, "Generator function is not class");
assert(isClass(asyncGenFn) === false, "Async generator function is not class");
assert(isClass(Date) === true, "Native Date constructor is class");
assert(isClass(Map) === true, "Native Map constructor is class");
assert(isClass(Set) === true, "Native Set constructor is class");
assert(isClass(Uint8Array) === true, "Native Uint8Array constructor is class");
assert(isClass(ArrayBuffer) === true, "Native ArrayBuffer constructor is class");
assert(isClass(null) === false, "null is not class");
assert(isClass(undefined) === false, "undefined is not class");
assert(isClass(123) === false, "number is not class");
assert(isClass("class Foo {}") === false, "string containing class code is not class");

// False-positive regressions: regular functions with leading comments containing the word "class" or division slashes
function commentedFunctionWithClassWord() {
    /* top comment mentioning class */
    const c = "class";
    return 10 / 2 / 5;
}
assert(isClass(commentedFunctionWithClassWord) === false, "Function with comments and internal 'class' word is strictly rejected");

const fnWithDivision = function calc() {
    return 100 / 2 / 5 / 10;
};
assert(isClass(fnWithDivision) === false, "Function with chained division slashes is not class");
assert(isClass({}) === false, "object is not class");

// Host/Global functions that are not constructible
assert(isClass(Math.max) === false, "Math.max is not class");
assert(isClass(parseInt) === false, "parseInt is not class");
assert(isClass(JSON.stringify) === false, "JSON.stringify is not class");

// 3.1 Extended False Positives (Non-Classes Flagged as Classes)
function fnReturningClassProp(this: any) { return this.class; }
function fnWithClassVar() { const my_class = 1; return my_class; }
function fnMatchingCssRegex() { return /\bclass\b/.test("foo"); }
function fnWithSpecialRegexAndComment() { return / [/*] /; /* class */ }
function fnWithDivisionAndInnerClass(a: number, b: number) { return a / 2 / b; class X {} }
const objWithMethod = {
    classMethod() { return "class"; },
    *gen() { yield "class"; }
};

assert(isClass(fnReturningClassProp) === false, "Function returning this.class is not class");
assert(isClass(fnWithClassVar) === false, "Function with local my_class variable is not class");
assert(isClass(fnMatchingCssRegex) === false, "Function with regex containing class is not class");
assert(isClass(fnWithSpecialRegexAndComment) === false, "Function with regex / [/*] / is not class");
assert(isClass(fnWithDivisionAndInnerClass) === false, "Function with division operators and inner class is not class");
assert(isClass(objWithMethod.classMethod) === false, "Object method shorthand is not class");
assert(isClass(objWithMethod.gen) === false, "Object generator method is not class");

function fnWithClassDefault(cls = class Inner {}) { return cls; }
assert(isClass(fnWithClassDefault) === false, "Function with class default argument is not class");

function class_prefixed_fn() { return 123; }
assert(isClass(class_prefixed_fn) === false, "Function named class_prefixed_fn is not class");

const AnonNoSpaceClass = eval("(class{})");
assert(isClass(AnonNoSpaceClass) === true, "Anonymous class without space class{} is recognized");

// 3.2 Comments, Whitespace & Formatting Variations
const WinNewlineClass = eval("( // Windows newline\r\nclass WinClass {} )");
const UnixNewlineClass = eval("( // Unix newline\nclass UnixClass {} )");
const InterleavedLineAndBlock = eval("( // line 1\n/* block 1 */\n// line 2\n/* block 2 */\nclass InterleavedMixed {} )");
const NestedLookalikeComments1 = eval("( /* / * // ** */ class Lookalike1 {} )");
const NestedLookalikeComments2 = eval("( /* ******************* */ class Lookalike2 {} )");
const UnicodeBOMClass = eval("(\uFEFFclass BOMClass {})");

assert(isClass(WinNewlineClass) === true, "Class with Windows newline comments is class");
assert(isClass(UnixNewlineClass) === true, "Class with Unix newline comments is class");
assert(isClass(InterleavedLineAndBlock) === true, "Class with interleaved line and block comments is class");
assert(isClass(NestedLookalikeComments1) === true, "Class with nested lookalike comment symbols is class");
assert(isClass(NestedLookalikeComments2) === true, "Class with multiple asterisks in comment is class");
assert(isClass(UnicodeBOMClass) === true, "Class with leading Unicode BOM is class");

// 3.3 Anonymous and Named Class Expressions
const AnonClass = class {};
const NamedClassExpr = class NamedExpr {};
assert(isClass(AnonClass) === true, "Anonymous class expression is class");
assert(isClass(NamedClassExpr) === true, "Named class expression is class");

// 3.4 Bound Classes & Bound Native Constructors
const BoundDate = Date.bind(null);
const BoundAnonClass = (class {}).bind(null);
assert(isClass(BoundDate) === false, "Bound Date constructor is recognized as bound function");
assert(isClass(BoundAnonClass) === false, "Bound class expression is recognized as bound function");

// 3.5 Hostile / Throwing Proxies & Accessor Traps on Functions
const evilToStringFn = new Proxy(function() {}, {
    get(t, p) {
        if (p === "toString") throw new Error("toString Trap exploded");
        return Reflect.get(t, p);
    }
});
assert(isClass(evilToStringFn) === false, "Proxy throwing on toString fails gracefully in isClass");

const evilDescFn = new Proxy(function() {}, {
    getOwnPropertyDescriptor(t, p) {
        if (p === "prototype") throw new Error("Descriptor trap exploded");
        return Reflect.getOwnPropertyDescriptor(t, p);
    }
});
assert(isClass(evilDescFn) === false, "Proxy throwing on prototype descriptor fails gracefully in isClass");

const evilNameFn = new Proxy(function() {}, {
    get(t, p) {
        if (p === "name") throw new Error("Name trap exploded");
        return Reflect.get(t, p);
    }
});
assert(isClass(evilNameFn) === false, "Proxy throwing on name fails gracefully in isClass");

// Revoked Proxy function
const { proxy: throwingFnProxy, revoke } = Proxy.revocable(function () { }, {});
revoke();
assert(isClass(throwingFnProxy) === false, "Revoked proxy function does not crash isClass");

// 4. Spoofed Symbol.toStringTag Objects (Anti-Spoofing tests)
const fakeDate = { [Symbol.toStringTag]: "Date" };
const fakeMap = { [Symbol.toStringTag]: "Map" };
const fakeSet = { [Symbol.toStringTag]: "Set" };
const fakeRegExp = { [Symbol.toStringTag]: "RegExp" };
const fakeArrayBuffer = { [Symbol.toStringTag]: "ArrayBuffer" };
const fakeDataView = { [Symbol.toStringTag]: "DataView" };
const fakeUint8Array = { [Symbol.toStringTag]: "Uint8Array" };
const fakeUint8ClampedArray = { [Symbol.toStringTag]: "Uint8ClampedArray" };

assert(isValidDateObj(fakeDate) === false, "Spoofed Date is rejected");
assert(isMap(fakeMap) === false, "Spoofed Map is rejected");
assert(isSet(fakeSet) === false, "Spoofed Set is rejected");
assert(isRegExp(fakeRegExp) === false, "Spoofed RegExp is rejected");
assert(isArrayBuffer(fakeArrayBuffer) === false, "Spoofed ArrayBuffer is rejected");
assert(isDataView(fakeDataView) === false, "Spoofed DataView is rejected");
assert(isUint8Array(fakeUint8Array) === false, "Spoofed Uint8Array is rejected");
assert(isUint8ClampedArray(fakeUint8ClampedArray) === false, "Spoofed Uint8ClampedArray is rejected");
assert(isBinaryObj(fakeUint8Array) === false, "Spoofed binary obj is rejected");

// Forged native prototype instances (without native internal slots)
const fakeDateInstance = Object.create(Date.prototype);
const fakeMapInstance = Object.create(Map.prototype);
const fakeSetInstance = Object.create(Set.prototype);
const fakeRegExpInstance = Object.create(RegExp.prototype);
const fakeU8Proto = Object.create(Uint8Array.prototype);

assert(isValidDateObj(fakeDateInstance) === false, "Object.create(Date.prototype) without slot fails isValidDateObj");
assert(isMap(fakeMapInstance) === false, "Object.create(Map.prototype) without slot fails isMap");
assert(isSet(fakeSetInstance) === false, "Object.create(Set.prototype) without slot fails isSet");
assert(isRegExp(fakeRegExpInstance) === false, "Object.create(RegExp.prototype) without slot fails isRegExp");
assert(isUint8Array(fakeU8Proto) === false, "Object.create(Uint8Array.prototype) without slot fails isUint8Array");
assert(isBinaryObj(fakeU8Proto) === false, "Object.create(Uint8Array.prototype) without slot fails isBinaryObj");

// 5. Valid Native Objects
assert(isValidDateObj(new Date()) === true, "Valid Date is accepted");
assert(isValidDateObj(new Date("invalid date string")) === false, "Invalid Date NaN is rejected");
assert(isRegExp(/test/g) === true, "RegExp is accepted");
assert(isRegExp(new RegExp("abc")) === true, "new RegExp is accepted");
assert(isSet(new Set([1, 2])) === true, "Set is accepted");
assert(isMap(new Map()) === true, "Map is accepted");
assert(isURLSearchParams(new URLSearchParams("a=1&b=2")) === true, "URLSearchParams is accepted");
assert(isError(new Error("err")) === true, "Error is accepted");
assert(isError(new TypeError("type err")) === true, "TypeError is accepted");
assert(isError(new RangeError("range err")) === true, "RangeError is accepted");

class CustomError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "CustomError";
    }
}
assert(isError(new CustomError("custom error")) === true, "Custom subclassed Error is accepted");

const fakeError = {
    name: "Error",
    message: "Fake error message",
    [Symbol.toStringTag]: "Error",
    stack: "Error: fake stack\n    at fake (file.ts:1:1)"
};
assert(isError(fakeError) === false, "Fake error object is rejected");

// 6. Boxed Primitive Object guards & unboxPrimitiveObj
const boxedNum = Object(123);
const boxedStr = Object("hello");
const boxedBool = Object(true);
const boxedBigInt = Object(999n);
const sym = Symbol("sym");
const boxedSym = Object(sym);

assert(isNumberObj(boxedNum) === true, "boxed Number recognized");
assert(isNumberObj(123) === false, "primitive number is not NumberObj");
assert(isStringObj(boxedStr) === true, "boxed String recognized");
assert(isStringObj("hello") === false, "primitive string is not StringObj");
assert(isBooleanObj(boxedBool) === true, "boxed Boolean recognized");
assert(isBigIntObj(boxedBigInt) === true, "boxed BigInt recognized");
assert(isSymbolObj(boxedSym) === true, "boxed Symbol recognized");

// Unboxing edge cases
assert(unboxPrimitiveObj(boxedNum) === 123, "unbox boxed number");
assert(unboxPrimitiveObj(boxedStr) === "hello", "unbox boxed string");
assert(unboxPrimitiveObj(boxedBool) === true, "unbox boxed boolean");
assert(unboxPrimitiveObj(boxedBigInt) === 999n, "unbox boxed bigint");
assert(unboxPrimitiveObj(boxedSym) === sym, "unbox boxed symbol");
assert(unboxPrimitiveObj({ a: 1 }) !== 1, "non-primitive object returned unmodified");

// Special numeric and string edge cases
assert(Number.isNaN(unboxPrimitiveObj(Object(NaN)) as number), "unbox boxed NaN preserves NaN");
assert(unboxPrimitiveObj(Object(Infinity)) === Infinity, "unbox boxed Infinity");
assert(unboxPrimitiveObj(Object(-Infinity)) === -Infinity, "unbox boxed -Infinity");
assert(unboxPrimitiveObj(Object(-0)) === -0, "unbox boxed -0");
assert(unboxPrimitiveObj(Object("")) === "", "unbox boxed empty string");
assert(unboxPrimitiveObj(Object(false)) === false, "unbox boxed false");
assert(unboxPrimitiveObj(Object(0n)) === 0n, "unbox boxed 0n");

// Primitives passed directly
assert(unboxPrimitiveObj(42) === 42, "direct primitive number unchanged");
assert(unboxPrimitiveObj("direct") === "direct", "direct primitive string unchanged");
assert(unboxPrimitiveObj(false) === false, "direct primitive boolean unchanged");
assert(unboxPrimitiveObj(null) === null, "null unchanged");
assert(unboxPrimitiveObj(undefined) === undefined, "undefined unchanged");
assert(unboxPrimitiveObj(sym) === sym, "symbol unchanged");

// Null prototype object & Objects with throwing properties
const nullProtoObj = Object.create(null);
assert(unboxPrimitiveObj(nullProtoObj) === nullProtoObj, "Object.create(null) returned unchanged");

// Trapped object with custom valueOf & throwing accessor
let maliciousGetCount = 0;
const deeplyTrappedObject = {
    get valueOf() {
        maliciousGetCount++;
        return () => {
            throw new Error("Malicious execution!");
        };
    },
    get [Symbol.toPrimitive]() {
        maliciousGetCount++;
        return () => "primitive_bomb";
    }
};
const unboxedTrapped = unboxPrimitiveObj(deeplyTrappedObject);
assert(unboxedTrapped === deeplyTrappedObject, "Unbox safely returns trapped object without executing getter bomb");
assert(maliciousGetCount === 0, "No getters on trapped object were triggered during unboxing check");

// Spoofed boxed primitive via prototype forging without internal slot
const fakeBoxedNumber = Object.create(Number.prototype);
assert(unboxPrimitiveObj(fakeBoxedNumber) === fakeBoxedNumber, "Object.create(Number.prototype) without slot is not unboxed");
const fakeBoxedString = Object.create(String.prototype);
assert(unboxPrimitiveObj(fakeBoxedString) === fakeBoxedString, "Object.create(String.prototype) without slot is not unboxed");

// 7. Binary & Buffer Types
const ab = new ArrayBuffer(16);
const dv = new DataView(ab);
const u8 = new Uint8Array(ab);
const u8c = new Uint8ClampedArray(ab);
const zeroAB = new ArrayBuffer(0);
const zeroU8 = new Uint8Array(zeroAB);
const offsetBuffer = new ArrayBuffer(64);
const middleU8 = new Uint8Array(offsetBuffer, 16, 16);
const middleClamped = new Uint8ClampedArray(offsetBuffer, 32, 8);

assert(isArrayBuffer(ab) === true, "ArrayBuffer recognized");
assert(isArrayBuffer(zeroAB) === true, "Zero-length ArrayBuffer recognized");
assert(isArrayBuffer(dv) === false, "DataView is not ArrayBuffer");
assert(isDataView(dv) === true, "DataView recognized");
assert(isDataView(ab) === false, "ArrayBuffer is not DataView");
assert(isUint8Array(u8) === true, "Uint8Array recognized");
assert(isUint8Array(zeroU8) === true, "Zero-length Uint8Array recognized");
assert(isUint8Array(middleU8) === true, "Offset Uint8Array recognized");
assert(isUint8ClampedArray(u8c) === true, "Uint8ClampedArray recognized");
assert(isUint8ClampedArray(middleClamped) === true, "Offset Uint8ClampedArray recognized");
assert(isUint8ClampedArray(u8) === false, "Uint8Array is not Uint8ClampedArray");

assert(isBinaryObj(u8) === true, "Uint8Array isBinaryObj");
assert(isBinaryObj(zeroU8) === true, "Zero-length Uint8Array isBinaryObj");
assert(isBinaryObj(middleU8) === true, "Offset Uint8Array isBinaryObj");
assert(isBinaryObj(u8c) === true, "Uint8ClampedArray isBinaryObj");
assert(isBinaryObj(middleClamped) === true, "Offset Uint8ClampedArray isBinaryObj");
assert(isBinaryObj(ab) === true, "ArrayBuffer isBinaryObj");
assert(isBinaryObj(dv) === true, "DataView isBinaryObj");

// Non-binary typed arrays
assert(isBinaryObj(new Int8Array(8)) === false, "Int8Array is not isBinaryObj");
assert(isBinaryObj(new Int16Array(8)) === false, "Int16Array is not isBinaryObj");
assert(isBinaryObj(new Int32Array(8)) === false, "Int32Array is not isBinaryObj");
assert(isBinaryObj(new Uint16Array(8)) === false, "Uint16Array is not isBinaryObj");
assert(isBinaryObj(new Uint32Array(8)) === false, "Uint32Array is not isBinaryObj");
assert(isBinaryObj(new Float32Array(8)) === false, "Float32Array is not isBinaryObj");
assert(isBinaryObj(new Float64Array(8)) === false, "Float64Array is not isBinaryObj");
assert(isBinaryObj(new BigInt64Array(8)) === false, "BigInt64Array is not isBinaryObj");
assert(isBinaryObj(new BigUint64Array(8)) === false, "BigUint64Array is not isBinaryObj");

if (typeof SharedArrayBuffer !== "undefined") {
    const sab = new SharedArrayBuffer(32);
    const sabU8 = new Uint8Array(sab, 8, 8);
    assert(isSharedArrayBuffer(sab) === true, "SharedArrayBuffer recognized");
    assert(isArrayBuffer(sab) === false, "SharedArrayBuffer is not standard ArrayBuffer");
    assert(isUint8Array(sabU8) === true, "Uint8Array over SharedArrayBuffer is Uint8Array");
    assert(isBinaryObj(sab) === true, "SharedArrayBuffer isBinaryObj");
    assert(isBinaryObj(sabU8) === true, "Uint8Array over SAB is isBinaryObj");
}

// 8. Plain Object with custom Symbol.toStringTag
const taggedPlain = { a: 1 };
Object.defineProperty(taggedPlain, Symbol.toStringTag, { value: "CustomTag" });
assert(isPlainObj(taggedPlain) === true, "Plain object with custom Symbol.toStringTag is recognized as plain object");

// 9. FormValidatorError vs true Error subclasses
class FormValidatorError {
    name = "FormValidatorError";
    message = "Form is invalid";
}
assert(isError(new FormValidatorError()) === false, "FormValidatorError without Error inheritance is strictly rejected");

class LegitCustomError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "LegitCustomError";
    }
}
assert(isError(new LegitCustomError("real error")) === true, "Legit subclassed Error is accepted");

// 10. Native constructibles & Cross-realm non-constructibles in isClass
assert(isClass(Date) === true, "Native Date is class");
assert(isClass(Map) === true, "Native Map is class");
assert(isClass(Set) === true, "Native Set is class");
assert(isClass(Uint8Array) === true, "Native Uint8Array is class");
assert(isClass(ArrayBuffer) === true, "Native ArrayBuffer is class");
assert(isClass(RegExp) === true, "Native RegExp is class");
assert(isClass(Symbol) === false, "Symbol is not class");
assert(isClass(BigInt) === false, "BigInt is not class");

// Cross-realm Symbol emulation (function with name Symbol and [native code])
const fakeCrossSymbol = function Symbol() { };
Object.defineProperty(fakeCrossSymbol, "name", { value: "Symbol" });
assert(isClass(fakeCrossSymbol) === false, "Cross-realm named Symbol is rejected by isClass without exceptions");

// 10. Unboxing Fast Path Verification
const complexPlain = { a: 1, b: [1, 2, 3], nested: { c: "test" } };
assert(unboxPrimitiveObj(complexPlain) === complexPlain, "unboxPrimitiveObj returns plain object identity");
assert(unboxPrimitiveObj(Object.create(null)) !== null, "unboxPrimitiveObj preserves null-proto object");

// 11. Diabolical & Adversarial Edge Cases for unboxPrimitiveObj & Object Guards

// 11.1 Date and RegExp preservation under unboxing
const sampleDate = new Date("2026-05-25T12:00:00Z");
const sampleRegExp = /^[a-z]+$/gi;
assert(unboxPrimitiveObj(sampleDate) === sampleDate, "unboxPrimitiveObj preserves Date instance without converting to timestamp number");
assert(unboxPrimitiveObj(sampleRegExp) === sampleRegExp, "unboxPrimitiveObj preserves RegExp instance without mutation");

// Subclassed Date / RegExp
class CustomDateSubclass extends Date { }
const customDate = new CustomDateSubclass("2026-01-01");
assert(unboxPrimitiveObj(customDate) === customDate, "unboxPrimitiveObj preserves subclassed Date instance");

class CustomRegExpSubclass extends RegExp { }
const customRegExp = new CustomRegExpSubclass("abc", "i");
assert(unboxPrimitiveObj(customRegExp) === customRegExp, "unboxPrimitiveObj preserves subclassed RegExp instance");

// 11.2 Custom Domain Value Objects (preserved as objects because DataFrame schemas define strict primitive types)
class TemperatureCelsius {
    constructor(private val: number) { }
    valueOf() { return this.val; }
}
const tempObj = new TemperatureCelsius(36.6);
assert(unboxPrimitiveObj(tempObj) === tempObj, "Custom Temperature object is preserved as object");

class StringIdentifier {
    constructor(private id: string) { }
    valueOf() { return this.id; }
}
const strIdObj = new StringIdentifier("usr_9988");
assert(unboxPrimitiveObj(strIdObj) === strIdObj, "Custom StringIdentifier object is preserved as object");

class BigNumericId {
    constructor(private big: bigint) { }
    valueOf() { return this.big; }
}
const bigIdObj = new BigNumericId(9007199254740993n);
assert(unboxPrimitiveObj(bigIdObj) === bigIdObj, "Custom BigNumericId object is preserved as object");

class FlagToggle {
    constructor(private active: boolean) { }
    valueOf() { return this.active; }
}
const flagObj = new FlagToggle(true);
assert(unboxPrimitiveObj(flagObj) === flagObj, "Custom FlagToggle object is preserved as object");

const customSym = Symbol("custom_token");
class TokenSymbol {
    valueOf() { return customSym; }
}
const tokenObj = new TokenSymbol();
assert(unboxPrimitiveObj(tokenObj) === tokenObj, "Custom TokenSymbol object is preserved as object");

// 11.3 Adversarial valueOf implementations
// ValueOf returning object / function / null / undefined
class ObjectReturningValueOf {
    valueOf() { return { not: "primitive" }; }
}
const objRet = new ObjectReturningValueOf();
assert(unboxPrimitiveObj(objRet) === objRet, "valueOf returning object is ignored, returning object identity");

class FunctionReturningValueOf {
    valueOf() { return () => "not_invoked"; }
}
const fnRet = new FunctionReturningValueOf();
assert(unboxPrimitiveObj(fnRet) === fnRet, "valueOf returning function is ignored, returning object identity");

class NullReturningValueOf {
    valueOf() { return null; }
}
const nullRet = new NullReturningValueOf();
assert(unboxPrimitiveObj(nullRet) === nullRet, "valueOf returning null is ignored, preserving object identity");

class UndefinedReturningValueOf {
    valueOf() { return undefined; }
}
const undefRet = new UndefinedReturningValueOf();
assert(unboxPrimitiveObj(undefRet) === undefRet, "valueOf returning undefined preserves object identity");

// Recursive self-returning valueOf
class RecursiveValueOf {
    valueOf() { return this; }
}
const recObj = new RecursiveValueOf();
assert(unboxPrimitiveObj(recObj) === recObj, "Recursive self-returning valueOf avoids infinite loop and returns self");

// 11.4 Poisoned Getter Bombs & Throwing Proxies
const throwingValueOfGetter = {
    get valueOf() {
        throw new Error("TRAP: property valueOf getter detonated!");
    }
};
assert(unboxPrimitiveObj(throwingValueOfGetter) === throwingValueOfGetter, "Throwing valueOf getter fails gracefully");

const throwingValueOfMethod = {
    valueOf() {
        throw new Error("TRAP: valueOf method execution detonated!");
    }
};
assert(unboxPrimitiveObj(throwingValueOfMethod) === throwingValueOfMethod, "Throwing valueOf method fails gracefully");

// Proxy that throws on every trap
const ultraHostileProxy = new Proxy({}, {
    get(target, prop) {
        throw new Error(`TRAP: forbidden get on property ${String(prop)}`);
    },
    has(target, prop) {
        throw new Error(`TRAP: forbidden has on property ${String(prop)}`);
    },
    getPrototypeOf() {
        throw new Error("TRAP: forbidden getPrototypeOf");
    }
});
assert(unboxPrimitiveObj(ultraHostileProxy) === ultraHostileProxy, "Ultra-hostile throwing proxy unboxes safely without crashing");
assert(isPlainObj(ultraHostileProxy) === false, "Hostile proxy is safely rejected by isPlainObj without unhandled rejection");

// 11.5 Frozen & Non-extensible Objects with prototype tampering
const frozenNull = Object.freeze(Object.create(null));
assert(unboxPrimitiveObj(frozenNull) === frozenNull, "Frozen Object.create(null) unboxed safely");

const frozenCustom = Object.freeze({
    valueOf() { return 777; }
});
assert(unboxPrimitiveObj(frozenCustom) === frozenCustom, "Frozen custom object without native slot is preserved");

// 11.6 Native instances that do not define own valueOf but inherit from Object.prototype
const plainSet = new Set([1, 2, 3]);
const plainMap = new Map([["a", 1]]);
const plainBuffer = new ArrayBuffer(8);
const plainDataView = new DataView(plainBuffer);
assert(unboxPrimitiveObj(plainSet) === plainSet, "Set is preserved");
assert(unboxPrimitiveObj(plainMap) === plainMap, "Map is preserved");
assert(unboxPrimitiveObj(plainBuffer) === plainBuffer, "ArrayBuffer is preserved");
assert(unboxPrimitiveObj(plainDataView) === plainDataView, "DataView is preserved");

// 12. Advanced Hostile, Cross-Realm & Prototype Pollution Edge Cases

// 12.1 Hostile throwing proxy in isError, isPlainObj, and object guards
assert(isError(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isError");
assert(isValidDateObj(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isValidDateObj");
assert(isRegExp(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isRegExp");
assert(isSet(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isSet");
assert(isMap(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isMap");
assert(isURLSearchParams(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isURLSearchParams");
assert(isUint8Array(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isUint8Array");
assert(isUint8ClampedArray(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isUint8ClampedArray");
assert(isArrayBuffer(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isArrayBuffer");
assert(isDataView(ultraHostileProxy) === false, "Ultra hostile proxy is safely rejected by isDataView");

// 12.2 Single-argument and advanced native constructors in isClass
assert(isClass(Promise) === true, "Native Promise constructor recognized as isClass");
if (typeof WeakRef !== "undefined") {
    assert(isClass(WeakRef) === true, "Native WeakRef constructor recognized as isClass");
}
if (typeof FinalizationRegistry !== "undefined") {
    assert(isClass(FinalizationRegistry) === true, "Native FinalizationRegistry constructor recognized as isClass");
}

// 12.3 Multi-tier deep Error inheritance hierarchies
class Tier1Error extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "Tier1Error";
    }
}
class Tier2HttpError extends Tier1Error {
    constructor(msg: string, public statusCode: number) {
        super(msg);
        this.name = "Tier2HttpError";
    }
}
class Tier3NotFoundError extends Tier2HttpError {
    constructor(msg: string) {
        super(msg, 404);
        this.name = "Tier3NotFoundError";
    }
}
assert(isError(new Tier3NotFoundError("resource missing")) === true, "Multi-tier subclassed Error is accepted by isError");
assert(isError(new Tier2HttpError("bad req", 400)) === true, "Intermediate subclassed Error is accepted by isError");
assert(isError(new Tier1Error("base app error")) === true, "Base custom Error is accepted by isError");

// Non-error class named Error without inheriting from native Error
class UnrelatedClassNamedError {
    name = "Error";
    message = "I am not an actual Error";
}
assert(isError(new UnrelatedClassNamedError()) === false, "Unrelated class named Error without native Error in prototype chain is rejected");

// Throwing property getters on error-like objects
const throwingPropertyError = {
    get name() { throw new Error("TRAP: error name bomb!"); },
    get message() { throw new Error("TRAP: error message bomb!"); }
};
assert(isError(throwingPropertyError) === false, "Error-like object with throwing property getters fails gracefully");

// 12.4 Prototype-level Symbol.toStringTag interference resilience
const cleanNullProto = Object.create(null);
assert(isValidDateObj(cleanNullProto) === false, "Null proto object safely rejected by isValidDateObj");
assert(isMap(cleanNullProto) === false, "Null proto object safely rejected by isMap");
assert(isSet(cleanNullProto) === false, "Null proto object safely rejected by isSet");
assert(isRegExp(cleanNullProto) === false, "Null proto object safely rejected by isRegExp");
assert(isError(cleanNullProto) === false, "Null proto object safely rejected by isError");

// 12.5 Boxed BigInt & Symbol Object guards
const realBoxedBigInt: Object = Object(5555n);
const realBoxedSymbol: Object = Object(Symbol("guard_test"));
assert(isBigIntObj(realBoxedBigInt) === true, "Object(5555n) is isBigIntObj");
assert(isBigIntObj(5555n) === false, "Primitive 5555n is not isBigIntObj");
assert(isSymbolObj(realBoxedSymbol) === true, "Object(Symbol) is isSymbolObj");
assert(isSymbolObj(Symbol("guard_test")) === false, "Primitive Symbol is not isSymbolObj");

const fakeBigIntProto = Object.create(BigInt.prototype);
assert(isBigIntObj(fakeBigIntProto) === false, "Object.create(BigInt.prototype) without slot is rejected");
const fakeSymbolProto = Object.create(Symbol.prototype);
assert(isSymbolObj(fakeSymbolProto) === false, "Object.create(Symbol.prototype) without slot is rejected");

// 12.6 URLSearchParams deep validation
assert(isURLSearchParams(new URLSearchParams()) === true, "Empty URLSearchParams is valid");
assert(isURLSearchParams(new URLSearchParams("foo=bar&baz=qux")) === true, "Populated URLSearchParams is valid");
const fakeURLParams = { has: () => true, get: () => "bar" };
assert(isURLSearchParams(fakeURLParams) === false, "Duck-typed URLSearchParams fake is rejected");
if (typeof URLSearchParams !== "undefined") {
    const fakeParamsProto = Object.create(URLSearchParams.prototype);
    assert(isURLSearchParams(fakeParamsProto) === false, "Object.create(URLSearchParams.prototype) without slot is rejected");

    class SubclassedURLSearchParams extends URLSearchParams {}
    assert(isURLSearchParams(new SubclassedURLSearchParams("q=1")) === true, "Subclassed URLSearchParams is accepted");

    const throwingHasParams = Object.create(URLSearchParams.prototype, {
        has: {
            value: () => { throw new Error("Throwing has method"); }
        }
    });
    assert(isURLSearchParams(throwingHasParams) === false, "URLSearchParams with throwing overridden has method fails gracefully");
}

// 12.7 TypedArray Slot Discrimination
assert(isUint8Array(new Uint8Array(10)) === true, "Uint8Array is isUint8Array");
assert(isUint8Array(new Uint8ClampedArray(10)) === false, "Uint8ClampedArray is not isUint8Array");
assert(isUint8ClampedArray(new Uint8ClampedArray(10)) === true, "Uint8ClampedArray is isUint8ClampedArray");
assert(isUint8ClampedArray(new Uint8Array(10)) === false, "Uint8Array is not isUint8ClampedArray");
assert(isUint8Array(new Int8Array(10)) === false, "Int8Array is not isUint8Array");
assert(isUint8Array(new Float64Array(10)) === false, "Float64Array is not isUint8Array");

// 12.8 Arguments Object Tests
(function testArguments() {
    assert(isObj(arguments) === true, "arguments object is isObj");
    assert(isPlainObj(arguments) === false, "arguments object is not plain object");
    assert(unboxPrimitiveObj(arguments) === arguments, "arguments object unboxes to self");
})();

// 12.9 Forged Multi-Level Null Prototype & Object.prototype Emulation
const forgedDeepNull = Object.create(
    Object.create(null, {
        constructor: { value: Object }
    })
);
assert(isPlainObj(forgedDeepNull) === false, "Deep null-prototype object with forged constructor is not plain");

const forgedNullWithFakeProps = Object.create(null, {
    constructor: { value: Object },
    hasOwnProperty: { value: Object.prototype.hasOwnProperty }
});
assert(isPlainObj(forgedNullWithFakeProps) === true, "Direct null-prototype with custom own properties passes as plain");

const nestedForgedNull = Object.create(forgedNullWithFakeProps);
assert(isPlainObj(nestedForgedNull) === false, "Multi-level null prototype with spoofed constructor/hasOwnProperty is rejected");

// 12.10 Subclassed TypedArrays
class CustomUint8Array extends Uint8Array {}
const customU8 = new CustomUint8Array(4);
assert(isUint8Array(customU8) === true, "Subclassed Uint8Array is recognized as Uint8Array");
assert(isBinaryObj(customU8) === true, "Subclassed Uint8Array is recognized as BinaryObj");

class CustomUint8ClampedArray extends Uint8ClampedArray {}
const customU8c = new CustomUint8ClampedArray(4);
assert(isUint8ClampedArray(customU8c) === true, "Subclassed Uint8ClampedArray is recognized");
assert(isBinaryObj(customU8c) === true, "Subclassed Uint8ClampedArray is recognized as BinaryObj");

// 12.11 Detached ArrayBuffer Edge Cases
if (typeof ArrayBuffer.prototype.transfer === "function" || typeof structuredClone === "function") {
    try {
        const abToDetach = new ArrayBuffer(16);
        const detached = (abToDetach as any).transfer
            ? (abToDetach as any).transfer()
            : structuredClone(abToDetach, { transfer: [abToDetach] });
        assert(isArrayBuffer(abToDetach) === true, "Detached ArrayBuffer is still recognized as ArrayBuffer");
        assert(isBinaryObj(abToDetach) === true, "Detached ArrayBuffer is recognized as isBinaryObj");
    } catch {}
}

// 12.13 Additional Exhaustive Edge Cases (1 through 7)

// 1. Falsy / Host Objects (document.all simulation)
const fakeDocumentAll = Object.create(null);
// An object that is not null, typeof "object"
assert(isObj(fakeDocumentAll) === true, "Null-prototype object is isObj");

// 2. Forged 2-tier null prototype with fake toString and constructor (Harded isPlainObj test)
const forgedTwoTierNull = Object.create(
    Object.create(null, {
        toString: { value: Object.prototype.toString },
        constructor: { value: Object }
    })
);
assert(isPlainObj(forgedTwoTierNull) === false, "Forged 2-tier null prototype lacking isPrototypeOf is strictly rejected by isPlainObj");

// 3. URLSearchParams edge cases
if (typeof URLSearchParams !== "undefined") {
    const usp = new URLSearchParams("foo=bar&baz=qux");
    assert(isURLSearchParams(usp) === true, "Standard URLSearchParams is URLSearchParams");
    const emptyUsp = new URLSearchParams();
    assert(isURLSearchParams(emptyUsp) === true, "Empty URLSearchParams is URLSearchParams");
}

// 4. Exotic native constructors requiring plain object or function (WeakRef, FinalizationRegistry)
if (typeof WeakRef !== "undefined") {
    assert(isClass(WeakRef) === true, "WeakRef (requires object target) is recognized as isClass");
}
if (typeof FinalizationRegistry !== "undefined") {
    assert(isClass(FinalizationRegistry) === true, "FinalizationRegistry (requires callback arg) is recognized as isClass");
}

// 5. ES5-transpiled pseudo-class constructors (demonstrating expected boundary: false)
function ES5Person(this: any, name: string) {
    this.name = name;
}
ES5Person.prototype.walk = function () { };
assert(isClass(ES5Person) === false, "ES5-style function constructor without ES6 class keyword is not isClass");

// 6. Node.js Buffer vs Uint8Array pooled buffer behavior
const globalBuffer = (globalThis as any).Buffer;
if (typeof globalBuffer !== "undefined") {
    const nodeBuf = globalBuffer.from("hello world");
    assert(isUint8Array(nodeBuf) === true, "Node.js Buffer is Uint8Array");
    assert(isBinaryObj(nodeBuf) === true, "Node.js Buffer is BinaryObj");
    const slicedBuf = nodeBuf.subarray(2, 6);
    assert(isUint8Array(slicedBuf) === true, "Subarray of Node.js Buffer is Uint8Array");
    assert(slicedBuf.byteOffset >= 0, "Buffer subarray preserves valid byteOffset");
}

// 7. Non-Uint8 Typed Arrays distinction in isBinaryObj
assert(isBinaryObj(new Uint8Array(4)) === true, "Uint8Array is isBinaryObj");
assert(isBinaryObj(new Uint8ClampedArray(4)) === true, "Uint8ClampedArray is isBinaryObj");
assert(isBinaryObj(new ArrayBuffer(4)) === true, "ArrayBuffer is isBinaryObj");
assert(isBinaryObj(new DataView(new ArrayBuffer(4))) === true, "DataView is isBinaryObj");

assert(isBinaryObj(new Int8Array(4)) === false, "Int8Array is not isBinaryObj");
assert(isBinaryObj(new Int16Array(4)) === false, "Int16Array is not isBinaryObj");
assert(isBinaryObj(new Int32Array(4)) === false, "Int32Array is not isBinaryObj");
assert(isBinaryObj(new Float32Array(4)) === false, "Float32Array is not isBinaryObj");
assert(isBinaryObj(new Float64Array(4)) === false, "Float64Array is not isBinaryObj");
if (typeof BigInt64Array !== "undefined") {
    assert(isBinaryObj(new BigInt64Array(4)) === false, "BigInt64Array is not isBinaryObj");
}
if (typeof BigUint64Array !== "undefined") {
    assert(isBinaryObj(new BigUint64Array(4)) === false, "BigUint64Array is not isBinaryObj");
}

// 8. Sealed, Frozen, and Non-Extensible Plain Objects
const sealedPlain = Object.seal({ x: 1 });
const frozenPlain = Object.freeze({ y: 2 });
const nonExtensiblePlain = Object.preventExtensions({ z: 3 });
assert(isPlainObj(sealedPlain) === true, "Sealed object is plain object");
assert(isPlainObj(frozenPlain) === true, "Frozen object is plain object");
assert(isPlainObj(nonExtensiblePlain) === true, "Non-extensible object is plain object");

// 9. Altered own valueOf on Boxed Primitive
const alteredBoxedNum = Object(42);
Object.defineProperty(alteredBoxedNum, "valueOf", { value: () => "spoofed" });
assert(isNumberObj(alteredBoxedNum) === true, "isNumberObj passes despite overridden own valueOf");
assert(unboxPrimitiveObj(alteredBoxedNum) === 42, "unboxPrimitiveObj extracts native primitive ignoring overridden own valueOf");

// 10. isDetachedBuffer checks
assert(isDetachedBuffer(null) === false, "null is not detached buffer");
assert(isDetachedBuffer(undefined) === false, "undefined is not detached buffer");
assert(isDetachedBuffer(123) === false, "number is not detached buffer");
assert(isDetachedBuffer("string") === false, "string is not detached buffer");
assert(isDetachedBuffer(true) === false, "boolean is not detached buffer");
assert(isDetachedBuffer({}) === false, "plain object is not detached buffer");
assert(isDetachedBuffer([]) === false, "array is not detached buffer");
assert(isDetachedBuffer(new ArrayBuffer(8)) === false, "live ArrayBuffer is not detached");
assert(isDetachedBuffer(new Uint8Array(8)) === false, "live Uint8Array is not detached");
assert(isDetachedBuffer(new Uint8ClampedArray(8)) === false, "live Uint8ClampedArray is not detached");
assert(isDetachedBuffer(new Int32Array(8)) === false, "live Int32Array is not detached");
assert(isDetachedBuffer(new Float64Array(8)) === false, "live Float64Array is not detached");
assert(isDetachedBuffer(new DataView(new ArrayBuffer(8))) === false, "live DataView is not detached");

// 10.1 SharedArrayBuffer cannot be detached
if (typeof SharedArrayBuffer !== "undefined") {
    const sab = new SharedArrayBuffer(16);
    assert(isDetachedBuffer(sab) === false, "SharedArrayBuffer is not detached");
    const sabView = new Uint8Array(sab);
    assert(isDetachedBuffer(sabView) === false, "SharedArrayBuffer view is not detached");
}

// 10.2 Spoofed plain objects pretending to be detached buffers
const spoofedDetachedObj1 = { detached: true };
assert(isDetachedBuffer(spoofedDetachedObj1) === false, "Plain object with { detached: true } is not detached buffer");

const spoofedDetachedObj2 = {
    [Symbol.toStringTag]: "ArrayBuffer",
    detached: true,
    byteLength: 0,
};
assert(isDetachedBuffer(spoofedDetachedObj2) === false, "Spoofed ArrayBuffer object with detached: true is rejected");

const spoofedDetachedView = {
    [Symbol.toStringTag]: "Uint8Array",
    buffer: { detached: true },
};
assert(isDetachedBuffer(spoofedDetachedView) === false, "Spoofed view with buffer: { detached: true } is rejected");

// 10.3 Throwing proxy traps in isDetachedBuffer
const hostileBufferProxy = new Proxy(new ArrayBuffer(8), {
    get(target, prop, receiver) {
        if (prop === "detached") throw new Error("TRAP: detached getter triggered");
        return Reflect.get(target, prop, receiver);
    }
});
assert(isDetachedBuffer(hostileBufferProxy) === false, "Proxy wrapping live ArrayBuffer is not recognized as detached buffer");

const hostileViewProxy = new Proxy(new Uint8Array(8), {
    get(target, prop, receiver) {
        if (prop === "buffer") throw new Error("TRAP: buffer getter triggered");
        return Reflect.get(target, prop, receiver);
    }
});
assert(isDetachedBuffer(hostileViewProxy) === false, "Proxy wrapping live Uint8Array is not recognized as detached buffer");

// 10.4 All TypedArray variants detached test
if (typeof (ArrayBuffer.prototype as any).transfer === "function" || typeof structuredClone === "function") {
    try {
        const detachBuf = (buf: ArrayBuffer) => {
            if ((buf as any).transfer) {
                (buf as any).transfer();
            } else {
                structuredClone(buf, { transfer: [buf] });
            }
        };

        const ab = new ArrayBuffer(64);
        const u8 = new Uint8Array(ab, 0, 8);
        const u8c = new Uint8ClampedArray(ab, 8, 8);
        const i16 = new Int16Array(ab, 16, 4);
        const i32 = new Int32Array(ab, 24, 2);
        const f32 = new Float32Array(ab, 32, 2);
        const f64 = new Float64Array(ab, 40, 2);
        const dv = new DataView(ab, 56, 8);

        detachBuf(ab);

        assert(isDetachedBuffer(ab) === true, "Detached ArrayBuffer identified");
        assert(isDetachedBuffer(u8) === true, "Detached Uint8Array view identified");
        assert(isDetachedBuffer(u8c) === true, "Detached Uint8ClampedArray view identified");
        assert(isDetachedBuffer(i16) === true, "Detached Int16Array view identified");
        assert(isDetachedBuffer(i32) === true, "Detached Int32Array view identified");
        assert(isDetachedBuffer(f32) === true, "Detached Float32Array view identified");
        assert(isDetachedBuffer(f64) === true, "Detached Float64Array view identified");
        assert(isDetachedBuffer(dv) === true, "Detached DataView identified");

        if (typeof BigInt64Array !== "undefined") {
            const abBig = new ArrayBuffer(16);
            const bi64 = new BigInt64Array(abBig);
            detachBuf(abBig);
            assert(isDetachedBuffer(bi64) === true, "Detached BigInt64Array view identified");
        }
    } catch {}
}

console.log("=========================================");
console.log("✅ ALL OBJECT UTILS TESTS PASSED!");
console.log("=========================================");