declare const process: any;
import { computeSpearmanCorrelation } from "../../../src/utils/array";

try {
    const pairs: [number, number][] = [
        [10, 2],
        [20, 4],
        [30, 6],
        [40, 8],
        [50, 10]
    ];
    const rho = computeSpearmanCorrelation(pairs);
    if (rho === null || Math.abs(rho - 1) > 1e-6) {
        throw new Error(`Expected Spearman rho 1, got ${rho}`);
    }

    const negPairs: [number, number][] = [
        [10, 50],
        [20, 40],
        [30, 30],
        [40, 20],
        [50, 10]
    ];
    const negRho = computeSpearmanCorrelation(negPairs);
    if (negRho === null || Math.abs(negRho - (-1)) > 1e-6) {
        throw new Error(`Expected Spearman rho -1, got ${negRho}`);
    }

    console.log("✓ computeSpearmanCorrelation tests passed!");
} catch (err: any) {
    console.error(`❌ computeSpearmanCorrelation test failed: ${err.message}`);
    process.exit(1);
}
