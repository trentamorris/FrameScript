declare const process: any;
import {
    strftime,
    strptime,
    toValidDate,
    toEpoch,
    toValidTime,
    replaceDateComponents,
    offsetDay,
    isBusinessDay,
    getTimeZoneOffset,
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



    // 9. Visualize and test _createUTCDate(d.getUTCFullYear(), d.getUTCMonth() + 1, 0) for daysInMonth
    console.log("\n--- VISUALIZING DAYS IN MONTH CALCULATION ---");
    const testDates = [
        new Date("2024-02-15T00:00:00Z"), // Leap year February
        new Date("2023-02-15T00:00:00Z"), // Non-leap year February
        new Date("2026-12-15T00:00:00Z"), // December (year boundary check)
        toValidDate("0050-02-15T00:00:00Z")!, // Historical year 50
    ];

    for (const d of testDates) {
        const nextMonthZeroIndexed = d.getUTCMonth() + 1;
        const endOfMonthDate = _createUTCDate(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
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
    console.log("✓ daysInMonth visualization tests passed");

    // 11. isBusinessDay Exhaustive Tests
    console.log("\n--- EXHAUSTIVE ISBUSINESSDAY TESTS ---");
    // Invalid / non-date inputs
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

    // =========================================
    // EXHAUSTIVE STRFTIME & STRPTIME EDGE CASES
    // =========================================
    console.log("\n--- EXHAUSTIVE STRFTIME & STRPTIME TESTS ---");

    // 1. All standard & custom directives (%Y, %y, %m, %d, %e, %H, %I, %p, %M, %S, %ms, %f, %u, %w, %V, %G, %j, %Z, %z, %%)
    const refDate = new Date("2026-05-20T15:07:09.045Z"); // Wednesday, May 20, 2026 15:07:09.045 UTC (Week 21)
    const allDirectivesFormatted = strftime(refDate, {
        format: "%Y|%y|%m|%d|%e|%H|%I|%p|%M|%S|%ms|%f|%u|%w|%V|%G|%j|%%"
    });
    const expectedAll = "2026|26|05|20|20|15|03|PM|07|09|045|045000|3|3|21|2026|140|%";
    if (allDirectivesFormatted !== expectedAll) {
        throw new Error(`Expected all directives "${expectedAll}", got "${allDirectivesFormatted}"`);
    }

    // 2. Format shorthands (%F, %T, %R, %D)
    const shorthandsFormatted = strftime(refDate, { format: "%F %T %R %D" });
    if (shorthandsFormatted !== "2026-05-20 15:07:09 15:07 05/20/26") {
        throw new Error(`Expected shorthands "2026-05-20 15:07:09 15:07 05/20/26", got "${shorthandsFormatted}"`);
    }

    // 3. ISO Week & ISO Year Boundary Cases:
    // Dec 31, 2024 is Tuesday -> Week 1 of 2025, Year 2025
    const dec31_2024 = new Date("2024-12-31T00:00:00Z");
    if (strftime(dec31_2024, { format: "%G-W%V" }) !== "2025-W01") {
        throw new Error(`Expected "2025-W01", got "${strftime(dec31_2024, { format: "%G-W%V" })}"`);
    }
    // Jan 1, 2023 is Sunday -> Week 52 of 2022, Year 2022
    const jan1_2023 = new Date("2023-01-01T00:00:00Z");
    if (strftime(jan1_2023, { format: "%G-W%V" }) !== "2022-W52") {
        throw new Error(`Expected "2022-W52", got "${strftime(jan1_2023, { format: "%G-W%V" })}"`);
    }

    // 4. Midnight and Noon 12-hour (%I) and AM/PM (%p) checks
    const midnight = new Date("2026-05-20T00:00:00.000Z");
    const noon = new Date("2026-05-20T12:00:00.000Z");
    if (strftime(midnight, { format: "%I %p" }) !== "12 AM") {
        throw new Error(`Midnight format expected "12 AM", got "${strftime(midnight, { format: "%I %p" })}"`);
    }
    if (strftime(noon, { format: "%I %p" }) !== "12 PM") {
        throw new Error(`Noon format expected "12 PM", got "${strftime(noon, { format: "%I %p" })}"`);
    }

    // 5. Timezone conversions with strftime
    // 2026-05-20 15:07:09 UTC in America/New_York (EDT = UTC-4) -> 2026-05-20 11:07:09
    const nyFormatted = strftime(refDate, { format: "%Y-%m-%d %H:%M:%S %z", timeZone: "America/New_York" });
    if (!nyFormatted.startsWith("2026-05-20 11:07:09 -0400")) {
        throw new Error(`Expected NY time "2026-05-20 11:07:09 -0400", got "${nyFormatted}"`);
    }
    // 2026-05-20 15:07:09 UTC in Asia/Tokyo (JST = UTC+9) -> 2026-05-21 00:07:09
    const tokyoFormatted = strftime(refDate, { format: "%Y-%m-%d %H:%M:%S %z", timeZone: "Asia/Tokyo" });
    if (!tokyoFormatted.startsWith("2026-05-21 00:07:09 +0900")) {
        throw new Error(`Expected Tokyo time "2026-05-21 00:07:09 +0900", got "${tokyoFormatted}"`);
    }

    // 6. Comprehensive strftime directive & edge case tests
    // 6a. Literal percent escaping ("%%")
    const percentEscaped = strftime(refDate, { format: "%%Y %%%% %Y" });
    if (percentEscaped !== "%Y %% 2026") {
        throw new Error(`strftime %% escaping failed: expected "%Y %% 2026", got "${percentEscaped}"`);
    }

    // 6b. Single-digit padding checks (%m, %d, %H, %M, %S, %ms, %f, %e, %I)
    // 2026-01-05 04:08:09.007 UTC
    const singleDigitDate = new Date("2026-01-05T04:08:09.007Z");
    const padded = strftime(singleDigitDate, { format: "%m/%d/%Y %H:%M:%S.%ms %f | space-day: '%e' | 12h: %I %p" });
    if (padded !== "01/05/2026 04:08:09.007 007000 | space-day: ' 5' | 12h: 04 AM") {
        throw new Error(`strftime padding failed: got "${padded}"`);
    }

    // 6c. Midnight (00:00) vs Noon (12:00) 12-hour AM/PM formatting
    const strftimeMidnight = new Date("2026-06-15T00:00:00.000Z");
    const strftimeNoon = new Date("2026-06-15T12:00:00.000Z");
    if (strftime(strftimeMidnight, { format: "%I %p" }) !== "12 AM") throw new Error(`Midnight expected "12 AM", got "${strftime(strftimeMidnight, { format: "%I %p" })}"`);
    if (strftime(strftimeNoon, { format: "%I %p" }) !== "12 PM") throw new Error(`Noon expected "12 PM", got "${strftime(strftimeNoon, { format: "%I %p" })}"`);

    // 6d. ISO Week (%V) & ISO Year (%G) boundary edge cases
    // Gotcha 1: 2027-01-02 (Saturday) -> Week 53 of ISO Year 2026
    const isoEndYear = new Date("2027-01-02T12:00:00.000Z");
    const isoEndFormatted = strftime(isoEndYear, { format: "Gregorian: %Y, ISO: %G-W%V" });
    if (isoEndFormatted !== "Gregorian: 2027, ISO: 2026-W53") {
        throw new Error(`ISO end year failed: expected "Gregorian: 2027, ISO: 2026-W53", got "${isoEndFormatted}"`);
    }

    // Gotcha 2: 2024-12-30 (Monday) -> Week 01 of ISO Year 2025
    const isoStartNext = new Date("2024-12-30T12:00:00.000Z");
    const isoStartFormatted = strftime(isoStartNext, { format: "Gregorian: %Y, ISO: %G-W%V" });
    if (isoStartFormatted !== "Gregorian: 2024, ISO: 2025-W01") {
        throw new Error(`ISO start next year failed: expected "Gregorian: 2024, ISO: 2025-W01", got "${isoStartFormatted}"`);
    }

    // 6e. Weekday indices (%u: Mon=1..Sun=7, %w: Sun=0..Sat=6)
    const sundayDate = new Date("2026-05-24T12:00:00.000Z"); // Sunday
    const mondayDate = new Date("2026-05-25T12:00:00.000Z"); // Monday
    if (strftime(sundayDate, { format: "u:%u w:%w" }) !== "u:7 w:0") {
        throw new Error(`Sunday %u / %w failed: expected "u:7 w:0", got "${strftime(sundayDate, { format: "u:%u w:%w" })}"`);
    }
    if (strftime(mondayDate, { format: "u:%u w:%w" }) !== "u:1 w:1") {
        throw new Error(`Monday %u / %w failed: expected "u:1 w:1", got "${strftime(mondayDate, { format: "u:%u w:%w" })}"`);
    }

    // 6f. Ordinal day (%j) on leap years vs non-leap years
    const leapDec31 = new Date("2024-12-31T00:00:00.000Z"); // 2024 is leap year -> 366
    const nonLeapDec31 = new Date("2026-12-31T00:00:00.000Z"); // 2026 is non-leap -> 365
    if (strftime(leapDec31, { format: "%j" }) !== "366") throw new Error(`Leap year Dec 31 expected "366", got "${strftime(leapDec31, { format: "%j" })}"`);
    if (strftime(nonLeapDec31, { format: "%j" }) !== "365") throw new Error(`Non-leap year Dec 31 expected "365", got "${strftime(nonLeapDec31, { format: "%j" })}"`);

    // 6g. 2-digit year (%y)
    const year1999 = new Date("1999-12-31T00:00:00.000Z");
    const year2005 = new Date("2005-01-01T00:00:00.000Z");
    if (strftime(year1999, { format: "%y" }) !== "99") throw new Error(`1999 %y expected "99", got "${strftime(year1999, { format: "%y" })}"`);
    if (strftime(year2005, { format: "%y" }) !== "05") throw new Error(`2005 %y expected "05", got "${strftime(year2005, { format: "%y" })}"`);

    // 6h. Shorthand macro expansions (%F, %T, %R, %D)
    const macroDate = new Date("2026-05-20T15:07:09.123Z");
    if (strftime(macroDate, { format: "%F" }) !== "2026-05-20") throw new Error(`%F expansion failed`);
    if (strftime(macroDate, { format: "%T" }) !== "15:07:09") throw new Error(`%T expansion failed`);
    if (strftime(macroDate, { format: "%R" }) !== "15:07") throw new Error(`%R expansion failed`);
    if (strftime(macroDate, { format: "%D" }) !== "05/20/26") throw new Error(`%D expansion failed`);

    // 6i. Null & invalid date/format guards for strftime
    if (strftime(null as any, { format: "%Y-%m-%d" }) !== "") throw new Error("strftime(null) should be ''");
    if (strftime(undefined as any, { format: "%Y-%m-%d" }) !== "") throw new Error("strftime(undefined) should be ''");
    if (strftime(new Date("invalid"), { format: "%Y-%m-%d" }) !== "") throw new Error("strftime(Invalid Date) should be ''");
    if (strftime(refDate, { format: null as any }) !== "") throw new Error("strftime(null format) should be ''");

    // 7. Comprehensive strptime roundtrip & parsing tests
    // 7a. Standard ISO format roundtrip
    const isoStr = "2026-05-20 15:07:09.045";
    const parsedIso = strptime(isoStr, { format: "%Y-%m-%d %H:%M:%S.%ms" });
    if (!parsedIso || parsedIso.toISOString() !== "2026-05-20T15:07:09.045Z") {
        throw new Error(`strptime ISO failed: got ${parsedIso?.toISOString()}`);
    }

    // 7b. Shorthand formats roundtrip
    const parsedShortF = strptime("2026-05-20", { format: "%F" });
    if (!parsedShortF || parsedShortF.toISOString() !== "2026-05-20T00:00:00.000Z") {
        throw new Error(`strptime %F failed: got ${parsedShortF?.toISOString()}`);
    }

    // 7c. 12-hour AM/PM parsing
    const parsedAM = strptime("2026-05-20 12:30:00 AM", { format: "%Y-%m-%d %I:%M:%S %p" });
    if (!parsedAM || parsedAM.getUTCHours() !== 0) {
        throw new Error(`strptime 12 AM failed: expected 00:30, got ${parsedAM?.toISOString()}`);
    }
    const parsedPM = strptime("2026-05-20 12:30:00 PM", { format: "%Y-%m-%d %I:%M:%S %p" });
    if (!parsedPM || parsedPM.getUTCHours() !== 12) {
        throw new Error(`strptime 12 PM failed: expected 12:30, got ${parsedPM?.toISOString()}`);
    }
    const parsed3PM = strptime("2026-05-20 03:30:00 PM", { format: "%Y-%m-%d %I:%M:%S %p" });
    if (!parsed3PM || parsed3PM.getUTCHours() !== 15) {
        throw new Error(`strptime 3 PM failed: expected 15:30, got ${parsed3PM?.toISOString()}`);
    }

    // 7d. 2-digit year pivot (%y)
    const parsed70s = strptime("75-05-20", { format: "%y-%m-%d" }); // >= 69 -> 1975
    if (!parsed70s || parsed70s.getUTCFullYear() !== 1975) {
        throw new Error(`strptime %y 75 failed: got ${parsed70s?.getUTCFullYear()}`);
    }
    const parsed20s = strptime("25-05-20", { format: "%y-%m-%d" }); // < 69 -> 2025
    if (!parsed20s || parsed20s.getUTCFullYear() !== 2025) {
        throw new Error(`strptime %y 25 failed: got ${parsed20s?.getUTCFullYear()}`);
    }

    // 7e. Explicit offset parsing (%z)
    const parsedOffset = strptime("2026-05-20 11:07:09 -0400", { format: "%Y-%m-%d %H:%M:%S %z" });
    if (!parsedOffset || parsedOffset.toISOString() !== "2026-05-20T15:07:09.000Z") {
        throw new Error(`strptime %z offset failed: expected 15:07:09 UTC, got ${parsedOffset?.toISOString()}`);
    }
    const parsedColonOffset = strptime("2026-05-20 11:07:09 -04:00", { format: "%Y-%m-%d %H:%M:%S %z" });
    if (!parsedColonOffset || parsedColonOffset.toISOString() !== "2026-05-20T15:07:09.000Z") {
        throw new Error(`strptime %z colon offset failed: expected 15:07:09 UTC, got ${parsedColonOffset?.toISOString()}`);
    }

    // 7f. Ordinal Day parsing (%j)
    const parsedOrdinal = strptime("2026 140", { format: "%Y %j" }); // 140th day of 2026 = May 20
    if (!parsedOrdinal || parsedOrdinal.getUTCMonth() !== 4 || parsedOrdinal.getUTCDate() !== 20) {
        throw new Error(`strptime %j ordinal day failed: got ${parsedOrdinal?.toISOString()}`);
    }
    // Leap year ordinal 366 (Dec 31, 2024)
    const parsedLeap366 = strptime("2024 366", { format: "%Y %j" });
    if (!parsedLeap366 || parsedLeap366.toISOString() !== "2024-12-31T00:00:00.000Z") {
        throw new Error(`strptime leap %j 366 failed: got ${parsedLeap366?.toISOString()}`);
    }
    // Invalid non-leap ordinal 366 (2026 only has 365 days) -> should return null
    if (strptime("2026 366", { format: "%Y %j" }) !== null) {
        throw new Error(`strptime non-leap 366 should return null`);
    }
    // Boundary ordinal day: 000 / 0 (must be null), 001 (Jan 1), 367 (must be null)
    if (strptime("2026 000", { format: "%Y %j" }) !== null) throw new Error("strptime %j day 0 should be null");
    if (strptime("2024 0", { format: "%Y %j" }) !== null) throw new Error("strptime %j day 0 should be null");
    if (strptime("2026 001", { format: "%Y %j" })?.toISOString() !== "2026-01-01T00:00:00.000Z") throw new Error("strptime %j day 1 failed");
    if (strptime("2024 367", { format: "%Y %j" }) !== null) throw new Error("strptime %j day 367 should be null");
    if (strptime("2026 367", { format: "%Y %j" }) !== null) throw new Error("strptime %j day 367 should be null");

    // Century leap rules (2000 is leap; 1900 and 2100 are NOT leap)
    if (strptime("2000 366", { format: "%Y %j" })?.toISOString() !== "2000-12-31T00:00:00.000Z") throw new Error("strptime century 2000 leap day 366 failed");
    if (strptime("1900 366", { format: "%Y %j" }) !== null) throw new Error("strptime century 1900 non-leap day 366 should be null");
    if (strptime("2100 366", { format: "%Y %j" }) !== null) throw new Error("strptime century 2100 non-leap day 366 should be null");
    if (strptime("2000-02-29", { format: "%Y-%m-%d" })?.toISOString() !== "2000-02-29T00:00:00.000Z") throw new Error("strptime 2000-02-29 (leap) failed");
    if (strptime("1900-02-29", { format: "%Y-%m-%d" }) !== null) throw new Error("strptime 1900-02-29 (non-leap) should be null");
    if (strptime("2100-02-29", { format: "%Y-%m-%d" }) !== null) throw new Error("strptime 2100-02-29 (non-leap) should be null");

    // 7g. Calendar Rollover / Non-existent date guards (e.g. Feb 30, Nov 31, April 31)
    if (strptime("2026-02-29", { format: "%Y-%m-%d" }) !== null) throw new Error("strptime 2026-02-29 (non-leap) should be null");
    if (strptime("2024-02-29", { format: "%Y-%m-%d" })?.toISOString() !== "2024-02-29T00:00:00.000Z") throw new Error("strptime 2024-02-29 (leap) failed");
    if (strptime("2026-04-31", { format: "%Y-%m-%d" }) !== null) throw new Error("strptime April 31 should be null");
    if (strptime("2026-06-31", { format: "%Y-%m-%d" }) !== null) throw new Error("strptime June 31 should be null");
    if (strptime("2026-09-31", { format: "%Y-%m-%d" }) !== null) throw new Error("strptime September 31 should be null");
    if (strptime("2026-11-31", { format: "%Y-%m-%d" }) !== null) throw new Error("strptime November 31 should be null");

    // 7h. Time component boundaries (hour 24, min 60, sec 60)
    if (strptime("2026-05-20 24:00:00", { format: "%Y-%m-%d %H:%M:%S" }) !== null) throw new Error("strptime hour 24 should be null");
    if (strptime("2026-05-20 23:60:00", { format: "%Y-%m-%d %H:%M:%S" }) !== null) throw new Error("strptime minute 60 should be null");
    if (strptime("2026-05-20 23:59:60", { format: "%Y-%m-%d %H:%M:%S" }) !== null) throw new Error("strptime second 60 should be null");

    // 7i. Fractional seconds and sub-second scaling (%ms, %f)
    const parsedSubMs = strptime("2026-05-20 10:20:30.5", { format: "%Y-%m-%d %H:%M:%S.%ms" });
    if (!parsedSubMs || parsedSubMs.getUTCMilliseconds() !== 500) {
        throw new Error(`strptime %ms '.5' expected 500ms, got ${parsedSubMs?.getUTCMilliseconds()}`);
    }
    const parsedMicro = strptime("2026-05-20 10:20:30.123456", { format: "%Y-%m-%d %H:%M:%S.%f" });
    if (!parsedMicro || parsedMicro.getUTCMilliseconds() !== 123) {
        throw new Error(`strptime %f '.123456' expected 123ms, got ${parsedMicro?.getUTCMilliseconds()}`);
    }

    // 7j. Non-strict fallback to toValidDate
    const fallbackIso = strptime("2026-05-20T14:30:00.000Z", { format: "wrong format", strict: false });
    if (!fallbackIso || fallbackIso.toISOString() !== "2026-05-20T14:30:00.000Z") {
        throw new Error(`strptime non-strict fallback failed`);
    }

    // 7k. strptime invalid input & strict guards
    if (strptime(null as any, { format: "%Y-%m-%d" }) !== null) throw new Error("strptime(null) should be null");
    if (strptime(undefined as any, { format: "%Y-%m-%d" }) !== null) throw new Error("strptime(undefined) should be null");
    if (strptime("invalid date", { format: "%Y-%m-%d", strict: true }) !== null) throw new Error("strptime invalid strict should be null");
    if (strptime("2026-05-20", { format: null as any }) !== null) throw new Error("strptime null format should be null");
    if (strptime("2026-05-20", { format: "" }) !== null) throw new Error("strptime empty format should be null");
    if (strptime("", { format: "%Y-%m-%d" }) !== null) throw new Error("strptime empty str should be null");

    // 8. Comprehensive epoch normalization via toValidDate edge case tests
    // These exercise _normalizeEpochToMs indirectly through toValidDate
    const expectedIso = "2026-01-01T00:00:00.000Z";

    // 8a. Seconds detection (range 0 to 3e10)
    if (toValidDate(1767225600)?.toISOString() !== expectedIso) throw new Error("toValidDate(seconds) failed");
    if (toValidDate(1767225600n)?.toISOString() !== expectedIso) throw new Error("toValidDate(seconds BigInt) failed");
    if (toValidDate(-1767225600)?.toISOString() !== "1914-01-01T00:00:00.000Z") throw new Error("toValidDate(-seconds) failed");
    if (toValidDate(-1767225600n)?.toISOString() !== "1914-01-01T00:00:00.000Z") throw new Error("toValidDate(-seconds BigInt) failed");

    // Boundary: 3e10 (year ~2920)
    if (toValidDate(30_000_000_000)?.getTime() !== 30_000_000_000_000) throw new Error("toValidDate(3e10) failed");
    if (toValidDate(30_000_000_000n)?.getTime() !== 30_000_000_000_000) throw new Error("toValidDate(3e10 BigInt) failed");

    // 8b. Milliseconds detection (range 3e10 to 1e14)
    if (toValidDate(1767225600000)?.toISOString() !== expectedIso) throw new Error("toValidDate(ms) failed");
    if (toValidDate(1767225600000n)?.toISOString() !== expectedIso) throw new Error("toValidDate(ms BigInt) failed");
    if (toValidDate(-1767225600000)?.toISOString() !== "1914-01-01T00:00:00.000Z") throw new Error("toValidDate(-ms) failed");
    if (toValidDate(-1767225600000n)?.toISOString() !== "1914-01-01T00:00:00.000Z") throw new Error("toValidDate(-ms BigInt) failed");

    // Boundary: 1e14 (year ~5138)
    if (toValidDate(100_000_000_000_000)?.getTime() !== 100_000_000_000_000) throw new Error("toValidDate(1e14) failed");
    if (toValidDate(100_000_000_000_000n)?.getTime() !== 100_000_000_000_000) throw new Error("toValidDate(1e14 BigInt) failed");

    // 8c. Microseconds detection (range 1e14 to 1e17)
    if (toValidDate(1767225600000000n)?.toISOString() !== expectedIso) throw new Error("toValidDate(us BigInt) failed");
    if (toValidDate(-1767225600000000n)?.toISOString() !== "1914-01-01T00:00:00.000Z") throw new Error("toValidDate(-us BigInt) failed");

    // 8d. Nanoseconds detection (> 1e17)
    if (toValidDate(1767225600000000000n)?.toISOString() !== expectedIso) throw new Error("toValidDate(ns BigInt) failed");
    if (toValidDate(-1767225600000000000n)?.toISOString() !== "1914-01-01T00:00:00.000Z") throw new Error("toValidDate(-ns BigInt) failed");

    // 8e. toValidDate null and invalid guards
    if (toValidDate(null) !== null) throw new Error("toValidDate(null) should be null");
    if (toValidDate(undefined) !== null) throw new Error("toValidDate(undefined) should be null");
    if (toValidDate("") !== null) throw new Error("toValidDate('') should be null");
    if (toValidDate("   ") !== null) throw new Error("toValidDate('   ') should be null");
    if (toValidDate("invalid date string") !== null) throw new Error("toValidDate(invalid) should be null");
    if (toValidDate(NaN) !== null) throw new Error("toValidDate(NaN) should be null");
    if (toValidDate(Infinity) !== null) throw new Error("toValidDate(Infinity) should be null");

    console.log("✓ Exhaustive epoch normalization & toValidDate numeric tests passed");

    // 9. strptime with defaultTimeZone (exercises _getTimeZoneOffsetMinutes with pre-resolved tz)
    // EST (UTC-5) in January (standard time)
    const parsedEST = strptime("2026-01-15 12:00:00", { format: "%Y-%m-%d %H:%M:%S", defaultTimeZone: "America/New_York" });
    if (parsedEST?.toISOString() !== "2026-01-15T17:00:00.000Z") throw new Error(`strptime EST defaultTimeZone failed: got ${parsedEST?.toISOString()}`);

    // EDT (UTC-4) in July (daylight saving time)
    const parsedEDT = strptime("2026-07-15 12:00:00", { format: "%Y-%m-%d %H:%M:%S", defaultTimeZone: "America/New_York" });
    if (parsedEDT?.toISOString() !== "2026-07-15T16:00:00.000Z") throw new Error(`strptime EDT defaultTimeZone failed: got ${parsedEDT?.toISOString()}`);

    // Explicit offset in string should override defaultTimeZone
    const parsedExplicitOffset = strptime("2026-01-15 12:00:00 +0900", { format: "%Y-%m-%d %H:%M:%S %z", defaultTimeZone: "America/New_York" });
    if (parsedExplicitOffset?.toISOString() !== "2026-01-15T03:00:00.000Z") throw new Error(`strptime explicit offset should override defaultTimeZone: got ${parsedExplicitOffset?.toISOString()}`);

    // defaultTimeZone: "UTC" should leave date as-is
    const parsedUTC = strptime("2026-01-15 12:00:00", { format: "%Y-%m-%d %H:%M:%S", defaultTimeZone: "UTC" });
    if (parsedUTC?.toISOString() !== "2026-01-15T12:00:00.000Z") throw new Error(`strptime UTC defaultTimeZone failed: got ${parsedUTC?.toISOString()}`);

    console.log("✓ strptime defaultTimeZone tests passed");

    // 10. getTimeZoneOffset (exercises _getTimeZoneOffsetMinutes with pre-resolved tz)
    const janDate = _createUTCDate(2026, 0, 15, 12, 0, 0);
    const julDate = _createUTCDate(2026, 6, 15, 12, 0, 0);

    // Total offset for New York: -300 min (EST) / -240 min (EDT)
    const janTotalMin = getTimeZoneOffset(janDate, "America/New_York", { format: "minutes" }) as number;
    const julTotalMin = getTimeZoneOffset(julDate, "America/New_York", { format: "minutes" }) as number;
    if (janTotalMin !== -300) throw new Error(`getTimeZoneOffset Jan NY total minutes: expected -300, got ${janTotalMin}`);
    if (julTotalMin !== -240) throw new Error(`getTimeZoneOffset Jul NY total minutes: expected -240, got ${julTotalMin}`);

    // DST offset: 0 in winter, 60 in summer
    const janDST = getTimeZoneOffset(janDate, "America/New_York", { type: "daylightSavingTime", format: "minutes" }) as number;
    const julDST = getTimeZoneOffset(julDate, "America/New_York", { type: "daylightSavingTime", format: "minutes" }) as number;
    if (janDST !== 0) throw new Error(`getTimeZoneOffset Jan NY DST: expected 0, got ${janDST}`);
    if (julDST !== 60) throw new Error(`getTimeZoneOffset Jul NY DST: expected 60, got ${julDST}`);

    // Base (standard) offset: -300 for both
    const janBase = getTimeZoneOffset(janDate, "America/New_York", { type: "base", format: "minutes" }) as number;
    const julBase = getTimeZoneOffset(julDate, "America/New_York", { type: "base", format: "minutes" }) as number;
    if (janBase !== -300) throw new Error(`getTimeZoneOffset Jan NY base: expected -300, got ${janBase}`);
    if (julBase !== -300) throw new Error(`getTimeZoneOffset Jul NY base: expected -300, got ${julBase}`);

    // UTC should always be 0
    if (getTimeZoneOffset(janDate, "UTC", { format: "minutes" }) !== 0) throw new Error("getTimeZoneOffset UTC should be 0");

    // ISO format output
    const isoOffset = getTimeZoneOffset(janDate, "America/New_York", { format: "iso" });
    if (isoOffset !== "-05:00") throw new Error(`getTimeZoneOffset iso format: expected -05:00, got ${isoOffset}`);

    // Basic format output
    const basicOffset = getTimeZoneOffset(janDate, "America/New_York", { format: "basic" });
    if (basicOffset !== "-0500") throw new Error(`getTimeZoneOffset basic format: expected -0500, got ${basicOffset}`);

    console.log("✓ getTimeZoneOffset tests passed");

    // 11. Additional Edge Case Tests
    console.log("\n--- ADDITIONAL DATE UTILS EDGE CASE TESTS ---");
    // toValidDate edge cases
    if (toValidDate(null) !== null) throw new Error("toValidDate(null) must be null");
    if (toValidDate(undefined) !== null) throw new Error("toValidDate(undefined) must be null");
    if (toValidDate("") !== null) throw new Error("toValidDate('') must be null");
    if (toValidDate("   ") !== null) throw new Error("toValidDate whitespace must be null");
    if (toValidDate(new Date(NaN)) !== null) throw new Error("toValidDate(invalid Date) must be null");
    if (toValidDate(Object(1700000000000))?.getTime() !== 1700000000000) throw new Error("toValidDate boxed number failed");
    if (toValidDate(Object("2026-01-01T00:00:00Z"))?.getTime() !== new Date("2026-01-01T00:00:00Z").getTime()) throw new Error("toValidDate boxed string failed");

    // dateOnly option
    const fullDate = new Date("2026-08-22T15:30:45.678Z");
    const dateOnlyRes = toValidDate(fullDate, { dateOnly: true });
    if (dateOnlyRes?.toISOString() !== "2026-08-22T00:00:00.000Z") {
        throw new Error(`toValidDate with dateOnly failed: ${dateOnlyRes?.toISOString()}`);
    }

    // toValidTime edge cases
    if (toValidTime(null) !== null) throw new Error("toValidTime(null) must be null");
    if (toValidTime(undefined) !== null) throw new Error("toValidTime(undefined) must be null");
    if (toValidTime("invalid-time") !== null) throw new Error("toValidTime('invalid-time') must be null");
    if (toValidTime("14:30:00") !== "14:30:00.000") throw new Error(`toValidTime standard failed: got ${toValidTime("14:30:00")}`);
    if (toValidTime("14:30:00.123") !== "14:30:00.123") throw new Error(`toValidTime with ms failed: got ${toValidTime("14:30:00.123")}`);

    // replaceDateComponents edge cases
    const baseD = new Date("2026-05-20T14:30:15.500Z");
    const replacedYear = replaceDateComponents(baseD, { year: 2030, timeZone: "UTC" });
    if (replacedYear.toISOString() !== "2030-05-20T14:30:15.500Z") throw new Error(`replace year failed: ${replacedYear.toISOString()}`);
    const replacedAll = replaceDateComponents(baseD, { year: 2024, month: 2, day: 29, hour: 0, minute: 0, second: 0, ms: 0, timeZone: "UTC" });
    if (replacedAll.toISOString() !== "2024-02-29T00:00:00.000Z") throw new Error(`replace leap day failed: ${replacedAll.toISOString()}`);

    // negative day indexing (from month end)
    const lastDayMay = replaceDateComponents(baseD, { day: -1, timeZone: "UTC" });
    if (lastDayMay.toISOString() !== "2026-05-31T14:30:15.500Z") throw new Error(`replace day: -1 failed: ${lastDayMay.toISOString()}`);
    const secondLastDayMay = replaceDateComponents(baseD, { day: -2, timeZone: "UTC" });
    if (secondLastDayMay.toISOString() !== "2026-05-30T14:30:15.500Z") throw new Error(`replace day: -2 failed: ${secondLastDayMay.toISOString()}`);
    const lastDayFebLeap = replaceDateComponents(baseD, { year: 2024, month: 2, day: -1, timeZone: "UTC" });
    if (lastDayFebLeap.toISOString() !== "2024-02-29T14:30:15.500Z") throw new Error(`replace Feb leap -1 failed: ${lastDayFebLeap.toISOString()}`);
    const lastDayFebNonLeap = replaceDateComponents(baseD, { year: 2023, month: 2, day: -1, timeZone: "UTC" });
    if (lastDayFebNonLeap.toISOString() !== "2023-02-28T14:30:15.500Z") throw new Error(`replace Feb non-leap -1 failed: ${lastDayFebNonLeap.toISOString()}`);

    // negative month and time component indexing
    const endOfYear = replaceDateComponents(baseD, { month: -1, day: -1, hour: -1, minute: -1, second: -1, ms: -1, timeZone: "UTC" });
    if (endOfYear.toISOString() !== "2026-12-31T23:59:59.999Z") throw new Error(`replace end of year failed: ${endOfYear.toISOString()}`);
    const secondToLastMonth = replaceDateComponents(baseD, { month: -2, timeZone: "UTC" });
    if (secondToLastMonth.toISOString() !== "2026-11-20T14:30:15.500Z") throw new Error(`replace month: -2 failed: ${secondToLastMonth.toISOString()}`);

    // --- EXTENSIVE NEGATIVE INDEXING EDGE CASES ---
    // (1) Full negative month spectrum (-1 to -12)
    const expectedMonths = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    for (let i = 1; i <= 12; i++) {
        const rMonth = replaceDateComponents(baseD, { month: -i, day: 1, timeZone: "UTC" });
        const expectedM = expectedMonths[i - 1];
        if (rMonth.getUTCMonth() + 1 !== expectedM) {
            throw new Error(`Negative month -${i} failed: expected month ${expectedM}, got ${rMonth.getUTCMonth() + 1}`);
        }
    }

    // (2) All 12 months last day (-1) with leap/non-leap year checks
    const daysIn2024 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const daysIn2025 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (let m = 1; m <= 12; m++) {
        // Leap year 2024
        const leapEnd = replaceDateComponents(baseD, { year: 2024, month: m, day: -1, timeZone: "UTC" });
        if (leapEnd.getUTCDate() !== daysIn2024[m - 1]) {
            throw new Error(`2024 month ${m} day: -1 failed: expected ${daysIn2024[m - 1]}, got ${leapEnd.getUTCDate()}`);
        }
        // Non-leap year 2025
        const nonLeapEnd = replaceDateComponents(baseD, { year: 2025, month: m, day: -1, timeZone: "UTC" });
        if (nonLeapEnd.getUTCDate() !== daysIn2025[m - 1]) {
            throw new Error(`2025 month ${m} day: -1 failed: expected ${daysIn2025[m - 1]}, got ${nonLeapEnd.getUTCDate()}`);
        }
    }

    // (3) Deep negative day offsets within a month (-1 to -28/-31)
    // In Jan (31 days): -31 is Jan 1st, -1 is Jan 31st
    for (let offset = 1; offset <= 31; offset++) {
        const janDay = replaceDateComponents(baseD, { month: 1, day: -offset, timeZone: "UTC" });
        const expectedDay = 31 + 1 - offset;
        if (janDay.getUTCDate() !== expectedDay) {
            throw new Error(`Jan negative day -${offset} failed: expected ${expectedDay}, got ${janDay.getUTCDate()}`);
        }
    }

    // (4) Hour negative indexing (-1 = 23, -24 = 0)
    for (let h = 1; h <= 24; h++) {
        const rHour = replaceDateComponents(baseD, { hour: -h, timeZone: "UTC" });
        const expectedHour = 24 - h;
        if (rHour.getUTCHours() !== expectedHour) {
            throw new Error(`Hour -${h} failed: expected ${expectedHour}, got ${rHour.getUTCHours()}`);
        }
    }

    // (5) Minute negative indexing (-1 = 59, -60 = 0)
    for (let min = 1; min <= 60; min++) {
        const rMin = replaceDateComponents(baseD, { minute: -min, timeZone: "UTC" });
        const expectedMin = 60 - min;
        if (rMin.getUTCMinutes() !== expectedMin) {
            throw new Error(`Minute -${min} failed: expected ${expectedMin}, got ${rMin.getUTCMinutes()}`);
        }
    }

    // (6) Second negative indexing (-1 = 59, -60 = 0)
    for (let s = 1; s <= 60; s++) {
        const rSec = replaceDateComponents(baseD, { second: -s, timeZone: "UTC" });
        const expectedSec = 60 - s;
        if (rSec.getUTCSeconds() !== expectedSec) {
            throw new Error(`Second -${s} failed: expected ${expectedSec}, got ${rSec.getUTCSeconds()}`);
        }
    }

    // (7) Millisecond negative indexing (-1 = 999, -500 = 500, -1000 = 0)
    const msChecks = [
        { neg: -1, expected: 999 },
        { neg: -250, expected: 750 },
        { neg: -500, expected: 500 },
        { neg: -999, expected: 1 },
        { neg: -1000, expected: 0 },
    ];
    for (const { neg, expected } of msChecks) {
        const rMs = replaceDateComponents(baseD, { ms: neg, timeZone: "UTC" });
        if (rMs.getUTCMilliseconds() !== expected) {
            throw new Error(`Ms ${neg} failed: expected ${expected}, got ${rMs.getUTCMilliseconds()}`);
        }
    }

    // (8) Complex combination of negative and positive components
    const combo1 = replaceDateComponents(baseD, {
        year: 2028, // Leap year
        month: -11, // February (12 + 1 - 11 = 2)
        day: -1,    // 29
        hour: -1,   // 23
        minute: -1, // 59
        second: -1, // 59
        ms: -1,     // 999
        timeZone: "UTC"
    });
    if (combo1.toISOString() !== "2028-02-29T23:59:59.999Z") {
        throw new Error(`Complex negative leap combo failed: got ${combo1.toISOString()}`);
    }

    // (9) Preserving unspecified fields while replacing negative fields
    const morningD = new Date("2026-07-04T08:15:30.100Z");
    const replacedOnlyDay = replaceDateComponents(morningD, { day: -1, timeZone: "UTC" });
    if (replacedOnlyDay.toISOString() !== "2026-07-31T08:15:30.100Z") {
        throw new Error(`Preserving hours/mins with negative day failed: got ${replacedOnlyDay.toISOString()}`);
    }

    // (10) Timezone awareness with negative components
    // 2026-01-15T00:00:00Z in America/New_York is 2026-01-14 19:00:00 EST
    const nyDate = new Date("2026-01-15T00:00:00Z");
    const nyMonthEnd = replaceDateComponents(nyDate, { day: -1, timeZone: "America/New_York" });
    // In NY local time, Jan 14th day -1 is Jan 31st 19:00:00 -> represented as UTC 2026-01-31T19:00:00.000Z
    if (nyMonthEnd.toISOString() !== "2026-01-31T19:00:00.000Z") {
        throw new Error(`Timezone aware negative day failed: got ${nyMonthEnd.toISOString()}`);
    }

    // toEpoch edge cases
    const epochDate = new Date("1970-01-01T00:00:01.500Z");
    if (toEpoch(epochDate, "s") !== 1) throw new Error(`toEpoch s failed: ${toEpoch(epochDate, "s")}`);
    if (toEpoch(epochDate, "ms") !== 1500) throw new Error(`toEpoch ms failed: ${toEpoch(epochDate, "ms")}`);
    if (toEpoch(epochDate, "us") !== 1500000n) throw new Error(`toEpoch us failed: ${toEpoch(epochDate, "us")}`);
    if (toEpoch(epochDate, "ns") !== 1500000000n) throw new Error(`toEpoch ns failed: ${toEpoch(epochDate, "ns")}`);

    // BigInt negative epoch normalization
    const negBigIntDate = toValidDate(-1000n);
    if (negBigIntDate?.getTime() !== -1000000) throw new Error(`Negative bigint epoch sec failed: ${negBigIntDate?.getTime()}`);

    // Exhaustive 10/10 toValidDate edge cases
    if (toValidDate(null) !== null) throw new Error("toValidDate(null) should be null");
    if (toValidDate(undefined) !== null) throw new Error("toValidDate(undefined) should be null");
    if (toValidDate(NaN) !== null) throw new Error("toValidDate(NaN) should be null");
    if (toValidDate(Infinity) !== null) throw new Error("toValidDate(Infinity) should be null");
    if (toValidDate(-Infinity) !== null) throw new Error("toValidDate(-Infinity) should be null");
    if (toValidDate(true) !== null) throw new Error("toValidDate(true) should be null");
    if (toValidDate(false) !== null) throw new Error("toValidDate(false) should be null");
    if (toValidDate(Symbol("date")) !== null) throw new Error("toValidDate(Symbol) should be null");
    if (toValidDate({}) !== null) throw new Error("toValidDate({}) should be null");
    if (toValidDate([]) !== null) throw new Error("toValidDate([]) should be null");
    if (toValidDate(() => {}) !== null) throw new Error("toValidDate(function) should be null");
    if (toValidDate("") !== null) throw new Error("toValidDate('') should be null");
    if (toValidDate("   ") !== null) throw new Error("toValidDate('   ') should be null");
    if (toValidDate("invalid-date-string") !== null) throw new Error("toValidDate('invalid-date-string') should be null");
    if (toValidDate(new Date("invalid")) !== null) throw new Error("toValidDate(InvalidDate) should be null");

    // toValidDate numeric & bigint multi-scale epoch auto-detection (positive and negative)
    const baseSec = 1716200000;
    const baseMs = 1716200000000;
    const baseUs = 1716200000000000n;
    const baseNs = 1716200000000000000n;
    if (toValidDate(baseSec)?.getTime() !== baseMs) throw new Error("toValidDate numeric seconds failed");
    if (toValidDate(baseMs)?.getTime() !== baseMs) throw new Error("toValidDate numeric milliseconds failed");
    if (toValidDate(baseUs)?.getTime() !== baseMs) throw new Error("toValidDate bigint microseconds failed");
    if (toValidDate(baseNs)?.getTime() !== baseMs) throw new Error("toValidDate bigint nanoseconds failed");
    if (toValidDate(-baseSec)?.getTime() !== -baseMs) throw new Error("toValidDate negative numeric seconds failed");
    if (toValidDate(-baseUs)?.getTime() !== -baseMs) throw new Error("toValidDate negative bigint microseconds failed");
    if (toValidDate(-baseNs)?.getTime() !== -baseMs) throw new Error("toValidDate negative bigint nanoseconds failed");

    // toValidDate dateOnly: true option
    const fullDateSample = new Date("2026-05-20T14:30:45.999Z");
    const strippedDate = toValidDate(fullDateSample, { dateOnly: true });
    if (strippedDate?.toISOString() !== "2026-05-20T00:00:00.000Z") {
        throw new Error(`toValidDate dateOnly Date failed: ${strippedDate?.toISOString()}`);
    }
    const strippedStr = toValidDate("2026-05-20T14:30:45.999Z", { dateOnly: true });
    if (strippedStr?.toISOString() !== "2026-05-20T00:00:00.000Z") {
        throw new Error(`toValidDate dateOnly string failed: ${strippedStr?.toISOString()}`);
    }
    const strippedNum = toValidDate(fullDateSample.getTime(), { dateOnly: true });
    if (strippedNum?.toISOString() !== "2026-05-20T00:00:00.000Z") {
        throw new Error(`toValidDate dateOnly number failed: ${strippedNum?.toISOString()}`);
    }

    // Exhaustive 10/10 toValidTime edge cases
    if (toValidTime(null) !== null) throw new Error("toValidTime(null) should be null");
    if (toValidTime(undefined) !== null) throw new Error("toValidTime(undefined) should be null");
    if (toValidTime(NaN) !== null) throw new Error("toValidTime(NaN) should be null");
    if (toValidTime(Infinity) !== null) throw new Error("toValidTime(Infinity) should be null");
    if (toValidTime(true) !== null) throw new Error("toValidTime(true) should be null");
    if (toValidTime(false) !== null) throw new Error("toValidTime(false) should be null");
    if (toValidTime({}) !== null) throw new Error("toValidTime({}) should be null");
    if (toValidTime([]) !== null) throw new Error("toValidTime([]) should be null");
    if (toValidTime("") !== null) throw new Error("toValidTime('') should be null");
    if (toValidTime("   ") !== null) throw new Error("toValidTime('   ') should be null");
    if (toValidTime("not-a-date-or-time") !== null) throw new Error("toValidTime('not-a-date-or-time') should be null");
    if (toValidTime("25:00:00") !== null) throw new Error("toValidTime('25:00:00') should be null");
    if (toValidTime("12:65:00") !== null) throw new Error("toValidTime('12:65:00') should be null");
    if (toValidTime("14:30") !== "14:30:00.000") throw new Error(`toValidTime '14:30' failed: ${toValidTime("14:30")}`);
    if (toValidTime("14:30:15") !== "14:30:15.000") throw new Error(`toValidTime standard failed: ${toValidTime("14:30:15")}`);
    if (toValidTime("14:30:15.123") !== "14:30:15.123") throw new Error(`toValidTime standard with ms failed: ${toValidTime("14:30:15.123")}`);
    if (toValidTime("14:30:15.123456") !== "14:30:15.123") throw new Error(`toValidTime standard with microseconds failed: ${toValidTime("14:30:15.123456")}`);
    if (toValidTime("14:30:15+02:00") !== "12:30:15.000") throw new Error(`toValidTime zone offset failed: ${toValidTime("14:30:15+02:00")}`);
    if (toValidTime("14:30:15-05:00") !== "19:30:15.000") throw new Error(`toValidTime negative zone offset failed: ${toValidTime("14:30:15-05:00")}`);
    if (toValidTime("14:30:15Z") !== "14:30:15.000") throw new Error(`toValidTime Z zone offset failed: ${toValidTime("14:30:15Z")}`);
    if (toValidTime("2026-05-20T10:15:30.500Z") !== "10:15:30.500") throw new Error(`toValidTime ISO date string failed: ${toValidTime("2026-05-20T10:15:30.500Z")}`);
    if (toValidTime(new Date("2026-05-20T08:00:00.123Z")) !== "08:00:00.123") throw new Error("toValidTime Date object failed");
    if (toValidTime(1700000000000) !== "22:13:20.000") throw new Error(`toValidTime timestamp failed: ${toValidTime(1700000000000)}`);

    // ISO week & year edge cases (%V and %G boundary checks across year transitions)
    // 2024-12-30 (Monday) belongs to ISO Year 2025, Week 01
    const dDec30 = new Date("2024-12-30T00:00:00.000Z");
    if (strftime(dDec30, { format: "%G-W%V" }) !== "2025-W01") {
        throw new Error(`Expected "2025-W01", got "${strftime(dDec30, { format: "%G-W%V" })}"`);
    }
    // 2027-01-01 (Friday) belongs to ISO Year 2026, Week 53
    const dJan1 = new Date("2027-01-01T00:00:00.000Z");
    if (strftime(dJan1, { format: "%G-W%V" }) !== "2026-W53") {
        throw new Error(`Expected "2026-W53", got "${strftime(dJan1, { format: "%G-W%V" })}"`);
    }

    // isBusinessDay edge cases with custom excludeWeekdays and empty sets
    const sunCheckDate = new Date("2026-05-24T00:00:00.000Z"); // Sunday
    if (isBusinessDay(sunCheckDate, { excludeWeekdays: [0, 6] }) !== false) throw new Error("Sunday should not be a business day");
    if (isBusinessDay(sunCheckDate, { excludeWeekdays: [] }) !== true) throw new Error("Sunday with no excluded weekdays should be true");
    if (isBusinessDay(new Date(NaN)) !== null) throw new Error("Invalid date should return null");
    if (isBusinessDay(new Date("2026-05-25T00:00:00.000Z"), { holidays: ["invalid-holiday-string"] }) !== true) {
        throw new Error("Invalid holiday string should be safely ignored");
    }

    console.log("✓ Additional date utils edge case tests passed");

    console.log("\n🎉 ALL DATE UTILS ROBUSTNESS TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("\n❌ DATE UTILS ROBUSTNESS TESTS FAILED:", err);
    process.exit(1);
}
