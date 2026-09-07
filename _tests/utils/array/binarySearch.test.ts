declare const process: any;
import { binarySearch } from "../../../src/utils/array";

try {
    const sorted = [10, 20, 30, 40, 50];
    if (binarySearch(sorted, 30) !== 2) throw new Error("binarySearch found 30 at index 2 failed");
    if (binarySearch(sorted, 10) !== 0) throw new Error("binarySearch found 10 at index 0 failed");
    if (binarySearch(sorted, 50) !== 4) throw new Error("binarySearch found 50 at index 4 failed");

    // Bisect returns the insertion point index (for 25 in [10, 20, 30, 40, 50], it's index 2)
    const insertIdx = binarySearch(sorted, 25);
    if (insertIdx !== 2) throw new Error("binarySearch insertion point for 25 failed: " + insertIdx);

    console.log("✓ binarySearch tests passed!");
} catch (err: any) {
    console.error(`❌ binarySearch test failed: ${err.message}`);
    process.exit(1);
}
