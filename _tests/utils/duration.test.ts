declare const process: any;
import { scaleDurationMs } from "../../src/utils/duration";

console.log("=========================================");
console.log("STARTING DURATION UTILS TESTS...");
console.log("=========================================");

try {
    // 1. Milliseconds (identity)
    if (scaleDurationMs(100, "ms") !== 100) {
        throw new Error("scaleDurationMs ms failed");
    }

    // 2. Microseconds (* 1000)
    if (scaleDurationMs(100, "us") !== 100000) {
        throw new Error("scaleDurationMs us failed");
    }

    // 3. Nanoseconds (* 1000000)
    if (scaleDurationMs(100, "ns") !== 100000000) {
        throw new Error("scaleDurationMs ns failed");
    }

    console.log("✓ Duration utils tests passed successfully!");
} catch (e: any) {
    console.error(`❌ Duration utils test failed: ${e.message}`);
    process.exit(1);
}
