import { DataFrame } from "../../src/dataframe";

console.log("Running joinAsof tests...");

const trades = new DataFrame([
    { time: 10, symbol: "AAPL", price: 100.0 },
    { time: 20, symbol: "AAPL", price: 101.5 },
    { time: 30, symbol: "AAPL", price: 102.0 }
]);

const quotes = new DataFrame([
    { time: 5, symbol: "AAPL", bid: 99.5 },
    { time: 15, symbol: "AAPL", bid: 100.5 },
    { time: 30, symbol: "AAPL", bid: 102.0 }
]);

// 1. Backward strategy (default)
const dfAsofBackward = trades.joinAsof({ other: quotes, on: "time", by: "symbol", strategy: "backward" });
const asofBackwardRows = dfAsofBackward.toDicts() as any[];
if (asofBackwardRows[0].bid !== 99.5 || asofBackwardRows[1].bid !== 100.5 || asofBackwardRows[2].bid !== 102.0) {
    throw new Error("joinAsof backward strategy failed");
}

// 2. Forward strategy
const dfAsofForward = trades.joinAsof({ other: quotes, on: "time", by: "symbol", strategy: "forward" });
const asofForwardRows = dfAsofForward.toDicts() as any[];
if (asofForwardRows[0].bid !== 100.5 || asofForwardRows[1].bid !== 102.0 || asofForwardRows[2].bid !== 102.0) {
    throw new Error("joinAsof forward strategy failed");
}

// 3. Nearest strategy
const dfAsofNearest = trades.joinAsof({ other: quotes, on: "time", by: "symbol", strategy: "nearest" });
const asofNearestRows = dfAsofNearest.toDicts() as any[];
if (asofNearestRows[0].bid !== 99.5 || asofNearestRows[1].bid !== 100.5 || asofNearestRows[2].bid !== 102.0) {
    throw new Error("joinAsof nearest strategy failed");
}

// 4. allowExactMatches: false
const dfAsofNoExact = trades.joinAsof({ other: quotes, on: "time", by: "symbol", strategy: "backward", allowExactMatches: false });
const asofNoExactRows = dfAsofNoExact.toDicts() as any[];
if (asofNoExactRows[0].bid !== 99.5 || asofNoExactRows[1].bid !== 100.5 || asofNoExactRows[2].bid !== 100.5) {
    throw new Error("joinAsof allowExactMatches:false failed");
}

console.log("✓ joinAsof tests passed!");
