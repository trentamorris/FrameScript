declare const process: any;
import { computeBy } from "../../../src/utils/array";

try {
    const pairs: [string, number][] = [
        ["Alice", 30],
        ["Bob", 25],
        ["Charlie", 35]
    ];
    const minTarget = computeBy(pairs, "minIdx");
    if (minTarget !== "Bob") throw new Error(`Expected min by target 'Bob', got ${minTarget}`);

    const maxTarget = computeBy(pairs, "maxIdx");
    if (maxTarget !== "Charlie") throw new Error(`Expected max by target 'Charlie', got ${maxTarget}`);

    if (computeBy([], "minIdx") !== null) throw new Error("Empty pairs should return null");

    console.log("✓ computeBy tests passed!");
} catch (err: any) {
    console.error(`❌ computeBy test failed: ${err.message}`);
    process.exit(1);
}
