declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.atanh tests...");


const df = $df.data([{ val: 0.5 }, { val: -0.5 }, { val: 2 }, { val: null }]);
const res = df.select([$df.col("val").atanh().alias("a")]).toDicts() as any[];
if (Math.abs(res[0].a - Math.atanh(0.5)) > 1e-6 || Math.abs(res[1].a - Math.atanh(-0.5)) > 1e-6 || res[2].a !== null || res[3].a !== null) throw new Error("atanh failed");


console.log("✓ StandardExpr.atanh tests passed!");
