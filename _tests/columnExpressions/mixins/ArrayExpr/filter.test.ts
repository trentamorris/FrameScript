declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running ArrayExpr.filter tests...");


const df = $df.data([
    { numbers: [3, 1, 4, 1, 5, 9, null, 2] },
    { numbers: null }
]);

const res = df.select([
    $df.col("numbers").arr.filter($df.element().isNotNull()).alias("no_nulls"),
    $df.col("numbers").arr.filter($df.element().gt(3)).alias("gt_3")
]).toDicts() as any[];

if (res[0].no_nulls.length !== 7 || res[0].no_nulls.includes(null)) throw new Error("no_nulls failed");
if (res[0].gt_3.length !== 3 || res[0].gt_3[0] !== 4 || res[0].gt_3[1] !== 5 || res[0].gt_3[2] !== 9) throw new Error("gt_3 failed");
if (res[1].no_nulls !== null) throw new Error("null array failed");


console.log("✓ ArrayExpr.filter tests passed!");
