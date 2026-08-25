declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.lead tests...");


const df = $df.data([{ val: 10 }, { val: 20 }, { val: 30 }]);
const res = df.select([$df.col("val").lead(1).alias("l")]).toDicts() as any[];
if (res[0].l !== 20 || res[1].l !== 30 || res[2].l !== null) throw new Error("lead failed");


console.log("✓ StandardExpr.lead tests passed!");
