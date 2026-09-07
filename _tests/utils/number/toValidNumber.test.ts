declare const process: any;
import { toValidNumber } from "../../../src/utils/number";

console.log("=========================================");
console.log("STARTING TOVALIDNUMBER TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    if (typeof actual === "bigint" || typeof expected === "bigint") {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${msg}\n  Expected: ${expected}\n  Actual:   ${actual}`);
        }
    } else {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) {
            throw new Error(`Assertion failed: ${msg}\n  Expected: ${e}\n  Actual:   ${a}`);
        }
    }
    testsPassed++;
}

try {
    assertEqual(toValidNumber(12.3), 12.3, "toValidNumber(12.3) failed");
    assertEqual(toValidNumber(true), 1, "toValidNumber(true) failed");
    assertEqual(toValidNumber(10n), 10, "toValidNumber(10n) failed");
    assertEqual(toValidNumber(new Date(1000)), 1000, "toValidNumber(Date) failed");
    assertEqual(toValidNumber("12.3"), 12.3, "toValidNumber('12.3') failed");
    assertEqual(toValidNumber("NaN"), null, "toValidNumber('NaN') should be null");
    assertEqual(toValidNumber("Infinity"), null, "toValidNumber('Infinity') should be null");
    assertEqual(toValidNumber(Infinity), null, "toValidNumber(Infinity) should be null");
    assertEqual(toValidNumber(NaN), null, "toValidNumber(NaN) should be null");

    // strictNumericString
    assertEqual(toValidNumber("1_2_3", { strictNumericString: true }), null, "Expected strictNumericString option to reject '1_2_3'");
    assertEqual(toValidNumber("1_2_3"), 123, "Expected toValidNumber to clean '1_2_3' to 123 by default");

    // Layout-Agnostic / European tests
    assertEqual(toValidNumber("1.234,56"), 1234.56, "Agnostic: '1.234,56' failed");
    assertEqual(toValidNumber("1 234,56"), 1234.56, "Agnostic: '1 234,56' failed");
    assertEqual(toValidNumber("1234,56"), 1234.56, "Agnostic: '1234,56' failed");
    assertEqual(toValidNumber("1,234.56"), 1234.56, "Agnostic: '1,234.56' failed");
    assertEqual(toValidNumber("1 234.56"), 1234.56, "Agnostic: '1 234.56' failed");
    assertEqual(toValidNumber("1,234,567"), 1234567, "Agnostic: lone repeating commas failed");
    assertEqual(toValidNumber("1.234.567"), 1234567, "Agnostic: lone repeating dots failed");

    // Agnostic single dot decimals
    assertEqual(toValidNumber("1.234"), 1.234, "Agnostic: single dot '1.234' failed");
    assertEqual(toValidNumber("0.123"), 0.123, "Agnostic: single dot '0.123' failed");
    assertEqual(toValidNumber("1234.567"), 1234.567, "Agnostic: single dot '1234.567' failed");

    // Standard decimal variations and signs
    assertEqual(toValidNumber(".123"), 0.123, "Decimal: '.123' failed");
    assertEqual(toValidNumber("-.123"), -0.123, "Decimal: '-.123' failed");
    assertEqual(toValidNumber("+.123"), 0.123, "Decimal: '+.123' failed");

    // Scientific notation tests
    assertEqual(toValidNumber("1.23e+4"), 12300, "Scientific: '1.23e+4' failed");
    assertEqual(toValidNumber("1.23E4"), 12300, "Scientific: '1.23E4' failed");
    assertEqual(toValidNumber("1e5"), 100000, "Scientific: '1e5' failed");
    assertEqual(toValidNumber("1.5e-3"), 0.0015, "Scientific: '1.5e-3' failed");
    assertEqual(toValidNumber("+1.5e-3"), 0.0015, "Scientific: '+1.5e-3' failed");
    assertEqual(toValidNumber("-1.5e-3"), -0.0015, "Scientific: '-1.5e-3' failed");
    assertEqual(toValidNumber("1,23e+4"), 12300, "Scientific: European decimal comma failed");
    assertEqual(toValidNumber("1.234,56e+3"), 1234560, "Scientific: Mixed European failed");
    assertEqual(toValidNumber("1,234.56e+3"), 1234560, "Scientific: Mixed English failed");
    assertEqual(toValidNumber("1e+4.5"), null, "Scientific: decimal exponent should be rejected");

    // Accounting format negative checks
    assertEqual(toValidNumber("(123.45)"), -123.45, "Accounting: '(123.45)' failed");
    assertEqual(toValidNumber("(1,234.56)"), -1234.56, "Accounting: '(1,234.56)' failed");
    assertEqual(toValidNumber("( 100 )"), -100, "Accounting: space handling failed");

    // Hex / Octal / Binary injection rejection
    assertEqual(toValidNumber("0x1a"), null, "Hex injection failed");
    assertEqual(toValidNumber("0b101"), null, "Binary injection failed");
    assertEqual(toValidNumber("0o75"), null, "Octal injection failed");

    // False positive checking
    assertEqual(toValidNumber("192.168.1.1"), null, "Rejection: IP address failed");
    assertEqual(toValidNumber("1.2.3"), null, "Rejection: version string failed");
    assertEqual(toValidNumber("1.2.3.4"), null, "Rejection: version string 4-part failed");
    assertEqual(toValidNumber("1.2.3,45"), null, "Rejection: malformed mixed layout failed");
    assertEqual(toValidNumber("1.234.56"), null, "Rejection: invalid group length failed");
    assertEqual(toValidNumber("9999.123.456"), null, "Rejection: 9999.123.456 should be null");
    assertEqual(toValidNumber("1234,567.89"), null, "Rejection: 1234,567.89 should be null");
    assertEqual(toValidNumber("12345.678"), 12345.678, "Acceptance: 12345.678 should be 12345.678");
    assertEqual(toValidNumber("12345,678"), null, "Rejection: 12345,678 should be null");
    assertEqual(toValidNumber("1,234.567"), 1234.567, "Acceptance: 1,234.567 should be 1234.567");

    // Trailing sign tests
    assertEqual(toValidNumber("123.45-"), -123.45, "Trailing minus sign parsing failed");
    assertEqual(toValidNumber("1,234.50-"), -1234.5, "Trailing minus with grouped commas failed");
    assertEqual(toValidNumber("123.45+"), 123.45, "Trailing plus sign parsing failed");


    console.log(`SUCCESS: All toValidNumber tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: toValidNumber test failed!`, err);
    process.exit(1);
}
