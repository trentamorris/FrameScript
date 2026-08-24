import type { RandomOptions, NumericArg } from "../types"
import { ExprBase, derive } from "../ExprBase"
import { kleeneUnary, kleeneBinary } from "../utils"
import { clamp, isValidNumber, mulberry32, roundToScale } from "../../utils"

/**
 * @namespace $df.col
 * @category ColumnExpression
 * @syntax $df.col(<column_name>).{symbol}(...)
 */
export class ArithmeticExpr extends ExprBase {
    /**
     * Computes the absolute value of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").abs().alias("abs_a"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ abs_a │
     * ├───┼───────┤
     * │ 1 │ 1     │
     * │ 2 │ 2     │
     * │ 3 │ 3     │
     * └───┴───────┘
     */
    abs() {
        return derive(this, kleeneUnary(Math.abs));
    }

    /**
     * Computes the mathematical arccosine (inverse cosine) of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").acos().alias("acos_a"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ acos_a │
     * ├───┼────────┤
     * │ 1 │ 0      │
     * │ 2 │ null   │
     * │ 3 │ null   │
     * └───┴────────┘
     */
    acos() {
        return derive(this, kleeneUnary((v) => (v < -1 || v > 1) ? null : Math.acos(v)));
    }

    /**
     * Computes the hyperbolic arccosine of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").acosh().alias("acosh_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ acosh_a  │
     * ├───┼──────────┤
     * │ 1 │ 0        │
     * │ 2 │ 1.316958 │
     * │ 3 │ 1.762747 │
     * └───┴──────────┘
     */
    acosh() {
        return derive(this, kleeneUnary((v) => v < 1 ? null : Math.acosh(v)));
    }

    /**
     * Adds a scalar value or another column expression.
     * @param val The number or column expression to add.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").add(10).alias("added"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ added │
     * ├───┼───────┤
     * │ 1 │ 11    │
     * │ 2 │ 12    │
     * │ 3 │ 13    │
     * └───┴───────┘
     */
    add(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, (v, r) => v + r));
    }

    /**
     * Computes the arcsine of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").asin().alias("asin_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ asin_a   │
     * ├───┼──────────┤
     * │ 1 │ 1.570796 │
     * │ 2 │ null     │
     * │ 3 │ null     │
     * └───┴──────────┘
     */
    asin() {
        return derive(this, kleeneUnary((v) => (v < -1 || v > 1) ? null : Math.asin(v)));
    }

    /**
     * Computes the hyperbolic arcsine of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").asinh().alias("asinh_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ asinh_a  │
     * ├───┼──────────┤
     * │ 1 │ 0.881374 │
     * │ 2 │ 1.443635 │
     * │ 3 │ 1.818446 │
     * └───┴──────────┘
     */
    asinh() {
        return derive(this, kleeneUnary(Math.asinh));
    }

    /**
     * Computes the arctangent of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").atan().alias("atan_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ atan_a   │
     * ├───┼──────────┤
     * │ 1 │ 0.785398 │
     * │ 2 │ 1.107149 │
     * │ 3 │ 1.249046 │
     * └───┴──────────┘
     */
    atan() {
        return derive(this, kleeneUnary(Math.atan));
    }

    /**
     * Computes the quadrant-aware arctangent of two values.
     * @param val The x denominator number or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.withColumns($df.col("a").atan2($df.col("b")).alias("atan2_a"))
     * shape: (3, 3)
     * ┌───┬────┬──────────┐
     * │ a │ b  │ atan2_a  │
     * ├───┼────┼──────────┤
     * │ 1 │ 10 │ 0.099669 │
     * │ 2 │ 20 │ 0.099669 │
     * │ 3 │ 30 │ 0.099669 │
     * └───┴────┴──────────┘
     */
    atan2(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, Math.atan2));
    }

    /**
     * Computes the hyperbolic arctangent of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").atanh().alias("atanh_a"))
     * shape: (3, 2)
     * ┌───┬─────────┐
     * │ a │ atanh_a │
     * ├───┼─────────┤
     * │ 1 │ null    │
     * │ 2 │ null    │
     * │ 3 │ null    │
     * └───┴─────────┘
     */
    atanh() {
        return derive(this, kleeneUnary((v) => (v <= -1 || v >= 1) ? null : Math.atanh(v)));
    }

    /**
     * Computes the cube root of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").cbrt().alias("cbrt_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ cbrt_a   │
     * ├───┼──────────┤
     * │ 1 │ 1        │
     * │ 2 │ 1.259921 │
     * │ 3 │ 1.44225  │
     * └───┴──────────┘
     */
    cbrt() {
        return derive(this, kleeneUnary(Math.cbrt));
    }

    /**
     * Rounds column values up to the nearest integer.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").ceil().alias("ceil_a"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ ceil_a │
     * ├───┼────────┤
     * │ 1 │ 1      │
     * │ 2 │ 2      │
     * │ 3 │ 3      │
     * └───┴────────┘
     */
    ceil() {
        return derive(this, kleeneUnary(Math.ceil));
    }

    /**
     * Clamps column values between lower and upper numeric thresholds.
     * @param lower The lower threshold value (default: null).
     * @param upper The upper threshold value (default: null).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").clip(2, 3).alias("clipped"))
     * shape: (3, 2)
     * ┌───┬─────────┐
     * │ a │ clipped │
     * ├───┼─────────┤
     * │ 1 │ 2       │
     * │ 2 │ 2       │
     * │ 3 │ 3       │
     * └───┴─────────┘
     */
    clip(lower: number | null = null, upper: number | null = null) {
        return derive(this, kleeneUnary((v) => clamp(v, { min: lower, max: upper })));
    }

    /**
     * Returns absolute value of expr with the sign of other.
     * @param val The sign source value or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.withColumns($df.col("a").copysign($df.col("b")).alias("signed"))
     * shape: (3, 3)
     * ┌───┬────┬────────┐
     * │ a │ b  │ signed │
     * ├───┼────┼────────┤
     * │ 1 │ 10 │ 1      │
     * │ 2 │ 20 │ 2      │
     * │ 3 │ 30 │ 3      │
     * └───┴────┴────────┘
     */
    copysign(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, (v, r) => Math.abs(v) * (r >= 0 ? 1 : -1)));
    }

    /**
     * Computes the cosine of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").cos().alias("cos_a"))
     * shape: (3, 2)
     * ┌───┬───────────┐
     * │ a │ cos_a     │
     * ├───┼───────────┤
     * │ 1 │ 0.540302  │
     * │ 2 │ -0.416147 │
     * │ 3 │ -0.989992 │
     * └───┴───────────┘
     */
    cos() {
        return derive(this, kleeneUnary(Math.cos));
    }

    /**
     * Computes the hyperbolic cosine of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").cosh().alias("cosh_a"))
     * shape: (3, 2)
     * ┌───┬───────────┐
     * │ a │ cosh_a    │
     * ├───┼───────────┤
     * │ 1 │ 1.543081  │
     * │ 2 │ 3.762196  │
     * │ 3 │ 10.067662 │
     * └───┴───────────┘
     */
    cosh() {
        return derive(this, kleeneUnary(Math.cosh));
    }

    /**
     * Converts angles from radians to degrees.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").degrees().alias("deg"))
     * shape: (3, 2)
     * ┌───┬────────────┐
     * │ a │ deg        │
     * ├───┼────────────┤
     * │ 1 │ 57.29578   │
     * │ 2 │ 114.591559 │
     * │ 3 │ 171.887339 │
     * └───┴────────────┘
     */
    degrees() {
        return derive(this, kleeneUnary((v) => v * (180 / Math.PI)));
    }

    /**
     * Divides column values by a scalar or another column expression.
     * @param val The denominator value or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").div(2).alias("div_a"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ div_a │
     * ├───┼───────┤
     * │ 1 │ 0.5   │
     * │ 2 │ 1     │
     * │ 3 │ 1.5   │
     * └───┴───────┘
     */
    div(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, (v, r) => r === 0 ? null : v / r));
    }

    /**
     * Computes natural exponent (e^x) of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").exp().alias("exp_a"))
     * shape: (3, 2)
     * ┌───┬───────────┐
     * │ a │ exp_a     │
     * ├───┼───────────┤
     * │ 1 │ 2.718282  │
     * │ 2 │ 7.389056  │
     * │ 3 │ 20.085537 │
     * └───┴───────────┘
     */
    exp() {
        return derive(this, kleeneUnary(Math.exp));
    }

    /**
     * Computes e^x - 1 for each element in the column.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").expm1().alias("expm1_a"))
     * shape: (3, 2)
     * ┌───┬───────────┐
     * │ a │ expm1_a   │
     * ├───┼───────────┤
     * │ 1 │ 1.718282  │
     * │ 2 │ 6.389056  │
     * │ 3 │ 19.085537 │
     * └───┴───────────┘
     */
    expm1() {
        return derive(this, kleeneUnary(Math.expm1));
    }

    /**
     * Rounds column values down to the nearest integer.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").floor().alias("floor_a"))
     * shape: (3, 2)
     * ┌───┬─────────┐
     * │ a │ floor_a │
     * ├───┼─────────┤
     * │ 1 │ 1       │
     * │ 2 │ 2       │
     * │ 3 │ 3       │
     * └───┴─────────┘
     */
    floor() {
        return derive(this, kleeneUnary(Math.floor));
    }

    /**
     * Performs integer division floor(x / y) on column values.
     * @param val The divisor value or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").floordiv(2).alias("fdiv"))
     * shape: (3, 2)
     * ┌───┬──────┐
     * │ a │ fdiv │
     * ├───┼──────┤
     * │ 1 │ 0    │
     * │ 2 │ 1    │
     * │ 3 │ 1    │
     * └───┴──────┘
     */
    floordiv(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, (v, r) => r === 0 ? null : Math.floor(v / r)));
    }

    /**
     * Computes the hypotenuse sqrt(x^2 + y^2) of two values.
     * @param val The other numeric value or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x2 -->
     * >>> df.withColumns($df.col("a").hypot($df.col("b")).alias("hypot_a"))
     * shape: (3, 3)
     * ┌───┬────┬───────────┐
     * │ a │ b  │ hypot_a   │
     * ├───┼────┼───────────┤
     * │ 1 │ 10 │ 10.049876 │
     * │ 2 │ 20 │ 20.099751 │
     * │ 3 │ 30 │ 30.149627 │
     * └───┴────┴───────────┘
     */
    hypot(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, Math.hypot));
    }

    /**
     * Computes the logarithm of positive values with a specified base.
     * @param base The base of the logarithm (default: Math.E).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").log(10).alias("log_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ log_a    │
     * ├───┼──────────┤
     * │ 1 │ 0        │
     * │ 2 │ 0.30103  │
     * │ 3 │ 0.477121 │
     * └───┴──────────┘
     */
    log(base: number = Math.E) {
        return derive(this, kleeneUnary((v) => v <= 0 ? null : (base === Math.E ? Math.log(v) : Math.log(v) / Math.log(base))));
    }

    /**
     * Computes natural logarithm of 1 + x.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").log1p().alias("log1p_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ log1p_a  │
     * ├───┼──────────┤
     * │ 1 │ 0.693147 │
     * │ 2 │ 1.098612 │
     * │ 3 │ 1.386294 │
     * └───┴──────────┘
     */
    log1p() {
        return derive(this, kleeneUnary((v) => v <= -1 ? null : Math.log1p(v)));
    }

    /**
     * Computes modulo remainder (x % y) of column values.
     * @param val The divisor value or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").mod(2).alias("mod_a"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ mod_a │
     * ├───┼───────┤
     * │ 1 │ 1     │
     * │ 2 │ 0     │
     * │ 3 │ 1     │
     * └───┴───────┘
     */
    mod(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, (v, r) => r === 0 ? null : v % r));
    }

    /**
     * Multiplies column values by a scalar or another column expression.
     * @param val The multiplier value or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").mul(5).alias("multiplied"))
     * shape: (3, 2)
     * ┌───┬────────────┐
     * │ a │ multiplied │
     * ├───┼────────────┤
     * │ 1 │ 5          │
     * │ 2 │ 10         │
     * │ 3 │ 15         │
     * └───┴────────────┘
     */
    mul(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, (v, r) => v * r));
    }

    /**
     * Negates column values (-x).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").negate().alias("negated"))
     * shape: (3, 2)
     * ┌───┬─────────┐
     * │ a │ negated │
     * ├───┼─────────┤
     * │ 1 │ -1      │
     * │ 2 │ -2      │
     * │ 3 │ -3      │
     * └───┴─────────┘
     */
    negate() {
        return derive(this, kleeneUnary((v) => -v));
    }

    /**
     * Raises column values to the specified power.
     * @param val The exponent power value or column expression.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").pow(2).alias("pow_a"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ pow_a │
     * ├───┼───────┤
     * │ 1 │ 1     │
     * │ 2 │ 4     │
     * │ 3 │ 9     │
     * └───┴───────┘
     */
    pow(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, Math.pow));
    }

    /**
     * Converts angles from degrees to radians.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").radians().alias("rad"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ rad      │
     * ├───┼──────────┤
     * │ 1 │ 0.017453 │
     * │ 2 │ 0.034907 │
     * │ 3 │ 0.05236  │
     * └───┴──────────┘
     */
    radians() {
        return derive(this, kleeneUnary((v) => v * (Math.PI / 180)));
    }

    /**
     * Fills sequence with pseudo-random generated floats or integers.
     * @param seed Optional seed to initialize the pseudo-random generator.
     * @param options Config options including min, max, and integer flag.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").rand(42, { min: 1, max: 10, integer: true }).alias("random"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ random │
     * ├───┼────────┤
     * │ 1 │ 7      │
     * │ 2 │ 8      │
     * │ 3 │ 6      │
     * └───┴────────┘
     */
    rand(seed?: number, { min = 0, max = 1, integer = false }: RandomOptions = {}) {
        return derive(this, (vArray) => {
            const len = vArray.length;
            const out = new Float64Array(len);
            const rnd = seed !== undefined ? mulberry32(seed) : Math.random;
            const range = max - min;

            for (let i = 0; i < len; i++) {
                const raw = rnd();
                out[i] = integer ? Math.floor(raw * (range + 1)) + min : raw * range + min;
            }
            return out;
        });
    }

    /**
     * Rounds values to a specific scale of decimal digits.
     * @param decimals Number of decimal places to round to (default: 0).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").round(1).alias("rounded"))
     * shape: (3, 2)
     * ┌───┬─────────┐
     * │ a │ rounded │
     * ├───┼─────────┤
     * │ 1 │ 1       │
     * │ 2 │ 2       │
     * │ 3 │ 3       │
     * └───┴─────────┘
     */
    round(decimals: number = 0) {
        return derive(this, kleeneUnary((v) => roundToScale(v, decimals)));
    }

    /**
     * Rounds values to a specific number of significant figures.
     * @param sigFigs Number of significant figures.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").roundSigFigs(2).alias("sig_figs"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ sig_figs │
     * ├───┼──────────┤
     * │ 1 │ 1        │
     * │ 2 │ 2        │
     * │ 3 │ 3        │
     * └───┴──────────┘
     */
    roundSigFigs(sigFigs: number) {
        return derive(this, kleeneUnary((v) => isValidNumber(v) ? Number(v.toPrecision(sigFigs)) : v));
    }

    /**
     * Returns sign indicator of column values (-1, 0, or 1).
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").sign().alias("sign_a"))
     * shape: (3, 2)
     * ┌───┬────────┐
     * │ a │ sign_a │
     * ├───┼────────┤
     * │ 1 │ 1      │
     * │ 2 │ 1      │
     * │ 3 │ 1      │
     * └───┴────────┘
     */
    sign() {
        return derive(this, kleeneUnary(Math.sign));
    }

    /**
     * Computes the sine of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").sin().alias("sin_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ sin_a    │
     * ├───┼──────────┤
     * │ 1 │ 0.841471 │
     * │ 2 │ 0.909297 │
     * │ 3 │ 0.14112  │
     * └───┴──────────┘
     */
    sin() {
        return derive(this, kleeneUnary(Math.sin));
    }

    /**
     * Computes the hyperbolic sine of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").sinh().alias("sinh_a"))
     * shape: (3, 2)
     * ┌───┬───────────┐
     * │ a │ sinh_a    │
     * ├───┼───────────┤
     * │ 1 │ 1.175201  │
     * │ 2 │ 3.62686   │
     * │ 3 │ 10.017875 │
     * └───┴───────────┘
     */
    sinh() {
        return derive(this, kleeneUnary(Math.sinh));
    }

    /**
     * Computes the square root of non-negative column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").sqrt().alias("sqrt_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ sqrt_a   │
     * ├───┼──────────┤
     * │ 1 │ 1        │
     * │ 2 │ 1.414214 │
     * │ 3 │ 1.732051 │
     * └───┴──────────┘
     */
    sqrt() {
        return derive(this, kleeneUnary((v) => v < 0 ? null : Math.sqrt(v)));
    }

    /**
     * Subtracts a scalar or another column expression.
     * @param val The value or column expression to subtract.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").sub(5).alias("sub_a"))
     * shape: (3, 2)
     * ┌───┬───────┐
     * │ a │ sub_a │
     * ├───┼───────┤
     * │ 1 │ -4    │
     * │ 2 │ -3    │
     * │ 3 │ -2    │
     * └───┴───────┘
     */
    sub(val: NumericArg) {
        return derive(this, kleeneBinary(this, val, (v, r) => v - r));
    }

    /**
     * Computes the tangent of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").tan().alias("tan_a"))
     * shape: (3, 2)
     * ┌───┬───────────┐
     * │ a │ tan_a     │
     * ├───┼───────────┤
     * │ 1 │ 1.557408  │
     * │ 2 │ -2.18504  │
     * │ 3 │ -0.142547 │
     * └───┴───────────┘
     */
    tan() {
        return derive(this, kleeneUnary(Math.tan));
    }

    /**
     * Computes the hyperbolic tangent of the column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").tanh().alias("tanh_a"))
     * shape: (3, 2)
     * ┌───┬──────────┐
     * │ a │ tanh_a   │
     * ├───┼──────────┤
     * │ 1 │ 0.761594 │
     * │ 2 │ 0.964028 │
     * │ 3 │ 0.995055 │
     * └───┴──────────┘
     */
    tanh() {
        return derive(this, kleeneUnary(Math.tanh));
    }

    /**
     * Truncates fractional digits of column values.
     * @returns ColumnExpression
     * @example
     * <!-- doc:base_numbers_3x1 -->
     * >>> df.withColumns($df.col("a").trunc().alias("trunc_a"))
     * shape: (3, 2)
     * ┌───┬─────────┐
     * │ a │ trunc_a │
     * ├───┼─────────┤
     * │ 1 │ 1       │
     * │ 2 │ 2       │
     * │ 3 │ 3       │
     * └───┴─────────┘
     */
    trunc() {
        return derive(this, kleeneUnary(Math.trunc));
    }
}
