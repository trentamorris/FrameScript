declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StandardExpr.lt tests...");


const df = $df.data([{ a: 10, b: 10 }, { a: 5, b: 10 }, { a: 15, b: 10 }]);
const res = df.select([$df.col("a").lt($df.col("b")).alias("l")]).toDicts() as any[];
if (res[0].l !== false || res[1].l !== true || res[2].l !== false) throw new Error("lt failed");


console.log("✓ StandardExpr.lt tests passed!");
