import { ExprBase, derive } from "../ExprBase"
import { isArrayOrTypedArray, getArrayStats } from "../../utils"
import { InvalidArgumentError } from "../../exceptions"
import type { FillNullOptions } from "../../types"

/**
 * @namespace $df.col
 * @category ColumnExpression
 * @syntax $df.col(<column_name>).{symbol}(...)
 */
export class ManipulationExpr extends ExprBase {
        /**
         * Replaces null, undefined, or missing values with a specified value or strategy.
         * @param options Configuration options including fill value, strategy ("forward", "backward", "zero", "one", "mean", "min", "max"), and optional limit.
         * @returns ColumnExpression
         * @example
         * >>> const df = $df.data({
         * ...   a: [1, null, 3]
         * ... })
         * >>> df.withColumns($df.col("a").fillNull({ value: 0 }).alias("filled"))
         * shape: (3, 2)
         * ┌──────┬────────┐
         * │ a    │ filled │
         * ├──────┼────────┤
         * │ 1    │ 1      │
         * │ null │ 0      │
         * │ 3    │ 3      │
         * └──────┴────────┘
         */
        fillNull({
            value = undefined,
            strategy = undefined,
            limit = undefined
        }: FillNullOptions = {}): this {
            return derive(this, (vArray, columns) => {
                const height = vArray.length;
                const result = Array.from(vArray);

                if (strategy !== undefined) {
                    if (strategy === "zero" || strategy === "one" || strategy === "min" || strategy === "max" || strategy === "mean") {
                        const fillVal = strategy === "zero" ? 0
                            : strategy === "one" ? 1
                            : (getArrayStats(vArray) as any)[strategy];
                        for (let i = 0; i < height; i++) {
                            if (result[i] == null) result[i] = fillVal;
                        }
                    } else if (strategy === "forward") {
                        let lastVal: any = null;
                        let consec = 0;
                        for (let i = 0; i < height; i++) {
                            if (result[i] != null) {
                                lastVal = result[i];
                                consec = 0;
                            } else if (lastVal !== null && (limit === undefined || consec < limit)) {
                                result[i] = lastVal;
                                consec++;
                            }
                        }
                    } else if (strategy === "backward") {
                        let lastVal: any = null;
                        let consec = 0;
                        for (let i = height - 1; i >= 0; i--) {
                            if (result[i] != null) {
                                lastVal = result[i];
                                consec = 0;
                            } else if (lastVal !== null && (limit === undefined || consec < limit)) {
                                result[i] = lastVal;
                                consec++;
                            }
                        }
                    } else {
                        throw new InvalidArgumentError(`Unsupported fillNull strategy: "${strategy}"`);
                    }
                } else {
                    const resolved = this._resolve(value, columns, height);
                    const isArr = isArrayOrTypedArray(resolved);
                    for (let i = 0; i < height; i++) {
                        if (result[i] == null) {
                            result[i] = isArr ? resolved[i] : resolved;
                        }
                    }
                }
                return result;
            }) as this;
        }

        /**
         * Reverses the order of values in the column.
         * @returns ColumnExpression
         * @example
         * >>> const df = $df.data({
         * ...   a: [1, 2, 3]
         * ... })
         * >>> df.withColumns($df.col("a").reverse().alias("reversed"))
         * shape: (3, 2)
         * ┌───┬──────────┐
         * │ a │ reversed │
         * ├───┼──────────┤
         * │ 1 │ 3        │
         * │ 2 │ 2        │
         * │ 3 │ 1        │
         * └───┴──────────┘
         */
        reverse(): this {
            return derive(this, (vArray) => {
                return (vArray as any).slice().reverse();
            }) as this;
        }
}
