declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.min tests...");


const df = $df.data([{ val: 10 }, { val: 50 }, { val: 20 }]);
const res = df.select([$df.col("val").min().alias("m")]).toDicts() as any[];
if (res[0].m !== 10) throw new Error("min failed");


console.log("✓ StandardExpr.min tests passed!");
