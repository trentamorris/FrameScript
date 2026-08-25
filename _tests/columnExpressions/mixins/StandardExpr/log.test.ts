declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.log tests...");


const df = $df.data([{ val: 10 }, { val: -5 }, { val: null }]);
const res = df.select([
    $df.col("val").log().alias("ln"),
    $df.col("val").log(10).alias("l10"),
    $df.col("val").log(2).alias("l2")
]).toDicts() as any[];
if (Math.abs(res[0].ln - Math.log(10)) > 1e-6 || Math.abs(res[0].l10 - 1) > 1e-6 || Math.abs(res[0].l2 - Math.log2(10)) > 1e-6) throw new Error("log failed");
if (res[1].ln !== null || res[2].ln !== null) throw new Error("log null/neg failed");


console.log("✓ StandardExpr.log tests passed!");
