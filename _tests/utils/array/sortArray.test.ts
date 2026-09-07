declare const process: any;
import { sortArray } from "../../../src/utils/array";

try {
    const mixedTypes = ["banana", 10, true, "apple", 2, false];
    const sortedMixed = sortArray(mixedTypes);
    const expectedSorted = [false, true, 2, 10, "apple", "banana"];
    for (let i = 0; i < expectedSorted.length; i++) {
        if (sortedMixed[i] !== expectedSorted[i]) {
            throw new Error(`Expected sortedMixed[${i}] to be ${expectedSorted[i]}, got ${sortedMixed[i]}`);
        }
    }

    const sortedMixedDesc = sortArray(mixedTypes, { descending: true });
    const expectedSortedDesc = [true, false, 10, 2, "banana", "apple"];
    for (let i = 0; i < expectedSortedDesc.length; i++) {
        if (sortedMixedDesc[i] !== expectedSortedDesc[i]) {
            throw new Error(`Expected sortedMixedDesc[${i}] to be ${expectedSortedDesc[i]}, got ${sortedMixedDesc[i]}`);
        }
    }

    const withNulls = [3, null, 1, 2];
    const sortedNullsLast = sortArray(withNulls, { nullsLast: true });
    if (sortedNullsLast[3] !== null || sortedNullsLast[0] !== 1) {
        throw new Error("nullsLast: true failed");
    }

    console.log("✓ sortArray tests passed!");
} catch (err: any) {
    console.error(`❌ sortArray test failed: ${err.message}`);
    process.exit(1);
}
