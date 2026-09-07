declare const process: any;
import { toValidBinary } from "../../../src/utils/binary";

try {
    if (toValidBinary(null) !== null) throw new Error("toValidBinary(null) should be null");
    if (toValidBinary(undefined) !== null) throw new Error("toValidBinary(undefined) should be null");
    if (toValidBinary(123) !== null) throw new Error("toValidBinary(123) should be null");
    if (toValidBinary("hello", { strict: true }) !== null) throw new Error("strict string should be null");

    // String conversion
    const strBin = toValidBinary("Hello World 🚀");
    if (!(strBin instanceof Uint8Array)) throw new Error("string should convert to Uint8Array");
    if (new TextDecoder().decode(strBin) !== "Hello World 🚀") throw new Error("UTF-8 decode mismatch");

    // Empty string
    const emptyStrBin = toValidBinary("");
    if (!(emptyStrBin instanceof Uint8Array) || emptyStrBin.length !== 0) throw new Error("empty string conversion failed");

    // ArrayBuffer
    const buf = new ArrayBuffer(4);
    const abBin = toValidBinary(buf);
    if (!(abBin instanceof Uint8Array) || abBin.byteLength !== 4) throw new Error("ArrayBuffer conversion failed");

    // DataView with offset
    const subView = new DataView(buf, 1, 2);
    const dvBin = toValidBinary(subView);
    if (!(dvBin instanceof Uint8Array) || dvBin.byteLength !== 2) throw new Error("DataView conversion failed");

    // Clamped array
    const clamped = new Uint8ClampedArray([0, 128, 255, 300]);
    const clampedBin = toValidBinary(clamped);
    if (!(clampedBin instanceof Uint8Array) || clampedBin[3] !== 255) throw new Error("Uint8ClampedArray conversion failed");

    // Standard number array
    const numArr = [0, 65, 66, 255];
    const numBin = toValidBinary(numArr);
    if (!(numBin instanceof Uint8Array) || numBin[1] !== 65 || numBin[3] !== 255) throw new Error("number array conversion failed");

    console.log("✓ toValidBinary tests passed!");
} catch (err: any) {
    console.error(`❌ toValidBinary test failed: ${err.message}`);
    process.exit(1);
}
