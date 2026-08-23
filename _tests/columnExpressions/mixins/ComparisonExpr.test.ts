import { $df } from "../../../src/index";

console.log("=========================================");
console.log("STARTING COLUMN EXPRESSION COMPARISON TESTS...");
console.log("=========================================");

const data = [
    {
        val: 15,
        lower: 10,
        upper: 20,
        tags: ["a", "b"],
        target: "a",
        null_col: null
    },
    {
        val: 5,
        lower: 10,
        upper: 20,
        tags: ["c"],
        target: "a",
        null_col: null
    },
    {
        val: 20,
        lower: 10,
        upper: 20,
        tags: ["a"],
        target: "x",
        null_col: 100
    }
];

try {
    const df = $df.data(data);

    const projected = df.select([
        // between tests
        $df.col("val").between($df.col("lower"), $df.col("upper")).alias("between_default"), // closed = both
        $df.col("val").between($df.col("lower"), $df.col("upper"), "left").alias("between_left"),
        $df.col("val").between($df.col("lower"), $df.col("upper"), "right").alias("between_right"),
        $df.col("val").between($df.col("lower"), $df.col("upper"), "none").alias("between_none"),

        // eqMissing and neMissing tests
        $df.col("null_col").eqMissing(null).alias("eq_missing_null"),
        $df.col("null_col").eqMissing(100).alias("eq_missing_val"),
        $df.col("null_col").neMissing(null).alias("ne_missing_null"),
        $df.col("null_col").neMissing(100).alias("ne_missing_val"),

        // isIn / notIn dynamic IExpr tests
        $df.col("target").isIn($df.col("tags")).alias("is_in_expr"),
        $df.col("target").notIn($df.col("tags")).alias("not_in_expr"),
        $df.col("target").isIn(["a", "b"]).alias("is_in_array")
    ]).toDicts() as any[];

    console.dir(projected, { depth: null });

    // Assert row 0 (val = 15, lower = 10, upper = 20, tags = ["a", "b"], target = "a", null_col = null)
    const r0 = projected[0];
    if (r0.between_default !== true) throw new Error("r0.between_default failed");
    if (r0.between_left !== true) throw new Error("r0.between_left failed");
    if (r0.between_right !== true) throw new Error("r0.between_right failed");
    if (r0.between_none !== true) throw new Error("r0.between_none failed");
    if (r0.eq_missing_null !== true) throw new Error("r0.eq_missing_null failed");
    if (r0.eq_missing_val !== false) throw new Error("r0.eq_missing_val failed");
    if (r0.ne_missing_null !== false) throw new Error("r0.ne_missing_null failed");
    if (r0.ne_missing_val !== true) throw new Error("r0.ne_missing_val failed");
    if (r0.is_in_expr !== true) throw new Error("r0.is_in_expr failed");
    if (r0.not_in_expr !== false) throw new Error("r0.not_in_expr failed");
    if (r0.is_in_array !== true) throw new Error("r0.is_in_array failed");

    // Assert row 1 (val = 5, lower = 10, upper = 20, tags = ["c"], target = "a", null_col = null)
    const r1 = projected[1];
    if (r1.between_default !== false) throw new Error("r1.between_default failed");
    if (r1.eq_missing_null !== true) throw new Error("r1.eq_missing_null failed");
    if (r1.is_in_expr !== false) throw new Error("r1.is_in_expr failed");
    if (r1.not_in_expr !== true) throw new Error("r1.not_in_expr failed");

    // Assert row 2 (val = 20, lower = 10, upper = 20, tags = ["a"], target = "x", null_col = 100)
    const r2 = projected[2];
    if (r2.between_default !== true) throw new Error("r2.between_default failed"); // 20 is inside [10, 20]
    if (r2.between_left !== false) throw new Error("r2.between_left failed"); // 20 not inside [10, 20)
    if (r2.between_right !== true) throw new Error("r2.between_right failed"); // 20 is inside (10, 20]
    if (r2.between_none !== false) throw new Error("r2.between_none failed"); // 20 not inside (10, 20)
    if (r2.eq_missing_null !== false) throw new Error("r2.eq_missing_null failed");
    if (r2.eq_missing_val !== true) throw new Error("r2.eq_missing_val failed");
    if (r2.ne_missing_null !== true) throw new Error("r2.ne_missing_null failed");
    if (r2.ne_missing_val !== false) throw new Error("r2.ne_missing_val failed");
    if (r2.is_in_expr !== false) throw new Error("r2.is_in_expr failed");
    if (r2.not_in_expr !== true) throw new Error("r2.not_in_expr failed");

    // TypedArray test
    const typedDf = $df.data({
        val: new Int32Array([15, 5, 20]),
        lower: new Int32Array([10, 10, 10]),
        upper: new Int32Array([20, 20, 20]),
        tags: [new Int32Array([15, 10]), new Int32Array([5]), new Int32Array([20])]
    } as any);

    const typedProjected = typedDf.select([
        $df.col("val").between($df.col("lower"), $df.col("upper")).alias("between"),
        $df.col("val").isIn(new Int32Array([15, 20]) as any).alias("is_in_static"),
        $df.col("val").and(true).alias("and_true")
    ]).toDicts() as any[];

    if (typedProjected[0].between !== true) throw new Error("TypedArray between failed on index 0");
    if (typedProjected[1].between !== false) throw new Error("TypedArray between failed on index 1");
    if (typedProjected[2].between !== true) throw new Error("TypedArray between failed on index 2");

    if (typedProjected[0].is_in_static !== true) throw new Error("TypedArray is_in_static failed on index 0");
    if (typedProjected[1].is_in_static !== false) throw new Error("TypedArray is_in_static failed on index 1");
    if (typedProjected[2].is_in_static !== true) throw new Error("TypedArray is_in_static failed on index 2");

    // =========================================
    // 10/10 ADVANCED COMPARISON EDGE CASES
    // =========================================

    // 1. isClose with Relative/Absolute Tolerances and NaN Equality
    const closeDf = $df.data({
        a: [1.000000001, 1e-10, NaN, Infinity, -Infinity, null, 100.0],
        b: [1.000000002, 0.0, NaN, Infinity, Infinity, null, 100.005]
    });
    const closeRes = closeDf.select([
        $df.col("a").isClose($df.col("b"), { absTol: 1e-7 }).alias("close_default"),
        $df.col("a").isClose($df.col("b"), { absTol: 1e-7, nansEqual: true }).alias("close_nans"),
        $df.col("a").isClose($df.col("b"), { relTol: 1e-4 }).alias("close_rel")
    ]).toDicts() as any[];

    if (closeRes[0].close_default !== true) throw new Error("isClose small diff failed");
    if (closeRes[1].close_default !== true) throw new Error("isClose absTol failed");
    if (closeRes[2].close_default !== false) throw new Error("isClose default NaN equal should be false");
    if (closeRes[2].close_nans !== true) throw new Error("isClose nansEqual should be true");
    if (closeRes[3].close_default !== true) throw new Error("isClose Infinity === Infinity failed");
    if (closeRes[4].close_default !== false) throw new Error("isClose -Infinity !== +Infinity failed");
    if (closeRes[5].close_default !== null) throw new Error("isClose null propagation failed");
    if (closeRes[6].close_rel !== true) throw new Error("isClose relative tolerance failed");

    // 2. isEmpty on strings and nested empty arrays
    const emptyDf = $df.data([
        { str_val: "", arr_val: [], num_val: 123 },
        { str_val: "hello", arr_val: [1, 2], num_val: 456 },
        { str_val: null, arr_val: null, num_val: null }
    ]);
    const emptyRes = emptyDf.select([
        $df.col("str_val").isEmpty().alias("empty_str"),
        $df.col("arr_val").isEmpty().alias("empty_arr"),
        $df.col("num_val").isEmpty().alias("empty_num")
    ]).toDicts() as any[];

    if (emptyRes[0].empty_str !== true) throw new Error("isEmpty empty string failed");
    if (emptyRes[1].empty_str !== false) throw new Error("isEmpty non-empty string failed");
    if (emptyRes[2].empty_str !== null) throw new Error("isEmpty null string should propagate null");
    if (emptyRes[0].empty_arr !== true) throw new Error("isEmpty empty array failed");
    if (emptyRes[1].empty_arr !== false) throw new Error("isEmpty non-empty array failed");
    if (emptyRes[2].empty_arr !== null) throw new Error("isEmpty null array should propagate null");
    if (emptyRes[0].empty_num !== null) throw new Error("isEmpty number should return null");


    // 3. isFinite, isInfinite, isNan, isNotNan
    const numDf = $df.data({
        num: [0, -0, 42, -Infinity, Infinity, NaN, null]
    });
    const numRes = numDf.select([
        $df.col("num").isFinite().alias("finite"),
        $df.col("num").isInfinite().alias("infinite"),
        $df.col("num").isNan().alias("nan"),
        $df.col("num").isNotNan().alias("not_nan")
    ]).toDicts() as any[];

    if (numRes[0].finite !== true || numRes[2].finite !== true || numRes[3].finite !== false || numRes[5].finite !== false || numRes[6].finite !== null) {
        throw new Error("isFinite results mismatch");
    }
    if (numRes[0].infinite !== false || numRes[3].infinite !== true || numRes[4].infinite !== true || numRes[5].infinite !== false || numRes[6].infinite !== null) {
        throw new Error("isInfinite results mismatch");
    }
    if (numRes[0].nan !== false || numRes[5].nan !== true || numRes[6].nan !== null) {
        throw new Error("isNan results mismatch");
    }
    if (numRes[0].not_nan !== true || numRes[5].not_nan !== false || numRes[6].not_nan !== null) {
        throw new Error("isNotNan results mismatch");
    }

    // 4. isDuplicated and isUnique across duplicated and unique rows
    const dupDf = $df.data({
        keys: ["A", "B", "A", "C", "B", "D", null, null]
    });
    const dupRes = dupDf.select([
        $df.col("keys").isDuplicated().alias("dup"),
        $df.col("keys").isUnique().alias("uniq")
    ]).toDicts() as any[];

    if (dupRes[0].dup !== true || dupRes[0].uniq !== false) throw new Error("isDuplicated 'A' failed");
    if (dupRes[3].dup !== false || dupRes[3].uniq !== true) throw new Error("isUnique 'C' failed");
    if (dupRes[5].dup !== false || dupRes[5].uniq !== true) throw new Error("isUnique 'D' failed");
    if (dupRes[6].dup !== true || dupRes[6].uniq !== false) throw new Error("isDuplicated null check failed");

    // 5. BigInt comparisons across le, lt, ge, gt, eq, ne
    const bigIntDf = $df.data({
        b1: [100n, 200n, 300n],
        b2: [100n, 150n, 400n]
    });
    const bigIntRes = bigIntDf.select([
        $df.col("b1").eq($df.col("b2")).alias("eq"),
        $df.col("b1").gt($df.col("b2")).alias("gt"),
        $df.col("b1").le($df.col("b2")).alias("le")
    ]).toDicts() as any[];

    if (bigIntRes[0].eq !== true || bigIntRes[0].gt !== false || bigIntRes[0].le !== true) throw new Error("BigInt row 0 comparison failed");
    if (bigIntRes[1].eq !== false || bigIntRes[1].gt !== true || bigIntRes[1].le !== false) throw new Error("BigInt row 1 comparison failed");
    if (bigIntRes[2].eq !== false || bigIntRes[2].gt !== false || bigIntRes[2].le !== true) throw new Error("BigInt row 2 comparison failed");

    // 6. Comprehensive neMissing and notIn edge cases
    const edgeDf = $df.data({
        mixed_a: [null, undefined, 0, false, "", "text", 10, "10", [1, 2], new Date("2026-01-01")],
        mixed_b: [null, null, 0, false, "", "text", 10, "10", [1, 2], new Date("2026-01-01")],
        scalars: ["alpha", "beta", "gamma", null, undefined, "100", 100, "foo", "bar", "baz"],
        floats: [1.5, NaN, null, 0.0, -10.5, NaN, 100, 200, 300, 400]
    });

    const edgeRes = edgeDf.select([
        // neMissing compares against matching type, different type, and null/undefined
        $df.col("mixed_a").neMissing($df.col("mixed_b")).alias("ne_self_missing"),
        $df.col("mixed_a").neMissing(null).alias("ne_null_literal"),
        $df.col("mixed_a").neMissing(0).alias("ne_zero_literal"),
        $df.col("mixed_a").neMissing(false).alias("ne_false_literal"),
        $df.col("mixed_a").neMissing("").alias("ne_empty_str_literal"),

        // notIn with array literals containing mixed types, nulls, and exact vs loose matches
        $df.col("scalars").notIn(["alpha", "beta"]).alias("not_in_arr"),
        $df.col("scalars").notIn(["100"]).alias("not_in_str_100"),
        $df.col("scalars").notIn([100]).alias("not_in_num_100"),
        $df.col("scalars").notIn([]).alias("not_in_empty_list"),
        $df.col("scalars").notIn("alpha").alias("not_in_single_scalar"),

        // isNotNull & isNotNan edge cases
        $df.col("mixed_a").isNotNull().alias("not_null_col"),
        $df.col("floats").isNotNan().alias("not_nan_col")
    ]).toDicts() as any[];

    // neMissing row assertions:
    // [null, null] -> equal in missing logic -> neMissing is false
    if (edgeRes[0].ne_self_missing !== false) throw new Error("neMissing on null vs null failed");
    // [undefined, null] -> both considered null -> neMissing is false
    if (edgeRes[1].ne_self_missing !== false) throw new Error("neMissing on undefined vs null failed");
    // [0, 0] -> equal -> neMissing is false
    if (edgeRes[2].ne_self_missing !== false) throw new Error("neMissing on 0 vs 0 failed");
    // [false, false] -> equal -> neMissing is false
    if (edgeRes[3].ne_self_missing !== false) throw new Error("neMissing on false vs false failed");
    // ["", ""] -> equal -> neMissing is false
    if (edgeRes[4].ne_self_missing !== false) throw new Error("neMissing on empty string failed");
    // [10, 10] -> equal -> neMissing is false
    if (edgeRes[6].ne_self_missing !== false) throw new Error("neMissing on 10 vs 10 failed");

    // ne_null_literal:
    if (edgeRes[0].ne_null_literal !== false) throw new Error("ne_null_literal index 0 failed");
    if (edgeRes[1].ne_null_literal !== false) throw new Error("ne_null_literal index 1 failed");
    if (edgeRes[2].ne_null_literal !== true) throw new Error("ne_null_literal index 2 failed");
    if (edgeRes[3].ne_null_literal !== true) throw new Error("ne_null_literal index 3 failed");

    // notIn assertions:
    // "alpha" notIn ["alpha", "beta"] -> false
    if (edgeRes[0].not_in_arr !== false) throw new Error("notIn 'alpha' failed");
    // "beta" notIn ["alpha", "beta"] -> false
    if (edgeRes[1].not_in_arr !== false) throw new Error("notIn 'beta' failed");
    // "gamma" notIn ["alpha", "beta"] -> true
    if (edgeRes[2].not_in_arr !== true) throw new Error("notIn 'gamma' failed");
    // null notIn [...] -> Kleene null propagation
    if (edgeRes[3].not_in_arr !== null) throw new Error("notIn null propagation failed");
    if (edgeRes[4].not_in_arr !== null) throw new Error("notIn undefined propagation failed");

    // Strict type separation ("100" vs 100):
    // "100" notIn ["100"] -> false; 100 notIn ["100"] -> false (toCanonicalString matching)
    if (edgeRes[5].not_in_str_100 !== false) throw new Error("notIn string 100 failed");
    // Empty candidate list -> all non-null items should be true
    if (edgeRes[0].not_in_empty_list !== true) throw new Error("notIn empty list failed");
    if (edgeRes[3].not_in_empty_list !== null) throw new Error("notIn empty list null check failed");

    // isNotNull assertions (never returns null, strictly true/false):
    if (edgeRes[0].not_null_col !== false) throw new Error("isNotNull index 0 should be false");
    if (edgeRes[1].not_null_col !== false) throw new Error("isNotNull index 1 should be false");
    if (edgeRes[2].not_null_col !== true) throw new Error("isNotNull 0 should be true");
    if (edgeRes[3].not_null_col !== true) throw new Error("isNotNull false should be true");
    if (edgeRes[4].not_null_col !== true) throw new Error("isNotNull '' should be true");
    if (edgeRes[5].not_null_col !== true) throw new Error("isNotNull NaN should be true");

    // isNotNan assertions (null propagates to null, NaN is false, real numbers are true):
    if (edgeRes[0].not_nan_col !== true) throw new Error("isNotNan 1.5 should be true");
    if (edgeRes[1].not_nan_col !== false) throw new Error("isNotNan NaN should be false");
    if (edgeRes[2].not_nan_col !== null) throw new Error("isNotNan null should be null");
    if (edgeRes[3].not_nan_col !== true) throw new Error("isNotNan 0.0 should be true");
    if (edgeRes[4].not_nan_col !== true) throw new Error("isNotNan -10.5 should be true");
    if (edgeRes[5].not_nan_col !== false) throw new Error("isNotNan NaN index 5 should be false");

    // 7. Grouped aggregation edge cases for hasNulls vs anyNull
    const grpDf = $df.data({
        grp: ["allNull", "allNull", "mixed", "mixed", "no_null", "no_null"],
        vals: [null, undefined, 42, null, 10, 20]
    });

    const grpRes = grpDf.groupBy("grp").agg(
        $df.col("vals").hasNulls().alias("has_nulls_res"),
        $df.col("vals").anyNull().alias("any_null_res"),
        $df.col("vals").allNull().alias("all_null_res")
    ).sort({ by: "grp" }).toDicts() as any[];

    // grp: "allNull"
    if (grpRes[0].has_nulls_res !== true || grpRes[0].any_null_res !== true || grpRes[0].all_null_res !== true) {
        throw new Error("grp 'allNull' aggregation failed");
    }
    // grp: "mixed"
    if (grpRes[1].has_nulls_res !== true || grpRes[1].any_null_res !== true || grpRes[1].all_null_res !== false) {
        throw new Error("grp 'mixed' aggregation failed");
    }
    // grp: "no_null"
    if (grpRes[2].has_nulls_res !== false || grpRes[2].any_null_res !== false || grpRes[2].all_null_res !== false) {
        throw new Error("grp 'no_null' aggregation failed");
    }

    // 8. Strict complementary boolean invariant: isNull() === !isNotNull() across all data types
    const invDf = $df.data({
        items: [null, undefined, 0, "", false, NaN, Infinity, -Infinity, {}, [], new Date(0)]
    });
    const invRes = invDf.select([
        $df.col("items").isNull().alias("null_flag"),
        $df.col("items").isNotNull().alias("not_null_flag")
    ]).toDicts() as any[];

    for (let i = 0; i < invRes.length; i++) {
        const nf = invRes[i].null_flag;
        const nnf = invRes[i].not_null_flag;
        if (typeof nf !== "boolean" || typeof nnf !== "boolean") {
            throw new Error(`Row ${i} isNull / isNotNull returned non-boolean: ${nf}, ${nnf}`);
        }
        if (nf === nnf) {
            throw new Error(`Row ${i} invariant broken: isNull (${nf}) === isNotNull (${nnf})`);
        }
    }

    // 9. Extensive between edge cases
    // a. Date boundaries
    const dateDf = $df.data({
        d: [new Date("2026-06-01"), new Date("2026-06-15"), new Date("2026-06-30"), new Date("2026-07-01"), null]
    });
    const dateRes = dateDf.select([
        $df.col("d").between(new Date("2026-06-01"), new Date("2026-06-30"), "both").alias("b_both"),
        $df.col("d").between(new Date("2026-06-01"), new Date("2026-06-30"), "left").alias("b_left"),
        $df.col("d").between(new Date("2026-06-01"), new Date("2026-06-30"), "right").alias("b_right"),
        $df.col("d").between(new Date("2026-06-01"), new Date("2026-06-30"), "none").alias("b_none")
    ]).toDicts() as any[];

    // 2026-06-01 (start boundary)
    if (dateRes[0].b_both !== true || dateRes[0].b_left !== true || dateRes[0].b_right !== false || dateRes[0].b_none !== false) {
        throw new Error("Date between index 0 (start bound) failed");
    }
    // 2026-06-15 (inside)
    if (dateRes[1].b_both !== true || dateRes[1].b_left !== true || dateRes[1].b_right !== true || dateRes[1].b_none !== true) {
        throw new Error("Date between index 1 (inside) failed");
    }
    // 2026-06-30 (end boundary)
    if (dateRes[2].b_both !== true || dateRes[2].b_left !== false || dateRes[2].b_right !== true || dateRes[2].b_none !== false) {
        throw new Error("Date between index 2 (end bound) failed");
    }
    // 2026-07-01 (outside)
    if (dateRes[3].b_both !== false || dateRes[3].b_none !== false) {
        throw new Error("Date between index 3 (outside) failed");
    }
    // null propagation
    if (dateRes[4].b_both !== null) throw new Error("Date between null propagation failed");

    // b. Inverted and identical boundaries, string lexicographical boundaries
    const boundDf = $df.data({
        num: [10, 20, 30],
        word: ["cat", "dog", "elephant"]
    });
    const boundRes = boundDf.select([
        // Inverted bounds (lower 30 > upper 10) -> can never be true
        $df.col("num").between(30, 10, "both").alias("inverted"),
        // Identical bounds (10, 10) -> true only when num === 10 and closed includes bounds
        $df.col("num").between(10, 10, "both").alias("exact_both"),
        $df.col("num").between(10, 10, "none").alias("exact_none"),
        // Lexicographical strings ("bat" to "dog")
        $df.col("word").between("bat", "dog", "both").alias("str_both"),
        $df.col("word").between("bat", "dog", "left").alias("str_left")
    ]).toDicts() as any[];

    // Inverted bounds: all false
    if (boundRes[0].inverted !== false || boundRes[1].inverted !== false || boundRes[2].inverted !== false) {
        throw new Error("between inverted bounds failed");
    }
    // Identical bounds: [10, 10]
    if (boundRes[0].exact_both !== true || boundRes[1].exact_both !== false) {
        throw new Error("between identical bounds both failed");
    }
    if (boundRes[0].exact_none !== false) {
        throw new Error("between identical bounds none failed");
    }
    // String bounds: "cat" is inside ("bat", "dog"), "dog" is right bound, "elephant" is outside
    if (boundRes[0].str_both !== true) throw new Error("between string 'cat' failed");
    if (boundRes[1].str_both !== true) throw new Error("between string 'dog' both failed");
    if (boundRes[1].str_left !== false) throw new Error("between string 'dog' left-only bound failed");
    if (boundRes[2].str_both !== false) throw new Error("between string 'elephant' failed");

    // c. Null lower / upper boundaries
    const nullBoundDf = $df.data({ num: [5, 10, 15] });
    const nullBoundRes = nullBoundDf.select([
        $df.col("num").between(null as any, 20).alias("null_lower"),
        $df.col("num").between(0, null as any).alias("null_upper")
    ]).toDicts() as any[];

    if (nullBoundRes[0].null_lower !== null || nullBoundRes[1].null_upper !== null) {
        throw new Error("between null boundary propagation failed");
    }

    console.log("=========================================");
    console.log("🎉 ALL COLUMN EXPRESSION COMPARISON TESTS PASSED!");
    console.log("=========================================");
} catch (error) {
    console.error("Test failed with error:", error);
    throw error;
}
