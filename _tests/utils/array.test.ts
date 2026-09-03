declare const process: any;
import {
    getArrayStats,
    computeQuantile,
    computeMode,
    sortArray,
    isArrayOfType,
    toValidArray,
    toArrayOfType,
    getUniqueArrayStats,
    joinArray,
    filterByMask
} from "../../src/utils/array";

console.log("=========================================");
console.log("STARTING ARRAY UTILS TESTS...");
console.log("=========================================");

try {
    // 1. Test getArrayStats with NaN elements
    const statsWithNaN = getArrayStats([NaN, 5, 2, NaN, 8]);
    if (statsWithNaN.min !== 2) {
        throw new Error(`Expected min to be 2, got ${statsWithNaN.min}`);
    }
    if (statsWithNaN.max !== 8) {
        throw new Error(`Expected max to be 8, got ${statsWithNaN.max}`);
    }
    if (statsWithNaN.nullCount !== 2) {
        throw new Error(`Expected nullCount to be 2, got ${statsWithNaN.nullCount}`);
    }
    if (statsWithNaN.count !== 3) {
        throw new Error(`Expected count to be 3, got ${statsWithNaN.count}`);
    }
    if (statsWithNaN.sum !== 15) {
        throw new Error(`Expected sum to be 15, got ${statsWithNaN.sum}`);
    }
    if (!statsWithNaN.isNumeric) {
        throw new Error(`Expected isNumeric to be true, got ${statsWithNaN.isNumeric}`);
    }
    console.log("✓ getArrayStats NaN exclusion and nullCount tracking passed");

    // 1b. Test getArrayStats with non-finite elements (Infinity, -Infinity)
    const statsWithInfinity = getArrayStats([Infinity, 5, 2, -Infinity]);
    if (statsWithInfinity.min !== -Infinity) {
        throw new Error(`Expected min to be -Infinity, got ${statsWithInfinity.min}`);
    }
    if (statsWithInfinity.max !== Infinity) {
        throw new Error(`Expected max to be Infinity, got ${statsWithInfinity.max}`);
    }
    if (statsWithInfinity.nullCount !== 0) {
        throw new Error(`Expected nullCount to be 0, got ${statsWithInfinity.nullCount}`);
    }
    if (statsWithInfinity.count !== 2) {
        throw new Error(`Expected count to be 2, got ${statsWithInfinity.count}`);
    }
    if (statsWithInfinity.sum !== 7) {
        throw new Error(`Expected sum to be 7, got ${statsWithInfinity.sum}`);
    }
    console.log("✓ getArrayStats Infinity/non-finite boundaries retention passed");

    // 2. Test coercion in computeQuantile
    const mixedNumericArray = ["10", true, 20, new Date(30000), false];
    const median = computeQuantile(mixedNumericArray, 0.5);
    if (median !== 10) {
        throw new Error(`Expected median to be 10, got ${median}`);
    }

    const q75 = computeQuantile(mixedNumericArray, 0.75);
    if (q75 !== 20) {
        throw new Error(`Expected quantile 0.75 to be 20, got ${q75}`);
    }
    console.log("✓ computeQuantile type coercion passed");

    // 3. Test computeMode skipping NaN
    const modesWithNaN = computeMode([NaN, 5, 5, NaN, NaN, 2, 2]);
    if (!modesWithNaN || modesWithNaN.length !== 2 || modesWithNaN[0] !== 2 || modesWithNaN[1] !== 5) {
        throw new Error(`Expected modes to be [2, 5], got ${JSON.stringify(modesWithNaN)}`);
    }
    console.log("✓ computeMode NaN exclusion passed");

    // 4. Test isArrayOfType
    if (!isArrayOfType([1, 2, 3], "number")) throw new Error("Expected [1, 2, 3] to be of type 'number'");
    if (isArrayOfType([1, 2, null], "number")) throw new Error("Expected [1, 2, null] to not be of type 'number'");
    if (isArrayOfType([1, "2", 3], "number")) throw new Error("Expected [1, '2', 3] to not be of type 'number'");

    if (!isArrayOfType(["a", "b", "c"], "string")) throw new Error("Expected ['a', 'b', 'c'] to be of type 'string'");
    if (isArrayOfType(["a", "b", null], "string")) throw new Error("Expected ['a', 'b', null] to not be of type 'string'");
    if (isArrayOfType(["a", 1, "c"], "string")) throw new Error("Expected ['a', 1, 'c'] to not be of type 'string'");

    if (!isArrayOfType([true, false], "boolean")) throw new Error("Expected [true, false] to be of type 'boolean'");
    if (isArrayOfType([true, false, null], "boolean")) throw new Error("Expected [true, false, null] to not be of type 'boolean'");

    if (!isArrayOfType([new Date()], "date")) throw new Error("Expected Date array to be of type 'date'");
    if (isArrayOfType([new Date(), null], "date")) throw new Error("Expected Date array with null to not be of type 'date'");

    if (!isArrayOfType([{ a: 1 }, { b: 2 }], "object")) throw new Error("Expected Object array to be of type 'object'");
    if (isArrayOfType([{ a: 1 }, null], "object")) throw new Error("Expected Object array with null to not be of type 'object'");

    const isEven = (v: any) => typeof v === "number" && v % 2 === 0;
    if (!isArrayOfType([2, 4, 6], isEven)) throw new Error("Expected [2, 4, 6] to satisfy isEven");
    if (isArrayOfType([2, 5, 6], isEven)) throw new Error("Expected [2, 5, 6] to not satisfy isEven");

    class TestClass { }
    class SubClass extends TestClass { }
    class OtherClass { }
    const obj1 = new TestClass();
    const obj2 = new SubClass();
    const obj3 = new OtherClass();
    if (!isArrayOfType([obj1, obj2], TestClass)) throw new Error("Expected [obj1, obj2] to be of class TestClass");
    if (isArrayOfType([obj1, obj3], TestClass)) throw new Error("Expected [obj1, obj3] to not be of class TestClass");

    if (isArrayOfType(42, "number")) throw new Error("Expected scalar to fail isArrayOfType");

    if (!isArrayOfType([1, "2", "3"], "number", { mode: "some" })) throw new Error("Expected [1, '2', '3'] to have some 'number'");
    if (isArrayOfType(["1", "2", "3"], "number", { mode: "some" })) throw new Error("Expected ['1', '2', '3'] to not have some 'number'");

    if (!isArrayOfType([1, 2, null, 3], "number", { allowNulls: true })) throw new Error("Expected [1, 2, null, 3] to match 'number' with allowNulls");
    if (!isArrayOfType([], "number")) throw new Error("Expected empty array to match by default");
    if (isArrayOfType([], "number", { allowEmpty: false })) throw new Error("Expected empty array to fail with allowEmpty: false");

    // 5. Test toValidArray
    const arrNull = toValidArray(null);
    if (!Array.isArray(arrNull) || arrNull.length !== 0) throw new Error("Expected null to return empty array");
    const arrUndef = toValidArray(undefined);
    if (!Array.isArray(arrUndef) || arrUndef.length !== 0) throw new Error("Expected undefined to return empty array");

    const inputArr = [1, 2, 3];
    const arrCopied = toValidArray(inputArr);
    if (arrCopied === inputArr) throw new Error("Expected array input to return a new shallow copy reference");
    if (arrCopied.length !== 3 || arrCopied[0] !== 1 || arrCopied[1] !== 2 || arrCopied[2] !== 3) {
        throw new Error("Expected shallow copy to contain same elements");
    }

    const typedArr = new Int32Array([10, 20]);
    const arrFromTyped = toValidArray(typedArr as any);
    if (!Array.isArray(arrFromTyped) || arrFromTyped[0] !== 10 || arrFromTyped[1] !== 20) {
        throw new Error("Expected typed array to be converted to standard array");
    }

    const arrScalar = toValidArray(42);
    if (!Array.isArray(arrScalar) || arrScalar.length !== 1 || arrScalar[0] !== 42) {
        throw new Error("Expected scalar to be wrapped in a single-element array");
    }

    // 6. Test toArrayOfType
    const strArr1 = toArrayOfType<string>(null, "string");
    if (!Array.isArray(strArr1) || strArr1.length !== 0) throw new Error("Expected toArrayOfType(null, 'string') to return []");

    const strArr2 = toArrayOfType<string>([1, "hello", null, undefined], "string");
    if (strArr2.length !== 4 || strArr2[0] !== "1" || strArr2[1] !== "hello" || strArr2[2] !== "null" || strArr2[3] !== "undefined") {
        throw new Error("Expected elements to be converted to strings");
    }

    const numArr = toArrayOfType<number>(["10", 20, "30"], "number");
    if (numArr.length !== 3 || numArr[0] !== 10 || numArr[1] !== 20 || numArr[2] !== 30) {
        throw new Error("Expected elements to be converted to numbers");
    }

    const boolArr = toArrayOfType<boolean>([1, 0, ""], "boolean");
    if (boolArr.length !== 3 || boolArr[0] !== true || boolArr[1] !== false || boolArr[2] !== false) {
        throw new Error("Expected elements to be converted to booleans");
    }

    const nullPreserved = toArrayOfType<string | null>([10, null, 20], "string", { allowNulls: true });
    if (nullPreserved.length !== 3 || nullPreserved[0] !== "10" || nullPreserved[1] !== null || nullPreserved[2] !== "20") {
        throw new Error("Expected null to be preserved when allowNulls is true");
    }

    const dateArr = toArrayOfType<Date>(["2025-01-01"], "date");
    if (dateArr.length !== 1 || !(dateArr[0] instanceof Date)) {
        throw new Error("Expected string date to be coerced to Date instance");
    }

    // 7. Test getUniqueArrayStats
    const stats1 = getUniqueArrayStats([1, 2, 2, 3, 3, 3]);
    if (stats1.count !== 3) throw new Error("Expected count to be 3");
    if (stats1.values.length !== 3) throw new Error("Expected 3 unique values");
    if (!stats1.frequencies || stats1.frequencies.get(3) !== 3) throw new Error("Expected freq of 3 to be 3");

    const objA = { id: 1 };
    const objB = { id: 1 };
    const objC = { id: 2 };
    const stats2 = getUniqueArrayStats([objA, objB, objC], { strict: true });
    if (stats2.count !== 2) throw new Error("Expected strict count to be 2");

    // 8. Test joinArray
    if (joinArray([1, 2, 3]) !== "1,2,3") throw new Error("Expected '1,2,3'");
    if (joinArray(["a", "b", "c"], " - ") !== "a - b - c") throw new Error("Expected 'a - b - c'");
    if (joinArray([1, null, 2, undefined, 3], "-") !== "1--2--3") throw new Error("Expected '1--2--3'");
    if (joinArray([1, null, 2, undefined, 3], "-", { ignoreNulls: true }) !== "1-2-3") throw new Error("Expected '1-2-3'");
    if (joinArray([1, null, 2, undefined, 3], "-", { nullValue: "NULL" }) !== "1-NULL-2-NULL-3") throw new Error("Expected '1-NULL-2-NULL-3'");
    if (joinArray([1, 2, 3], ",", { prefix: "[", suffix: "]" }) !== "[1,2,3]") throw new Error("Expected '[1,2,3]'");
    if (joinArray([1, 2, 3, 4], ",", { limit: 2 }) !== "1,2...") throw new Error("Expected '1,2...'");

    // 9. Test sortArray
    const mixedTypes = ["banana", 10, true, "apple", 2, false];
    const sortedMixed = sortArray(mixedTypes);
    const expectedSorted = [false, true, 2, 10, "apple", "banana"];
    for (let i = 0; i < expectedSorted.length; i++) {
        if (sortedMixed[i] !== expectedSorted[i]) {
            throw new Error(`Expected sortedMixed[${i}] to be ${expectedSorted[i]}, got ${sortedMixed[i]}`);
        }
    }

    const sortedMixedDesc = sortArray(mixedTypes, { descending: true });
    const expectedSortedDesc = [true, false, 10, 2, "banana", "apple"];
    for (let i = 0; i < expectedSortedDesc.length; i++) {
        if (sortedMixedDesc[i] !== expectedSortedDesc[i]) {
            throw new Error(`Expected sortedMixedDesc[${i}] to be ${expectedSortedDesc[i]}, got ${sortedMixedDesc[i]}`);
        }
    }

    // 10. Test filterByMask
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

    console.log("✓ Array utils tests passed successfully!");
} catch (err: any) {
    console.error(`❌ Array utils test failed: ${err.message}`);
    process.exit(1);
}
