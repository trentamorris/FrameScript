declare const process: any;
import { computeCartesianProduct } from "../../../src/utils/array";

try {
    const prod = computeCartesianProduct(2, 3);
    if (!prod || prod.leftIndices.length !== 6 || prod.rightIndices.length !== 6) {
        throw new Error("Cartesian product length should be 6");
    }
    if (prod.leftIndices[0] !== 0 || prod.rightIndices[0] !== 0) throw new Error("prod[0] mismatch");
    if (prod.leftIndices[5] !== 1 || prod.rightIndices[5] !== 2) throw new Error("prod[5] mismatch");

    const emptyProd = computeCartesianProduct(0, 5);
    if (emptyProd.leftIndices.length !== 0) throw new Error("empty cartesian product failed");

    console.log("✓ computeCartesianProduct tests passed!");
} catch (err: any) {
    console.error(`❌ computeCartesianProduct test failed: ${err.message}`);
    process.exit(1);
}
