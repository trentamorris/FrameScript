declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.asinh tests...");


const df = $df.data([{ val: -5.5 }, { val: 4.88 }, { val: null }]);
const res = df.select([$df.col("val").asinh().alias("a")]).toDicts() as any[];
if (Math.abs(res[0].a - Math.asinh(-5.5)) > 1e-6 || Math.abs(res[1].a - Math.asinh(4.88)) > 1e-6 || res[2].a !== null) throw new Error("asinh failed");


console.log("✓ StandardExpr.asinh tests passed!");
