declare const process: any;
import { compareScalarValues } from "../../../src/utils/array";

try {
    if (compareScalarValues(1, 2) >= 0) throw new Error("1 smaller than 2 failed");
    if (compareScalarValues(2, 1) <= 0) throw new Error("2 greater than 1 failed");
    if (compareScalarValues(5, 5) !== 0) throw new Error("5 === 5 failed");

    if (compareScalarValues("a", "b") >= 0) throw new Error("'a' smaller than 'b' failed");
    if (compareScalarValues("b", "a") <= 0) throw new Error("'b' greater than 'a' failed");

    // By default, nullsLast is true, so null is placed after non-null
    if (compareScalarValues(null, 1) <= 0) throw new Error("null should be greater than 1 with nullsLast: true");
    if (compareScalarValues(1, null) >= 0) throw new Error("1 should be less than null with nullsLast: true");
    if (compareScalarValues(null, null) !== 0) throw new Error("null === null failed");

    // With nullsLast: false
    if (compareScalarValues(null, 1, { nullsLast: false }) >= 0) throw new Error("null should be less than 1 with nullsLast: false");
    if (compareScalarValues(1, null, { nullsLast: false }) <= 0) throw new Error("1 should be greater than null with nullsLast: false");

    console.log("✓ compareScalarValues tests passed!");
} catch (err: any) {
    console.error(`❌ compareScalarValues test failed: ${err.message}`);
    process.exit(1);
}
