# DFScript Backlog & TODO

A prioritized roadmap of upcoming features, improvements, and refactorings.

## 🚀 V1.6.0 Release Scope

### 🗂️ DataFrame & Column Transformations
- [x] **`explode` / `implode`**:
  * [x] **`explode`**: Unnest list-like columns into multiple rows, replicating the input rows for each list element (Polars `.explode()` style).
  * [x] **`implode`**: Group columns or values back into a single list element per group (Polars `.implode()` style).

### 📊 List Column Operations (`.list`)
- [x] **`list.eval()` & `.element`**:
  * Implement element-wise operations on lists/arrays using a sub-expression scope.
  * Replicate Polars `.list.eval()` behavior by exposing `.element` inside the eval blocks to represent the inner elements of each list.

### 🧱 Struct Column Operations (`.struct`)
- [x] **`struct` & `.struct.field()`**:
  * [x] Implement struct data type and `$df.struct(...)` constructor to group multiple columns into a single nested object/struct column.
  * [x] Implement `.struct.field(name)` to extract inner fields from a struct column.

### 📂 File Input/Output (I/O)
- [x] **`read_csv` / `write_csv`**:
  * [x] Implement streaming delimiter-separated parser with automatic schema and type inference.
  * [x] Provide stringifying writers supporting multiple CSV dialects.
- [x] **`read_json` / `write_json`**:
  * [x] Parse standard JSON arrays and newline-delimited JSON (NDJSON) records.


## 🎯 V1.8.0 Release Scope

### 🤝 Advanced Joins
- [x] **Semi-Join & Anti-Join Support**:
  * Add `"semi"` and `"anti"` join options to the `join` method inside `DataFrame.ts`.
  * Ensure they only select columns from the left DataFrame and do not join right-side columns, utilizing the existing hash matching logic.
- [x] **Heterogeneous Key Names (`leftOn` & `rightOn`)**:
  * Allow specifying different join key column names for left vs right DataFrame (`leftOn` and `rightOn` parameters in `JoinOptions`), enabling joins when key column names do not match.
- [x] **Cross Join (`how: "cross"`)**:
  * Implement Cartesian product join between two DataFrames without requiring join key arguments.
- [x] **Join Key Coalescing (`coalesce`)**:
  * Provide option to coalesce nulls across join key columns in outer joins.
- [x] **Row Order Maintenance (`maintain_order`)**:
  * Implement `maintain_order` parameter in `JoinOptions` (`"none"`, `"left"`, `"right"`, `"left_right"`, `"right_left"`) to explicitly control output row ordering across join strategies.
  
### ⏱️ Inexact Asof Join (`df.join_asof`)
- [x] **Asof Join (`df.join_asof(...)`)**:
  * [x] Add `AsofJoinOptions` types interface in `src/dataframe/types.ts`.
  * [x] Add `join_asof` method declaration & signature to `DataFrame.ts` in `src/dataframe/dataframe.ts`.
  * [x] Add `alignAsofIndices` helper function in `src/dataframe/utils.ts` for index matching.
  * [x] Support `on`, `leftOn`, and `rightOn` key parameters.
  * [x] Support `by`, `leftBy`, and `rightBy` grouping/partition parameters.
  * [x] Support matching strategies: `"backward"` (default), `"forward"`, and `"nearest"`.
  * [x] Support `tolerance` threshold filtering (numeric & temporal duration).
  * [x] Support `allow_exact_matches` (boolean flag).
  * [x] Validate sorted key order preconditions and handle edge cases (nulls, out-of-bounds).

### ⏰ Timezone & Temporal Extensions
- [x] **Timezone-Aware Datetime Columns (`.dt.convert_time_zone()`)**:
  * Extend `DatetimeType` to accept an optional `timeZone` metadata parameter (e.g. `Datetime("Europe/London")`).
  * Integrate timezone awareness into formatting (`strftime`) and temporal operations (`.dt.hour()`, `.dt.day()`, `.dt.utc_offset()`, etc.) by leveraging `Intl.DateTimeFormat`.
  * Implement `.dt.convert_time_zone(tz)` to allow converting timezone-aware columns from one timezone to another.
- [x] **Casting Time Units (`.dt.cast_time_unit()`)**:
  * Implement `.dt.cast_time_unit(unit)` to convert/cast between millisecond (`ms`), microsecond (`us`), and nanosecond (`ns`) datetime storage precisions.
- [x] **Replacing time units (`.dt.with_time_unit()`)**:
  * Implement `.dt.with_time_unit(unit)` to set metadata precision (e.g. `"ms"`, `"us"`, `"ns"`) without changing underlying values.
- [x] **Replacing date/datetime components (`.dt.replace()`)**:
  * Implement `.dt.replace(options)` allowing replacement of year, month, day, hour, timeZone, etc. components.
- [x] **Truncating temporal values (`.dt.truncate()`)**:
  * Implement `.dt.truncate(every)` to floor datetimes to interval boundaries.

### ⏱️ Dedicated Duration Data Type & `.dt` Expressions
- [x] **`DurationType` & `.dt` Duration Methods**:
  * [x] Core `DurationType` and `Duration` export in `src/datatypes/types.ts` with time unit precision metadata (`timeUnit: "ms" | "us" | "ns"`).
  * [x] **`$df.duration(...)` Expression Constructor**: Implement `$df.duration({ days, hours, minutes, seconds, milliseconds, weeks, timeUnit })` matching `polars.duration()`.
  * [x] **Date & Duration Arithmetic & `.dt` Duration Methods**: Support arithmetic between Date/Datetime/Time/Duration columns and duration unit conversion methods (`.dt.total_hours()`, `.dt.total_days()`, etc.).

### 📋 DataFrame Copying (`df.clone()`)
- [x] **DataFrame Copying (`df.clone()`)**:
  * Implement explicit deep copy of a `DataFrame` instance, copying all underlying column arrays and schema metadata.

### 📦 Build & Tree-Shaking (ESM Support)
- [x] **Dual CommonJS & ES Module (ESM) Build**:
  * Configure the build script to output both CommonJS (`dist/index.js`) and ESM (`dist/index.mjs`) bundles.
  * Update `package.json` with `"exports"` map supporting both `"require"` and `"import"` to enable tree-shaking for modern bundlers (Vite/Webpack).

### 🛠️ Refactoring & Infrastructure
- [x] **Standardize Exception Assertions**:
  * Centralize check-and-throw assertion helper functions and ensure all inline exceptions throw specialized classes from `src/exceptions/`.

---

## ⌛ V1.9.0 Release Scope

### ⚙️ Schema Engine & Expression Type Inference
- [x] **Post-Operation Schema Type Deduction**:
  * [x] Implement central post-operation type inference to automatically deduce target schema DataTypes for chained binary operations (`Datetime - Datetime => Duration`, `Datetime + Duration => Datetime`) without requiring explicit `.cast()` calls.

### 📊 Statistical Aggregations
- [x] **Mathematical & Distribution Statistics**:
  * [x] Implement **Shannon Entropy** (`.entropy()`) to compute the information density of a column.
  * [x] Implement **Skewness** (`.skew()`) to measure the asymmetry of numeric columns.
  * [x] Implement **Kurtosis** (`.kurtosis()`) to measure the peakedness/tailedness of distributions.
  * [x] Implement **Product** (`.product()`) to compute the multiplicative product of elements in a group.
  * [x] Implement **Variance** (`.variance()`) to compute sample variance.
  * [x] Implement **Min By / Max By** (`.min_by()`, `.max_by()`) to find target column value corresponding to min/max in by column.
  * [x] Implement **NaN Max / NaN Min** (`.nan_max()`, `.nan_min()`) to compute max and min taking floating-point `NaN` propagation into account.
  * [x] Implement **Arg Min / Arg Max** (`.arg_min()`, `.arg_max()`) to find 0-indexed position of min/max values.
  * [x] Implement **Array Arg Min / Arg Max** (`.arr.arg_min()`, `.arr.arg_max()`) for list cell min/max index lookup.
  * [x] Implement **Array Aggregation** (`.arr.agg()`) to apply expressions over list elements.
  * [x] Implement **Bitwise Aggregations** (`.bitwise_and()`, `.bitwise_or()`, `.bitwise_xor()`) across group elements.

### 🔤 String Column Expressions (`.str`)
- [x] **Unimplemented String Expressions**:
  * [x] **`contains_any`**: Check if string contains any pattern from a collection.
  * [x] **`count_matches`**: Count total occurrences of regex or sub-string pattern matches.
  * [x] **`decode` / `encode`**: Binary encoding/decoding (Hex, Base64, etc.).
  * [x] **`escape_regex`**: Escape literal characters for safe regex usage.
  * [x] **`extract_all` / `extract_groups` / `extract_many`**: Advanced multi-match and structured group extractions.
  * [x] **`find` / `find_many`**: Find pattern match indices within string elements.
  * [x] **`join`**: Join list of string elements using a delimiter.
  * [x] **`json_decode`**: Parse JSON strings into objects or arrays using `safeJsonParse`.
  * [x] **`json_path_match`**: Extract fields using JSONPath syntax.
  * [x] **`normalize`**: Unicode normalization (NFC, NFD, NFKC, NFKD).
  * [x] **`replace_many`**: Batch replace multiple string patterns simultaneously.
  * [x] **`split` (unified `split_exact` & `split_n`)**: Consolidated split options (`limit`, `exact`, `strict`) into unified `.str.split()` method.

---


## 🚀 v2.0.0 Release Scope

### 🏷️ Idiomatic `camelCase` API Standardization
- [x] **Complete `camelCase` API & File Structure Standardization**:
  * [x] **DataFrame & Expression Methods**: Standardized all method signatures to idiomatic `camelCase`.
  * [x] **Source File Names**: Standardized module filenames to `camelCase`.
  * [x] **Options & Configuration Parameters**: Converted all option parameter interfaces to `camelCase`.

### 📚 Modular Documentation Infrastructure
- [x] **Centralized Example Reuse (`doc-examples.ts`)**:
  * [x] Extracted repetitive ASCII JSDoc input tables into root `doc-examples.ts` with `<!-- doc:KEY -->` tags, significantly reducing source file lengths while dynamically hydrating `docs.json`.

### 🧪 Test Suite Architecture & 1:1 Directory Mirroring
- [x] **Align `_tests/` Directory Structure Directly with `src/`**:
  * Organize test files to mirror the `src/` hierarchy 1:1, enabling granular, atomic test execution alongside the global `npm test` runner.

### 🌐 ES2020 Standard Target & Environment Compatibility
- [x] **Verified ES2020 Baseline Compatibility Across All Runtimes**:
  * Emitted bundles target `es2020` without polyfill overhead, supporting Node.js 14+, modern browsers (Chrome 80+, Safari 13.1+, Firefox 74+, Edge 80+), Bun, Deno, and Edge Workers.
  * Preserved `@note` JSDoc annotations for environment-specific APIs (such as filesystem access in `df.writeCsv` and `df.writeJson`).
- [x] **Generalized Distinct Matching (`isNDistinct`)**:
  * Added `$df.col().isNDistinct(index, nullOnOob)` to `ComparisonExpr` supporting positive & negative index positions (e.g. 0 for first distinct, -1 for last distinct), out-of-bounds handling, and Kleene null propagation.

### 🏛️ Unified Root Column Expression Architecture
- [x] **Consolidate Root Mixins into Single `StandardExpr` / `ColumnExpr`**:
  * Merge arbitrary root mixins (`ArithmeticExpr`, `ComparisonExpr`, `AggregationExpr`, `LogicalExpr`, `ManipulationExpr`, `WindowExpr`) directly into `StandardExpr` / `ColumnExpr`.
  * Maintain clean, dedicated namespace mixins only for explicit sub-namespaces (`.arr`, `.bin`, `.dt`, `.str`, `.struct`).
  * Eliminate cross-mixin TypeScript friction, prototype casting, and circular module dependencies for root column methods.
- [x] **Decompose Column Expression Mixin Test Suites into 1:1 Atomic Test Files**:
  * Mirrored `_tests/dataframe` structure across `ArrayExpr`, `StandardExpr`, `StringExpr`, `StructExpr`, and `TemporalExpr`.


/DataFrame.__getitem__
/DataFrame.__setitem__
/DataFrame.bottom_k
/DataFrame.cast
/DataFrame.clear
/DataFrame/drop_in_place
/DataFrame/drop_nans
/DataFrame/drop_nulls
/DataFrame/extend
/DataFrame/fill_nan  ?filter under the hood
/DataFrame/gather
/DataFrame/gather_every
/DataFrame/get_column
/DataFrame/get_column_index
/DataFrame/get_columns
/DataFrame/group_by_dynamic
/DataFrame/interpolate
/DataFrame/iter_slices
/DataFrame/join_where
/DataFrame/match_to_schema
/DataFrame/merge_sorted
/DataFrame/partition_by
/DataFrame/pipe
/DataFrame/rechunk
/DataFrame/remove
/DataFrame/replace_column
/DataFrame/rolling
/DataFrame/row
/DataFrame/rows
/DataFrame/rows_by_key
/DataFrame/sample
/DataFrame/select_seq
/DataFrame/set_sorted
/DataFrame/shift
/DataFrame/shrink_to_fit
/DataFrame/sql
/DataFrame/to_dummies
/DataFrame/to_series
/DataFrame/top_k
/DataFrame/unnest
/DataFrame/unstack
/DataFrame/update
/DataFrame/upsample

#Aggregation
/DataFrame/count
/DataFrame/max
/DataFrame/max_horizontal
/DataFrame/mean
/DataFrame/mean_horizontal
/DataFrame/median
/DataFrame/min
/DataFrame/min_horizontal
/DataFrame/product
/DataFrame/quantile
/DataFrame/std
/DataFrame/sum
/DataFrame/sum_horizontal
/DataFrame/var

#Attributes
/DataFrame/flags

#Computation
/DataFrame/fold
/DataFrame/hash_rows

#Miscellaneous 
/DataFrame/collect_schema
/DataFrame/corr
/DataFrame/equals
/DataFrame/lazy
/DataFrame/map_columns
/DataFrame/map_rows
/DataFrame/deserialize
/DataFrame/serialize


## 🔮 Future / Backlog Scope (V2.0+)

### ⏰ Advanced Temporal Extensions & Storage Infrastructure
- [ ] **`replace_time_zone(timeZone)` Method**:
  * Implement `.dt.replace_time_zone(timeZone: string | null)` to re-interpret local wall-clock values in a new timezone (shifting the underlying UTC instant/epoch time) or unset timezone awareness (`timeZone = null`), distinct from `.convert_time_zone(tz)` which preserves the UTC instant.
- [ ] **High-Precision Sub-Millisecond Datetime & Duration Storage (`us`, `ns`)**:
  * Transition from standard JS `Date` objects (which are limited to millisecond resolution) to raw 64-bit integer / `BigInt` array representations for true sub-millisecond (`us` microsecond and `ns` nanosecond) datetime storage, duration storage, and `.dt.total_*()` unscaling.
- [ ] **Evaluation-Time Timezone Guard Checks**:
  * Add evaluation-time schema verification in DataFrame operations (`with_columns`/`select`) to enforce that `convert_time_zone()` is only called on timezone-aware input columns even when expressions are built stand-alone without explicit `.cast_time_unit()` chains.
- [ ] **Row-Dynamic Timezone Conversions (`convert_time_zone(col("tz"))`)**:
  * Allow `.dt.convert_time_zone()` and timezone extraction methods to accept an expression parameter (`IExpr` / column reference) as the timezone argument, enabling per-row dynamic timezone conversions.
- [ ] **Dedicated Primitive `TimeType` & `DateType` Storage**:
  * Introduce dedicated low-level `TimeType` (nanoseconds/milliseconds since midnight) and 32-bit integer `DateType` (days since epoch) to match Polars native primitive types beyond combined JS `Date` objects.

### 🧠 Lazy Execution & Query Optimization (`LazyFrame`)
- [ ] **`df.lazy()` & `LazyFrame` API**:
  * Implement `.lazy()` to transition a `DataFrame` into a `LazyFrame`, building a Directed Acyclic Graph (DAG) query plan instead of executing operations eagerly.
- [ ] **Predicate & Projection Pushdown Optimizations**:
  * **Predicate Pushdown**: Push `filter()` expressions up the DAG (and into `read_csv`/`read_json` readers) so unneeded rows are filtered out before transformations or joins occur.
  * **Projection Pushdown**: Inspect final `select()` columns and prune unused columns early in the DAG to minimize memory allocations.
- [ ] **Query Execution & Inspection (`.collect()`, `.explain()`)**:
  * **`.collect()`**: Execute the optimized logical/physical query plan DAG and return a concrete `DataFrame`.
  * **`df.explain({ optimized?: boolean })`**: Format and return a text/tree string representation of the unoptimized or optimized query plan DAG, allowing developers to inspect predicate pushdown, projection pushdown, and join order optimizations.
  * **`expr.explain()`**: Format and output a detailed tree representation of `ColumnExpression` ASTs, allowing developers to inspect complex nested operations, alias bindings, and expression DAGs.

### ⚡ Performance & Interoperability
- [ ] **Primitive Fast-Path Row Hashing**:
  * Optimize `computeRowHash` and `toCanonicalString` to use numeric hashing algorithms (e.g., FNV-1a or 64-bit integer mixing) when keys consist strictly of primitive types (integers, strings, booleans), bypassing string allocations during large `DataFrame.join()` and `.groupby()` operations.
- [ ] **Apache Arrow & IPC Interoperability**:
  * Provide lightweight serialization adapters for Apache Arrow IPC memory format, facilitating zero-copy data exchange with Python Polars, PyArrow, and browser WebAssembly runtimes.

### 🗂️ Recommended DataFrame Operations
- [ ] **Dynamic Time-Series Grouping (`df.group_by_dynamic()`)**:
  * Implement `.group_by_dynamic(index_column, { every, period, offset, label, closed })` for time-series windowing (e.g. tumbling & sliding temporal aggregation buckets).
- [ ] **Rolling Window Grouping (`df.group_by_rolling()`)**:
  * Implement `.group_by_rolling(index_column, { period, offset, closed })` for continuous rolling window aggregations on sorted time/numeric series.
- [ ] **Random Sampling (`df.sample()`)**:
  * Implement `.sample(nOrFraction, options)` to randomly select $N$ rows or a fractional percentage of rows (with optional seed and replacement), useful for ML train/test splitting and dataset exploration.

### 🔢 Expressions & Transformations Missing Matrix
- [ ] **Select Columns by DataType (`$df.col(DataType)` / `pl.col(pl.Float64)`)**:
  * Allow passing `DataType` instances (or constructors) directly into `col()` (e.g. `$df.col(DataTypeRegistry.Float64)`, `$df.col(DataTypeRegistry.Numeric)`).
  * Expand the column selector engine in `select()` and `with_columns()` to match and expand all DataFrame columns possessing the matching datatype, applying expressions uniformly across all matching columns.
- [ ] **Lead/Lag & Difference (`col.shift()`, `col.diff()`)**:
  * Implement `.shift(n, fill_value)` for lead/lag calculations and `.diff(n)` for step differences across rows.
- [ ] **Ranking (`col.rank()`)**:
  * Implement `.rank(method, descending)` supporting dense, ordinal, min, max, and average rank methods.
- [ ] **Datatype & Pattern Selectors (`cs.numeric()`, `cs.string()`, `cs.matches()`)**:
  * Add column selector helpers (`cs.*`) to allow selecting columns dynamically by data type or regex matching in `select()` and `with_columns()`.