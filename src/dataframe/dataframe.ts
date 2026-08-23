import { ColumnExpr, resolveColumnSelectors, ALL_COLUMNS_MARKER, seqRange, all, exclude, evaluateExpression, resolveExprOutputType } from "../columnExpressions"
import { GroupedData } from "./grouped/grouped"
import { NEWLINE } from "../constants"
import { createSafeJsonReplacer } from "../utils/json"
import type { IExpr, ColumnData, ColumnDict, DataFrameColumns, ConcatOptions, ConcatItem, HorizontalConcatOptions, RowRecord, DataFrameSchema, RegisteredDataType, ExplodeOptions, IntoExpr, FillNullOptions, SortArrayOptions } from "../types"
import type { LimitOptions, SortOptions, PivotOptions, JoinOptions, JoinMaintainOrder, AsofJoinOptions, UnpivotOptions, TransposeOptions, WriteJSONOptions, WriteCSVOptions } from "./types"
import { DataTypeRegistry } from "../datatypes"
import { isArrayOrTypedArray, toValidArray, toArrayOfType, isObj, isArrayOfType, clamp, stringifyCSV, compareScalarValues } from "../utils"
import { assertColumnExists, assertHeight, DataFrameError, ShapeError, ColumnNotFoundError, InvalidArgumentError, IOStreamError } from "../exceptions"
import { concat } from "../functions/concat"
import {
    rowsToColumns,
    columnsToRows,
    getRowFromColumns,
    inferColumnType,
    gatherColumnsByIndices,
    gatherColumnByIndices,
    computeRowHash,
    buildGroupMap,
    coerceColumn,
    alignKeyIndices,
    alignAsofIndices,
    materializeJoinedDataFrame,
    writeStringToFileOrStream
} from "./utils"

/**
 * Two-dimensional columnar tabular data structure supporting expression execution and reshaping.
 */
export class DataFrame<T extends RowRecord = any> {
    public _columns: DataFrameColumns<T>
    private _height: number
    private _schema: DataFrameSchema = {}

    static _createDirect<U extends RowRecord = any>(
        columns: ColumnDict,
        schema: DataFrameSchema,
        height: number
    ): DataFrame<U> {
        assertHeight(columns, height);

        const df = Object.create(DataFrame.prototype);
        df._columns = columns;
        df._schema = schema;
        df._height = height;
        return df;
    }

    /**
     * Initializes a new DataFrame from row objects or a column dictionary.
     * @param data Array of row objects or column data dictionary.
     * @param schema Optional explicit DataFrame schema mapping.
     * @param height Optional explicit height (row count).
     * @namespace df
     * @category DataFrame
     * @syntax df.{symbol}(...)
     * @example
     * >>> const df = $df.data([{ a: 1, b: "x" }, { a: 2, b: "y" }])
     * >>> df
     * shape: (2, 2)
     * ┌─────┬─────┐
     * │ a   │ b   │
     * ├─────┼─────┤
     * │ 1   │ x   │
     * │ 2   │ y   │
     * └─────┴─────┘
     */
    constructor(data: T[] | ColumnDict, schema?: DataFrameSchema, height?: number) {
        if (Array.isArray(data)) {
            const { columns, height: h } = rowsToColumns(data);
            this._columns = columns as DataFrameColumns<T>;
            this._height = h;
        } else if (isObj(data)) {
            this._columns = data as DataFrameColumns<T>;
            this._height = assertHeight(data, height);
        } else {
            this._columns = {} as DataFrameColumns<T>;
            this._height = 0;
        }

        schema ? this._applySchema(schema) : (this._height > 0 || Object.keys(this._columns).length > 0 ? this._inferSchema() : (this._schema = {}));
    }

    private _applySchema(schema: DataFrameSchema) {
        this._schema = schema;
        const keys = Object.keys(schema);
        const newColumns: ColumnDict = {};
        for (const key of keys) {
            const type = schema[key];
            const oldCol = this._columns[key];
            newColumns[key] = oldCol
                ? coerceColumn(oldCol, type, this._height)
                : coerceColumn(new Array(this._height).fill(null), type, this._height);
        }
        this._columns = newColumns as DataFrameColumns<T>;
    }

    private _inferSchema() {
        const schema: DataFrameSchema = {};
        const keys = Object.keys(this._columns);
        const numKeys = keys.length;
        for (let i = 0; i < numKeys; i++) {
            const key = keys[i];
            schema[key] = inferColumnType(this._columns[key]);
        }
        this._applySchema(schema);
    }

    private _normalizeArgs(args: any[]): IExpr[] {
        const flatArgs = args.flat(Infinity);
        const exprs: IExpr[] = [];
        const len = flatArgs.length;
        for (let i = 0; i < len; i++) {
            const arg = flatArgs[i];
            if (typeof arg === "string") {
                exprs.push(new ColumnExpr(arg));
            } else if (ColumnExpr.isColExpr(arg)) {
                exprs.push(arg);
            } else if (isObj(arg)) {
                const keys = Object.keys(arg);
                const numKeys = keys.length;
                for (let j = 0; j < numKeys; j++) {
                    const key = keys[j];
                    const val = arg[key];
                    if (ColumnExpr.isColExpr(val)) {
                        exprs.push(val.alias(key));
                    } else {
                        const staticExpr = new ColumnExpr(key);
                        staticExpr.evaluate = (_cols: ColumnDict, h: number) => new Array(h).fill(val) as any;
                        exprs.push(staticExpr);
                    }
                }
            }
        }
        return exprs;
    }

    /**
     * Creates a deep copy of the current DataFrame instance, duplicating all underlying column data arrays and schema metadata.
     * Modifying columns or values in the cloned DataFrame will not mutate the original.
     * @returns {DataFrame<T>}
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘*/
    clone(): DataFrame<T> {
        return this.select<T>(all());
    }

    /**
     * Gets array of column names in the DataFrame.
     * @returns Array of column name strings.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.columns
     * ["a", "b"]
     */
    get columns(): string[] {
        return Object.keys(this._columns);
    }

    /**
     * Concatenates items vertically, horizontally, or diagonally.
     * 
     * @param {ConcatItem | ConcatItem[]} items Single DataFrame or array of DataFrames/rows to concatenate.
     * @param {ConcatOptions} [options] Configuration options for concatenation layout and strictness.
     * @param {ConcatHow} [options.how] Layout strategy: `"vertical"` (default, appends rows top-to-bottom), `"horizontal"` (joins unique columns side-by-side), or `"diagonal"` (concatenates mismatched columns with null padding).
     * @param {boolean} [options.horizontal.strict] When `true` (default), throws an error if row counts mismatch in horizontal concatenation. Set `false` to pad shorter DataFrames with `null`.
     * @returns {DataFrame}
     * 
     * @example
     * <!-- @doc:base_concat_1x1_pair -->
     * >>> const df1 = $df.data({ a: [1] })
     * >>> const df2 = $df.data({ b: [2] })
     * >>> df1
     * shape: (1, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * └───┘
     * >>> df2
     * shape: (1, 1)
     * ┌───┐
     * │ b │
     * ├───┤
     * │ 2 │
     * └───┘*/
    concat<U extends RowRecord = any>(
        items: ConcatItem | ConcatItem[],
        options: ConcatOptions = {}
    ): DataFrame<U> {
        const arrayItems = isArrayOfType(items, DataFrame, { mode: "every", allowEmpty: false })
            ? (items as DataFrame[])
            : [items];
        return concat([this, ...arrayItems], options);
    }

    /**
     * Drops specified columns from the DataFrame.
     * @param {(K | K[])[]} args Column names or arrays of column names to remove.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.drop("b")
     * shape: (2, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * └───┘
     */
    drop<K extends keyof T>(...args: (K | K[])[]): DataFrame<Omit<T, K>> {
        return this.select<Omit<T, K>>(exclude(args.flat() as any));
    }

    /**
     * Drops rows containing null or undefined values in specified subset columns.
     * @param {string | string[]} [subset] Column name or array of column names to check for nulls.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_nulls_3x1 -->
     * >>> const df = $df.data({ a: [1, null, 3] })
     * >>> df
     * shape: (3, 1)
     * ┌──────┐
     * │ a    │
     * ├──────┤
     * │ 1    │
     * │ null │
     * │ 3    │
     * └──────┘
     * >>> df.dropNulls()
     * shape: (2, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 3 │
     * └───┘
     */
    dropNulls(subset?: string | string[]): DataFrame<T> {
        return this.filter(subset ? new ColumnExpr(subset).isNotNull() : all().isNotNull());
    }

    /**
     * Gets array of registered column DataTypes matching current schema order.
     * @returns Array of RegisteredDataType definitions.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.dtypes
     * [Float64, Utf8]
     */
    get dtypes(): RegisteredDataType[] {
        const keys = Object.keys(this._columns);
        const len = keys.length;
        const result = new Array(len);
        for (let i = 0; i < len; i++) {
            result[i] = this._schema[keys[i]];
        }
        return result;
    }

    /**
     * Explodes an array column into multiple rows, replicating non-target row attributes.
     * @param {IntoExpr | IntoExpr[]} columns Target column expression or array column name to explode.
     * @param {ExplodeOptions} [options] Configuration options for empty array and null handling.
     * @param {boolean} [options.emptyAsNull] When `true`, converts empty arrays to `null` rows.
     * @param {boolean} [options.keepNulls] When `true`, retains `null` array values during explosion.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_nested_list -->
     * >>> const df = $df.data({ group: ["A"], values: [[1, 2]] })
     * >>> df
     * shape: (1, 2)
     * ┌───────┬────────┐
     * │ group │ values │
     * ├───────┼────────┤
     * │ A     │ [1, 2] │
     * └───────┴────────┘
     * >>> df.explode("values")
     * shape: (2, 2)
     * ┌───────┬────────┐
     * │ group │ values │
     * ├───────┼────────┤
     * │ A     │ 1      │
     * │ A     │ 2      │
     * └───────┴────────┘
     */
    explode(
        columns: IntoExpr | IntoExpr[],
        options?: ExplodeOptions
    ): DataFrame<any> {
        const rawArgs = Array.isArray(columns) ? columns : [columns];
        const normalized = this._normalizeArgs(rawArgs);
        const expandedExprs = resolveColumnSelectors(
            normalized,
            Object.keys(this._columns),
            undefined,
            this._schema,
            this._columns
        );
        const colsToExplode = new Set<string>();
        const numCols = expandedExprs.length;
        for (let i = 0; i < numCols; i++) {
            const expr = expandedExprs[i];
            const name = expr._colName || expr._outputName;
            if (!name || name === ALL_COLUMNS_MARKER) {
                throw new DataFrameError("Expression passed to explode must have a column name.");
            }
            assertColumnExists(name, this._columns, "Explode column");
            colsToExplode.add(name);
        }
        const keys = Object.keys(this._columns);
        const selectList: IExpr[] = [];
        const numKeys = keys.length;
        for (let i = 0; i < numKeys; i++) {
            const key = keys[i];
            selectList.push(
                colsToExplode.has(key)
                    ? new ColumnExpr(key).arr.explode(options)
                    : new ColumnExpr(key)
            );
        }

        return this.select(...selectList);
    }

    /**
     * Fills null values across columns using scalar values or statistical strategies.
     * @param {FillNullOptions} [options] Configuration options for null replacement.
     * @param {any} [options.value] Scalar replacement value or dict mapping column names to values.
     * @param {FillNullStrategy} [options.strategy] Statistical filling strategy (`"zero"`, `"mean"`, `"min"`, `"max"`, `"forward"`, `"backward"`).
     * @param {number} [options.limit] Maximum consecutive nulls to fill when using propagation strategies.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_nulls_3x1 -->
     * >>> const df = $df.data({ a: [1, null, 3] })
     * >>> df
     * shape: (3, 1)
     * ┌──────┐
     * │ a    │
     * ├──────┤
     * │ 1    │
     * │ null │
     * │ 3    │
     * └──────┘
     * >>> df.fillNull({ value: 0 })
     * shape: (3, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 0 │
     * │ 3 │
     * └───┘
     */
    fillNull(options: FillNullOptions = {}): DataFrame<T> {
        if (this._height === 0) return this;
        return this.withColumns(all().fillNull(options));
    }

    /**
     * Filters rows matching boolean column expressions or predicate callbacks.
     * @param {(IExpr | ((row: T) => any))[]} exprs Expressions or predicate functions evaluated per row.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_numbers_3x2 -->
     * >>> const df = $df.data({ a: [1, 2, 3], b: [10, 20, 30] })
     * >>> df
     * shape: (3, 2)
     * ┌───┬────┐
     * │ a │ b  │
     * ├───┼────┤
     * │ 1 │ 10 │
     * │ 2 │ 20 │
     * │ 3 │ 30 │
     * └───┴────┘
     * >>> df.filter($df.col("a").gt(1))
     * shape: (2, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 2 │
     * │ 3 │
     * └───┘
     */
    filter(...exprs: (IExpr | ((row: T) => any))[]): DataFrame<T> {
        const height = this._height;
        if (height === 0) return this;

        const keys = Object.keys(this._columns);
        const exprSelectors: IExpr[] = [];
        const funcPredicates: ((row: T) => any)[] = [];

        for (let i = 0; i < exprs.length; i++) {
            const expr = exprs[i];
            if (typeof expr === "function") funcPredicates.push(expr);
            else exprSelectors.push(expr);
        }

        const expandedExprs = resolveColumnSelectors(exprSelectors, keys, undefined, this._schema, this._columns);
        const numExprs = expandedExprs.length;
        const numFuncs = funcPredicates.length;

        const evaluatedExprs: ColumnData[] = new Array(numExprs);
        for (let i = 0; i < numExprs; i++) {
            evaluatedExprs[i] = expandedExprs[i].evaluate(this._columns, height);
        }

        let currentIndex = 0;
        let rowObj: T | null = null;
        if (numFuncs > 0) {
            const columns = this._columns;
            rowObj = {} as unknown as T;
            for (let k = 0; k < keys.length; k++) {
                const key = keys[k];
                const col = columns[key];
                Object.defineProperty(rowObj, key, {
                    get() {
                        const val = col[currentIndex];
                        return val === undefined ? null : val;
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }

        const matchingIndices: number[] = [];
        rowLoop: for (let i = 0; i < height; i++) {
            for (let j = 0; j < numExprs; j++) {
                if (!evaluatedExprs[j][i]) continue rowLoop;
            }
            if (rowObj) {
                currentIndex = i;
                for (let j = 0; j < numFuncs; j++) {
                    if (!funcPredicates[j](rowObj)) continue rowLoop;
                }
            }
            matchingIndices.push(i);
        }

        const newColumns = gatherColumnsByIndices(this._columns, matchingIndices) as DataFrameColumns<T>;
        return DataFrame._createDirect<T>(newColumns, this._schema, matchingIndices.length);
    }

    /**
     * Groups rows by key columns to prepare for aggregations.
     * @param {K | K[]} keys Column name or array of key column names.
     * @returns {GroupedData}
     * @example
     * <!-- @doc:base_grouped_3x2 -->
     * >>> const df = $df.data({ group: ["A", "A", "B"], val: [10, 20, 30] })
     * >>> df
     * shape: (3, 2)
     * ┌───────┬─────┐
     * │ group │ val │
     * ├───────┼─────┤
     * │ A     │ 10  │
     * │ A     │ 20  │
     * │ B     │ 30  │
     * └───────┴─────┘
     * >>> df.groupBy("group").agg($df.col("val").sum().alias("sum"))
     * shape: (2, 2)
     * ┌─────┬─────┐
     * │ cat │ sum │
     * ├─────┼─────┤
     * │ A   │ 30  │
     * │ B   │ 30  │
     * └─────┴─────┘
     */
    groupBy<K extends keyof T>(keys: K | K[]): GroupedData<T, K> {
        const keysArr = toValidArray(keys);
        const keysStr = toArrayOfType<string>(keys, "string");

        for (let j = 0; j < keysStr.length; j++) {
            assertColumnExists(keysStr[j], this._columns, "Grouping key");
        }

        const groups = buildGroupMap(this._columns, keysStr, this._height);
        const allKeys = Object.keys(this._columns) as (keyof T)[];
        return new GroupedData(groups, keysArr, allKeys, this._columns, this._height, this._schema);
    }

    /**
     * Returns the first N rows as a new DataFrame.
     * @param n Number of leading rows to slice (default 10).
     * @returns DataFrame
     * @example
     * <!-- @doc:base_numbers_4x1 -->
     * >>> const df = $df.data({ a: [1, 2, 3, 4] })
     * >>> df
     * shape: (4, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * │ 3 │
     * │ 4 │
     * └───┘
     * >>> df.head(2)
     * shape: (2, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * └───┘
     */
    head(n: number = 10): DataFrame<T> {
        return this.limit(n, { offset: 0, from: "start" })
    }

    /**
     * Gets height (total row count) of the DataFrame.
     * @returns Number of rows.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.height
     * 3
     */
    get height(): number {
        return this._height;
    }

    /**
     * Concatenates columns horizontally to the current DataFrame.
     * @param {ConcatItem | ConcatItem[]} other DataFrame or array of DataFrames to append side-by-side.
     * @param {HorizontalConcatOptions} [options] Horizontal concat configuration options.
     * @param {boolean} [options.strict] When `true` (default), throws an error if row counts mismatch. Set `false` to allow null padding.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_concat_pair -->
     * >>> const df1 = $df.data({ a: [1, 2] })
     * >>> const df2 = $df.data({ b: [10, 20] })
     * >>> df1
     * shape: (2, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * └───┘
     * >>> df2
     * shape: (2, 1)
     * ┌────┐
     * │ b  │
     * ├────┤
     * │ 10 │
     * │ 20 │
     * └────┘*/
    hstack<U extends RowRecord = any>(
        other: ConcatItem | ConcatItem[],
        options: HorizontalConcatOptions = {}
    ): DataFrame<U> {
        return this.concat<U>(other, { how: "horizontal", horizontal: options });
    }

    /**
     * Inserts a new column at a specific ordinal index position.
     * @param {number} index Target column index position.
     * @param {string} name Name of the inserted column.
     * @param {IntoExpr} expr Value expression or column definition.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.insertColumn(1, "c", [10, 20])
     * shape: (2, 3)
     * ┌───┬────┬───┐
     * │ a │ c  │ b │
     * ├───┼────┼───┤
     * │ 1 │ 10 │ x │
     * │ 2 │ 20 │ y │
     * └───┴────┴───┘
     */
    insertColumn(index: number, name: string, expr: IntoExpr): DataFrame<any> {
        const colExpr = ColumnExpr.toColExpr(expr).alias(name);
        const keys = Object.keys(this._columns);
        const keysLen = keys.length;

        const selectList: any[] = [];
        for (let i = 0; i < keysLen; i++) {
            const k = keys[i];
            if (k !== name) {
                selectList.push(k);
            }
        }

        const targetIndex = clamp(index, { min: 0, max: selectList.length });
        selectList.splice(targetIndex, 0, colExpr);

        return this.select<any>(...selectList);
    }

    /**
     * Retrieves a single scalar cell value by row and column position or name.
     * @param {number} [row] Row index position.
     * @param {number | string} [column] Column index or column name string.
     * @returns {any} Cell scalar value.
     * @throws {DataFrameError} If shape is not (1, 1) when called without arguments.
     * @throws {ShapeError} If row or column index is out of bounds.
     * @example
     * <!-- @doc:base_1x1 -->
     * >>> const df = $df.data({ val: [42] })
     * >>> df
     * shape: (1, 1)
     * ┌─────┐
     * │ val │
     * ├─────┤
     * │ 42  │
     * └─────┘
     * >>> df.item(0, "val")
     * 42
     */
    item(row?: number, column?: number | string): any {
        const height = this._height;
        const keys = Object.keys(this._columns);
        const width = keys.length;

        if (row === undefined && column === undefined) {
            if (height !== 1 || width !== 1) {
                throw new DataFrameError("DataFrame.item() can only be called without arguments if the shape is (1, 1).");
            }
            return this._columns[keys[0]][0];
        }

        if (row === undefined || column === undefined) {
            throw new DataFrameError("DataFrame.item() requires both row and column to be specified if not empty.");
        }

        if (row < 0 || row >= height) {
            throw new ShapeError(`Row index ${row} is out of bounds for DataFrame height ${height}.`);
        }

        const colKey = typeof column === "number" ? keys[column] : column;
        if (colKey === undefined || this._columns[colKey] === undefined) {
            if (typeof column === "number") {
                throw new ShapeError(`Column index ${column} is out of bounds for DataFrame width ${width}.`);
            }
            throw new ColumnNotFoundError(column);
        }

        return this._columns[colKey][row];
    }

    /**
     * Yields a generator iterating over raw column arrays.
     * @returns Generator of ColumnData arrays.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘*/
    *iterColumns(): Generator<ColumnData> {
        const cols = Object.values(this._columns);
        const colsLen = cols.length;
        for (let j = 0; j < colsLen; j++) {
            yield cols[j];
        }
    }

    /**
     * Yields a generator iterating over rows as tuples or named objects.
     * @param [config] Iteration format configuration.
     * @param [config.named] When `true`, yields row objects with column keys (`{ col: val }`). When `false` (default), yields positional arrays (`[val1, val2]`).
     * @returns Generator of rows.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘*/
    *iterRows({ named = false }: { named?: boolean } = {}): Generator<any[] | Record<string, any>> {
        const height = this._height;
        if (height === 0) return;

        if (named) {
            const columns = this._columns;
            const keys = Object.keys(columns);
            for (let i = 0; i < height; i++) {
                yield getRowFromColumns(columns, i, keys);
            }
            return;
        }

        const colArrays = Object.values(this._columns);
        const colsLen = colArrays.length;
        for (let i = 0; i < height; i++) {
            const row = new Array(colsLen);
            for (let j = 0; j < colsLen; j++) {
                row[j] = colArrays[j][i];
            }
            yield row;
        }
    }

    /**
     * Joins two DataFrames on key columns using a specified join strategy.
     * @param {JoinOptions} config Join configuration object.
     * @param {DataFrame} config.other Right DataFrame to join with.
     * @param {string | string[]} [config.on] Join key column name or array of key column names that exist in both DataFrames.
     * @param {string | string[]} [config.leftOn] Join key column(s) in the left DataFrame when key names differ.
     * @param {string | string[]} [config.rightOn] Join key column(s) in the right DataFrame when key names differ.
     * @param {JoinType} [config.how] Join strategy. Default `"inner"`.
     *   - `"inner"` — Only rows with matching keys in both DataFrames.
     *   - `"left"` — All left rows; unmatched right values are `null`.
     *   - `"right"` — All right rows; unmatched left values are `null`.
     *   - `"outer"` — All rows from both sides; unmatched values are `null`.
     *   - `"semi"` — Left rows that have a match in the right DataFrame (only left columns retained).
     *   - `"anti"` — Left rows that have **no** match in the right DataFrame (only left columns retained).
     *   - `"cross"` — Cartesian product pairing every left row with every right row (keyless).
     * @param {[string, string]} [config.suffixes] Suffix tuple `[leftSuffix, rightSuffix]` appended to overlapping
     *   non-key column names (default `["", "_right"]`). Ignored for `"semi"` and `"anti"` joins.
     * @param {boolean} [config.joinNulls] If `true`, null key values are treated as equal and will match each other
     *   across DataFrames. Default `false` (SQL-standard: `NULL != NULL`).
     * @param {boolean} [config.coalesce] Coalescing behavior for join key columns. Default `true`. If `true`, coalesces join key values into left key columns and drops right key columns. If `false`, keeps join key columns separate.
     * @param {JoinMaintainOrder | boolean} [config.maintainOrder] Row order preservation strategy. Default `"none"`.
     *   - `"none"` (or `false`) — No specific ordering is desired.
     *   - `"left"` (or `true`) — Preserves the order of the left DataFrame.
     *   - `"right"` — Preserves the order of the right DataFrame.
     *   - `"left_right"` — Preserves the order of the left DataFrame first, then the right.
     *   - `"right_left"` — Preserves the order of the right DataFrame first, then the left.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_join_pair -->
     * >>> const df1 = $df.data({ id: [1, 2], val: ["a", "b"] })
     * >>> const df2 = $df.data({ id: [1, 2], num: [100, 200] })
     * >>> df1
     * shape: (2, 2)
     * ┌────┬─────┐
     * │ id │ val │
     * ├────┼─────┤
     * │ 1  │ a   │
     * │ 2  │ b   │
     * └────┴─────┘
     * >>> df2
     * shape: (2, 2)
     * ┌────┬─────┐
     * │ id │ num │
     * ├────┼─────┤
     * │ 1  │ 100 │
     * │ 2  │ 200 │
     * └────┴─────┘*/
    join<U extends RowRecord = any, R extends RowRecord = any>(config: JoinOptions<T, U>): DataFrame<R> {
        const {
            other,
            on,
            leftOn,
            rightOn,
            how = "inner",
            suffixes = ["", "_right"],
            joinNulls = false,
            coalesce = true,
            maintainOrder = "none"
        } = config;

        const hasOn = on !== undefined;
        const hasLeftRight = leftOn !== undefined || rightOn !== undefined;

        if (how === "cross" && (hasOn || hasLeftRight)) {
            throw new InvalidArgumentError('Cannot specify "on", "leftOn", or "rightOn" when how is "cross"');
        }
        if (hasOn && hasLeftRight) {
            throw new InvalidArgumentError('Cannot specify both "on" and "leftOn"/"rightOn"');
        }
        if ((leftOn !== undefined) !== (rightOn !== undefined)) {
            throw new InvalidArgumentError('join() requires both "leftOn" and "rightOn"');
        }
        if (how !== "cross" && !hasOn && !hasLeftRight) {
            throw new InvalidArgumentError('join() requires "on" or "leftOn"/"rightOn"');
        }

        let leftKeysStr: string[] = [];
        let rightKeysStr: string[] = [];

        if (leftOn !== undefined && rightOn !== undefined) {
            leftKeysStr = toArrayOfType<string>(leftOn, "string");
            rightKeysStr = toArrayOfType<string>(rightOn, "string");
            if (leftKeysStr.length === 0 || rightKeysStr.length === 0) {
                throw new InvalidArgumentError('join() requires non-empty key arrays');
            }
            if (leftKeysStr.length !== rightKeysStr.length) {
                throw new InvalidArgumentError(`join() "leftOn" length (${leftKeysStr.length}) must match "rightOn" length (${rightKeysStr.length})`);
            }
        } else if (on !== undefined) {
            leftKeysStr = toArrayOfType<string>(on, "string");
            rightKeysStr = leftKeysStr;
            if (leftKeysStr.length === 0) {
                throw new InvalidArgumentError('join() requires at least one key column in "on"');
            }
        }

        const numKeys = leftKeysStr.length;
        for (let i = 0; i < numKeys; i++) {
            assertColumnExists(leftKeysStr[i], this._columns, "Join key", " in the left DataFrame.");
            assertColumnExists(rightKeysStr[i], other._columns, "Join key", " in the right DataFrame.");
        }

        const normalizedMaintainOrder: JoinMaintainOrder = typeof maintainOrder === "boolean"
            ? (maintainOrder ? "left" : "none")
            : (maintainOrder ?? "none");

        const resolvedConfig: JoinOptions<T, U> = {
            ...config,
            how,
            suffixes,
            joinNulls,
            coalesce,
            maintainOrder: normalizedMaintainOrder
        };

        const { leftIndices, rightIndices } = alignKeyIndices(
            this._columns,
            other._columns,
            this._height,
            other._height,
            leftKeysStr,
            rightKeysStr,
            resolvedConfig
        );

        return materializeJoinedDataFrame<R>(
            this._columns,
            other._columns,
            this._schema,
            other._schema,
            leftIndices,
            rightIndices,
            leftKeysStr,
            rightKeysStr,
            { suffixes, coalesce, how }
        );
    }

    /**
     * Performs an asof (as-of) join for inexact matching on ordered numeric or temporal key columns.
     * 
     * Similar to a left join, but instead of exact key equality, matches the nearest key row from the right
     * DataFrame according to the selected `strategy` ("backward", "forward", or "nearest") and optional `tolerance`.
     * Both DataFrames must be sorted in ascending order on their respective `on` / `leftOn` / `rightOn` join keys.
     *
     * @param {AsofJoinOptions} options Asof join configuration options.
     * @param {DataFrame} options.other The right DataFrame to join with.
     * @param {string} [options.on] Column name to join on (must exist in both DataFrames and be sorted ascending).
     * @param {string} [options.leftOn] Left DataFrame join key column name.
     * @param {string} [options.rightOn] Right DataFrame join key column name.
     * @param {string | string[]} [options.by] Optional exact-match group column(s) present in both DataFrames.
     * @param {string | string[]} [options.leftBy] Group column(s) for exact key matching in left DataFrame.
     * @param {string | string[]} [options.rightBy] Group column(s) for exact key matching in right DataFrame.
     * @param {AsofJoinStrategy} [options.strategy] Match search strategy. Default `"backward"`.
     *   - `"backward"` — Matches the latest right row where `rightKey <= leftKey`.
     *   - `"forward"` — Matches the earliest right row where `rightKey >= leftKey`.
     *   - `"nearest"` — Matches the right row with the absolute nearest key value to `leftKey`.
     * @param {number | string} [options.tolerance] Maximum allowed distance between left key and right key.
     * @param {boolean} [options.allowExactMatches] Whether exact key matches are permitted. Default `true`.
     * @param {[string, string]} [options.suffixes] Column name suffixes `[leftSuffix, rightSuffix]` to resolve name collisions. Default `["", "_right"]`.
     * @param {boolean} [options.coalesce] Coalescing behavior for join key columns. Default `true`.
     * @param {boolean} [options.checkSorted] Whether to verify that join keys are sorted ascending prior to matching. Default `true`.
     * @returns A new DataFrame containing the joined results.
     * @example
     * <!-- @doc:base_asof_pair -->
     * >>> const trades = $df.data([
     * ...   { time: 1000, ticker: "AAPL", price: 150.0 },
     * ...   { time: 1005, ticker: "AAPL", price: 150.5 },
     * ...   { time: 1015, ticker: "AAPL", price: 151.0 }
     * ... ])
     * >>> const quotes = $df.data([
     * ...   { time: 998, ticker: "AAPL", bid: 149.9 },
     * ...   { time: 1004, ticker: "AAPL", bid: 150.4 },
     * ...   { time: 1010, ticker: "AAPL", bid: 150.8 }
     * ... ])
     * >>> trades
     * shape: (3, 3)
     * ┌──────┬────────┬───────┐
     * │ time │ ticker │ price │
     * ├──────┼────────┼───────┤
     * │ 1000 │ AAPL   │ 150.0 │
     * │ 1005 │ AAPL   │ 150.5 │
     * │ 1015 │ AAPL   │ 151.0 │
     * └──────┴────────┴───────┘
     * >>> quotes
     * shape: (3, 3)
     * ┌──────┬────────┬───────┐
     * │ time │ ticker │ bid   │
     * ├──────┼────────┼───────┤
     * │ 998  │ AAPL   │ 149.9 │
     * │ 1004 │ AAPL   │ 150.4 │
     * │ 1010 │ AAPL   │ 150.8 │
     * └──────┴────────┴───────┘*/
    joinAsof<U extends RowRecord = any, R extends RowRecord = any>(options: AsofJoinOptions<T, U>): DataFrame<R> {
        const {
            other,
            on,
            leftOn,
            rightOn,
            by,
            leftBy,
            rightBy,
            strategy = "backward",
            tolerance,
            allowExactMatches = true,
            suffixes = ["", "_right"],
            coalesce = true,
            checkSorted = true
        } = options;

        if (!other || !(other instanceof DataFrame)) {
            throw new InvalidArgumentError('joinAsof() requires a valid DataFrame in "other"');
        }

        const leftOnKey = String(leftOn ?? on ?? "");
        const rightOnKey = String(rightOn ?? on ?? "");

        if (!leftOnKey || !rightOnKey) {
            throw new InvalidArgumentError('joinAsof() requires "on" or "leftOn"/"rightOn"');
        }

        const leftByKeys = toArrayOfType<string>(leftBy ?? by, "string");
        const rightByKeys = toArrayOfType<string>(rightBy ?? by, "string");

        if (leftByKeys.length !== rightByKeys.length) {
            throw new InvalidArgumentError(`Partition key length mismatch: ${leftByKeys.length} vs ${rightByKeys.length}`);
        }

        const numByKeys = leftByKeys.length;
        for (let i = 0; i < numByKeys; i++) {
            assertColumnExists(leftByKeys[i], this._columns, "Partition key", " in the left DataFrame.");
            assertColumnExists(rightByKeys[i], other._columns, "Partition key", " in the right DataFrame.");
        }

        const resolvedOptions: AsofJoinOptions<T, U> = {
            ...options,
            strategy,
            tolerance,
            allowExactMatches,
            suffixes,
            coalesce,
            checkSorted
        };

        const { leftIndices, rightIndices } = alignAsofIndices(
            this._columns,
            other._columns,
            this._height,
            other._height,
            leftOnKey,
            rightOnKey,
            leftByKeys,
            rightByKeys,
            resolvedOptions
        );

        const leftKeysStr = [leftOnKey, ...leftByKeys];
        const rightKeysStr = [rightOnKey, ...rightByKeys];

        return materializeJoinedDataFrame<R>(
            this._columns,
            other._columns,
            this._schema,
            other._schema,
            leftIndices,
            rightIndices,
            leftKeysStr,
            rightKeysStr,
            { suffixes, coalesce, how: "left" }
        );
    }

    /**
     * Limits the output to N rows starting from offset.
     * @param {number} n Maximum number of rows to take.
     * @param {LimitOptions} [options] Offset and slice direction options.
     * @param {number} [options.offset] Number of rows to skip before taking `n` rows (default 0).
     * @param {LimitPosition} [options.from] Slice direction starting point (`"start"` or `"end"`). Default `"start"`.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_numbers_4x1 -->
     * >>> const df = $df.data({ a: [1, 2, 3, 4] })
     * >>> df
     * shape: (4, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * │ 3 │
     * │ 4 │
     * └───┘
     * >>> df.limit(2, { offset: 1 })
     * shape: (2, 1)
     * ┌────┐
     * │ a  │
     * ├────┤
     * │ 20 │
     * │ 30 │
     * └────┘
     */
    limit(n: number, { offset = 0, from = "start" }: LimitOptions = {}): DataFrame<T> {
        const len = this._height;
        const safeN = clamp(Math.floor(n), { min: 0, max: len });
        const safeOffset = clamp(Math.floor(offset), { min: 0, max: len });

        let actualStart = safeOffset;
        let actualEnd = clamp(safeOffset + safeN, { min: 0, max: len });

        if (from === "end") {
            actualEnd = clamp(len - safeOffset, { min: 0, max: len });
            actualStart = clamp(actualEnd - safeN, { min: 0, max: len });
        }

        const newHeight = clamp(actualEnd - actualStart, { min: 0 });
        const newColumns: ColumnDict = {};

        const keys = Object.keys(this._columns);
        const keysLen = keys.length;
        for (let i = 0; i < keysLen; i++) {
            const key = keys[i];
            newColumns[key] = (this._columns[key] as any).slice(actualStart, actualEnd);
        }

        return DataFrame._createDirect<T>(newColumns, this._schema, newHeight);
    }

    /**
     * Pivots columns from long format to a wide datagrid structure.
     * @param config Pivot table configuration options.
     * @param {string | string[]} config.index Key column(s) to use as new DataFrame rows.
     * @param {string} config.columns Column whose distinct values become new wide column headers.
     * @param {string} config.values Column whose cell values populate the pivoted grid cells.
     * @param {AggFn | string} [config.agg] Aggregation function to apply when multiple values exist for a cell.
     * @returns DataFrame
     * @example
     * <!-- @doc:base_pivot_table -->
     * >>> const df = $df.data({ year: [2020, 2020, 2021, 2021], month: ["Jan", "Feb", "Jan", "Feb"], revenue: [100, 150, 120, 180] })
     * >>> df
     * shape: (4, 3)
     * ┌──────┬───────┬─────────┐
     * │ year │ month │ revenue │
     * ├──────┼───────┼─────────┤
     * │ 2020 │ Jan   │ 100     │
     * │ 2020 │ Feb   │ 150     │
     * │ 2021 │ Jan   │ 120     │
     * │ 2021 │ Feb   │ 180     │
     * └──────┴───────┴─────────┘
     * >>> df.pivot({ index: "year", columns: "month", values: "revenue" })
     * shape: (2, 3)
     * ┌──────┬─────┬─────┐
     * │ year │ Jan │ Feb │
     * ├──────┼─────┼─────┤
     * │ 2020 │ 100 │ 150 │
     * │ 2021 │ 120 │ 180 │
     * └──────┴─────┴─────┘
     */
    pivot<U extends RowRecord = any>(config: PivotOptions<T>): DataFrame<U> {
        if (this._height === 0) return DataFrame._createDirect<any>({}, {}, 0);

        const { index, columns, values } = config;
        const indexStr = toArrayOfType<string>(index, "string");
        const indexLen = indexStr.length;
        for (let j = 0; j < indexLen; j++) {
            assertColumnExists(indexStr[j], this._columns, "Pivot index key");
        }
        const colKey = String(columns);
        const valKey = String(values);
        assertColumnExists(colKey, this._columns, "Pivot column key");
        assertColumnExists(valKey, this._columns, "Pivot values key");

        const groups = new Map<string, number>();
        const firstRowIdxs: number[] = [];
        const colNames = new Set<string>();

        const height = this._height;
        const pivotCol = this._columns[colKey];
        const valCol = this._columns[valKey];

        for (let i = 0; i < height; i++) {
            const rowKey = computeRowHash(this._columns, indexStr, i);
            colNames.add(String(pivotCol[i]));

            if (groups.get(rowKey) === undefined) {
                groups.set(rowKey, groups.size);
                firstRowIdxs.push(i);
            }
        }

        const outHeight = groups.size;

        const indexColsDict: ColumnDict = {};
        const outSchema: DataFrameSchema = {};
        for (let j = 0; j < indexLen; j++) {
            const idxKey = indexStr[j];
            indexColsDict[idxKey] = this._columns[idxKey];
            if (this._schema[idxKey]) {
                outSchema[idxKey] = this._schema[idxKey];
            }
        }
        const newColumns = gatherColumnsByIndices(indexColsDict, firstRowIdxs) as Record<string, any[]>;

        const allCols = Array.from(colNames);
        const valType = this._schema[valKey] || DataTypeRegistry.Utf8;
        for (let j = 0; j < allCols.length; j++) {
            const colName = allCols[j];
            newColumns[colName] = new Array(outHeight).fill(null);
            outSchema[colName] = valType;
        }

        for (let i = 0; i < height; i++) {
            const rowKey = computeRowHash(this._columns, indexStr, i);
            const groupIdx = groups.get(rowKey)!;
            const pivotColName = String(pivotCol[i]);
            newColumns[pivotColName][groupIdx] = valCol[i];
        }

        return DataFrame._createDirect<U>(newColumns, outSchema, outHeight);
    }

    /**
     * Renames columns based on a key-value mapping dictionary.
     * @param {Partial<Record<keyof T, string>>} [mapping] Dictionary mapping old column names to new names.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.rename({ a: "id", b: "label" })
     * shape: (2, 2)
     * ┌────┬───────┐
     * │ id │ label │
     * ├────┼───────┤
     * │ 1  │ x     │
     * │ 2  │ y     │
     * └────┴───────┘
     */
    rename(mapping: Partial<Record<keyof T, string>> = {}): DataFrame<any> {
        const keys = Object.keys(this._columns);
        const len = keys.length;
        const selectList: any[] = new Array(len);

        for (let i = 0; i < len; i++) {
            const k = keys[i];
            const newKey = (mapping as any)[k];
            selectList[i] = newKey ? new ColumnExpr(k).alias(newKey) : k;
        }

        return this.select(...selectList);
    }

    /**
     * Reverses the row ordering of the DataFrame.
     * @returns DataFrame
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.reverse()
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 2 │ y │
     * │ 1 │ x │
     * └───┴───┘
     */
    reverse(): DataFrame<T> {
        return this._height === 0 ? this : this.select<T>(all().reverse());
    }

    /**
     * Gets current DataFrameSchema dictionary mapping column names to DataType.
     * @returns DataFrameSchema mapping.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.schema
     * { a: Float64, b: Utf8 }
     */
    get schema(): DataFrameSchema {
        return this._schema;
    }

    /**
     * Selects specific columns or evaluates column expressions.
     * @param {(string | IExpr | Record<string, any> | (string | IExpr | Record<string, any>)[])[]} args Column names, column expressions, or object maps to evaluate.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.select("a", $df.col("b").add(100).alias("b_plus"))
     * shape: (2, 2)
     * ┌───┬────────┐
     * │ a │ b_plus │
     * ├───┼────────┤
     * │ 1 │ 110    │
     * │ 2 │ 120    │
     * └───┴────────┘
     */
    select<U extends RowRecord = any>(
        ...args: (string | IExpr | Record<string, any> | (string | IExpr | Record<string, any>)[])[]
    ): DataFrame<U> {
        const exprs = this._normalizeArgs(args);
        const allKeys = Object.keys(this._columns);
        const expandedExprs = resolveColumnSelectors(exprs, allKeys, undefined, this._schema, this._columns);

        const numExprs = expandedExprs.length;
        if (numExprs === 0) {
            return DataFrame._createDirect<U>({}, {}, this._height);
        }

        const newColumns: ColumnDict = {};
        const outSchema: DataFrameSchema = {};

        const evaluatedCols = new Array(numExprs);
        const targetKeys = new Array(numExprs);
        const selectedKeys = new Set<string>();
        let activeRowMap: Int32Array | null = null;

        for (let i = 0; i < numExprs; i++) {
            const expr = expandedExprs[i];
            const targetKey = expr._outputName || expr._colName || ALL_COLUMNS_MARKER;

            if (selectedKeys.has(targetKey)) {
                throw new DataFrameError(`Duplicate column selection: "${targetKey}"`);
            }
            selectedKeys.add(targetKey);

            const col = evaluateExpression(expr, this._columns, this._height);
            evaluatedCols[i] = col;
            targetKeys[i] = targetKey;

            const rowMap = col && (col as any).rowMap;
            if (!rowMap) continue;

            if (!activeRowMap) {
                activeRowMap = rowMap;
                continue;
            }

            const len = rowMap.length;
            if (len !== activeRowMap.length) {
                throw new ShapeError(`Mismatched explode heights: Column "${targetKey}" has length ${len}, but expected ${activeRowMap.length}`);
            }
            for (let j = 0; j < len; j++) {
                if (rowMap[j] !== activeRowMap[j]) {
                    throw new ShapeError(`Mismatched explode heights: Column "${targetKey}" has mismatched row lengths`);
                }
            }
        }

        let targetHeight = activeRowMap ? activeRowMap.length : this._height;

        let shouldCollapse = numExprs > 0;
        for (let i = 0; i < numExprs; i++) {
            const expr = expandedExprs[i];
            const isGlobalAgg = expr._aggFn != null && (!expr._partitionBy || expr._partitionBy.length === 0);
            if (!isGlobalAgg && !expr._isLiteral) {
                shouldCollapse = false;
                break;
            }
        }

        for (let i = 0; i < numExprs; i++) {
            const targetKey = targetKeys[i];
            let col = evaluatedCols[i];
            const hasRowMap = col && (col as any).rowMap;

            const len = isArrayOrTypedArray(col) ? col.length : 0;
            const expectedLen = (activeRowMap && !hasRowMap) ? this._height : targetHeight;
            if (len !== expectedLen) {
                throw new ShapeError(`Column height mismatch for "${targetKey}": got ${len}, expected ${expectedLen}`);
            }

            if (activeRowMap && !hasRowMap) {
                col = gatherColumnByIndices(col, activeRowMap as any);
            }

            evaluatedCols[i] = col;
        }

        if (shouldCollapse) {
            targetHeight = 1;
        }

        for (let i = 0; i < numExprs; i++) {
            const expr = expandedExprs[i];
            const targetKey = targetKeys[i];
            const col = evaluatedCols[i];
            const type = resolveExprOutputType(expr, this._schema, col) || inferColumnType(col);

            outSchema[targetKey] = type;
            newColumns[targetKey] = coerceColumn(col, type, targetHeight);
        }

        return DataFrame._createDirect<U>(newColumns, outSchema, targetHeight);
    }

    /**
     * Gets DataFrame dimensions as [height, width] tuple.
     * @returns Tuple [height, width].
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.shape
     * [2, 2]
     */
    get shape(): [number, number] {
        return [this.height, this.width];
    }

    /**
     * Slices a subset range of rows between start and end index.
     * @param {number} start Starting row index.
     * @param {number} [end] Optional ending row index (exclusive).
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_numbers_4x1 -->
     * >>> const df = $df.data({ a: [1, 2, 3, 4] })
     * >>> df
     * shape: (4, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * │ 3 │
     * │ 4 │
     * └───┘
     * >>> df.slice(1, 3)
     * shape: (2, 1)
     * ┌────┐
     * │ a  │
     * ├────┤
     * │ 20 │
     * │ 30 │
     * └────┘
     */
    slice(start: number, end?: number): DataFrame<T> {
        const total = this._height;

        const actualStart = clamp(start < 0 ? total + start : start, { min: 0, max: total });
        const actualEnd = clamp(end === undefined ? total : (end < 0 ? total + end : end), { min: 0, max: total });

        const n = clamp(actualEnd - actualStart, { min: 0 });

        return this.limit(n, { offset: actualStart });
    }

    /**
     * Sorts DataFrame rows by one or more column expressions or custom sorters.
     * @param {SortOptions<T>} [config] Sort configuration options.
     * @param {keyof T | (keyof T)[] | IExpr | IExpr[]} config.by Column name(s) or expression(s) to sort by.
     * @param {boolean | boolean[]} [config.descending] Sort order boolean or array of booleans per key (default `false`).
     * @param {boolean} [config.nullsLast] When `true` (default), places nulls at the end of sorted output.
     * @param {Partial<Record<keyof T, (a: any, b: any) => number>>} [config.custom] Optional dictionary mapping column names to custom comparator functions.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_numbers_3x2 -->
     * >>> const df = $df.data({ a: [1, 2, 3], b: [10, 20, 30] })
     * >>> df
     * shape: (3, 2)
     * ┌───┬────┐
     * │ a │ b  │
     * ├───┼────┤
     * │ 1 │ 10 │
     * │ 2 │ 20 │
     * │ 3 │ 30 │
     * └───┴────┘
     * >>> df.sort({ by: "a", descending: true })
     * shape: (3, 2)
     * ┌───┬────┐
     * │ a │ b  │
     * ├───┼────┤
     * │ 3 │ 30 │
     * │ 2 │ 20 │
     * │ 1 │ 10 │
     * └───┴────┘
     * shape: (3, 1)
     * ┌─────┐
     * │ val │
     * ├─────┤
     * │ 1   │
     * │ 2   │
     * │ 3   │
     * └─────┘
     */
    sort(config?: SortOptions<T>): DataFrame<T> {
        if (!config?.by || this._height === 0) return this;

        const { by, descending = false, nullsLast = true, customComp } = config;
        const sortKeys = toValidArray(by);
        const evalCols = Object.values(this.select(...sortKeys as any)._columns);
        const height = this._height;
        if (height === 1) return this;
        const nCols = evalCols.length;

        const colOpts: SortArrayOptions[] = new Array(nCols);
        const isDescArr = Array.isArray(descending);
        const isCompFn = typeof customComp === "function";

        for (let i = 0; i < nCols; i++) {
            colOpts[i] = {
                descending: isDescArr ? Boolean(descending[i]) : Boolean(descending),
                nullsLast,
                customComp: isCompFn ? customComp : (customComp as any)?.[sortKeys[i]]
            };
        }

        const indices = new Array<number>(height);
        for (let i = 0; i < height; i++) indices[i] = i;

        indices.sort((a, b) => {
            for (let i = 0; i < nCols; i++) {
                const res = compareScalarValues(evalCols[i][a], evalCols[i][b], colOpts[i]);
                if (res !== 0) return res;
            }
            return 0;
        });

        return DataFrame._createDirect<T>(gatherColumnsByIndices(this._columns, indices) as any, this._schema, height);
    }

    /**
     * Returns the last N rows as a new DataFrame.
     * @param n Number of trailing rows to take (default 10).
     * @returns DataFrame
     * @example
     * <!-- @doc:base_numbers_4x1 -->
     * >>> const df = $df.data({ a: [1, 2, 3, 4] })
     * >>> df
     * shape: (4, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * │ 3 │
     * │ 4 │
     * └───┘
     * >>> df.tail(2)
     * shape: (2, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 3 │
     * │ 4 │
     * └───┘
     */
    tail(n: number = 10): DataFrame<T> {
        return this.limit(n, { offset: 0, from: 'end' })
    }

    /**
     * Evaluates a column expression or retrieves column values as a raw JavaScript array.
     * @param {K | IExpr} nameOrExpr Target column name or column expression.
     * @returns {any[]} Array of column scalar values.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.toArray("a")
     * [10, 20]
     */
    toArray<K extends keyof T>(nameOrExpr: K | IExpr): any[] {
        return toValidArray(Object.values(this.select(nameOrExpr as any)._columns)?.[0] ?? []);
    }

    /**
     * Converts columns into a JavaScript dictionary mapping column keys to raw arrays.
     * @returns Column dictionary map.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.toDict()
     * { a: Float64Array([1, 2]), b: ["x", "y"] }
     */
    toDict(): DataFrameColumns<T> {
        return { ...this._columns };
    }

    /**
     * Converts rows into an array of JavaScript objects.
     * @returns Array of row record objects.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.toDicts()
     * [{ a: 1, b: "x" }]
     */
    toDicts(): T[] {
        return columnsToRows(this._columns, this._height);
    }

    /**
     * Transposes rows into columns and columns into rows.
     * @param {TransposeOptions} [options] Transpose layout options.
     * @param {boolean} [options.includeHeader] When `true`, includes original column names as a new header column (default `false`).
     * @param {string} [options.headerName] Name of the header column when `includeHeader` is `true` (default `"column"`).
     * @param {string | Iterable<string>} [options.columnNames] Column name or iterable of strings to use as transposed column headers.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_wide_q_metrics -->
     * >>> df.transpose({ includeHeader: true, headerName: "metric" })
     * shape: (2, 3)
     * ┌────────┬──────────┬──────────┐
     * │ metric │ column_0 │ column_1 │
     * ├────────┼──────────┼──────────┤
     * │ q1     │ 100      │ 500      │
     * │ q2     │ 120      │ 600      │
     * └────────┴──────────┴──────────┘
     */
    transpose({
        includeHeader: includeHeader = false,
        headerName: headerName = "column",
        columnNames: colNamesOpt
    }: TransposeOptions = {}): DataFrame<any> {
        if (this._height === 0) {
            const cols: ColumnDict = includeHeader ? { [headerName]: coerceColumn([], DataTypeRegistry.Utf8, 0) } : {};
            const schema: DataFrameSchema = includeHeader ? { [headerName]: DataTypeRegistry.Utf8 } : {};
            return DataFrame._createDirect(cols, schema, 0);
        }

        let dataCols = this.columns;
        let newColNames: string[];

        if (typeof colNamesOpt === "string") {
            assertColumnExists(colNamesOpt, this._columns, "columnNames");
            dataCols = dataCols.filter(c => c !== colNamesOpt);
            const keyCol = this._columns[colNamesOpt];
            newColNames = new Array(this._height);
            for (let i = 0; i < this._height; i++) {
                const val = keyCol[i];
                if (val == null) {
                    throw new DataFrameError(`Transpose columnNames column "${colNamesOpt}" contains null/undefined at index ${i}`);
                }
                newColNames[i] = String(val);
            }
        } else if (colNamesOpt != null) {
            const colNamesArr = Array.from(colNamesOpt as Iterable<any>);
            if (colNamesArr.length !== this._height) {
                throw new DataFrameError(`columnNames length (${colNamesArr.length}) must match the height of the DataFrame (${this._height})`);
            }
            newColNames = colNamesArr.map(String);
        } else {
            newColNames = new Array(this._height);
            for (let i = 0; i < this._height; i++) {
                newColNames[i] = `column_${i}`;
            }
        }

        const numDataCols = dataCols.length;
        const newCols: ColumnDict = {};
        const newSchema: DataFrameSchema = {};

        if (includeHeader) {
            newCols[headerName] = coerceColumn(dataCols, DataTypeRegistry.Utf8, numDataCols);
            newSchema[headerName] = DataTypeRegistry.Utf8;
        }

        for (let i = 0; i < this._height; i++) {
            const name = newColNames[i];
            if (newCols[name] !== undefined) {
                throw new DataFrameError(`Duplicate column name in transposed DataFrame: "${name}"`);
            }
            const rawVals = new Array(numDataCols);
            for (let j = 0; j < numDataCols; j++) {
                rawVals[j] = this._columns[dataCols[j]][i];
            }
            const type = inferColumnType(rawVals);
            newCols[name] = coerceColumn(rawVals, type, numDataCols);
            newSchema[name] = type;
        }

        return DataFrame._createDirect(newCols, newSchema, numDataCols);
    }

    /**
     * Filters distinct unique rows matching target key columns.
     * @param {K | K[]} [columns] Target column or array of column names to evaluate uniqueness.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.unique()
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     */
    unique<K extends keyof T>(columns?: K | K[]): DataFrame<T> {
        const keys = columns !== undefined ? toValidArray(columns) : (Object.keys(this._columns) as any);
        return this.groupBy(keys).agg(exclude(keys).first());
    }

    /**
     * Unpivots a wide DataFrame into a long format structure.
     * @param {UnpivotOptions<T>} config Unpivot configuration options.
     * @param {keyof T | (keyof T)[]} config.idVars Key column(s) to retain as identifier variables.
     * @param {keyof T | (keyof T)[]} config.valueVars Column(s) to unpivot into variable-value pairs.
     * @param {string} [config.varName] Name for the new variable column holding old column headers (default `"variable"`).
     * @param {string} [config.valueName] Name for the new value column holding cell values (default `"value"`).
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_wide_q_metrics -->
     * >>> df.unpivot({ idVars: "metric", valueVars: ["q1", "q2"], varName: "quarter", valueName: "val" })
     * shape: (4, 3)
     * ┌────────┬─────────┬─────┐
     * │ metric │ quarter │ val │
     * ├────────┼─────────┼─────┤
     * │ sales  │ q1      │ 100 │
     * │ sales  │ q2      │ 120 │
     * │ clicks │ q1      │ 500 │
     * │ clicks │ q2      │ 600 │
     * └────────┴─────────┴─────┘
     */
    unpivot<U extends RowRecord = any>(config: UnpivotOptions<T>): DataFrame<U> {
        const { idVars, valueVars, varName = "variable", valueName = "value" } = config;
        const idVarsStr = toArrayOfType<string>(idVars, "string");
        const valueVarsStr = toArrayOfType<string>(valueVars, "string");
        const idVarsLen = idVarsStr.length;
        const valueVarsLen = valueVarsStr.length;

        for (const idKey of idVarsStr) {
            assertColumnExists(idKey, this._columns, "Unpivot id variable key");
        }
        for (const vKey of valueVarsStr) {
            assertColumnExists(vKey, this._columns, "Unpivot value variable key");
        }

        const newHeight = this._height * valueVarsLen;

        const newColumns: Record<string, any[]> = {};
        for (let k = 0; k < idVarsLen; k++) {
            newColumns[idVarsStr[k]] = new Array(newHeight);
        }
        newColumns[varName] = new Array(newHeight);
        newColumns[valueName] = new Array(newHeight);

        let outIdx = 0;
        for (let i = 0; i < this._height; i++) {
            for (let j = 0; j < valueVarsLen; j++) {
                const vVar = valueVarsStr[j];

                for (let k = 0; k < idVarsLen; k++) {
                    const idKey = idVarsStr[k];
                    newColumns[idKey][outIdx] = this._columns[idKey][i];
                }

                newColumns[varName][outIdx] = vVar;
                newColumns[valueName][outIdx] = this._columns[vVar][i];
                outIdx++;
            }
        }

        const outSchema: DataFrameSchema = {};
        for (const key of idVarsStr) {
            outSchema[key] = this._schema[key];
        }
        outSchema[varName] = DataTypeRegistry.Utf8;
        outSchema[valueName] = inferColumnType(newColumns[valueName]);

        return DataFrame._createDirect<U>(newColumns as any, outSchema, newHeight);
    }

    /**
     * Concatenates DataFrames vertically. Alias for concat({ how: "vertical" }).
     * @param {ConcatItem | ConcatItem[]} other Single DataFrame or array of DataFrames to append vertically.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_concat_pair -->
     * >>> const df1 = $df.data({ a: [1, 2] })
     * >>> const df2 = $df.data({ b: [10, 20] })
     * >>> df1
     * shape: (2, 1)
     * ┌───┐
     * │ a │
     * ├───┤
     * │ 1 │
     * │ 2 │
     * └───┘
     * >>> df2
     * shape: (2, 1)
     * ┌────┐
     * │ b  │
     * ├────┤
     * │ 10 │
     * │ 20 │
     * └────┘*/
    vstack<U extends RowRecord = any>(
        other: ConcatItem | ConcatItem[]
    ): DataFrame<U> {
        return this.concat<U>(other, { how: "vertical" });
    }

    /**
     * Gets width (total column count) of the DataFrame.
     * @returns Number of columns.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.width
     * 2
     */
    get width(): number {
        return Object.keys(this._columns).length;
    }

    /**
     * Adds new columns or updates existing ones using column expressions.
     * @param {(string | IExpr | Record<string, any> | (string | IExpr | Record<string, any>)[])[]} args Expressions or field objects defining column calculations.
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.withColumns($df.col("a").mul(10).alias("a_x10"))
     * shape: (2, 3)
     * ┌───┬───┬───────┐
     * │ a │ b │ a_x10 │
     * ├───┼───┼───────┤
     * │ 1 │ x │ 10    │
     * │ 2 │ y │ 20    │
     * └───┴───┴───────┘
     */
    withColumns(
        ...args: (string | IExpr | Record<string, any> | (string | IExpr | Record<string, any>)[])[]
    ): DataFrame<any> {
        if (args.length === 0) return this;

        const exprs = this._normalizeArgs(args);
        const allKeys = Object.keys(this._columns);
        const expandedExprs = resolveColumnSelectors(exprs, allKeys, undefined, this._schema, this._columns);
        const numEntries = expandedExprs.length;
        if (numEntries === 0) return this;

        const overrides = new Map<string, IExpr>();
        for (let j = 0; j < numEntries; j++) {
            const expr = expandedExprs[j];
            const name = expr._outputName || expr._colName || ALL_COLUMNS_MARKER;
            overrides.set(name, expr);
        }

        const selectList: IExpr[] = [];
        const numKeys = allKeys.length;
        for (let i = 0; i < numKeys; i++) {
            const key = allKeys[i];
            selectList.push(overrides.get(key) || new ColumnExpr(key));
            overrides.delete(key);
        }

        for (const expr of overrides.values()) {
            selectList.push(expr);
        }

        return this.select(...selectList);
    }

    /**
     * Appends an incremental index column.
     * @param {string} [name] Name of index column (default "index").
     * @param {number} [offset] Starting numeric index offset (default 0).
     * @returns {DataFrame}
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.withRowIndex("idx")
     * shape: (2, 3)
     * ┌─────┬───┬───┐
     * │ idx │ a │ b │
     * ├─────┼───┼───┤
     * │ 0   │ 1 │ x │
     * │ 1   │ 2 │ y │
     * └─────┴───┴───┘
     */
    withRowIndex(name: string = "index", offset: number = 0): DataFrame<any> {
        const expr = seqRange(offset, {
            mode: "independent",
            dtype: DataTypeRegistry.UInt32,
            step: 1
        });

        const df = this.insertColumn(0, name, expr);
        df._schema[name] = DataTypeRegistry.UInt32;
        return df;
    }

    /**
     * Writes DataFrame to CSV format string or file/stream target.
     * @param {string | { write: (str: string) => void }} [file] Target file path or writable stream target (optional).
     * @param {WriteCSVOptions} [options] CSV formatting options.
     * @param {string} [options.delimiter] Column delimiter character (default `","`).
     * @param {boolean} [options.header] When `true` (default), includes column header row.
     * @param {string} [options.quoteChar] Character used to enclose fields containing special characters (default `'"'`).
     * @returns {string} CSV string output.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.writeCsv()
     * "a,b\n1,x"
     */
    writeCsv(
        file?: string | { write: (str: string) => void },
        options: WriteCSVOptions = {}
    ): string {
        if (file) {
            if (typeof file === "string") {
                if (typeof require !== "function") {
                    throw new IOStreamError("File writing is not supported in this environment (missing require('fs')).");
                }
                const fs = require("fs");
                const fd = fs.openSync(file, "w");
                try {
                    stringifyCSV(this._columns, this._height, {
                        ...options,
                        onRow: (str) => {
                            fs.writeSync(fd, str, null, "utf8");
                        }
                    });
                } finally {
                    fs.closeSync(fd);
                }
            } else if (isObj(file) && typeof (file as any).write === "function") {
                stringifyCSV(this._columns, this._height, {
                    ...options,
                    onRow: (str) => {
                        (file as any).write(str);
                    }
                });
            } else {
                throw new InvalidArgumentError("Invalid file argument. Expected a file path string or a writable stream/object with a write method.");
            }
            return "";
        }

        return stringifyCSV(this._columns, this._height, options);
    }

    /**
     * Writes DataFrame rows to JSON format string or file/stream target.
     * @param {string | { write: (str: string) => void }} [file] Target file path or writable stream target (optional).
     * @param {WriteJSONOptions} [options] JSON formatting and replacer options.
     * @param {JSONFormat} [options.format] JSON output format structure (`"json"` or `"ndjson"`). Default `"json"`.
     * @param {SafeJsonReplacerOptions} [options.replacerOptions] Serialization options for custom type handling.
     * @param {(v: Date) => string} [options.replacerOptions.formatDate] Custom formatter function for Date objects. Ignored if `onDate` is specified.
     * @param {"string" | "number"} [options.replacerOptions.bigintStrategy] Convert BigInts to numeric strings or numbers if safe. Default `"string"`.
     * @param {(v: bigint) => any} [options.replacerOptions.onBigInt] Custom serialization override for BigInt values.
     * @param {(v: any) => any} [options.replacerOptions.onTypedArray] Custom serialization override for TypedArray values.
     * @param {(v: Set<any>) => any} [options.replacerOptions.onSet] Custom serialization override for Set objects.
     * @param {(v: Map<any, any>) => any} [options.replacerOptions.onMap] Custom serialization override for Map objects.
     * @param {(v: RegExp) => any} [options.replacerOptions.onRegExp] Custom serialization override for RegExp objects.
     * @param {(v: Date) => any} [options.replacerOptions.onDate] Custom serialization override for Date objects. Takes precedence over `formatDate`.
     * @param {(v: Error) => any} [options.replacerOptions.onError] Custom serialization override for Error objects. Prevents empty `{}` output.
     * @param {(v: URLSearchParams) => any} [options.replacerOptions.onURLSearchParams] Custom serialization override for URLSearchParams objects.
     * @param {(this: any, k: string, v: any) => any} [options.replacerOptions.onCustom] Catch-all serialization override for custom types. Runs after native type checks.
     * @param {boolean} [options.replacerOptions.handleCircular] If `true`, handles circular references by replacing them instead of throwing.
     * @param {(this: any, k: string, v: any) => any} [options.replacerOptions.onCircular] Custom fallback when a circular reference is found. Default `"[Circular]"`.
     * @param {boolean} [options.replacerOptions.voidBigIntReplacement] If `true`, disables the default safe serialization for BigInt values.
     * @param {boolean} [options.replacerOptions.voidTypedArrayReplacement] If `true`, disables the default safe serialization for TypedArray values.
     * @param {boolean} [options.replacerOptions.voidSetReplacement] If `true`, disables the default safe serialization for Set objects.
     * @param {boolean} [options.replacerOptions.voidMapReplacement] If `true`, disables the default safe serialization for Map objects.
     * @param {boolean} [options.replacerOptions.voidRegExpReplacement] If `true`, disables the default safe serialization for RegExp objects.
     * @param {boolean} [options.replacerOptions.voidDateReplacement] If `true`, disables the default safe serialization for Date objects.
     * @param {((this: any, k: string, v: any) => any) | (string | number)[] | null} [options.replacerOptions.replacer] Custom replacer function or array whitelist that runs first for pre-processing.
     * @returns {string} JSON string representation.
     * @example
     * <!-- @doc:base_2x2 -->
     * >>> const df = $df.data({ a: [1, 2], b: ["x", "y"] })
     * >>> df
     * shape: (2, 2)
     * ┌───┬───┐
     * │ a │ b │
     * ├───┼───┤
     * │ 1 │ x │
     * │ 2 │ y │
     * └───┴───┘
     * >>> df.writeJson()
     * '[{"a":1,"b":"x"}]'
     */
    writeJson(
        file?: string | { write: (str: string) => void },
        { format = "json", replacerOptions }: WriteJSONOptions = {}
    ): string {
        if (format !== "json" && format !== "ndjson") {
            throw new InvalidArgumentError(`Unsupported JSON format: "${format}". Expected "json" or "ndjson".`);
        }

        const safeReplacer = replacerOptions?.replacer === null
            ? undefined
            : createSafeJsonReplacer(replacerOptions);

        let jsonStr: string;
        if (format === "ndjson") {
            const dicts = this.toDicts();
            const len = dicts.length;
            const lines = new Array(len);
            for (let i = 0; i < len; i++) {
                lines[i] = JSON.stringify(dicts[i], safeReplacer as any);
            }
            jsonStr = lines.join(NEWLINE);
        } else {
            jsonStr = JSON.stringify(this.toDicts(), safeReplacer as any);
        }

        writeStringToFileOrStream(file, jsonStr);
        return jsonStr;
    }
}
