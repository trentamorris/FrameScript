declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StructExpr.field tests...");

const df = $df.data([
    { s: { a: 1, b: "foo" } },
    { s: { a: 2, b: "bar" } },
    { s: null },
    { s: { a: 3, b: "baz" } }
]);

// 1. Basic field extraction
const r1 = df.select([
    $df.col("s").struct.field("a").alias("a_val"),
    $df.col("s").struct.field("b").alias("b_val")
]).toDicts() as any[];

if (r1.length !== 4) throw new Error("r1 length mismatch");
if (r1[0].a_val !== 1 || r1[0].b_val !== "foo") throw new Error("r1 row 0 mismatch");
if (r1[1].a_val !== 2 || r1[1].b_val !== "bar") throw new Error("r1 row 1 mismatch");
if (r1[2].a_val !== null || r1[2].b_val !== null) throw new Error("r1 row 2 mismatch");
if (r1[3].a_val !== 3 || r1[3].b_val !== "baz") throw new Error("r1 row 3 mismatch");

// 2. Proxy dot/bracket accessor shorthand
const r2 = df.select([
    $df.col("s").struct.a.alias("a_val"),
    $df.col("s").struct["b"].alias("b_val")
]).toDicts() as any[];

if (r2[0].a_val !== 1 || r2[0].b_val !== "foo") throw new Error("r2 row 0 mismatch");
if (r2[2].a_val !== null || r2[2].b_val !== null) throw new Error("r2 row 2 mismatch");

console.log("✓ StructExpr.field tests passed!");
