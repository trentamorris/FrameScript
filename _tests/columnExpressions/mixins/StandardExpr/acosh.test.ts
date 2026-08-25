declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.acosh tests...");


const df = $df.data([{ val: 1 }, { val: 2.718281828459045 }, { val: 0.5 }, { val: null }]);
const res = df.select([$df.col("val").acosh().alias("a")]).toDicts() as any[];
if (res[0].a !== 0 || Math.abs(res[1].a - 1.657454) > 1e-4 || res[2].a !== null || res[3].a !== null) throw new Error("acosh failed");


console.log("✓ StandardExpr.acosh tests passed!");
