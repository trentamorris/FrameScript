console.log("=========================================");
console.log("RUNNING ALL DFSCRIPT PROJECT TESTS...");
console.log("=========================================");

// 1. ColumnExpressions
import "./columnExpressions/mixins/AggregationExpr.test";
import "./columnExpressions/mixins/ArithmeticExpr.test";
import "./columnExpressions/mixins/ArrayExpr.test";
import "./columnExpressions/mixins/ComparisonExpr.test";
import "./columnExpressions/mixins/LogicalExpr.test";
import "./columnExpressions/mixins/ManipulationExpr.test";
import "./columnExpressions/mixins/StringExpr.test";
import "./columnExpressions/mixins/StructExpr.test";
import "./columnExpressions/mixins/TemporalExpr.test";
import "./columnExpressions/mixins/WindowExpr.test";
import "./columnExpressions/functions/all.test";
import "./columnExpressions/functions/coalesce.test";
import "./columnExpressions/functions/duration.test";
import "./columnExpressions/functions/element.test";
import "./columnExpressions/functions/exclude.test";
import "./columnExpressions/functions/implode.test";
import "./columnExpressions/functions/lit.test";
import "./columnExpressions/functions/seqRange.test";
import "./columnExpressions/functions/struct.test";
import "./columnExpressions/functions/when.test";
import "./columnExpressions/typeSelector.test";
import "./columnExpressions/typeInference.test";

// 2. DataFrames
import "./dataframe/run_all";

// 3. Functions
import "./functions/concat.test";
import "./functions/readCsv.test";
import "./functions/readJson.test";

// 4. DataTypes
import "./datatypes/dataTypes.test";

// 5. Utils
import "./utils/array.test";
import "./utils/binary.test";
import "./utils/csv.test";
import "./utils/date.test";
import "./utils/duration.test";
import "./utils/json.test";
import "./utils/number.test";
import "./utils/object.test";
import "./utils/string.test";

console.log("=========================================");
console.log("🎉 ALL TESTS IN THE PROJECT PASSED SUCCESSFULLY!");
console.log("=========================================");
