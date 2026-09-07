declare const process: any;
import { computeDotProduct } from "../../../src/utils/array";

try {
    const pairs: [number, number][] = [
        [1, 4],
        [2, 5],
        [3, 6]
    ];
    const dot = computeDotProduct(pairs);
    // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    if (dot !== 32) throw new Error(`Expected dot product 32, got ${dot}`);

    if (computeDotProduct([]) !== null) throw new Error("Empty dot product should be null");

    console.log("✓ computeDotProduct tests passed!");
} catch (err: any) {
    console.error(`❌ computeDotProduct test failed: ${err.message}`);
    process.exit(1);
}
