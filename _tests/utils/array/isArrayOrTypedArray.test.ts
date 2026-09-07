declare const process: any;
import { isArrayOrTypedArray } from "../../../src/utils/array";

try {
    if (!isArrayOrTypedArray([1, 2, 3])) throw new Error("Array failed");
    if (!isArrayOrTypedArray(new Uint8Array(4))) throw new Error("Uint8Array failed");
    if (!isArrayOrTypedArray(new Float32Array(2))) throw new Error("Float32Array failed");
    if (isArrayOrTypedArray(null)) throw new Error("null failed");
    if (isArrayOrTypedArray(undefined)) throw new Error("undefined failed");
    if (isArrayOrTypedArray({ length: 2 })) throw new Error("object failed");
    if (isArrayOrTypedArray("hello")) throw new Error("string failed");
    console.log("✓ isArrayOrTypedArray tests passed!");
} catch (err: any) {
    console.error(`❌ isArrayOrTypedArray test failed: ${err.message}`);
    process.exit(1);
}
