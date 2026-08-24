import type { AggFn, UniqueArrayStatsOptions, SkewOptions, KurtosisOptions, EntropyOptions } from "../../types"

import { ExprBase, derive } from "../ExprBase"
import { kleeneBinary } from "../utils"
import { ComputeError } from "../../exceptions"
import {
    getArrayStats,
    computeQuantile,
    getUniqueArrayStats,
    computeMode,
    isArrayOfType,
    computeStatisticalMatrix,
    computeDotProduct,
    computeSpearmanCorrelation,
    computeWeightedAverage,
    computeSkewness,
    computeKurtosis,
    computeEntropy,
    reduceBitwise,
    computeBy
} from "../../utils"


/**
 * @namespace $df.col
 * @category ColumnExpression
 * @syntax $df.col(<column_name>).{symbol}(...)
 */
export class AggregationExpr extends ExprBase {

    _deriveAgg(fn: AggFn<any>) {
        const newInst = derive(this);
        newInst._aggFn = fn;
        newInst._groupingOpsIndex = this._ops.length;
        newInst._partitionOpsIndex = this._ops.length;
        return newInst;
    }

    _deriveAggBinary(other: any, fn: AggFn<[any, any]>) {
        const result = derive(this, kleeneBinary(this, other, (x, y) => [x, y]))._deriveAgg(fn);
        result._binaryMeta = undefined;
        return result;
    }

    /**
     * Aggregation: Returns true if all values in the group are truthy.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_bool_4x2 -->
     * >>> df.select($df.col("a").all().alias("all_true"))
     * shape: (1, 1)
     * ┌──────────┐
     * │ all_true │
     * ├──────────┤
     * │ false    │
     * └──────────┘
     */
    all() {
        return this._deriveAgg(v => isArrayOfType(v, (x) => !!x, { mode: "every" }));
    }

    /**
     * Aggregation: Checks if all values in the group are null.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_nulls_3x2 -->
     * >>> df.select($df.col("a").allNull().alias("all_null"))
     * shape: (1, 1)
     * ┌──────────┐
     * │ all_null │
     * ├──────────┤
     * │ false    │
     * └──────────┘
     */
    allNull() {
        return this._deriveAgg(v => isArrayOfType(v, "nullish", { mode: "every" }));
    }

    /**
     * Aggregation: Checks if any value in the group is truthy.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_bool_4x2 -->
     * >>> df.select($df.col("a").any().alias("any_true"))
     * shape: (1, 1)
     * ┌──────────┐
     * │ any_true │
     * ├──────────┤
     * │ true     │
     * └──────────┘
     */
    any() {
        return this._deriveAgg(v => isArrayOfType(v, (x) => !!x, { mode: "some" }));
    }

    /**
     * Aggregation: Checks if any value in the group is null.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_nulls_3x2 -->
     * >>> df.select($df.col("a").anyNull().alias("has_null"))
     * shape: (1, 1)
     * ┌──────────┐
     * │ has_null │
     * ├──────────┤
     * │ true     │
     * └──────────┘
     */
    anyNull() {
        return this._deriveAgg(v => isArrayOfType(v, "nullish", { mode: "some" }));
    }

    /**
     * Aggregation: Finds the index of the maximum value in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("val").argMax().alias("max_idx"))
     * shape: (1, 1)
     * ┌─────────┐
     * │ max_idx │
     * ├─────────┤
     * │ 2       │
     * └─────────┘
     */
    argMax() {
        return this._deriveAgg(v => getArrayStats(v).maxIdx);
    }

    /**
     * Aggregation: Finds the index of the minimum value in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("val").argMin().alias("min_idx"))
     * shape: (1, 1)
     * ┌─────────┐
     * │ min_idx │
     * ├─────────┤
     * │ 0       │
     * └─────────┘
     */
    argMin() {
        return this._deriveAgg(v => getArrayStats(v).minIdx);
    }

    /**
     * Aggregation: Computes the arithmetic mean of the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").avg().alias("mean"))
     * shape: (2, 2)
     * ┌───────┬──────┐
     * │ group │ mean │
     * ├───────┼──────┤
     * │ A     │ 15   │
     * │ B     │ 30   │
     * └───────┴──────┘
     */
    avg() {
        return this._deriveAgg(v => getArrayStats(v).mean);
    }

    /**
     * Aggregation: Computes bitwise AND across all elements in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("a").bitwiseAnd().alias("res"))
     * shape: (1, 1)
     * ┌─────┐
     * │ res │
     * ├─────┤
     * │ 0   │
     * └─────┘
     */
    bitwiseAnd() {
        return this._deriveAgg(v => reduceBitwise(v, (a, b) => a & b));
    }

    /**
     * Aggregation: Computes bitwise OR across all elements in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("a").bitwiseOr().alias("res"))
     * shape: (1, 1)
     * ┌─────┐
     * │ res │
     * ├─────┤
     * │ 3   │
     * └─────┘
     */
    bitwiseOr() {
        return this._deriveAgg(v => reduceBitwise(v, (a, b) => a | b));
    }

    /**
     * Aggregation: Computes bitwise XOR across all elements in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("a").bitwiseXor().alias("res"))
     * shape: (1, 1)
     * ┌─────┐
     * │ res │
     * ├─────┤
     * │ 0   │
     * └─────┘
     */
    bitwiseXor() {
        return this._deriveAgg(v => reduceBitwise(v, (a, b) => a ^ b));
    }

    /**
     * Aggregation: Computes the Pearson correlation coefficient between two columns.
     * @param other The target column expression to correlate with.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.select($df.col("a").corr($df.col("b")).alias("correlation"))
     * shape: (1, 1)
     * ┌─────────────┐
     * │ correlation │
     * ├─────────────┤
     * │ 1           │
     * └─────────────┘
     */
    corr(other: any) {
        return this._deriveAggBinary(other, pairs => computeStatisticalMatrix(pairs)?.correlation ?? null);
    }

    /**
     * Aggregation: Returns the count of records inside the group.
     * @param options Config flags including whether to count null values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").count().alias("cnt"))
     * shape: (2, 2)
     * ┌───────┬─────┐
     * │ group │ cnt │
     * ├───────┼─────┤
     * │ A     │ 2   │
     * │ B     │ 1   │
     * └───────┴─────┘
     */
    count(options: { includeNulls?: boolean } = {}) {
        if (options.includeNulls) return this._deriveAgg(v => v.length);
        return this._deriveAgg(v => getArrayStats(v).count);
    }

    /**
     * Aggregation: Computes the covariance between two columns.
     * @param other The target column expression to compute covariance with.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.select($df.col("a").cov($df.col("b")).alias("covariance"))
     * shape: (1, 1)
     * ┌────────────┐
     * │ covariance │
     * ├────────────┤
     * │ 10         │
     * └────────────┘
     */
    cov(other: any) {
        return this._deriveAggBinary(other, pairs => computeStatisticalMatrix(pairs)?.covariance ?? null);
    }

    /**
     * Aggregation: Computes the dot product with another column.
     * @param other The other column expression to compute the dot product with.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.select($df.col("a").dot($df.col("b")).alias("dot_product"))
     * shape: (1, 1)
     * ┌─────────────┐
     * │ dot_product │
     * ├─────────────┤
     * │ 140         │
     * └─────────────┘
     */
    dot(other: any) {
        return this._deriveAggBinary(other, pairs => computeDotProduct(pairs));
    }

    /**
     * Aggregation: Computes the Shannon entropy of a column or group.
     * @param options Entropy options ({ base?: number, normalize?: boolean }, default base=Math.E, normalize=true).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("a").entropy().alias("h"))
     * shape: (1, 1)
     * ┌──────────┐
     * │ h        │
     * ├──────────┤
     * │ 1.386294 │
     * └──────────┘
     */
    entropy(options: EntropyOptions = { base: Math.E, normalize: true }) {
        return this._deriveAgg(v => computeEntropy(v, options));
    }

    /**
     * Aggregation: Finds the first value in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").first().alias("first_val"))
     * shape: (2, 2)
     * ┌───────┬───────────┐
     * │ group │ first_val │
     * ├───────┼───────────┤
     * │ A     │ 10        │
     * │ B     │ 30        │
     * └───────┴───────────┘
     */
    first() {
        return this._deriveAgg(v => v[0] ?? null);
    }

    /**
     * Aggregation: Combines all values in the group into a single array/list cell.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").implode().alias("list_val"))
     * shape: (2, 2)
     * ┌───────┬──────────┐
     * │ group │ list_val │
     * ├───────┼──────────┤
     * │ A     │ [10, 20] │
     * │ B     │ [30]     │
     * └───────┴──────────┘
     */
    implode() {
        return this._deriveAgg(v => v);
    }

    /**
     * Aggregation: Computes the kurtosis (peakedness/tailedness) of a numeric column.
     * @param options Kurtosis calculation options ({ fisher?: boolean, bias?: boolean }, default fisher=true, bias=true).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("a").kurtosis().alias("kurt"))
     * shape: (1, 1)
     * ┌───────┐
     * │ kurt  │
     * ├───────┤
     * │ -1.36 │
     * └───────┘
     */
    kurtosis(options: KurtosisOptions = {}) {
        return this._deriveAgg(v => computeKurtosis(v, options));
    }

    /**
     * Aggregation: Finds the last value in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").last().alias("last_val"))
     * shape: (2, 2)
     * ┌───────┬──────────┐
     * │ group │ last_val │
     * ├───────┼──────────┤
     * │ A     │ 20       │
     * │ B     │ 30       │
     * └───────┴──────────┘
     */
    last() {
        return this._deriveAgg(v => v[v.length - 1] ?? null);
    }

    /**
     * Aggregation: Finds the maximum value in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").max().alias("max_val"))
     * shape: (2, 2)
     * ┌───────┬─────────┐
     * │ group │ max_val │
     * ├───────┼─────────┤
     * │ A     │ 20      │
     * │ B     │ 30      │
     * └───────┴─────────┘
     */
    max() {
        return this._deriveAgg(v => getArrayStats(v).max);
    }

    /**
     * Aggregation: Finds the value in this column corresponding to the maximum value in the `by` expression.
     * @param by Column or expression to order by.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.select($df.col("group").maxBy($df.col("val")).alias("top_group"))
     * shape: (1, 1)
     * ┌───────────┐
     * │ top_group │
     * ├───────────┤
     * │ B         │
     * └───────────┘
     */
    maxBy(by: any) {
        return this._deriveAggBinary(by, p => computeBy(p, "maxIdx"));
    }

    /**
     * Aggregation: Computes the arithmetic mean of elements in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").mean().alias("mean_val"))
     * shape: (2, 2)
     * ┌───────┬──────────┐
     * │ group │ mean_val │
     * ├───────┼──────────┤
     * │ A     │ 15       │
     * │ B     │ 30       │
     * └───────┴──────────┘
     */
    mean() {
        return this.avg();
    }

    /**
     * Aggregation: Computes the 50th percentile median.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").median().alias("med"))
     * shape: (2, 2)
     * ┌───────┬─────┐
     * │ group │ med │
     * ├───────┼─────┤
     * │ A     │ 15  │
     * │ B     │ 30  │
     * └───────┴─────┘
     */
    median() {
        return this._deriveAgg(v => computeQuantile(v, 0.5));
    }

    /**
     * Aggregation: Finds the minimum value in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").min().alias("min_val"))
     * shape: (2, 2)
     * ┌───────┬─────────┐
     * │ group │ min_val │
     * ├───────┼─────────┤
     * │ A     │ 10      │
     * │ B     │ 30      │
     * └───────┴─────────┘
     */
    min() {
        return this._deriveAgg(v => getArrayStats(v).min);
    }

    /**
     * Aggregation: Finds the value in this column corresponding to the minimum value in the `by` expression.
     * @param by Column or expression to order by.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.select($df.col("group").minBy($df.col("val")).alias("lowest_group"))
     * shape: (1, 1)
     * ┌──────────────┐
     * │ lowest_group │
     * ├──────────────┤
     * │ A            │
     * └──────────────┘
     */
    minBy(by: any) {
        return this._deriveAggBinary(by, p => computeBy(p, "minIdx"));
    }

    /**
     * Aggregation: Finds the statistical mode (most frequent value).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.select($df.col("group").mode().alias("mode_group"))
     * shape: (1, 1)
     * ┌────────────┐
     * │ mode_group │
     * ├────────────┤
     * │ ["A"]      │
     * └────────────┘
     */
    mode() {
        return this._deriveAgg(v => computeMode(v));
    }

    /**
     * Aggregation: Computes number of unique elements.
     * @param options Uniqueness options.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.select($df.col("group").nUnique().alias("unique_cnt"))
     * shape: (1, 1)
     * ┌────────────┐
     * │ unique_cnt │
     * ├────────────┤
     * │ 2          │
     * └────────────┘
     */
    nUnique(options: UniqueArrayStatsOptions = {}) {
        return this._deriveAgg(v => getUniqueArrayStats(v, options).count);
    }

    /**
     * Aggregation: Finds the maximum value in the group, taking NaN values into account (NaN propagates).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("val").nanMax().alias("nan_max_val"))
     * shape: (1, 1)
     * ┌─────────────┐
     * │ nan_max_val │
     * ├─────────────┤
     * │ 30          │
     * └─────────────┘
     */
    nanMax() {
        return this._deriveAgg(v => getArrayStats(v).nanMax);
    }

    /**
     * Aggregation: Finds the minimum value in the group, taking NaN values into account (NaN propagates).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("val").nanMin().alias("nan_min_val"))
     * shape: (1, 1)
     * ┌─────────────┐
     * │ nan_min_val │
     * ├─────────────┤
     * │ 10          │
     * └─────────────┘
     */
    nanMin() {
        return this._deriveAgg(v => getArrayStats(v).nanMin);
    }

    /**
     * Aggregation: Counts the number of null or missing records.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_nulls_3x2 -->
     * >>> df.select($df.col("a").nullCount().alias("nulls"))
     * shape: (1, 1)
     * ┌───────┐
     * │ nulls │
     * ├───────┤
     * │ 1     │
     * └───────┘
     */
    nullCount() {
        return this._deriveAgg(v => getArrayStats(v).nullCount);
    }

    /**
     * Aggregation: Computes the specific quantile values (0.0 to 1.0).
     * @param q The quantile parameter value between 0.0 and 1.0.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("a").quantile(0.75).alias("q75"))
     * shape: (1, 1)
     * ┌──────┐
     * │ q75  │
     * ├──────┤
     * │ 3.25 │
     * └──────┘
     */
    quantile(q: number) {
        if (q < 0 || q > 1) throw new ComputeError("Quantile q must be between 0 and 1");
        return this._deriveAgg(v => computeQuantile(v, q));
    }

    /**
     * Aggregation: Computes the product of all elements in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").product().alias("p"))
     * shape: (2, 2)
     * ┌───────┬─────┐
     * │ group │ p   │
     * ├───────┼─────┤
     * │ A     │ 200 │
     * │ B     │ 30  │
     * └───────┴─────┘
     */
    product() {
        return this._deriveAgg(v => getArrayStats(v).product);
    }

    /**
     * Aggregation: Computes the sample skewness as the Fisher-Pearson coefficient of skewness.
     * @param options Skew calculation options ({ bias?: boolean }, default bias=true).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("a").skew().alias("skewness"))
     * shape: (1, 1)
     * ┌──────────┐
     * │ skewness │
     * ├──────────┤
     * │ 0        │
     * └──────────┘
     */
    skew(options: SkewOptions = {}) {

        return this._deriveAgg(v => computeSkewness(v, options));
    }

    /**
     * Aggregation: Computes the Spearman rank correlation coefficient.
     * @param other The other column expression to correlate with.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.select($df.col("a").spearmanCorr($df.col("b")).alias("spearman"))
     * shape: (1, 1)
     * ┌──────────┐
     * │ spearman │
     * ├──────────┤
     * │ 1        │
     * └──────────┘
     */
    spearmanCorr(other: any) {
        return this._deriveAggBinary(other, pairs => computeSpearmanCorrelation(pairs));
    }

    /**
     * Aggregation: Computes sample standard deviation.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("val").std().alias("std_dev"))
     * shape: (1, 1)
     * ┌─────────┐
     * │ std_dev │
     * ├─────────┤
     * │ 10      │
     * └─────────┘
     */
    std() {
        return this._deriveAgg(v => getArrayStats(v).std);
    }

    /**
     * Aggregation: Computes the sum of elements in the group.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_grouped_3x2 -->
     * >>> df.groupBy("group").agg($df.col("val").sum().alias("total"))
     * shape: (2, 2)
     * ┌───────┬───────┐
     * │ group │ total │
     * ├───────┼───────┤
     * │ A     │ 30    │
     * │ B     │ 30    │
     * └───────┴───────┘
     */
    sum() {
        return this._deriveAgg(v => getArrayStats(v).sum);
    }

    /**
     * Aggregation: Computes sample variance.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.select($df.col("val").variance().alias("v"))
     * shape: (1, 1)
     * ┌─────┐
     * │ v   │
     * ├─────┤
     * │ 100 │
     * └─────┘
     */
    variance() {
        return this._deriveAgg(v => getArrayStats(v).variance);
    }

    /**
     * Aggregation: Computes weighted average.
     * @param weights The weight values or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.select($df.col("a").wAvg($df.col("b")).alias("w_mean"))
     * shape: (1, 1)
     * ┌──────────┐
     * │ w_mean   │
     * ├──────────┤
     * │ 2.333333 │
     * └──────────┘
     */
    wAvg(weights: any) {
        return this._deriveAggBinary(weights, pairs => computeWeightedAverage(pairs));
    }
}



