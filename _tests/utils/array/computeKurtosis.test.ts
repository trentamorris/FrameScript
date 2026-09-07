declare const process: any;
import { computeKurtosis } from "../../../src/utils/array";

try {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const kurt = computeKurtosis(data);
    if (kurt === null) throw new Error("Kurtosis calculation failed");

    // With bias: false, count < 4 returns null
    const shortData = [1, 2];
    if (computeKurtosis(shortData, { bias: false }) !== null) throw new Error("Too few data points should return null with bias: false");

    console.log("✓ computeKurtosis tests passed!");
} catch (err: any) {
    console.error(`❌ computeKurtosis test failed: ${err.message}`);
    process.exit(1);
}
