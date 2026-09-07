declare const process: any;
import { isTypedArray } from "../../../src/utils/array";

try {
    if (!isTypedArray(new Uint8Array(2))) throw new Error("Uint8Array failed");
    if (!isTypedArray(new Int32Array(4))) throw new Error("Int32Array failed");
    if (!isTypedArray(new Float64Array(1))) throw new Error("Float64Array failed");
    if (!isTypedArray(new BigInt64Array(1))) throw new Error("BigInt64Array failed");

    if (isTypedArray([])) throw new Error("Array should not be typed array");
    if (isTypedArray(new DataView(new ArrayBuffer(8)))) throw new Error("DataView should not be typed array");
    if (isTypedArray(null)) throw new Error("null should not be typed array");
    if (isTypedArray(undefined)) throw new Error("undefined should not be typed array");
    if (isTypedArray(42)) throw new Error("scalar should not be typed array");
    if (isTypedArray({ length: 2 })) throw new Error("array-like object should not be typed array");

    console.log("✓ isTypedArray tests passed!");
} catch (err: any) {
    console.error(`❌ isTypedArray test failed: ${err.message}`);
    process.exit(1);
}
