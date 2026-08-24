import { ExprBase, derive } from "../ExprBase"
import { kleeneUnary, kleeneBinary } from "../utils"
import { isArrayOrTypedArray } from "../../utils"

/**
 * @namespace $df.col
 * @category ColumnExpression
 * @syntax $df.col(<column_name>).{symbol}(...)
 */
export class LogicalExpr extends ExprBase {
    /**
     * Logical AND check supporting Kleene logic.
     * @param other The other boolean column expression or literal value to compare.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_bool_4x2 -->
     * >>> df.withColumns($df.col("a").and($df.col("b")).alias("and_res"))
     * shape: (4, 3)
     * ┌───────┬───────┬─────────┐
     * │ a     │ b     │ and_res │
     * ├───────┼───────┼─────────┤
     * │ true  │ true  │ true    │
     * │ true  │ false │ false   │
     * │ false │ false │ false   │
     * │ null  │ true  │ null    │
     * └───────┴───────┴─────────┘
     */
    and(other: any) {
        return derive(this, (vArray, columns) => {
            const height = vArray.length;
            const otherVal = this._resolve(other, columns, height);
            const isOtherArray = isArrayOrTypedArray(otherVal);
            const result = new Array(height);
            for (let i = 0; i < height; i++) {
                const v = vArray[i];
                const w = isOtherArray ? otherVal[i] : otherVal;
                if (v === false || w === false) result[i] = false;
                else if (v == null || w == null) result[i] = null;
                else result[i] = true;
            }
            return result;
        });
    }

    /**
     * Logical negation.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_bool_4x2 -->
     * >>> df.withColumns($df.col("a").not().alias("not_a"))
     * shape: (4, 3)
     * ┌───────┬───────┬───────┐
     * │ a     │ b     │ not_a │
     * ├───────┼───────┼───────┤
     * │ true  │ true  │ false │
     * │ true  │ false │ false │
     * │ false │ false │ true  │
     * │ null  │ true  │ null  │
     * └───────┴───────┴───────┘
     */
    not() {
        return derive(this, kleeneUnary((v) => !v));
    }

    /**
     * Logical OR check supporting Kleene logic.
     * @param other The other boolean column expression or literal value to compare.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_bool_4x2 -->
     * >>> df.withColumns($df.col("a").or($df.col("b")).alias("or_res"))
     * shape: (4, 3)
     * ┌───────┬───────┬────────┐
     * │ a     │ b     │ or_res │
     * ├───────┼───────┼────────┤
     * │ true  │ true  │ true   │
     * │ true  │ false │ true   │
     * │ false │ false │ false  │
     * │ null  │ true  │ true   │
     * └───────┴───────┴────────┘
     */
    or(other: any) {
        return derive(this, (vArray, columns) => {
            const height = vArray.length;
            const otherVal = this._resolve(other, columns, height);
            const isOtherArray = isArrayOrTypedArray(otherVal);
            const result = new Array(height);
            for (let i = 0; i < height; i++) {
                const v = vArray[i];
                const w = isOtherArray ? otherVal[i] : otherVal;
                if (v === true || w === true) result[i] = true;
                else if (v == null || w == null) result[i] = null;
                else result[i] = false;
            }
            return result;
        });
    }

    /**
     * Logical XOR check.
     * @param other The other boolean column expression or literal value to compare.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_bool_4x2 -->
     * >>> df.withColumns($df.col("a").xor($df.col("b")).alias("xor_res"))
     * shape: (4, 3)
     * ┌───────┬───────┬─────────┐
     * │ a     │ b     │ xor_res │
     * ├───────┼───────┼─────────┤
     * │ true  │ true  │ false   │
     * │ true  │ false │ true    │
     * │ false │ true  │ true    │
     * │ false │ false │ false   │
     * └───────┴───────┴─────────┘
     */
    xor(other: any) {
        return derive(this, kleeneBinary(this, other, (v, w) => !!v !== !!w));
    }
}
