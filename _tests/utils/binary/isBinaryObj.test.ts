declare const process: any;
import { isBinaryObj } from "../../../src/utils/binary";

try {
    if (!isBinaryObj(new Uint8Array(4))) throw new Error("Uint8Array should be binary object");
    if (!isBinaryObj(new Uint8ClampedArray(4))) throw new Error("Uint8ClampedArray should be binary object");
    if (!isBinaryObj(new ArrayBuffer(8))) throw new Error("ArrayBuffer should be binary object");
    if (!isBinaryObj(new DataView(new ArrayBuffer(8)))) throw new Error("DataView should not fail");

    if (typeof SharedArrayBuffer !== "undefined") {
        if (!isBinaryObj(new SharedArrayBuffer(8))) throw new Error("SharedArrayBuffer should be binary object");
    }

    if (isBinaryObj(null)) throw new Error("null is not binary obj");
    if (isBinaryObj(undefined)) throw new Error("undefined is not binary obj");
    if (isBinaryObj("hello")) throw new Error("string is not binary obj");
    if (isBinaryObj([1, 2, 3])) throw new Error("array is not binary obj");
    if (isBinaryObj(new Float32Array(4))) throw new Error("Float32Array is not Uint8Array binary obj");
    if (isBinaryObj(new Int32Array(4))) throw new Error("Int32Array is not Uint8Array binary obj");
    if (isBinaryObj({})) throw new Error("Plain object is not binary obj");

    console.log("✓ isBinaryObj tests passed!");
} catch (err: any) {
    console.error(`❌ isBinaryObj test failed: ${err.message}`);
    process.exit(1);
}
