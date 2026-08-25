declare const process: any;
import { $df } from "../../../../src/index";

console.log("Running TemporalExpr.isoWeek tests...");


const df = $df.data([
    { date: "2024-02-29" },
    { date: "2023-03-15" },
    { date: "2027-01-02" },
    { date: null }
], { date: $df.DataType.Date });

const res = df.select([$df.col("date").dt.isoWeek().alias("iw")]).toDicts() as any[];
if (res[0].iw !== 9) throw new Error("2024-02-29 expected isoWeek 9");
if (res[1].iw !== 11) throw new Error("2023-03-15 expected isoWeek 11");
if (res[2].iw !== 53) throw new Error("2027-01-02 expected isoWeek 53");
if (res[3].iw !== null) throw new Error("null expected null");


console.log("✓ TemporalExpr.isoWeek tests passed!");
