declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StringExpr.zfill tests...");


const df = $df.data([
    { digits: "42" },
    { digits: null }
]);

const res = df.select([$df.col("digits").str.zfill(4).alias("z")]).toDicts() as any[];
if (res[0].z !== "0042") throw new Error("zfill failed");
if (res[1].z !== null) throw new Error("zfill null failed");


console.log("✓ StringExpr.zfill tests passed!");
