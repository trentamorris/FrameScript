declare const process: any;
import { getArrayElement } from "../../../src/utils/array";

try {
    const arr = [10, 20, 30];
    if (getArrayElement(arr, 0, false) !== 10) throw new Error("index 0 failed");
    if (getArrayElement(arr, 2, false) !== 30) throw new Error("index 2 failed");
    if (getArrayElement(arr, -1, false) !== 30) throw new Error("index -1 failed");
    if (getArrayElement(arr, -3, false) !== 10) throw new Error("index -3 failed");

    if (getArrayElement(arr, 5, true) !== null) throw new Error("nullOnOob: true positive failed");
    if (getArrayElement(arr, -5, true) !== null) throw new Error("nullOnOob: true negative failed");

    let threw = false;
    try {
        getArrayElement(arr, 5, false);
    } catch {
        threw = true;
    }
    if (!threw) throw new Error("nullOnOob: false should throw on positive OOB");

    threw = false;
    try {
        getArrayElement(arr, -4, false);
    } catch {
        threw = true;
    }
    if (!threw) throw new Error("nullOnOob: false should throw on negative OOB");

    console.log("✓ getArrayElement tests passed!");
} catch (err: any) {
    console.error(`❌ getArrayElement test failed: ${err.message}`);
    process.exit(1);
}
