declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running TemporalExpr.offsetDay tests...");


const getISOStr = (val: any) => (val instanceof Date ? val : new Date(val)).toISOString().split("T")[0];

const df = $df.data([
    { date: "2026-05-21", offset: 3 }, // Thursday
    { date: "2026-05-22", offset: 1 }, // Friday
    { date: "2026-05-20", offset: 0 },
    { date: "2026-05-20", offset: -3 },
    { date: null, offset: 2 },
    { date: "2026-05-20", offset: null }
], { date: $df.Date, offset: $df.Int32 });

const res = df.select([
    $df.col("date").dt.offsetDay(3).alias("add_scalar"),
    $df.col("date").dt.offsetDay($df.col("offset")).alias("add_col"),
    $df.col("date").dt.offsetDay($df.col("offset"), { excludeWeekdays: [0, 6] }).alias("biz_offset")
]).toDicts() as any[];

if (getISOStr(res[0].add_scalar) !== "2026-05-24") throw new Error("Thursday + 3 days = 2026-05-24");
if (getISOStr(res[1].biz_offset) !== "2026-05-25") throw new Error("Friday + 1 biz day = 2026-05-25 (Monday)");
if (res[4].add_col !== null || res[5].add_col !== null) throw new Error("Null date or offset should produce null");


console.log("✓ TemporalExpr.offsetDay tests passed!");
