declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running StructExpr.renameFields tests...");

const df = $df.data([
    { s: { a: 1, b: "foo" } },
    { s: { a: 2, b: "bar" } },
    { s: null },
    { s: { a: 3, b: "baz" } }
]);

const r3 = df.select([
    $df.col("s").struct.renameFields({ a: "a_new", b: "b_new" }).alias("renamed")
]).toDicts() as any[];

if (r3[0].renamed.a_new !== 1 || r3[0].renamed.b_new !== "foo" || "a" in r3[0].renamed) {
    throw new Error("r3 row 0 mismatch: " + JSON.stringify(r3[0]));
}
if (r3[2].renamed !== null) throw new Error("r3 row 2 mismatch");

console.log("✓ StructExpr.renameFields tests passed!");
