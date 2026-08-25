declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.isIn tests...");


const df = $df.data([{ val: 10 }, { val: 25 }, { val: null }]);
const res = df.select([$df.col("val").isIn([10, 20, 30]).alias("i")]).toDicts() as any[];
if (res[0].i !== true || res[1].i !== false || res[2].i !== null) throw new Error("isIn failed");


console.log("✓ StandardExpr.isIn tests passed!");
