declare const process: any;
import { addCalendarDuration, parseDurationInterval } from "../../../src/utils/duration";

try {
    // Leap year Jan 31 + 1mo clips cleanly to Feb 29
    const jan31_2024 = new Date("2024-01-31T00:00:00Z");
    const feb2024 = addCalendarDuration(jan31_2024, parseDurationInterval("1mo"));
    if (feb2024.toISOString() !== "2024-02-29T00:00:00.000Z") {
        throw new Error(`Leap year Jan 31 + 1mo failed: got ${feb2024.toISOString()}`);
    }

    // Non-leap year Jan 31 + 1mo clips cleanly to Feb 28
    const jan31_2023 = new Date("2023-01-31T00:00:00Z");
    const feb2023 = addCalendarDuration(jan31_2023, parseDurationInterval("1mo"));
    if (feb2023.toISOString() !== "2023-02-28T00:00:00.000Z") {
        throw new Error(`Non-leap year Jan 31 + 1mo failed: got ${feb2023.toISOString()}`);
    }

    // Compound calendar duration (1y 2mo 5d)
    const baseDate = new Date("2020-01-10T12:00:00Z");
    const added = addCalendarDuration(baseDate, parseDurationInterval("1y 2mo 5d"));
    // 2020 + 1y = 2021, Jan + 2mo = March, 10 + 5d = 15
    if (added.getUTCFullYear() !== 2021 || added.getUTCMonth() !== 2 || added.getUTCDate() !== 15) {
        throw new Error("Compound calendar addition failed: " + added.toISOString());
    }

    console.log("✓ addCalendarDuration tests passed!");
} catch (err: any) {
    console.error(`❌ addCalendarDuration test failed: ${err.message}`);
    process.exit(1);
}
