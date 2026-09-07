declare const process: any;
import { offsetDay, createUTCDate } from "../../../src/utils/date";
import { ComputeError } from "../../../src/exceptions";

console.log("=========================================");
console.log("STARTING OFFSETDAY TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error(`Assertion failed: ${msg}\n  Expected: ${e}\n  Actual:   ${a}`);
    }
    testsPassed++;
}

try {
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
    const year50Sat = createUTCDate(50, 1, 28);
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

    console.log(`SUCCESS: All offsetDay tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: offsetDay test failed!`, err);
    process.exit(1);
}
