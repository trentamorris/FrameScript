declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.std tests...");


const df = $df.data([{ val: 10 }, { val: 20 }, { val: 30 }]);
const res = df.select([$df.col("val").std().alias("s")]).toDicts() as any[];
if (Math.abs(res[0].s - 10) > 1e-6) throw new Error("std failed: " + res[0].s);


console.log("✓ StandardExpr.std tests passed!");
