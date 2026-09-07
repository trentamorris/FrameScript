declare const process: any;
import { parseDurationInterval } from "../../../src/utils/duration";

try {
    const intervalMonth = parseDurationInterval("1mo");
    if (!intervalMonth.isCalendar || intervalMonth.months !== 1 || intervalMonth.days !== 0 || intervalMonth.ms !== 0) {
        throw new Error(`parseDurationInterval('1mo') failed: ${JSON.stringify(intervalMonth)}`);
    }

    const intervalQuarter = parseDurationInterval("1q");
    if (!intervalQuarter.isCalendar || intervalQuarter.months !== 3) {
        throw new Error("parseDurationInterval('1q') failed");
    }

    const intervalCompound = parseDurationInterval("1y 2mo 3d 4h 5m 6s");
    if (!intervalCompound.isCalendar || intervalCompound.months !== 14 || intervalCompound.days !== 3) {
        throw new Error(`parseDurationInterval compound failed: ${JSON.stringify(intervalCompound)}`);
    }

    const fixedInterval = parseDurationInterval("2h 30m");
    if (fixedInterval.isCalendar || fixedInterval.ms !== (2 * 3600000 + 30 * 60000)) {
        throw new Error("parseDurationInterval fixed duration failed");
    }

    // Negative interval
    const negInterval = parseDurationInterval("-1mo 2d");
    if (negInterval.months !== -1 || negInterval.days !== -2) {
        throw new Error("Negative parseDurationInterval failed");
    }

    console.log("✓ parseDurationInterval tests passed!");
} catch (err: any) {
    console.error(`❌ parseDurationInterval test failed: ${err.message}`);
    process.exit(1);
}
