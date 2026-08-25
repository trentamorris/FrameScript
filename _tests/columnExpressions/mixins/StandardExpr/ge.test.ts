declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.ge tests...");


const df = $df.data([{ a: 10, b: 10 }, { a: 15, b: 10 }, { a: 5, b: 10 }]);
const res = df.select([$df.col("a").ge($df.col("b")).alias("g")]).toDicts() as any[];
if (res[0].g !== true || res[1].g !== true || res[2].g !== false) throw new Error("ge failed");


console.log("✓ StandardExpr.ge tests passed!");
