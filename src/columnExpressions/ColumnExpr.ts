import { ExprBase } from "./ExprBase"
import { StandardExpr } from "./mixins/StandardExpr"
import { StringExpr } from "./mixins/StringExpr"
import { TemporalExpr } from "./mixins/TemporalExpr"
import { ArrayExpr } from "./mixins/ArrayExpr"
import { StructExpr } from "./mixins/StructExpr"
import { isObj, isRegExp, isArrayOfType } from "../utils"
import { DataType } from "../datatypes"
import type { IntoExpr, IExpr, DataFrameSchema, ColumnDict } from "../types"
import { assertNotNull, SchemaError } from "../exceptions"
import { ALL_COLUMNS_MARKER } from "./constants"

export class ColumnExpr<T> extends ExprBase {
    _colName: string = "";
    _colNames?: string[];
    _excludedCols: string[] = [];
    _targetType?: any;
    _targetTypes?: any[];
    _pattern?: RegExp;
    _patterns?: RegExp[];

    static isColExpr(v: unknown): v is ColumnExpr<any> {
        if (!isObj(v)) return false;
        try {
            return "evaluate" in v && typeof (v as any).evaluate === "function";
        } catch {
            return false;
        }
    }

    static toColExpr(col: IntoExpr | IntoExpr[]): ColumnExpr<any> {
        assertNotNull(col, "Column reference cannot be null or undefined.");
        return ColumnExpr.isColExpr(col) ? col : new ColumnExpr(col as string | string[]);
    }

    /**
     * Creates a column expression representing a column or a raw expression value.
     * @namespace $df.col
     * @category ColumnExpression
     * @syntax $df.col(<column_name>).{symbol}(...)
     */
    constructor(colName: keyof T | string | (keyof T | string)[] | RegExp | RegExp[] | DataType | Function | (DataType | Function)[]) {
        super();

        if (isRegExp(colName)) {
            this._patterns = [colName];
            return;
        }

        if (colName instanceof DataType || typeof colName === "function") {
            this._targetTypes = [colName];
            return;
        }

        if (!Array.isArray(colName)) {
            this._colName = String(colName);
            this._outputName = this._colName;
            return;
        }

        if (isArrayOfType(colName, (x) => x instanceof DataType || typeof x === "function", { mode: "some" })) {
            this._targetTypes = colName;
            return;
        }

        const len = colName.length;
        const strings: string[] = [];
        let patterns: RegExp[] | undefined;

        for (let i = 0; i < len; i++) {
            const item = colName[i];
            if (isRegExp(item)) {
                (patterns ??= []).push(item);
            } else {
                strings.push(String(item));
            }
        }

        if (patterns) this._patterns = patterns;
        if (strings.length > 0) this._colNames = strings;
    }
}

export interface ColumnExpr<T> extends
    StandardExpr,
    StringExpr,
    TemporalExpr,
    ArrayExpr,
    StructExpr { }

function _applyMixins(derivedCtor: any, constructors: any[]) {
    for (const baseCtor of constructors) {
        for (const name of Object.getOwnPropertyNames(baseCtor.prototype)) {
            if (name !== 'constructor') {
                Object.defineProperty(
                    derivedCtor.prototype,
                    name,
                    Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
                );
            }
        }
    }
}

_applyMixins(ColumnExpr, [
    StandardExpr,
    StringExpr,
    TemporalExpr,
    ArrayExpr,
    StructExpr
]);

/**
 * @internal
 * Determines which concrete keys a column selector matches.
 * Returns null if the expression is not a multi-column selector.
 */
function _getTargetKeys(
    expr: any,
    allKeys: string[],
    excludeSet: Set<string>,
    schema?: DataFrameSchema
): string[] | null {
    if (expr instanceof ColumnExpr && expr._colNames?.length) {
        return expr._colNames;
    }

    if (!(expr instanceof ColumnExpr) && (!isObj(expr) || !("evaluate" in expr) || expr._colName)) {
        return null;
    }

    let predicate: (key: string) => boolean;

    if (!(expr instanceof ColumnExpr)) {
        predicate = () => true;
    } else if (expr._colName === ALL_COLUMNS_MARKER) {
        const excluded = new Set(expr._excludedCols);
        predicate = (k) => !excluded.has(k);
    } else if (expr._patterns?.length) {
        const patterns = expr._patterns;
        const numPatterns = patterns.length;
        predicate = (k) => {
            for (let i = 0; i < numPatterns; i++) {
                patterns[i].lastIndex = 0;
                if (patterns[i].test(k)) return true;
            }
            return false;
        };
    } else if (expr._targetTypes?.length) {
        if (!schema) {
            throw new SchemaError("Cannot resolve DataType column selector without DataFrame schema.");
        }
        const types = expr._targetTypes;
        const numTypes = types.length;
        predicate = (k) => {
            const colType = schema[k];
            if (!colType) return false;
            for (let i = 0; i < numTypes; i++) {
                if (colType.matches(types[i])) return true;
            }
            return false;
        };
    } else {
        return null;
    }

    const targets: string[] = [];
    const allLen = allKeys.length;
    for (let i = 0; i < allLen; i++) {
        const key = allKeys[i];
        if (!excludeSet.has(key) && predicate(key)) {
            targets.push(key);
        }
    }
    return targets;
}

/**
 * @internal
 * Resolves column selectors, expanding wildcards, datatypes, and arrays of columns/types
 * into concrete ColumnExpr instances.
 */
export function resolveColumnSelectors(
    exprs: any[],
    allKeys: string[],
    keysToExcludeFromAll?: string[],
    schema?: DataFrameSchema,
    columns?: ColumnDict
): IExpr[] {
    const expanded: IExpr[] = [];
    const excludeSet = keysToExcludeFromAll ? new Set(keysToExcludeFromAll) : new Set<string>();

    for (let i = 0; i < exprs.length; i++) {
        const expr = exprs[i];

        if (typeof expr === "string") {
            expanded.push(new ColumnExpr(expr));
            continue;
        }

        // Handle struct unnesting expansion
        if (isObj(expr) && expr._isUnnest && expr._baseExpr) {
            const baseExpr = expr._baseExpr as IExpr;
            let fields: string[] = [];
            const colName = expr._colName;
            if (typeof colName === "string" && schema && schema[colName] && schema[colName].name === "Struct") {
                fields = Object.keys((schema[colName] as any).fields);
            }
            if (fields.length === 0 && columns) {
                const columnsKeys = Object.keys(columns);
                const firstKey = columnsKeys[0];
                const height = firstKey ? columns[firstKey].length : 0;
                const evaluated = baseExpr.evaluate(columns, height);
                const evalLen = evaluated.length;
                for (let idx = 0; idx < evalLen; idx++) {
                    const item = evaluated[idx];
                    if (item != null && typeof item === "object") {
                        fields = Object.keys(item);
                        break;
                    }
                }
            }
            const fieldsLen = fields.length;
            if (fieldsLen > 0) {
                for (let fIdx = 0; fIdx < fieldsLen; fIdx++) {
                    const fieldName = fields[fIdx];
                    const fieldExpr = (baseExpr as any).struct.field(fieldName);
                    expanded.push(fieldExpr);
                }
                continue;
            }
        }

        const targets = _getTargetKeys(expr, allKeys, excludeSet, schema);
        if (targets !== null) {
            for (let j = 0; j < targets.length; j++) {
                const concrete = new ColumnExpr(targets[j]);
                concrete._ops = [...(expr._ops || [])];
                concrete._aggFn = expr._aggFn;
                concrete._partitionOpsIndex = expr._partitionOpsIndex;
                concrete._groupingOpsIndex = expr._groupingOpsIndex;
                concrete._partitionBy = expr._partitionBy;
                if (expr._evaluateWindow) {
                    concrete._evaluateWindow = expr._evaluateWindow;
                }
                if (expr._outputName && expr._outputName !== ALL_COLUMNS_MARKER) {
                    concrete._outputName = expr._outputName;
                }
                expanded.push(concrete);
            }
        } else {
            expanded.push(expr);
        }
    }

    return expanded;
}

