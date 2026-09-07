declare const process: any;
import { computeCorrelationOfFlatArrays } from "../../../src/utils/array";

try {
    const a = [1, 2, 3, 4, 5];
    const b = [2, 4, 6, 8, 10];
    const corr = computeCorrelationOfFlatArrays(a, b, a.length);
    if (corr === null || Math.abs(corr - 1) > 1e-6) {
        throw new Error(`Expected correlation 1, got ${corr}`);
    }

    const inverseB = [10, 8, 6, 4, 2];
    const negCorr = computeCorrelationOfFlatArrays(a, inverseB, a.length);
    if (negCorr === null || Math.abs(negCorr - (-1)) > 1e-6) {
        throw new Error(`Expected correlation -1, got ${negCorr}`);
    }

    console.log("✓ computeCorrelationOfFlatArrays tests passed!");
} catch (err: any) {
    console.error(`❌ computeCorrelationOfFlatArrays test failed: ${err.message}`);
    process.exit(1);
}
