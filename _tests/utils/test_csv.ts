declare const process: any;
declare const __dirname: string;
declare const require: any;
import { DataFrame } from "../../src/index";
import { formatCsvValue, parseCSV, inferAndCoerceCSVColumn } from "../../src/utils";
const fs = typeof require === "function" ? require("fs") : null;
const path = typeof require === "function" ? require("path") : null;

console.log("=========================================");
console.log("STARTING DATAFRAME CSV WRITE TESTS...");
console.log("=========================================");

try {
    const df = new DataFrame([
        { id: 1, name: "Alice", note: "Hello, world!", score: 95.1234, extra: null },
        { id: 2, name: "Bob", note: 'He said "hello!"', score: 88.0, extra: "yes" },
        { id: 3, name: "Charlie", note: "Line 1\nLine 2", score: null, extra: null }
    ]);

    // Test formatCsvValue standalone
    if (formatCsvValue({ nullValue: "N/A" })(null).str !== "N/A" || formatCsvValue({ nullValue: "N/A" })(null).isNumeric !== false) {
        throw new Error("formatCsvValue failed to format nulls");
    }
    if (formatCsvValue({ nullValue: "N/A" })(undefined).str !== "N/A") {
        throw new Error("formatCsvValue failed to format undefined");
    }
    if (formatCsvValue({ nullValue: "N/A" })(Symbol("sym")).str !== "N/A") {
        throw new Error("formatCsvValue failed to format Symbol");
    }
    if (formatCsvValue({ nullValue: "N/A" })(() => {}).str !== "N/A") {
        throw new Error("formatCsvValue failed to format Function");
    }
    if (formatCsvValue({ numericFormatOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 } })(123.456).str !== "123.46") {
        throw new Error("formatCsvValue failed to format float precision");
    }
    if (formatCsvValue({ numericFormatOptions: { locale: "de-DE" } })(123.456).str !== "123,456" || formatCsvValue()(123.456).isNumeric !== true) {
        throw new Error("formatCsvValue failed to format decimal comma");
    }
    if (formatCsvValue()(new Number(1.5)).str !== "1.5" || formatCsvValue({ numericFormatOptions: { locale: "de-DE" } })(new Number(1.5)).str !== "1,5") {
        throw new Error("formatCsvValue failed to format boxed Number");
    }
    if (formatCsvValue()(new String("wrapper")).str !== "wrapper" || formatCsvValue()(new String("wrapper")).isNumeric !== false) {
        throw new Error("formatCsvValue failed to format boxed String");
    }
    if (formatCsvValue()(new Boolean(false)).str !== "false") {
        throw new Error("formatCsvValue failed to format boxed Boolean");
    }
    if (formatCsvValue()(12345n).str !== "12345" || formatCsvValue()(12345n).isNumeric !== true) {
        throw new Error("formatCsvValue failed to format BigInt");
    }
    if (formatCsvValue({ numericFormatOptions: { locale: "de-DE", useGrouping: true } })(1000000n).str !== "1.000.000") {
        throw new Error("formatCsvValue failed to format BigInt with numericFormatOptions");
    }
    if (formatCsvValue({ replacerOptions: { onBigInt: (bi: bigint) => `BIG_${bi}` } })(123n).str !== "BIG_123") {
        throw new Error("formatCsvValue failed with custom onBigInt replacer");
    }
    const circularObj: any = { a: 1 };
    circularObj.self = circularObj;
    if (formatCsvValue({ replacerOptions: { handleCircular: true } })(circularObj).str !== '{"a":1,"self":"[Circular]"}') {
        throw new Error("formatCsvValue failed with circular object");
    }
    if (formatCsvValue()(new Set([1, 2])).str !== "[1,2]") {
        throw new Error("formatCsvValue failed to format Set");
    }
    if (formatCsvValue()(new Map([["a", 1]])).str !== '[["a",1]]') {
        throw new Error("formatCsvValue failed to format Map");
    }
    if (formatCsvValue()(/foo/i).str !== "/foo/i") {
        throw new Error("formatCsvValue failed to format RegExp");
    }
    if (formatCsvValue()({ nested: 9876543210n }).str !== '{"nested":"9876543210"}') {
        throw new Error("formatCsvValue failed to format nested BigInt in object");
    }
    if (formatCsvValue({ datetimeFormat: "%Y-%m-%d %H:%M:%S" })(new Date("2026-06-14T12:34:56Z")).str !== "2026-06-14 12:34:56") {
        throw new Error("formatCsvValue failed to format Date with datetimeFormat");
    }

    // 1. Test standard write_csv (string output, auto-quotes, headers)
    const csvStr = df.write_csv();
    if (typeof csvStr !== "string") throw new Error("write_csv output was not a string");
    
    const lines = csvStr.split("\n");
    // Expected 5 lines due to the embedded newline in Charlie's note splitting the split output.
    if (lines.length !== 5) throw new Error("Expected 5 lines in CSV output (due to embedded newline)");
    if (lines[0] !== "id,name,note,score,extra") throw new Error("Header line mismatch");
    if (lines[1] !== '1,Alice,"Hello, world!",95.1234,') throw new Error("Normal quoting failed");
    if (lines[2] !== '2,Bob,"He said ""hello!""",88,yes') throw new Error("Escaped quote handling failed");
    
    const rawCSV = df.write_csv();
    if (!rawCSV.includes('"Line 1\nLine 2"')) throw new Error("Embedded newline quoting failed");

    // 2. Test headers: false (or includeHeader: false)
    const noHeaderCSV = df.write_csv(undefined, { includeHeader: false });
    if (noHeaderCSV.includes("id,name,note")) throw new Error("Headers found when includeHeader option is false");

    // 3. Test quoteStyle: "always"
    const alwaysQuoted = df.write_csv(undefined, { quoteStyle: "always" });
    const alwaysLines = alwaysQuoted.split("\n");
    if (alwaysLines[0] !== '"id","name","note","score","extra"') {
        throw new Error("quoteStyle: always failed for headers");
    }
    if (alwaysLines[1] !== '"1","Alice","Hello, world!","95.1234",""') {
        throw new Error("quoteStyle: always failed for data row");
    }

    // 4. Test quoteStyle: "never"
    const neverQuoted = df.write_csv(undefined, { quoteStyle: "never" });
    const neverLines = neverQuoted.split("\n");
    if (neverLines[2] !== '2,Bob,He said "hello!",88,yes') {
        throw new Error("quoteStyle: never failed to output raw unescaped values");
    }

    // 4b. Test quoteStyle: "non_numeric"
    const nonNumericQuoted = df.write_csv(undefined, { quoteStyle: "non_numeric" });
    const nonNumericLines = nonNumericQuoted.split("\n");
    if (nonNumericLines[0] !== '"id","name","note","score","extra"') {
        throw new Error("quoteStyle: non_numeric failed for headers");
    }
    if (nonNumericLines[1] !== '1,"Alice","Hello, world!",95.1234,') {
        throw new Error("quoteStyle: non_numeric failed for data row");
    }

    // 5. Test nullValue
    const customNulls = df.write_csv(undefined, { nullValue: "N/A" });
    if (!customNulls.includes(",N/A") || !customNulls.includes(",N/A,N/A")) {
        throw new Error("nullValue: custom value failed");
    }

    // 6. Test float precision
    const preciseQuoted = df.write_csv(undefined, { numericFormatOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 } });
    if (!preciseQuoted.includes(",95.12,")) {
        throw new Error("numericFormatOptions: custom decimal places failed");
    }

    // 7. Test includeBom
    const bomStr = df.write_csv(undefined, { includeBom: true });
    if (!bomStr.startsWith("\ufeff")) {
        throw new Error("includeBom: missing Byte Order Mark");
    }

    // 8. Test lineTerminator
    const crlfStr = df.write_csv(undefined, { lineTerminator: "\r\n" });
    if (!crlfStr.includes("\r\n")) {
        throw new Error("lineTerminator: custom CR-LF line endings failed");
    }

    // 9. Test writing to a file path
    const tempFilePath = path.join(__dirname, "temp_test_output.csv");
    if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
    }
    df.write_csv(tempFilePath);
    if (!fs.existsSync(tempFilePath)) throw new Error("write_csv to file path failed: file does not exist");
    const fileContent = fs.readFileSync(tempFilePath, "utf8");
    if (!fileContent.includes("Alice") || !fileContent.includes("Bob")) {
        throw new Error("write_csv file content mismatch");
    }
    fs.unlinkSync(tempFilePath);

    // 10. Test writing to a writable-like object (with .write method)
    let writtenStr = "";
    const mockWritable = {
        write(str: string) {
            writtenStr += str;
        }
    };
    df.write_csv(mockWritable);
    if (!writtenStr.includes("Alice") || !writtenStr.includes("Bob")) {
        throw new Error("write_csv to writable-like object failed");
    }

    // 11. Test error handling for invalid file argument
    let errorThrown = false;
    try {
        df.write_csv(123 as any);
    } catch (err: any) {
        errorThrown = true;
        if (!err.message.includes("Invalid file argument")) {
            throw new Error("Wrong error message for invalid file argument");
        }
    }
    if (!errorThrown) throw new Error("write_csv failed to throw on invalid file argument");

    // 12. Test replacerOptions: onBigInt override in write_csv
    const dfBigInt = new DataFrame([{ id: 1, val: 100n }]);
    const csvBigInt = dfBigInt.write_csv(undefined, {
        replacerOptions: {
            onBigInt: (b) => `${b}n`
        }
    });
    if (!csvBigInt.includes("100n")) {
        throw new Error("write_csv onBigInt override failed");
    }

    // 13. Test replacerOptions: onSet override in write_csv
    const dfSet = new DataFrame([{ id: 1, val: new Set(["foo", "bar"]) }]);
    const csvSet = dfSet.write_csv(undefined, {
        replacerOptions: {
            onSet: (s) => Array.from(s).join("|")
        }
    });
    if (!csvSet.includes("foo|bar")) {
        throw new Error("write_csv onSet override failed");
    }

    // 14. Test replacerOptions: onCustom override for arbitrary classes in write_csv
    class CustomVal {
        constructor(public text: string) {}
    }
    const dfCustom = new DataFrame([{ id: 1, val: new CustomVal("testing") }]);
    const csvCustom = dfCustom.write_csv(undefined, {
        replacerOptions: {
            onCustom: (_, v) => (v instanceof CustomVal ? `Custom[${v.text}]` : v)
        }
    });
    if (!csvCustom.includes("Custom[testing]")) {
        throw new Error("write_csv onCustom override failed");
    }

    // 15. Test nested objects/arrays safe serialization inside CSV fields
    const dfNested = new DataFrame([{ id: 1, val: { innerBig: 12345n, innerSet: new Set(["a"]) } }]);
    const csvNested = dfNested.write_csv(undefined, {
        replacerOptions: {
            onBigInt: (b) => `${b}Big`,
            onSet: (s) => Array.from(s).map(x => x + "Set")
        }
    });
    if (!csvNested.includes('"{""innerBig"":""12345Big"",""innerSet"":[""aSet""]}"')) {
        throw new Error(`write_csv nested replacerOptions failed: ${csvNested}`);
    }

    // 16. Comprehensive edge cases for parseCSV
    // CRLF, escaped quotes at end of stream, empty lines, trailing separators, single cell
    const parsed1 = parseCSV("a,b,c\r\n1,2,3\r\n4,\"hello \"\"world\"\"\",6");
    if (parsed1.length !== 3 || parsed1[2][1] !== 'hello "world"') {
        throw new Error("parseCSV failed on CRLF and escaped quotes");
    }
    // Trailing empty fields
    const parsedTrailing = parseCSV("a,b,c\n1,,");
    if (parsedTrailing.length !== 2 || parsedTrailing[1].length !== 3 || parsedTrailing[1][1] !== "" || parsedTrailing[1][2] !== "") {
        throw new Error("parseCSV failed to retain trailing empty fields");
    }
    // UTF8 BOM stripping
    const parsedBom = parseCSV("\ufeffa,b\n1,2");
    if (parsedBom[0][0] !== "a") {
        throw new Error("parseCSV failed to strip UTF-8 BOM");
    }

    // 17. Comprehensive edge cases for inferAndCoerceCSVColumn
    // (A) Boolean Column with mixed valid nulls
    const boolRes = inferAndCoerceCSVColumn(["true", "FALSE", "True", "false", "", "NA", "null"]);
    if (boolRes.type.name !== "Boolean" || boolRes.values[0] !== true || boolRes.values[1] !== false || boolRes.values[4] !== null) {
        throw new Error("inferAndCoerceCSVColumn failed Boolean inference");
    }

    // (B) Int64 Column with BigInt literals and nulls
    const intRes = inferAndCoerceCSVColumn(["100", "9223372036854775807", "-9223372036854775808", "null", ""]);
    if (intRes.type.name !== "Int64" || intRes.values[1] !== 9223372036854775807n || intRes.values[3] !== null) {
        throw new Error("inferAndCoerceCSVColumn failed Int64 inference");
    }

    // (C) Float64 Column with scientific notation, Infinity, and decimals
    const floatRes = inferAndCoerceCSVColumn(["1.23", "-4.56e2", "1e-5", "Infinity", "NaN", ""]);
    if (floatRes.type.name !== "Float64" || floatRes.values[0] !== 1.23 || floatRes.values[1] !== -456 || floatRes.values[3] !== Infinity || floatRes.values[4] !== null || floatRes.values[5] !== null) {
        throw new Error("inferAndCoerceCSVColumn failed Float64 inference");
    }

    // (D) Datetime Column with ISO date-only and ISO datetime formats
    const dateRes = inferAndCoerceCSVColumn(["2026-05-25", "2026-05-25T10:30:00Z", "null", ""]);
    if (dateRes.type.name !== "Datetime" || !(dateRes.values[0] instanceof Date) || dateRes.values[2] !== null) {
        throw new Error("inferAndCoerceCSVColumn failed Datetime inference");
    }

    // (E) All Null Column -> defaults to Utf8
    const allNullRes = inferAndCoerceCSVColumn(["", "NA", "null", "NaN"]);
    if (allNullRes.type.name !== "Utf8" || allNullRes.values.some(v => v !== null)) {
        throw new Error("inferAndCoerceCSVColumn failed all-null column default to Utf8");
    }

    // (F) Mixed type fallback -> strictly Utf8 with preserved null representations
    const mixedRes = inferAndCoerceCSVColumn(["100", "hello", "true", "2026-05-25", ""]);
    if (mixedRes.type.name !== "Utf8" || mixedRes.values[0] !== "100" || mixedRes.values[1] !== "hello" || mixedRes.values[4] !== null) {
        throw new Error("inferAndCoerceCSVColumn failed mixed column fallback to Utf8");
    }

    // 18. Additional Frontier Edge Cases
    // (A) Custom separator (pipe '|') and custom quote character (single quote "'")
    const dfCustomDelim = new DataFrame([
        { a: "1|2", b: "it's" }
    ]);
    const customCSV = dfCustomDelim.write_csv(undefined, { separator: "|", quoteChar: "'" });
    if (!customCSV.includes("'1|2'|'it''s'")) {
        throw new Error(`write_csv custom separator & quoteChar failed: ${customCSV}`);
    }

    // (B) parseCSV with custom pipe separator and single quote
    const parsedCustom = parseCSV("a|b\n'1|2'|'it''s'", { separator: "|", quoteChar: "'" });
    if (parsedCustom.length !== 2 || parsedCustom[1][0] !== "1|2" || parsedCustom[1][1] !== "it's") {
        throw new Error("parseCSV custom separator and quoteChar failed");
    }

    // (C) Single column CSV with empty rows
    const parsedSingle = parseCSV("col\nvalA\nvalB\n");
    if (parsedSingle.length !== 3 || parsedSingle[1][0] !== "valA" || parsedSingle[2][0] !== "valB") {
        throw new Error("Single column roundtrip failed");
    }

    // (D) Special whitespace / line endings: carriage return only (\r)
    const crOnlyParsed = parseCSV("col1,col2\rval1,val2");
    if (crOnlyParsed.length !== 2 || crOnlyParsed[1][0] !== "val1" || crOnlyParsed[1][1] !== "val2") {
        throw new Error("parseCSV failed on standalone \\r line terminator");
    }

    // (E) CSV with unclosed trailing quote
    const unclosedQuoteParsed = parseCSV('col1,col2\n"val1,val2');
    if (unclosedQuoteParsed.length !== 2 || unclosedQuoteParsed[1][0] !== "val1,val2") {
        throw new Error("parseCSV failed on unclosed trailing quote");
    }

    // 19. 10/10 Comprehensive Edge Case Tests
    // Test 1: UTF-8 BOM Handling in parseCSV and write_csv
    const bomCsv = "\uFEFFa,b\n1,2";
    const bomParsed = parseCSV(bomCsv);
    if (bomParsed.length !== 2 || bomParsed[0][0] !== "a" || bomParsed[1][0] !== "1") {
        throw new Error("Edge Case 1 failed: UTF-8 BOM stripping in parseCSV");
    }
    const dfBom = new DataFrame([{ x: 10 }]);
    const bomWritten = dfBom.write_csv(undefined, { includeBom: true });
    if (!bomWritten.startsWith("\uFEFFx\n10")) {
        throw new Error("Edge Case 1 failed: includeBom in write_csv");
    }

    // Test 2: Multi-character and escaped quotes inside quotes
    const multiEscaped = parseCSV('col\n"He said ""hello"""" to me"');
    if (multiEscaped.length !== 2 || multiEscaped[1][0] !== 'He said "hello"" to me') {
        throw new Error("Edge Case 2 failed: multi-character escaped quotes inside quotes");
    }

    // Test 3: CRLF with quotes spanning multiple newlines
    const multiLineQuoted = parseCSV('id,desc\n1,"Line 1\r\nLine 2\rLine 3\nLine 4"\n2,End');
    if (multiLineQuoted.length !== 3 || multiLineQuoted[1][1] !== "Line 1\r\nLine 2\rLine 3\nLine 4" || multiLineQuoted[2][1] !== "End") {
        throw new Error("Edge Case 3 failed: quotes spanning mixed CRLF, CR, LF newlines");
    }

    // Test 4: Trailing empty delimiters & trailing rows
    const trailingDelims = parseCSV("a,b,c\n1,,\n,,\n");
    if (trailingDelims.length !== 3 || trailingDelims[1][0] !== "1" || trailingDelims[1][1] !== "" || trailingDelims[1][2] !== "" || trailingDelims[2].length !== 3) {
        throw new Error("Edge Case 4 failed: trailing empty delimiters and empty rows");
    }

    // Test 5: Empty and blank string content
    const emptyParsed = parseCSV("");
    if (emptyParsed.length !== 0) {
        throw new Error("Edge Case 5 failed: empty CSV string should return 0 rows");
    }
    const whitespaceOnlyParsed = parseCSV("   \n   \n");
    if (whitespaceOnlyParsed.length !== 2 || whitespaceOnlyParsed[0][0] !== "   ") {
        throw new Error("Edge Case 5 failed: whitespace only preservation");
    }

    // Test 6: Zero & negative numbers, scientific notation BigInt/Float inference
    const numInferRes = inferAndCoerceCSVColumn(["0", "-0", "+42", "-100", "007"]);
    if (numInferRes.type.name !== "Int64" || numInferRes.values[0] !== 0n || numInferRes.values[1] !== 0n || numInferRes.values[2] !== 42n || numInferRes.values[4] !== 7n) {
        throw new Error("Edge Case 6 failed: signed and leading-zero integer inference");
    }

    // Test 7: Streaming row writing via writable stream target
    const streamedRows: string[] = [];
    const streamDf = new DataFrame([{ a: 1, b: "x" }, { a: 2, b: "y" }]);
    streamDf.write_csv({ write: (r: string) => streamedRows.push(r) });
    if (streamedRows.length !== 3 || streamedRows[0] !== "a,b" || streamedRows[1] !== "\n1,x" || streamedRows[2] !== "\n2,y") {
        throw new Error("Edge Case 7 failed: write_csv streaming write method target");
    }

    // Test 8: Custom null values in inferAndCoerceCSVColumn
    const customNullInfer = inferAndCoerceCSVColumn(["10", "N/A", "20", "MISSING", "30"], { nullValues: ["N/A", "MISSING"] });
    if (customNullInfer.type.name !== "Int64" || customNullInfer.values[1] !== null || customNullInfer.values[3] !== null || customNullInfer.values[0] !== 10n) {
        throw new Error("Edge Case 8 failed: custom null values in inferAndCoerceCSVColumn");
    }

    // Test 9: Tab-separated (TSV) with embedded tabs and quotes
    const tsvData = new DataFrame([{ col1: "val\t1", col2: 'quoted "tab"' }]);
    const tsvOut = tsvData.write_csv(undefined, { separator: "\t" });
    if (!tsvOut.includes('"val\t1"\t"quoted ""tab"""')) {
        throw new Error(`Edge Case 9 failed: TSV generation: ${tsvOut}`);
    }
    const tsvParsed = parseCSV(tsvOut, { separator: "\t" });
    if (tsvParsed[1][0] !== "val\t1" || tsvParsed[1][1] !== 'quoted "tab"') {
        throw new Error("Edge Case 9 failed: TSV roundtrip parsing");
    }

    // Test 10: Boolean 0/1 mixed with true/false case-insensitivity
    const boolMixedInfer = inferAndCoerceCSVColumn(["TRUE", "false", "True", "FALSE", "1", "0", ""]);
    if (boolMixedInfer.type.name !== "Boolean" || boolMixedInfer.values[0] !== true || boolMixedInfer.values[1] !== false || boolMixedInfer.values[4] !== true || boolMixedInfer.values[5] !== false || boolMixedInfer.values[6] !== null) {
        throw new Error("Edge Case 10 failed: case-insensitive boolean and 0/1 inference");
    }

    // 20. 10 Additional Frontier Edge Cases (Tests 11-20)
    // Test 11: Mixed CR, LF, and CRLF with empty lines in parseCSV
    const mixedNewlines = parseCSV("col1,col2\r\n\rval1,val2\n\nval3,val4\r");
    if (mixedNewlines.length !== 3 || mixedNewlines[1][0] !== "val1" || mixedNewlines[2][0] !== "val3") {
        throw new Error("Edge Case 11 failed: mixed CR, LF, and CRLF with empty lines");
    }

    // Test 12: Embedded separators and line breaks inside quotes with custom lineTerminator
    const customLineTermDf = new DataFrame([{ a: "hello\nworld", b: "foo,bar" }]);
    const customTermCsv = customLineTermDf.write_csv(undefined, { lineTerminator: "\r\n" });
    if (!customTermCsv.includes("a,b\r\n\"hello\nworld\",\"foo,bar\"")) {
        throw new Error("Edge Case 12 failed: custom lineTerminator with embedded newlines and separators");
    }

    // Test 13: Quotes at the start, middle, and end of a single cell
    const quotePositions = parseCSV('col\n"""start"""\n"mid""dle"\n"""end"""');
    if (quotePositions.length !== 4 || quotePositions[1][0] !== '"start"' || quotePositions[2][0] !== 'mid"dle' || quotePositions[3][0] !== '"end"') {
        throw new Error("Edge Case 13 failed: quote positions at boundaries and middle");
    }

    // Test 14: inferAndCoerceCSVColumn with float decimals containing trailing zeros and negative exponent
    const floatPrecInfer = inferAndCoerceCSVColumn(["0.000", "-1.5000", "1.23e-4", "NaN"]);
    if (floatPrecInfer.type.name !== "Float64" || floatPrecInfer.values[0] !== 0 || floatPrecInfer.values[1] !== -1.5 || floatPrecInfer.values[2] !== 0.000123 || floatPrecInfer.values[3] !== null) {
        throw new Error("Edge Case 14 failed: float decimals with trailing zeros and negative exponents");
    }

    // Test 15: inferAndCoerceCSVColumn with BigInt boundary limits (INT64_MAX, INT64_MIN)
    const bigIntLimitsInfer = inferAndCoerceCSVColumn(["9223372036854775807", "-9223372036854775808", "0"]);
    if (bigIntLimitsInfer.type.name !== "Int64" || bigIntLimitsInfer.values[0] !== 9223372036854775807n || bigIntLimitsInfer.values[1] !== -9223372036854775808n) {
        throw new Error("Edge Case 15 failed: Int64 min and max boundary inference");
    }

    // Test 16: write_csv with custom date, time, and datetime formatting
    const temporalDf = new DataFrame([{ d: new Date("2026-08-17T14:30:45Z") }]);
    const formattedTemporal = temporalDf.write_csv(undefined, { datetimeFormat: "%Y/%m/%d %H:%M:%S" });
    if (!formattedTemporal.includes("2026/08/17 14:30:45")) {
        throw new Error("Edge Case 16 failed: custom datetime formatting");
    }

    // Test 17: Consecutive empty columns in both parse and stringify
    const emptyColsDf = new DataFrame([{ a: "", b: "", c: "" }]);
    const emptyColsCsv = emptyColsDf.write_csv(undefined, { quoteStyle: "necessary" });
    if (!emptyColsCsv.endsWith("\n,,")) {
        throw new Error("Edge Case 17 failed: consecutive empty columns writing");
    }
    const emptyColsParsed = parseCSV(emptyColsCsv);
    if (emptyColsParsed.length !== 2 || emptyColsParsed[1].length !== 3 || emptyColsParsed[1].some(c => c !== "")) {
        throw new Error("Edge Case 17 failed: consecutive empty columns parsing");
    }

    // Test 18: Quote character as part of non_numeric quoting with custom quoteChar
    const customQuoteCharDf = new DataFrame([{ text: "single 'quoted' value", num: 42 }]);
    const customQuoteCharCsv = customQuoteCharDf.write_csv(undefined, { quoteChar: "'", quoteStyle: "non_numeric" });
    if (!customQuoteCharCsv.includes("'single ''quoted'' value',42")) {
        throw new Error(`Edge Case 18 failed: custom quoteChar with non_numeric: ${customQuoteCharCsv}`);
    }

    // Test 19: Datetime column with mixed ISO timestamps containing milliseconds and offsets
    const mixedIsoInfer = inferAndCoerceCSVColumn(["2026-01-01T00:00:00.000Z", "2026-06-15T12:30:45.123Z", "2026-12-31T23:59:59Z"]);
    if (mixedIsoInfer.type.name !== "Datetime" || mixedIsoInfer.values.some(v => !(v instanceof Date))) {
        throw new Error("Edge Case 19 failed: mixed ISO timestamp parsing");
    }

    // Test 20: Streaming onRow with includeBom
    const streamBomRows: string[] = [];
    const streamBomDf = new DataFrame([{ a: 1 }, { a: 2 }]);
    streamBomDf.write_csv({ write: (r: string) => streamBomRows.push(r) }, { includeBom: true });
    if (!streamBomRows[0].startsWith("\uFEFFa") || streamBomRows[1] !== "\n1" || streamBomRows[2] !== "\n2") {
        throw new Error("Edge Case 20 failed: streaming write with includeBom");
    }

    // Test 21: Quotes inside unquoted cells (RFC 4180 lenient recovery)
    const midQuoteCell = parseCSV('col1,col2\nfoo"bar,baz');
    if (midQuoteCell.length !== 2 || midQuoteCell[1][0] !== 'foo"bar' || midQuoteCell[1][1] !== "baz") {
        throw new Error("Edge Case 21 failed: quotes inside unquoted cells handling");
    }

    // Test 22: Empty Quoted Fields ("") vs Empty Unquoted Fields (,,)
    const emptyQuoted = parseCSV('a,b,c\n"",,\n');
    if (emptyQuoted.length !== 2 || emptyQuoted[1][0] !== "" || emptyQuoted[1][1] !== "" || emptyQuoted[1][2] !== "") {
        throw new Error("Edge Case 22 failed: empty quoted vs unquoted field parsing");
    }

    // Test 23: Header keys containing special characters (commas, quotes, newlines)
    const headerSpecialDf = new DataFrame([
        { 'a,b': 1, 'note "1"': 2, 'line1\nline2': 3 }
    ]);
    const headerSpecialCsv = headerSpecialDf.write_csv();
    if (!headerSpecialCsv.startsWith('"a,b","note ""1""","line1\nline2"')) {
        throw new Error(`Edge Case 23 failed: headers with special chars: ${headerSpecialCsv}`);
    }
    const headerSpecialParsed = parseCSV(headerSpecialCsv);
    if (headerSpecialParsed[0][0] !== 'a,b' || headerSpecialParsed[0][1] !== 'note "1"' || headerSpecialParsed[0][2] !== 'line1\nline2') {
        throw new Error("Edge Case 23 failed: roundtrip header special chars parsing");
    }

    // Test 24: Date objects containing Invalid Date (NaN) safely formatting to nullValue
    const invalidDateObj = new Date("invalid date string");
    const invalidDateRes = formatCsvValue({ nullValue: "NULL_DATE" })(invalidDateObj);
    if (invalidDateRes.str !== "NULL_DATE" || invalidDateRes.isNumeric !== false) {
        throw new Error(`Edge Case 24 failed: Invalid Date object handling: ${invalidDateRes.str}`);
    }

    // Test 25: Pure numbers vs years in inference (e.g. ["2024", "1999"] -> Int64, not Datetime)
    const pureNumbersInfer = inferAndCoerceCSVColumn(["2024", "1999", "2000"]);
    if (pureNumbersInfer.type.name !== "Int64" || pureNumbersInfer.values[0] !== 2024n) {
        throw new Error("Edge Case 25 failed: pure 4-digit numbers should infer Int64, not Datetime");
    }

    // Test 26: Float containing integers (e.g. ["1", "2.5", "3"]) -> Float64
    const mixedFloatInfer = inferAndCoerceCSVColumn(["1", "2.5", "3"]);
    if (mixedFloatInfer.type.name !== "Float64" || mixedFloatInfer.values[0] !== 1 || mixedFloatInfer.values[1] !== 2.5) {
        throw new Error("Edge Case 26 failed: mixed int and float column should infer Float64");
    }

    // Test 27: Unclosed quote at EOF appends cell gracefully without crash
    const eofUnclosed = parseCSV('a,b\n1,"unclosed text');
    if (eofUnclosed.length !== 2 || eofUnclosed[1][0] !== "1" || eofUnclosed[1][1] !== "unclosed text") {
        throw new Error("Edge Case 27 failed: unclosed quote at EOF parsing");
    }

    // Test 28: formatCsvValue with nested objects, arrays, and typed arrays
    const complexNested = formatCsvValue()({ arr: [1, "two", 3n], buffer: new Uint8Array([65, 66]) });
    if (!complexNested.str.includes('"arr":[1,"two","3"]') || complexNested.isNumeric !== false) {
        throw new Error(`Edge Case 28 failed: complex nested object formatting: ${complexNested.str}`);
    }

    // Test 29: formatCsvValue with non-finite numbers and custom numericFormatOptions
    const infFormat = formatCsvValue({ numericFormatOptions: { useGrouping: true } })(Infinity);
    const nanFormat = formatCsvValue({ nullValue: "MISSING" })(NaN);
    if (infFormat.str !== "Infinity" || infFormat.isNumeric !== true || nanFormat.str !== "NaN" || nanFormat.isNumeric !== true) {
        throw new Error("Edge Case 29 failed: non-finite numbers formatting");
    }

    // Test 30: formatCsvValue with quoteStyle 'never' and delimiter in strings
    const noQuoteDf = new DataFrame([{ a: "foo,bar", b: 100 }]);
    const noQuoteCsv = noQuoteDf.write_csv(undefined, { quoteStyle: "never" });
    if (noQuoteCsv !== "a,b\nfoo,bar,100") {
        throw new Error(`Edge Case 30 failed: quoteStyle 'never': ${noQuoteCsv}`);
    }

    // Test 31: All-null / empty column in inferAndCoerceCSVColumn falls back to Utf8 with nulls
    const allNullsInfer = inferAndCoerceCSVColumn(["", "NA", "null", "NaN"]);
    if (allNullsInfer.type.name !== "Utf8" || allNullsInfer.values.some(v => v !== null) || allNullsInfer.values.length !== 4) {
        throw new Error("Edge Case 31 failed: all-null column should infer Utf8 with null entries");
    }

    // Test 32: Semicolon / Tab-separated CSV parsing with quote escaping
    const tabCsv = parseCSV("col1\tcol2\n\"val\t1\"\t\"val\"\"2\"", { separator: "\t" });
    if (tabCsv.length !== 2 || tabCsv[1][0] !== "val\t1" || tabCsv[1][1] !== 'val"2') {
        throw new Error("Edge Case 32 failed: tab-separated custom delimiter parsing");
    }

    // Test 33: Multi-character and custom nullValues set in inferAndCoerceCSVColumn
    const customNullsInfer = inferAndCoerceCSVColumn(["10", "N/A", "20", "NONE"], { nullValues: ["N/A", "NONE"] });
    if (customNullsInfer.type.name !== "Int64" || customNullsInfer.values[0] !== 10n || customNullsInfer.values[1] !== null || customNullsInfer.values[3] !== null) {
        throw new Error("Edge Case 33 failed: custom nullValues set in inference");
    }

    // Test 34: parseCSV on empty string or whitespace-only string returns empty array
    const blankCsvParsed = parseCSV("");
    const whitespaceParsed = parseCSV("\r\n\n\r");
    if (blankCsvParsed.length !== 0 || whitespaceParsed.length !== 0) {
        throw new Error("Edge Case 34 failed: empty or whitespace-only CSV parsing");
    }

    // Test 35: stringifyCSV with 0 rows (header only)
    const emptyDf = new DataFrame({ a: [], b: [] });
    const emptyDfCsv = emptyDf.write_csv();
    if (emptyDfCsv !== "a,b") {
        throw new Error(`Edge Case 35 failed: empty DataFrame header-only CSV: ${emptyDfCsv}`);
    }

    // Test 36: stringifyCSV with 0 rows and includeHeader: false returns empty string
    const emptyDfNoHeader = emptyDf.write_csv(undefined, { includeHeader: false });
    if (emptyDfNoHeader !== "") {
        throw new Error(`Edge Case 36 failed: empty DataFrame no-header CSV: ${emptyDfNoHeader}`);
    }

    console.log("\n🎉 ALL 36 COMPREHENSIVE CSV EDGE CASE TESTS PASSED WITH 100% SUCCESS!");
    console.log("\n🎉 ALL DATAFRAME CSV WRITE & PARSE TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("\n❌ DataFrame CSV WRITE TESTS FAILED:", err);
    process.exit(1);
}

