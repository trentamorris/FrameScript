declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.ne tests...");


const df = $df.data([{ a: 10, b: 10 }, { a: 10, b: 20 }, { a: null, b: null }]);
const res = df.select([$df.col("a").ne($df.col("b")).alias("n")]).toDicts() as any[];
if (res[0].n !== false || res[1].n !== true || res[2].n !== null) throw new Error("ne failed");


console.log("✓ StandardExpr.ne tests passed!");
