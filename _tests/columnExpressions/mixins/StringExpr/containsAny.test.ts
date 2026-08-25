declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StringExpr.containsAny tests...");


const df = $df.data([
    { phrase: "DFScript is awesome!" },
    { phrase: "Hello world!" },
    { phrase: null }
]);

const res = df.select([
    $df.col("phrase").str.containsAny(["missing", "awesome"]).alias("c_any"),
    $df.col("phrase").str.containsAny(["foo", "bar"]).alias("c_none")
]).toDicts() as any[];

if (res[0].c_any !== true || res[0].c_none !== false) throw new Error("containsAny row 0 failed");
if (res[1].c_any !== false) throw new Error("containsAny row 1 failed");
if (res[2].c_any !== null) throw new Error("containsAny null failed");


console.log("✓ StringExpr.containsAny tests passed!");
