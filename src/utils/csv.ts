/** @internalfile */
import type { ColumnDict } from "../types";
import { strftime, toValidDate } from "./date";
import { createSafeJsonReplacer, type SafeJsonReplacerOptions } from "./json";
import { formatNumber, toValidNumber, toValidBigInt, type NumericFormatOptions } from "./number";
import { NEWLINE, CARRIAGE_RETURN, UTF8_BOM, NEWLINE_REGEX } from "../constants";
import { DataType, Utf8, Boolean as BoolType, Int64, Float64, Datetime } from "../datatypes";
import type { ReadCSVOptions } from "../dataframe/types";
import { unboxPrimitiveObj, isValidDateObj } from "./object";
import { replaceString, stripChars } from "./string";

export interface FormatCSVValueOptions {
    /**
     * The string representation to use for null/missing values.
     * @default ""
     */
    nullValue?: string;

    /**
     * Custom format string for Date values (e.g. "%Y-%m-%d").
     */
    dateFormat?: string;

    /**
     * Custom format string for Time values (e.g. "%H:%M:%S").
     */
    timeFormat?: string;

    /**
     * Custom format string for Datetime values (e.g. "%Y-%m-%d %H:%M:%S").
     */
    datetimeFormat?: string;

    /**
     * Options for numeric formatting (floats, ints, bigints).
     */
    numericFormatOptions?: NumericFormatOptions;

    /**
     * Options for the safe JSON replacer used when formatting objects/arrays.
     */
    replacerOptions?: SafeJsonReplacerOptions;
}

export interface WriteCSVOptions extends FormatCSVValueOptions {
    /**
     * Whether to write the header row.
     * @default true
     */
    includeHeader?: boolean;

    /**
     * Character that separates fields.
     * @default ","
     */
    separator?: string;

    /**
     * The string used to end each row.
     * @default "\n"
     */
    lineTerminator?: string;

    /**
     * The character used for quoting fields.
     * @default '"'
     */
    quoteChar?: string;

    /**
     * Defines when to use quotes.
     * - "necessary": Quotes only when required (e.g., value contains separator, quote_char, or newlines).
     * - "always": Quotes every field.
     * - "never": Never quotes fields.
     * - "non_numeric": Quotes all fields that are non-numeric.
     * @default "necessary"
     */
    quoteStyle?: "necessary" | "always" | "never" | "non_numeric";

    /**
     * Whether to include a Byte Order Mark (BOM) at the start of the file.
     * @default false
     */
    includeBom?: boolean;
}

// Removed stringifyCsvObject

export function formatCsvValue(options: FormatCSVValueOptions = {}) {
    const nullValue = options.nullValue !== undefined ? options.nullValue : "";
    const formatNum = formatNumber(options.numericFormatOptions);
    const replacerOptions = options.replacerOptions || {};

    const format = options.datetimeFormat ?? options.dateFormat ?? options.timeFormat;
    const formatDate = format
        ? (v: Date): string => (isValidDateObj(v) ? strftime(v, { format }) : nullValue)
        : (v: Date): string => (isValidDateObj(v) ? v.toISOString() : nullValue);

    const mergedReplacerOptions: SafeJsonReplacerOptions = {
        formatDate,
        onBigInt: formatNum,
        ...replacerOptions
    };

    const replacer = createSafeJsonReplacer(mergedReplacerOptions);

    return (val: any): { str: string; isNumeric: boolean } => {
        if (val === null || val === undefined || typeof val === "symbol" || typeof val === "function" || (val instanceof Date && !isValidDateObj(val))) {
            return { str: nullValue, isNumeric: false };
        }

        const raw = replacer.call(null, "", val);
        const res = unboxPrimitiveObj(raw);

        if (res === null || res === undefined || typeof res === "symbol" || typeof res === "function") {
            return { str: nullValue, isNumeric: false };
        }
        if (typeof val === "bigint" || typeof val === "number") {
            return { str: typeof res === "string" ? res : formatNum(res), isNumeric: true };
        }
        if (typeof res === "number" || typeof res === "bigint") {
            return { str: formatNum(res), isNumeric: true };
        }
        if (typeof res === "string") {
            return { str: res, isNumeric: false };
        }
        if (typeof res === "boolean") {
            return { str: res ? "true" : "false", isNumeric: false };
        }
        if (typeof res === "object") {
            return {
                str: JSON.stringify(res, createSafeJsonReplacer(mergedReplacerOptions)),
                isNumeric: false
            };
        }

        return { str: String(res), isNumeric: false };
    };
}

export function stringifyCSV(
    columns: ColumnDict,
    height: number,
    options: WriteCSVOptions & { onRow?: (rowStr: string) => void } = {}
): string {
    const {
        separator = ",",
        quoteChar = '"',
        includeHeader = true,
        lineTerminator = NEWLINE,
        quoteStyle = "necessary",
        includeBom = false,
        onRow,
        ...formatOptions
    } = options;

    const keys = Object.keys(columns);
    const numKeys = keys.length;
    const lines: string[] = [];
    let isFirstRow = true;

    const formatValue = formatCsvValue(formatOptions);

    const escapeAndQuote = (val: any, isHeader = false): string => {
        const formatted = isHeader ? { str: String(val), isNumeric: false } : formatValue(val);
        const strVal = formatted.str;
        if (quoteStyle === "never") return strVal;

        const shouldQuote =
            quoteStyle === "always" ||
            (quoteStyle === "non_numeric" && (isHeader || (!formatted.isNumeric && val != null))) ||
            strVal.includes(separator) ||
            strVal.includes(quoteChar) ||
            NEWLINE_REGEX.test(strVal);

        if (!shouldQuote) return strVal;
        const escaped = replaceString(strVal, quoteChar, quoteChar + quoteChar, { literal: true, n: Infinity })!;
        return quoteChar + escaped + quoteChar;
    };

    const outputLine = (line: string) => {
        const prefix = isFirstRow ? (includeBom ? UTF8_BOM : "") : (onRow ? lineTerminator : "");
        isFirstRow = false;
        const fullLine = prefix + line;
        if (onRow) onRow(fullLine);
        else lines.push(fullLine);
    };

    const writeRow = (getVal: (i: number) => any, isHeader: boolean) => {
        const row = new Array(numKeys);
        for (let i = 0; i < numKeys; i++) {
            row[i] = escapeAndQuote(getVal(i), isHeader);
        }
        outputLine(row.join(separator));
    };

    if (includeHeader) writeRow((i) => keys[i], true);
    for (let r = 0; r < height; r++) writeRow((i) => columns[keys[i]][r], false);

    return onRow ? (includeBom ? UTF8_BOM : "") : lines.join(lineTerminator);
}

export function parseCSV(content: string, options: ReadCSVOptions = {}): string[][] {
    const separator = options.separator || ",";
    const quoteChar = options.quoteChar || '"';

    const csvContent = stripChars(content, UTF8_BOM, { mode: "start", returnStringOnNull: true }) ?? "";

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let inQuotes = false;
    let hasRowData = false;

    const flushCell = () => {
        currentRow.push(currentCell);
        currentCell = "";
    };

    const flushRow = () => {
        if (!hasRowData && currentRow.length === 0 && currentCell === "") return;
        flushCell();
        rows.push(currentRow);
        currentRow = [];
        hasRowData = false;
    };

    const len = csvContent.length;
    for (let i = 0; i < len; i++) {
        const char = csvContent[i];

        if (inQuotes) {
            hasRowData = true;
            if (char !== quoteChar) {
                currentCell += char;
                continue;
            }

            if (i + 1 < len && csvContent[i + 1] === quoteChar) {
                currentCell += quoteChar;
                i++; // Skip escaped quote
                continue;
            }

            inQuotes = false;
            continue;
        }

        if (char === quoteChar) {
            hasRowData = true;
            if (currentCell.length === 0) {
                inQuotes = true;
                continue;
            }
            currentCell += quoteChar;
            continue;
        }

        if (char === separator) {
            hasRowData = true;
            flushCell();
            continue;
        }

        if (char === CARRIAGE_RETURN || char === NEWLINE) {
            if (char === CARRIAGE_RETURN && i + 1 < len && csvContent[i + 1] === NEWLINE) {
                i++; // Skip \n in \r\n
            }
            flushRow();
            continue;
        }

        hasRowData = true;
        currentCell += char;
    }

    flushRow();

    return rows;
}

export function inferAndCoerceCSVColumn(
    values: string[],
    options: ReadCSVOptions = {}
): { type: DataType; values: any[] } {
    const nullValues = new Set(options.nullValues ?? ["", "NA", "null", "NaN"]);
    const len = values.length;

    const candidates = [
        {
            type: BoolType,
            parse: (v: string): boolean | null => {
                const l = v.toLowerCase();
                return (l === "true" || l === "1") ? true : (l === "false" || l === "0") ? false : null;
            },
            active: true
        },
        {
            type: Int64,
            parse: (v: string) => toValidBigInt(v, { truncate: false }),
            active: true
        },
        {
            type: Float64,
            parse: (v: string) => toValidNumber(v, { allowNonFiniteNumbers: true }),
            active: true
        },
        {
            type: Datetime,
            parse: (v: string) => toValidDate(v),
            active: true
        }
    ];

    let hasValidData = false;

    for (let i = 0; i < len; i++) {
        const val = stripChars(values[i], null, { returnStringOnNull: true }) ?? "";
        if (nullValues.has(val)) continue;

        hasValidData = true;
        let anyActive = false;

        for (let c = 0; c < candidates.length; c++) {
            const cand = candidates[c];
            if (!cand.active) continue;
            if (cand.parse(val) === null) {
                cand.active = false;
            } else {
                anyActive = true;
            }
        }

        if (!anyActive) break;
    }

    const match = hasValidData ? candidates.find(c => c.active) : undefined;
    const type = match?.type ?? Utf8;
    const parseFn = match?.parse;

    const out = new Array(len);
    for (let i = 0; i < len; i++) {
        const raw = values[i];
        const trimmed = stripChars(raw, null, { returnStringOnNull: true }) ?? "";
        out[i] = nullValues.has(trimmed) ? null : (parseFn ? parseFn(trimmed) : raw);
    }

    return { type, values: out };
}
