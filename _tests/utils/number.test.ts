declare const process: any;
import {
    isValidNumber,
    toValidNumber,
    toValidFloat,
    isValidFloat,
    isValidInt,
    toValidInt,
    isValidBigInt,
    toValidBigInt,
    formatNumber,
    clamp,
    roundToScale,
    toValidDecimal,
    mulberry32
} from "../../src/utils/number";

console.log("=========================================");
console.log("STARTING NUMBER UTILS TESTS...");
console.log("=========================================");

try {
    // 1. isValidNumber
    if (!isValidNumber(12.3)) throw new Error("isValidNumber(12.3) failed");
    if (!isValidNumber(0)) throw new Error("isValidNumber(0) failed");
    if (isValidNumber(NaN)) throw new Error("isValidNumber(NaN) should be false");
    if (isValidNumber(Infinity)) throw new Error("isValidNumber(Infinity) should be false");
    if (!isValidNumber(NaN, { allowNaN: true })) throw new Error("isValidNumber(NaN, allowNaN) failed");
    if (!isValidNumber(Infinity, { allowNonFiniteNumbers: true })) throw new Error("isValidNumber(Infinity, allowNonFiniteNumbers) failed");

    // 2. toValidNumber checks
    if (toValidNumber(12.3) !== 12.3) throw new Error("toValidNumber(12.3) failed");
    if (toValidNumber(true) !== 1) throw new Error("toValidNumber(true) failed");
    if (toValidNumber(10n) !== 10) throw new Error("toValidNumber(10n) failed");
    if (toValidNumber(new Date(1000)) !== 1000) throw new Error("toValidNumber(Date) failed");
    if (toValidNumber("12.3") !== 12.3) throw new Error("toValidNumber('12.3') failed");
    if (toValidNumber("NaN") !== null) throw new Error("toValidNumber('NaN') should be null");
    if (toValidNumber("Infinity") !== null) throw new Error("toValidNumber('Infinity') should be null");
    if (toValidNumber(Infinity) !== null) throw new Error("toValidNumber(Infinity) should be null");
    if (toValidNumber(NaN) !== null) throw new Error("toValidNumber(NaN) should be null");

    // 3. toValidFloat checks
    if (toValidFloat(12.3) !== 12.3) throw new Error("toValidFloat(12.3) failed");
    if (toValidFloat(true) !== 1) throw new Error("toValidFloat(true) failed");
    if (toValidFloat(10n) !== 10) throw new Error("toValidFloat(10n) failed");
    if (toValidFloat(new Date(1000)) !== 1000) throw new Error("toValidFloat(Date) failed");
    if (toValidFloat("12.3") !== 12.3) throw new Error("toValidFloat('12.3') failed");
    if (toValidFloat("Infinity") !== Infinity) throw new Error("toValidFloat('Infinity') failed");
    if (toValidFloat("-Infinity") !== -Infinity) throw new Error("toValidFloat('-Infinity') failed");
    if (toValidFloat(Infinity) !== Infinity) throw new Error("toValidFloat(Infinity) failed");
    if (!Number.isNaN(toValidFloat("NaN") as number)) throw new Error("toValidFloat('NaN') should return NaN");
    if (!Number.isNaN(toValidFloat(NaN) as number)) throw new Error("toValidFloat(NaN) should return NaN");
    if (toValidFloat("invalid") !== null) throw new Error("toValidFloat('invalid') should return null");

    // toValidFloat options checks
    if (toValidFloat("12.3", { floatPrecision: "Float32" }) !== Math.fround(12.3)) throw new Error("toValidFloat precision option failed");
    if (toValidFloat("Infinity", { allowNonFiniteNumbers: false }) !== null) throw new Error("toValidFloat allowNonFiniteNumbers: false failed");

    // 4. strictNumericString tests
    if (toValidNumber("1_2_3", { strictNumericString: true }) !== null) {
        throw new Error("Expected strictNumericString option to reject '1_2_3'");
    }
    if (toValidNumber("1_2_3") !== 123) {
        throw new Error("Expected toValidNumber to clean '1_2_3' to 123 by default");
    }

    // 5. Layout-Agnostic / European tests
    if (toValidNumber("1.234,56") !== 1234.56) throw new Error("Agnostic: '1.234,56' failed");
    if (toValidNumber("1 234,56") !== 1234.56) throw new Error("Agnostic: '1 234,56' failed");
    if (toValidNumber("1234,56") !== 1234.56) throw new Error("Agnostic: '1234,56' failed");
    if (toValidNumber("1,234.56") !== 1234.56) throw new Error("Agnostic: '1,234.56' failed");
    if (toValidNumber("1 234.56") !== 1234.56) throw new Error("Agnostic: '1 234.56' failed");
    if (toValidNumber("1,234,567") !== 1234567) throw new Error("Agnostic: lone repeating commas failed");
    if (toValidNumber("1.234.567") !== 1234567) throw new Error("Agnostic: lone repeating dots failed");

    // Agnostic single dot decimals
    if (toValidNumber("1.234") !== 1.234) throw new Error("Agnostic: single dot '1.234' failed");
    if (toValidNumber("0.123") !== 0.123) throw new Error("Agnostic: single dot '0.123' failed");
    if (toValidNumber("1234.567") !== 1234.567) throw new Error("Agnostic: single dot '1234.567' failed");

    // Standard decimal variations and signs
    if (toValidNumber(".123") !== 0.123) throw new Error("Decimal: '.123' failed");
    if (toValidNumber("-.123") !== -0.123) throw new Error("Decimal: '-.123' failed");
    if (toValidNumber("+.123") !== 0.123) throw new Error("Decimal: '+.123' failed");

    // Scientific notation tests
    if (toValidNumber("1.23e+4") !== 12300) throw new Error("Scientific: '1.23e+4' failed");
    if (toValidNumber("1.23E4") !== 12300) throw new Error("Scientific: '1.23E4' failed");
    if (toValidNumber("1e5") !== 100000) throw new Error("Scientific: '1e5' failed");
    if (toValidNumber("1.5e-3") !== 0.0015) throw new Error("Scientific: '1.5e-3' failed");
    if (toValidNumber("+1.5e-3") !== 0.0015) throw new Error("Scientific: '+1.5e-3' failed");
    if (toValidNumber("-1.5e-3") !== -0.0015) throw new Error("Scientific: '-1.5e-3' failed");
    if (toValidNumber("1,23e+4") !== 12300) throw new Error("Scientific: European decimal comma failed");
    if (toValidNumber("1.234,56e+3") !== 1234560) throw new Error("Scientific: Mixed European failed");
    if (toValidNumber("1,234.56e+3") !== 1234560) throw new Error("Scientific: Mixed English failed");
    if (toValidNumber("1e+4.5") !== null) throw new Error("Scientific: decimal exponent should be rejected");

    // Accounting format negative checks
    if (toValidNumber("(123.45)") !== -123.45) throw new Error("Accounting: '(123.45)' failed");
    if (toValidNumber("(1,234.56)") !== -1234.56) throw new Error("Accounting: '(1,234.56)' failed");
    if (toValidNumber("( 100 )") !== -100) throw new Error("Accounting: space handling failed");

    // Hex / Octal / Binary injection rejection
    if (toValidNumber("0x1a") !== null) throw new Error("Hex injection failed");
    if (toValidNumber("0b101") !== null) throw new Error("Binary injection failed");
    if (toValidNumber("0o75") !== null) throw new Error("Octal injection failed");

    // False positive checking
    if (toValidNumber("192.168.1.1") !== null) throw new Error("Rejection: IP address failed");
    if (toValidNumber("1.2.3") !== null) throw new Error("Rejection: version string failed");
    if (toValidNumber("1.2.3.4") !== null) throw new Error("Rejection: version string 4-part failed");
    if (toValidNumber("1.2.3,45") !== null) throw new Error("Rejection: malformed mixed layout failed");
    if (toValidNumber("1.234.56") !== null) throw new Error("Rejection: invalid group length failed");
    if (toValidNumber("9999.123.456") !== null) throw new Error("Rejection: 9999.123.456 should be null");
    if (toValidNumber("1234,567.89") !== null) throw new Error("Rejection: 1234,567.89 should be null");
    if (toValidNumber("12345.678") !== 12345.678) throw new Error("Acceptance: 12345.678 should be 12345.678");
    if (toValidNumber("12345,678") !== null) throw new Error("Rejection: 12345,678 should be null");
    if (toValidNumber("1,234.567") !== 1234.567) throw new Error("Acceptance: 1,234.567 should be 1234.567");

    // Trailing sign tests
    if (toValidNumber("123.45-") !== -123.45) throw new Error("Trailing minus sign parsing failed");
    if (toValidNumber("1,234.50-") !== -1234.5) throw new Error("Trailing minus with grouped commas failed");
    if (toValidNumber("123.45+") !== 123.45) throw new Error("Trailing plus sign parsing failed");

    // 6. roundToScale tests
    if (roundToScale(1234, -1) !== 1230) throw new Error("roundToScale negative scale -1 failed");
    if (roundToScale(1234, -2) !== 1200) throw new Error("roundToScale negative scale -2 failed");
    if (roundToScale(1.005, 2) !== 1.01) throw new Error("roundToScale positive scale failed");

    // 7. clamp tests
    if (clamp(5, { min: 0, max: 10 }) !== 5) throw new Error("clamp middle failed");
    if (clamp(-5, { min: 0, max: 10 }) !== 0) throw new Error("clamp min failed");
    if (clamp(15, { min: 0, max: 10 }) !== 10) throw new Error("clamp max failed");

    // 8. toValidInt & isValidInt tests
    if (!isValidInt(42)) throw new Error("isValidInt(42) failed");
    if (isValidInt(42.5)) throw new Error("isValidInt(42.5) should be false");
    if (toValidInt("42") !== 42) throw new Error("toValidInt('42') failed");
    if (toValidInt("42.8", { coerce: "truncate" }) !== 42) throw new Error("toValidInt truncate failed");
    if (toValidInt("42.8", { coerce: "round" }) !== 43) throw new Error("toValidInt round failed");
    if (toValidInt("42.8", { coerce: "floor" }) !== 42) throw new Error("toValidInt floor failed");
    if (toValidInt("42.2", { coerce: "ceil" }) !== 43) throw new Error("toValidInt ceil failed");

    // 9. toValidBigInt & isValidBigInt tests
    if (toValidBigInt(9223372036854775807n) !== 9223372036854775807n) throw new Error("BigInt: native bigint failed");
    if (toValidBigInt(true) !== 1n) throw new Error("BigInt: boolean true failed");
    if (toValidBigInt("9223372036854775807") !== 9223372036854775807n) throw new Error("BigInt: string parsing precision failed");
    if (toValidBigInt("1.234,56", { truncate: true }) !== 1234n) throw new Error("BigInt: European mixed truncate failed");
    if (toValidBigInt("1.234,56", { truncate: false }) !== null) throw new Error("BigInt: European mixed strict float check failed");
    if (toValidBigInt("1.234,00", { truncate: false }) !== 1234n) throw new Error("BigInt: European mixed trailing zero float check failed");
    if (toValidBigInt("(1,234.00)") !== -1234n) throw new Error("BigInt: accounting layout parsing failed");
    if (toValidBigInt("1_000_000") !== 1000000n) throw new Error("BigInt: underscores failed");

    if (!isValidBigInt(0n)) throw new Error("isValidBigInt: 0n failed");
    if (!isValidBigInt(10n)) throw new Error("isValidBigInt: primitive bigint failed");
    if (isValidBigInt(10)) throw new Error("isValidBigInt: primitive number should return false");

    // 10. formatNumber tests
    const format = formatNumber({ locale: "en-US", minimumFractionDigits: 2, useGrouping: true });
    const formatted = format(1234567.89);
    if (formatted !== "1,234,567.89") throw new Error(`formatNumber failed: ${formatted}`);

    // 11. toValidDecimal tests
    if (toValidDecimal(12.345, { scale: 2 }) !== 12.35) throw new Error("toValidDecimal failed");

    // 12. mulberry32 RNG tests
    const rng = mulberry32(12345);
    const r1 = rng();
    const r2 = rng();
    if (typeof r1 !== "number" || r1 < 0 || r1 >= 1) throw new Error("mulberry32 value 1 out of range");
    if (typeof r2 !== "number" || r2 < 0 || r2 >= 1 || r1 === r2) throw new Error("mulberry32 value 2 invalid");

    console.log("✓ Number utils tests passed successfully!");
} catch (e: any) {
    console.error(`❌ Number utils test failed: ${e.message}`);
    process.exit(1);
}
