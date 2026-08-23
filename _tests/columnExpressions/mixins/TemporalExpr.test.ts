declare const process: any;
import { $df } from "../../../src/index";
import { MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY } from "../../../src/constants";

console.log("=========================================");
console.log("STARTING COLUMN EXPRESSION DT NAMESPACE TESTS...");
console.log("=========================================");

const data = [
    {
        date_str: "2024-02-29", // Leap year
        datetime_str: "2026-05-25T10:37:16.123Z",
        time_str: "14:30:15.500",
        duration_ms: 123456789
    },
    {
        date_str: "2023-03-15", // Non-leap year
        datetime_str: "2026-12-31T23:59:59.999Z",
        time_str: "00:00:00.000",
        duration_ms: 3600000 // 1 hour
    },
    {
        date_str: "2027-01-02", // Gregorian 2027, ISO 2026 (Saturday)
        datetime_str: "2027-01-02T12:00:00.000Z",
        time_str: "12:00:00.000",
        duration_ms: 0
    }
];

const schema = {
    date_str: $df.DataType.Date,
    datetime_str: $df.DataType.Datetime,
    time_str: $df.DataType.Time,
    duration_ms: $df.DataType.Duration
};

try {
    const df = $df.data(data, schema);

    const projected = df.select([
        // Date component checks
        $df.col("date_str").dt.year().alias("year"),
        $df.col("date_str").dt.month().alias("month"),
        $df.col("date_str").dt.day().alias("day"),
        $df.col("date_str").dt.daysInMonth().alias("daysInMonth"),
        $df.col("date_str").dt.weekday().alias("weekday"),
        $df.col("date_str").dt.is_leap_year().alias("is_leap"),
        $df.col("date_str").dt.ordinal_day().alias("ordinal"),
        $df.col("date_str").dt.quarter().alias("quarter"),

        // Time component checks on datetime
        $df.col("datetime_str").dt.hour().alias("hour"),
        $df.col("datetime_str").dt.minute().alias("minute"),
        $df.col("datetime_str").dt.second().alias("second"),
        $df.col("datetime_str").dt.millisecond().alias("ms"),
        $df.col("datetime_str").dt.microsecond().alias("us"),
        $df.col("datetime_str").dt.nanosecond().alias("ns"),

        // Date truncation and string formatting checks
        $df.col("datetime_str").dt.date().alias("truncated_date"),
        $df.col("datetime_str").dt.time().alias("time_str_extracted"),

        // Epoch check
        $df.col("datetime_str").dt.epoch("s").alias("epoch_s"),
        $df.col("datetime_str").dt.epoch("ms").alias("epochMs"),
        $df.col("datetime_str").dt.timestamp().alias("timestamp_alias"),
        $df.col("datetime_str").dt.timestamp("us").alias("timestamp_us"),

        // Duration checks
        $df.col("duration_ms").dt.totalMilliseconds().alias("dur_ms"),
        $df.col("duration_ms").dt.totalMicroseconds().alias("dur_us"),
        $df.col("duration_ms").dt.totalNanoseconds().alias("dur_ns"),
        $df.col("duration_ms").dt.totalSeconds().alias("dur_s"),
        $df.col("duration_ms").dt.totalMinutes().alias("dur_m"),
        $df.col("duration_ms").dt.totalHours().alias("dur_h"),
        $df.col("duration_ms").dt.totalDays().alias("dur_d"),

        // New Polars operations
        $df.col("date_str").dt.week().alias("week"),
        $df.col("date_str").dt.iso_week().alias("iso_week"),
        $df.col("date_str").dt.century().alias("century"),
        $df.col("date_str").dt.millennium().alias("millennium"),
        $df.col("date_str").dt.month_start().alias("m_start"),
        $df.col("date_str").dt.month_end().alias("m_end"),
        $df.col("datetime_str").dt.strftime({ format: "%Y/%m/%d %H:%M:%S.%ms" }).alias("formatted_str"),
        $df.col("datetime_str").dt.strftime({ format: "%F %T %% %A %B %j %I:%M %p", locale: "en-US" }).alias("formatted_shorthands"),
        $df.col("datetime_str").dt.strftime({ format: "%A %B", locale: "fr-FR" }).alias("formatted_fr"),
        $df.col("datetime_str").dt.strftime({ format: "%A %B", locale: "de-DE" }).alias("formatted_de"),
        $df.col("datetime_str").dt.strftime({ format: "%Y-%m-%d" }).alias("to_str_formatted"),
        $df.col("date_str").dt.iso_year().alias("iso_yr"),
        $df.col("date_str").dt.isBusinessDay().alias("is_biz"),
        $df.col("date_str").dt.isBusinessDay({ holidays: ["2024-02-29"] }).alias("is_biz_holiday")
    ]).toDicts() as any[];

    console.log("Coerced Expr.dt results:");
    console.dir(projected, { depth: null });

    // Assert Row 0
    const r0 = projected[0];
    if (r0.year !== 2024) throw new Error(`Expected r0.year to be 2024, got ${r0.year}`);
    if (r0.month !== 2) throw new Error(`Expected r0.month to be 2, got ${r0.month}`);
    if (r0.day !== 29) throw new Error(`Expected r0.day to be 29, got ${r0.day}`);
    if (r0.daysInMonth !== 29) throw new Error(`Expected r0.daysInMonth to be 29, got ${r0.daysInMonth}`);
    if (r0.weekday !== 4) throw new Error(`Expected r0.weekday to be 4 (Thursday), got ${r0.weekday}`);
    if (r0.is_leap !== true) throw new Error(`Expected r0.is_leap to be true, got ${r0.is_leap}`);
    if (r0.ordinal !== 60) throw new Error(`Expected r0.ordinal to be 60, got ${r0.ordinal}`);
    if (r0.quarter !== 1) throw new Error(`Expected r0.quarter to be 1, got ${r0.quarter}`);

    if (r0.hour !== 10) throw new Error(`Expected r0.hour to be 10, got ${r0.hour}`);
    if (r0.minute !== 37) throw new Error(`Expected r0.minute to be 37, got ${r0.minute}`);
    if (r0.second !== 16) throw new Error(`Expected r0.second to be 16, got ${r0.second}`);
    if (r0.ms !== 123) throw new Error(`Expected r0.ms to be 123, got ${r0.ms}`);
    if (r0.us !== 123000) throw new Error(`Expected r0.us to be 123000, got ${r0.us}`);
    if (r0.ns !== 123000000) throw new Error(`Expected r0.ns to be 123000000, got ${r0.ns}`);
    if (r0.iso_yr !== 2024) throw new Error(`Expected r0.iso_yr to be 2024, got ${r0.iso_yr}`);
    if (r0.is_biz !== true) throw new Error(`Expected r0.is_biz to be true, got ${r0.is_biz}`);
    if (r0.is_biz_holiday !== false) throw new Error(`Expected r0.is_biz_holiday to be false, got ${r0.is_biz_holiday}`);

    {
        const r1 = projected[1];
        if (r1.iso_yr !== 2023) throw new Error(`Expected r1.iso_yr to be 2023, got ${r1.iso_yr}`);
        if (r1.week !== 11) throw new Error(`Expected r1.week to be 11, got ${r1.week}`);
        if (r1.iso_week !== 11) throw new Error(`Expected r1.iso_week to be 11, got ${r1.iso_week}`);
        if (r1.is_biz !== true) throw new Error(`Expected r1.is_biz to be true, got ${r1.is_biz}`);
        if (r1.is_biz_holiday !== true) throw new Error(`Expected r1.is_biz_holiday to be true, got ${r1.is_biz_holiday}`);

        const r2 = projected[2];
        if (r2.iso_yr !== 2026) throw new Error(`Expected r2.iso_yr to be 2026, got ${r2.iso_yr}`);
        if (r2.week !== 53) throw new Error(`Expected r2.week to be 53, got ${r2.week}`);
        if (r2.iso_week !== 53) throw new Error(`Expected r2.iso_week to be 53, got ${r2.iso_week}`);
        if (r2.is_biz !== false) throw new Error(`Expected r2.is_biz to be false, got ${r2.is_biz}`);
        if (r2.is_biz_holiday !== false) throw new Error(`Expected r2.is_biz_holiday to be false, got ${r2.is_biz_holiday}`);
    }

    if (!(r0.truncated_date instanceof Date) || r0.truncated_date.getUTCHours() !== 0) {
        throw new Error(`Expected r0.truncated_date to be midnight UTC, got ${r0.truncated_date}`);
    }
    if (r0.time_str_extracted !== "10:37:16.123") {
        throw new Error(`Expected r0.time_str_extracted to be "10:37:16.123", got ${r0.time_str_extracted}`);
    }

    const t0 = new Date("2026-05-25T10:37:16.123Z").getTime();
    if (r0.epoch_s !== Math.floor(t0 / 1000)) throw new Error(`Expected r0.epoch_s to be ${Math.floor(t0 / 1000)}, got ${r0.epoch_s}`);
    if (r0.epochMs !== t0) throw new Error(`Expected r0.epochMs to be ${t0}, got ${r0.epochMs}`);
    if (r0.timestamp_alias !== t0) throw new Error(`Expected r0.timestamp_alias to be ${t0}, got ${r0.timestamp_alias}`);
    if (r0.timestamp_us !== BigInt(t0) * 1000n) throw new Error(`Expected r0.timestamp_us to be ${BigInt(t0) * 1000n}, got ${r0.timestamp_us}`);

    if (r0.dur_ms !== 123456789) throw new Error(`Expected r0.dur_ms to be 123456789, got ${r0.dur_ms}`);
    if (r0.dur_us !== 123456789000) throw new Error(`Expected r0.dur_us to be 123456789000, got ${r0.dur_us}`);
    if (r0.dur_ns !== 123456789000000) throw new Error(`Expected r0.dur_ns to be 123456789000000, got ${r0.dur_ns}`);
    if (r0.dur_s !== 123456.789) throw new Error(`Expected r0.dur_s to be 123456.789, got ${r0.dur_s}`);
    if (Math.abs(r0.dur_m - 123456789 / MS_PER_MINUTE) > 1e-6) throw new Error(`Expected r0.dur_m to match, got ${r0.dur_m}`);
    if (Math.abs(r0.dur_h - 123456789 / MS_PER_HOUR) > 1e-6) throw new Error(`Expected r0.dur_h to match, got ${r0.dur_h}`);
    if (Math.abs(r0.dur_d - 123456789 / MS_PER_DAY) > 1e-6) throw new Error(`Expected r0.dur_d to match, got ${r0.dur_d}`);

    // Assert New Operations for Row 0
    if (r0.week !== 9) throw new Error(`Expected r0.week to be 9, got ${r0.week}`);
    if (r0.iso_week !== 9) throw new Error(`Expected r0.iso_week to be 9, got ${r0.iso_week}`);
    if (r0.century !== 21) throw new Error(`Expected r0.century to be 21, got ${r0.century}`);
    if (r0.millennium !== 3) throw new Error(`Expected r0.millennium to be 3, got ${r0.millennium}`);
    if (r0.m_start.toISOString() !== "2024-02-01T00:00:00.000Z") throw new Error(`Expected r0.m_start to be "2024-02-01T00:00:00.000Z", got ${r0.m_start.toISOString()}`);
    if (r0.m_end.toISOString() !== "2024-02-29T00:00:00.000Z") throw new Error(`Expected r0.m_end to be "2024-02-29T00:00:00.000Z", got ${r0.m_end.toISOString()}`);
    if (r0.formatted_str !== "2026/05/25 10:37:16.123") throw new Error(`Expected r0.formatted_str to be "2026/05/25 10:37:16.123", got ${r0.formatted_str}`);
    if (r0.formatted_shorthands !== "2026-05-25 10:37:16 % Monday May 145 10:37 AM") throw new Error(`Expected r0.formatted_shorthands to be "2026-05-25 10:37:16 % Monday May 145 10:37 AM", got ${r0.formatted_shorthands}`);
    if (r0.formatted_fr !== "lundi mai") throw new Error(`Expected r0.formatted_fr to be "lundi mai", got ${r0.formatted_fr}`);
    if (r0.formatted_de !== "Montag Mai") throw new Error(`Expected r0.formatted_de to be "Montag Mai", got ${r0.formatted_de}`);
    if (r0.to_str_formatted !== "2026-05-25") throw new Error(`Expected r0.to_str_formatted to be "2026-05-25", got ${r0.to_str_formatted}`);

    // Assert Row 1
    const r1 = projected[1];
    if (r1.year !== 2023) throw new Error(`Expected r1.year to be 2023, got ${r1.year}`);
    if (r1.daysInMonth !== 31) throw new Error(`Expected r1.daysInMonth to be 31, got ${r1.daysInMonth}`);
    if (r1.is_leap !== false) throw new Error(`Expected r1.is_leap to be false, got ${r1.is_leap}`);
    if (r1.ordinal !== 74) throw new Error(`Expected r1.ordinal to be 74, got ${r1.ordinal}`); // 31 (Jan) + 28 (Feb) + 15 (Mar) = 74
    if (r1.dur_h !== 1.0) throw new Error(`Expected r1.dur_h to be 1.0, got ${r1.dur_h}`);
    if (r1.dur_us !== 3600000000) throw new Error(`Expected r1.dur_us to be 3600000000, got ${r1.dur_us}`);
    if (r1.dur_ns !== 3600000000000) throw new Error(`Expected r1.dur_ns to be 3600000000000, got ${r1.dur_ns}`);

    // Assert New Operations for Row 1
    if (r1.week !== 11) throw new Error(`Expected r1.week to be 11, got ${r1.week}`);
    if (r1.iso_week !== 11) throw new Error(`Expected r1.iso_week to be 11, got ${r1.iso_week}`);
    if (r1.century !== 21) throw new Error(`Expected r1.century to be 21, got ${r1.century}`);
    if (r1.millennium !== 3) throw new Error(`Expected r1.millennium to be 3, got ${r1.millennium}`);
    if (r1.m_start.toISOString() !== "2023-03-01T00:00:00.000Z") throw new Error(`Expected r1.m_start to be "2023-03-01T00:00:00.000Z", got ${r1.m_start.toISOString()}`);
    if (r1.m_end.toISOString() !== "2023-03-31T00:00:00.000Z") throw new Error(`Expected r1.m_end to be "2023-03-31T00:00:00.000Z", got ${r1.m_end.toISOString()}`);
    if (r1.formatted_str !== "2026/12/31 23:59:59.999") throw new Error(`Expected r1.formatted_str to be "2026/12/31 23:59:59.999", got ${r1.formatted_str}`);
    if (r1.formatted_shorthands !== "2026-12-31 23:59:59 % Thursday December 365 11:59 PM") throw new Error(`Expected r1.formatted_shorthands to be "2026-12-31 23:59:59 % Thursday December 365 11:59 PM", got ${r1.formatted_shorthands}`);
    if (r1.formatted_fr !== "jeudi décembre") throw new Error(`Expected r1.formatted_fr to be "jeudi décembre", got ${r1.formatted_fr}`);
    if (r1.formatted_de !== "Donnerstag Dezember") throw new Error(`Expected r1.formatted_de to be "Donnerstag Dezember", got ${r1.formatted_de}`);
    if (r1.to_str_formatted !== "2026-12-31") throw new Error(`Expected r1.to_str_formatted to be "2026-12-31", got ${r1.to_str_formatted}`);

    // Test offsetDay
    console.log("Testing Expr.dt.offsetDay...");

    const bizData = [
        { date: "2026-05-21", offset: 3 }, // Thursday
        { date: "2026-05-22", offset: 1 }, // Friday
    ];
    const bizSchema = {
        date: $df.DataType.Date,
        offset: $df.DataType.Int32
    };
    const dfBiz = $df.data(bizData, bizSchema);

    // Test 1: Basic addition and column-based offset
    const projectedBiz1 = dfBiz.select([
        $df.col("date").dt.offsetDay(3, {}).alias("add_scalar"),
        $df.col("date").dt.offsetDay($df.col("offset")).alias("add_col"),
        $df.col("date").dt.offsetDay($df.lit(3)).alias("add_lit")
    ]).toDicts() as any[];

    // Thursday 21st + 3 calendar days = Sunday 24th
    const rBiz0 = projectedBiz1[0];
    const getDay = (val: any) => val instanceof Date ? val.getUTCDate() : new Date(val).getUTCDate();
    const getISOStr = (val: any) => (val instanceof Date ? val : new Date(val)).toISOString().split("T")[0];

    if (getDay(rBiz0.add_scalar) !== 24) {
        throw new Error(`Expected Thursday + 3 days to be Sunday 24th, got ${rBiz0.add_scalar}`);
    }
    if (getDay(rBiz0.add_col) !== 24) {
        throw new Error(`Expected Thursday + col(3) days to be Sunday 24th, got ${rBiz0.add_col}`);
    }
    if (getDay(rBiz0.add_lit) !== 24) {
        throw new Error(`Expected Thursday + lit(3) days to be Sunday 24th, got ${rBiz0.add_lit}`);
    }

    // Edge Case 2: Business Day Exclusions (excludeWeekdays: [0, 6])
    // Thursday 2026-05-21 + 3 biz days -> Friday (1), Sat/Sun skipped, Mon (2), Tue (3) -> 2026-05-26
    const dfEdgeBiz = $df.data([{ date: "2026-05-21" }, { date: "2026-05-22" }], { date: $df.DataType.Date });
    const resBizEx = dfEdgeBiz.select([
        $df.col("date").dt.offsetDay(3, { excludeWeekdays: [0, 6] }).alias("biz_plus3"),
        $df.col("date").dt.offsetDay(1, { excludeWeekdays: [0, 6] }).alias("biz_plus1")
    ]).toDicts() as any[];

    if (getISOStr(resBizEx[0].biz_plus3) !== "2026-05-26") {
        throw new Error(`Edge Case Fail: Expected Thursday + 3 biz days = 2026-05-26, got ${getISOStr(resBizEx[0].biz_plus3)}`);
    }
    if (getISOStr(resBizEx[1].biz_plus1) !== "2026-05-25") {
        throw new Error(`Edge Case Fail: Expected Friday + 1 biz day = 2026-05-25, got ${getISOStr(resBizEx[1].biz_plus1)}`);
    }

    // Edge Case 3: Weekend Roll Strategies (roll: "forward", "backward", "raise")
    const dfWeekend = $df.data([{ date: "2026-05-23" }], { date: $df.DataType.Date }); // Saturday
    const resRollForward = dfWeekend.select([
        $df.col("date").dt.offsetDay(0, { excludeWeekdays: [0, 6], roll: "forward" }).alias("roll_fwd"),
        $df.col("date").dt.offsetDay(0, { excludeWeekdays: [0, 6], roll: "backward" }).alias("roll_bwd")
    ]).toDicts() as any[];

    if (getISOStr(resRollForward[0].roll_fwd) !== "2026-05-25") {
        throw new Error(`Edge Case Fail: Expected Saturday roll forward = 2026-05-25 (Monday), got ${getISOStr(resRollForward[0].roll_fwd)}`);
    }
    if (getISOStr(resRollForward[0].roll_bwd) !== "2026-05-22") {
        throw new Error(`Edge Case Fail: Expected Saturday roll backward = 2026-05-22 (Friday), got ${getISOStr(resRollForward[0].roll_bwd)}`);
    }

    // Edge Case 4: Holidays (Array vs Set)
    const dfHoliday = $df.data([{ date: "2026-05-21" }], { date: $df.DataType.Date }); // Thursday
    const resHolidays = dfHoliday.select([
        $df.col("date").dt.offsetDay(3, { excludeWeekdays: [0, 6], holidays: ["2026-05-22"] }).alias("arr_hol"),
        $df.col("date").dt.offsetDay(3, { excludeWeekdays: [0, 6], holidays: new Set([new Date("2026-05-22T00:00:00.000Z").getTime()]) }).alias("set_hol")
    ]).toDicts() as any[];

    if (getISOStr(resHolidays[0].arr_hol) !== "2026-05-27") {
        throw new Error(`Edge Case Fail: Expected Thursday + 3 biz days (Fri holiday) = Wednesday 2026-05-27, got ${getISOStr(resHolidays[0].arr_hol)}`);
    }
    if (getISOStr(resHolidays[0].set_hol) !== "2026-05-27") {
        throw new Error(`Edge Case Fail: Expected Thursday + 3 biz days (Set holiday) = Wednesday 2026-05-27, got ${getISOStr(resHolidays[0].set_hol)}`);
    }

    // Edge Case 5: Negative Offsets (n < 0)
    const dfNeg = $df.data([{ date: "2026-05-25" }], { date: $df.DataType.Date }); // Monday
    const resNeg = dfNeg.select([
        $df.col("date").dt.offsetDay(-1, { excludeWeekdays: [0, 6] }).alias("neg_biz"),
        $df.col("date").dt.offsetDay(-3).alias("neg_cal")
    ]).toDicts() as any[];

    if (getISOStr(resNeg[0].neg_biz) !== "2026-05-22") {
        throw new Error(`Edge Case Fail: Expected Monday - 1 biz day = Friday 2026-05-22, got ${getISOStr(resNeg[0].neg_biz)}`);
    }
    if (getISOStr(resNeg[0].neg_cal) !== "2026-05-22") {
        throw new Error(`Edge Case Fail: Expected Monday - 3 calendar days = Friday 2026-05-22, got ${getISOStr(resNeg[0].neg_cal)}`);
    }

    // Edge Case 6: Leap Year and Year Boundary Crossings
    const dfLeap = $df.data([{ date: "2024-02-28" }, { date: "2023-02-28" }, { date: "2026-12-31" }], { date: $df.DataType.Date });
    const resLeap = dfLeap.select([
        $df.col("date").dt.offsetDay(1).alias("plus1")
    ]).toDicts() as any[];

    if (getISOStr(resLeap[0].plus1) !== "2024-02-29") {
        throw new Error(`Edge Case Fail: Expected 2024-02-28 + 1 day = 2024-02-29 (leap year), got ${getISOStr(resLeap[0].plus1)}`);
    }
    if (getISOStr(resLeap[1].plus1) !== "2023-03-01") {
        throw new Error(`Edge Case Fail: Expected 2023-02-28 + 1 day = 2023-03-01 (non leap year), got ${getISOStr(resLeap[1].plus1)}`);
    }
    if (getISOStr(resLeap[2].plus1) !== "2027-01-01") {
        throw new Error(`Edge Case Fail: Expected 2026-12-31 + 1 day = 2027-01-01 (year end), got ${getISOStr(resLeap[2].plus1)}`);
    }

    // Edge Case 7: Null Values in Date or Offset Column
    const dfNull = $df.data([{ date: null, offset: 3 }, { date: "2026-05-20", offset: null }], { date: $df.DataType.Date, offset: $df.DataType.Int32 });
    const resNull = dfNull.select([
        $df.col("date").dt.offsetDay($df.col("offset"), { excludeWeekdays: [0, 6] }).alias("res_null")
    ]).toDicts() as any[];

    if (resNull[0].res_null !== null || resNull[1].res_null !== null) {
        throw new Error(`Edge Case Fail: Expected null input to produce null output, got ${resNull[0].res_null}, ${resNull[1].res_null}`);
    }

    // Test 6: utc_offset
    console.log("Testing Expr.dt.utc_offset...");
    const tzData = [
        { date: "2011-12-29T00:00:00Z" }, // Samoa before shift
        { date: "2012-01-01T00:00:00Z" }, // Samoa after shift
        { date: "2026-07-01T00:00:00Z" }, // New York Summer (DST active)
    ];
    const dfTz = $df.data(tzData, { date: $df.DataType.Date });

    const projectedTz = dfTz.select([
        $df.col("date").dt.utc_offset("Pacific/Apia", { type: "base" }).alias("samoa_base"),
        $df.col("date").dt.utc_offset("America/New_York", { type: "base" }).alias("ny_base"),
        $df.col("date").dt.utc_offset("America/New_York", { type: "total" }).alias("ny_dst"),
        $df.col("date").dt.utc_offset("America/New_York", { type: "daylightSavingTime" }).alias("ny_dst_only"),
        $df.col("date").dt.utc_offset("America/New_York", { type: "total", format: "iso" }).alias("ny_dst_iso"),
        $df.col("date").dt.utc_offset("America/New_York", { type: "total", format: "basic" }).alias("ny_dst_basic"),
        $df.col("date").dt.utc_offset("America/New_York", { type: "total", format: "minutes" }).alias("ny_dst_min"),
        $df.col("date").dt.utc_offset("America/New_York", { type: "total", format: "hours" }).alias("ny_dst_hr"),
        $df.col("date").dt.utc_offset("America/New_York").alias("ny_no_opts")
    ]).toDicts() as any[];

    // Samoa before shift (Dec 29, 2011) base offset = -11 hours
    const h11 = -11 * 3600000;
    if (projectedTz[0].samoa_base !== h11) {
        throw new Error(`Expected Samoa Dec 2011 base offset to be -11 hours (${h11} ms), got ${projectedTz[0].samoa_base}`);
    }

    // Samoa after shift (Jan 1, 2012) base offset = +13 hours
    const h13 = 13 * 3600000;
    if (projectedTz[1].samoa_base !== h13) {
        throw new Error(`Expected Samoa Jan 2012 base offset to be +13 hours (${h13} ms), got ${projectedTz[1].samoa_base}`);
    }

    // New York base offset on Jul 1, 2026 is always standard winter offset (-5 hours)
    const h5neg = -5 * 3600000;
    if (projectedTz[2].ny_base !== h5neg) {
        throw new Error(`Expected NY July base offset to be -5 hours (${h5neg} ms), got ${projectedTz[2].ny_base}`);
    }

    // New York total offset on Jul 1, 2026 with DST included is -4 hours
    const h4neg = -4 * 3600000;
    if (projectedTz[2].ny_dst !== h4neg) {
        throw new Error(`Expected NY July total offset with DST to be -4 hours (${h4neg} ms), got ${projectedTz[2].ny_dst}`);
    }

    if (projectedTz[2].ny_no_opts !== h4neg) {
        throw new Error(`Expected NY July offset without options to default to total offset (${h4neg} ms), got ${projectedTz[2].ny_no_opts}`);
    }

    // NY DST only portion in summer is 1 hour (3600000 ms)
    const h1 = 3600000;
    if (projectedTz[2].ny_dst_only !== h1) {
        throw new Error(`Expected NY July DST portion to be 1 hour (${h1} ms), got ${projectedTz[2].ny_dst_only}`);
    }

    // NY DST ISO format is "-04:00"
    if (projectedTz[2].ny_dst_iso !== "-04:00") {
        throw new Error(`Expected NY July DST ISO format to be "-04:00", got "${projectedTz[2].ny_dst_iso}"`);
    }

    // NY DST Basic format is "-0400"
    if (projectedTz[2].ny_dst_basic !== "-0400") {
        throw new Error(`Expected NY July DST Basic format to be "-0400", got "${projectedTz[2].ny_dst_basic}"`);
    }

    // NY DST Minutes format is -240
    if (projectedTz[2].ny_dst_min !== -240) {
        throw new Error(`Expected NY July DST minutes to be -240, got ${projectedTz[2].ny_dst_min}`);
    }

    // NY DST Hours format is -4
    if (projectedTz[2].ny_dst_hr !== -4) {
        throw new Error(`Expected NY July DST hours to be -4, got ${projectedTz[2].ny_dst_hr}`);
    }

    console.log("Expr.dt.offsetDay and utc_offset tests passed!");

    // =========================================
    // EDGE CASE TESTS FOR REFACTORED DT METHODS
    // =========================================
    console.log("Testing edge cases for microsecond, nanosecond, offsetDay, and total_*...");

    // 1. microsecond & nanosecond edge cases
    const dfSubSec = $df.data([
        { ts: "2026-05-20T10:00:00.123Z" },
        { ts: "2026-05-20T10:00:00.000Z" },
        { ts: "2026-05-20T10:00:00.999Z" },
        { ts: null }
    ], { ts: $df.DataType.Datetime });

    const resSubSec = dfSubSec.select([
        $df.col("ts").dt.microsecond().alias("us"),
        $df.col("ts").dt.nanosecond().alias("ns")
    ]).toDicts() as any[];

    if (resSubSec[0].us !== 123000 || resSubSec[0].ns !== 123000000) {
        throw new Error(`SubSec Edge Case 1 Fail: Expected 123000us/123000000ns, got us=${resSubSec[0].us}, ns=${resSubSec[0].ns}`);
    }
    if (resSubSec[1].us !== 0 || resSubSec[1].ns !== 0) {
        throw new Error(`SubSec Edge Case 2 Fail: Expected 0us/0ns, got us=${resSubSec[1].us}, ns=${resSubSec[1].ns}`);
    }
    if (resSubSec[2].us !== 999000 || resSubSec[2].ns !== 999000000) {
        throw new Error(`SubSec Edge Case 3 Fail: Expected 999000us/999000000ns, got us=${resSubSec[2].us}, ns=${resSubSec[2].ns}`);
    }
    if (resSubSec[3].us !== null || resSubSec[3].ns !== null) {
        throw new Error(`SubSec Edge Case 4 Fail: Expected null output for null input, got us=${resSubSec[3].us}, ns=${resSubSec[3].ns}`);
    }

    // 2. offsetDay edge cases (standard vs business/exclusion rules)
    const dfOffset = $df.data([
        { date: "2026-05-20", n: 5 },   // Wednesday + 5 days
        { date: "2026-05-22", n: 1 },   // Friday + 1 bday (should skip weekend to Monday May 25)
        { date: "2026-05-20", n: 0 },   // 0 offset
        { date: "2026-05-20", n: -3 },  // Negative offset
        { date: null, n: 2 },           // Null date
        { date: "2026-05-20", n: null }  // Null n
    ], { date: $df.DataType.Date, n: $df.DataType.Int32 });

    const resOffset = dfOffset.select([
        $df.col("date").dt.offsetDay($df.col("n")).alias("std_offset"),
        $df.col("date").dt.offsetDay($df.col("n"), { excludeWeekdays: [0, 6] }).alias("biz_offset")
    ]).toDicts() as any[];

    // Wednesday May 20 + 5 calendar days = Monday May 25
    if (new Date(resOffset[0].std_offset).toISOString() !== "2026-05-25T00:00:00.000Z") {
        throw new Error(`Offset Edge Case 1 Fail: Expected 2026-05-25, got ${resOffset[0].std_offset}`);
    }
    // Friday May 22 + 1 biz day (skipping weekend) = Monday May 25
    if (new Date(resOffset[1].biz_offset).toISOString() !== "2026-05-25T00:00:00.000Z") {
        throw new Error(`Offset Edge Case 2 Fail: Expected 2026-05-25, got ${resOffset[1].biz_offset}`);
    }
    // 0 offset = same date May 20
    if (new Date(resOffset[2].std_offset).toISOString() !== "2026-05-20T00:00:00.000Z") {
        throw new Error(`Offset Edge Case 3 Fail: Expected 2026-05-20, got ${resOffset[2].std_offset}`);
    }
    // Negative -3 calendar days from May 20 = May 17
    if (new Date(resOffset[3].std_offset).toISOString() !== "2026-05-17T00:00:00.000Z") {
        throw new Error(`Offset Edge Case 4 Fail: Expected 2026-05-17, got ${resOffset[3].std_offset}`);
    }
    // Null checks
    if (resOffset[4].std_offset !== null || resOffset[5].std_offset !== null) {
        throw new Error(`Offset Edge Case 5 Fail: Expected null output for null inputs`);
    }

    // 3. total_* methods edge cases (positive, negative, zero, null)
    const dfDur = $df.data([
        { dur: 86400000 },    // 1 day in ms
        { dur: -3600000 },    // -1 hour in ms
        { dur: 0 },           // 0 ms
        { dur: null }         // null
    ], { dur: $df.DataType.Float64 });

    const resDur = dfDur.select([
        $df.col("dur").dt.totalDays().alias("d"),
        $df.col("dur").dt.totalHours().alias("h"),
        $df.col("dur").dt.totalMinutes().alias("m"),
        $df.col("dur").dt.totalSeconds().alias("s"),
        $df.col("dur").dt.totalMilliseconds().alias("ms"),
        $df.col("dur").dt.totalMicroseconds().alias("us"),
        $df.col("dur").dt.totalNanoseconds().alias("ns")
    ]).toDicts() as any[];

    if (resDur[0].d !== 1 || resDur[0].h !== 24 || resDur[0].m !== 1440 || resDur[0].s !== 86400) {
        throw new Error(`Total Edge Case 1 Fail: Expected 1d/24h/1440m/86400s, got ${resDur[0].d}d ${resDur[0].h}h`);
    }
    if (resDur[1].h !== -1 || resDur[1].m !== -60 || resDur[1].s !== -3600) {
        throw new Error(`Total Edge Case 2 Fail: Expected -1h/-60m/-3600s, got ${resDur[1].h}h ${resDur[1].m}m`);
    }
    if (resDur[2].d !== 0 || resDur[2].h !== 0 || resDur[2].ms !== 0 || resDur[2].us !== 0 || resDur[2].ns !== 0) {
        throw new Error(`Total Edge Case 3 Fail: Expected 0 across all units, got d=${resDur[2].d}`);
    }
    // 4. century, millennium, and quarter edge cases (including boundaries, and timezones)
    const d1000 = new Date(0); d1000.setUTCFullYear(1000, 0, 1);
    const d100 = new Date(0); d100.setUTCFullYear(100, 0, 1);
    const d1 = new Date(0); d1.setUTCFullYear(1, 0, 1);

    const dfEras = $df.data({
        date: [
            new Date("2026-05-25T00:00:00.000Z"),
            new Date("2001-01-01T00:00:00.000Z"),
            new Date("2000-12-31T23:59:59.000Z"),
            new Date("2000-01-01T00:00:00.000Z"),
            new Date("1901-01-01T00:00:00.000Z"),
            new Date("1900-12-31T00:00:00.000Z"),
            d1000,
            d100,
            d1,
            new Date("2026-01-01T02:00:00.000Z"),
            null
        ]
    }, { date: $df.DataType.Datetime });

    const resEras = dfEras.select([
        $df.col("date").dt.century().alias("c_utc"),
        $df.col("date").dt.millennium().alias("m_utc"),
        $df.col("date").dt.quarter().alias("q_utc"),
        $df.col("date").dt.quarter("America/New_York").alias("q_ny"),
        $df.col("date").dt.year("America/New_York").alias("y_ny")
    ]).toDicts() as any[];

    console.log("resEras results:", resEras);
    // 0: 2026-05-25
    if (resEras[0].c_utc !== 21 || resEras[0].m_utc !== 3 || resEras[0].q_utc !== 2) {
        throw new Error(`Eras Edge Case 0 Fail: 2026 expected c=21, m=3, q=2; got c=${resEras[0].c_utc}, m=${resEras[0].m_utc}, q=${resEras[0].q_utc}`);
    }
    // 1: 2001-01-01
    if (resEras[1].c_utc !== 21 || resEras[1].m_utc !== 3 || resEras[1].q_utc !== 1) {
        throw new Error(`Eras Edge Case 1 Fail: 2001 expected c=21, m=3, q=1; got c=${resEras[1].c_utc}, m=${resEras[1].m_utc}`);
    }
    // 2: 2000-12-31
    if (resEras[2].c_utc !== 20 || resEras[2].m_utc !== 2 || resEras[2].q_utc !== 4) {
        throw new Error(`Eras Edge Case 2 Fail: 2000-12-31 expected c=20, m=2, q=4; got c=${resEras[2].c_utc}, m=${resEras[2].m_utc}`);
    }
    // 3: 2000-01-01 -> 20th century, 2nd millennium, Q1
    if (resEras[3].c_utc !== 20 || resEras[3].m_utc !== 2 || resEras[3].q_utc !== 1) {
        throw new Error(`Eras Edge Case 3 Fail: 2000-01-01 expected c=20, m=2, q=1`);
    }
    // 4: 1901-01-01 -> 20th century, 2nd millennium, Q1
    if (resEras[4].c_utc !== 20 || resEras[4].m_utc !== 2 || resEras[4].q_utc !== 1) {
        throw new Error(`Eras Edge Case 4 Fail: 1901-01-01 expected c=20, m=2, q=1`);
    }
    // 5: 1900-12-31 -> 19th century, 2nd millennium, Q4
    if (resEras[5].c_utc !== 19 || resEras[5].m_utc !== 2 || resEras[5].q_utc !== 4) {
        throw new Error(`Eras Edge Case 5 Fail: 1900-12-31 expected c=19, m=2, q=4`);
    }
    // 6: 1000-01-01 -> 10th century, 1st millennium, Q1
    if (resEras[6].c_utc !== 10 || resEras[6].m_utc !== 1 || resEras[6].q_utc !== 1) {
        throw new Error(`Eras Edge Case 6 Fail: 1000 expected c=10, m=1, q=1, got c=${resEras[6].c_utc}, m=${resEras[6].m_utc}, q=${resEras[6].q_utc}`);
    }
    // 7: 0100-01-01 -> 1st century, 1st millennium, Q1
    if (resEras[7].c_utc !== 1 || resEras[7].m_utc !== 1 || resEras[7].q_utc !== 1) {
        throw new Error(`Eras Edge Case 7 Fail: 100 expected c=1, m=1, q=1`);
    }
    // 8: 0001-01-01 -> 1st century, 1st millennium, Q1
    if (resEras[8].c_utc !== 1 || resEras[8].m_utc !== 1 || resEras[8].q_utc !== 1) {
        throw new Error(`Eras Edge Case 8 Fail: 1 expected c=1, m=1, q=1`);
    }
    // 9: Timezone boundary shift check: 2026-01-01T02:00:00Z is 2025-12-31 21:00 in NY
    if (resEras[9].q_utc !== 1 || resEras[9].q_ny !== 4 || resEras[9].y_ny !== 2025) {
        throw new Error(`Eras Edge Case 9 Fail: TZ shift expected q_utc=1, q_ny=4, y_ny=2025; got q_utc=${resEras[9].q_utc}, q_ny=${resEras[9].q_ny}, y_ny=${resEras[9].y_ny}`);
    }
    // 10: Null check
    if (resEras[10].c_utc !== null || resEras[10].m_utc !== null || resEras[10].q_utc !== null) {
        throw new Error(`Eras Edge Case 10 Fail: Expected nulls for null input`);
    }

    // 11: Exhaustive is_leap_year edge cases
    const dfLeapTest = $df.data({
        date: [
            "2000-01-01T00:00:00Z", // 400-year leap year -> true
            "1900-01-01T00:00:00Z", // 100-year non-leap year -> false
            "2024-02-29T12:00:00Z", // 4-year leap year -> true
            "2023-05-15T00:00:00Z", // standard non-leap year -> false
            "2024-01-01T03:00:00Z", // 2024 in UTC (true), but 2023-12-31 in America/New_York (false)
            null
        ]
    }, { date: $df.DataType.Datetime });

    const leapRes = dfLeapTest.select([
        $df.col("date").dt.is_leap_year().alias("leap_utc"),
        $df.col("date").dt.is_leap_year("America/New_York").alias("leap_ny")
    ]).toDicts() as any[];

    if (leapRes[0].leap_utc !== true) throw new Error("Year 2000 should be leap year (divisible by 400)");
    if (leapRes[1].leap_utc !== false) throw new Error("Year 1900 should NOT be leap year (divisible by 100 but not 400)");
    if (leapRes[2].leap_utc !== true) throw new Error("Year 2024 should be leap year");
    if (leapRes[3].leap_utc !== false) throw new Error("Year 2023 should NOT be leap year");
    // Timezone boundary test: 2024-01-01T03:00:00Z is 2023-12-31 22:00:00 in America/New_York
    if (leapRes[4].leap_utc !== true || leapRes[4].leap_ny !== false) {
        throw new Error(`Leap year timezone shift failed: expected leap_utc=true, leap_ny=false, got leap_utc=${leapRes[4].leap_utc}, leap_ny=${leapRes[4].leap_ny}`);
    }
    if (leapRes[5].leap_utc !== null) throw new Error("Null date should evaluate to null for is_leap_year");

    console.log("All refactored dt method edge cases passed successfully!");

    // ----------------------------------------------------
    // START TEMPORAL TIMEZONE EDGE CASES TESTS
    // ----------------------------------------------------
    const dfComplexTz = $df.data({
        ts: [
            "2024-02-29T23:45:15.123Z", // Leap year leap day late evening UTC
            "2026-12-31T23:59:59.999Z", // New Year's Eve 1ms before 2027
            "2026-06-01T00:00:00.000Z", // Midnight UTC summer
            null                      // Null row propagation
        ]
    });

    const resComplexTz = dfComplexTz.withColumns(
        $df.col("ts").dt.hour("Asia/Tokyo").alias("tokyo_hour"),
        $df.col("ts").dt.day("Asia/Tokyo").alias("tokyo_day"),
        $df.col("ts").dt.month("Asia/Tokyo").alias("tokyo_month"),
        $df.col("ts").dt.year("Asia/Tokyo").alias("tokyo_year"),
        $df.col("ts").dt.hour("America/New_York").alias("ny_hour"),
        $df.col("ts").dt.day("America/New_York").alias("ny_day"),
        $df.col("ts").dt.replace({ year: 2030, month: 12, day: 25, hour: 8, timeZone: "America/Chicago" }).alias("replaced_chicago"),
        $df.col("ts").dt.convertTimeZone("Europe/London").alias("converted_london"),
        $df.col("ts").dt.castTimeUnit("us").alias("casted_us")
    );

    const complexTzRows = resComplexTz.toDicts() as any[];
    if (complexTzRows[0].tokyo_hour !== 8) throw new Error("Tokyo hour failed");
    if (complexTzRows[0].tokyo_day !== 1) throw new Error("Tokyo day failed");
    if (complexTzRows[0].tokyo_month !== 3) throw new Error("Tokyo month failed");
    if (complexTzRows[0].tokyo_year !== 2024) throw new Error("Tokyo year failed");
    if (complexTzRows[1].tokyo_year !== 2027) throw new Error("Tokyo year 2027 failed");
    if (complexTzRows[2].ny_hour !== 20) throw new Error("NY hour failed");
    if (complexTzRows[2].ny_day !== 31) throw new Error("NY day failed");
    if (complexTzRows[3].tokyo_hour !== null) throw new Error("Null row propagation failed");

    console.log("✓ All temporal timezone edge-case tests passed successfully!");
    // ----------------------------------------------------
    // END TEMPORAL TIMEZONE EDGE CASES TESTS
    // ----------------------------------------------------

    console.log("\n🎉 ALL Expr.dt COLUMN EXPRESSION TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("\n❌ Expr.dt COLUMN EXPRESSION TESTS FAILED:", err);
    process.exit(1);
}
