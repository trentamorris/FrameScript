import { ExprBase, derive } from "../ExprBase"
import { kleeneUnary, kleeneBinary } from "../utils"
import { isArrayOrTypedArray, isArrayOfType, isValidNumber, toCanonicalString, getUniqueArrayStats } from "../../utils"

function _buildSet(vals: any): Set<string> {
    const set = new Set<string>();
    const arr = isArrayOrTypedArray(vals) ? vals : [vals];
    for (let j = 0; j < arr.length; j++) set.add(toCanonicalString(arr[j]));
    return set;
}

function _computeIsIn(vArray: ArrayLike<any>, columns: any, values: any): any[] {
    const height = vArray.length;
    const isExpr = values && typeof values === "object" && "evaluate" in values;
    const resolved = isExpr ? values.evaluate(columns, height) : null;
    const staticSet = isExpr ? null : _buildSet(values);
    const result = new Array(height);

    for (let i = 0; i < height; i++) {
        const v = vArray[i];
        if (v == null) {
            result[i] = null;
            continue;
        }
        const set = staticSet ?? _buildSet(resolved[i]);
        result[i] = set.has(toCanonicalString(v));
    }

    return result;
}

function _compareMissing(vArray: ArrayLike<any>, rResolved: any): boolean[] {
    const height = vArray.length;
    const isRArray = isArrayOrTypedArray(rResolved);
    const result = new Array(height);
    for (let i = 0; i < height; i++) {
        const v = vArray[i];
        const r = isRArray ? rResolved[i] : rResolved;
        if (v == null || r == null) {
            result[i] = v == null && r == null;
        } else {
            result[i] = v === r;
        }
    }
    return result;
}

/**
 * @namespace $df.col
 * @category ColumnExpression
 * @syntax $df.col(<column_name>).{symbol}(...)
 */
export class ComparisonExpr extends ExprBase {

    /**
     * Checks if values fall inside lower and upper boundaries (inclusive).
     * @param lower The lower boundary value or expression.
     * @param upper The upper boundary value or expression.
     * @param closed Control boundary inclusivity: "both", "left", "right", or "none" (default: "both").
     * @returns ColumnExpression
     * @example
     * >>> df.withColumns($df.col("a").between(1, 2).alias("in_range"))
     * shape: (3, 3)
     * ┌───┬───┬──────────┐
     * │ a │ b │ in_range │
     * ├───┼───┼──────────┤
     * │ 1 │ x │ true     │
     * │ 2 │ y │ true     │
     * │ 3 │ z │ false    │
     * └───┴───┴──────────┘
     */
    between(lower: any, upper: any, closed: "both" | "left" | "right" | "none" = "both") {
        const isLeftClosed = closed === "both" || closed === "left";
        const isRightClosed = closed === "both" || closed === "right";

        const lowerBound = isLeftClosed ? this.ge(lower) : this.gt(lower);
        const upperBound = isRightClosed ? this.le(upper) : this.lt(upper);

        return (lowerBound as any).and(upperBound);
    }

    /**
     * Boolean comparison: Returns true if column values match the specified value exactly.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({
     * ...   a: [1, 2, 3]
     * ... })
     * shape: (3, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * │ 3 │
     * └───┘
     * 
     * >>> df.withColumns($df.col("a").eq(2).alias("is_two"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ is_two │
     * ├───┼────────┤
     * │ 1 │ false  │
     * │ 2 │ true   │
     * │ 3 │ false  │
     * └───┴────────┘
     */
    eq(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v === r));
    }

    /**
     * Equivalence check that treats null values as equal to each other.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1, null, 3] })
     * >>> df.withColumns($df.col("a").eqMissing(null).alias("is_missing"))
     * shape: (3, 2)
     * ┌──────┬────────────┐
     * │ a    │ is_missing │
     * ├──────┼────────────┤
     * │ 1    │ false      │
     * │ null │ true       │
     * │ 3    │ false      │
     * └──────┴────────────┘
     */
    eqMissing(val: any) {
        return derive(this, (vArray, columns) => {
            const rResolved = this._resolve(val, columns, vArray.length);
            return _compareMissing(vArray, rResolved);
        });
    }

    /**
     * Boolean comparison: Returns true if greater than or equal to argument.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ price: [90, 100, 110] })
     * >>> df.withColumns($df.col("price").ge(100).alias("ge_100"))
     * shape: (3, 2)
     * ┌───────┬────────┐
     * │ price │ ge_100 │
     * ├───────┼────────┤
     * │ 90    │ false  │
     * │ 100   │ true   │
     * │ 110   │ true   │
     * └───────┴────────┘
     */
    ge(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v >= r));
    }

    /**
     * Boolean comparison: Returns true if column value is greater than argument.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ price: [90, 100, 110] })
     * >>> df.withColumns($df.col("price").gt(100).alias("gt_100"))
     * shape: (3, 2)
     * ┌───────┬────────┐
     * │ price │ gt_100 │
     * ├───────┼────────┤
     * │ 90    │ false  │
     * │ 100   │ false  │
     * │ 110   │ true   │
     * └───────┴────────┘
     */
    gt(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v > r));
    }

    /**
     * Aggregation: Checks if any value in the group is null.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ group: ["A", "A"], val: [10, null] })
     * >>> df.groupBy("group").agg($df.col("val").hasNulls().alias("hasNulls"))
     * shape: (1, 2)
     * ┌───────┬───────────┐
     * │ group │ hasNulls │
     * ├───────┼───────────┤
     * │ "A"   │ true      │
     * └───────┴───────────┘
     */
    hasNulls() {
        return (this as any).anyNull();
    }

    /**
     * Determines if floating-point values are approximately equal within tolerances.
     * @param other The value or expression to compare against.
     * @param options Tolerance values absolute (absTol) and relative (relTol), and NaN options.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1.000000001, 2.0] })
     * >>> df.withColumns($df.col("a").isClose(1.0).alias("close"))
     * shape: (2, 2)
     * ┌─────────────┬───────┐
     * │ a           │ close │
     * ├─────────────┼───────┤
     * │ 1.000000001 │ true  │
     * │ 2.0         │ false │
     * └─────────────┴───────┘
     */
    isClose(
        other: any,
        {
            absTol = 1e-8,
            relTol = 1e-8,
            nansEqual = false
        }: {
            absTol?: number;
            relTol?: number;
            nansEqual?: boolean;
        } = {}
    ) {
        return derive(this, (vArray, columns) => {
            const height = vArray.length;
            const otherVal = (this as any)._resolve(other, columns, height);
            const isOtherArray = isArrayOrTypedArray(otherVal);
            const result = new Array(height);
            for (let i = 0; i < height; i++) {
                const v = vArray[i];
                const o = isOtherArray ? otherVal[i] : otherVal;
                if (v == null || o == null) {
                    result[i] = null;
                } else if (isValidNumber(v) && isValidNumber(o)) {
                    const absDiff = Math.abs(v - o);
                    const threshold = Math.max(relTol * Math.max(Math.abs(v), Math.abs(o)), absTol);
                    result[i] = absDiff <= threshold;
                } else if (Number.isNaN(v) && Number.isNaN(o)) {
                    result[i] = nansEqual;
                } else {
                    result[i] = (v === o);
                }
            }
            return result;
        });
    }

    /**
     * Checks if values occur more than once in the column.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1, 2, 2] })
     * >>> df.withColumns($df.col("a").isDuplicated().alias("dup"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ dup   │
     * ├───┼───────┤
     * │ 1 │ false │
     * │ 2 │ true  │
     * │ 2 │ true  │
     * └───┴───────┘
     */
    isDuplicated() {
        return derive(this, (vArray) => {
            const { frequencies } = getUniqueArrayStats(vArray, { strict: true });
            const height = vArray.length;
            const result = new Array(height);
            for (let i = 0; i < height; i++) {
                result[i] = (frequencies.get(vArray[i]) || 0) > 1;
            }
            return result;
        });
    }

    /**
     * Checks if strings or nested arrays have length 0.
     * @param options Config options including whether to ignore nulls inside arrays.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: ["", "hello", []] })
     * >>> df.withColumns($df.col("a").isEmpty().alias("empty"))
     * shape: (3, 2)
     * ┌─────────┬───────┐
     * │ a       │ empty │
     * ├─────────┼───────┤
     * │ ""      │ true  │
     * │ "hello" │ false │
     * │ []      │ true  │
     * └─────────┴───────┘
     */
    isEmpty({ ignoreNulls = false }: { ignoreNulls?: boolean } = {}) {
        return derive(this, kleeneUnary((v) => {
            if (typeof v === "string") {
                return v.length === 0;
            }
            if (isArrayOrTypedArray(v)) {
                if (ignoreNulls) {
                    return isArrayOfType(v, "nullish", { mode: "every" });
                }
                return (v as any).length === 0;
            }
            return null;
        }));
    }

    /**
     * Checks if values are finite numbers (not NaN or Infinity).
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1.5, Infinity, NaN] })
     * >>> df.withColumns($df.col("a").isFinite().alias("finite"))
     * shape: (3, 2)
     * ┌──────────┬────────┐
     * │ a        │ finite │
     * ├──────────┼────────┤
     * │ 1.5      │ true   │
     * │ Infinity │ false  │
     * │ NaN      │ false  │
     * └──────────┴────────┘
     */
    isFinite() {
        return derive(this, kleeneUnary(Number.isFinite));
    }


    /**
     * Checks if column values are members of a specified array or list.
     * @param values An array of candidate values or a single value to match against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ category: ["toys", "books", "food"] })
     * >>> df.withColumns($df.col("category").isIn(["toys", "books"]).alias("in_list"))
     * shape: (3, 2)
     * ┌──────────┬─────────┐
     * │ category │ in_list │
     * ├──────────┼─────────┤
     * │ "toys"   │ true    │
     * │ "books"  │ true    │
     * │ "food"   │ false   │
     * └──────────┴─────────┘
     */
    isIn(values: any[] | any) {
        return derive(this, (vArray, columns) => _computeIsIn(vArray, columns, values));
    }

    /**
     * Checks if values are positive or negative Infinity.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1.5, Infinity, -Infinity] })
     * >>> df.withColumns($df.col("a").isInfinite().alias("inf"))
     * shape: (3, 2)
     * ┌───────────┬───────┐
     * │ a         │ inf   │
     * ├───────────┼───────┤
     * │ 1.5       │ false │
     * │ Infinity  │ true  │
     * │ -Infinity │ true  │
     * └───────────┴───────┘
     */
    isInfinite() {
        return derive(this, kleeneUnary((v) => v === Infinity || v === -Infinity));
    }


    /**
     * Checks if values are NaN.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1.5, NaN] })
     * >>> df.withColumns($df.col("a").isNan().alias("nan"))
     * shape: (2, 2)
     * ┌─────┬───────┐
     * │ a   │ nan   │
     * ├─────┼───────┤
     * │ 1.5 │ false │
     * │ NaN │ true  │
     * └─────┴───────┘
     */
    isNan() {
        return derive(this, kleeneUnary(Number.isNaN));
    }

    /**
     * Checks if values are not NaN.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1.5, NaN] })
     * >>> df.withColumns($df.col("a").isNotNan().alias("not_nan"))
     * shape: (2, 2)
     * ┌─────┬─────────┐
     * │ a   │ not_nan │
     * ├─────┼─────────┤
     * │ 1.5 │ true    │
     * │ NaN │ false   │
     * └─────┴─────────┘
     */
    isNotNan() {
        return (this as any).isNan().not();
    }

    /**
     * Checks if column values are non-null and valid (not null, undefined, or missing).
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ email: ["alice@example.com", null] })
     * >>> df.withColumns($df.col("email").isNotNull().alias("valid"))
     * shape: (2, 2)
     * ┌───────────────────┬───────┐
     * │ email             │ valid │
     * ├───────────────────┼───────┤
     * │ alice@example.com │ true  │
     * │ null              │ false │
     * └───────────────────┴───────┘
     */
    isNotNull() {
        return (this as any).isNull().not();
    }

    /**
     * Checks if column values are null, undefined, or missing.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ email: ["alice@example.com", null] })
     * >>> df.withColumns($df.col("email").isNull().alias("missing"))
     * shape: (2, 2)
     * ┌───────────────────┬─────────┐
     * │ email             │ missing │
     * ├───────────────────┼─────────┤
     * │ alice@example.com │ false   │
     * │ null              │ true    │
     * └───────────────────┴─────────┘
     */
    isNull() {
        return this.eqMissing(null);
    }

    /**
     * Checks if values occur exactly once in the column.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1, 2, 2] })
     * >>> df.withColumns($df.col("a").isUnique().alias("uniq"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ uniq  │
     * ├───┼───────┤
     * │ 1 │ true  │
     * │ 2 │ false │
     * │ 2 │ false │
     * └───┴───────┘
     */
    isUnique() {
        return (this as any).isDuplicated().not();
    }

    /**
     * Boolean comparison: Returns true if less than or equal to argument.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ price: [40, 50, 60] })
     * >>> df.withColumns($df.col("price").le(50).alias("le_50"))
     * shape: (3, 2)
     * ┌───────┬───────┐
     * │ price │ le_50 │
     * ├───────┼───────┤
     * │ 40    │ true  │
     * │ 50    │ true  │
     * │ 60    │ false │
     * └───────┴───────┘
     */
    le(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v <= r));
    }

    /**
     * Boolean comparison: Returns true if less than argument.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ price: [40, 50, 60] })
     * >>> df.withColumns($df.col("price").lt(50).alias("lt_50"))
     * shape: (3, 2)
     * ┌───────┬───────┐
     * │ price │ lt_50 │
     * ├───────┼───────┤
     * │ 40    │ true  │
     * │ 50    │ false │
     * │ 60    │ false │
     * └───────┴───────┘
     */
    lt(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v < r));
    }

    /**
     * Boolean comparison: Returns true if values do not match.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ category: ["electronics", "toys"] })
     * >>> df.withColumns($df.col("category").ne("electronics").alias("not_elec"))
     * shape: (2, 2)
     * ┌─────────────┬──────────┐
     * │ category    │ not_elec │
     * ├─────────────┼──────────┤
     * │ electronics │ false    │
     * │ toys        │ true     │
     * └─────────────┴──────────┘
     */
    ne(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v !== r));
    }

    /**
     * Difference check that treats null values as equal to each other.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ a: [1, null, 3] })
     * >>> df.withColumns($df.col("a").neMissing(null).alias("not_missing"))
     * shape: (3, 2)
     * ┌──────┬─────────────┐
     * │ a    │ not_missing │
     * ├──────┼─────────────┤
     * │ 1    │ true        │
     * │ null │ false       │
     * │ 3    │ true        │
     * └──────┴─────────────┘
     */
    neMissing(val: any) {
        return (this as any).eqMissing(val).not();
    }

    /**
     * Checks if values are not elements of a specific array or set list.
     * @param values An array of candidate values or a single value to match against.
     * @returns ColumnExpression
     * @example
     * >>> const df = $df.data({ category: ["toys", "books", "food"] })
     * >>> df.withColumns($df.col("category").notIn(["toys", "books"]).alias("notIn"))
     * shape: (3, 2)
     * ┌──────────┬────────┐
     * │ category │ notIn │
     * ├──────────┼────────┤
     * │ toys     │ false  │
     * │ books    │ false  │
     * │ food     │ true   │
     * └──────────┴────────┘
     */
    notIn(values: any[] | any) {
        return (this as any).isIn(values).not();
    }

}
