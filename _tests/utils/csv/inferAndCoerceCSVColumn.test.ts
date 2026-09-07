declare const process: any;
import { inferAndCoerceCSVColumn } from "../../../src/utils/csv";

try {
    // 1. All-null column
    const allNulls = inferAndCoerceCSVColumn(["", "NA", "null", "NaN"]);
    if (allNulls.type.name !== "Utf8" || allNulls.values.some(v => v !== null) || allNulls.values.length !== 4) {
        throw new Error("All-null column inference failed");
    }

    // 2. Custom nullValues set
    const customNulls = inferAndCoerceCSVColumn(["10", "N/A", "20", "NONE"], { nullValues: ["N/A", "NONE"] });
    if (customNulls.type.name !== "Int64" || customNulls.values[0] !== 10n || customNulls.values[1] !== null || customNulls.values[3] !== null) {
        throw new Error("Custom nullValues set failed");
    }

    // 3. Bitmask elimination: "1", "2", "3.5" -> Float64
    const floatInfer = inferAndCoerceCSVColumn(["1", "2", "3.5"]);
    if (floatInfer.type.name !== "Float64" || floatInfer.values[0] !== 1 || floatInfer.values[2] !== 3.5) {
        throw new Error("Float64 type inference progression failed");
    }

    // 4. Pure integers
    const intInfer = inferAndCoerceCSVColumn(["100", "-200", "300"]);
    if (intInfer.type.name !== "Int64" || intInfer.values[0] !== 100n || intInfer.values[1] !== -200n) {
        throw new Error("Int64 inference failed");
    }

    // 5. Datetime inference
    const dateInfer = inferAndCoerceCSVColumn(["2026-01-01", "2026-06-15T12:00:00Z", "null"]);
    if (dateInfer.type.name !== "Datetime" || !(dateInfer.values[0] instanceof Date) || dateInfer.values[2] !== null) {
        throw new Error("Datetime inference failed");
    }

    // 6. Boolean inference
    const boolInfer = inferAndCoerceCSVColumn(["true", "0", "1", "false"]);
    if (boolInfer.type.name !== "Boolean" || boolInfer.values[0] !== true || boolInfer.values[1] !== false || boolInfer.values[2] !== true) {
        throw new Error("Boolean inference failed");
    }

    // 7. Mixed fallback to Utf8
    const mixedFallback = inferAndCoerceCSVColumn(["100", "hello", "200"]);
    if (mixedFallback.type.name !== "Utf8" || mixedFallback.values[1] !== "hello" || mixedFallback.values[0] !== "100") {
        throw new Error("Mixed fallback to Utf8 failed");
    }

    // 8. Whitespace trimming around numbers
    const padded = inferAndCoerceCSVColumn(["  42  ", "  84  ", ""]);
    if (padded.type.name !== "Int64" || padded.values[0] !== 42n || padded.values[2] !== null) {
        throw new Error("Whitespace padded integer inference failed");
    }

    // 9. Scientific notation / exponents
    const expInfer = inferAndCoerceCSVColumn(["1e3", "2.5e-2", "1.23E+4"]);
    if (expInfer.type.name !== "Float64" || expInfer.values[0] !== 1000 || expInfer.values[1] !== 0.025) {
        throw new Error("Scientific notation Float64 inference failed");
    }

    console.log("✓ inferAndCoerceCSVColumn tests passed!");
} catch (err: any) {
    console.error(`❌ inferAndCoerceCSVColumn test failed: ${err.message}`);
    process.exit(1);
}
