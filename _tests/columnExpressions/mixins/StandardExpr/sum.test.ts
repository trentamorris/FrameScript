declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.sum tests...");


const df = $df.data([{ val: 10 }, { val: 20 }, { val: 30 }]);
const res = df.select([$df.col("val").sum().alias("s")]).toDicts() as any[];
if (res[0].s !== 60) throw new Error("sum failed: " + res[0].s);


console.log("✓ StandardExpr.sum tests passed!");
