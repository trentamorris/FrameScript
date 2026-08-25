declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StringExpr.replace tests...");


const df = $df.data([
    { phrase: "DFScript is awesome!" },
    { phrase: null }
]);

const res = df.select([
    $df.col("phrase").str.replace("is", "was").alias("r1"),
    $df.col("phrase").str.replace(/IS/i, "was").alias("r2")
]).toDicts() as any[];

if (res[0].r1 !== "DFScript was awesome!" || res[0].r2 !== "DFScript was awesome!") throw new Error("replace failed");
if (res[1].r1 !== null) throw new Error("replace null failed");


console.log("✓ StringExpr.replace tests passed!");
