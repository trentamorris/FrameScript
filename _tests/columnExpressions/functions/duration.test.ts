declare const process: any;
import { $df } from "../../../src/index";

console.log("=========================================");
console.log("STARTING COLUMN EXPRESSION $df.duration() TESTS...");
console.log("=========================================");

try {
    const df = $df.data({
        days_col: [1, 2, 3]
    });

    // 1. Single Unit Duration Constructors
    const resUnits = df.select([
        $df.duration({ weeks: 1 }).alias("1_week"),
        $df.duration({ days: 2 }).alias("2_days"),
        $df.duration({ hours: 5 }).alias("5_hours"),
        $df.duration({ minutes: 30 }).alias("30_mins"),
        $df.duration({ seconds: 45 }).alias("45_secs"),
        $df.duration({ milliseconds: 500 }).alias("500_ms"),
        $df.duration({ microseconds: 1000 }).alias("1000_us"),
        $df.duration({ nanoseconds: 1000000 }).alias("1m_ns"),
    ]).toDicts()[0];

    if (resUnits["1_week"] !== 604800000) throw new Error("1 week failed");
    if (resUnits["2_days"] !== 172800000) throw new Error("2 days failed");
    if (resUnits["5_hours"] !== 18000000) throw new Error("5 hours failed");
    if (resUnits["30_mins"] !== 1800000) throw new Error("30 mins failed");
    if (resUnits["45_secs"] !== 45000) throw new Error("45 secs failed");
    if (resUnits["500_ms"] !== 500) throw new Error("500 ms failed");
    if (resUnits["1000_us"] !== 1) throw new Error("1000 us failed");
    if (resUnits["1m_ns"] !== 1) throw new Error("1m ns failed");

    // 2. Dynamic Column Expressions
    const resDyn = df.select([
        $df.duration({ days: $df.col("days_col") }).alias("dyn_days")
    ]).toDicts();

    if (resDyn[0].dyn_days !== 86400000 || resDyn[1].dyn_days !== 172800000 || resDyn[2].dyn_days !== 259200000) {
        throw new Error("Dynamic days duration failed: " + JSON.stringify(resDyn));
    }

    console.log("✓ $df.duration() tests passed successfully!");
} catch (err) {
    console.error("❌ $df.duration() tests failed:", err);
    process.exit(1);
}
