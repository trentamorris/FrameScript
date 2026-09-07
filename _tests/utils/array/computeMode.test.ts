declare const process: any;
import { computeMode } from "../../../src/utils/array";

try {
    const modesWithNaN = computeMode([NaN, 5, 5, NaN, NaN, 2, 2]);
    if (!modesWithNaN || modesWithNaN.length !== 2 || modesWithNaN[0] !== 2 || modesWithNaN[1] !== 5) {
        throw new Error(`Expected modes to be [2, 5], got ${JSON.stringify(modesWithNaN)}`);
    }

    const singleMode = computeMode([1, 2, 2, 3]);
    if (!singleMode || singleMode.length !== 1 || singleMode[0] !== 2) {
        throw new Error("Single mode failed");
    }

    const emptyMode = computeMode([]);
    if (emptyMode !== null) throw new Error("Empty array mode should return null");

    console.log("✓ computeMode tests passed!");
} catch (err: any) {
    console.error(`❌ computeMode test failed: ${err.message}`);
    process.exit(1);
}
