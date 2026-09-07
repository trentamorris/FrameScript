declare const process: any;
import { computeEntropy } from "../../../src/utils/array";

try {
    const uniform = [1, 1, 1, 1];
    const ent0 = computeEntropy(uniform);
    if (ent0 === null || Math.abs(ent0) > 1e-6) {
        throw new Error(`Expected 0 entropy for uniform array, got ${ent0}`);
    }

    const diverse = [1, 2, 3, 4];
    const ent = computeEntropy(diverse);
    if (ent === null || ent <= 0) {
        throw new Error(`Expected positive entropy, got ${ent}`);
    }

    console.log("✓ computeEntropy tests passed!");
} catch (err: any) {
    console.error(`❌ computeEntropy test failed: ${err.message}`);
    process.exit(1);
}
