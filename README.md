# 🚀 df-script: High-Performance TypeScript DataFrame Library

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/trentamorris/df-script)
[![npm version](https://img.shields.io/npm/v/df-script?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/df-script)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/df-script?style=for-the-badge&color=blue)](https://bundlephobia.com/package/df-script)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success?style=for-the-badge)](#)
[![TypeScript & JavaScript](https://img.shields.io/badge/Supports-TS%20%7C%20TSX%20%7C%20JS%20%7C%20JSX-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Universal Runtimes](https://img.shields.io/badge/Runtimes-Node%20%7C%20Bun%20%7C%20Deno%20%7C%20Browser-brightgreen?style=for-the-badge)](#)
[![License](https://img.shields.io/npm/l/df-script?style=for-the-badge&color=informational)](LICENSE)
[![Donate](https://img.shields.io/badge/Donate-Support-green?style=for-the-badge)](DONATIONS.md)

**df-script** is a blazing-fast, **zero-dependency**, expression-based DataFrame and data manipulation library for **TypeScript** and **JavaScript**. Heavily inspired by modern columnar engines like **Polars** and **Pandas**, `df-script` brings declarative, lazy-compiled columnar analytical queries and ETL workflows directly to JavaScript environments (Node.js, Browser, Bun, Deno, and Edge Workers).

With cache-optimized columnar storage and flat memory layout under the hood, `df-script` eliminates garbage collection thrashing caused by intermediate array allocations in chained `.map()`, `.filter()`, and `.reduce()` calls.

---

## 🌐 Universal Language & Environment Support

`df-script` is built with **zero native dependencies** and ships with dual **ESM** (`dist/index.mjs`) and **CommonJS** (`dist/index.js`) modules alongside comprehensive `.d.ts` type declarations. It runs natively everywhere JavaScript or TypeScript runs:

- 📄 **Languages & File Formats**: Full first-class support in **TypeScript (`.ts`, `.tsx`)**, **JavaScript (`.js`, `.jsx`)**, and module formats (`.mjs`, `.cjs`).
- ⚛️ **UI Frameworks & Bundlers**: React (JSX/TSX), Next.js, Vue, Nuxt, Svelte, SolidJS, Astro, Vite, Webpack, and esbuild.
- ⚙️ **Runtimes & Target Standard**: Standard **ES2020+** compatible. Fully tested on **Node.js** (14+), **Bun**, **Deno**, modern **Web Browsers** (Chrome 80+, Safari 13.1+, Firefox 74+, Edge 80+), Cloudflare Workers, Fastly Compute, and AWS Lambda.
- 🌐 **Browser / Client-Side Compatibility**: 100% in-memory analytical transformations, joins, grouping, and expressions run natively in all browser runtimes. File writing methods (`df.writeCsv()`, `df.writeJson()`) automatically fallback to returning strings or writing to custom stream objects when running in browser environments.
- 📦 **Package Managers**: Works seamlessly with `npm`, `pnpm`, `bun`, and `yarn`.

---

## 💡 Why df-script? (Polars & Pandas for TypeScript)

In modern web apps and Node.js backend services, data transformation code often degrades into nested chains of `.map()`, `.filter()`, and `.sort()` on arrays of objects. Each step in the chain allocates new intermediate arrays, slows down garbage collection, and creates maintenance overhead.

`df-script` provides:
- ⚡ **Columnar Execution**: Column-oriented arrays with cached loop lengths for fast computation and minimal memory allocation.
- 🔗 **Fluent Expressions**: Declarative, composable queries using `$df.col(...)` expressions with automatic post-operation schema deduction.
- 📂 **Strict Domain Namespaces**: Clean, dedicated namespaces (`.str`, `.dt`, `.arr`, `.struct`) to prevent method clutter and ensure discoverable APIs.
- 🛡️ **Zero External Dependencies**: Lightweight runtime footprint with zero supply-chain risk.
- 🧠 **TypeScript First**: Full IDE autocomplete and compile-time type safety for column selections and schemas.

---

## 🗺️ Table of Contents

- [✨ Key Features](#-key-features)
- [🌐 Universal Language & Environment Support](#-universal-language--environment-support)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📖 Core Concepts](#-core-concepts)
- [🛠️ DataFrame API Reference](#️-dataframe-api-reference)
- [📂 File / Data I/O](#-file--data-io)
- [🧮 Expressions API Reference](#-expressions-api-reference)
- [📂 Namespaces](#-namespaces)
- [🪟 Window & Rolling Expressions](#-window--rolling-expressions)
- [🛡️ Typing and Schema Registry](#️-typing-and-schema-registry)
- [🧑‍💻 Contributing & Development](#-contributing--development)
- [📄 License](#-license)

---

## ✨ Key Features

- 📦 **Zero Dependencies** — 0 external runtime dependencies; completely standalone.
- ⚡ **Columnar Execution** — Fast columnar processing that eliminates intermediate array allocations.
- 🔗 **Expression-Based API** — Compose complex transformations, aggregations, and conditions using fluent `$df` expressions.
- 📂 **Strict Namespaces**:
  - `.str` — Unicode string manipulations, regex extractions, and JSON path lookups.
  - `.dt` — Timezone conversions, business days, microsecond-precision datetimes, and durations.
  - `.arr` — Array/list column operations and element-wise `.arr.eval()` mapping.
  - `.struct` — Nested object handling and `.struct.unnest()` column flattening.
- 🪟 **Analytical Window Functions** — Partitioned windowing (`.over()`), cumulative aggregations (`cumSum()`, `cumMax()`), and rolling moving statistics (`rollingMean()`, `rollingStd()`).
- 🛠️ **Relational Operations** — Inner/left/right/outer/cross joins, `joinAsof` time-series matching, pivots, unpivots, and multi-axis concatenations.
- 🛡️ **Defensive & Type-Safe** — Automatic type coercion, Kleene three-valued logic for null safety, and strict schema validation.

---

## 📦 Installation

Install `df-script` using your package manager:

```bash
npm install df-script
```

Or with Yarn, PNPM, or Bun:

```bash
yarn add df-script
pnpm add df-script
bun add df-script
```

---

## 🚀 Quick Start

```typescript
import { $df } from "df-script";

// 1. Create a DataFrame with structured data and automatic schema inference
const df = $df.data([
  { id: 1, name: "Alice", joinDate: "2026-01-15", sales: 1200.50, tags: ["sales", "east"] },
  { id: 2, name: "Bob", joinDate: "2026-02-20", sales: 850.00, tags: ["support", "west"] },
  { id: 3, name: "Charlie", joinDate: "2026-03-05", sales: 2300.00, tags: ["sales", "north"] },
  { id: 4, name: "David", joinDate: "2026-03-12", sales: null, tags: ["marketing"] },
]);

// 2. Select columns, transform strings, format dates, and compute expressions
const processedDf = df.select(
  $df.col("id"),
  $df.col("name").str.upper().alias("NAME_UPPER"),
  $df.col("joinDate").str.toDatetime().dt.year().alias("joinYear"),
  $df.col("sales").add(500).alias("salesAdjusted"),
  $df.col("tags").arr.lengths().alias("tagCount")
);

console.log(processedDf.toDicts());
/* Output:
[
  { id: 1, NAME_UPPER: 'ALICE', joinYear: 2026, salesAdjusted: 1700.5, tagCount: 2 },
  { id: 2, NAME_UPPER: 'BOB', joinYear: 2026, salesAdjusted: 1350, tagCount: 2 },
  { id: 3, NAME_UPPER: 'CHARLIE', joinYear: 2026, salesAdjusted: 2800, tagCount: 2 },
  { id: 4, NAME_UPPER: 'DAVID', joinYear: 2026, salesAdjusted: null, tagCount: 1 }
]
*/
```

---

## 📖 Core Concepts

### The `$df` Entry Point

`df-script` uses the `$df` namespace to instantiate DataFrames, reference columns, construct expressions, and specify data types.

- `$df.data(dataRowsOrCols, schema?)`: Instantiates a new `DataFrame`.
- `$df.readJson(content, options?)`: Reads JSON/NDJSON content into a new `DataFrame`.
- `$df.readCsv(content, options?)`: Reads CSV content into a new `DataFrame` with automatic schema inference.
- `$df.col(selector)`: Creates a column reference expression by column name (`"a"`), multiple names (`["a", "b"]`), RegExp pattern (`/^user_/`), or DataType selector (`$df.Float64`, `$df.Numeric`).
- `$df.all()`: Selects all columns in the DataFrame.
- `$df.exclude(columns)`: Matches all columns except the specified ones.
- `$df.coalesce(...exprs)`: Returns the first non-null value among columns or expressions.
- `$df.lit(val)`: Explicitly wraps a raw value into a literal expression.
- `$df.duration(optionsOrString)`: Constructs a `Duration` expression from component options (`{ days: 1, hours: 12 }`) or compound duration strings (`"1d 12h 30m"`).
- `$df.struct(fields)`: Constructs a nested struct object expression from named expressions or sibling columns.
- `$df.when(predicate).then(value)...otherwise(value)`: Constructs a conditional `CASE WHEN` expression chain.
- `$df.implode(column)`: Aggregates a column's rows or grouped values into a list.
- `$df.seqRange(value, options?)`: Generates a sequence range of values.
- `$df.element()`: References the current array element within an `.arr.eval(...)` expression.
- `$df.Float64`, `$df.Int32`, `$df.Utf8`, etc.: Direct access to data types and constructors for schema definitions and type-based column selection.

---

## 🛠️ DataFrame API Reference

### 1. Transformations & Projection
- **`select(...exprs)`**: Projects columns. Supports strings, `$df.col(...)` expressions, `$df.all()`, RegExp patterns (`/^prefix_/`), DataType selectors (`$df.Numeric`), and `$df.col("struct").struct.unnest()`.
- **`withColumns(...exprs)`**: Adds or overrides columns. Accepts expressions, options mapping keys, RegExp patterns, or DataType selectors.
- **`drop(...names)`**: Drops one or more columns from the DataFrame.
- **`rename(mapping)`**: Renames columns using a `{ oldName: newName }` object.
- **`explode(columns)`**: Unnests list-like columns into multiple rows, replicating other columns per list element.
- **`implode(columns)`**: Groups values in specified columns back into a list element per column.

### 2. Filtering & Row Selection
- **`filter(...predicates)`**: Filters rows where all predicate expressions evaluate to `true`.
- **`find(predicate)`**: Returns the first matching row record object (or `undefined`).
- **`unique(columns?)`**: Returns unique rows, optionally deduplicating based on a subset of columns.
- **`limit(n, options?)`**: Returns the first `n` rows. Options include `offset` and direction `from: "start" | "end"`.
- **`head(n)`** / **`tail(n)`**: Shortcuts for `limit` from the start or end of the DataFrame.
- **`slice(start, end?)`**: Extracts a subset of rows using standard index slicing.
- **`gather(indices, options?)`**: Gathers rows at specified indices (supports negative indexing and `{ nullOnOob?: boolean }`).

### 3. Sorting & Structural Operations
- **`sort({ by, descending?, nullsLast?, custom? })`**: Sorts rows by single/multiple columns, custom null ordering, or comparator functions.
- **`clone()`**: Performs a deep copy of the `DataFrame`, replicating all underlying column arrays and schema metadata.
- **`transpose(options?)`**: Transposes the DataFrame (swapping rows and columns).

### 4. Grouping & Aggregations
- **`groupBy(keys)`**: Groups data by one or more columns, returning a `GroupedData` object.
- **`groupByDynamic(indexColumn, options)`**: Dynamic time-series / numeric window grouping over tumbling, sliding, or rolling temporal aggregation intervals (`every`, `period`, `offset`, `closed`, `label`, `startBy`, `includeBoundaries`, `by`).
- **`GroupedData.agg(...exprs)`**: Computes aggregations on grouped data (e.g. `$df.col("sales").sum()`).

### 5. Reshaping & Joining
- **`join(other, onOrOptions, how?, suffixes?)`**: Merges two DataFrames. Supports:
  - Join modes (`how`): `"inner" | "left" | "right" | "outer" | "semi" | "anti" | "cross"`.
  - Keys: `leftOn`, `rightOn`, `coalesce`, and order preservation options.
- **`joinAsof(other, options)`**: Inexact time-series / nearest-neighbor joins on sorted key columns.
  - Parameters: `on`, `leftOn`, `rightOn`, `by`, `strategy` (`"backward" | "forward" | "nearest"`), and `tolerance`.
- **`pivot(index, columns, values)`**: Pivots the table, converting unique values in `columns` into column headers.
- **`unpivot(idVars, valueVars, varName?, valueName?)`**: Melts/unpivots wide columns into long format name-value pairs.
- **`concat(items, options?)`**: Concatenates multiple DataFrames (`"vertical" | "horizontal" | "diagonal"`).

---

## 📂 File / Data I/O

`df-script` provides built-in parsers and serializers for JSON and CSV formats.

### Reading Data
- **`$df.readJson(content, options?)`**: Reads standard JSON or Newline Delimited JSON (NDJSON) string.
  ```typescript
  import { $df } from "df-script";

  // Read standard JSON
  const df = $df.readJson('[{"id": 1, "name": "Alice"}]');

  // Read NDJSON
  const dfNdjson = $df.readJson('{"id": 1}\n{"id": 2}', { format: "ndjson" });
  ```
- **`$df.readCsv(content, options?)`**: Reads a CSV string with automatic type inference.
  ```typescript
  import { $df } from "df-script";

  const csvContent = "id,name,active\n1,Alice,true\n2,Bob,false";
  const df = $df.readCsv(csvContent, {
    separator: ",",
    hasHeader: true,
    inferSchema: true
  });
  ```

### Writing Data
- **`df.writeJson(file?, options?)`**: Serializes a DataFrame into a JSON or NDJSON string.
  ```typescript
  const jsonStr = df.writeJson();
  df.writeJson("output.json");
  ```
- **`df.writeCsv(file?, options?)`**: Serializes a DataFrame into a CSV string.
  ```typescript
  const csvStr = df.writeCsv();
  df.writeCsv("output.csv", { separator: ";" });
  ```

---

## 🧮 Expressions API Reference

All column expressions inherit from `ExprBase` and support chaining.

### ➕ Arithmetic Expressions
- `.add(val)`, `.sub(val)`, `.mul(val)`, `.div(val)`, `.floordiv(val)`, `.mod(val)`, `.pow(val)`
- `.abs()`, `.sqrt()`, `.cbrt()`, `.exp()`, `.expm1()`, `.log(base?)`, `.log1p()`
- `.ceil()`, `.floor()`, `.trunc()`, `.round(decimals)`, `.clip(lower, upper)`, `.sign()`, `.negate()`
- `.sin()`, `.cos()`, `.tan()`, `.cot()`, `.sinh()`, `.cosh()`, `.tanh()`, `.arcsin()`, `.arccos()`, `.arctan()`, `.arctan2(val)`, `.arcsinh()`, `.arccosh()`, `.arctanh()`, `.degrees()`, `.radians()`, `.hypot(val)`

### 🔍 Comparison Expressions
- `.eq(val)`, `.ne(val)` — Strict value equivalence (Kleene null-propagation).
- `.eqMissing(val)`, `.neMissing(val)` — Null-safe equality treating null/undefined as equal.
- `.gt(val)`, `.ge(val)`, `.lt(val)`, `.le(val)`
- `.isNull()`, `.isNotNull()`
- `.isFinite()`, `.isInfinite()`, `.isNan()`, `.isNotNan()`
- `.isNDistinct(index, nullOnOob?)` — Matches the N-th distinct value by positive/negative index position.
- `.isIn(arrayOrExpr)`, `.notIn(arrayOrExpr)`

### ⚡ Aggregations
- `.sum()`, `.product()`, `.avg()` / `.mean()`, `.median()`, `.mode()`, `.variance()`, `.std()`, `.skew()`, `.kurtosis()`, `.entropy(base?, normalize?)`
- `.min()`, `.max()`, `.nanMin()`, `.nanMax()`, `.minBy(by)`, `.maxBy(by)`, `.argMin()`, `.argMax()`
- `.count(options?)` — Options: `{ includeNulls: boolean }`.
- `.first()`, `.last()`
- `.any()`, `.all()`, `.anyNull()`, `.allNull()`, `.nUnique()`, `.nullCount()`
- `.bitwiseAnd()`, `.bitwiseOr()`, `.bitwiseXor()`

### 🔀 Control Flow & Conditionals
Construct dynamic `CASE WHEN` branches using the `$df.when` API:
```typescript
import { $df } from "df-script";

df.select(
  $df.col("sales"),
  $df.when($df.col("sales").gt(2000)).then("High Performance")
     .when($df.col("sales").gt(1000)).then("Standard Performance")
     .otherwise("Low Performance")
     .alias("salesCategory")
);
```

---

## 📂 Namespaces

Specific domain transforms are grouped under dedicated namespaces:

### 🔤 String Operations (`.str`)
Available on any expression via `.str`:
```typescript
$df.col("name").str.lower()
$df.col("code").str.startsWith("A")
$df.col("description").str.replace(/foo/i, "bar")
```
- **Methods**: `lower()`, `upper()`, `toTitlecase()`, `len()`, `lenBytes()`, `lenChars()`, `trim()`, `trimStart()`, `trimEnd()`, `startsWith(pfx)`, `endsWith(sfx)`, `contains(pat)`, `containsAny(pats)`, `countMatches(pat)`, `find(pat)`, `findMany(pats)`, `replace(pat, repl)`, `replaceAll(pat, repl)`, `replaceMany(pats, repls)`, `slice(offset, len?)`, `split(delim, options?)`, `explode()`, `reverse()`, `lpad(w, f)`, `rpad(w, f)`, `zfill(w)`, `stripChars(chars?)`, `stripCharsStart(chars?)`, `stripCharsEnd(chars?)`, `stripPrefix(pfx)`, `stripSuffix(sfx)`, `escapeRegex()`, `extract(pat, group?)`, `extractAll(pat)`, `extractGroups(pat)`, `extractMany(pats)`, `encode(enc)`, `decode(enc, strict?)`, `jsonDecode(options?)`, `jsonPathMatch(path)`, `normalize(form?)`, `join(sep)`, `strptime(fmt, strict?)`, `toInteger()`, `toDecimal(p, s)`, `toDate()`, `toDatetime()`, `toTime()`.

### 📅 Temporal Operations (`.dt`)
Available on datetime or duration values via `.dt`:
```typescript
$df.col("timestamp").dt.year()
$df.col("timestamp").dt.convertTimeZone("America/New_York")
$df.col("duration").dt.totalSeconds()
```
- **Datetime Methods**: `year()`, `month()`, `day()`, `hour()`, `minute()`, `second()`, `millisecond()`, `microsecond()`, `nanosecond()`, `weekday()`, `week()`, `quarter()`, `century()`, `millennium()`, `ordinalDay()`, `isLeapYear()`, `monthStart()`, `monthEnd()`, `date()`, `time()`, `offsetDay(n, options?)`, `offsetBusinessDay(n, options?)`, `convertTimeZone(tz)`, `castTimeUnit(unit)`, `withTimeUnit(unit)`, `replace(options)`, `truncate(every)`, `utcOffset(tz?, options?)`, `epoch(unit)`, `timestamp(unit)`, `strftime(fmt, locale?)`.
- **Duration Methods**: `totalDays()`, `totalHours()`, `totalMinutes()`, `totalSeconds()`, `totalMilliseconds()`, `totalMicroseconds()`, `totalNanoseconds()`.

### 📊 Array/List Operations (`.arr`)
Available on array/list column expressions via `.arr`:
```typescript
$df.col("tags").arr.contains("vip")
$df.col("numbers").arr.eval($df.element().mul(2)).alias("numbersDoubled")
```
- **Methods**: `lengths()`, `len()`, `get(idx, nullOnOob?)`, `first(nullOnOob?)`, `last(nullOnOob?)`, `gather(indices, nullOnOob?)`, `gatherEvery(n, offset?)`, `slice(offset, len?)`, `contains(item)`, `countMatches(item)`, `join(sep)`, `sort(descending?)`, `reverse()`, `unique()`, `sum()`, `mean()`, `median()`, `mode()`, `min()`, `max()`, `argMin()`, `argMax()`, `agg(expr)`, `eval(expr)`.

### 🗃️ Struct/Object Operations (`.struct`)
Available on nested struct/object column expressions via `.struct`:
```typescript
// Sibling fields access via Proxy
$df.col("address").struct.city.alias("city")

// Struct unnesting (flattens fields to top-level columns in select)
df.select($df.col("address").struct.unnest())
```
- **Methods**: `field(name)`, `renameFields(mapping)`, `withFields(fields)`, `unnest()`.

---

## 🪟 Window & Rolling Expressions

Analytical partition window operations using `.over()` and moving calculations:

```typescript
df.select(
  $df.col("department"),
  $df.col("sales"),
  $df.col("sales").sum().over("department").alias("deptTotalSales"),
  $df.col("sales").cumSum().over("department").alias("deptRunningSales"),
  $df.all().rowNumber().over("department").alias("deptRank")
);
```

### 1. Cumulative Windows
- `.cumSum(reverse?)`, `.cumProd(reverse?)`, `.cumMin(reverse?)`, `.cumMax(reverse?)`, `.cumCount(reverse?)`

### 2. Rolling Metrics (Moving Window)
- **Generic Rolling Reducer**: `.rolling(sizeOrOptions, exprOrFn)` (evaluates custom functions or `$df` column expressions over each sliding window).
- **Specialized Rolling Reducers**: `.rollingSum(size)`, `.rollingMean(size)`, `.rollingMedian(size)`, `.rollingMin(size)`, `.rollingMax(size)`, `.rollingStd(size)`, `.rollingRank(size)`, `.rollingQuantile(quantile, size)`

### 3. Positional & Rank Windows
- `.lead(offset, defaultVal?)`, `.lag(offset, defaultVal?)`, `.rank()`, `.denseRank()`, `.rowNumber()`

---

## 🛡️ Typing and Schema Registry

```typescript
import { $df } from "df-script";

const schema = {
  id: $df.DataType.Int32,
  price: $df.DataType.Decimal(10, 2),
  active: $df.DataType.Boolean,
  createdAt: $df.DataType.Datetime
};

const df = $df.data(rawData, schema);
```

### Supported Data Types
- **Integers**: `Int8`, `Int16`, `Int32`, `Int64`, `UInt8`, `UInt16`, `UInt32`, `UInt64`
- **Floats & Decimals**: `Float32`, `Float64`, `Decimal(precision?, scale?)`
- **General**: `Boolean`, `Utf8` (Strings), `Binary`, `Null`, `Object`
- **Temporal**: `Date`, `Datetime`, `Time`, `Duration`
- **Nested Structures**: `List` (Arrays), `Struct` (Objects)

---

## 🧑‍💻 Contributing & Development

```bash
# Run test suite
npm test

# Build production bundles
npm run build
```

---

## 📄 License

`df-script` is open-source software licensed under the [MIT License](LICENSE).
