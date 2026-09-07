declare const process: any;
import { computeQuantile } from "../../../src/utils/array";

try {
    const mixedNumericArray = ["10", true, 20, new Date(30000), false];
    const median = computeQuantile(mixedNumericArray, 0.5);
    if (median !== 10) throw new Error(`Expected median to be 10, got ${median}`);

    const q75 = computeQuantile(mixedNumericArray, 0.75);
    if (q75 !== 20) throw new Error(`Expected quantile 0.75 to be 20, got ${q75}`);

    const q0 = computeQuantile([1, 2, 3, 4, 5], 0);
    if (q0 !== 1) throw new Error(`Expected min quantile 0 to be 1, got ${q0}`);

    const q1 = computeQuantile([1, 2, 3, 4, 5], 1);
    if (q1 !== 5) throw new Error(`Expected max quantile 1 to be 5, got ${q1}`);

    console.log("✓ computeQuantile tests passed!");
} catch (err: any) {
    console.error(`❌ computeQuantile test failed: ${err.message}`);
    process.exit(1);
}
