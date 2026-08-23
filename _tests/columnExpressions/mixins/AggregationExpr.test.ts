import { $df, DataFrame } from "../../../src/index";

console.log("=========================================");
console.log("STARTING AGGREGATION EXPRESSION TESTS...");
console.log("=========================================");

try {
    // ------------------------------------------------------------------------
    // 1. null_count, corr, cov, dot, spearman_corr, w_avg
    // ------------------------------------------------------------------------
    const data = [
        { x: 1, y: 2, group: "A" },
        { x: 2, y: 4, group: "A" },
        { x: 3, y: null, group: "A" }, // y is null
        { x: null, y: 8, group: "B" }, // x is null
        { x: 5, y: 10, group: "B" },
        { x: 6, y: 12, group: "B" }
    ];

    const df = $df.data(data);

    const globalRes = df.select([
        $df.col("x").null_count().alias("x_null_count"),
        $df.col("y").null_count().alias("y_null_count"),
        $df.col("x").cov($df.col("y")).alias("xy_cov"),
        $df.col("x").corr($df.col("y")).alias("xy_corr"),
        $df.col("x").dot($df.col("y")).alias("xy_dot"),
        $df.col("x").spearman_corr($df.col("y")).alias("xy_spearman"),
        $df.col("x").w_avg($df.col("y")).alias("xy_w_avg")
    ]).toDicts() as any[];

    console.log("Global Aggregation Results:", globalRes);
    const rGlobal = globalRes[0];
    if (rGlobal.x_null_count !== 1) throw new Error("global x_null_count failed");
    if (rGlobal.y_null_count !== 1) throw new Error("global y_null_count failed");

    // Math check for xy_cov and xy_corr:
    // Valid pairs:
    // row 0: [1, 2]
    // row 1: [2, 4]
    // row 4: [5, 10]
    // row 5: [6, 12]
    // Mean X = (1 + 2 + 5 + 6)/4 = 3.5
    // Mean Y = (2 + 4 + 10 + 12)/4 = 7
    // Covariance sum: (1-3.5)*(2-7) + (2-3.5)*(4-7) + (5-3.5)*(10-7) + (6-3.5)*(12-7)
    // = (-2.5)*(-5) + (-1.5)*(-3) + (1.5)*(3) + (2.5)*(5)
    // = 12.5 + 4.5 + 4.5 + 12.5 = 34
    // N = 4, Covariance = 34 / (4 - 1) = 34 / 3 = 11.333333...
    // Correlation: XY are perfectly linear (Y = 2X), so Correlation should be 1.0!
    // Dot product: 1*2 + 2*4 + 5*10 + 6*12 = 132
    // Spearman correlation: XY are perfectly monotonic, so rank correlation should be 1.0
    // Weighted Average: 132 / 28 = 4.714285714...
    if (Math.abs(rGlobal.xy_cov - 34/3) > 1e-6) throw new Error(`global xy_cov failed: ${rGlobal.xy_cov}`);
    if (Math.abs(rGlobal.xy_corr - 1.0) > 1e-6) throw new Error(`global xy_corr failed: ${rGlobal.xy_corr}`);
    if (rGlobal.xy_dot !== 132) throw new Error(`global xy_dot failed: ${rGlobal.xy_dot}`);
    if (Math.abs(rGlobal.xy_spearman - 1.0) > 1e-6) throw new Error(`global xy_spearman failed: ${rGlobal.xy_spearman}`);
    if (Math.abs(rGlobal.xy_w_avg - 132/28) > 1e-6) throw new Error(`global xy_w_avg failed: ${rGlobal.xy_w_avg}`);

    // Grouped null_count, corr, and cov
    const groupedRes = df.groupBy("group").agg([
        $df.col("x").null_count().alias("x_null_count"),
        $df.col("y").null_count().alias("y_null_count"),
        $df.col("x").cov($df.col("y")).alias("xy_cov"),
        $df.col("x").corr($df.col("y")).alias("xy_corr")
    ]).toDicts() as any[];

    console.log("Grouped Aggregation Results:", groupedRes);
    
    const groupA = groupedRes.find(r => r.group === "A");
    const groupB = groupedRes.find(r => r.group === "B");

    if (!groupA || !groupB) throw new Error("grouped results missing groups");

    if (groupA.x_null_count !== 0) throw new Error("group A x_null_count failed");
    if (groupA.y_null_count !== 1) throw new Error("group A y_null_count failed");
    if (Math.abs(groupA.xy_cov - 1.0) > 1e-6) throw new Error(`group A xy_cov failed: ${groupA.xy_cov}`);
    if (Math.abs(groupA.xy_corr - 1.0) > 1e-6) throw new Error(`group A xy_corr failed: ${groupA.xy_corr}`);

    if (groupB.x_null_count !== 1) throw new Error("group B x_null_count failed");
    if (groupB.y_null_count !== 0) throw new Error("group B y_null_count failed");
    if (Math.abs(groupB.xy_cov - 1.0) > 1e-6) throw new Error(`group B xy_cov failed: ${groupB.xy_cov}`);
    if (Math.abs(groupB.xy_corr - 1.0) > 1e-6) throw new Error(`group B xy_corr failed: ${groupB.xy_corr}`);

    // null_count as a window function
    const windowRes = df.select([
        $df.col("group"),
        $df.col("x").null_count().over("group").alias("x_null_by_group")
    ]).toDicts() as any[];

    if (windowRes[0].x_null_by_group !== 0) throw new Error("window group A null count failed");
    if (windowRes[3].x_null_by_group !== 1) throw new Error("window group B null count failed");

    // Non-linear monotonic data (Pearson vs Spearman)
    const nonLinearData = [
        { a: 1, b: 1 },
        { a: 2, b: 10 },
        { a: 3, b: 100 },
        { a: 4, b: 1000 }
    ];
    const nldf = $df.data(nonLinearData);
    const nlRes = nldf.select([
        $df.col("a").corr($df.col("b")).alias("pearson"),
        $df.col("a").spearman_corr($df.col("b")).alias("spearman")
    ]).toDicts()[0] as any;
    
    if (nlRes.pearson > 0.95) throw new Error(`Pearson correlation too high: ${nlRes.pearson}`);
    if (Math.abs(nlRes.spearman - 1.0) > 1e-6) throw new Error(`Spearman rank correlation failed: ${nlRes.spearman}`);

    // Cosine Similarity
    const vectorData = [
        { a: 1, b: 2 },
        { a: 2, b: 4 },
        { a: 3, b: 6 }
    ];
    const vdf = $df.data(vectorData);
    const cosSimExpr = $df.col("a").dot($df.col("b")).div(
        ($df.col("a").dot($df.col("a"))).sqrt().mul(($df.col("b").dot($df.col("b"))).sqrt())
    );
    const cosRes = vdf.select([
        cosSimExpr.alias("cos_sim")
    ]).toDicts()[0] as any;
    
    if (Math.abs(cosRes.cos_sim - 1.0) > 1e-6) throw new Error(`Cosine Similarity failed: ${cosRes.cos_sim}`);

    const orthogonalData = [
        { a: 3, b: 0 },
        { a: 0, b: 4 }
    ];
    const odf = $df.data(orthogonalData);
    const cosResOrth = odf.select([
        cosSimExpr.alias("cos_sim")
    ]).toDicts()[0] as any;
    if (Math.abs(cosResOrth.cos_sim - 0.0) > 1e-6) throw new Error(`Orthogonal Cosine Similarity failed: ${cosResOrth.cos_sim}`);

    // Weighted Variance
    const weightData = [
        { x: 10, weights: 1 },
        { x: 20, weights: 2 },
        { x: 30, weights: 1 }
    ];
    const wdf = $df.data(weightData);
    
    const meanExpr = $df.col("x").w_avg($df.col("weights"));
    const diffSqExpr = $df.col("x").sub(meanExpr).pow(2);
    const weightedVarExpr = diffSqExpr.dot($df.col("weights")).div($df.col("weights").sum());

    const wVarRes = wdf.select([
        weightedVarExpr.alias("weighted_variance")
    ]).toDicts()[0] as any;

    if (Math.abs(wVarRes.weighted_variance - 50.0) > 1e-6) throw new Error(`Weighted Variance failed: ${wVarRes.weighted_variance}`);

    // Cancelling Weights
    const cancelWeightData = [
        { x: 10, weights: -5 },
        { x: 20, weights: 5 }
    ];
    const cwdf = $df.data(cancelWeightData);
    const cwRes = cwdf.select([
        $df.col("x").w_avg($df.col("weights")).alias("w_avg")
    ]).toDicts()[0] as any;
    if (cwRes.w_avg !== null) throw new Error(`Cancelling weights should return null: ${cwRes.w_avg}`);

    // ------------------------------------------------------------------------
    // 2. argMin and argMax
    // ------------------------------------------------------------------------
    const dfArg = new DataFrame({ val: [10, 50, 20] });
    const resArgMax = dfArg.select($df.col("val").argMax().alias("max_idx")).toDict();
    if (resArgMax.max_idx[0] !== 1) throw new Error(`Expected argMax 1, got ${resArgMax.max_idx[0]}`);

    const resArgMin = dfArg.select($df.col("val").argMin().alias("min_idx")).toDict();
    if (resArgMin.min_idx[0] !== 0) throw new Error(`Expected argMin 0, got ${resArgMin.min_idx[0]}`);

    // ------------------------------------------------------------------------
    // 3. Bitwise Aggregations
    // ------------------------------------------------------------------------
    const dfBit = new DataFrame({ val: [0b110, 0b011] }); // 6 and 3
    const resBitAnd = dfBit.select($df.col("val").bitwiseAnd().alias("res")).toDict();
    if (resBitAnd.res[0] !== 2) throw new Error(`Expected bitwiseAnd 2, got ${resBitAnd.res[0]}`);

    const resBitOr = dfBit.select($df.col("val").bitwiseOr().alias("res")).toDict();
    if (resBitOr.res[0] !== 7) throw new Error(`Expected bitwiseOr 7, got ${resBitOr.res[0]}`);

    const resBitXor = dfBit.select($df.col("val").bitwiseXor().alias("res")).toDict();
    if (resBitXor.res[0] !== 5) throw new Error(`Expected bitwiseXor 5, got ${resBitXor.res[0]}`);

    const dfLargeBit = new DataFrame({ val: [3000000000, 1] });
    const resLargeOr = dfLargeBit.select($df.col("val").bitwiseOr().alias("res")).toDict();
    if (resLargeOr.res[0] !== 3000000001) throw new Error(`Expected large bitwiseOr 3000000001, got ${resLargeOr.res[0]}`);

    // ------------------------------------------------------------------------
    // 4. Kurtosis
    // ------------------------------------------------------------------------
    const dfKurt = $df.data({
        a: [1, 2, 3, 4, 5],
        b: [1, 1, 1, 1, 1]
    });

    const resKurtDef = dfKurt.select($df.col("a").kurtosis().alias("kurt_def")).toDicts();
    const g2 = resKurtDef[0].kurt_def;
    if (Math.abs(g2 - (-1.3)) > 1e-4) throw new Error(`kurtosis default failed: ${g2}`);

    const resPearson = dfKurt.select($df.col("a").kurtosis({ fisher: false }).alias("kurt_pearson")).toDicts();
    const a4 = resPearson[0].kurt_pearson;
    if (Math.abs(a4 - 1.7) > 1e-4) throw new Error(`kurtosis pearson failed: ${a4}`);

    const resUnbiased = dfKurt.select($df.col("a").kurtosis({ bias: false }).alias("kurt_unbiased")).toDicts();
    const G2 = resUnbiased[0].kurt_unbiased;
    if (Math.abs(G2 - (-1.2)) > 1e-4) throw new Error(`kurtosis unbiased failed: ${G2}`);

    const resUnbiasedPearson = dfKurt.select($df.col("a").kurtosis({ fisher: false, bias: false }).alias("kurt_unbiased_pearson")).toDicts();
    const G2Pearson = resUnbiasedPearson[0].kurt_unbiased_pearson;
    if (Math.abs(G2Pearson - 1.8) > 1e-4) throw new Error(`unbiased Pearson kurtosis failed: ${G2Pearson}`);

    const df3Kurt = $df.data({ val: [1, 2, 10] });
    const resN3Biased = df3Kurt.select($df.col("val").kurtosis({ bias: true }).alias("kurt_n3_biased")).toDicts();
    if (Math.abs(resN3Biased[0].kurt_n3_biased - (-1.5)) > 1e-4) throw new Error(`N=3 biased kurtosis failed: ${resN3Biased[0].kurt_n3_biased}`);

    const resN3Unbiased = df3Kurt.select($df.col("val").kurtosis({ bias: false }).alias("kurt_n3_unbiased")).toDicts();
    if (resN3Unbiased[0].kurt_n3_unbiased !== null) throw new Error(`N=3 unbiased kurtosis should return null, got: ${resN3Unbiased[0].kurt_n3_unbiased}`);

    const resZeroVar = dfKurt.select($df.col("b").kurtosis().alias("kurt_zero")).toDicts();
    if (resZeroVar[0].kurt_zero !== null) throw new Error(`kurtosis zero variance failed: ${resZeroVar[0].kurt_zero}`);

    // ------------------------------------------------------------------------
    // 5. maxBy and minBy
    // ------------------------------------------------------------------------
    const dfMaxMin = $df.data({
        name: ["alice", "bob", "charlie"],
        score: [10, 50, 20]
    });
    const resMaxMin = dfMaxMin.select([
        $df.col("name").maxBy($df.col("score")).alias("max_name"),
        $df.col("name").minBy($df.col("score")).alias("min_name")
    ]).toDicts();
    if (resMaxMin[0].max_name !== "bob" || resMaxMin[0].min_name !== "alice") {
        throw new Error(`Failed simple select maxBy/minBy test: ${JSON.stringify(resMaxMin)}`);
    }

    const dfMaxMinGrp = $df.data({
        group: ["A", "A", "B", "B"],
        val: ["foo", "bar", "baz", "qux"],
        weight: [10, 20, 100, 50]
    });
    const resMaxMinGrp = dfMaxMinGrp.groupBy("group").agg([
        $df.col("val").maxBy($df.col("weight")).alias("heaviest"),
        $df.col("val").minBy($df.col("weight")).alias("lightest")
    ]).toDicts();
    if (resMaxMinGrp[0].heaviest !== "bar" || resMaxMinGrp[0].lightest !== "foo" ||
        resMaxMinGrp[1].heaviest !== "baz" || resMaxMinGrp[1].lightest !== "qux") {
        throw new Error(`Failed groupby maxBy/minBy test: ${JSON.stringify(resMaxMinGrp)}`);
    }

    const dateDf = $df.data({
        event: ["event1", "event2", "event3"],
        date: [new Date("2026-01-01"), new Date("2026-12-31"), new Date("2026-06-15")]
    });
    const dateRes = dateDf.select([
        $df.col("event").maxBy($df.col("date")).alias("latest"),
        $df.col("event").minBy($df.col("date")).alias("earliest")
    ]).toDicts();
    if (dateRes[0].latest !== "event2" || dateRes[0].earliest !== "event1") {
        throw new Error(`Failed date comparison test: ${JSON.stringify(dateRes)}`);
    }

    // ------------------------------------------------------------------------
    // 6. nanMax and nanMin
    // ------------------------------------------------------------------------
    const dfNan = $df.data({
        group: ["A", "A", "A"],
        val: [10, NaN, 50]
    });
    const resNan = dfNan.select([
        $df.col("val").max().alias("max_val"),
        $df.col("val").min().alias("min_val"),
        $df.col("val").nanMax().alias("nan_max_val"),
        $df.col("val").nanMin().alias("nan_min_val")
    ]).toDicts();

    if (resNan[0].max_val !== 50 || resNan[0].min_val !== 10) {
        throw new Error(`Failed standard max/min test with NaN: ${JSON.stringify(resNan)}`);
    }
    if (!Number.isNaN(resNan[0].nan_max_val) || !Number.isNaN(resNan[0].nan_min_val)) {
        throw new Error(`Failed nanMax/nanMin propagation test: ${JSON.stringify(resNan)}`);
    }

    // ------------------------------------------------------------------------
    // 7. Product
    // ------------------------------------------------------------------------
    const dfProd = new DataFrame({
        group: ["A", "A", "B"],
        val: [2, 5, 7]
    });
    const resProd = dfProd.groupBy("group").agg($df.col("val").product().alias("p")).sort({ by: "group" }).toDict();
    if (resProd.p[0] !== 10) throw new Error(`Expected group A product 10, got ${resProd.p[0]}`);
    if (resProd.p[1] !== 7) throw new Error(`Expected group B product 7, got ${resProd.p[1]}`);

    // ------------------------------------------------------------------------
    // 8. Skew
    // ------------------------------------------------------------------------
    const dfSkew = $df.data({
        a: [1, 2, 5, 10, 20],
        b: [1, 1, 1, 1, 1]
    });
    const resSkewBiased = dfSkew.select($df.col("a").skew().alias("skew_biased")).toDicts();
    const g1 = resSkewBiased[0].skew_biased;
    if (Math.abs(g1 - 0.8594273) > 1e-4) throw new Error(`skew biased failed: ${g1}`);

    const resSkewUnbiased = dfSkew.select($df.col("a").skew({ bias: false }).alias("skew_unbiased")).toDicts();
    const G1 = resSkewUnbiased[0].skew_unbiased;
    if (Math.abs(G1 - 1.281146) > 1e-4) throw new Error(`skew unbiased failed: ${G1}`);

    const resSkewZeroVar = dfSkew.select($df.col("b").skew().alias("skew_zero")).toDicts();
    if (resSkewZeroVar[0].skew_zero !== null) throw new Error(`skew zero variance failed: ${resSkewZeroVar[0].skew_zero}`);

    // ------------------------------------------------------------------------
    // 9. Variance
    // ------------------------------------------------------------------------
    const dfVar = new DataFrame({
        group: ["A", "A", "A"],
        val: [10, 20, 30]
    });
    const resVar = dfVar.groupBy("group").agg($df.col("val").variance().alias("v")).toDict();
    if (resVar.v[0] !== 100) throw new Error(`Expected variance 100, got ${resVar.v[0]}`);

    // ------------------------------------------------------------------------
    // 10. Entropy
    // ------------------------------------------------------------------------
    // Uniform distribution of 4 categories: H = -4*(0.25*ln(0.25)) = ln(4) ≈ 1.386294
    const dfEnt1 = new DataFrame({ val: ["a", "b", "c", "d"] });
    const resEnt1 = dfEnt1.select($df.col("val").entropy().alias("h")).toDict();
    if (Math.abs(resEnt1.h[0] - Math.log(4)) > 1e-4) throw new Error(`Default entropy failed: ${resEnt1.h[0]}`);

    // Base-2 entropy: H_2 = 2.0
    const dfEnt2 = new DataFrame({ val: ["a", "b", "c", "d"] });
    const resEnt2 = dfEnt2.select($df.col("val").entropy({ base: 2 }).alias("h2")).toDict();
    if (Math.abs(resEnt2.h2[0] - 2.0) > 1e-4) throw new Error(`Base-2 entropy failed: ${resEnt2.h2[0]}`);

    // Single unique value → zero entropy
    const dfEnt3 = new DataFrame({ val: ["a", "a", "a", "a"] });
    const resEnt3 = dfEnt3.select($df.col("val").entropy().alias("h")).toDict();
    if (Math.abs(resEnt3.h[0] - 0.0) > 1e-4) throw new Error(`Single unique value entropy failed: ${resEnt3.h[0]}`);

    // Pre-calculated probabilities (normalize=false): H_2([0.5, 0.5]) = 1.0
    const dfEnt4 = new DataFrame({ probs: [0.5, 0.5] });
    const resEnt4 = dfEnt4.select($df.col("probs").entropy({ base: 2, normalize: false }).alias("h")).toDict();
    if (Math.abs(resEnt4.h[0] - 1.0) > 1e-4) throw new Error(`Unnormalized probabilities entropy failed: ${resEnt4.h[0]}`);

    // Groupby entropy
    const dfEnt5 = new DataFrame({
        group: ["g1", "g1", "g2", "g2", "g2", "g2"],
        val: ["a", "a", "a", "b", "c", "d"]
    });
    const resEnt5 = dfEnt5.groupBy("group").agg($df.col("val").entropy({ base: 2 }).alias("h")).sort({ by: "group" }).toDict();
    if (Math.abs(resEnt5.h[0] - 0.0) > 1e-4) throw new Error(`g1 entropy failed: ${resEnt5.h[0]}`);
    if (Math.abs(resEnt5.h[1] - 2.0) > 1e-4) throw new Error(`g2 entropy failed: ${resEnt5.h[1]}`);

    // Null handling → all same non-null value → zero entropy
    const dfEnt6 = new DataFrame({ val: ["a", null, "a", undefined, null] });
    const resEnt6 = dfEnt6.select($df.col("val").entropy().alias("h")).toDict();
    if (Math.abs(resEnt6.h[0] - 0.0) > 1e-4) throw new Error(`Null handling entropy failed: ${resEnt6.h[0]}`);

    console.log("=========================================");
    console.log("🎉 ALL AGGREGATION EXPRESSION TESTS PASSED!");
    console.log("=========================================");
} catch (error) {
    console.error("Test failed with error:", error);
    throw error;
}
