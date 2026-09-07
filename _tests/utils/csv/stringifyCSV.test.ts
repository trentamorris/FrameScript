declare const process: any;
import { stringifyCSV } from "../../../src/utils/csv";

try {
    const columns = {
        id: [1, 2, 3],
        name: ["Alice", "Bob", "Charlie"],
        note: ["Hello, world!", 'He said "hello!"', "Line 1\nLine 2"],
        score: [95.1234, 88.0, null],
        extra: [null, "yes", null]
    };

    // 1. Standard stringifyCSV
    const csvStr = stringifyCSV(columns, 3);
    if (!csvStr.includes("id,name,note,score,extra")) throw new Error("Header line mismatch");
    if (!csvStr.includes('1,Alice,"Hello, world!",95.1234,')) throw new Error("Quoting of comma failed");
    if (!csvStr.includes('2,Bob,"He said ""hello!""",88,yes')) throw new Error("Quote escaping failed");
    if (!csvStr.includes('"Line 1\nLine 2"')) throw new Error("Embedded newline failed");

    // 2. includeHeader: false
    const noHeaderCSV = stringifyCSV(columns, 3, { includeHeader: false });
    if (noHeaderCSV.includes("id,name,note")) throw new Error("Headers found when includeHeader: false");

    // 3. quoteStyle: "always"
    const alwaysQuoted = stringifyCSV(columns, 3, { quoteStyle: "always" });
    if (!alwaysQuoted.startsWith('"id","name","note","score","extra"')) throw new Error("quoteStyle: always failed for headers");
    if (!alwaysQuoted.includes('"1","Alice","Hello, world!","95.1234",""')) throw new Error("quoteStyle: always failed for row");

    // 4. quoteStyle: "never"
    const neverQuoted = stringifyCSV(columns, 3, { quoteStyle: "never" });
    if (!neverQuoted.includes('2,Bob,He said "hello!",88,yes')) throw new Error("quoteStyle: never failed");

    // 5. quoteStyle: "non_numeric"
    const nonNumericQuoted = stringifyCSV(columns, 3, { quoteStyle: "non_numeric" });
    if (!nonNumericQuoted.includes('1,"Alice","Hello, world!",95.1234,')) throw new Error("quoteStyle: non_numeric failed");

    // 6. nullValue
    const customNulls = stringifyCSV(columns, 3, { nullValue: "N/A" });
    if (!customNulls.includes(",N/A") || !customNulls.includes(",N/A,N/A")) throw new Error("nullValue failed");

    // 7. includeBom
    const bomStr = stringifyCSV(columns, 3, { includeBom: true });
    if (!bomStr.startsWith("\ufeff")) throw new Error("includeBom failed");

    // 8. lineTerminator
    const crlfStr = stringifyCSV(columns, 3, { lineTerminator: "\r\n" });
    if (!crlfStr.includes("\r\n")) throw new Error("lineTerminator failed");

    // 9. onRow streaming callback
    const streamed: string[] = [];
    stringifyCSV(columns, 3, { onRow: (row) => streamed.push(row) });
    if (streamed.length !== 4) throw new Error("onRow streaming failed, count=" + streamed.length);

    // 10. 0 rows header-only
    const emptyCols = { a: [], b: [] };
    const emptyCsv = stringifyCSV(emptyCols, 0);
    if (emptyCsv !== "a,b") throw new Error("Empty rows header-only failed: " + emptyCsv);

    // 11. 0 rows without header returns empty string
    const emptyNoHeader = stringifyCSV(emptyCols, 0, { includeHeader: false });
    if (emptyNoHeader !== "") throw new Error("Empty rows no header failed");

    console.log("✓ stringifyCSV tests passed!");
} catch (err: any) {
    console.error(`❌ stringifyCSV test failed: ${err.message}`);
    process.exit(1);
}
