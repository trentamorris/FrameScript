import { DataFrame } from "../../src/dataframe";

console.log("Running hstack tests...");

const df1 = new DataFrame([
    { a: 1, b: "x" },
    { a: 2, b: "y" }
]);

const df2 = new DataFrame([
    { c: true, d: 100 },
    { c: false, d: 200 }
]);

// 1. Basic hstack
const res = df1.hstack(df2);
if (res.height !== 2) throw new Error("hstack height mismatch");
const cols = res.columns;
if (cols.length !== 4 || !cols.includes("a") || !cols.includes("c") || !cols.includes("d")) {
    throw new Error("hstack columns mismatch");
}
const rows = res.toDicts();
if (rows[0].a !== 1 || rows[0].c !== true || rows[0].d !== 100) {
    throw new Error("hstack row 0 mismatch");
}

// 2. hstack with array of DataFrames
const df3 = new DataFrame([{ e: "extra1" }, { e: "extra2" }]);
const resMulti = df1.hstack([df2, df3]);
if (resMulti.columns.length !== 5 || resMulti.height !== 2) {
    throw new Error("hstack multiple DataFrames mismatch");
}

console.log("✓ hstack tests passed!");
