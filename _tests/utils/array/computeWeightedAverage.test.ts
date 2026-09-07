declare const process: any;
import { computeWeightedAverage } from "../../../src/utils/array";

try {
    const pairs: [number, number][] = [
        [10, 1],
        [20, 2],
        [30, 1]
    ];
    // (10*1 + 20*2 + 30*1) / (1 + 2 + 1) = (10 + 40 + 30) / 4 = 80 / 4 = 20
    const wAvg = computeWeightedAverage(pairs);
    if (wAvg !== 20) throw new Error(`Expected weighted average 20, got ${wAvg}`);

    if (computeWeightedAverage([]) !== null) throw new Error("Empty array should return null");

    console.log("✓ computeWeightedAverage tests passed!");
} catch (err: any) {
    console.error(`❌ computeWeightedAverage test failed: ${err.message}`);
    process.exit(1);
}
