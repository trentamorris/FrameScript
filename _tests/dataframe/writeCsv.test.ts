import { DataFrame } from "../../src/dataframe";

console.log("Running writeCsv tests...");

const df = new DataFrame([
    { name: "Alice", score: 95 },
    { name: "Bob", score: 80 }
]);

// 1. Basic CSV string output
const csvStr = df.writeCsv();
if (!csvStr.includes("name,score") || !csvStr.includes("Alice,95") || !csvStr.includes("Bob,80")) {
    throw new Error("Basic writeCsv output mismatch");
}

// 2. Custom separator / delimiter
const tsvStr = df.writeCsv(undefined, { separator: "\t" });
if (!tsvStr.includes("name\tscore") || !tsvStr.includes("Alice\t95")) {
    throw new Error("TSV separator output mismatch");
}

// 3. Header toggle (includeHeader: false)
const noHeaderStr = df.writeCsv(undefined, { includeHeader: false });
if (noHeaderStr.includes("name,score")) {
    throw new Error("includeHeader false should omit column names");
}

console.log("✓ writeCsv tests passed!");
