declare const process: any;
import { reduceBitwise } from "../../../src/utils/array";

try {
    const andRes = reduceBitwise([12, 10], (a, b) => a & b);
    if (andRes !== 8) throw new Error(`Expected 8, got ${andRes}`);

    const orRes = reduceBitwise([4, 2], (a, b) => a | b);
    if (orRes !== 6) throw new Error(`Expected 6, got ${orRes}`);

    if (reduceBitwise([], (a, b) => a & b) !== null) throw new Error("Empty array should return null");

    console.log("✓ reduceBitwise tests passed!");
} catch (err: any) {
    console.error(`❌ reduceBitwise test failed: ${err.message}`);
    process.exit(1);
}
