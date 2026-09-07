console.log("=========================================");
console.log("RUNNING ALL DFSCRIPT PROJECT TESTS...");
console.log("=========================================");

// 1. ColumnExpressions
import "./columnExpressions/mixins/ArrayExpr/run_all";
import "./columnExpressions/mixins/StandardExpr/run_all";
import "./columnExpressions/mixins/StringExpr/run_all";
import "./columnExpressions/mixins/StructExpr/run_all";
import "./columnExpressions/mixins/TemporalExpr/run_all";
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
import "./utils/array/run_all";
import "./utils/binary/run_all";
import "./utils/csv/run_all";
import "./utils/date/run_all";
import "./utils/duration/run_all";
import "./utils/json/run_all";
import "./utils/number/run_all";
import "./utils/object/run_all";
import "./utils/string/run_all";

console.log("=========================================");
console.log("🎉 ALL TESTS IN THE PROJECT PASSED SUCCESSFULLY!");
console.log("=========================================");
