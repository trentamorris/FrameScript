import { DataFrame } from "../../src/dataframe";
import { $df } from "../../src";

console.log("Running insertColumn tests...");

const df = new DataFrame([
    { a: 1, c: 3 },
    { a: 2, c: 4 }
]);

// 1. Insert scalar literal at index 1
const res = df.insertColumn(1, "b", $df.lit(99));
if (res.columns[0] !== "a" || res.columns[1] !== "b" || res.columns[2] !== "c") {
    throw new Error(`Columns order incorrect: ${JSON.stringify(res.columns)}`);
}
const rows = res.toDicts();
if (rows[0].b !== 99 || rows[1].b !== 99) {
    throw new Error("Inserted column values mismatch");
}

// 2. Insert scalar at index 0 (start)
const resStart = df.insertColumn(0, "first", $df.lit("tag"));
if (resStart.columns[0] !== "first" || resStart.columns[1] !== "a") {
    throw new Error("Insert at start mismatch");
}
if (resStart.toDicts()[0].first !== "tag") {
    throw new Error("Insert at start value mismatch");
}

// 3. Insert computed expression at end
const resEnd = df.insertColumn(2, "last", $df.col("a").add(100));
if (resEnd.columns[2] !== "last") {
    throw new Error("Insert at end mismatch");
}
if (resEnd.toDicts()[0].last !== 101 || resEnd.toDicts()[1].last !== 102) {
    throw new Error("Insert computed expression value mismatch");
}

console.log("✓ insertColumn tests passed!");
