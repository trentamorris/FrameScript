declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.lag tests...");


const df = $df.data([{ val: 10 }, { val: 20 }, { val: 30 }]);
const res = df.select([$df.col("val").lag(1).alias("l")]).toDicts() as any[];
if (res[0].l !== null || res[1].l !== 10 || res[2].l !== 20) throw new Error("lag failed");


console.log("✓ StandardExpr.lag tests passed!");
