declare const process: any;
import { fillSequence } from "../../../src/utils/array";

try {
    const seq1 = new Array(5);
    fillSequence(seq1, 0, { step: 1 });
    if (seq1.length !== 5 || seq1[0] !== 0 || seq1[4] !== 4) {
        throw new Error("seq 0..4 failed: " + JSON.stringify(seq1));
    }

    const seq2 = new Array(3);
    fillSequence(seq2, 10, { step: 5 });
    if (seq2.length !== 3 || seq2[0] !== 10 || seq2[1] !== 15 || seq2[2] !== 20) {
        throw new Error("seq 10, 15, 20 failed: " + JSON.stringify(seq2));
    }

    const seqEmpty: any[] = [];
    fillSequence(seqEmpty, 0);
    if (seqEmpty.length !== 0) throw new Error("0 length sequence failed");

    console.log("✓ fillSequence tests passed!");
} catch (err: any) {
    console.error(`❌ fillSequence test failed: ${err.message}`);
    process.exit(1);
}
