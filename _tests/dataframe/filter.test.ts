import { DataFrame } from "../../src/dataframe";
import { $df } from "../../src/api";

console.log("Running filter tests...");

const df = new DataFrame([
    { name: "Alice", age: 30 },
    { name: "Bob", age: 20 },
    { name: "Charlie", age: 25 }
]);

// Filter using raw predicate function
const dfFiltered1 = df.filter(row => row.age >= 25);
if (dfFiltered1.height !== 2) throw new Error("Filter by predicate height mismatch");

// Filter using expression
const dfFiltered2 = df.filter($df.col("age").ge(25));
if (dfFiltered2.height !== 2) throw new Error("Filter by expression height mismatch");
const collected = dfFiltered2.toDicts();
if (collected[0].name !== "Alice" || collected[1].name !== "Charlie") {
    throw new Error("Filtered values mismatch");
}

// 3. Combined multiple expressions (AND behavior via multiple args)
const dfMultipleExprs = df.filter(
    $df.col("age").ge(25),
    $df.col("name").eq("Alice")
);
if (dfMultipleExprs.height !== 1 || dfMultipleExprs.toDicts()[0].name !== "Alice") {
    throw new Error("Combined multiple expressions filter failed");
}

// 4. Logical .and() expression
const dfAndExpr = df.filter(
    $df.col("age").ge(25).and($df.col("name").eq("Alice"))
);
if (dfAndExpr.height !== 1 || dfAndExpr.toDicts()[0].name !== "Alice") {
    throw new Error(".and() expression filter failed");
}

// 5. Logical .or() expression
const dfOrExpr = df.filter(
    $df.col("name").eq("Alice").or($df.col("name").eq("Bob"))
);
if (dfOrExpr.height !== 2) {
    throw new Error(".or() expression filter failed");
}

// 6. Combined expression + callback function
const dfCombined = df.filter(
    $df.col("age").gt(20),
    (row: any) => row.name.startsWith("C")
);
if (dfCombined.height !== 1 || dfCombined.toDicts()[0].name !== "Charlie") {
    throw new Error("Combined expression and predicate function failed");
}

// 5. Edge Case: Filter matches no rows (height 0 result)
const dfNone = df.filter($df.col("age").gt(100));
if (dfNone.height !== 0 || dfNone.width !== 2) {
    throw new Error("Empty filter result shape mismatch");
}

// 6. Edge Case: Filter matches all rows (full height result)
const dfAll = df.filter($df.col("age").gt(0));
if (dfAll.height !== 3 || dfAll.width !== 2) {
    throw new Error("Full match filter result shape mismatch");
}

// 7. Edge Case: Filter on empty DataFrame (height 0 input)
const dfEmpty = new DataFrame({ a: [], b: [] });
const dfFilteredEmpty = dfEmpty.filter($df.col("a").gt(10));
if (dfFilteredEmpty.height !== 0 || dfFilteredEmpty.width !== 2) {
    throw new Error("Filter on empty DataFrame failed");
}

// 8. Edge Case: Filter with nulls / NaNs (truthy check should exclude nulls & NaNs)
const dfNulls = new DataFrame([
    { a: 1, val: 10 },
    { a: 2, val: null },
    { a: 3, val: NaN },
    { a: 4, val: undefined }
]);
const dfFilteredNulls = dfNulls.filter($df.col("val").gt(5));
if (dfFilteredNulls.height !== 1 || dfFilteredNulls.toDicts()[0].a !== 1) {
    throw new Error("Filter with nulls and NaNs failed");
}

// 9. Edge Case: Filter with column expression returning string/truthy objects
const dfTruthy = new DataFrame([
    { tag: "active", id: 1 },
    { tag: "", id: 2 },
    { tag: null, id: 3 }
]);
const dfFilteredTruthy = dfTruthy.filter($df.col("tag").isNotNull());
if (dfFilteredTruthy.height !== 2) {
    throw new Error("Filter with isNotNull failed");
}

// 11. Edge Case: Filter custom proxy compatibility (Object.keys / Object.getOwnPropertyDescriptor / in)
const dfFilterTest = new DataFrame([
    { a: 1, b: 2 },
    { a: 3, b: 4 }
]);
const dfFilteredProxy = dfFilterTest.filter((row: any) => {
    const keys = Object.keys(row);
    if (keys.length !== 2 || !keys.includes("a") || !keys.includes("b")) {
        throw new Error("Object.keys failed on row proxy");
    }
    if (!("a" in row)) throw new Error("'in' operator failed on row proxy");
    const desc = Object.getOwnPropertyDescriptor(row, "a");
    if (desc === undefined || desc.enumerable !== true) {
        throw new Error("getOwnPropertyDescriptor failed on row proxy");
    }
    return row.a > 2;
});
if (dfFilteredProxy.height !== 1 || dfFilteredProxy.toDicts()[0].a !== 3) {
    throw new Error("Filtered proxy logic execution failed");
}

console.log("✓ filter tests passed!");


