declare const process: any;
import { formatCsvValue } from "../../../src/utils/csv";

try {
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

    console.log("✓ formatCsvValue tests passed!");
} catch (err: any) {
    console.error(`❌ formatCsvValue test failed: ${err.message}`);
    process.exit(1);
}
