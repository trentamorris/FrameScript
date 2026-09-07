declare const process: any;
import { getArrayStats } from "../../../src/utils/array";

try {
    const statsWithNaN = getArrayStats([NaN, 5, 2, NaN, 8]);
    if (statsWithNaN.min !== 2) throw new Error(`Expected min 2, got ${statsWithNaN.min}`);
    if (statsWithNaN.max !== 8) throw new Error(`Expected max 8, got ${statsWithNaN.max}`);
    if (statsWithNaN.nullCount !== 2) throw new Error(`Expected nullCount 2, got ${statsWithNaN.nullCount}`);
    if (statsWithNaN.count !== 3) throw new Error(`Expected count 3, got ${statsWithNaN.count}`);
    if (statsWithNaN.sum !== 15) throw new Error(`Expected sum 15, got ${statsWithNaN.sum}`);
    if (!statsWithNaN.isNumeric) throw new Error(`Expected isNumeric true`);

    const statsWithInfinity = getArrayStats([Infinity, 5, 2, -Infinity]);
    if (statsWithInfinity.min !== -Infinity) throw new Error(`Expected min -Infinity, got ${statsWithInfinity.min}`);
    if (statsWithInfinity.max !== Infinity) throw new Error(`Expected max Infinity, got ${statsWithInfinity.max}`);
    if (statsWithInfinity.nullCount !== 0) throw new Error(`Expected nullCount 0, got ${statsWithInfinity.nullCount}`);
    if (statsWithInfinity.count !== 2) throw new Error(`Expected count 2, got ${statsWithInfinity.count}`);
    if (statsWithInfinity.sum !== 7) throw new Error(`Expected sum 7, got ${statsWithInfinity.sum}`);

    const emptyStats = getArrayStats([]);
    if (emptyStats.count !== 0 || emptyStats.min !== null || emptyStats.max !== null) {
        throw new Error("Empty array stats failed");
    }

    console.log("✓ getArrayStats tests passed!");
} catch (err: any) {
    console.error(`❌ getArrayStats test failed: ${err.message}`);
    process.exit(1);
}
