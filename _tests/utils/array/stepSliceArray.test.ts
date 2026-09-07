declare const process: any;
import { stepSliceArray } from "../../../src/utils/array";

try {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const stepped = stepSliceArray(arr, { offsetStart: 0, offsetEnd: 10, step: 2 });
    if (!stepped || stepped.length !== 5 || stepped[0] !== 0 || stepped[1] !== 2 || stepped[4] !== 8) {
        throw new Error("step 2 failed: " + JSON.stringify(stepped));
    }

    const step3 = stepSliceArray(arr, { offsetStart: 1, offsetEnd: 8, step: 3 });
    if (!step3 || step3.length !== 3 || step3[0] !== 1 || step3[1] !== 4 || step3[2] !== 7) {
        throw new Error("step 3 failed: " + JSON.stringify(step3));
    }

    const empty = stepSliceArray([], { offsetStart: 0, offsetEnd: 5, step: 1 });
    if (!empty || empty.length !== 0) throw new Error("empty array slice failed");

    console.log("✓ stepSliceArray tests passed!");
} catch (err: any) {
    console.error(`❌ stepSliceArray test failed: ${err.message}`);
    process.exit(1);
}
