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
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.withColumns($df.col("a").between(1, 2).alias("in_range"))
     * shape: (3, 3)
     * ┌───┬────┬──────────┐
     * │ a │ b  │ in_range │
     * ├───┼────┼──────────┤
     * │ 1 │ 10 │ true     │
     * │ 2 │ 20 │ true     │
     * │ 3 │ 30 │ false    │
     * └───┴────┴──────────┘
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
     * <!-- doc:base_numbers_3x1 -->
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
     * <!-- doc:base_nulls_3x2 -->
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
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").ge(2).alias("ge_two"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ ge_two │
     * ├───┼────────┤
     * │ 1 │ false  │
     * │ 2 │ true   │
     * │ 3 │ true   │
     * └───┴────────┘
     */
    ge(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v >= r));
    }

    /**
     * Boolean comparison: Returns true if column value is greater than argument.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").gt(2).alias("gt_two"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ gt_two │
     * ├───┼────────┤
     * │ 1 │ false  │
     * │ 2 │ false  │
     * │ 3 │ true   │
     * └───┴────────┘
     */
    gt(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v > r));
    }

    /**
     * Aggregation: Checks if any value in the group is null.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_nulls_3x2 -->
     * >>> df.select($df.col("a").hasNulls().alias("has_nulls"))
     * shape: (1, 1)
     * ┌───────────┐
     * │ has_nulls │
     * ├───────────┤
     * │ true      │
     * └───────────┘
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
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").isClose(1.0).alias("close"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ close │
     * ├───┼───────┤
     * │ 1 │ true  │
     * │ 2 │ false │
     * │ 3 │ false │
     * └───┴───────┘
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
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").isDuplicated().alias("dup"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ dup   │
     * ├───┼───────┤
     * │ 1 │ false │
     * │ 2 │ false │
     * │ 3 │ false │
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
     * <!-- doc:base_strings_3x1 -->
     * >>> df.withColumns($df.col("s").isEmpty().alias("empty"))
     * shape: (2, 2)
     * ┌─────────────┬───────┐
     * │ s           │ empty │
     * ├─────────────┼───────┤
     * │ "  hello  " │ false │
     * │ "  world  " │ false │
     * └─────────────┴───────┘
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
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").isFinite().alias("finite"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ finite │
     * ├───┼────────┤
     * │ 1 │ true   │
     * │ 2 │ true   │
     * │ 3 │ true   │
     * └───┴────────┘
     */
    isFinite() {
        return derive(this, kleeneUnary(Number.isFinite));
    }


    /**
     * Checks if column values are members of a specified array or list.
     * @param values An array of candidate values or a single value to match against.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_strings_3x1 -->
     * >>> df.withColumns($df.col("s").isIn(["apple", "banana"]).alias("in_list"))
     * shape: (3, 2)
     * ┌──────────┬─────────┐
     * │ s        │ in_list │
     * ├──────────┼─────────┤
     * │ "apple"  │ true    │
     * │ "banana" │ true    │
     * │ "cherry" │ false   │
     * └──────────┴─────────┘
     */
    isIn(values: any[] | any) {
        return derive(this, (vArray, columns) => _computeIsIn(vArray, columns, values));
    }

    /**
     * Checks if values are positive or negative Infinity.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").isInfinite().alias("inf"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ inf   │
     * ├───┼───────┤
     * │ 1 │ false │
     * │ 2 │ false │
     * │ 3 │ false │
     * └───┴───────┘
     */
    isInfinite() {
        return derive(this, kleeneUnary((v) => v === Infinity || v === -Infinity));
    }


    /**
     * Checks if values are NaN.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").isNan().alias("nan"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ nan   │
     * ├───┼───────┤
     * │ 1 │ false │
     * │ 2 │ false │
     * │ 3 │ false │
     * └───┴───────┘
     */
    isNan() {
        return derive(this, kleeneUnary(Number.isNaN));
    }

    /**
     * Checks if values are not NaN.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").isNotNan().alias("not_nan"))
     * shape: (3, 2)
     * ┌───┬─────────┐
     * │ a │ not_nan │
     * ├───┼─────────┤
     * │ 1 │ true    │
     * │ 2 │ true    │
     * │ 3 │ true    │
     * └───┴─────────┘
     */
    isNotNan() {
        return (this as any).isNan().not();
    }

    /**
     * Checks if column values are non-null and valid (not null, undefined, or missing).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_nulls_3x2 -->
     * >>> df.withColumns($df.col("a").isNotNull().alias("valid"))
     * shape: (3, 2)
     * ┌──────┬───────┐
     * │ a    │ valid │
     * ├──────┼───────┤
     * │ 1    │ true  │
     * │ null │ false │
     * │ 3    │ true  │
     * └──────┴───────┘
     */
    isNotNull() {
        return (this as any).isNull().not();
    }

    /**
     * Checks if column values are null, undefined, or missing.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_nulls_3x2 -->
     * >>> df.withColumns($df.col("a").isNull().alias("missing"))
     * shape: (3, 2)
     * ┌──────┬─────────┐
     * │ a    │ missing │
     * ├──────┼─────────┤
     * │ 1    │ false   │
     * │ null │ true    │
     * │ 3    │ false   │
     * └──────┴─────────┘
     */
    isNull() {
        return this.eqMissing(null);
    }

    /**
     * Checks if values occur exactly once in the column.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").isUnique().alias("uniq"))
     * shape: (3, 2)
     * ┌───┬──────┐
     * │ a │ uniq │
     * ├───┼──────┤
     * │ 1 │ true │
     * │ 2 │ true │
     * │ 3 │ true │
     * └───┴──────┘
     */
    isUnique() {
        return (this as any).isDuplicated().not();
    }

    /**
     * Boolean comparison: Returns true if less than or equal to argument.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").le(2).alias("le_two"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ le_two │
     * ├───┼────────┤
     * │ 1 │ true   │
     * │ 2 │ true   │
     * │ 3 │ false  │
     * └───┴────────┘
     */
    le(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v <= r));
    }

    /**
     * Boolean comparison: Returns true if less than argument.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").lt(2).alias("lt_two"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ lt_two │
     * ├───┼────────┤
     * │ 1 │ true   │
     * │ 2 │ false  │
     * │ 3 │ false  │
     * └───┴────────┘
     */
    lt(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v < r));
    }

    /**
     * Boolean comparison: Returns true if values do not match.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").ne(2).alias("not_two"))
     * shape: (3, 2)
     * ┌───┬─────────┐
     * │ a │ not_two │
     * ├───┼─────────┤
     * │ 1 │ true    │
     * │ 2 │ false   │
     * │ 3 │ true    │
     * └───┴─────────┘
     */
    ne(val: any) {
        return derive(this, kleeneBinary(this, val, (v, r) => v !== r));
    }

    /**
     * Difference check that treats null values as equal to each other.
     * @param val The value or column expression to compare against.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_nulls_3x2 -->
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
     * <!-- doc:base_strings_3x1 -->
     * >>> df.withColumns($df.col("s").notIn(["apple", "banana"]).alias("not_in"))
     * shape: (3, 2)
     * ┌──────────┬────────┐
     * │ s        │ not_in │
     * ├──────────┼────────┤
     * │ "apple"  │ false  │
     * │ "banana" │ false  │
     * │ "cherry" │ true   │
     * └──────────┴────────┘
     */
    notIn(values: any[] | any) {
        return (this as any).isIn(values).not();
    }

}
