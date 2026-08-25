declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StringExpr.contains tests...");


const df = $df.data([
    { phrase: "DFScript is awesome!" },
    { phrase: "Hello world!" },
    { phrase: null }
]);

const res = df.select([
    $df.col("phrase").str.contains("awesome").alias("c_str"),
    $df.col("phrase").str.contains(/is/i).alias("c_regex"),
    $df.col("phrase").str.contains("missing").alias("c_missing")
]).toDicts() as any[];

if (res[0].c_str !== true || res[0].c_regex !== true) throw new Error("contains row 0 failed");
if (res[1].c_str !== false || res[1].c_missing !== false) throw new Error("contains row 1 failed");
if (res[2].c_str !== null) throw new Error("contains null failed");


console.log("✓ StringExpr.contains tests passed!");
