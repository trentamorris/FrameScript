declare const process: any;
import { parseDurationString } from "../../../src/utils/duration";

try {
    if (parseDurationString("10s") !== 10000) throw new Error("10s failed");
    if (parseDurationString("1m") !== 60000) throw new Error("1m failed");
    if (parseDurationString("2h") !== 7200000) throw new Error("2h failed");
    if (parseDurationString("1d") !== 86400000) throw new Error("1d failed");
    if (parseDurationString("500ms") !== 500) throw new Error("500ms failed");

    // Compound durations
    if (parseDurationString("1h 30m") !== 5400000) throw new Error("1h 30m compound failed");
    if (parseDurationString("1d 12h") !== 129600000) throw new Error("1d 12h compound failed");
    if (parseDurationString("2m 15s") !== 135000) throw new Error("2m 15s compound failed");

    // Negative durations
    if (parseDurationString("-2.5s") !== -2500) throw new Error("-2.5s failed");
    if (parseDurationString("-1h 30m") !== -5400000) throw new Error("-1h 30m failed");

    // Scientific notation
    if (parseDurationString("1e3s") !== 1000000) throw new Error("1e3s failed");
    if (parseDurationString("1.5e-3s") !== 1.5) throw new Error("1.5e-3s failed");

    // Microseconds
    if (parseDurationString("1000µs") !== 1) throw new Error("Latin micro sign failed");
    if (parseDurationString("1000μs") !== 1) throw new Error("Greek mu failed");

    // Conversions
    if (parseDurationString("1h", { to: "s" }) !== 3600) throw new Error("1h to s failed");
    if (parseDurationString("1m", { to: "s" }) !== 60) throw new Error("1m to s failed");

    // Row index steps
    if (parseDurationString("10i") !== 10) throw new Error("10i failed");
    if (parseDurationString("-5i") !== -5) throw new Error("-5i failed");

    // Rejection of invalid / calendar / mixed syntaxes
    const rejections = ["", "1h 30", "1q", "1M", "10i 5s", "1h -30m", "NaNs", "Infinitys"];
    for (const rej of rejections) {
        let threw = false;
        try {
            parseDurationString(rej);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected '${rej}' to throw in parseDurationString`);
    }

    console.log("✓ parseDurationString tests passed!");
} catch (err: any) {
    console.error(`❌ parseDurationString test failed: ${err.message}`);
    process.exit(1);
}
