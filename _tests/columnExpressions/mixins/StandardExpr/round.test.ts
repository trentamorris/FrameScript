declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.round tests...");


const df = $df.data([{ val: -5.5 }, { val: 4.88 }, { val: null }]);
const res = df.select([
    $df.col("val").round().alias("r0"),
    $df.col("val").round(1).alias("r1")
]).toDicts() as any[];
if (res[0].r0 !== -5 || res[0].r1 !== -5.5) throw new Error("round 0 failed");
if (res[1].r0 !== 5 || res[1].r1 !== 4.9) throw new Error("round 1 failed");
if (res[2].r0 !== null) throw new Error("round null failed");


console.log("✓ StandardExpr.round tests passed!");
