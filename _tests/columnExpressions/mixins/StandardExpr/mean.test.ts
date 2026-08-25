declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.mean tests...");


const df = $df.data([{ val: 10 }, { val: 20 }, { val: 30 }]);
const res = df.select([$df.col("val").mean().alias("m")]).toDicts() as any[];
if (res[0].m !== 20) throw new Error("mean failed");


console.log("✓ StandardExpr.mean tests passed!");
