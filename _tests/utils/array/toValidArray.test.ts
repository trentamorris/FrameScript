declare const process: any;
import { toValidArray } from "../../../src/utils/array";

try {
    const arrNull = toValidArray(null);
    if (!Array.isArray(arrNull) || arrNull.length !== 0) throw new Error("null failed");
    const arrUndef = toValidArray(undefined);
    if (!Array.isArray(arrUndef) || arrUndef.length !== 0) throw new Error("undefined failed");

    const inputArr = [1, 2, 3];
    const arrCopied = toValidArray(inputArr);
    if (arrCopied === inputArr) throw new Error("shallow copy failed");
    if (arrCopied.length !== 3 || arrCopied[0] !== 1 || arrCopied[1] !== 2 || arrCopied[2] !== 3) {
        throw new Error("copied elements mismatch");
    }

    const typedArr = new Int32Array([10, 20]);
    const arrFromTyped = toValidArray(typedArr as any);
    if (!Array.isArray(arrFromTyped) || arrFromTyped[0] !== 10 || arrFromTyped[1] !== 20) {
        throw new Error("typed array conversion failed");
    }

    const arrScalar = toValidArray(42);
    if (!Array.isArray(arrScalar) || arrScalar.length !== 1 || arrScalar[0] !== 42) {
        throw new Error("scalar wrapping failed");
    }
    console.log("✓ toValidArray tests passed!");
} catch (err: any) {
    console.error(`❌ toValidArray test failed: ${err.message}`);
    process.exit(1);
}
