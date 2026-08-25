declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.atan2 tests...");


const df = $df.data([{ y: 3, x: 10 }, { y: 5, x: -20 }, { y: null, x: 10 }]);
const res = df.select([$df.col("y").atan2($df.col("x")).alias("a")]).toDicts() as any[];
if (Math.abs(res[0].a - Math.atan2(3, 10)) > 1e-6 || Math.abs(res[1].a - Math.atan2(5, -20)) > 1e-6 || res[2].a !== null) throw new Error("atan2 failed");


console.log("✓ StandardExpr.atan2 tests passed!");
