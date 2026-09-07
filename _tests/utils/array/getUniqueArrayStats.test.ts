declare const process: any;
import { getUniqueArrayStats } from "../../../src/utils/array";

try {
    const stats1 = getUniqueArrayStats([1, 2, 2, 3, 3, 3]);
    if (stats1.count !== 3) throw new Error("Expected count to be 3");
    if (stats1.values.length !== 3) throw new Error("Expected 3 unique values");
    if (!stats1.frequencies || stats1.frequencies.get(3) !== 3) throw new Error("Expected freq of 3 to be 3");

    const objA = { id: 1 };
    const objB = { id: 1 };
    const objC = { id: 2 };
    const stats2 = getUniqueArrayStats([objA, objB, objC], { strict: true });
    if (stats2.count !== 2) throw new Error("Expected strict count to be 2");

    console.log("✓ getUniqueArrayStats tests passed!");
} catch (err: any) {
    console.error(`❌ getUniqueArrayStats test failed: ${err.message}`);
    process.exit(1);
}
