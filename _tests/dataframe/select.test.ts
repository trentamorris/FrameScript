import { DataFrame } from "../../src/dataframe";
import { $df } from "../../src/api";

console.log("Running select tests...");

const df = new DataFrame([
    { name: "Alice", age: 30, city: "NY" },
    { name: "Bob", age: 25, city: "SF" }
]);

// 1. Simple selection of columns by name
const df1 = df.select("name", "city");
if (df1.height !== 2) throw new Error("Expected height 2");
const schema1 = df1.schema;
if (schema1.name === undefined || schema1.city === undefined || schema1.age !== undefined) {
    throw new Error("Columns mismatch on simple selection schema");
}
const collected1 = df1.toDicts();
if (collected1[0].name !== "Alice" || collected1[0].city !== "NY" || (collected1[0] as any).age !== undefined) {
    throw new Error("Values mismatch on simple selection");
}

// 2. Select using column expressions and aliasing
const df2 = df.select($df.col("age").alias("years"), "name");
const schema2 = df2.schema;
if (schema2.years === undefined || schema2.name === undefined || schema2.age !== undefined) {
    throw new Error("Columns mismatch on expression selection schema");
}
const collected2 = df2.toDicts();
if (collected2[0].years !== 30 || collected2[0].name !== "Alice") {
    throw new Error("Values mismatch on expression selection");
}

// 4. Edge Case: Empty selection (select() with 0 arguments)
const dfEmptySelect = df.select();
if (dfEmptySelect.height !== 2 || dfEmptySelect.columns.length !== 0) {
    throw new Error("Empty select() should preserve height and have 0 columns");
}

// 5. Edge Case: Selection with pure literals & global aggregations collapsing height to 1
const dfAggLit = df.select(
    $df.col("age").sum().alias("total_age"),
    $df.lit("ALL_USERS").alias("report_type")
);
if (dfAggLit.height !== 1) {
    throw new Error(`Expected global aggregation select to collapse height to 1, got ${dfAggLit.height}`);
}
const aggLitDicts = dfAggLit.toDicts();
if (aggLitDicts[0].total_age !== 55 || aggLitDicts[0].report_type !== "ALL_USERS") {
    throw new Error("Global agg + literal values mismatch");
}

// 6. Edge Case: Exploding column selection with parallel alignment
const dfExplodeSelect = new DataFrame([
    { group: "A", items: [1, 2], labels: ["x", "y"] },
    { group: "B", items: [3], labels: ["z"] }
]);
const dfExploded = dfExplodeSelect.select(
    "group",
    $df.col("items").arr.explode(),
    $df.col("labels").arr.explode()
);
if (dfExploded.height !== 3) {
    throw new Error(`Explode selection height mismatch: expected 3, got ${dfExploded.height}`);
}
const explodedDicts = dfExploded.toDicts();
if (explodedDicts[0].items !== 1 || explodedDicts[0].labels !== "x" || explodedDicts[0].group !== "A") {
    throw new Error("Explode selection row 0 mismatch");
}
if (explodedDicts[2].items !== 3 || explodedDicts[2].labels !== "z" || explodedDicts[2].group !== "B") {
    throw new Error("Explode selection row 2 mismatch");
}

// 7. Edge Case: Mismatched explode heights error thrown
let threwMismatchedExplode = false;
try {
    const mismatchDf = new DataFrame([
        { a: [1, 2], b: [10] }
    ]);
    mismatchDf.select($df.col("a").arr.explode(), $df.col("b").arr.explode());
} catch (e: any) {
    if (e.message.includes("Mismatched explode heights")) {
        threwMismatchedExplode = true;
    }
}
if (!threwMismatchedExplode) {
    throw new Error("Expected Mismatched explode heights error was not thrown");
}

// 8. Edge Case: Duplicate column selection error thrown
let threwDuplicate = false;
try {
    df.select("name", "name");
} catch (e: any) {
    if (e.message.includes("Duplicate column selection")) {
        threwDuplicate = true;
    }
}
if (!threwDuplicate) {
    throw new Error("Expected Duplicate column selection error was not thrown");
}

// 9. Edge Case: Selecting on empty DataFrame (height 0) with columns
const emptyDf = new DataFrame({ a: [], b: [] });
const emptySelect = emptyDf.select("a");
if (emptySelect.height !== 0 || emptySelect.columns.length !== 1 || emptySelect.columns[0] !== "a") {
    throw new Error("Selection on empty DataFrame failed");
}

// 10. Edge Case: Select with nested array of expressions / column lists
const dfNestedArgs = df.select(["name", ["city"]], [$df.col("age").alias("a")]);
if (dfNestedArgs.width !== 3 || dfNestedArgs.height !== 2) {
    throw new Error("Nested array argument select failed");
}

// 11. Edge Case: Select with Record mapping syntax { targetColName: expr/literal }
const dfRecordMap = df.select({
    person_name: $df.col("name"),
    person_age: $df.col("age").add(5)
});
if (dfRecordMap.columns[0] !== "person_name" || dfRecordMap.columns[1] !== "person_age") {
    throw new Error("Record dictionary mapping selection keys mismatch");
}
const recordDicts = dfRecordMap.toDicts();
if (recordDicts[0].person_name !== "Alice" || recordDicts[0].person_age !== 35) {
    throw new Error("Record dictionary mapping selection values mismatch");
}

// 12. Edge Case: All-literal selection (should collapse to height 1)
const dfAllLiterals = df.select(
    $df.lit(100).alias("const_num"),
    $df.lit("static").alias("const_str"),
    $df.lit(true).alias("const_bool")
);
if (dfAllLiterals.height !== 1 || dfAllLiterals.width !== 3) {
    throw new Error("All-literal select must collapse height to 1");
}
const allLitDict = dfAllLiterals.toDicts()[0];
if (allLitDict.const_num !== 100 || allLitDict.const_str !== "static" || allLitDict.const_bool !== true) {
    throw new Error("All-literal values mismatch");
}

// 13. Edge Case: Single Row DataFrame with null values
const dfSingleNull = new DataFrame([{ a: null, b: undefined, c: 42 }]);
const selectNulls = dfSingleNull.select("a", "b", "c");
if (selectNulls.height !== 1 || selectNulls.width !== 3) {
    throw new Error("Single null DataFrame select height/width mismatch");
}
const singleNullDict = selectNulls.toDicts()[0];
if (singleNullDict.a !== null || singleNullDict.b !== null || singleNullDict.c !== 42) {
    throw new Error("Single null DataFrame select values mismatch");
}

// 14. Edge Case: Select with Type Selectors ($df.col($df.DataType.Utf8))
const dfMixedTypes = new DataFrame([
    { strCol: "hello", numCol: 123, boolCol: true }
]);
const dfOnlyStr = dfMixedTypes.select($df.col($df.DataType.Utf8));
if (dfOnlyStr.columns.length !== 1 || dfOnlyStr.columns[0] !== "strCol") {
    throw new Error("Type selector $df.col($df.DataType.Utf8) select failed");
}

// 16. Edge Case: Duplicate selection error in select
let duplicateThrew = false;
try {
    df.select("name", "name");
} catch (e: any) {
    if (e.message.includes("Duplicate column selection")) {
        duplicateThrew = true;
    }
}
if (!duplicateThrew) throw new Error("Expected duplicate selection to throw error");

console.log("✓ select tests passed!");



