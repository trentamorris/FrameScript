declare const process: any;
import { $df } from "../../src/index";

console.log("=========================================");
console.log("STARTING COLUMN EXPRESSION STR NAMESPACE TESTS...");
console.log("=========================================");

const data = [
    {
        name: "  --Alice  ",
        phrase: "DFScript is awesome!",
        prefix_suffix: "pre-middle-suf",
        digits: "42"
    },
    {
        name: "Bob--  ",
        phrase: "Hello world!",
        prefix_suffix: "no-prefix-suf",
        digits: "7"
    }
];

const schema = {
    name: $df.DataType.Utf8,
    phrase: $df.DataType.Utf8,
    prefix_suffix: $df.DataType.Utf8,
    digits: $df.DataType.Utf8
};

try {
    const df = $df.data(data, schema);

    const projected = df.select([
        // Basic conversions
        $df.col("phrase").str.to_lowercase().alias("lower"),
        $df.col("phrase").str.to_uppercase().alias("upper"),
        $df.col("phrase").str.to_titlecase().alias("title"),
        $df.col("phrase").str.reverse().alias("reversed"),

        // Lengths
        $df.col("phrase").str.len_chars().alias("len_c"),
        $df.col("phrase").str.len_bytes().alias("len_b"),

        // Padding & Zfill
        $df.col("digits").str.zfill(4).alias("zfilled"),
        $df.col("digits").str.pad_start(5, "*").alias("padded_start"),
        $df.col("digits").str.pad_end(5, "-").alias("padded_end"),

        // Slice & Split & Explode & Head/Tail
        $df.col("phrase").str.slice(0, 8).alias("sliced"),
        $df.col("phrase").str.slice(-8, 7).alias("sliced_neg"),
        $df.col("phrase").str.head(8).alias("head_8"),
        $df.col("phrase").str.tail(8).alias("tail_8"),
        $df.col("phrase").str.head().alias("head_default"),
        $df.col("phrase").str.tail().alias("tail_default"),
        $df.col("phrase").str.split(" ").alias("split_arr"),
        $df.col("digits").str.explode().alias("exploded_arr"),

        // Stripping
        $df.col("name").str.strip_chars().alias("stripped_ws"),
        $df.col("name").str.strip_chars(" -").alias("stripped_chars"),
        $df.col("name").str.strip_chars_start(undefined).alias("stripped_start_ws"),
        $df.col("name").str.strip_chars_end().alias("stripped_end_ws"),
        $df.col("name").str.strip_chars("-", { trimFirst: true }).alias("stripped_chars_trim_first"),
        $df.col("name").str.strip_chars("-", { maxScanStart: 3, maxScanEnd: 3 }).alias("stripped_chars_offset_3"),
        $df.col("name").str.strip_chars(/[a-zA-Z]/, { maxScanStart: 10, maxScanEnd: 10 }).alias("stripped_chars_regex"),
        $df.col("digits").str.strip_chars(/[0-9]/, { returnStringOnNull: true }).alias("stripped_digits_regex"),

        // Prefix/Suffix removal
        $df.col("prefix_suffix").str.strip_prefix("pre-").alias("stripped_prefix"),
        $df.col("prefix_suffix").str.strip_suffix("-suf").alias("stripped_suffix"),

        // Regex / Matches
        $df.col("phrase").str.contains("awesome").alias("contains_str"),
        $df.col("phrase").str.contains_any(["missing", "awesome"]).alias("contains_any_match"),
        $df.col("phrase").str.contains_any(["foo", "bar"]).alias("contains_any_none"),
        $df.col("phrase").str.contains(/is/i).alias("contains_regex"),
        $df.col("phrase").str.ends_with("!").alias("ends_with_excl"),
        $df.col("phrase").str.starts_with("DF").alias("starts_with_df"),
        $df.col("phrase").str.replace("is", "was").alias("replaced"),
        $df.col("phrase").str.replace_all("e", "3").alias("replaced_all"),
        $df.col("phrase").str.replace(/IS/i, "was").alias("replaced_ci"),
        $df.col("phrase").str.replace_all(/E/gi, "3").alias("replaced_all_ci"),
        $df.col("phrase").str.replace("awesome", (m) => m.toUpperCase()).alias("replaced_fn"),
        $df.col("phrase").str.replace_all("e", (_m) => "3").alias("replaced_all_fn")
    ]).to_dicts() as any[];

    console.log("Coerced Expr.str results:");
    console.dir(projected, { depth: null });

    const r0 = projected[0];
    if (r0.lower !== "dfscript is awesome!") throw new Error(`Expected r0.lower to be "dfscript is awesome!", got ${r0.lower}`);
    if (r0.upper !== "DFSCRIPT IS AWESOME!") throw new Error(`Expected r0.upper to be "DFSCRIPT IS AWESOME!", got ${r0.upper}`);
    if (r0.title !== "Df Script Is Awesome") throw new Error(`Expected r0.title to be "Df Script Is Awesome", got ${r0.title}`);
    if (r0.reversed !== "!emosewa si tpircSFD") throw new Error(`Expected r0.reversed to be "!emosewa si tpircSFD", got ${r0.reversed}`);

    if (r0.len_c !== 20) throw new Error(`Expected r0.len_c to be 20, got ${r0.len_c}`);
    if (r0.len_b !== 20) throw new Error(`Expected r0.len_b to be 20, got ${r0.len_b}`);

    if (r0.zfilled !== "0042") throw new Error(`Expected r0.zfilled to be "0042", got ${r0.zfilled}`);
    if (r0.padded_start !== "***42") throw new Error(`Expected r0.padded_start to be "***42", got ${r0.padded_start}`);
    if (r0.padded_end !== "42---") throw new Error(`Expected r0.padded_end to be "42---", got ${r0.padded_end}`);

    if (r0.sliced !== "DFScript") throw new Error(`Expected r0.sliced to be "DFScript", got ${r0.sliced}`);
    if (r0.sliced_neg !== "awesome") throw new Error(`Expected r0.sliced_neg to be "awesome", got ${r0.sliced_neg}`); // "-8" is "awesome!", length 7 is "awesome"
    if (r0.head_8 !== "DFScript") throw new Error(`Expected r0.head_8 to be "DFScript", got ${r0.head_8}`);
    if (r0.tail_8 !== "awesome!") throw new Error(`Expected r0.tail_8 to be "awesome!", got ${r0.tail_8}`);
    if (r0.head_default !== "D") throw new Error(`Expected r0.head_default to be "D", got ${r0.head_default}`);
    if (r0.tail_default !== "!") throw new Error(`Expected r0.tail_default to be "!", got ${r0.tail_default}`);
    if (JSON.stringify(r0.split_arr) !== JSON.stringify(["DFScript", "is", "awesome!"])) {
        throw new Error(`Expected r0.split_arr to be ["DFScript", "is", "awesome!"], got ${JSON.stringify(r0.split_arr)}`);
    }
    if (JSON.stringify(r0.exploded_arr) !== JSON.stringify(["4", "2"])) {
        throw new Error(`Expected r0.exploded_arr to be ["4", "2"], got ${JSON.stringify(r0.exploded_arr)}`);
    }

    if (r0.stripped_ws !== "--Alice") throw new Error(`Expected r0.stripped_ws to be "--Alice", got ${r0.stripped_ws}`);
    if (r0.stripped_chars !== "Alice") throw new Error(`Expected r0.stripped_chars to be "Alice", got ${r0.stripped_chars}`);
    if (r0.stripped_start_ws !== "--Alice  ") throw new Error(`Expected r0.stripped_start_ws to be "--Alice  ", got ${r0.stripped_start_ws}`);
    if (r0.stripped_end_ws !== "  --Alice") throw new Error(`Expected r0.stripped_end_ws to be "  --Alice", got ${r0.stripped_end_ws}`);
    if (r0.stripped_chars_trim_first !== "Alice") throw new Error(`Expected r0.stripped_chars_trim_first to be "Alice", got "${r0.stripped_chars_trim_first}"`);
    if (r0.stripped_chars_offset_3 !== "  Alice  ") throw new Error(`Expected r0.stripped_chars_offset_3 to be "  Alice  ", got "${r0.stripped_chars_offset_3}"`);
    if (r0.stripped_chars_regex !== "  --  ") throw new Error(`Expected r0.stripped_chars_regex to be "  --  ", got "${r0.stripped_chars_regex}"`);
    if (r0.stripped_digits_regex !== "") throw new Error(`Expected r0.stripped_digits_regex to be "", got "${r0.stripped_digits_regex}"`);

    if (r0.stripped_prefix !== "middle-suf") throw new Error(`Expected r0.stripped_prefix to be "middle-suf", got ${r0.stripped_prefix}`);
    if (r0.stripped_suffix !== "pre-middle") throw new Error(`Expected r0.stripped_suffix to be "pre-middle", got ${r0.stripped_suffix}`);

    if (r0.contains_str !== true) throw new Error(`Expected r0.contains_str to be true, got ${r0.contains_str}`);
    if (r0.contains_any_match !== true) throw new Error(`Expected r0.contains_any_match to be true, got ${r0.contains_any_match}`);
    if (r0.contains_any_none !== false) throw new Error(`Expected r0.contains_any_none to be false, got ${r0.contains_any_none}`);
    if (r0.contains_regex !== true) throw new Error(`Expected r0.contains_regex to be true, got ${r0.contains_regex}`);
    if (r0.ends_with_excl !== true) throw new Error(`Expected r0.ends_with_excl to be true, got ${r0.ends_with_excl}`);
    if (r0.starts_with_df !== true) throw new Error(`Expected r0.starts_with_df to be true, got ${r0.starts_with_df}`);
    if (r0.replaced !== "DFScript was awesome!") throw new Error(`Expected r0.replaced to be "DFScript was awesome!", got ${r0.replaced}`);
    if (r0.replaced_all !== "DFScript is aw3som3!") throw new Error(`Expected r0.replaced_all to be "DFScript is aw3som3!", got ${r0.replaced_all}`);
    if (r0.replaced_ci !== "DFScript was awesome!") throw new Error(`Expected r0.replaced_ci to be "DFScript was awesome!", got ${r0.replaced_ci}`);
    if (r0.replaced_all_ci !== "DFScript is aw3som3!") throw new Error(`Expected r0.replaced_all_ci to be "DFScript is aw3som3!", got ${r0.replaced_all_ci}`);
    if (r0.replaced_fn !== "DFScript is AWESOME!") throw new Error(`Expected r0.replaced_fn to be "DFScript is AWESOME!", got ${r0.replaced_fn}`);
    if (r0.replaced_all_fn !== "DFScript is aw3som3!") throw new Error(`Expected r0.replaced_all_fn to be "DFScript is aw3som3!", got ${r0.replaced_all_fn}`);

    // Assert Row 1
    const r1 = projected[1];
    if (r1.stripped_prefix !== "no-prefix-suf") throw new Error(`Expected r1.stripped_prefix to be "no-prefix-suf", got ${r1.stripped_prefix}`); // doesn't have prefix "pre-"
    if (r1.stripped_suffix !== "no-prefix") throw new Error(`Expected r1.stripped_suffix to be "no-prefix", got ${r1.stripped_suffix}`);
    if (r1.stripped_chars_trim_first !== "Bob") throw new Error(`Expected r1.stripped_chars_trim_first to be "Bob", got "${r1.stripped_chars_trim_first}"`);
    if (r1.stripped_chars_offset_3 !== "Bob  ") throw new Error(`Expected r1.stripped_chars_offset_3 to be "Bob  ", got "${r1.stripped_chars_offset_3}"`);
    if (r1.stripped_chars_regex !== "--  ") throw new Error(`Expected r1.stripped_chars_regex to be "--  ", got "${r1.stripped_chars_regex}"`);
    if (r1.stripped_digits_regex !== "") throw new Error(`Expected r1.stripped_digits_regex to be "", got "${r1.stripped_digits_regex}"`);

    console.log("-----------------------------------------");
    console.log("RUNNING CASTING & PARSING TESTS...");
    console.log("-----------------------------------------");

    const castData = [
        {
            date_str: "2026-05-25 14:30:15",
            iso_date: "2026-05-25",
            iso_datetime: "2026-05-25T14:30:15.123Z",
            decimal_str: "123.4567",
            int_str: "123",
            time_str: "14:30:15.123",
            upper_str: "HELLO WORLD",
            lower_str: "hello world",
            title_str: "hello world"
        }
    ];

    const castSchema = {
        date_str: $df.DataType.Utf8,
        iso_date: $df.DataType.Utf8,
        iso_datetime: $df.DataType.Utf8,
        decimal_str: $df.DataType.Utf8,
        int_str: $df.DataType.Utf8,
        time_str: $df.DataType.Utf8,
        upper_str: $df.DataType.Utf8,
        lower_str: $df.DataType.Utf8,
        title_str: $df.DataType.Utf8
    };

    const castDf = $df.data(castData, castSchema);
    const castProjected = castDf.select([
        $df.col("date_str").str.strptime({ format: "%Y-%m-%d %H:%M:%S" }).alias("parsed_datetime"),
        $df.col("iso_date").str.to_date().alias("parsed_date"),
        $df.col("iso_datetime").str.to_datetime().alias("parsed_iso_datetime"),
        $df.col("decimal_str").str.to_decimal(10, 2).alias("parsed_decimal"),
        $df.col("int_str").str.to_integer().alias("parsed_int"),
        $df.col("time_str").str.to_time().alias("parsed_time"),
        $df.col("upper_str").str.to_lowercase().alias("to_lower"),
        $df.col("lower_str").str.to_uppercase().alias("to_upper"),
        $df.col("title_str").str.to_titlecase().alias("to_title")
    ]).to_dicts() as any[];

    console.log("Casting and parsing results:");
    console.dir(castProjected, { depth: null });

    const c0 = castProjected[0];

    // Assert parsed_datetime
    if (!(c0.parsed_datetime instanceof Date)) throw new Error("Expected parsed_datetime to be Date");
    if (c0.parsed_datetime.toISOString() !== "2026-05-25T14:30:15.000Z") {
        throw new Error(`Expected parsed_datetime to be 2026-05-25T14:30:15.000Z, got ${c0.parsed_datetime.toISOString()}`);
    }

    // Assert parsed_date
    if (!(c0.parsed_date instanceof Date)) throw new Error("Expected parsed_date to be Date");
    if (c0.parsed_date.toISOString() !== "2026-05-25T00:00:00.000Z") {
        throw new Error(`Expected parsed_date to be 2026-05-25T00:00:00.000Z, got ${c0.parsed_date.toISOString()}`);
    }

    // Assert parsed_iso_datetime
    if (!(c0.parsed_iso_datetime instanceof Date)) throw new Error("Expected parsed_iso_datetime to be Date");
    if (c0.parsed_iso_datetime.toISOString() !== "2026-05-25T14:30:15.123Z") {
        throw new Error(`Expected parsed_iso_datetime to be 2026-05-25T14:30:15.123Z, got ${c0.parsed_iso_datetime.toISOString()}`);
    }

    // Assert parsed_decimal
    if (c0.parsed_decimal !== 123.46) {
        throw new Error(`Expected parsed_decimal to be 123.46, got ${c0.parsed_decimal}`);
    }

    // Assert parsed_int
    if (c0.parsed_int !== 123) {
        throw new Error(`Expected parsed_int to be 123, got ${c0.parsed_int}`);
    }

    // Assert parsed_time
    if (c0.parsed_time !== "14:30:15.123") {
        throw new Error(`Expected parsed_time to be "14:30:15.123", got ${c0.parsed_time}`);
    }

    // Assert casings
    if (c0.to_lower !== "hello world") throw new Error(`Expected to_lower to be "hello world", got ${c0.to_lower}`);
    if (c0.to_upper !== "HELLO WORLD") throw new Error(`Expected to_upper to be "HELLO WORLD", got ${c0.to_upper}`);
    if (c0.to_title !== "Hello World") throw new Error(`Expected to_title to be "Hello World", got ${c0.to_title}`);

    // Assert new case conversions (camel, kebab, pascal, snake)
    const caseData = [
        { raw: "hello_world" },
        { raw: "Hello World" },
        { raw: "hello-world" },
        { raw: "helloWorld" },
        { raw: "HelloWorld" },
        { raw: "hello   world" },
        { raw: "hello__world" },
        { raw: "__hello__world--" }
    ];
    const caseDf = $df.data(caseData, { raw: $df.DataType.Utf8 });
    const caseRes = caseDf.select([
        $df.col("raw").str.to_camelcase().alias("camel"),
        $df.col("raw").str.to_kebabcase().alias("kebab"),
        $df.col("raw").str.to_pascalcase().alias("pascal"),
        $df.col("raw").str.to_snakecase().alias("snake")
    ]).to_dicts() as any[];

    console.log("Case conversion results:");
    console.dir(caseRes, { depth: null });

    for (const r of caseRes) {
        if (r.camel !== "helloWorld") throw new Error(`to_camelcase failed: got ${r.camel}`);
        if (r.kebab !== "hello-world") throw new Error(`to_kebabcase failed: got ${r.kebab}`);
        if (r.pascal !== "HelloWorld") throw new Error(`to_pascalcase failed: got ${r.pascal}`);
        if (r.snake !== "hello_world") throw new Error(`to_snakecase failed: got ${r.snake}`);
    }

    // Assert acronym casing boundaries
    const acronymData = [{ raw: "myHTTPClient" }];
    const acroRes = $df.data(acronymData, { raw: $df.DataType.Utf8 }).select([
        $df.col("raw").str.to_camelcase().alias("camel"),
        $df.col("raw").str.to_kebabcase().alias("kebab"),
        $df.col("raw").str.to_pascalcase().alias("pascal"),
        $df.col("raw").str.to_snakecase().alias("snake")
    ]).to_dicts()[0] as any;

    if (acroRes.camel !== "myHttpClient") throw new Error(`acronym camel failed: got ${acroRes.camel}`);
    if (acroRes.kebab !== "my-http-client") throw new Error(`acronym kebab failed: got ${acroRes.kebab}`);
    if (acroRes.pascal !== "MyHttpClient") throw new Error(`acronym pascal failed: got ${acroRes.pascal}`);
    if (acroRes.snake !== "my_http_client") throw new Error(`acronym snake failed: got ${acroRes.snake}`);

    // Assert digit and complex acronym separation
    const complexData = [{ raw: "JSON2String" }];
    const complexRes = $df.data(complexData, { raw: $df.DataType.Utf8 }).select([
        $df.col("raw").str.to_camelcase().alias("camel"),
        $df.col("raw").str.to_kebabcase().alias("kebab"),
        $df.col("raw").str.to_pascalcase().alias("pascal"),
        $df.col("raw").str.to_snakecase().alias("snake")
    ]).to_dicts()[0] as any;

    if (complexRes.camel !== "json2String") throw new Error(`complex camel failed: got ${complexRes.camel}`);
    if (complexRes.kebab !== "json-2-string") throw new Error(`complex kebab failed: got ${complexRes.kebab}`);
    if (complexRes.pascal !== "Json2String") throw new Error(`complex pascal failed: got ${complexRes.pascal}`);
    if (complexRes.snake !== "json_2_string") throw new Error(`complex snake failed: got ${complexRes.snake}`);

    // Assert round-tripping for digit structures
    const digitData = [{ raw: "user_1_active" }];
    const digitRes = $df.data(digitData, { raw: $df.DataType.Utf8 }).select([
        $df.col("raw").str.to_camelcase().alias("camel"),
        $df.col("raw").str.to_snakecase().alias("snake")
    ]).to_dicts()[0] as any;
    if (digitRes.camel !== "user1Active") throw new Error(`digit camel failed: got ${digitRes.camel}`);
    if (digitRes.snake !== "user_1_active") throw new Error(`digit snake failed: got ${digitRes.snake}`);

    // Assert international / accented and CJK characters support
    const intlData = [
        { raw: "coopération_api".normalize("NFD") },
        { raw: "데이터_table" }
    ];
    const intlRes = $df.data(intlData, { raw: $df.DataType.Utf8 }).select([
        $df.col("raw").str.to_camelcase().alias("camel"),
        $df.col("raw").str.to_kebabcase().alias("kebab"),
        $df.col("raw").str.to_pascalcase().alias("pascal"),
        $df.col("raw").str.to_snakecase().alias("snake")
    ]).to_dicts() as any[];

    console.log("International Casing results:");
    console.dir(intlRes, { depth: null });

    const rCoop = intlRes[0];
    if (rCoop.camel !== "coopérationApi") throw new Error(`accented camel failed: got ${rCoop.camel}`);
    if (rCoop.kebab !== "coopération-api") throw new Error(`accented kebab failed: got ${rCoop.kebab}`);
    if (rCoop.pascal !== "CoopérationApi") throw new Error(`accented pascal failed: got ${rCoop.pascal}`);
    if (rCoop.snake !== "coopération_api") throw new Error(`accented snake failed: got ${rCoop.snake}`);

    const rKoran = intlRes[1];
    if (rKoran.camel !== "데이터Table") throw new Error(`cjk camel failed: got ${rKoran.camel}`);
    if (rKoran.kebab !== "데이터-table") throw new Error(`cjk kebab failed: got ${rKoran.kebab}`);
    if (rKoran.pascal !== "데이터Table") throw new Error(`cjk pascal failed: got ${rKoran.pascal}`);
    if (rKoran.snake !== "데이터_table") throw new Error(`cjk snake failed: got ${rKoran.snake}`);

    // Assert contractions/possession apostrophe normalization
    const contraData = [
        { raw: "don't_blink" },
        { raw: "user's_data" }
    ];
    const contraRes = $df.data(contraData, { raw: $df.DataType.Utf8 }).select([
        $df.col("raw").str.to_camelcase().alias("camel"),
        $df.col("raw").str.to_kebabcase().alias("kebab"),
        $df.col("raw").str.to_pascalcase().alias("pascal"),
        $df.col("raw").str.to_snakecase().alias("snake")
    ]).to_dicts() as any[];

    console.log("Contraction Casing results:");
    console.dir(contraRes, { depth: null });

    const rDont = contraRes[0];
    if (rDont.camel !== "dontBlink") throw new Error(`contraction camel failed: got ${rDont.camel}`);
    if (rDont.kebab !== "dont-blink") throw new Error(`contraction kebab failed: got ${rDont.kebab}`);
    if (rDont.pascal !== "DontBlink") throw new Error(`contraction pascal failed: got ${rDont.pascal}`);
    if (rDont.snake !== "dont_blink") throw new Error(`contraction snake failed: got ${rDont.snake}`);

    const rUsers = contraRes[1];
    if (rUsers.camel !== "usersData") throw new Error(`possession camel failed: got ${rUsers.camel}`);
    if (rUsers.kebab !== "users-data") throw new Error(`possession kebab failed: got ${rUsers.kebab}`);
    if (rUsers.pascal !== "UsersData") throw new Error(`possession pascal failed: got ${rUsers.pascal}`);
    if (rUsers.snake !== "users_data") throw new Error(`possession snake failed: got ${rUsers.snake}`);

    // Assert acronym plurals and compound boundary padding edge cases
    const pluralEdgeData = [
        { raw: "activeKPIs" },
        { raw: "userIDs" },
        { raw: "JSONs" },
        { raw: "__user_1_active__" }
    ];
    const pluralEdgeRes = $df.data(pluralEdgeData, { raw: $df.DataType.Utf8 }).select([
        $df.col("raw").str.to_camelcase().alias("camel"),
        $df.col("raw").str.to_kebabcase().alias("kebab"),
        $df.col("raw").str.to_pascalcase().alias("pascal"),
        $df.col("raw").str.to_snakecase().alias("snake")
    ]).to_dicts() as any[];

    console.log("Plural Acronyms & Boundary Edge Casing results:");
    console.dir(pluralEdgeRes, { depth: null });

    const rKpis = pluralEdgeRes[0];
    if (rKpis.camel !== "activeKpis") throw new Error(`activeKPIs camel failed: got ${rKpis.camel}`);
    if (rKpis.kebab !== "active-kpis") throw new Error(`activeKPIs kebab failed: got ${rKpis.kebab}`);
    if (rKpis.pascal !== "ActiveKpis") throw new Error(`activeKPIs pascal failed: got ${rKpis.pascal}`);
    if (rKpis.snake !== "active_kpis") throw new Error(`activeKPIs snake failed: got ${rKpis.snake}`);

    const rIds = pluralEdgeRes[1];
    if (rIds.camel !== "userIds") throw new Error(`userIDs camel failed: got ${rIds.camel}`);
    if (rIds.kebab !== "user-ids") throw new Error(`userIDs kebab failed: got ${rIds.kebab}`);
    if (rIds.pascal !== "UserIds") throw new Error(`userIDs pascal failed: got ${rIds.pascal}`);
    if (rIds.snake !== "user_ids") throw new Error(`userIDs snake failed: got ${rIds.snake}`);

    const rJsons = pluralEdgeRes[2];
    if (rJsons.camel !== "jsons") throw new Error(`JSONs camel failed: got ${rJsons.camel}`);
    if (rJsons.kebab !== "jsons") throw new Error(`JSONs kebab failed: got ${rJsons.kebab}`);
    if (rJsons.pascal !== "Jsons") throw new Error(`JSONs pascal failed: got ${rJsons.pascal}`);
    if (rJsons.snake !== "jsons") throw new Error(`JSONs snake failed: got ${rJsons.snake}`);

    const rPadded = pluralEdgeRes[3];
    if (rPadded.camel !== "user1Active") throw new Error(`padded camel failed: got ${rPadded.camel}`);
    if (rPadded.kebab !== "user-1-active") throw new Error(`padded kebab failed: got ${rPadded.kebab}`);
    if (rPadded.pascal !== "User1Active") throw new Error(`padded pascal failed: got ${rPadded.pascal}`);
    if (rPadded.snake !== "user_1_active") throw new Error(`padded snake failed: got ${rPadded.snake}`);

    // Assert prototype pollution guard, mixed scripts, and safe type coercion
    const pollutionData = [
        { raw: "__proto__" },
        { raw: "constructor" },
        { raw: "myTable데이터" },
        { raw: 12345 } // testing loose coercion
    ];
    const pollutionRes = $df.data(pollutionData, { raw: $df.DataType.Utf8 }).select([
        $df.col("raw").str.to_camelcase().alias("camel"),
        $df.col("raw").str.to_snakecase().alias("snake")
    ]).to_dicts() as any[];

    console.log("Pollution / Coercion / Mixed Casing results:");
    console.dir(pollutionRes, { depth: null });

    // __proto__ and constructor should return empty string since they are filtered out
    if (pollutionRes[0].camel !== "") throw new Error(`__proto__ camel failed: got ${pollutionRes[0].camel}`);
    if (pollutionRes[0].snake !== "") throw new Error(`__proto__ snake failed: got ${pollutionRes[0].snake}`);
    if (pollutionRes[1].camel !== "") throw new Error(`constructor camel failed: got ${pollutionRes[1].camel}`);
    if (pollutionRes[1].snake !== "") throw new Error(`constructor snake failed: got ${pollutionRes[1].snake}`);

    // myTable데이터 should split and case convert correctly
    if (pollutionRes[2].camel !== "myTable데이터") throw new Error(`mixed camel failed: got ${pollutionRes[2].camel}`);
    if (pollutionRes[2].snake !== "my_table_데이터") throw new Error(`mixed snake failed: got ${pollutionRes[2].snake}`);

    // numbers (loose coercion) should case convert without crash
    if (pollutionRes[3].camel !== "12345") throw new Error(`coerced number camel failed: got ${pollutionRes[3].camel}`);
    if (pollutionRes[3].snake !== "12345") throw new Error(`coerced number snake failed: got ${pollutionRes[3].snake}`);

    // Tests for contains_any robustness and stateful regexes
    const containsEdgeDf = $df.data([
        { text: "apple pie" },
        { text: "apple tart" }
    ], { text: $df.DataType.Utf8 });
    const globalRegex = /apple/g;
    const containsEdgeRes = containsEdgeDf.select([
        $df.col("text").str.contains_any([globalRegex]).alias("global_regex_match"),
        $df.col("text").str.contains_any("apple" as any).alias("non_array_match"),
        $df.col("text").str.contains_any([null as any, "pie"]).alias("null_element_match")
    ]).to_dicts() as any[];

    if (containsEdgeRes[0].global_regex_match !== true || containsEdgeRes[1].global_regex_match !== true) {
        throw new Error(`Stateful regex contains_any failed across rows: got ${JSON.stringify(containsEdgeRes)}`);
    }
    if (containsEdgeRes[0].non_array_match !== true) {
        throw new Error(`Non-array contains_any failed: expected true, got ${containsEdgeRes[0].non_array_match}`);
    }
    if (containsEdgeRes[0].null_element_match !== true || containsEdgeRes[1].null_element_match !== false) {
        throw new Error(`Null element contains_any failed: got ${JSON.stringify(containsEdgeRes)}`);
    }

    // =========================================
    // ENCODE / DECODE TESTS
    // =========================================
    console.log("\n-----------------------------------------");
    console.log("RUNNING ENCODE & DECODE TESTS...");
    console.log("-----------------------------------------");

    const encDecDf = $df.data([
        { text: "hello world", invalid_hex: "123", invalid_b64: "invalid_b64!" },
        { text: "DFScript 🚀", invalid_hex: "gggg", invalid_b64: "bad===" },
        { text: null, invalid_hex: null, invalid_b64: null }
    ], {
        text: $df.DataType.Utf8,
        invalid_hex: $df.DataType.Utf8,
        invalid_b64: $df.DataType.Utf8
    });

    const encDecRes = encDecDf.select([
        $df.col("text").str.encode({ encoding: "hex" }).alias("hex_enc"),
        $df.col("text").str.encode({ encoding: "base64" }).alias("b64_enc"),
        $df.col("text").str.encode({ encoding: "hex" }).str.decode({ encoding: "hex" }).alias("hex_roundtrip"),
        $df.col("text").str.encode({ encoding: "base64" }).str.decode({ encoding: "base64" }).alias("b64_roundtrip"),
        $df.col("invalid_hex").str.decode({ encoding: "hex", strict: false }).alias("hex_non_strict"),
        $df.col("invalid_b64").str.decode({ encoding: "base64", strict: false }).alias("b64_non_strict")
    ]).to_dicts() as any[];

    console.log("Encode/Decode results:");
    console.dir(encDecRes, { depth: null });

    // Assert Hex & Base64 encodings
    if (encDecRes[0].hex_enc !== "68656c6c6f20776f726c64") throw new Error(`Hex encode failed: ${encDecRes[0].hex_enc}`);
    if (encDecRes[0].b64_enc !== "aGVsbG8gd29ybGQ=") throw new Error(`Base64 encode failed: ${encDecRes[0].b64_enc}`);
    if (encDecRes[0].hex_roundtrip !== "hello world") throw new Error(`Hex roundtrip failed: ${encDecRes[0].hex_roundtrip}`);
    if (encDecRes[0].b64_roundtrip !== "hello world") throw new Error(`Base64 roundtrip failed: ${encDecRes[0].b64_roundtrip}`);

    // Assert Unicode roundtrip
    if (encDecRes[1].hex_roundtrip !== "DFScript 🚀") throw new Error(`Unicode Hex roundtrip failed: ${encDecRes[1].hex_roundtrip}`);
    if (encDecRes[1].b64_roundtrip !== "DFScript 🚀") throw new Error(`Unicode Base64 roundtrip failed: ${encDecRes[1].b64_roundtrip}`);

    // Assert Null handling
    if (encDecRes[2].hex_enc !== null || encDecRes[2].b64_enc !== null || encDecRes[2].hex_roundtrip !== null || encDecRes[2].b64_roundtrip !== null) {
        throw new Error(`Null handling failed in encode/decode: ${JSON.stringify(encDecRes[2])}`);
    }

    // Assert Non-strict error handling returns null for invalid inputs
    if (encDecRes[0].hex_non_strict !== null || encDecRes[1].hex_non_strict !== null) {
        throw new Error(`Non-strict hex decode failed to return null: ${JSON.stringify(encDecRes)}`);
    }
    if (encDecRes[0].b64_non_strict !== null || encDecRes[1].b64_non_strict !== null) {
        throw new Error(`Non-strict base64 decode failed to return null: ${JSON.stringify(encDecRes)}`);
    }

    // Assert Strict mode throws error on invalid hex/b64
    let strictHexThrew = false;
    try {
        encDecDf.select([$df.col("invalid_hex").str.decode({ encoding: "hex", strict: true })]).to_dicts();
    } catch {
        strictHexThrew = true;
    }
    if (!strictHexThrew) throw new Error("Strict mode hex decode failed to throw on invalid hex!");

    let strictB64Threw = false;
    try {
        encDecDf.select([$df.col("invalid_b64").str.decode({ encoding: "base64", strict: true })]).to_dicts();
    } catch {
        strictB64Threw = true;
    }
    if (!strictB64Threw) throw new Error("Strict mode base64 decode failed to throw on invalid base64!");

    // =========================================
    // ADVANCED EDGE CASE ENCODE / DECODE TESTS
    // =========================================
    console.log("\n-----------------------------------------");
    console.log("RUNNING ADVANCED HEX & BASE64 EDGE CASE TESTS...");
    console.log("-----------------------------------------");

    const edgeDf = $df.data([
        { uppercase_hex: "68656C6C6F", padded_b64: "aGVsbG8gd29ybGQ=", unpadded_b64: "aGVsbG8gd29ybGQ", whitespace_hex: "  68656c6c6f  " },
        { uppercase_hex: "4446536372697074", padded_b64: "Y2Fmw6k=", unpadded_b64: "Y2Fmw6k", whitespace_hex: "\n68656c6c6f\t" },
        { uppercase_hex: "", padded_b64: "", unpadded_b64: "", whitespace_hex: "" }
    ]);

    const edgeRes = edgeDf.select([
        $df.col("uppercase_hex").str.decode({ encoding: "hex" }).alias("dec_upper_hex"),
        $df.col("padded_b64").str.decode({ encoding: "base64" }).alias("dec_padded_b64"),
        $df.col("unpadded_b64").str.decode({ encoding: "base64" }).alias("dec_unpadded_b64"),
        $df.col("whitespace_hex").str.decode({ encoding: "hex" }).alias("dec_ws_hex")
    ]).to_dicts() as any[];

    console.log("Advanced Edge Case Results:");
    console.dir(edgeRes, { depth: null });

    // Assert uppercase hex decoding
    if (edgeRes[0].dec_upper_hex !== "hello" || edgeRes[1].dec_upper_hex !== "DFScript") {
        throw new Error(`Uppercase hex decode failed: ${JSON.stringify(edgeRes)}`);
    }

    // Assert unpadded base64 vs padded base64 equivalence
    if (edgeRes[0].dec_padded_b64 !== "hello world" || edgeRes[0].dec_unpadded_b64 !== "hello world") {
        throw new Error(`Base64 padding normalization failed: ${JSON.stringify(edgeRes[0])}`);
    }

    // Assert accented UTF-8 base64
    if (edgeRes[1].dec_padded_b64 !== "café" || edgeRes[1].dec_unpadded_b64 !== "café") {
        throw new Error(`Accented base64 decode failed: ${JSON.stringify(edgeRes[1])}`);
    }

    // Assert whitespace trimming on hex decode
    if (edgeRes[0].dec_ws_hex !== "hello" || edgeRes[1].dec_ws_hex !== "hello") {
        throw new Error(`Whitespace hex decode failed: ${JSON.stringify(edgeRes)}`);
    }

    // Assert empty string roundtrips
    if (edgeRes[2].dec_upper_hex !== "" || edgeRes[2].dec_padded_b64 !== "" || edgeRes[2].dec_unpadded_b64 !== "") {
        throw new Error(`Empty string decode failed: ${JSON.stringify(edgeRes[2])}`);
    }

    // =========================================
    // COUNT_MATCHES TESTS
    // =========================================
    console.log("\n-----------------------------------------");
    console.log("RUNNING COUNT_MATCHES TESTS...");
    console.log("-----------------------------------------");

    const matchDf = $df.data([
        { text: "banana", pattern: "a" },
        { text: "apple.banana.cherry", pattern: "." },
        { text: "hello 123 world 456", pattern: "\\d+" },
        { text: "test", pattern: "" },
        { text: null, pattern: "a" }
    ]);

    const matchRes = matchDf.select([
        $df.col("text").str.count_matches("a").alias("count_a"),
        $df.col("text").str.count_matches(/./g).alias("count_regex_dot"),
        $df.col("text").str.count_matches(".", { literal: true }).alias("count_literal_dot"),
        $df.col("text").str.count_matches(/\d+/g).alias("count_regex_digits"),
        $df.col("text").str.count_matches("").alias("count_empty_pat")
    ]).to_dicts() as any[];

    if (matchRes[0].count_a !== 3) throw new Error(`count_matches 'a' failed: ${matchRes[0].count_a}`);
    if (matchRes[1].count_regex_dot !== 19) throw new Error(`count_matches regex dot failed: ${matchRes[1].count_regex_dot}`);
    if (matchRes[1].count_literal_dot !== 2) throw new Error(`count_matches literal dot failed: ${matchRes[1].count_literal_dot}`);
    if (matchRes[2].count_regex_digits !== 2) throw new Error(`count_matches regex digits failed: ${matchRes[2].count_regex_digits}`);
    if (matchRes[3].count_empty_pat !== 5) throw new Error(`count_matches empty pat failed: ${matchRes[3].count_empty_pat}`);
    if (matchRes[4].count_a !== null) throw new Error(`count_matches null input failed: ${matchRes[4].count_a}`);

    // Detailed count_matches edge case battery
    const advMatchDf = $df.data([
        { str: "aaaa", pat: "aa" },                             // non-overlapping check -> 2
        { str: "🚀🚀hello🚀", pat: "🚀" },                     // Unicode emoji -> 3
        { str: "$100 + $200 = $300", pat: "$[0-9]+" },         // literal option boolean check
        { str: "Foo BAR foo Bar", pat: "foo" },                 // Case sensitivity / non-global regex
        { str: "\n\n\n", pat: "\n" },                           // Newline characters -> 3
        { str: "", pat: "abc" },                                // Empty string input -> 0
        { str: "123123123", pat: 123 }                         // Number coercion pattern -> 3
    ]);

    const advMatchRes = advMatchDf.select([
        $df.col("str").str.count_matches("aa").alias("non_overlap"),
        $df.col("str").str.count_matches("🚀").alias("emoji_count"),
        $df.col("str").str.count_matches("$[0-9]+", true).alias("literal_bool"),
        $df.col("str").str.count_matches(/foo/i).alias("non_global_regex"),
        $df.col("str").str.count_matches("\n").alias("newline_count"),
        $df.col("str").str.count_matches("abc").alias("empty_str_input"),
        $df.col("str").str.count_matches(123 as any).alias("num_coerced_pat"),
        $df.col("str").str.count_matches(null as any).alias("null_pat")
    ]).to_dicts() as any[];

    if (advMatchRes[0].non_overlap !== 2) throw new Error(`advMatch non_overlap failed: ${advMatchRes[0].non_overlap}`);
    if (advMatchRes[1].emoji_count !== 3) throw new Error(`advMatch emoji_count failed: ${advMatchRes[1].emoji_count}`);
    if (advMatchRes[2].literal_bool !== 0) throw new Error(`advMatch literal_bool failed: ${advMatchRes[2].literal_bool}`);
    if (advMatchRes[3].non_global_regex !== 2) throw new Error(`advMatch non_global_regex failed: ${advMatchRes[3].non_global_regex}`);
    if (advMatchRes[4].newline_count !== 3) throw new Error(`advMatch newline_count failed: ${advMatchRes[4].newline_count}`);
    if (advMatchRes[5].empty_str_input !== 0) throw new Error(`advMatch empty_str_input failed: ${advMatchRes[5].empty_str_input}`);
    if (advMatchRes[6].num_coerced_pat !== 3) throw new Error(`advMatch num_coerced_pat failed: ${advMatchRes[6].num_coerced_pat}`);
    if (advMatchRes[0].null_pat !== null) throw new Error(`advMatch null_pat failed: ${advMatchRes[0].null_pat}`);

    // EXTREME ODD EDGE CASES BATTERY FOR COUNT_MATCHES
    const dirtyRegex = /test/g;
    dirtyRegex.lastIndex = 3; // Dirty stateful lastIndex

    const extremeDf = $df.data([
        { str: "test test test", pat: dirtyRegex },
        { str: "foo\nbar\nfoo", pat: /^foo/m },
        { str: "a\nb\na\nb", pat: /a.b/s },
        { str: "banana", pat: /(?=a)/g },
        { str: "$1$2$&$\\$ $1$2", pat: "$1$2" },
        { str: "a".repeat(50000), pat: "a" },
        { str: "\t\r\n\t\r\n", pat: "\t" },
        { str: "value is -3.14 and -3.14", pat: -3.14 },
        { str: "code 100 and 100", pat: 100n },
        { str: new String("banana") as any, pat: new String("a") as any }
    ]);

    const extremeRes = extremeDf.select([
        $df.col("str").str.count_matches(dirtyRegex).alias("dirty_regex_count"),
        $df.col("str").str.count_matches(/^foo/m).alias("multiline_regex"),
        $df.col("str").str.count_matches(/a.b/s).alias("dotall_regex"),
        $df.col("str").str.count_matches(/(?=a)/g).alias("lookahead_regex"),
        $df.col("str").str.count_matches("$1$2", { literal: true }).alias("regex_special_lit"),
        $df.col("str").str.count_matches("a").alias("large_repeat_50k"),
        $df.col("str").str.count_matches("\t").alias("tab_count"),
        $df.col("str").str.count_matches(-3.14 as any).alias("float_pat"),
        $df.col("str").str.count_matches(100n as any).alias("bigint_pat"),
        $df.col("str").str.count_matches("a").alias("boxed_string")
    ]).to_dicts() as any[];

    if (extremeRes[0].dirty_regex_count !== 3) throw new Error(`dirty_regex_count failed: ${extremeRes[0].dirty_regex_count}`);
    if (extremeRes[1].multiline_regex !== 2) throw new Error(`multiline_regex failed: ${extremeRes[1].multiline_regex}`);
    if (extremeRes[2].dotall_regex !== 2) throw new Error(`dotall_regex failed: ${extremeRes[2].dotall_regex}`);
    if (extremeRes[3].lookahead_regex !== 3) throw new Error(`lookahead_regex failed: ${extremeRes[3].lookahead_regex}`);
    if (extremeRes[4].regex_special_lit !== 2) throw new Error(`regex_special_lit failed: ${extremeRes[4].regex_special_lit}`);
    if (extremeRes[5].large_repeat_50k !== 50000) throw new Error(`large_repeat_50k failed: ${extremeRes[5].large_repeat_50k}`);
    if (extremeRes[6].tab_count !== 2) throw new Error(`tab_count failed: ${extremeRes[6].tab_count}`);
    if (extremeRes[7].float_pat !== 2) throw new Error(`float_pat failed: ${extremeRes[7].float_pat}`);
    if (extremeRes[8].bigint_pat !== 2) throw new Error(`bigint_pat failed: ${extremeRes[8].bigint_pat}`);
    if (extremeRes[9].boxed_string !== 3) throw new Error(`boxed_string failed: ${extremeRes[9].boxed_string}`);

    // =========================================
    // ESCAPE_REGEX TESTS
    // =========================================
    console.log("\n-----------------------------------------");
    console.log("RUNNING ESCAPE_REGEX TESTS...");
    console.log("-----------------------------------------");

    const escapeDf = $df.data([
        { raw: "hello.world*foo+bar?baz^1$2|3(4)[5]{6}/7-8\\9" },
        { raw: "plain text" },
        { raw: null }
    ]);

    const escapeRes = escapeDf.select([
        $df.col("raw").str.escape_regex().alias("escaped"),
        $df.col("raw").str.escape_regex({ mode: "non_alphanumeric_ascii" }).alias("escaped_mode_ascii")
    ]).to_dicts() as any[];

    if (escapeRes[0].escaped !== "hello\\.world\\*foo\\+bar\\?baz\\^1\\$2\\|3\\(4\\)\\[5\\]\\{6\\}\\/7\\-8\\\\9") {
        throw new Error(`escape_regex special chars failed: ${escapeRes[0].escaped}`);
    }
    if (escapeRes[1].escaped !== "plain text") throw new Error(`escape_regex plain text failed: ${escapeRes[1].escaped}`);
    if (escapeRes[1].escaped_mode_ascii !== "plain\\ text") throw new Error(`escape_regex mode non_alphanumeric_ascii failed: ${escapeRes[1].escaped_mode_ascii}`);
    if (escapeRes[2].escaped !== null) throw new Error(`escape_regex null check failed: ${escapeRes[2].escaped}`);

    // =========================================
    // EXTRACT_ALL / EXTRACT_GROUPS / EXTRACT_MANY TESTS
    // =========================================
    console.log("\n-----------------------------------------");
    console.log("RUNNING EXTRACT_ALL, EXTRACT_GROUPS, EXTRACT_MANY TESTS...");
    console.log("-----------------------------------------");

    const extractDf = $df.data([
        { text: "user_123_item_456", code: "id:100-name:alice", null_text: null },
        { text: "no numbers here", code: "val:200", null_text: null }
    ]);

    const extractRes = extractDf.select([
        // --- extract_all ---
        $df.col("text").str.extract_all(/\d+/).alias("all_nums"),
        $df.col("text").str.extract_all(/([a-z]+)_(\d+)/, { groupIndex: 2 }).alias("all_group2"),
        $df.col("null_text").str.extract_all(/\d+/).alias("all_null"),

        // --- extract_groups ---
        $df.col("code").str.extract_groups(/(?<id_key>id:\d+)-(?<name_key>name:\w+)/).alias("named_groups"),
        $df.col("code").str.extract_groups(/(\w+):(\d+)/).alias("positional_groups"),
        $df.col("text").str.extract_groups(/no_match_pattern/).alias("no_match_groups"),
        $df.col("null_text").str.extract_groups(/\w+/).alias("null_groups"),

        // --- extract_many ---
        $df.col("text").str.extract_many([/\d+/, /item/, /missing/]).alias("many_default"),
        $df.col("text").str.extract_many([/USER_\d+/, /ITEM_\d+/], { asciiCaseInsensitive: true }).alias("many_group1"),
        $df.col("null_text").str.extract_many([/\d+/]).alias("many_null"),

        // --- extract: options object ---
        $df.col("code").str.extract(/(\w+):(\d+)/, { groupIndex: 2 }).alias("extract_opt"),
        $df.col("text").str.extract_all(/([a-z]+)_(\d+)/, { groupIndex: 2 }).alias("all_group2_opt"),
        $df.col("text").str.extract_many([/USER_\d+/, /ITEM_\d+/], { asciiCaseInsensitive: true }).alias("many_group1_opt"),

        // --- extract: named group & negative index ---
        $df.col("code").str.extract(/(?<num>\d+)/, { groupIndex: "num" }).alias("extract_named_str"),
        $df.col("code").str.extract(/(\w+):(\d+)/, { groupIndex: -1 }).alias("extract_neg_1"),
        $df.col("code").str.extract(/(\w+):(\d+)/gy, { groupIndex: 2 }).alias("extract_gy_flags"),

        // === EDGE CASES ===

        // extract: groupIndex 0 → full match
        $df.col("code").str.extract(/\d+/, { groupIndex: 0 }).alias("extract_group0"),
        // extract: string pattern (no regex), default groupIndex → full match (group 1 doesn't exist → null)
        $df.col("code").str.extract("id:").alias("extract_str_pattern"),
        // extract: no match → null
        $df.col("code").str.extract(/ZZZNOMATCH/).alias("extract_no_match"),
        // extract: null pattern guard → null column
        $df.col("code").str.extract(null as any).alias("extract_null_pattern"),
        // extract: out-of-range groupIndex → null
        $df.col("code").str.extract(/(\d+)/, { groupIndex: 99 }).alias("extract_oob_group"),
        // extract: asciiCaseInsensitive
        $df.col("code").str.extract(/ID:\d+/, { asciiCaseInsensitive: true, groupIndex: 0 }).alias("extract_case_insensitive"),

        // extract_all: string pattern (literal) → all full matches
        $df.col("text").str.extract_all("_").alias("extract_all_str"),
        // extract_all: groupIndex 0 → full match per occurrence
        $df.col("text").str.extract_all(/[a-z]+_\d+/, { groupIndex: 0 }).alias("extract_all_group0"),
        // extract_all: asciiCaseInsensitive
        $df.col("text").str.extract_all(/USER_\d+/, { asciiCaseInsensitive: true }).alias("extract_all_case"),
        // extract_all: no match → empty array (not null)
        $df.col("code").str.extract_all(/ZZZNOMATCH/).alias("extract_all_no_match"),
        // extract_all: null pattern guard → null
        $df.col("code").str.extract_all(null as any).alias("extract_all_null_pattern"),

        // extract_groups: no capture groups → only "0" key (full match)
        $df.col("code").str.extract_groups(/\d+/).alias("groups_no_captures"),
        // extract_groups: mixed named + positional
        $df.col("code").str.extract_groups(/(?<word>\w+):(\d+)/).alias("groups_mixed"),
        // extract_groups: includes "0" key (full match)
        $df.col("code").str.extract_groups(/(\w+):(\d+)/).alias("groups_has_zero"),

        // extract_many: empty patterns array → empty result array
        $df.col("text").str.extract_many([]).alias("many_empty"),
        // extract_many: single non-array pattern (auto-wrapped)
        $df.col("text").str.extract_many([/\d+/]).alias("many_single"),
        // extract_many: groupIndex captures group 1
        $df.col("text").str.extract_many([/([a-z]+)_(\d+)/], { groupIndex: 1 }).alias("many_group1_cap"),
        // extract_many: all patterns miss → all nulls
        $df.col("text").str.extract_many([/ZZZA/, /ZZZB/]).alias("many_all_null"),
        // extract_many: null patterns guard → null
        $df.col("text").str.extract_many(null as any).alias("many_null_patterns")
    ]).to_dicts() as any[];

    // Row 0 assertions
    const r0Extract = extractRes[0];
    if (r0Extract.extract_opt !== "100") throw new Error(`extract options object failed: ${r0Extract.extract_opt}`);
    if (JSON.stringify(r0Extract.all_nums) !== JSON.stringify(["123", "456"])) {
        throw new Error(`extract_all failed row 0 all_nums: ${JSON.stringify(r0Extract.all_nums)}`);
    }
    if (JSON.stringify(r0Extract.all_group2) !== JSON.stringify(["123", "456"])) {
        throw new Error(`extract_all failed row 0 all_group2: ${JSON.stringify(r0Extract.all_group2)}`);
    }
    if (JSON.stringify(r0Extract.all_group2_opt) !== JSON.stringify(["123", "456"])) {
        throw new Error(`extract_all options object failed: ${JSON.stringify(r0Extract.all_group2_opt)}`);
    }
    if (r0Extract.all_null !== null) throw new Error(`extract_all failed null_text: ${r0Extract.all_null}`);

    // extract_groups: check named keys (result also includes "0", "1", "2" positional keys)
    const ng = r0Extract.named_groups;
    if (ng?.id_key !== "id:100" || ng?.name_key !== "name:alice") {
        throw new Error(`extract_groups failed row 0 named_groups: ${JSON.stringify(ng)}`);
    }
    // extract_groups: check positional keys (result includes "0" for full match)
    const pg = r0Extract.positional_groups;
    if (pg?.["1"] !== "id" || pg?.["2"] !== "100" || pg?.["0"] !== "id:100") {
        throw new Error(`extract_groups failed row 0 positional_groups: ${JSON.stringify(pg)}`);
    }
    if (r0Extract.no_match_groups !== null) throw new Error(`extract_groups failed no match: ${r0Extract.no_match_groups}`);
    if (r0Extract.null_groups !== null) throw new Error(`extract_groups failed null string: ${r0Extract.null_groups}`);

    if (JSON.stringify(r0Extract.many_default) !== JSON.stringify(["123", "item", null])) {
        throw new Error(`extract_many failed row 0 many_default: ${JSON.stringify(r0Extract.many_default)}`);
    }
    if (JSON.stringify(r0Extract.many_group1) !== JSON.stringify(["user_123", "item_456"])) {
        throw new Error(`extract_many failed row 0 many_group1: ${JSON.stringify(r0Extract.many_group1)}`);
    }
    if (JSON.stringify(r0Extract.many_group1_opt) !== JSON.stringify(["user_123", "item_456"])) {
        throw new Error(`extract_many options object failed: ${JSON.stringify(r0Extract.many_group1_opt)}`);
    }
    if (r0Extract.many_null !== null) throw new Error(`extract_many failed null string: ${r0Extract.many_null}`);

    if (r0Extract.extract_named_str !== "100") {
        throw new Error(`extract_named_str failed: ${r0Extract.extract_named_str}`);
    }
    if (r0Extract.extract_neg_1 !== "100") {
        throw new Error(`extract_neg_1 failed: ${r0Extract.extract_neg_1}`);
    }
    if (r0Extract.extract_gy_flags !== "100") {
        throw new Error(`extract_gy_flags failed: ${r0Extract.extract_gy_flags}`);
    }

    // === EDGE CASE ASSERTIONS ===

    // extract: groupIndex 0 → full match ("100" is first \d+ in "id:100-name:alice")
    if (r0Extract.extract_group0 !== "100") throw new Error(`extract groupIndex:0 failed: ${r0Extract.extract_group0}`);
    // extract: string pattern, groupIndex defaults to 1 (no group → null)
    if (r0Extract.extract_str_pattern !== null) throw new Error(`extract string pattern failed: ${r0Extract.extract_str_pattern}`);
    // extract: no match → null
    if (r0Extract.extract_no_match !== null) throw new Error(`extract no match failed: ${r0Extract.extract_no_match}`);
    // extract: null pattern → null
    if (r0Extract.extract_null_pattern !== null) throw new Error(`extract null pattern failed: ${r0Extract.extract_null_pattern}`);
    // extract: out-of-range groupIndex → null
    if (r0Extract.extract_oob_group !== null) throw new Error(`extract oob groupIndex failed: ${r0Extract.extract_oob_group}`);
    // extract: asciiCaseInsensitive
    if (r0Extract.extract_case_insensitive !== "id:100") throw new Error(`extract asciiCaseInsensitive failed: ${r0Extract.extract_case_insensitive}`);

    // extract_all: string pattern → ["_", "_", "_"] (3 underscores in "user_123_item_456")
    if (JSON.stringify(r0Extract.extract_all_str) !== JSON.stringify(["_", "_", "_"])) {
        throw new Error(`extract_all string pattern failed: ${JSON.stringify(r0Extract.extract_all_str)}`);
    }
    // extract_all: groupIndex 0 → full match per occurrence
    if (JSON.stringify(r0Extract.extract_all_group0) !== JSON.stringify(["user_123", "item_456"])) {
        throw new Error(`extract_all groupIndex:0 failed: ${JSON.stringify(r0Extract.extract_all_group0)}`);
    }
    // extract_all: asciiCaseInsensitive
    if (JSON.stringify(r0Extract.extract_all_case) !== JSON.stringify(["user_123"])) {
        throw new Error(`extract_all asciiCaseInsensitive failed: ${JSON.stringify(r0Extract.extract_all_case)}`);
    }
    // extract_all: no match → empty array (not null)
    if (JSON.stringify(r0Extract.extract_all_no_match) !== JSON.stringify([])) {
        throw new Error(`extract_all no match failed: ${JSON.stringify(r0Extract.extract_all_no_match)}`);
    }
    // extract_all: null pattern → null
    if (r0Extract.extract_all_null_pattern !== null) throw new Error(`extract_all null pattern failed: ${r0Extract.extract_all_null_pattern}`);

    // extract_groups: no capture groups → only "0" key
    const gnc = r0Extract.groups_no_captures;
    if (gnc?.["0"] !== "100" || Object.keys(gnc).length !== 1) {
        throw new Error(`extract_groups no captures failed: ${JSON.stringify(gnc)}`);
    }
    // extract_groups: mixed named + positional
    const gm = r0Extract.groups_mixed;
    if (gm?.word !== "id" || gm?.["2"] !== "100") {
        throw new Error(`extract_groups mixed failed: ${JSON.stringify(gm)}`);
    }
    // extract_groups: "0" key present (full match)
    if (r0Extract.groups_has_zero?.["0"] !== "id:100") {
        throw new Error(`extract_groups "0" key failed: ${JSON.stringify(r0Extract.groups_has_zero)}`);
    }

    // extract_many: empty patterns array → empty array
    if (JSON.stringify(r0Extract.many_empty) !== JSON.stringify([])) {
        throw new Error(`extract_many empty patterns failed: ${JSON.stringify(r0Extract.many_empty)}`);
    }
    // extract_many: single pattern
    if (JSON.stringify(r0Extract.many_single) !== JSON.stringify(["123"])) {
        throw new Error(`extract_many single pattern failed: ${JSON.stringify(r0Extract.many_single)}`);
    }
    // extract_many: groupIndex:1 → first capture group
    if (JSON.stringify(r0Extract.many_group1_cap) !== JSON.stringify(["user"])) {
        throw new Error(`extract_many groupIndex:1 failed: ${JSON.stringify(r0Extract.many_group1_cap)}`);
    }
    // extract_many: all miss → all null
    if (JSON.stringify(r0Extract.many_all_null) !== JSON.stringify([null, null])) {
        throw new Error(`extract_many all miss failed: ${JSON.stringify(r0Extract.many_all_null)}`);
    }
    // extract_many: null patterns → null
    if (r0Extract.many_null_patterns !== null) throw new Error(`extract_many null patterns failed: ${r0Extract.many_null_patterns}`);

    // Row 1 assertions
    const r1Extract = extractRes[1];
    if (JSON.stringify(r1Extract.all_nums) !== JSON.stringify([])) {
        throw new Error(`extract_all failed row 1 no matches: ${JSON.stringify(r1Extract.all_nums)}`);
    }
    // Row 1: extract on non-matching code "val:200" with /\d+/ → "200"
    if (r1Extract.extract_group0 !== "200") throw new Error(`extract groupIndex:0 row1 failed: ${r1Extract.extract_group0}`);
    // Row 1: extract_all string pattern on "no numbers here" → []
    if (JSON.stringify(r1Extract.extract_all_str) !== JSON.stringify([])) {
        throw new Error(`extract_all string pattern row1 failed: ${JSON.stringify(r1Extract.extract_all_str)}`);
    }
    // Row 1: extract_many empty → []
    if (JSON.stringify(r1Extract.many_empty) !== JSON.stringify([])) {
        throw new Error(`extract_many empty row1 failed: ${JSON.stringify(r1Extract.many_empty)}`);
    }

    // ============================================================================
    // REGEX & EXTRACTION ADVANCED EDGE CASE TESTS
    // ============================================================================
    console.log("\n-----------------------------------------");
    console.log("RUNNING ADVANCED EXTRACTION EDGE CASE TESTS...");
    console.log("-----------------------------------------");

    const advEdgeDf = $df.data({
        empty_str: [""],
        unicode_str: ["foo 🚀 bar 🎯 123"],
        boundary_str: ["abc def ghi"],
        pattern_str: ["foo123bar456"]
    });

    const advEdgeRes = advEdgeDf.with_columns([
        // 1. Zero-width match (boundary \b and empty string regex)
        $df.col("boundary_str").str.extract_all(/\b/).alias("zero_width_all"),
        $df.col("empty_str").str.extract(/^/, { groupIndex: 0 }).alias("zero_width_start"),
        $df.col("empty_str").str.extract_all(/^/).alias("zero_width_start_all"),
        // 2. Unicode and flag preservation (multiline 'm', dotAll 's', unicode 'u')
        $df.col("unicode_str").str.extract(/🚀 (\w+)/u).alias("unicode_flag_extract"),
        $df.col("unicode_str").str.extract_all(/[\p{Extended_Pictographic}]/u).alias("unicode_emoji_all"),
        // 3. Pre-compiled RegExp with sticky ('y') and global ('g') flags passed into toCleanRegExp
        $df.col("pattern_str").str.extract(new RegExp("\\d+", "gy"), { groupIndex: 0 }).alias("sticky_flag_extract"),
        $df.col("pattern_str").str.extract_all(new RegExp("\\d+", "gy")).alias("sticky_flag_extract_all"),
        // 4. Overlapping patterns and negative group indices in extract_many
        $df.col("pattern_str").str.extract_many([/\d+/, /[a-z]+/], { groupIndex: -1 }).alias("extract_many_neg_group"),
        // 5. extract_groups with zero-width / non-matching optional group
        $df.col("pattern_str").str.extract_groups(/(?<letters>[a-z]+)(?<digits>\d+)?(?<optional>ZZZ)?/).alias("groups_optional_miss")
    ]).to_dicts() as any[];

    const r0AdvEdge = advEdgeRes[0];

    // Assert zero-width matches handle cleanly without infinite loops
    if (JSON.stringify(r0AdvEdge.zero_width_start_all) !== JSON.stringify([""])) {
        throw new Error(`zero_width_start_all failed: ${JSON.stringify(r0AdvEdge.zero_width_start_all)}`);
    }
    if (r0AdvEdge.zero_width_start !== "") {
        throw new Error(`zero_width_start failed: ${r0AdvEdge.zero_width_start}`);
    }

    // Assert Unicode emoji extraction
    if (r0AdvEdge.unicode_flag_extract !== "bar") {
        throw new Error(`unicode_flag_extract failed: ${r0AdvEdge.unicode_flag_extract}`);
    }
    if (JSON.stringify(r0AdvEdge.unicode_emoji_all) !== JSON.stringify(["🚀", "🎯"])) {
        throw new Error(`unicode_emoji_all failed: ${JSON.stringify(r0AdvEdge.unicode_emoji_all)}`);
    }

    // Assert sticky 'y' flag was normalized and stripped cleanly
    if (r0AdvEdge.sticky_flag_extract !== "123") {
        throw new Error(`sticky_flag_extract failed: ${r0AdvEdge.sticky_flag_extract}`);
    }
    if (JSON.stringify(r0AdvEdge.sticky_flag_extract_all) !== JSON.stringify(["123", "456"])) {
        throw new Error(`sticky_flag_extract_all failed: ${JSON.stringify(r0AdvEdge.sticky_flag_extract_all)}`);
    }

    // Assert negative groupIndex in extract_many (-1 gets last group)
    if (JSON.stringify(r0AdvEdge.extract_many_neg_group) !== JSON.stringify(["123", "foo"])) {
        throw new Error(`extract_many_neg_group failed: ${JSON.stringify(r0AdvEdge.extract_many_neg_group)}`);
    }

    // Assert optional unmatched group in extract_groups is null
    const gOpt = r0AdvEdge.groups_optional_miss;
    if (gOpt?.letters !== "foo" || gOpt?.digits !== "123" || gOpt?.optional !== null) {
        throw new Error(`groups_optional_miss failed: ${JSON.stringify(gOpt)}`);
    }

    // 6. extract_many with leftmost: true and overlapping: true test
    const optTestDf = $df.data({ text: ["user_123_prod"] });
    const leftmostRes = optTestDf.with_columns([
        $df.col("text").str.extract_many([/user_\d+/, /123/], { leftmost: true }).alias("many_leftmost"),
        $df.col("text").str.extract_many([/user_\d+/, /123/], { overlapping: true }).alias("many_overlapping")
    ]).to_dicts() as any[];

    if (JSON.stringify(leftmostRes[0].many_leftmost) !== JSON.stringify(["user_123", null])) {
        throw new Error(`extract_many leftmost failed: ${JSON.stringify(leftmostRes[0].many_leftmost)}`);
    }
    if (JSON.stringify(leftmostRes[0].many_overlapping) !== JSON.stringify(["user_123", "123"])) {
        throw new Error(`extract_many overlapping failed: ${JSON.stringify(leftmostRes[0].many_overlapping)}`);
    }

    // Assert InvalidArgumentError when overlapping: true and leftmost: true are both specified
    let invalidArgThrown = false;
    try {
        optTestDf.with_columns([
            $df.col("text").str.extract_many([/user_\d+/], { overlapping: true, leftmost: true }).alias("err")
        ]).to_dicts();
    } catch (err: any) {
        if (err.name === "InvalidArgumentError" || err.message.includes("Cannot specify both")) {
            invalidArgThrown = true;
        }
    }
    if (!invalidArgThrown) {
        throw new Error("extract_many failed to throw InvalidArgumentError when both overlapping and leftmost are true");
    }

    console.log("\n🎉 ALL Expr.str COLUMN EXPRESSION & CASTING TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("\n❌ Expr.str COLUMN EXPRESSION TESTS FAILED:", err);
    process.exit(1);
}


