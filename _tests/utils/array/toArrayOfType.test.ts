declare const process: any;
import { toArrayOfType } from "../../../src/utils/array";

try {
    const strArr1 = toArrayOfType<string>(null, "string");
    if (!Array.isArray(strArr1) || strArr1.length !== 0) throw new Error("null failed");

    const strArr2 = toArrayOfType<string>([1, "hello", null, undefined], "string");
    if (strArr2.length !== 4 || strArr2[0] !== "1" || strArr2[1] !== "hello" || strArr2[2] !== "null" || strArr2[3] !== "undefined") {
        throw new Error("string conversion failed");
    }

    const numArr = toArrayOfType<number>(["10", 20, "30"], "number");
    if (numArr.length !== 3 || numArr[0] !== 10 || numArr[1] !== 20 || numArr[2] !== 30) {
        throw new Error("number conversion failed");
    }

    const boolArr = toArrayOfType<boolean>([1, 0, ""], "boolean");
    if (boolArr.length !== 3 || boolArr[0] !== true || boolArr[1] !== false || boolArr[2] !== false) {
        throw new Error("boolean conversion failed");
    }

    const nullPreserved = toArrayOfType<string | null>([10, null, 20], "string", { allowNulls: true });
    if (nullPreserved.length !== 3 || nullPreserved[0] !== "10" || nullPreserved[1] !== null || nullPreserved[2] !== "20") {
        throw new Error("allowNulls preservation failed");
    }

    const dateArr = toArrayOfType<Date>(["2025-01-01"], "date");
    if (dateArr.length !== 1 || !(dateArr[0] instanceof Date)) {
        throw new Error("date conversion failed");
    }
    console.log("✓ toArrayOfType tests passed!");
} catch (err: any) {
    console.error(`❌ toArrayOfType test failed: ${err.message}`);
    process.exit(1);
}
