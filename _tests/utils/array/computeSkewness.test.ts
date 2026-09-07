declare const process: any;
import { computeSkewness } from "../../../src/utils/array";

try {
    const symmetric = [1, 2, 3, 4, 5];
    const skew = computeSkewness(symmetric);
    if (skew === null || Math.abs(skew) > 1e-6) {
        throw new Error(`Expected symmetric skewness ~0, got ${skew}`);
    }

    const rightSkewed = [1, 2, 2, 3, 10];
    const rSkew = computeSkewness(rightSkewed);
    if (rSkew === null || rSkew <= 0) {
        throw new Error(`Expected positive skewness, got ${rSkew}`);
    }

    console.log("✓ computeSkewness tests passed!");
} catch (err: any) {
    console.error(`❌ computeSkewness test failed: ${err.message}`);
    process.exit(1);
}
