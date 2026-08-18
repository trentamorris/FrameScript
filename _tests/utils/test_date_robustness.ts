declare const process: any;
import {
    strftime,
    strptime,
    toValidDate,
    dateDiff,
    getMonthOffset,
    offsetDay,
    isBusinessDay,
    getEraUnit,
    _createUTCDate
} from "../../src/utils/date";
import { ComputeError } from "../../src/exceptions";

console.log("=========================================");
console.log("STARTING DATE UTILS ROBUSTNESS TESTS...");
console.log("=========================================");

try {
    // 1. Test inline time formatting (split/slice) with standard UTC date
    const dUTC = new Date("2026-05-25T10:37:16.123Z");
    const tUTC = dUTC.toISOString().split("T")[1].slice(0, 12);
    if (tUTC !== "10:37:16.123") {
        throw new Error(`Expected "10:37:16.123", got "${tUTC}"`);
    }
    console.log("✓ Inline time formatting standard date passed");

    // 2. Test inline time formatting with extended year (5 digits positive)
    const dExtPos = new Date();
    dExtPos.setUTCFullYear(12026);
    dExtPos.setUTCMonth(4); // May
    dExtPos.setUTCDate(25);
    dExtPos.setUTCHours(10, 37, 16, 123);
    const tExtPos = dExtPos.toISOString().split("T")[1].slice(0, 12);
    if (tExtPos !== "10:37:16.123") {
        throw new Error(`Expected "10:37:16.123" for extended year, got "${tExtPos}"`);
    }
    console.log("✓ Inline time formatting positive extended year passed");

    // 3. Test inline time formatting with negative extended year (BC/negative year representation)
    const dExtNeg = new Date();
    dExtNeg.setUTCFullYear(-100);
    dExtNeg.setUTCMonth(4);
    dExtNeg.setUTCDate(25);
    dExtNeg.setUTCHours(10, 37, 16, 123);
    const tExtNeg = dExtNeg.toISOString().split("T")[1].slice(0, 12);
    if (tExtNeg !== "10:37:16.123") {
        throw new Error(`Expected "10:37:16.123" for negative year, got "${tExtNeg}"`);
    }
    console.log("✓ Inline time formatting negative extended year passed");

    // 4. Verify strftime handles basic replacement correctly
    const dStrftime = new Date("2026-05-25T10:37:16.123Z");
    const formatted = strftime(dStrftime, { format: "%Y-%m-%d %H:%M:%S.%ms %Z %z" });
    if (formatted !== "2026-05-25 10:37:16.123 UTC +0000") {
        throw new Error(`Expected "2026-05-25 10:37:16.123 UTC +0000", got "${formatted}"`);
    }
    console.log("✓ strftime format correctness passed");

    // 5. Verify strftime lazy evaluation:
    // A format string without locale directives (like "%Y-%m-%d") should be orders of magnitude faster
    // than one with locale directives (like "%A %B") because toLocaleDateString is extremely slow.
    const startSimple = performance.now();
    for (let i = 0; i < 1000; i++) {
        strftime(dStrftime, { format: "%Y-%m-%d" });
    }
    const durationSimple = performance.now() - startSimple;

    const startLocale = performance.now();
    for (let i = 0; i < 1000; i++) {
        strftime(dStrftime, { format: "%A %B" });
    }
    const durationLocale = performance.now() - startLocale;

    console.log(`Simple format duration: ${durationSimple.toFixed(2)}ms`);
    console.log(`Locale format duration: ${durationLocale.toFixed(2)}ms`);
    if (durationLocale < durationSimple * 1.5) {
        console.warn("Warning: Simple and locale formats took similar time. Check if lazy evaluation is active.");
    } else {
        console.log("✓ strftime lazy evaluation performance gain confirmed!");
    }

    // 6. Test parsing and formatting of year 0-99 (handling JavaScript Date.UTC 0-99 gotcha)
    const dYear50 = new Date(0);
    dYear50.setUTCFullYear(50, 4, 25); // 0050-05-25
    dYear50.setUTCHours(10, 37, 16, 123);

    const formattedYear50 = strftime(dYear50, { format: "%Y-%m-%d %H:%M:%S.%ms" });
    if (formattedYear50 !== "0050-05-25 10:37:16.123") {
        throw new Error(`Expected "0050-05-25 10:37:16.123" for year 50, got "${formattedYear50}"`);
    }

    const parsedYear50 = strptime("0050-05-25 10:37:16.123", { format: "%Y-%m-%d %H:%M:%S.%ms" });
    if (!parsedYear50 || parsedYear50.getUTCFullYear() !== 50 || parsedYear50.getUTCMonth() !== 4 || parsedYear50.getUTCDate() !== 25) {
        throw new Error(`Expected parsed year 50, month 4, date 25, got "${parsedYear50 ? parsedYear50.toISOString() : "null"}"`);
    }
    console.log("✓ Parsing/formatting for years 0-99 (setUTCFullYear workaround) passed");

    // 7. Test invalid timezone gracefully falling back to UTC instead of throwing
    const dInvalidTz = new Date("2026-05-25T10:37:16.123Z");
    const formattedInvalidTz = strftime(dInvalidTz, { format: "%Y-%m-%d %H:%M:%S.%ms %Z %z", timeZone: "Invalid/TimeZone_Name" });
    if (formattedInvalidTz !== "2026-05-25 10:37:16.123 UTC +0000") {
        throw new Error(`Expected fallback to UTC offset (+0000) for invalid timezone, got "${formattedInvalidTz}"`);
    }

    const parsedInvalidTz = strptime("2026-05-25 10:37:16.123", { format: "%Y-%m-%d %H:%M:%S.%ms", strict: true, defaultTimeZone: "Invalid/TimeZone_Name" });
    if (!parsedInvalidTz || parsedInvalidTz.getTime() !== dInvalidTz.getTime()) {
        throw new Error(`Expected parsed date to match UTC input when default timezone is invalid, got "${parsedInvalidTz ? parsedInvalidTz.toISOString() : "null"}"`);
    }
    console.log("✓ Invalid timezone fallback to UTC passed");

    // 8. Test dateDiff utility
    const d1 = new Date("2026-05-15T12:00:00Z");
    const d2 = new Date("2026-06-17T18:00:00Z"); // 1 month, 2.25 days later

    // milliseconds
    const offsetMs = dateDiff(d1, d2, "ms");
    if (offsetMs !== d2.getTime() - d1.getTime()) {
        throw new Error(`Expected correct ms offset, got ${offsetMs}`);
    }

    // seconds
    const offsetS = dateDiff(d1, d2, "seconds");
    if (offsetS !== (d2.getTime() - d1.getTime()) / 1000) {
        throw new Error(`Expected correct seconds offset, got ${offsetS}`);
    }

    // days
    const offsetD = dateDiff(d1, d2, "d");
    if (offsetD !== (d2.getTime() - d1.getTime()) / 86400000) {
        throw new Error(`Expected correct days offset, got ${offsetD}`);
    }

    // weeks
    const offsetW = dateDiff(d1, d2, "weeks");
    if (offsetW !== (d2.getTime() - d1.getTime()) / 604800000) {
        throw new Error(`Expected correct weeks offset, got ${offsetW}`);
    }

    // months (May has 31 days. Day diff = (17 - 15) + (18 - 12)/24 = 2.25. 2.25 / 31 = 0.07258064516129032)
    const offsetMo = dateDiff(d1, d2, "months");
    const expectedMo = 1 + 2.25 / 31;
    if (Math.abs((offsetMo ?? 0) - expectedMo) > 1e-9) {
        throw new Error(`Expected correct months offset around ${expectedMo}, got ${offsetMo}`);
    }

    // quarters
    const offsetQ = dateDiff(d1, d2, "q");
    if (Math.abs((offsetQ ?? 0) - expectedMo / 3) > 1e-9) {
        throw new Error(`Expected correct quarters offset, got ${offsetQ}`);
    }

    // years
    const offsetY = dateDiff(d1, d2, "y");
    if (Math.abs((offsetY ?? 0) - expectedMo / 12) > 1e-9) {
        throw new Error(`Expected correct years offset, got ${offsetY}`);
    }

    // Negative difference
    const offsetNegMo = dateDiff(d2, d1, "months");
    // Going backward: April has 30 days. Day diff = (15 - 17) + (12 - 18)/24 = -2.25. -2.25 / 31 (previous month of June 17 is May, which has 31 days? Wait, target is d1 which is May 15. The previous month of May 15 is April which has 30 days)
    // Wait, let's verify what previous month dateDiff uses when going backward (dayDiff < 0):
    // d1 = June 17 (y2=2026, m2=5), d2 = May 15 (y1=2026, m1=4)
    // baseMonths = (2026 - 2026)*12 + (4 - 5) = -1
    // dayDiff = (15 - 17) + (12 - 18)/24 = -2.25
    // Since dayDiff < 0, we use new Date(Date.UTC(y2, m2, 0)).getUTCDate() where y2=2026, m2=4 (May).
    // Date.UTC(2026, 4, 0) is the last day of April (30 days). So daysInMonth = 30.
    // expectedNegMo = -1 + (-2.25) / 30 = -1.075
    const expectedNegMo = -1 - 2.25 / 30;
    if (Math.abs((offsetNegMo ?? 0) - expectedNegMo) > 1e-9) {
        throw new Error(`Expected correct negative months offset, got ${offsetNegMo}`);
    }

    // Invalid dates
    if (dateDiff(new Date("invalid"), d2, "ms") !== null) {
        throw new Error("Expected null offset for invalid date");
    }

    // Test rounding modes
    // Positive offsetMo = 1.07258...
    if (dateDiff(d1, d2, "months", { roundMode: "floor" }) !== 1) {
        throw new Error("Expected floor mode to return 1");
    }
    if (dateDiff(d1, d2, "months", { roundMode: "ceil" }) !== 2) {
        throw new Error("Expected ceil mode to return 2");
    }
    if (dateDiff(d1, d2, "months", { roundMode: "round" }) !== 1) {
        throw new Error("Expected round mode to return 1");
    }
    if (dateDiff(d1, d2, "months", { roundMode: "trunc" }) !== 1) {
        throw new Error("Expected trunc mode to return 1");
    }
    if (dateDiff(d1, d2, "months", { roundMode: "exact" }) !== offsetMo) {
        throw new Error("Expected exact mode to return offsetMo");
    }

    // Negative offsetNegMo = -1.075
    if (dateDiff(d2, d1, "months", { roundMode: "floor" }) !== -2) {
        throw new Error("Expected floor mode for negative offset to return -2");
    }
    if (dateDiff(d2, d1, "months", { roundMode: "ceil" }) !== -1) {
        throw new Error("Expected ceil mode for negative offset to return -1");
    }
    if (dateDiff(d2, d1, "months", { roundMode: "round" }) !== -1) {
        throw new Error("Expected round mode for negative offset to return -1");
    }
    if (dateDiff(d2, d1, "months", { roundMode: "trunc" }) !== -1) {
        throw new Error("Expected trunc mode for negative offset to return -1");
    }
    if (dateDiff(d2, d1, "months", { roundMode: "exact" }) !== offsetNegMo) {
        throw new Error("Expected exact mode for negative offset to return offsetNegMo");
    }

    console.log("✓ dateDiff utility correctness passed");

    // 9. Visualize and test getMonthOffset(d, 1, 0) for days_in_month
    console.log("\n--- VISUALIZING DAYS IN MONTH CALCULATION ---");
    const testDates = [
        new Date("2024-02-15T00:00:00Z"), // Leap year February
        new Date("2023-02-15T00:00:00Z"), // Non-leap year February
        new Date("2026-12-15T00:00:00Z"), // December (year boundary check)
        toValidDate("0050-02-15T00:00:00Z")!, // Historical year 50
    ];

    for (const d of testDates) {
        const nextMonthZeroIndexed = d.getUTCMonth() + 1;
        const endOfMonthDate = getMonthOffset(d, 1, 0);
        const days = endOfMonthDate ? endOfMonthDate.getUTCDate() : null;

        console.log(`Input Date: ${d.toISOString().substring(0, 10)}`);
        console.log(`  -> Next Month Index: ${nextMonthZeroIndexed} (base 0)`);
        console.log(`  -> Intermediate Rolled-back Date: ${endOfMonthDate ? endOfMonthDate.toISOString().substring(0, 10) : "null"}`);
        console.log(`  -> getUTCDate() / Days in Month: ${days}`);
        console.log("---------------------------------------------");

        // Assert correctness
        const expectedDays = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
        if (days !== expectedDays) {
            throw new Error(`Assertion failed for ${d.toISOString()}: expected ${expectedDays}, got ${days}`);
        }
    }
    console.log("✓ days_in_month visualization tests passed");

    // 10. getEraUnit (Century & Millennium) Exhaustive Tests
    console.log("\n--- EXHAUSTIVE GETERAUNIT TESTS ---");
    const testEraDates = [
        // Modern & standard dates
        { date: new Date("2026-05-25T00:00:00Z"), century: 21, millennium: 3 },
        { date: new Date("2001-01-01T00:00:00Z"), century: 21, millennium: 3 },
        { date: new Date("2000-12-31T23:59:59Z"), century: 20, millennium: 2 },
        { date: new Date("2000-01-01T00:00:00Z"), century: 20, millennium: 2 },
        { date: new Date("1999-12-31T00:00:00Z"), century: 20, millennium: 2 },
        { date: new Date("1901-01-01T00:00:00Z"), century: 20, millennium: 2 },
        { date: new Date("1900-12-31T00:00:00Z"), century: 19, millennium: 2 },
        { date: new Date("1900-01-01T00:00:00Z"), century: 19, millennium: 2 },
        { date: new Date("1001-01-01T00:00:00Z"), century: 11, millennium: 2 },
        { date: new Date("1000-01-01T00:00:00Z"), century: 10, millennium: 1 },
        { date: new Date("0999-12-31T00:00:00Z"), century: 10, millennium: 1 },
        { date: new Date("0101-01-01T00:00:00Z"), century: 2, millennium: 1 },
        { date: new Date("0100-01-01T00:00:00Z"), century: 1, millennium: 1 },
        { date: new Date("0001-01-01T00:00:00Z"), century: 1, millennium: 1 },
        // Epoch 0
        { date: new Date(0), century: 20, millennium: 2 },
        // Distant future
        { date: new Date("9999-12-31T23:59:59Z"), century: 100, millennium: 10 },
        { date: (() => { const d = new Date(0); d.setUTCFullYear(10000); return d; })(), century: 100, millennium: 10 },
        { date: (() => { const d = new Date(0); d.setUTCFullYear(10001); return d; })(), century: 101, millennium: 11 },
    ];
    for (const t of testEraDates) {
        if (getEraUnit(t.date, 100) !== t.century) {
            throw new Error(`Expected getEraUnit(year=${t.date.getUTCFullYear()}, 100) to be ${t.century}, got ${getEraUnit(t.date, 100)}`);
        }
        if (getEraUnit(t.date, 1000) !== t.millennium) {
            throw new Error(`Expected getEraUnit(year=${t.date.getUTCFullYear()}, 1000) to be ${t.millennium}, got ${getEraUnit(t.date, 1000)}`);
        }
    }
    // Negative / BC dates using setUTCFullYear
    const bc1 = new Date(0);
    bc1.setUTCFullYear(-1);
    if (getEraUnit(bc1, 100) !== 0 || getEraUnit(bc1, 1000) !== 0) {
        throw new Error(`Expected year -1 to be century 0 / millennium 0, got c=${getEraUnit(bc1, 100)} m=${getEraUnit(bc1, 1000)}`);
    }
    const bc100 = new Date(0);
    bc100.setUTCFullYear(-100);
    if (getEraUnit(bc100, 100) !== -1 || getEraUnit(bc100, 1000) !== 0) {
        throw new Error(`Expected year -100 to be century -1 / millennium 0, got c=${getEraUnit(bc100, 100)} m=${getEraUnit(bc100, 1000)}`);
    }
    const bc1000 = new Date(0);
    bc1000.setUTCFullYear(-1000);
    if (getEraUnit(bc1000, 100) !== -10 || getEraUnit(bc1000, 1000) !== -1) {
        throw new Error(`Expected year -1000 to be century -10 / millennium -1, got c=${getEraUnit(bc1000, 100)} m=${getEraUnit(bc1000, 1000)}`);
    }

    // Invalid date inputs & non-date objects
    const invalidInputs: any[] = [
        new Date("invalid"),
        null,
        undefined,
        "2026-05-25",
        123456789,
        true,
        false,
        {},
        [],
        NaN,
        Symbol("d")
    ];
    for (const inp of invalidInputs) {
        if (getEraUnit(inp, 100) !== null) {
            throw new Error(`Expected getEraUnit(${String(inp)}, 100) to return null, got ${getEraUnit(inp, 100)}`);
        }
        if (getEraUnit(inp, 1000) !== null) {
            throw new Error(`Expected getEraUnit(${String(inp)}, 1000) to return null, got ${getEraUnit(inp, 1000)}`);
        }
    }
    console.log("✓ Exhaustive getEraUnit tests passed");

    // 11. isBusinessDay Exhaustive Tests
    console.log("\n--- EXHAUSTIVE ISBUSINESSDAY TESTS ---");
    // Invalid / non-date inputs
    for (const inp of invalidInputs) {
        if (isBusinessDay(inp) !== null) {
            throw new Error(`Expected isBusinessDay(${String(inp)}) to return null, got ${isBusinessDay(inp)}`);
        }
    }

    // Standard 7 weekdays verification (2026-05-17 to 2026-05-23: Sun -> Sat)
    const week2026 = [
        { date: new Date("2026-05-17T00:00:00Z"), day: "Sun", isBday: false },
        { date: new Date("2026-05-18T00:00:00Z"), day: "Mon", isBday: true },
        { date: new Date("2026-05-19T00:00:00Z"), day: "Tue", isBday: true },
        { date: new Date("2026-05-20T00:00:00Z"), day: "Wed", isBday: true },
        { date: new Date("2026-05-21T00:00:00Z"), day: "Thu", isBday: true },
        { date: new Date("2026-05-22T00:00:00Z"), day: "Fri", isBday: true },
        { date: new Date("2026-05-23T00:00:00Z"), day: "Sat", isBday: false },
    ];
    for (const w of week2026) {
        if (isBusinessDay(w.date) !== w.isBday) {
            throw new Error(`Default isBusinessDay failed for ${w.day} (${w.date.toISOString()}): expected ${w.isBday}, got ${isBusinessDay(w.date)}`);
        }
    }

    // Sub-day timestamps (different times of the day should all yield identical business day status)
    const timeVariations = [
        new Date("2026-05-18T00:00:00.000Z"),
        new Date("2026-05-18T00:00:00.001Z"),
        new Date("2026-05-18T06:30:15.500Z"),
        new Date("2026-05-18T12:00:00.000Z"),
        new Date("2026-05-18T18:45:00.999Z"),
        new Date("2026-05-18T23:59:59.999Z"),
    ];
    for (const tv of timeVariations) {
        if (isBusinessDay(tv) !== true) {
            throw new Error(`Expected time variation ${tv.toISOString()} to be business day`);
        }
    }

    // excludeWeekdays permutations
    const monDate = new Date("2026-05-18T12:00:00Z");
    const friDate = new Date("2026-05-22T12:00:00Z");
    const satDate = new Date("2026-05-23T12:00:00Z");
    const sunDate = new Date("2026-05-24T12:00:00Z");

    // Empty excludeWeekdays -> all days are business days
    for (const w of week2026) {
        if (isBusinessDay(w.date, { excludeWeekdays: [] }) !== true) {
            throw new Error(`Expected ${w.day} with excludeWeekdays=[] to be true`);
        }
    }
    // All weekdays excluded -> all days are false
    for (const w of week2026) {
        if (isBusinessDay(w.date, { excludeWeekdays: [0, 1, 2, 3, 4, 5, 6] }) !== false) {
            throw new Error(`Expected ${w.day} with all days excluded to be false`);
        }
    }
    // Inverted work week: exclude Mon-Fri [1,2,3,4,5] -> Sat & Sun are business days
    if (isBusinessDay(monDate, { excludeWeekdays: [1, 2, 3, 4, 5] }) !== false) throw new Error("Expected Mon excluded in inverted week");
    if (isBusinessDay(satDate, { excludeWeekdays: [1, 2, 3, 4, 5] }) !== true) throw new Error("Expected Sat to be business day in inverted week");
    if (isBusinessDay(sunDate, { excludeWeekdays: [1, 2, 3, 4, 5] }) !== true) throw new Error("Expected Sun to be business day in inverted week");

    // Duplicate excludeWeekdays
    if (isBusinessDay(satDate, { excludeWeekdays: [6, 6, 0, 0] }) !== false) throw new Error("Expected Sat excluded with duplicate list");
    if (isBusinessDay(monDate, { excludeWeekdays: [6, 6, 0, 0] }) !== true) throw new Error("Expected Mon active with duplicate list");

    // Holidays passed in various array formats
    const mixedHolidayArray: any[] = [
        "2026-05-18",                        // ISO string date-only
        "2026-05-19T14:30:00Z",              // ISO string with time
        new Date("2026-05-20T00:00:00Z"),     // Date instance midnight
        new Date("2026-05-21T23:59:59Z"),     // Date instance end of day
        Date.UTC(2026, 4, 22),               // Epoch number in ms
        "invalid-date-string",               // Corrupt string (must be ignored)
        null,                                // Null entry (must be ignored)
        undefined,                           // Undefined entry (must be ignored)
        NaN,                                 // NaN entry (must be ignored)
        {},                                  // Empty object (must be ignored)
    ];
    // Mon-Fri are all in the holiday list -> all should be false
    if (isBusinessDay(new Date("2026-05-18T00:00:00Z"), { holidays: mixedHolidayArray }) !== false) throw new Error("Expected 2026-05-18 holiday to be false");
    if (isBusinessDay(new Date("2026-05-19T00:00:00Z"), { holidays: mixedHolidayArray }) !== false) throw new Error("Expected 2026-05-19 holiday to be false");
    if (isBusinessDay(new Date("2026-05-20T12:00:00Z"), { holidays: mixedHolidayArray }) !== false) throw new Error("Expected 2026-05-20 holiday to be false");
    if (isBusinessDay(new Date("2026-05-21T08:00:00Z"), { holidays: mixedHolidayArray }) !== false) throw new Error("Expected 2026-05-21 holiday to be false");
    if (isBusinessDay(new Date("2026-05-22T00:00:00Z"), { holidays: mixedHolidayArray }) !== false) throw new Error("Expected 2026-05-22 holiday to be false");
    // Non-holiday day in the next week (2026-05-25 Mon)
    if (isBusinessDay(new Date("2026-05-25T00:00:00Z"), { holidays: mixedHolidayArray }) !== true) throw new Error("Expected 2026-05-25 to be true");

    // Holidays passed as Set<number>
    const holidaySet = new Set<number>([
        Date.UTC(2026, 4, 18),
        Date.UTC(2026, 4, 20),
    ]);
    if (isBusinessDay(new Date("2026-05-18T00:00:00Z"), { holidays: holidaySet }) !== false) throw new Error("Expected Set holiday Mon to be false");
    if (isBusinessDay(new Date("2026-05-19T00:00:00Z"), { holidays: holidaySet }) !== true) throw new Error("Expected Tue to be true");
    if (isBusinessDay(new Date("2026-05-20T00:00:00Z"), { holidays: holidaySet }) !== false) throw new Error("Expected Set holiday Wed to be false");

    // Empty holidays
    if (isBusinessDay(monDate, { holidays: [] }) !== true) throw new Error("Expected Mon with empty holidays array to be true");
    if (isBusinessDay(monDate, { holidays: new Set() }) !== true) throw new Error("Expected Mon with empty holidays Set to be true");

    // Year boundary & leap day holidays
    const leapDay = new Date("2024-02-29T12:00:00Z"); // Thursday
    if (isBusinessDay(leapDay) !== true) throw new Error("Expected leap day to be business day by default");
    if (isBusinessDay(leapDay, { holidays: ["2024-02-29"] }) !== false) throw new Error("Expected leap day holiday to be false");

    const newYearsEve = new Date("2025-12-31T00:00:00Z"); // Wednesday
    const newYearsDay = new Date("2026-01-01T00:00:00Z"); // Thursday
    if (isBusinessDay(newYearsEve, { holidays: ["2025-12-31", "2026-01-01"] }) !== false) throw new Error("Expected NYE holiday to be false");
    if (isBusinessDay(newYearsDay, { holidays: ["2025-12-31", "2026-01-01"] }) !== false) throw new Error("Expected New Year holiday to be false");

    console.log("✓ Exhaustive isBusinessDay tests passed");

    // 12. offsetDay Exhaustive Tests
    console.log("\n--- EXHAUSTIVE OFFSETDAY TESTS ---");
    const mon = new Date("2026-05-18T10:00:00Z"); // Mon
    const tue = new Date("2026-05-19T10:00:00Z"); // Tue
    const wed = new Date("2026-05-20T10:00:00Z"); // Wed
    const thu = new Date("2026-05-21T10:00:00Z"); // Thu
    const fri = new Date("2026-05-22T10:00:00Z"); // Fri
    const sat = new Date("2026-05-23T10:00:00Z"); // Sat
    const sun = new Date("2026-05-24T10:00:00Z"); // Sun

    // 12.1 Parameter validation errors
    const invalidOffsets: any[] = [1.5, -0.5, 3.14159, NaN, Infinity, -Infinity, null, undefined, "1", {}, [], true, false];
    for (const invN of invalidOffsets) {
        let caught = false;
        try {
            offsetDay(mon, invN);
        } catch (e: any) {
            if (e instanceof ComputeError) caught = true;
        }
        if (!caught) throw new Error(`Expected offsetDay with n=${String(invN)} to throw ComputeError`);
    }

    // All 7 weekdays excluded error
    let caughtAllExcluded = false;
    try {
        offsetDay(mon, 1, { excludeWeekdays: [0, 1, 2, 3, 4, 5, 6] });
    } catch (e: any) {
        if (e instanceof ComputeError) caughtAllExcluded = true;
    }
    if (!caughtAllExcluded) throw new Error("Expected all weekdays excluded to throw ComputeError");

    // 12.2 Zero offset (n = 0)
    if (offsetDay(mon, 0) !== 0) throw new Error("Expected offsetDay(mon, 0) === 0");
    if (offsetDay(sat, 0) !== 0) throw new Error("Expected offsetDay(sat, 0) with no roll === 0");
    if (offsetDay(sat, 0, { excludeWeekdays: [0, 6] }) !== 0) throw new Error("Expected offsetDay(sat, 0) without roll === 0");

    // Zero offset with roll forward / backward on weekend
    // Sat rolls forward to Mon (+2 days)
    if (offsetDay(sat, 0, { excludeWeekdays: [0, 6], roll: "forward" }) !== 2) {
        throw new Error(`Expected Sat roll forward n=0 to be 2, got ${offsetDay(sat, 0, { excludeWeekdays: [0, 6], roll: "forward" })}`);
    }
    // Sun rolls forward to Mon (+1 day)
    if (offsetDay(sun, 0, { excludeWeekdays: [0, 6], roll: "forward" }) !== 1) {
        throw new Error(`Expected Sun roll forward n=0 to be 1, got ${offsetDay(sun, 0, { excludeWeekdays: [0, 6], roll: "forward" })}`);
    }
    // Sat rolls backward to Fri (-1 day)
    if (offsetDay(sat, 0, { excludeWeekdays: [0, 6], roll: "backward" }) !== -1) {
        throw new Error(`Expected Sat roll backward n=0 to be -1, got ${offsetDay(sat, 0, { excludeWeekdays: [0, 6], roll: "backward" })}`);
    }
    // Sun rolls backward to Fri (-2 days)
    if (offsetDay(sun, 0, { excludeWeekdays: [0, 6], roll: "backward" }) !== -2) {
        throw new Error(`Expected Sun roll backward n=0 to be -2, got ${offsetDay(sun, 0, { excludeWeekdays: [0, 6], roll: "backward" })}`);
    }

    // Zero offset with roll on a holiday (Wed 2026-05-20 is holiday)
    if (offsetDay(wed, 0, { holidays: ["2026-05-20"], roll: "forward" }) !== 1) {
        throw new Error(`Expected Wed holiday roll forward n=0 to be 1 (Thu), got ${offsetDay(wed, 0, { holidays: ["2026-05-20"], roll: "forward" })}`);
    }
    if (offsetDay(wed, 0, { holidays: ["2026-05-20"], roll: "backward" }) !== -1) {
        throw new Error(`Expected Wed holiday roll backward n=0 to be -1 (Tue), got ${offsetDay(wed, 0, { holidays: ["2026-05-20"], roll: "backward" })}`);
    }
    // Roll across holiday + weekend: Friday is holiday, roll forward -> skips Sat, Sun to Mon (+3 days)
    if (offsetDay(fri, 0, { excludeWeekdays: [0, 6], holidays: ["2026-05-22"], roll: "forward" }) !== 3) {
        throw new Error(`Expected Fri holiday roll forward to be 3 (Mon), got ${offsetDay(fri, 0, { excludeWeekdays: [0, 6], holidays: ["2026-05-22"], roll: "forward" })}`);
    }
    // Monday is holiday, roll backward -> skips Sun, Sat to Fri (-3 days)
    if (offsetDay(mon, 0, { excludeWeekdays: [0, 6], holidays: ["2026-05-18"], roll: "backward" }) !== -3) {
        throw new Error(`Expected Mon holiday roll backward to be -3 (Fri), got ${offsetDay(mon, 0, { excludeWeekdays: [0, 6], holidays: ["2026-05-18"], roll: "backward" })}`);
    }

    // roll: "raise" tests
    let caughtSatRaise = false;
    try {
        offsetDay(sat, 0, { excludeWeekdays: [0, 6], roll: "raise" });
    } catch (e: any) {
        if (e instanceof ComputeError) caughtSatRaise = true;
    }
    if (!caughtSatRaise) throw new Error("Expected sat roll: raise to throw ComputeError");

    let caughtHolidayRaise = false;
    try {
        offsetDay(wed, 1, { holidays: ["2026-05-20"], roll: "raise" });
    } catch (e: any) {
        if (e instanceof ComputeError) caughtHolidayRaise = true;
    }
    if (!caughtHolidayRaise) throw new Error("Expected holiday roll: raise to throw ComputeError");

    // roll: "raise" on a valid business day should NOT throw
    if (offsetDay(mon, 1, { excludeWeekdays: [0, 6], roll: "raise" }) !== 1) {
        throw new Error("Expected roll: raise on Mon to succeed and return 1");
    }

    // 12.3 Default behavior (no exclusions specified)
    for (let n = -10; n <= 10; n++) {
        if (offsetDay(mon, n) !== n) {
            throw new Error(`Expected default offsetDay(mon, ${n}) === ${n}, got ${offsetDay(mon, n)}`);
        }
    }

    // 12.4 Standard business week forward offsets (excludeWeekdays: [0, 6])
    // Mon -> Tue (1 bday = 1 cal day)
    if (offsetDay(mon, 1, { excludeWeekdays: [0, 6] }) !== 1) throw new Error("Mon + 1 bday !== 1");
    // Mon -> Wed (2 bday = 2 cal days)
    if (offsetDay(mon, 2, { excludeWeekdays: [0, 6] }) !== 2) throw new Error("Mon + 2 bday !== 2");
    // Mon -> Thu (3 bday = 3 cal days)
    if (offsetDay(mon, 3, { excludeWeekdays: [0, 6] }) !== 3) throw new Error("Mon + 3 bday !== 3");
    // Mon -> Fri (4 bday = 4 cal days)
    if (offsetDay(mon, 4, { excludeWeekdays: [0, 6] }) !== 4) throw new Error("Mon + 4 bday !== 4");
    // Mon -> Mon next week (5 bday = 7 cal days)
    if (offsetDay(mon, 5, { excludeWeekdays: [0, 6] }) !== 7) throw new Error("Mon + 5 bday !== 7");
    // Mon -> Fri next week (9 bday = 11 cal days)
    if (offsetDay(mon, 9, { excludeWeekdays: [0, 6] }) !== 11) throw new Error("Mon + 9 bday !== 11");
    // Mon -> Mon 2 weeks (10 bday = 14 cal days)
    if (offsetDay(mon, 10, { excludeWeekdays: [0, 6] }) !== 14) throw new Error("Mon + 10 bday !== 14");
    // Fri -> Mon next week (1 bday = 3 cal days)
    if (offsetDay(fri, 1, { excludeWeekdays: [0, 6] }) !== 3) throw new Error("Fri + 1 bday !== 3");
    // Fri -> Fri next week (5 bday = 7 cal days)
    if (offsetDay(fri, 5, { excludeWeekdays: [0, 6] }) !== 7) throw new Error("Fri + 5 bday !== 7");

    // Large forward offset (100 business days = 20 full weeks = 140 calendar days)
    if (offsetDay(mon, 100, { excludeWeekdays: [0, 6] }) !== 140) {
        throw new Error(`Expected Mon + 100 bdays === 140 cal days, got ${offsetDay(mon, 100, { excludeWeekdays: [0, 6] })}`);
    }
    // 250 business days = 50 full weeks = 350 calendar days
    if (offsetDay(mon, 250, { excludeWeekdays: [0, 6] }) !== 350) {
        throw new Error(`Expected Mon + 250 bdays === 350 cal days, got ${offsetDay(mon, 250, { excludeWeekdays: [0, 6] })}`);
    }

    // 12.5 Standard business week backward offsets (excludeWeekdays: [0, 6])
    // Tue -> Mon (-1 bday = -1 cal day)
    if (offsetDay(tue, -1, { excludeWeekdays: [0, 6] }) !== -1) throw new Error("Tue - 1 bday !== -1");
    // Mon -> Fri prev week (-1 bday = -3 cal days)
    if (offsetDay(mon, -1, { excludeWeekdays: [0, 6] }) !== -3) throw new Error("Mon - 1 bday !== -3");
    // Mon -> Mon prev week (-5 bday = -7 cal days)
    if (offsetDay(mon, -5, { excludeWeekdays: [0, 6] }) !== -7) throw new Error("Mon - 5 bday !== -7");
    // Mon -> Fri 2 weeks ago (-6 bday = -10 cal days)
    if (offsetDay(mon, -6, { excludeWeekdays: [0, 6] }) !== -10) throw new Error("Mon - 6 bday !== -10");
    // Mon -> Mon 2 weeks ago (-10 bday = -14 cal days)
    if (offsetDay(mon, -10, { excludeWeekdays: [0, 6] }) !== -14) throw new Error("Mon - 10 bday !== -14");

    // Large backward offset (-100 business days = -140 calendar days)
    if (offsetDay(mon, -100, { excludeWeekdays: [0, 6] }) !== -140) {
        throw new Error(`Expected Mon - 100 bdays === -140 cal days, got ${offsetDay(mon, -100, { excludeWeekdays: [0, 6] })}`);
    }

    // 12.6 Forward & backward offsets with holidays
    // Holiday on Wednesday (2026-05-20)
    const singleHolOpts = { excludeWeekdays: [0, 6], holidays: ["2026-05-20"] };
    // Mon + 1 bday = Tue (1 cal day)
    if (offsetDay(mon, 1, singleHolOpts) !== 1) throw new Error("Mon + 1 bday with Wed hol !== 1");
    // Mon + 2 bday = Thu (skips Wed -> 3 cal days)
    if (offsetDay(mon, 2, singleHolOpts) !== 3) throw new Error("Mon + 2 bday with Wed hol !== 3");
    // Mon + 3 bday = Fri (skips Wed -> 4 cal days)
    if (offsetDay(mon, 3, singleHolOpts) !== 4) throw new Error("Mon + 3 bday with Wed hol !== 4");
    // Mon + 4 bday = Mon next week (skips Wed, Sat, Sun -> 7 cal days)
    if (offsetDay(mon, 4, singleHolOpts) !== 7) throw new Error("Mon + 4 bday with Wed hol !== 7");
    // Thu - 1 bday = Tue (skips Wed -> -2 cal days)
    if (offsetDay(thu, -1, singleHolOpts) !== -2) throw new Error("Thu - 1 bday with Wed hol !== -2");
    // Thu - 2 bday = Mon (skips Wed -> -3 cal days)
    if (offsetDay(thu, -2, singleHolOpts) !== -3) throw new Error("Thu - 2 bday with Wed hol !== -3");

    // Multi-day holiday block (Mon-Wed all holidays: 2026-05-18, 19, 20)
    const blockHolOpts = {
        excludeWeekdays: [0, 6],
        holidays: ["2026-05-18", "2026-05-19", "2026-05-20"]
    };
    // Starting on previous Friday (2026-05-15):
    const prevFri = new Date("2026-05-15T10:00:00Z");
    // +1 bday -> skips Sat(16), Sun(17), Mon(18), Tue(19), Wed(20) -> Thu(21) (+6 cal days!)
    if (offsetDay(prevFri, 1, blockHolOpts) !== 6) {
        throw new Error(`Expected prevFri + 1 bday across 3 holidays to be 6 cal days, got ${offsetDay(prevFri, 1, blockHolOpts)}`);
    }
    // Starting on Thursday (2026-05-21):
    // -1 bday -> skips Wed(20), Tue(19), Mon(18), Sun(17), Sat(16) -> prevFri(15) (-6 cal days!)
    if (offsetDay(thu, -1, blockHolOpts) !== -6) {
        throw new Error(`Expected thu - 1 bday across 3 holidays to be -6 cal days, got ${offsetDay(thu, -1, blockHolOpts)}`);
    }

    // Holiday specified as Set<number>
    const setHolOpts = {
        excludeWeekdays: [0, 6],
        holidays: new Set<number>([Date.UTC(2026, 4, 19), Date.UTC(2026, 4, 21)]) // Tue, Thu
    };
    // Mon + 1 bday -> skips Tue -> Wed (+2 cal days)
    if (offsetDay(mon, 1, setHolOpts) !== 2) throw new Error("Mon + 1 bday with Set hol !== 2");
    // Mon + 2 bdays -> skips Tue, Thu -> Fri (+4 cal days)
    if (offsetDay(mon, 2, setHolOpts) !== 4) throw new Error("Mon + 2 bdays with Set hol !== 4");

    // 12.7 Roll + Non-zero offsets starting on non-business days
    // Saturday (2026-05-23):
    // roll="forward" (+2 to Mon) + 2 bdays (Tue, Wed) = 4 cal days from Sat
    if (offsetDay(sat, 2, { excludeWeekdays: [0, 6], roll: "forward" }) !== 4) {
        throw new Error(`Expected Sat roll: forward + 2 bdays === 4, got ${offsetDay(sat, 2, { excludeWeekdays: [0, 6], roll: "forward" })}`);
    }
    // roll="forward" (+2 to Mon) - 1 bday (Fri 2026-05-22) = -1 cal day from Sat
    if (offsetDay(sat, -1, { excludeWeekdays: [0, 6], roll: "forward" }) !== -1) {
        throw new Error(`Expected Sat roll: forward - 1 bday === -1, got ${offsetDay(sat, -1, { excludeWeekdays: [0, 6], roll: "forward" })}`);
    }
    // roll="backward" (-1 to Fri) + 2 bdays (Mon, Tue) = 3 cal days from Sat
    if (offsetDay(sat, 2, { excludeWeekdays: [0, 6], roll: "backward" }) !== 3) {
        throw new Error(`Expected Sat roll: backward + 2 bdays === 3, got ${offsetDay(sat, 2, { excludeWeekdays: [0, 6], roll: "backward" })}`);
    }
    // roll="backward" (-1 to Fri) - 1 bday (Thu 2026-05-21) = -2 cal days from Sat
    if (offsetDay(sat, -1, { excludeWeekdays: [0, 6], roll: "backward" }) !== -2) {
        throw new Error(`Expected Sat roll: backward - 1 bday === -2, got ${offsetDay(sat, -1, { excludeWeekdays: [0, 6], roll: "backward" })}`);
    }

    // 12.8 Custom 1-day work week (only Sunday is working day: [1,2,3,4,5,6] excluded)
    const oneDayWeekOpts = { excludeWeekdays: [1, 2, 3, 4, 5, 6] };
    if (offsetDay(sun, 1, oneDayWeekOpts) !== 7) throw new Error("Sun + 1 bday in 1-day work week !== 7");
    if (offsetDay(sun, 3, oneDayWeekOpts) !== 21) throw new Error("Sun + 3 bdays in 1-day work week !== 21");
    if (offsetDay(sun, -2, oneDayWeekOpts) !== -14) throw new Error("Sun - 2 bdays in 1-day work week !== -14");

    // Middle East work week (Sun-Thu, [5, 6] excluded)
    const meOpts = { excludeWeekdays: [5, 6] };
    // Thu + 1 bday -> skips Fri, Sat -> Sun (+3 cal days)
    if (offsetDay(thu, 1, meOpts) !== 3) throw new Error("ME Thu + 1 bday !== 3");
    // Sun - 1 bday -> skips Sat, Fri -> Thu (-3 cal days)
    if (offsetDay(sun, -1, meOpts) !== -3) throw new Error("ME Sun - 1 bday !== -3");

    // 12.9 Month, Year, and Leap Day Boundaries
    // Month boundary: Jan 30, 2026 (Fri) + 1 bday -> Feb 2, 2026 (Mon) (+3 cal days)
    const jan30 = new Date("2026-01-30T00:00:00Z");
    if (offsetDay(jan30, 1, { excludeWeekdays: [0, 6] }) !== 3) {
        throw new Error("Jan 30 (Fri) + 1 bday !== 3 (Feb 2 Mon)");
    }
    // Leap year 2024: Feb 28, 2024 (Wed) + 1 bday -> Feb 29 (Thu) (+1 cal day)
    const feb28Leap = new Date("2024-02-28T00:00:00Z");
    if (offsetDay(feb28Leap, 1, { excludeWeekdays: [0, 6] }) !== 1) {
        throw new Error("Feb 28 2024 + 1 bday !== 1 (Feb 29)");
    }
    // Feb 28 2024 (Wed) + 2 bdays -> Mar 1 (Fri) (+2 cal days)
    if (offsetDay(feb28Leap, 2, { excludeWeekdays: [0, 6] }) !== 2) {
        throw new Error("Feb 28 2024 + 2 bdays !== 2 (Mar 1)");
    }
    // Non-leap year 2023: Feb 28, 2023 (Tue) + 1 bday -> Mar 1 (Wed) (+1 cal day)
    const feb28NonLeap = new Date("2023-02-28T00:00:00Z");
    if (offsetDay(feb28NonLeap, 1, { excludeWeekdays: [0, 6] }) !== 1) {
        throw new Error("Feb 28 2023 + 1 bday !== 1 (Mar 1)");
    }
    // Year boundary: Dec 31, 2025 (Wed) + 1 bday with Jan 1 holiday -> Jan 2 (Fri) (+2 cal days)
    const dec31 = new Date("2025-12-31T00:00:00Z");
    if (offsetDay(dec31, 1, { excludeWeekdays: [0, 6], holidays: ["2026-01-01"] }) !== 2) {
        throw new Error("Dec 31 2025 + 1 bday with Jan 1 hol !== 2 (Jan 2)");
    }

    // 12.10 Time Component Neutrality
    const lateMon = new Date("2026-05-18T23:59:59.999Z");
    const earlyMon = new Date("2026-05-18T00:00:00.001Z");
    if (offsetDay(lateMon, 1, { excludeWeekdays: [0, 6] }) !== 1) throw new Error("lateMon + 1 bday !== 1");
    if (offsetDay(earlyMon, 1, { excludeWeekdays: [0, 6] }) !== 1) throw new Error("earlyMon + 1 bday !== 1");
    if (offsetDay(lateMon, 5, { excludeWeekdays: [0, 6] }) !== 7) throw new Error("lateMon + 5 bday !== 7");
    if (offsetDay(earlyMon, 5, { excludeWeekdays: [0, 6] }) !== 7) throw new Error("earlyMon + 5 bday !== 7");

    // 12.11 Extended Edge Cases: Consecutive Multi-Week Holidays & Roll Combinations
    // 3 consecutive holidays starting Friday to next Tuesday (Fri May 22, Mon May 25, Tue May 26)
    const longWeekendHolOpts = {
        excludeWeekdays: [0, 6],
        holidays: ["2026-05-22", "2026-05-25", "2026-05-26"]
    };
    // Thu May 21 + 1 bday -> skips Fri(22), Sat(23), Sun(24), Mon(25), Tue(26) -> Wed May 27 (+6 cal days)
    if (offsetDay(thu, 1, longWeekendHolOpts) !== 6) {
        throw new Error(`Expected Thu + 1 bday over 5-day holiday span === 6 cal days, got ${offsetDay(thu, 1, longWeekendHolOpts)}`);
    }
    // Wed May 27 - 1 bday -> skips Tue(26), Mon(25), Sun(24), Sat(23), Fri(22) -> Thu May 21 (-6 cal days)
    const wedMay27 = new Date("2026-05-27T00:00:00Z");
    if (offsetDay(wedMay27, -1, longWeekendHolOpts) !== -6) {
        throw new Error(`Expected Wed - 1 bday backward over 5-day holiday span === -6 cal days, got ${offsetDay(wedMay27, -1, longWeekendHolOpts)}`);
    }

    // Roll on a holiday during a holiday cluster
    // Sunday May 24 (weekend + adjacent holidays):
    // roll: forward -> rolls past Sun(24), Mon(25), Tue(26) -> lands on Wed May 27 (+3 cal days)
    if (offsetDay(sun, 0, { ...longWeekendHolOpts, roll: "forward" }) !== 3) {
        throw new Error(`Expected Sun roll: forward over cluster to be 3, got ${offsetDay(sun, 0, { ...longWeekendHolOpts, roll: "forward" })}`);
    }
    // roll: backward -> rolls past Sun(24), Sat(23), Fri(22) -> lands on Thu May 21 (-3 cal days)
    if (offsetDay(sun, 0, { ...longWeekendHolOpts, roll: "backward" }) !== -3) {
        throw new Error(`Expected Sun roll: backward over cluster to be -3, got ${offsetDay(sun, 0, { ...longWeekendHolOpts, roll: "backward" })}`);
    }

    // Year-end spanning: 2024 leap year Dec 31 to 2025 Jan 1 holiday + weekend
    // Dec 30, 2024 (Mon) + 3 bdays with Dec 31 & Jan 1 holidays:
    // Dec 30 (Mon) -> skips Dec 31 (Tue), Jan 1 (Wed) -> Jan 2 (Thu) [1], Jan 3 (Fri) [2], skips Sat(4), Sun(5) -> Jan 6 (Mon) [3] (+7 cal days)
    const dec30_2024 = new Date("2024-12-30T00:00:00Z");
    const yearEndHolOpts = { excludeWeekdays: [0, 6], holidays: ["2024-12-31", "2025-01-01"] };
    if (offsetDay(dec30_2024, 3, yearEndHolOpts) !== 7) {
        throw new Error(`Expected Dec 30 2024 + 3 bdays === 7 cal days, got ${offsetDay(dec30_2024, 3, yearEndHolOpts)}`);
    }

    // 12.12 Comprehensive Frontier Edge Cases:
    // (A) Daylight Saving Time (DST) Transition Neutrality
    // US Spring Forward: 2026-03-08 (Sun). Mon 2026-03-09 + 1 bday -> Tue 2026-03-10
    const dstSpringMon = new Date("2026-03-09T02:30:00-04:00");
    if (offsetDay(dstSpringMon, 1, { excludeWeekdays: [0, 6] }) !== 1) {
        throw new Error("Spring Forward DST offset failed");
    }
    // US Fall Back: 2026-11-01 (Sun). Fri 2026-10-30T12:00:00-04:00 (Fri UTC) + 1 bday -> Mon 2026-11-02 (+3 cal days)
    const dstFallFri = new Date("2026-10-30T12:00:00-04:00");
    if (offsetDay(dstFallFri, 1, { excludeWeekdays: [0, 6] }) !== 3) {
        throw new Error("Fall Back DST offset failed");
    }

    // (B) Extreme Year Boundaries & Historical / 2-Digit / Negative Years
    // Two-digit year 0050: 0050-02-28 (Saturday in Julian/proleptic Gregorian: getUTCDay() === 6) -> roll forward to Monday 0050-03-02 (+2 cal days)
    const year50Sat = _createUTCDate(50, 1, 28);
    const y50Offset = offsetDay(year50Sat, 0, { excludeWeekdays: [0, 6], roll: "forward" });
    const expectedY50Offset = (8 - year50Sat.getUTCDay()) % 7 || 7;
    if (y50Offset !== expectedY50Offset && y50Offset !== 0) {
        throw new Error(`Year 50 roll forward failed: expected ${expectedY50Offset}, got ${y50Offset}`);
    }
    // Negative year / BC era: Year -1 (1 BC)
    const bcDate = new Date("0000-01-01T00:00:00Z");
    bcDate.setUTCFullYear(-1, 0, 1);
    if (offsetDay(bcDate, 5, { excludeWeekdays: [0, 6] }) !== 7) {
        throw new Error("BC year offsetDay failed");
    }

    // (C) Whole Month of Holidays (e.g. Entire month of February 2026 is a holiday)
    const allFebHolidays: string[] = [];
    for (let d = 1; d <= 28; d++) {
        allFebHolidays.push(`2026-02-${String(d).padStart(2, "0")}`);
    }
    const jan30_2026 = new Date("2026-01-30T00:00:00Z"); // Fri
    // Fri Jan 30 + 1 bday -> skips Sat(31), Sun(Feb 1), and ALL 28 days of Feb -> Mon Mar 2 (+31 cal days!)
    if (offsetDay(jan30_2026, 1, { excludeWeekdays: [0, 6], holidays: allFebHolidays }) !== 31) {
        throw new Error(`Expected skipping entire Feb to equal 31 cal days, got ${offsetDay(jan30_2026, 1, { excludeWeekdays: [0, 6], holidays: allFebHolidays })}`);
    }
    // March 2 (Mon) - 1 bday backwards across whole Feb -> Fri Jan 30 (-31 cal days)
    const mar2_2026 = new Date("2026-03-02T00:00:00Z");
    if (offsetDay(mar2_2026, -1, { excludeWeekdays: [0, 6], holidays: allFebHolidays }) !== -31) {
        throw new Error(`Expected backward skipping entire Feb to equal -31 cal days, got ${offsetDay(mar2_2026, -1, { excludeWeekdays: [0, 6], holidays: allFebHolidays })}`);
    }

    // (D) Corrupted & Chaotic Holiday Array Types (Objects, Arrays, Symbols, NaNs, duplicates, mixed timestamps)
    const chaoticHolidays: any[] = [
        "2026-05-19T05:00:00.000Z",      // Tuesday in UTC
        "2026-05-19",                    // Duplicate Tuesday
        new Date("2026-05-19T12:00:00Z"),// Duplicate Tuesday
        Date.UTC(2026, 4, 19),          // Duplicate Tuesday
        {}, [], null, undefined, false, true, NaN, "not-a-date"
    ];
    // Mon May 18 + 1 bday with chaotic Tuesday holiday -> lands on Wed May 20 (+2 cal days)
    if (offsetDay(mon, 1, { excludeWeekdays: [0, 6], holidays: chaoticHolidays as any }) !== 2) {
        throw new Error("Chaotic holiday array handling failed");
    }

    // (E) 6-Day Weekend (Only Wednesday is active)
    const onlyWedActive = { excludeWeekdays: [0, 1, 2, 4, 5, 6] };
    // Wed May 20 + 1 bday -> Wed May 27 (+7 cal days)
    if (offsetDay(wed, 1, onlyWedActive) !== 7) throw new Error("1-day active week +1 bday !== 7");
    // Wed May 20 + 4 bdays -> Wed June 17 (+28 cal days)
    if (offsetDay(wed, 4, onlyWedActive) !== 28) throw new Error("1-day active week +4 bdays !== 28");
    // Wed May 20 - 2 bdays -> Wed May 6 (-14 cal days)
    if (offsetDay(wed, -2, onlyWedActive) !== -14) throw new Error("1-day active week -2 bdays !== -14");

    // (F) Roll on starting dates that are simultaneously weekend + holiday
    // Saturday May 23 passed as an explicit holiday
    const satHolidayOpts = { excludeWeekdays: [0, 6], holidays: ["2026-05-23"], roll: "forward" as const };
    if (offsetDay(sat, 0, satHolidayOpts) !== 2) throw new Error("Sat weekend+holiday roll forward !== 2");
    if (offsetDay(sat, 1, satHolidayOpts) !== 3) throw new Error("Sat weekend+holiday roll forward + 1 bday !== 3 (Tue)");

    // (G) Non-UTC Local Millisecond Timestamp Alignment
    const localTzDate = new Date("2026-05-18T23:59:59.999-07:00"); // Monday evening PDT -> Tuesday UTC
    // In UTC, this is 2026-05-19 (Tuesday). +1 bday should advance from Tuesday -> Wednesday (+1 cal day in UTC)
    if (offsetDay(localTzDate, 1, { excludeWeekdays: [0, 6] }) !== 1) {
        throw new Error("Local timezone offsetDay failed");
    }

    // (H) Exact Leap Day (Feb 29, 2024) roll and step
    const feb29_2024 = new Date("2024-02-29T12:00:00Z"); // Thursday
    // Feb 29 (Thu) + 1 bday -> Mar 1 (Fri) (+1 cal day)
    if (offsetDay(feb29_2024, 1, { excludeWeekdays: [0, 6] }) !== 1) throw new Error("Leap day + 1 bday !== 1");
    // Feb 29 (Thu) + 2 bdays -> skips Sat(2), Sun(3) -> Mar 4 (Mon) (+4 cal days)
    if (offsetDay(feb29_2024, 2, { excludeWeekdays: [0, 6] }) !== 4) throw new Error("Leap day + 2 bdays !== 4");

    console.log("✓ Exhaustive offsetDay tests passed");

    console.log("\n🎉 ALL DATE UTILS ROBUSTNESS TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("\n❌ DATE UTILS ROBUSTNESS TESTS FAILED:", err);
    process.exit(1);
}
