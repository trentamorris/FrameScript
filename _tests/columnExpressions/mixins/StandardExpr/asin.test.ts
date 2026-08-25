declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.asin tests...");


const df = $df.data([{ val: 1 }, { val: 2.718 }, { val: null }]);
const res = df.select([$df.col("val").asin().alias("a")]).toDicts() as any[];
if (Math.abs(res[0].a - Math.PI / 2) > 1e-6 || res[1].a !== null || res[2].a !== null) throw new Error("asin failed");


console.log("✓ StandardExpr.asin tests passed!");
