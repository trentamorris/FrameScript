declare const process: any;
import { toDuration } from "../../../src/utils/duration";

try {
    if (toDuration("1d") !== 86400000) throw new Error("toDuration string failed");
    if (toDuration("1d", { to: "h" }) !== 24) throw new Error("toDuration { to: 'h' } failed");
    if (toDuration("1d", { to: "s" }) !== 86400) throw new Error("toDuration { to: 's' } failed");
    if (toDuration(5000) !== 5000) throw new Error("toDuration number failed");
    if (toDuration(5000, { to: "s" }) !== 5) throw new Error("toDuration number { to: 's' } failed");
    if (toDuration(1000n) !== 1000) throw new Error("toDuration BigInt failed");

    // Fallbacks
    if (toDuration(null, { fallback: 100 }) !== 100) throw new Error("toDuration null fallback failed");
    if (toDuration(undefined, { fallback: 200 }) !== 200) throw new Error("toDuration undefined fallback failed");

    // Negative zero
    const negZero = toDuration(-0);
    if (Object.is(negZero, -0) || negZero !== 0) throw new Error("toDuration(-0) should normalize to +0");

    // Index steps
    if (toDuration("10i") !== 10) throw new Error("toDuration('10i') failed");
    if (toDuration(50, { to: "i" }) !== 50) throw new Error("toDuration(50, { to: 'i' }) failed");

    // Invalid inputs return NaN
    if (!Number.isNaN(toDuration("invalid"))) throw new Error("toDuration('invalid') should return NaN");
    if (!Number.isNaN(toDuration(true as any))) throw new Error("toDuration(true) should return NaN");
    if (!Number.isNaN(toDuration(Infinity))) throw new Error("toDuration(Infinity) should return NaN");

    console.log("✓ toDuration tests passed!");
} catch (err: any) {
    console.error(`❌ toDuration test failed: ${err.message}`);
    process.exit(1);
}
