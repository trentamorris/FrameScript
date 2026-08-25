declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.acos tests...");


const df = $df.data([{ val: 1 }, { val: 2.718 }, { val: null }]);
const res = df.select([$df.col("val").acos().alias("a")]).toDicts() as any[];
if (res[0].a !== 0 || res[1].a !== null || res[2].a !== null) throw new Error("acos failed");


console.log("✓ StandardExpr.acos tests passed!");
