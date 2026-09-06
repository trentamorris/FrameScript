declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StructExpr.unnest tests...");

const df = $df.data([
    { s: { a: 1, b: "foo" } },
    { s: { a: 2, b: "bar" } },
    { s: null },
    { s: { a: 3, b: "baz" } }
]);

// 1. unnest() with explicit schema
const schema = {
    s: $df.Struct({
        a: $df.Int32,
        b: $df.Utf8
    })
};
const dfWithSchema = $df.data([
    { s: { a: 1, b: "foo" } },
    { s: { a: 2, b: "bar" } },
    { s: null },
    { s: { a: 3, b: "baz" } }
], schema);

const r6 = dfWithSchema.select([
    $df.col("s").struct.unnest()
]).toDicts() as any[];

if (r6.length !== 4) throw new Error("r6 length mismatch");
if (r6[0].a !== 1 || r6[0].b !== "foo" || "s" in r6[0]) throw new Error("r6 row 0 mismatch");
if (r6[2].a !== null || r6[2].b !== null) throw new Error("r6 row 2 mismatch");

// 2. unnest() without schema (dynamically resolved)
const r7 = df.select([
    $df.col("s").struct.unnest()
]).toDicts() as any[];

if (r7.length !== 4) throw new Error("r7 length mismatch");
if (r7[0].a !== 1 || r7[0].b !== "foo" || "s" in r7[0]) throw new Error("r7 row 0 mismatch");
if (r7[2].a !== null || r7[2].b !== null) throw new Error("r7 row 2 mismatch");

// 3. unnest() inside withColumns
const r8 = df.withColumns([
    $df.col("s").struct.unnest()
]).toDicts() as any[];

if (r8.length !== 4) throw new Error("r8 length mismatch");
if (r8[0].a !== 1 || r8[0].b !== "foo" || !("s" in r8[0])) {
    throw new Error("r8 unnest withColumns failed: " + JSON.stringify(r8[0]));
}

console.log("✓ StructExpr.unnest tests passed!");
