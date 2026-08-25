declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running ArrayExpr.contains tests...");


const df = $df.data([
    { tags: ["apple", "banana", "cherry"] },
    { tags: [] },
    { tags: null }
]);

const res = df.select([
    $df.col("tags").arr.contains("banana").alias("has_banana"),
    $df.col("tags").arr.contains("orange").alias("has_orange")
]).toDicts() as any[];

if (res[0].has_banana !== true) throw new Error("Expected has_banana true");
if (res[0].has_orange !== false) throw new Error("Expected has_orange false");
if (res[1].has_banana !== false) throw new Error("Expected false for empty array");
if (res[2].has_banana !== null) throw new Error("Expected null for null array");


console.log("✓ ArrayExpr.contains tests passed!");
