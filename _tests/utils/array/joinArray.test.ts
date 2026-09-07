declare const process: any;
import { joinArray } from "../../../src/utils/array";

try {
    if (joinArray([1, 2, 3]) !== "1,2,3") throw new Error("Expected '1,2,3'");
    if (joinArray(["a", "b", "c"], " - ") !== "a - b - c") throw new Error("Expected 'a - b - c'");
    if (joinArray([1, null, 2, undefined, 3], "-") !== "1--2--3") throw new Error("Expected '1--2--3'");
    if (joinArray([1, null, 2, undefined, 3], "-", { ignoreNulls: true }) !== "1-2-3") throw new Error("Expected '1-2-3'");
    if (joinArray([1, null, 2, undefined, 3], "-", { nullValue: "NULL" }) !== "1-NULL-2-NULL-3") throw new Error("Expected '1-NULL-2-NULL-3'");
    if (joinArray([1, 2, 3], ",", { prefix: "[", suffix: "]" }) !== "[1,2,3]") throw new Error("Expected '[1,2,3]'");
    if (joinArray([1, 2, 3, 4], ",", { limit: 2 }) !== "1,2...") throw new Error("Expected '1,2...'");

    console.log("✓ joinArray tests passed!");
} catch (err: any) {
    console.error(`❌ joinArray test failed: ${err.message}`);
    process.exit(1);
}
