declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running ArrayExpr.countMatches tests...");


const df = $df.data([
    { tags: ["apple", "banana", "apple", "cherry"] },
    { tags: [] },
    { tags: null }
]);

const res = df.select([
    $df.col("tags").arr.countMatches("apple").alias("apple_count"),
    $df.col("tags").arr.countMatches("pear").alias("pear_count")
]).toDicts() as any[];

if (res[0].apple_count !== 2) throw new Error("Expected apple_count 2");
if (res[0].pear_count !== 0) throw new Error("Expected pear_count 0");
if (res[1].apple_count !== 0) throw new Error("Expected 0 for empty array");
if (res[2].apple_count !== null) throw new Error("Expected null for null array");


console.log("✓ ArrayExpr.countMatches tests passed!");
