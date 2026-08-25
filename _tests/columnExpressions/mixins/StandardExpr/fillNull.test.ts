declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.fillNull tests...");

const df = $df.data([{ val: 10 }, { val: null }, { val: 30 }]);
const res = df.select([
    $df.col("val").fillNull({ value: 99 }).alias("f_val"),
    $df.col("val").fillNull({ strategy: "forward" }).alias("f_fwd"),
    $df.col("val").fillNull({ strategy: "backward" }).alias("f_bwd")
]).toDicts() as any[];

if (res[0].f_val !== 10 || res[1].f_val !== 99 || res[2].f_val !== 30) throw new Error("fillNull value failed");
if (res[1].f_fwd !== 10) throw new Error("fillNull forward failed");
if (res[1].f_bwd !== 30) throw new Error("fillNull backward failed");

console.log("✓ StandardExpr.fillNull tests passed!");
