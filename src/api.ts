import { DataFrame } from "./dataframe"
import { ColumnExpr, lit, all, exclude, coalesce, when, implode, seqRange, element, struct, duration, horizontal } from "./columnExpressions"

import { DataTypeRegistry, DataType } from "./datatypes"
import { concat, readJson, readCsv } from "./functions"
import type { RowRecord, DataFrameSchema, ColumnDict, InferSchema } from "./types"

function data<S extends DataFrameSchema>(data: any[] | ColumnDict, schema: S): DataFrame<InferSchema<S>>;
function data<T extends RowRecord = any>(data: T[] | ColumnDict, schema?: DataFrameSchema): DataFrame<T>;
function data(data: any[] | ColumnDict, schema?: DataFrameSchema): DataFrame<any> {
    return new DataFrame(data, schema);
}

export const $df = {
    all,
    coalesce,
    col: <T = any>(
        name: keyof T | string | (keyof T | string)[] | RegExp | RegExp[] | DataType | Function | (DataType | Function)[]
    ) => new ColumnExpr<T>(name),
    concat,
    data,
    duration,
    element,
    exclude,
    horizontal,
    implode,
    lit,
    readCsv,
    readJson,
    seqRange,
    struct,
    when,
    ...DataTypeRegistry,
};

