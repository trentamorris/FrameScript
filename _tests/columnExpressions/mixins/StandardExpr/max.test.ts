declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.max tests...");


const df = $df.data([{ val: 10 }, { val: 50 }, { val: 20 }]);
const res = df.select([$df.col("val").max().alias("m")]).toDicts() as any[];
if (res[0].m !== 50) throw new Error("max failed");


console.log("✓ StandardExpr.max tests passed!");
