declare const process: any;
import { FIXED_DURATION_UNITS } from "../../../src/utils/duration";

try {
    if (FIXED_DURATION_UNITS.ms !== 1) throw new Error("FIXED_DURATION_UNITS.ms should be 1");
    if (FIXED_DURATION_UNITS.s !== 1000) throw new Error("FIXED_DURATION_UNITS.s should be 1000");
    if (FIXED_DURATION_UNITS.m !== 60000) throw new Error("FIXED_DURATION_UNITS.m should be 60000");
    if (FIXED_DURATION_UNITS.h !== 3600000) throw new Error("FIXED_DURATION_UNITS.h should be 3600000");
    if (FIXED_DURATION_UNITS.d !== 86400000) throw new Error("FIXED_DURATION_UNITS.d should be 86400000");
    if (FIXED_DURATION_UNITS.w !== 604800000) throw new Error("FIXED_DURATION_UNITS.w should be 604800000");
    if (FIXED_DURATION_UNITS.us !== 0.001) throw new Error("FIXED_DURATION_UNITS.us should be 0.001");
    if (FIXED_DURATION_UNITS.ns !== 0.000001) throw new Error("FIXED_DURATION_UNITS.ns should be 0.000001");

    console.log("✓ FIXED_DURATION_UNITS tests passed!");
} catch (err: any) {
    console.error(`❌ FIXED_DURATION_UNITS test failed: ${err.message}`);
    process.exit(1);
}
