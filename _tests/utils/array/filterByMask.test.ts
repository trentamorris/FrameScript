declare const process: any;
import { filterByMask } from "../../../src/utils/array";

try {
    if (JSON.stringify(filterByMask([10, 20, 30, 40], [true, false, true, false])) !== JSON.stringify([10, 30])) {
        throw new Error("filterByMask boolean array failed");
    }
    if (JSON.stringify(filterByMask([1, 2, 3], true)) !== JSON.stringify([1, 2, 3])) {
        throw new Error("filterByMask scalar true failed");
    }
    if (JSON.stringify(filterByMask([1, 2, 3], false)) !== JSON.stringify([])) {
        throw new Error("filterByMask scalar false failed");
    }
    if (JSON.stringify(filterByMask([], [true, true])) !== JSON.stringify([])) {
        throw new Error("filterByMask empty array failed");
    }
    if (JSON.stringify(filterByMask(null, [true])) !== JSON.stringify([])) {
        throw new Error("filterByMask null array failed");
    }
    if (JSON.stringify(filterByMask([10, 20, 30, 40], [true, false, true, false], { nullify: true })) !== JSON.stringify([10, null, 30, null])) {
        throw new Error("filterByMask nullify option failed");
    }
    if (JSON.stringify(filterByMask([1, 2], false, { nullify: true })) !== JSON.stringify([null, null])) {
        throw new Error("filterByMask nullify scalar false failed");
    }

    console.log("✓ filterByMask tests passed!");
} catch (err: any) {
    console.error(`❌ filterByMask test failed: ${err.message}`);
    process.exit(1);
}
