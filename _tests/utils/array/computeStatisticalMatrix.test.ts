declare const process: any;
import { computeStatisticalMatrix } from "../../../src/utils/array";

try {
    const pairs: [number, number][] = [
        [1, 2],
        [2, 4],
        [3, 6],
        [4, 8],
        [5, 10]
    ];
    const stats = computeStatisticalMatrix(pairs);
    if (!stats || stats.correlation === null || Math.abs(stats.correlation - 1) > 1e-6) {
        throw new Error("Pearson correlation calculation failed: " + JSON.stringify(stats));
    }
    if (stats.covariance === null || stats.covariance <= 0) {
        throw new Error("Covariance calculation failed: " + JSON.stringify(stats));
    }

    const singlePair: [number, number][] = [[1, 2]];
    const singleStats = computeStatisticalMatrix(singlePair);
    if (!singleStats || singleStats.correlation !== null || singleStats.covariance !== null) {
        throw new Error("Single pair should yield null stats");
    }

    console.log("✓ computeStatisticalMatrix tests passed!");
} catch (err: any) {
    console.error(`❌ computeStatisticalMatrix test failed: ${err.message}`);
    process.exit(1);
}
