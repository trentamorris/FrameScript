declare const process: any;
import { scaleDurationMs, parseDurationString, toDuration, parseDurationInterval, addCalendarDuration } from "../../src/utils/duration";

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

    // 4. parseDurationString default { to: "ms" }
    if (parseDurationString("10s") !== 10000) throw new Error("10s failed");
    if (parseDurationString("1m") !== 60000) throw new Error("1m failed");
    if (parseDurationString("2h") !== 7200000) throw new Error("2h failed");
    if (parseDurationString("1d") !== 86400000) throw new Error("1d failed");
    if (parseDurationString("500ms") !== 500) throw new Error("500ms failed");

    // 5. toDuration
    if (toDuration("1d") !== 86400000) throw new Error("toDuration string failed");
    if (toDuration("1d", { to: "h" }) !== 24) throw new Error("toDuration { to: 'h' } failed");
    if (toDuration("1d", { to: "s" }) !== 86400) throw new Error("toDuration { to: 's' } failed");
    if (toDuration(5000) !== 5000) throw new Error("toDuration number failed");
    if (toDuration(5000, { to: "s" }) !== 5) throw new Error("toDuration number { to: 's' } failed");
    if (toDuration(null, { fallback: 100 }) !== 100) throw new Error("toDuration fallback failed");
    if (toDuration(undefined, { fallback: 200 }) !== 200) throw new Error("toDuration undefined fallback failed");
    if (!Number.isNaN(toDuration("invalid"))) throw new Error("toDuration invalid should return NaN");

    // 6. Compound duration strings ("1h 30m", "1d 12h", "2m 15s")
    if (parseDurationString("1h 30m") !== 5400000) throw new Error("1h 30m compound duration failed");
    if (parseDurationString("1d 12h") !== 129600000) throw new Error("1d 12h compound duration failed");
    if (parseDurationString("2m 15s") !== 135000) throw new Error("2m 15s compound duration failed");

    // 7. Scientific notation support
    if (parseDurationString("1e3s") !== 1000000) throw new Error("1e3s scientific notation failed");
    if (parseDurationString("1.5e-3s") !== 1.5) throw new Error("1.5e-3s scientific notation failed");

    // 8. Unicode microsecond variations (Latin µ vs Greek μ)
    if (parseDurationString("1000µs") !== 1) throw new Error("Latin micro sign failed");
    if (parseDurationString("1000μs") !== 1) throw new Error("Greek small letter mu failed");

    // 9. Negative and fractional durations
    if (parseDurationString("-2.5s") !== -2500) throw new Error("-2.5s failed");
    if (parseDurationString("-1h 30m") !== -5400000) throw new Error("-1h 30m failed");

    // 10. parseDurationString with options: { to: unit }
    if (parseDurationString("1h", { to: "s" }) !== 3600) throw new Error("1h to s failed");
    if (parseDurationString("1m", { to: "s" }) !== 60) throw new Error("1m to s failed");
    if (parseDurationString("500ms", { to: "s" }) !== 0.5) throw new Error("500ms to s failed");
    if (parseDurationString("1d", { to: "h" }) !== 24) throw new Error("1d to h failed");
    if (parseDurationString("1w", { to: "d" }) !== 7) throw new Error("1w to d failed");
    if (parseDurationString("1s", { to: "ms" }) !== 1000) throw new Error("1s to ms failed");
    if (parseDurationString("1ms", { to: "us" }) !== 1000) throw new Error("1ms to us failed");
    if (parseDurationString("1ms", { to: "ns" }) !== 1000000) throw new Error("1ms to ns failed");
    let threwQuarter = false;
    try {
        parseDurationString("1q", { to: "d" });
    } catch {
        threwQuarter = true;
    }
    if (!threwQuarter) throw new Error("Expected parseDurationString('1q') to throw without an anchor date");

    // 11. Category 3 Edge Cases: Compound Negative Distribution & Strict Validation
    if (parseDurationString("-1h 30m") !== -5400000) {
        throw new Error(`Compound negative distribution failed: got ${parseDurationString("-1h 30m")}, expected -5400000`);
    }

    // Scientific notation exponents
    if (parseDurationString("1.5e3ms") !== 1500) throw new Error("1.5e3ms failed");
    if (parseDurationString("2e-3s") !== 2) throw new Error("2e-3s failed");

    // Ambiguous unitless multi-token rejection
    let threwUnitless = false;
    try {
        parseDurationString("1h 30");
    } catch {
        threwUnitless = true;
    }
    if (!threwUnitless) throw new Error("Failed to reject ambiguous unitless token '1h 30'");

    // Discontinuous / malformed interspersed strings
    let threwMalformed = false;
    try {
        parseDurationString("1h invalid 30m");
    } catch {
        threwMalformed = true;
    }
    if (!threwMalformed) throw new Error("Failed to reject malformed interspersed string '1h invalid 30m'");

    // 12. Delimiters: Commas and common spacing
    if (parseDurationString("1h, 30m") !== 5400000) throw new Error("1h, 30m comma delimiter failed");
    if (parseDurationString("1h,30m") !== 5400000) throw new Error("1h,30m comma delimiter failed");
    if (parseDurationString("1 day, 2 hours") !== 86400000 + 7200000) throw new Error("1 day, 2 hours failed");

    // 13. Internal sign rejection (no contradictory/internal signs after global sign stripping)
    const invalidSignedStrings = ["1h -30m", "-1h -30m", "1h +30m", "1d -1h"];
    for (const inv of invalidSignedStrings) {
        let threw = false;
        try {
            parseDurationString(inv);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected internal sign string '${inv}' to throw`);
    }

    // 14. Random dot splicing rejection (prevent '1h.30m' from matching as 1h + .30m)
    let threwDotSplicing = false;
    try {
        parseDurationString("1h.30m");
    } catch {
        threwDotSplicing = true;
    }
    if (!threwDotSplicing) throw new Error("Failed to reject spliced dot '1h.30m'");

    // 15. Statelessness across consecutive calls with early exits
    try { parseDurationString("1h invalid"); } catch {}
    if (parseDurationString("1h 30m") !== 5400000) {
        throw new Error("Shared regex state corrupted consecutive valid parse call");
    }

    // 16. Unicode Mu Equivalence (µ U+00B5 vs μ U+03BC)
    const latinMu = parseDurationString("2500µs", { to: "us" });
    const greekMu = parseDurationString("2500μs", { to: "us" });
    if (latinMu !== 2500 || greekMu !== 2500 || latinMu !== greekMu) {
        throw new Error(`Unicode mu equivalence mismatch: Latin=${latinMu}, Greek=${greekMu}`);
    }

    // 17. Case-insensitive options.to
    if (parseDurationString("1h", { to: "S" as any }) !== 3600) throw new Error("to: 'S' uppercase failed");
    if (parseDurationString("1s", { to: "MS" as any }) !== 1000) throw new Error("to: 'MS' uppercase failed");

    // 18. scaleDurationMs unicode mu support & invalid unit handling
    if (scaleDurationMs(10, "µs") !== 10000) throw new Error("scaleDurationMs Latin µs failed");
    if (scaleDurationMs(10, "μs") !== 10000) throw new Error("scaleDurationMs Greek μs failed");
    if (!Number.isNaN(scaleDurationMs(10, "invalid" as any))) throw new Error("scaleDurationMs invalid unit should return NaN");

    // 19. Negative zero normalization (-0 -> 0)
    const negZeroS = parseDurationString("-0s");
    const negZeroMs = parseDurationString("-0ms");
    if (Object.is(negZeroS, -0) || negZeroS !== 0) throw new Error("Negative zero leaked from -0s");
    if (Object.is(negZeroMs, -0) || negZeroMs !== 0) throw new Error("Negative zero leaked from -0ms");
    if (Object.is(scaleDurationMs(-0, "ms"), -0)) throw new Error("Negative zero leaked from scaleDurationMs");

    // 20. Capital "M" (Month = calendar) vs Lowercase "m" (Minute = 60s)
    const oneMinuteMs = 60000;
    if (parseDurationString("1m") !== oneMinuteMs) throw new Error("1m failed");

    // Month calendar intervals cannot be converted to scalar duration without an anchor date
    for (const monthStr of ["1M", "1mo", "1MO", "1M 30m"]) {
        let threwMonth = false;
        try {
            parseDurationString(monthStr);
        } catch {
            threwMonth = true;
        }
        if (!threwMonth) throw new Error(`Expected month string '${monthStr}' to throw without anchor date`);
    }

    // First-token unitless loophole rejection (e.g. "500 2s", "100 1h")
    for (const badFirstUnitless of ["500 2s", "100 1h", "50 30m 10s"]) {
        let threw = false;
        try {
            parseDurationString(badFirstUnitless);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected first-token unitless '${badFirstUnitless}' to throw`);
    }

    // 21. 10/10 Difficulty: Explicit Comma Edge Cases (leading/trailing/consecutive commas)
    const malformedCommaCases = [
        ",1h 30m",
        "1h 30m,",
        "1h,,30m",
        "1h, , 30m",
        ",",
        "- , 1h"
    ];
    for (const malformed of malformedCommaCases) {
        let threw = false;
        try {
            parseDurationString(malformed);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected malformed comma case '${malformed}' to throw`);
    }

    // 22. 10/10 Difficulty: Leading decimal without zero (".5s", "-.25h", ".5d, .5h")
    if (parseDurationString(".5s") !== 500) throw new Error("Leading decimal '.5s' failed");
    if (parseDurationString("-.25h") !== -900000) throw new Error("Negative leading decimal '-.25h' failed");
    if (parseDurationString(".5d, .5h") !== (43200000 + 1800000)) throw new Error("Compound leading decimals failed");

    // 23. 10/10 Difficulty: Scientific Notation Edge Cases & Signed Exponents ("1e+3s", "2.5e-2m", "1E2s")
    if (parseDurationString("1e+3s") !== 1000000) throw new Error("Scientific positive exponent '1e+3s' failed");
    if (parseDurationString("1E2s") !== 100000) throw new Error("Scientific capital '1E2s' failed");
    if (parseDurationString("2.5e-2m") !== (0.025 * 60000)) throw new Error("Fractional scientific '2.5e-2m' failed");

    // 24. 10/10 Difficulty: Rejection of Multiple Decimals ("1.2.3s", "1..5h")
    const doubleDecimalCases = ["1.2.3s", "1..5h", "..5s", "1.5.0ms"];
    for (const d of doubleDecimalCases) {
        let threw = false;
        try {
            parseDurationString(d);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected multiple decimal string '${d}' to throw`);
    }

    // 25. 10/10 Difficulty: Strict NaN Guarding (NaN / Infinity cannot leak or be converted to 0)
    let threwInvalid = false;
    try {
        parseDurationString("NaNs");
    } catch {
        threwInvalid = true;
    }
    if (!threwInvalid) throw new Error("Failed to reject 'NaNs'");

    let threwInfinity = false;
    try {
        parseDurationString("Infinitys");
    } catch {
        threwInfinity = true;
    }
    if (!threwInfinity) throw new Error("Failed to reject 'Infinitys'");

    // 26. 10/10 Difficulty: Single unitless number ("500" -> 500ms default, "-1000" -> -1000ms)
    if (parseDurationString("500") !== 500) throw new Error("Single unitless '500' failed");
    if (parseDurationString("-1000") !== -1000) throw new Error("Single unitless '-1000' failed");
    if (parseDurationString("0") !== 0) throw new Error("Single unitless '0' failed");
    if (parseDurationString("1000", { to: "s" }) !== 1) throw new Error("Single unitless '1000' with { to: 's' } failed");

    // 27. 10/10 Difficulty: Whitespace Variances (tabs, non-breaking spaces, excessive spaces)
    if (parseDurationString("  1h \t  30m  ") !== 5400000) throw new Error("Tab and irregular whitespace failed");
    if (parseDurationString("+ 1h   30m") !== 5400000) throw new Error("Leading positive sign with space failed");
    if (parseDurationString("- 1h   30m") !== -5400000) throw new Error("Leading negative sign with space failed");

    // 29. Additional Edge Cases:
    // Non-string / null / undefined / empty inputs
    const invalidInputs = ["", "   ", "\t\n", null as any, undefined as any, 123 as any, {} as any];
    for (const inv of invalidInputs) {
        let threw = false;
        try {
            parseDurationString(inv);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected invalid input '${inv}' to throw`);
    }

    // Bare sign with no number
    for (const bare of ["+", "-", "+  ", "-  "]) {
        let threw = false;
        try {
            parseDurationString(bare);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected bare sign '${bare}' to throw`);
    }

    // Bare unit with no number
    for (const unitOnly of ["s", "ms", "h", "d", "m"]) {
        let threw = false;
        try {
            parseDurationString(unitOnly);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected unit-only string '${unitOnly}' to throw`);
    }

    // Incomplete exponent without digits
    for (const badExp of ["1es", "1e+s", "1e-s", "2.5Eh"]) {
        let threw = false;
        try {
            parseDurationString(badExp);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected malformed exponent '${badExp}' to throw`);
    }

    // Internal sign attached to tokens (e.g., "1h-30m", "1h+30m")
    for (const attachedSign of ["1h-30m", "1h+30m", "-1h+30m", "-1h-30m"]) {
        let threw = false;
        try {
            parseDurationString(attachedSign);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected attached internal sign '${attachedSign}' to throw`);
    }

    // Trailing non-unit symbols and punctuation
    for (const badTrailing of ["10s!", "10s?", "10s;", "10s/2", "10s_"]) {
        let threw = false;
        try {
            parseDurationString(badTrailing);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected invalid punctuation in '${badTrailing}' to throw`);
    }

    // Multiple negative signs
    for (const multiSign of ["--10s", "++10s", "-+10s", "+-10s"]) {
        let threw = false;
        try {
            parseDurationString(multiSign);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected multiple signs in '${multiSign}' to throw`);
    }

    // scaleDurationMs edge cases
    if (!Number.isNaN(scaleDurationMs(NaN, "ms"))) throw new Error("scaleDurationMs(NaN) should be NaN");
    if (!Number.isNaN(scaleDurationMs(Infinity, "ms"))) throw new Error("scaleDurationMs(Infinity) should be NaN");
    if (!Number.isNaN(scaleDurationMs(-Infinity, "ms"))) throw new Error("scaleDurationMs(-Infinity) should be NaN");
    if (!Number.isNaN(scaleDurationMs(100, null as any))) throw new Error("scaleDurationMs with null unit should be NaN");
    if (!Number.isNaN(scaleDurationMs(100, undefined as any))) throw new Error("scaleDurationMs with undefined unit should be NaN");

    // 30. toDuration comprehensive edge cases
    // Fallback when input is null or undefined
    if (toDuration(null, { fallback: 500 }) !== 500) throw new Error("toDuration(null, 500) should return fallback 500");
    if (toDuration(undefined, { fallback: 500 }) !== 500) throw new Error("toDuration(undefined, 500) should return fallback 500");
    if (!Number.isNaN(toDuration(null))) throw new Error("toDuration(null) without fallback should return NaN");
    if (!Number.isNaN(toDuration(undefined))) throw new Error("toDuration(undefined) without fallback should return NaN");

    // Invalid duration strings return NaN (do not mask with fallback)
    if (!Number.isNaN(toDuration("invalid"))) throw new Error("toDuration('invalid') should return NaN");
    if (!Number.isNaN(toDuration("not_a_duration", { fallback: 500 }))) throw new Error("toDuration('not_a_duration', 500) should return NaN");

    // Non-finite numbers return NaN
    if (!Number.isNaN(toDuration(NaN, { fallback: 500 }))) throw new Error("toDuration(NaN) should return NaN");
    if (!Number.isNaN(toDuration(Infinity, { fallback: 500 }))) throw new Error("toDuration(Infinity) should return NaN");
    if (!Number.isNaN(toDuration(-Infinity, { fallback: 500 }))) throw new Error("toDuration(-Infinity) should return NaN");

    // Rejection of booleans (returns NaN, not 0/1)
    if (!Number.isNaN(toDuration(true as any))) throw new Error("toDuration(true) should return NaN");
    if (!Number.isNaN(toDuration(false as any))) throw new Error("toDuration(false) should return NaN");
    if (!Number.isNaN(toDuration(true as any, { fallback: 500 }))) throw new Error("toDuration(true, 500) should return NaN");

    // BigInt support
    if (toDuration(1000n) !== 1000) throw new Error("toDuration(1000n) should return 1000");
    if (toDuration(0n) !== 0) throw new Error("toDuration(0n) should return 0");

    // Negative zero normalization in toDuration
    const toDurNegZero = toDuration(-0);
    if (Object.is(toDurNegZero, -0) || toDurNegZero !== 0) throw new Error("toDuration(-0) should normalize to +0");

    // Arbitrary unparseable objects return NaN
    if (!Number.isNaN(toDuration({} as any, { fallback: 500 }))) throw new Error("toDuration({}, 500) should return NaN");
    if (!Number.isNaN(toDuration(Symbol("foo") as any, { fallback: 500 }))) throw new Error("toDuration(Symbol, 500) should return NaN");

    // 31. 10/10 Difficulty: Boxed Primitive Objects in toDuration
    if (toDuration(new Number(2500)) !== 2500) throw new Error("toDuration(new Number(2500)) failed");
    if (toDuration(new String("1h 30m")) !== 5400000) throw new Error("toDuration(new String('1h 30m')) failed");
    if (toDuration(Object(5000n)) !== 5000) throw new Error("toDuration(Object(5000n)) failed");
    if (!Number.isNaN(toDuration(new Boolean(true)))) throw new Error("toDuration(new Boolean(true)) should return NaN");
    if (!Number.isNaN(toDuration(new Boolean(false)))) throw new Error("toDuration(new Boolean(false)) should return NaN");

    // 32. 10/10 Difficulty: All Supported Units In parseDurationString
    const allUnitsExpected: Record<string, number> = {
        ns: 0.000001,
        us: 0.001,
        "µs": 0.001,
        "μs": 0.001,
        ms: 1,
        s: 1000,
        sec: 1000,
        second: 1000,
        seconds: 1000,
        m: 60000,
        min: 60000,
        minute: 60000,
        minutes: 60000,
        h: 3600000,
        hr: 3600000,
        hour: 3600000,
        hours: 3600000,
        d: 86400000,
        day: 86400000,
        days: 86400000,
        w: 604800000,
        week: 604800000,
        weeks: 604800000,
    };
    for (const [unit, expectedMs] of Object.entries(allUnitsExpected)) {
        const parsed = parseDurationString(`1${unit}`);
        if (parsed !== expectedMs) {
            throw new Error(`Unit '${unit}' failed: got ${parsed}, expected ${expectedMs}`);
        }
        // Plural and uppercase variations for ASCII units
        if (!unit.includes("µ") && !unit.includes("μ")) {
            if (unit === "m") {
                // In Polars/compact syntax, uppercase 'M' is month (calendar), not minute
                let threwM = false;
                try {
                    parseDurationString("1M");
                } catch {
                    threwM = true;
                }
                if (!threwM) throw new Error("Expected '1M' (Month) to throw without an anchor date");
            } else {
                const parsedUpper = parseDurationString(`1${unit.toUpperCase()}`);
                const expectedUpper = expectedMs;
                if (parsedUpper !== expectedUpper) {
                    throw new Error(`Uppercase unit '${unit.toUpperCase()}' failed: got ${parsedUpper}, expected ${expectedUpper}`);
                }
            }
        }
    }

    // Calendar units (mo, q, y, M) must throw when converted to scalar duration without an anchor date
    const calendarUnits = ["mo", "month", "months", "q", "quarter", "quarters", "y", "yr", "year", "years", "M"];
    for (const calUnit of calendarUnits) {
        let threw = false;
        try {
            parseDurationString(`1${calUnit}`);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected calendar unit '${calUnit}' to throw in parseDurationString`);
    }

    // 33. 10/10 Difficulty: Target Unit Conversion Matrix in parseDurationString options
    const targetUnits = ["ns", "us", "ms", "s", "m", "h", "d", "w"] as const;
    for (const target of targetUnits) {
        const converted = parseDurationString("1w", { to: target });
        const expected = 604800000 / allUnitsExpected[target];
        if (Math.abs(converted - expected) > 1e-6) {
            throw new Error(`Target conversion to '${target}' failed: got ${converted}, expected ${expected}`);
        }
    }

    // Unknown target unit throws
    let threwTarget = false;
    try {
        parseDurationString("1h", { to: "decades" as any });
    } catch {
        threwTarget = true;
    }
    if (!threwTarget) throw new Error("Expected unknown target unit 'decades' to throw");

    // 34. 10/10 Difficulty: scaleDurationMs Full Precision and Bounds
    if (scaleDurationMs(1, "ms") !== 1) throw new Error("scaleDurationMs(1, 'ms') failed");
    if (scaleDurationMs(1, "us") !== 1000) throw new Error("scaleDurationMs(1, 'us') failed");
    if (scaleDurationMs(1, "ns") !== 1000000) throw new Error("scaleDurationMs(1, 'ns') failed");
    if (scaleDurationMs(0, "ms") !== 0) throw new Error("scaleDurationMs(0, 'ms') failed");
    if (scaleDurationMs(-5, "ms") !== -5) throw new Error("scaleDurationMs(-5, 'ms') failed");
    if (scaleDurationMs(-5, "us") !== -5000) throw new Error("scaleDurationMs(-5, 'us') failed");
    if (scaleDurationMs(-5, "ns") !== -5000000) throw new Error("scaleDurationMs(-5, 'ns') failed");
    if (!Number.isNaN(scaleDurationMs(100, "days" as any))) throw new Error("scaleDurationMs invalid unit should return NaN");
    if (!Number.isNaN(scaleDurationMs(100, ""))) throw new Error("scaleDurationMs empty unit should return NaN");

    // 35. 10/10 Difficulty: Zero and Non-Integer Exponents
    if (parseDurationString("0s") !== 0) throw new Error("0s failed");
    if (parseDurationString("+0s") !== 0) throw new Error("+0s failed");
    if (parseDurationString("-0s") !== 0) throw new Error("-0s failed");
    if (parseDurationString("0h 0m 0s") !== 0) throw new Error("0h 0m 0s failed");
    if (parseDurationString("1e0s") !== 1000) throw new Error("1e0s failed");
    if (parseDurationString("1.5e1s") !== 15000) throw new Error("1.5e1s failed");
    if (parseDurationString("100e-2s") !== 1000) throw new Error("100e-2s failed");

    // 36. 10/10 Difficulty: Mixed units with commas and varying whitespace
    if (parseDurationString(" 2 days , 4 hours , 30 minutes , 15 seconds ") !== (2 * 86400000 + 4 * 3600000 + 30 * 60000 + 15000)) {
        throw new Error("Compound multi-token with comma and spacing failed");
    }
    if (parseDurationString("-2 days, 4 hours") !== -(2 * 86400000 + 4 * 3600000)) {
        throw new Error("Negative compound multi-token with comma failed");
    }

    // 37. 10/10 Difficulty: Boundary Syntaxes that Must Throw
    const syntaxRejections = [
        "1h 30m 15",       // Trailing unitless token in multi-token
        "15 1h",          // Leading unitless token in multi-token
        "1h,, 30m",       // Double comma
        ", 1h 30m",       // Leading comma
        "1h 30m ,",       // Trailing comma
        "1h + 30m",       // Plus in the middle
        "1h - 30m",       // Minus in the middle
        "1h--30m",        // Double dash in the middle
        "1.2.3 hours",    // Invalid numeric literal
        "1h.30m",         // Dot after unit
        "1e",             // Incomplete exponent
        "1e+",            // Incomplete exponent sign
        "1e+ms",          // Incomplete exponent before unit
        "s",              // Unit only
        "ms",             // Unit only
        "NaNms",          // NaN literal
        "Infinitys",      // Infinity literal
        "-Infinitys",     // Negative Infinity literal
        "1h foo 30m",     // Unknown token interspersed
        "1h 30xyz",       // Unknown unit
        "--5s",           // Multiple leading signs
        "++5s",           // Multiple leading signs
        "+-5s",           // Multiple leading signs
        "-+5s",           // Multiple leading signs
    ];
    // 38. 10/10 Difficulty: Trailing and floating-point dot syntax anomalies
    const trailingDotAnomalies = [
        "10. 5s",
        "1.s",
        ".s",
        "10.s",
        "1e,2s",
        "1e -3s",
        "1e +3s",
        "1.5s.5s",
        "1h 30m.",
        ". 5s"
    ];
    for (const dotAnomaly of trailingDotAnomalies) {
        let threw = false;
        try {
            parseDurationString(dotAnomaly);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected dot/exponent anomaly '${dotAnomaly}' to throw`);
    }

    // 39. 10/10 Difficulty: toDuration Non-Finite & Option Matrices
    if (!Number.isNaN(toDuration(Infinity))) throw new Error("toDuration(Infinity) must be NaN");
    if (!Number.isNaN(toDuration(-Infinity))) throw new Error("toDuration(-Infinity) must be NaN");
    if (!Number.isNaN(toDuration(NaN))) throw new Error("toDuration(NaN) must be NaN");
    if (!Number.isNaN(toDuration("invalid", { fallback: 500 }))) throw new Error("toDuration('invalid', { fallback }) must return NaN, not fallback");

    // toDuration unit conversions on numeric and string inputs
    if (toDuration(3600000, { to: "h" }) !== 1) throw new Error("toDuration(3600000, { to: 'h' }) failed");
    if (toDuration(60000, { to: "m" }) !== 1) throw new Error("toDuration(60000, { to: 'm' }) failed");
    if (toDuration("2h", { to: "m" }) !== 120) throw new Error("toDuration('2h', { to: 'm' }) failed");
    if (toDuration("1d", { to: "h" }) !== 24) throw new Error("toDuration('1d', { to: 'h' }) failed");
    if (toDuration("1d", { to: "s" }) !== 86400) throw new Error("toDuration('1d', { to: 's' }) failed");
    if (!Number.isNaN(toDuration("1M", { to: "d" }))) throw new Error("toDuration('1M') should return NaN for calendar duration");
    if (toDuration("1m", { to: "s" }) !== 60) throw new Error("toDuration('1m', { to: 's' }) failed");

    // 40. 10/10 Difficulty: Sub-millisecond target conversions with scientific inputs
    if (parseDurationString("1.5e-3s", { to: "us" }) !== 1500) throw new Error("1.5e-3s to us failed");
    if (parseDurationString("2e-3s", { to: "ns" }) !== 2000000) throw new Error("2e-3s to ns failed");
    if (Math.abs(parseDurationString("500ns", { to: "ns" }) - 500) > 1e-9) throw new Error("500ns to ns failed");

    // 41. 10/10 Difficulty: Index / Row Steps ('i' unit)
    if (parseDurationString("10i") !== 10) throw new Error("parseDurationString('10i') failed");
    if (parseDurationString("-5i") !== -5) throw new Error("parseDurationString('-5i') failed");
    if (parseDurationString("+100i") !== 100) throw new Error("parseDurationString('+100i') failed");
    if (parseDurationString("10i", { to: "i" }) !== 10) throw new Error("parseDurationString('10i', { to: 'i' }) failed");
    if (toDuration("10i") !== 10) throw new Error("toDuration('10i') failed");
    if (toDuration("-5i") !== -5) throw new Error("toDuration('-5i') failed");
    if (toDuration(50, { to: "i" }) !== 50) throw new Error("toDuration(50, { to: 'i' }) failed");

    // Rejection of mixed index unit 'i' with temporal units
    const invalidMixedUnits = ["10i 5s", "1d 2i", "-5i 10ms", "1h, 10i"];
    for (const mixed of invalidMixedUnits) {
        let threw = false;
        try {
            parseDurationString(mixed);
        } catch {
            threw = true;
        }
        if (!threw) throw new Error(`Expected mixed index/temporal string '${mixed}' to throw`);
    }

    // 42. 10/10 Difficulty: parseDurationInterval & addCalendarDuration DST and month-boundary precision
    const intervalMonth = parseDurationInterval("1mo");
    if (!intervalMonth.isCalendar || intervalMonth.months !== 1 || intervalMonth.days !== 0 || intervalMonth.ms !== 0) {
        throw new Error(`parseDurationInterval('1mo') failed: ${JSON.stringify(intervalMonth)}`);
    }

    const intervalCompound = parseDurationInterval("1y 2mo 3d 4h 5m 6s");
    if (!intervalCompound.isCalendar || intervalCompound.months !== 14 || intervalCompound.days !== 3) {
        throw new Error(`parseDurationInterval compound failed: ${JSON.stringify(intervalCompound)}`);
    }

    // Month boundary leap year rollover
    const jan31 = new Date("2024-01-31T00:00:00Z");
    const febAdded = addCalendarDuration(jan31, parseDurationInterval("1mo"));
    // 2024 is a leap year; Jan 31 + 1mo clips cleanly to Feb 29
    if (febAdded.toISOString() !== "2024-02-29T00:00:00.000Z") {
        throw new Error(`Leap year Jan 31 + 1mo failed: got ${febAdded.toISOString()}`);
    }

    // Non leap year
    const jan31_2023 = new Date("2023-01-31T00:00:00Z");
    const febAdded_2023 = addCalendarDuration(jan31_2023, parseDurationInterval("1mo"));
    if (febAdded_2023.toISOString() !== "2023-02-28T00:00:00.000Z") {
        throw new Error(`Non-leap year Jan 31 + 1mo failed: got ${febAdded_2023.toISOString()}`);
    }

    // Direct string duration passing to addCalendarDuration (e.g. "1mo", "1q", "2y", with step)
    const directMonthStr = addCalendarDuration(jan31, "1mo");
    if (directMonthStr.toISOString() !== "2024-02-29T00:00:00.000Z") {
        throw new Error(`addCalendarDuration direct string "1mo" failed: got ${directMonthStr.toISOString()}`);
    }
    const directQuarterStr = addCalendarDuration(new Date("2023-01-15T00:00:00Z"), "1q");
    if (directQuarterStr.toISOString() !== "2023-04-15T00:00:00.000Z") {
        throw new Error(`addCalendarDuration direct string "1q" failed: got ${directQuarterStr.toISOString()}`);
    }
    const directYearStrWithStep = addCalendarDuration(new Date("2020-01-01T00:00:00Z"), "1y", 3);
    if (directYearStrWithStep.toISOString() !== "2023-01-01T00:00:00.000Z") {
        throw new Error(`addCalendarDuration with step failed: got ${directYearStrWithStep.toISOString()}`);
    }

    // Accepting date strings and numeric epochs via toValidDate
    const fromStringDate = addCalendarDuration("2023-01-15T00:00:00Z", "1mo");
    if (fromStringDate.toISOString() !== "2023-02-15T00:00:00.000Z") {
        throw new Error(`addCalendarDuration from string date failed: got ${fromStringDate.toISOString()}`);
    }
    const fromEpochDate = addCalendarDuration(new Date("2023-01-15T00:00:00Z").getTime(), "1mo");
    if (fromEpochDate.toISOString() !== "2023-02-15T00:00:00.000Z") {
        throw new Error(`addCalendarDuration from epoch number failed: got ${fromEpochDate.toISOString()}`);
    }

    // Invalid date input throws
    let threwInvalidDate = false;
    try {
        addCalendarDuration("not-a-date", "1mo");
    } catch {
        threwInvalidDate = true;
    }
    if (!threwInvalidDate) throw new Error("Expected invalid date input to throw in addCalendarDuration");

    // =========================================================================
    // 10/10 COMPLEX DURATION & CALENDAR EDGE CASE TESTS
    // =========================================================================

    // Edge Case 1: Negative calendar month step clamping to non-leap February
    // 2024-03-31 minus 1 month (step = -1) -> 2024 is a leap year -> Feb 29
    const leapBack = addCalendarDuration("2024-03-31T00:00:00Z", "1mo", -1);
    if (leapBack.toISOString() !== "2024-02-29T00:00:00.000Z") {
        throw new Error(`Edge Case 1 failed: Expected 2024-02-29, got ${leapBack.toISOString()}`);
    }
    // 2023-03-31 minus 1 month (step = -1) -> 2023 is non-leap -> Feb 28
    const nonLeapBack = addCalendarDuration("2023-03-31T00:00:00Z", "1mo", -1);
    if (nonLeapBack.toISOString() !== "2023-02-28T00:00:00.000Z") {
        throw new Error(`Edge Case 1 failed: Expected 2023-02-28, got ${nonLeapBack.toISOString()}`);
    }

    // Edge Case 2: Multi-year century rollover & leap day anniversary
    // 2024-02-29 (leap day) + 1 year -> 2025-02-28 (clamped)
    const feb29NextYear = addCalendarDuration("2024-02-29T00:00:00Z", "1y");
    if (feb29NextYear.toISOString() !== "2025-02-28T00:00:00.000Z") {
        throw new Error(`Edge Case 2 failed: Expected 2025-02-28, got ${feb29NextYear.toISOString()}`);
    }
    // 2024-02-29 + 4 years (next leap year) -> 2028-02-29
    const feb29FourYears = addCalendarDuration("2024-02-29T00:00:00Z", "1y", 4);
    if (feb29FourYears.toISOString() !== "2028-02-29T00:00:00.000Z") {
        throw new Error(`Edge Case 2 failed: Expected 2028-02-29, got ${feb29FourYears.toISOString()}`);
    }

    // Edge Case 3: Compound duration with mixed calendar units (1y, 2q, 3mo, 4w, 5d, 6h, 7m, 8s, 9ms)
    const compoundInt = parseDurationInterval("1y 2q 3mo 4w 5d 6h 7m 8s 9ms");
    // 1y (12) + 2q (6) + 3mo (3) = 21 months
    // 4w (28) + 5d = 33 days
    // 6h + 7m + 8s + 9ms = 21600000 + 420000 + 8000 + 9 = 22028009 ms
    if (compoundInt.months !== 21 || compoundInt.days !== 33 || compoundInt.ms !== 22028009) {
        throw new Error(`Edge Case 3 compound parse failed: ${JSON.stringify(compoundInt)}`);
    }
    if (!compoundInt.isCalendar) throw new Error("Edge Case 3 expected isCalendar to be true");

    // Edge Case 4: Negative compound duration distributes sign to all components
    const negCompound = parseDurationInterval("-1y 2mo 3d 4h");
    if (negCompound.months !== -14 || negCompound.days !== -3 || negCompound.ms !== -14400000) {
        throw new Error(`Edge Case 4 negative distribution failed: ${JSON.stringify(negCompound)}`);
    }

    // Edge Case 5: Microsecond & Nanosecond sub-millisecond precision scaling and conversion
    const usDuration = parseDurationString("4500us", { to: "ms" });
    if (usDuration !== 4.5) {
        throw new Error(`Edge Case 5 us to ms failed: got ${usDuration}`);
    }
    const nsToUs = parseDurationString("7500000ns", { to: "us" });
    if (nsToUs !== 7500) {
        throw new Error(`Edge Case 5 ns to us failed: got ${nsToUs}`);
    }
    // Greek mu equivalent
    const greekMuToMs = parseDurationString("3500μs", { to: "ms" });
    if (greekMuToMs !== 3.5) {
        throw new Error(`Edge Case 5 greek mu failed: got ${greekMuToMs}`);
    }

    // Edge Case 6: Strict rejection of mixed index unit 'i' with temporal units
    let threwMixedIndex = false;
    try {
        parseDurationInterval("10i 5m");
    } catch {
        threwMixedIndex = true;
    }
    if (!threwMixedIndex) throw new Error("Edge Case 6 failed to reject '10i 5m'");

    // Edge Case 7: Pure Index step in addCalendarDuration
    const indexInterval = parseDurationInterval("5i");
    if (!indexInterval.isIndex || indexInterval.indexUnits !== 5 || indexInterval.isCalendar) {
        throw new Error(`Edge Case 7 index interval failed: ${JSON.stringify(indexInterval)}`);
    }

    // Edge Case 8: Calendar duration conversion to fixed duration without anchor strictly throws
    let threwMissingAnchor = false;
    try {
        parseDurationString("1mo", { to: "d" });
    } catch {
        threwMissingAnchor = true;
    }
    if (!threwMissingAnchor) throw new Error("Edge Case 8 failed: '1mo' to 'd' without anchor should throw");

    // Edge Case 9: Extreme large year and negative year transitions (BC/AD boundary)
    // 0001-01-01 minus 1 year -> 0000-01-01
    const bcTrans = addCalendarDuration("0001-01-01T00:00:00Z", "1y", -1);
    if (bcTrans.getUTCFullYear() !== 0 || bcTrans.getUTCMonth() !== 0 || bcTrans.getUTCDate() !== 1) {
        throw new Error(`Edge Case 9 BC transition failed: got ${bcTrans.toISOString()}`);
    }

    // Edge Case 10: Step multiplier zero or identity preservation
    const baseDate = new Date("2024-05-15T12:30:45.500Z");
    const zeroStepDate = addCalendarDuration(baseDate, "3mo 2w 5d 4h", 0);
    if (zeroStepDate.getTime() !== baseDate.getTime()) {
        throw new Error(`Edge Case 10 step=0 identity failed: expected ${baseDate.toISOString()}, got ${zeroStepDate.toISOString()}`);
    }
    // Verify baseDate was not mutated by pass-by-reference
    if (baseDate.toISOString() !== "2024-05-15T12:30:45.500Z") {
        throw new Error("Edge Case 10 failed: input date was mutated in place");
    }

    console.log("✓ Duration utils tests passed successfully!");
} catch (e: any) {
    console.error(`❌ Duration utils test failed: ${e.message}`);
    process.exit(1);
}

