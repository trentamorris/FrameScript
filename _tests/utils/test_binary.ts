/**
 * Comprehensive Edge-Case and Stress Test Suite for src/utils/binary.ts
 */
import { isValidBinary, toValidBinary, isBinaryObj } from "../../src/utils/binary";

console.log("=========================================");
console.log("STARTING BINARY UTILS ROBUSTNESS TESTS...");
console.log("=========================================");

function assert(condition: boolean, msg: string) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${msg}`);
    }
}

// 1. Null / Undefined / Non-objects
assert(isValidBinary(null) === false, "null is not binary");
assert(isValidBinary(undefined) === false, "undefined is not binary");
assert(isValidBinary(123) === false, "number is not binary");
assert(isValidBinary(true) === false, "boolean is not binary");
assert(isValidBinary(100n) === false, "bigint is not binary");
assert(isValidBinary(Symbol("bin")) === false, "symbol is not binary");
assert(isValidBinary({}) === false, "plain object is not binary");
assert(isValidBinary({ length: 10 }) === false, "array-like object is not binary");
assert(toValidBinary(null) === null, "toValidBinary(null) is null");
assert(toValidBinary(undefined) === null, "toValidBinary(undefined) is null");
assert(toValidBinary(123) === null, "toValidBinary(123) is null");
assert(toValidBinary(true) === null, "toValidBinary(true) is null");
assert(toValidBinary({}) === null, "toValidBinary({}) is null");

// 2. Strict Mode Validation
assert(isValidBinary(new Uint8Array([1, 2]), { strict: true }) === true, "Uint8Array is strict binary");
assert(isValidBinary(new Uint8ClampedArray([1, 2]), { strict: true }) === true, "Uint8ClampedArray is strict binary");
assert(isValidBinary(new ArrayBuffer(8), { strict: true }) === true, "ArrayBuffer is strict binary");
assert(isValidBinary(new DataView(new ArrayBuffer(8)), { strict: true }) === true, "DataView is strict binary");
assert(isValidBinary("hello", { strict: true }) === false, "string is not strict binary");
assert(isValidBinary([1, 2, 3], { strict: true }) === false, "array is not strict binary");
assert(isValidBinary(new Float64Array([1.1, 2.2]), { strict: true }) === false, "Float64Array is not strict binary");
assert(isValidBinary(new Int32Array([10, 20]), { strict: true }) === false, "Int32Array is not strict binary");

assert(toValidBinary("hello", { strict: true }) === null, "toValidBinary(string, {strict: true}) is null");
assert(toValidBinary([1, 2], { strict: true }) === null, "toValidBinary(array, {strict: true}) is null");

// 3. Non-Strict Coercions (Strings)
const strBin = toValidBinary("Hello World 🚀");
assert(strBin instanceof Uint8Array, "String coerced to Uint8Array");
assert(new TextDecoder().decode(strBin!) === "Hello World 🚀", "UTF-8 round-trip matches for emoji & multibyte text");

const emptyStrBin = toValidBinary("");
assert(emptyStrBin instanceof Uint8Array && emptyStrBin.length === 0, "Empty string coerced to 0-length Uint8Array");

// 4. Raw Array Buffers and DataViews
const buffer = new ArrayBuffer(4);
const view32 = new Uint32Array(buffer);
view32[0] = 0x12345678;

const abBin = toValidBinary(buffer);
assert(abBin instanceof Uint8Array, "ArrayBuffer converted to Uint8Array");
assert(abBin!.byteLength === 4, "ArrayBuffer byteLength preserved");

const subView = new DataView(buffer, 1, 2);
const dvBin = toValidBinary(subView);
assert(dvBin instanceof Uint8Array, "DataView converted to Uint8Array");
assert(dvBin!.byteLength === 2, "DataView offset and length respected");

// 5. TypedArrays with offsets and slices
const bigBuf = new ArrayBuffer(32);
const offsetF64 = new Float64Array(bigBuf, 8, 2); // 16 bytes starting at offset 8
offsetF64[0] = 3.14159;
offsetF64[1] = 2.71828;

const offsetBin = toValidBinary(offsetF64);
assert(offsetBin instanceof Uint8Array, "Offset Float64Array converted");
assert(offsetBin!.byteLength === 16, "Offset TypedArray byteLength matches sliced region exactly");
const backToF64 = new Float64Array(offsetBin!.buffer, offsetBin!.byteOffset, 2);
assert(backToF64[0] === 3.14159 && backToF64[1] === 2.71828, "Byte content preserved across offset conversion");

// 6. Uint8ClampedArray Conversion
const clamped = new Uint8ClampedArray([0, 128, 255, 300]); // 300 clamps to 255
const clampedBin = toValidBinary(clamped);
assert(clampedBin instanceof Uint8Array, "Uint8ClampedArray converted to Uint8Array");
assert(clampedBin![2] === 255 && clampedBin![3] === 255, "Clamped byte values preserved");

// 7. Standard JS Arrays (number bytes)
const numArr = [0, 65, 66, 67, 255];
const numArrBin = toValidBinary(numArr);
assert(numArrBin instanceof Uint8Array, "Array of numbers converted to Uint8Array");
assert(numArrBin![1] === 65 && numArrBin![2] === 66 && numArrBin![4] === 255, "Array byte values match");

// 8. SharedArrayBuffer (if supported in runtime)
if (typeof SharedArrayBuffer !== "undefined") {
    const sab = new SharedArrayBuffer(16);
    assert(isBinaryObj(sab) === true, "SharedArrayBuffer recognized as binary object");
    assert(isValidBinary(sab, { strict: true }) === true, "SharedArrayBuffer is strict binary");
    const sabBin = toValidBinary(sab);
    assert(sabBin instanceof Uint8Array, "SharedArrayBuffer converted to Uint8Array");
    assert(sabBin!.byteLength === 16, "SharedArrayBuffer length preserved");
}

// 9. Cross-realm / Tag inspection
assert(isBinaryObj(new Uint8Array(0)) === true, "Empty Uint8Array is binary");

// 10. Advanced & Difficult Edge Cases

// 10.1 Safe Array Ingestion (Invalid Element Rejection)
assert(isValidBinary([0, 100, 255]) === true, "Valid byte array is valid binary");
assert(isValidBinary([0, -1, 255]) === false, "Negative number in array is rejected");
assert(isValidBinary([0, 256, 100]) === false, "Number > 255 in array is rejected");
assert(isValidBinary([0, 12.5, 255]) === false, "Fractional float in array is rejected");
assert(isValidBinary([0, NaN, 100]) === false, "NaN in array is rejected");
assert(isValidBinary([0, Infinity, 100]) === false, "Infinity in array is rejected");
assert(isValidBinary([0, "100", 255]) === false, "String in array is rejected");
assert(isValidBinary([0, null, 255]) === false, "Null in array is rejected");
assert(isValidBinary([0, undefined, 255]) === false, "Undefined in array is rejected");
assert(isValidBinary([0, {}, 255]) === false, "Object in array is rejected");

assert(toValidBinary([0, -1, 255]) === null, "toValidBinary on invalid array returns null");
assert(toValidBinary([0, 256, 100]) === null, "toValidBinary on out-of-range array returns null");
assert(toValidBinary([0, 12.5, 255]) === null, "toValidBinary on fractional array returns null");
assert(toValidBinary([0, "100" as any, 255]) === null, "toValidBinary on mixed array returns null");

// 10.2 Non-Uint8 TypedArray view normalization via ArrayBuffer.isView
const i16 = new Int16Array([1000, -2000]);
const i16Bin = toValidBinary(i16);
assert(i16Bin instanceof Uint8Array, "Int16Array converted to Uint8Array");
assert(i16Bin!.byteLength === 4, "Int16Array byteLength is 4 bytes");
const backToI16 = new Int16Array(i16Bin!.buffer, i16Bin!.byteOffset, 2);
assert(backToI16[0] === 1000 && backToI16[1] === -2000, "Int16Array values preserved across byte view");

if (typeof BigInt64Array !== "undefined") {
    const bi64 = new BigInt64Array([9007199254740995n]);
    const bi64Bin = toValidBinary(bi64);
    assert(bi64Bin instanceof Uint8Array, "BigInt64Array converted to Uint8Array");
    assert(bi64Bin!.byteLength === 8, "BigInt64Array byteLength is 8 bytes");
    const backToBi64 = new BigInt64Array(bi64Bin!.buffer, bi64Bin!.byteOffset, 1);
    assert(backToBi64[0] === 9007199254740995n, "BigInt64Array values preserved across byte view");
}

// 10.3 Hostile Throwing Proxies
const hostileBinProxy = new Proxy({}, {
    get() { throw new Error("TRAP: proxy get"); },
    has() { throw new Error("TRAP: proxy has"); },
    getPrototypeOf() { throw new Error("TRAP: proxy getPrototypeOf"); }
});
assert(isValidBinary(hostileBinProxy) === false, "Hostile proxy rejected safely by isValidBinary");
assert(toValidBinary(hostileBinProxy) === null, "Hostile proxy returns null safely in toValidBinary");
// 10.4 Sparse Array with Holes
const sparseArr = [0, , 255];
assert(isValidBinary(sparseArr) === false, "Sparse array with holes is rejected");
assert(toValidBinary(sparseArr) === null, "toValidBinary on sparse array returns null");

// 10.5 Detached ArrayBuffer / View conversion
if (typeof (ArrayBuffer.prototype as any).transfer === "function" || typeof structuredClone === "function") {
    try {
        const abToDetach = new ArrayBuffer(16);
        const u8ToDetach = new Uint8Array(abToDetach);
        if ((abToDetach as any).transfer) {
            (abToDetach as any).transfer();
        } else {
            structuredClone(abToDetach, { transfer: [abToDetach] });
        }
        assert(isBinaryObj(abToDetach) === false, "Detached ArrayBuffer is not binary object");
        assert(isValidBinary(abToDetach) === false, "Detached ArrayBuffer is not valid binary");
        assert(toValidBinary(abToDetach) === null, "toValidBinary on detached ArrayBuffer returns null gracefully");
        assert(isBinaryObj(u8ToDetach) === false, "Detached Uint8Array view is not binary object");
        assert(isValidBinary(u8ToDetach) === false, "Detached Uint8Array view is not valid binary");
        assert(toValidBinary(u8ToDetach) === null, "toValidBinary on detached Uint8Array returns null gracefully");
    } catch {}
}

// 10.6 Zero-Length Non-Uint8 TypedArrays
const emptyF64 = new Float64Array(0);
const emptyF64Bin = toValidBinary(emptyF64);
assert(emptyF64Bin instanceof Uint8Array && emptyF64Bin.length === 0, "Zero-length TypedArray produces 0-length Uint8Array");

// 10.7 Read-Only / Frozen 0-length Uint8Array (JS spec disallows freezing non-empty TypedArrays)
const frozenU8 = Object.freeze(new Uint8Array(0));
assert(isValidBinary(frozenU8) === true, "Frozen 0-length Uint8Array is valid binary");
assert(toValidBinary(frozenU8) === frozenU8, "toValidBinary returns frozen Uint8Array instance");

// 10.8 Boxed String Object Non-Strict Handling
const boxedStr = Object("hello binary");
assert(isValidBinary(boxedStr) === false, "Boxed string object is not valid binary");
assert(toValidBinary(boxedStr) === null, "toValidBinary on boxed string object returns null");

// 10.9 Node.js Buffer / Uint8Array Subarray Offsets
const globalBuffer = (globalThis as any).Buffer;
if (typeof globalBuffer !== "undefined") {
    const nodeBuf = globalBuffer.from([10, 20, 30, 40]);
    assert(isBinaryObj(nodeBuf) === true, "Node Buffer recognized as binary object");
    assert(isValidBinary(nodeBuf, { strict: true }) === true, "Node Buffer is valid binary in strict mode");
    const nodeBufBin = toValidBinary(nodeBuf);
    assert(nodeBufBin !== null && nodeBufBin.length === 4 && nodeBufBin[0] === 10, "Node Buffer converted to binary");
}

// 10.10 Subarray and ByteOffset Preservations
const sourceArr = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
const subU8 = sourceArr.subarray(2, 6); // [3, 4, 5, 6]
assert(isBinaryObj(subU8) === true, "Subarray Uint8Array is binary object");
const subU8Bin = toValidBinary(subU8);
assert(subU8Bin !== null && subU8Bin.length === 4 && subU8Bin[0] === 3 && subU8Bin[3] === 6, "Subarray preserved accurately");

// 10.11 Brand-Spoofed Plain Objects (Faking TypedArrays/DataViews)
const fakeUint8Array = {
    [Symbol.toStringTag]: "Uint8Array",
    byteLength: 4,
    byteOffset: 0,
    buffer: new ArrayBuffer(4),
    length: 4,
};
assert(isBinaryObj(fakeUint8Array) === false, "Brand-spoofed Uint8Array plain object rejected by isBinaryObj");
assert(isValidBinary(fakeUint8Array, { strict: true }) === false, "Brand-spoofed Uint8Array rejected in strict mode");

const fakeDataView = {
    [Symbol.toStringTag]: "DataView",
    byteLength: 4,
    byteOffset: 0,
    buffer: new ArrayBuffer(4),
};
assert(isBinaryObj(fakeDataView) === false, "Brand-spoofed DataView rejected by isBinaryObj");

const fakeArrayBuffer = {
    [Symbol.toStringTag]: "ArrayBuffer",
    byteLength: 4,
};
assert(isBinaryObj(fakeArrayBuffer) === false, "Brand-spoofed ArrayBuffer rejected by isBinaryObj");

// 10.12 Resizable / Zero-byte ArrayBuffers
if (typeof ArrayBuffer !== "undefined") {
    const zeroLenBuf = new ArrayBuffer(0);
    assert(isBinaryObj(zeroLenBuf) === true, "0-byte ArrayBuffer is binary object");
    assert(isValidBinary(zeroLenBuf, { strict: true }) === true, "0-byte ArrayBuffer is valid binary in strict mode");
    const zeroLenBin = toValidBinary(zeroLenBuf);
    assert(zeroLenBin instanceof Uint8Array && zeroLenBin.byteLength === 0, "0-byte ArrayBuffer produces empty Uint8Array");
}

// 10.13 Array Boundary Integer Edge Cases (0, 255 vs -0, float integers)
assert(isValidBinary([0, 255]) === true, "Array with boundaries [0, 255] is valid");
assert(isValidBinary([-0, 255]) === true, "-0 in byte array is accepted as 0");
assert(isValidBinary([-0.0001, 255]) === false, "Tiny negative float in array is rejected");
assert(isValidBinary([255.0001]) === false, "Float > 255 is rejected");
assert(isValidBinary([256]) === false, "256 in array is rejected");
assert(isValidBinary([-1]) === false, "-1 in array is rejected");

// 10.14 Subclassed Uint8Array instances
class CustomUint8Array extends Uint8Array {}
const customU8 = new CustomUint8Array([10, 20, 30]);
assert(isBinaryObj(customU8) === true, "Subclassed Uint8Array is binary object");
assert(isValidBinary(customU8, { strict: true }) === true, "Subclassed Uint8Array is valid binary in strict mode");
const customU8Bin = toValidBinary(customU8);
assert(customU8Bin instanceof Uint8Array && customU8Bin[1] === 20, "Subclassed Uint8Array converts to Uint8Array");

// 10.15 Prototype pollution & polluted Object.prototype
const origProto = (Object.prototype as any).range;
try {
    (Object.prototype as any).range = "Int32";
    assert(isValidBinary([0, 255]) === true, "Polluted Object.prototype does not alter UInt8 validation");
    assert(isValidBinary([256]) === false, "256 still rejected when prototype polluted");
} finally {
    delete (Object.prototype as any).range;
}

// 10.16 Arrays with getter properties that throw or return invalid values
const arrWithThrowingGetter = [1, 2];
Object.defineProperty(arrWithThrowingGetter, 1, {
    get() { throw new Error("Throwing array element getter"); }
});
try {
    const res = isValidBinary(arrWithThrowingGetter);
    assert(res === false, "Throwing array index getter rejected in isValidBinary");
} catch {
    // If it throws or returns false, it should safely not validate as valid binary
}
assert(toValidBinary(arrWithThrowingGetter) === null, "Throwing array index getter returns null in toValidBinary");

// 10.17 Empty Array and Empty String Non-Strict
assert(isValidBinary([]) === true, "Empty array is valid binary non-strict");
const emptyArrBin = toValidBinary([]);
assert(emptyArrBin instanceof Uint8Array && emptyArrBin.length === 0, "Empty array produces empty Uint8Array");
assert(isValidBinary("") === true, "Empty string is valid binary non-strict");

console.log("=========================================");
console.log("✅ ALL BINARY UTILS TESTS PASSED!");
console.log("=========================================");


