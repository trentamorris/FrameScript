import { DataFrame } from "../../src/dataframe";

console.log("Running vstack tests...");

const df1 = new DataFrame([
    { a: 1, b: "x" },
    { a: 2, b: "y" }
]);

const df2 = new DataFrame([
    { a: 3, b: "z" }
]);

// 1. Basic vstack
const res = df1.vstack(df2);
if (res.height !== 3) throw new Error("vstack height mismatch");
const rows = res.toDicts();
if (rows[0].a !== 1 || rows[2].a !== 3 || rows[2].b !== "z") {
    throw new Error("vstack values mismatch");
}

// 2. vstack array of DataFrames
const df3 = new DataFrame([{ a: 4, b: "w" }]);
const resMulti = df1.vstack([df2, df3]);
if (resMulti.height !== 4 || resMulti.toDicts()[3].a !== 4) {
    throw new Error("vstack multiple mismatch");
}

console.log("✓ vstack tests passed!");
