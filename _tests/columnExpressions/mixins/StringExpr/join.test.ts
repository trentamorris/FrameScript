declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StringExpr.join tests...");


const df = $df.data({
    tags: [["a", "b", "c"], ["x", "y"], [], ["foo", null, "bar"], null]
});

const res = df.select([
    $df.col("tags").str.join("-").alias("dash"),
    $df.col("tags").str.join().alias("def"),
    $df.col("tags").str.join("-", { ignoreNulls: true }).alias("ign_null")
]).toDicts() as any[];

if (res[0].dash !== "a-b-c" || res[0].def !== "abc") throw new Error("join row 0 failed");
if (res[1].dash !== "x-y") throw new Error("join row 1 failed");
if (res[2].dash !== "") throw new Error("join empty failed");
if (res[3].ign_null !== "foo-bar") throw new Error("join ignore nulls failed");
if (res[4].dash !== null) throw new Error("join null failed");


console.log("✓ StringExpr.join tests passed!");
