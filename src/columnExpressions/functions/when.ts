import { ColumnExpr } from "../ColumnExpr";
import type { IExpr, ValidScalarTypes } from "../../types";
import { evaluateArg, isEvaluatedColumn } from "../utils";
import { WHEN_MARKER } from "../constants";

type WhenArg = IExpr | ValidScalarTypes | any[];

export class WhenThenChain {
    private _predicates: WhenArg[];
    private _values: WhenArg[];

    constructor(predicates: WhenArg[], values: WhenArg[]) {
        this._predicates = predicates;
        this._values = values;
    }

    then(value: WhenArg): WhenThen {
        return new WhenThen(this._predicates, this._values.concat(value));
    }
}

export class When {
    private _predicates: WhenArg[];

    constructor(predicate: WhenArg) {
        this._predicates = [predicate];
    }

    then(value: WhenArg): WhenThen {
        return new WhenThen(this._predicates, [value]);
    }
}

export class WhenThen extends ColumnExpr<any> {
    public _predicates: WhenArg[];
    public _values: WhenArg[];
    public _otherwise: WhenArg;

    get _otherwiseValue(): WhenArg {
        return this._otherwise;
    }

    get _branchOperands(): WhenArg[] {
        return this._otherwise != null ? [...this._values, this._otherwise] : this._values;
    }

    constructor(predicates: WhenArg[] = [], values: WhenArg[] = [], otherwise: WhenArg = null) {
        super(WHEN_MARKER);
        this._predicates = Array.isArray(predicates) ? predicates : [];
        this._values = values || [];
        this._otherwise = otherwise;

        this._ops = [(_, columns) => {
            const height = _.length;
            const preds = this._predicates;
            const vals = this._values;
            const numConditions = preds.length;

            const evaluatedPreds = new Array(numConditions);
            const evaluatedVals = new Array(numConditions);
            const isPredCol = new Array(numConditions);
            const isValCol = new Array(numConditions);

            for (let j = 0; j < numConditions; j++) {
                const pj = preds[j];
                const vj = vals[j];
                const ep = evaluateArg(pj, columns, height);
                const ev = evaluateArg(vj, columns, height);

                evaluatedPreds[j] = ep;
                evaluatedVals[j] = ev;
                isPredCol[j] = isEvaluatedColumn(pj, ep, columns, height);
                isValCol[j] = isEvaluatedColumn(vj, ev, columns, height);
            }

            const currentOtherwise = this._otherwise;
            const evaluatedOtherwise = evaluateArg(currentOtherwise, columns, height);
            const isOtherwiseCol = isEvaluatedColumn(currentOtherwise, evaluatedOtherwise, columns, height);

            const result = new Array(height);

            for (let i = 0; i < height; i++) {
                let matched = false;
                for (let j = 0; j < numConditions; j++) {
                    const predVal = isPredCol[j] ? evaluatedPreds[j][i] : evaluatedPreds[j];
                    if (predVal === true) {
                        result[i] = isValCol[j] ? evaluatedVals[j][i] : evaluatedVals[j];
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    result[i] = isOtherwiseCol ? evaluatedOtherwise[i] : evaluatedOtherwise;
                }
            }
            return result;
        }];
    }

    when(predicate: WhenArg): WhenThenChain {
        return new WhenThenChain(this._predicates.concat(predicate), this._values);
    }

    otherwise(value: WhenArg): WhenThen {
        return new WhenThen(this._predicates, this._values, value);
    }
}

/**
 * Provides conditional branch evaluations inside column expressions.
 *
 * @param {WhenArg} predicate The boolean condition or expression.
 * @returns {When} A When object builder to chain `.then()` and `.otherwise()`/`.when()`.
 * @namespace $df
 * @category ColumnExpression
 * @syntax $df.{symbol}(...)
 * @example
 * >>> const df = $df.data({ score: [75, 95] })
 * >>> df
 * shape: (2, 1)
 * ┌───────┐
 * │ score │
 * ├───────┤
 * │ 75    │
 * │ 95    │
 * └───────┘
 * >>> df.select(
 * ...   $df.when($df.col("score").gt(90)).then("A")
 * ...     .otherwise("B").alias("grade")
 * ... )
 * shape: (2, 1)
 * ┌───────┐
 * │ grade │
 * ├───────┤
 * │ B     │
 * │ A     │
 * └───────┘
 */
export function when(predicate: WhenArg): When {
    return new When(predicate);
}
