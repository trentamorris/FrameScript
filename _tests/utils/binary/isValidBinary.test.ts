declare const process: any;
import { isValidBinary } from "../../../src/utils/binary";

try {
    if (isValidBinary(null)) throw new Error("null is not binary");
    if (isValidBinary(undefined)) throw new Error("undefined is not binary");
    if (isValidBinary(123)) throw new Error("number is not binary");
    if (isValidBinary(true)) throw new Error("boolean is not binary");
    if (isValidBinary(100n)) throw new Error("bigint is not binary");
    if (isValidBinary(Symbol("bin"))) throw new Error("symbol is not binary");
    if (isValidBinary({})) throw new Error("plain object is not binary");

    // Strict mode
    if (!isValidBinary(new Uint8Array([1, 2]), { strict: true })) throw new Error("Uint8Array is strict binary");
    if (!isValidBinary(new Uint8ClampedArray([1, 2]), { strict: true })) throw new Error("Uint8ClampedArray is strict binary");
    if (!isValidBinary(new ArrayBuffer(8), { strict: true })) throw new Error("ArrayBuffer is strict binary");
    if (!isValidBinary(new DataView(new ArrayBuffer(8)), { strict: true })) throw new Error("DataView is strict binary");
    if (isValidBinary("hello", { strict: true })) throw new Error("string is not strict binary");
    if (isValidBinary([1, 2, 3], { strict: true })) throw new Error("array is not strict binary");
    if (isValidBinary(new Float64Array([1.1, 2.2]), { strict: true })) throw new Error("Float64Array is not strict binary");

    // Non-strict
    if (!isValidBinary("hello")) throw new Error("string should be valid binary non-strict");
    if (!isValidBinary([1, 2, 3])) throw new Error("uint8 number array should be valid binary");
    if (isValidBinary([1, 300])) throw new Error("array with value > 255 should not be valid binary");

    console.log("✓ isValidBinary tests passed!");
} catch (err: any) {
    console.error(`❌ isValidBinary test failed: ${err.message}`);
    process.exit(1);
}
