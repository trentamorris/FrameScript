declare const process: any;
import { scaleDurationMs } from "../../../src/utils/duration";

try {
    if (scaleDurationMs(100, "ms") !== 100) throw new Error("scaleDurationMs ms failed");
    if (scaleDurationMs(100, "us") !== 100000) throw new Error("scaleDurationMs us failed");
    if (scaleDurationMs(100, "ns") !== 100000000) throw new Error("scaleDurationMs ns failed");

    if (scaleDurationMs(1, "ms") !== 1) throw new Error("scaleDurationMs(1, 'ms') failed");
    if (scaleDurationMs(1, "us") !== 1000) throw new Error("scaleDurationMs(1, 'us') failed");
    if (scaleDurationMs(1, "ns") !== 1000000) throw new Error("scaleDurationMs(1, 'ns') failed");

    if (scaleDurationMs(0, "ms") !== 0) throw new Error("scaleDurationMs(0, 'ms') failed");
    if (scaleDurationMs(-5, "ms") !== -5) throw new Error("scaleDurationMs(-5, 'ms') failed");
    if (scaleDurationMs(-5, "us") !== -5000) throw new Error("scaleDurationMs(-5, 'us') failed");
    if (scaleDurationMs(-5, "ns") !== -5000000) throw new Error("scaleDurationMs(-5, 'ns') failed");

    if (!Number.isNaN(scaleDurationMs(NaN, "ms"))) throw new Error("scaleDurationMs(NaN) should be NaN");
    if (!Number.isNaN(scaleDurationMs(Infinity, "ms"))) throw new Error("scaleDurationMs(Infinity) should be NaN");
    if (!Number.isNaN(scaleDurationMs(-Infinity, "ms"))) throw new Error("scaleDurationMs(-Infinity) should be NaN");
    if (!Number.isNaN(scaleDurationMs(100, "days" as any))) throw new Error("scaleDurationMs invalid unit should return NaN");
    if (!Number.isNaN(scaleDurationMs(100, "" as any))) throw new Error("scaleDurationMs empty unit should return NaN");

    console.log("✓ scaleDurationMs tests passed!");
} catch (err: any) {
    console.error(`❌ scaleDurationMs test failed: ${err.message}`);
    process.exit(1);
}
