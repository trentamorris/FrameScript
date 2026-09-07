declare const process: any;
import { shiftArray } from "../../../src/utils/array";

try {
    const arr = [1, 2, 3, 4];
    const shiftedFwd = shiftArray(arr, 1);
    if (shiftedFwd.length !== 4 || shiftedFwd[0] !== null || shiftedFwd[1] !== 1 || shiftedFwd[3] !== 3) {
        throw new Error("shift forward failed: " + JSON.stringify(shiftedFwd));
    }

    const shiftedBack = shiftArray(arr, -1);
    if (shiftedBack.length !== 4 || shiftedBack[0] !== 2 || shiftedBack[3] !== null) {
        throw new Error("shift backward failed: " + JSON.stringify(shiftedBack));
    }

    const shiftZero = shiftArray(arr, 0);
    if (shiftZero[0] !== 1 || shiftZero[3] !== 4) throw new Error("shift 0 failed");

    console.log("✓ shiftArray tests passed!");
} catch (err: any) {
    console.error(`❌ shiftArray test failed: ${err.message}`);
    process.exit(1);
}
