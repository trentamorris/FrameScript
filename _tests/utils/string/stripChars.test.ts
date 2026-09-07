declare const process: any;
import { stripChars } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING STRIPCHARS TESTS...");
console.log("=========================================");

let testsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
    testsPassed++;
}

function assertEqual(actual: any, expected: any, msg: string) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error(`Assertion failed: ${msg}\n  Expected: ${e}\n  Actual:   ${a}`);
    }
    testsPassed++;
}

try {
    // 2. stripChars with null/undefined inputs
    if (stripChars(null) !== null) throw new Error("Expected stripChars(null) to be null");
    if (stripChars(undefined) !== null) throw new Error("Expected stripChars(undefined) to be null");
    if (stripChars(null, null, { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars(null, null, { returnStringOnNull: true }) to be ''");

    // 3. stripChars with characters == null (whitespace fallback)
    // 3a. returnStringOnNull: false (default)
    if (stripChars("   ") !== null) throw new Error("Expected stripChars('   ') to be null");
    if (stripChars("   ", null, { returnStringOnNull: false }) !== null) throw new Error("Expected stripChars('   ', null, { returnStringOnNull: false }) to be null");
    if (stripChars("  abc  ") !== "abc") throw new Error("Expected stripChars('  abc  ') to be 'abc'");
    // 3b. returnStringOnNull: true
    if (stripChars("   ", null, { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('   ', null, { returnStringOnNull: true }) to be ''");
    if (stripChars("", null, { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('', null, { returnStringOnNull: true }) to be ''");

    // 4. stripChars with characters != null
    // 4a. returnStringOnNull: false (default)
    if (stripChars("abc", "abc") !== null) throw new Error("Expected stripChars('abc', 'abc') to be null");
    if (stripChars("abc", "abc", { returnStringOnNull: false }) !== null) throw new Error("Expected stripChars('abc', 'abc', { returnStringOnNull: false }) to be null");
    if (stripChars("aabbccddeeff", "abcdef") !== null) throw new Error("Expected stripChars('aabbccddeeff', 'abcdef') to be null");
    if (stripChars("  abc  ", "abc", { trimFirst: true }) !== null) throw new Error("Expected stripChars('  abc  ', 'abc', { trimFirst: true }) to be null");
    if (stripChars("  abXba  ", "abc", { trimFirst: true }) !== "X") throw new Error("Expected stripChars('  abXba  ', 'abc', { trimFirst: true }) to be 'X'");
    // 4b. returnStringOnNull: true
    if (stripChars("abc", "abc", { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('abc', 'abc', { returnStringOnNull: true }) to be ''");
    if (stripChars("  abc  ", "abc", { trimFirst: true, returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('  abc  ', 'abc', { trimFirst: true, returnStringOnNull: true }) to be ''");

    // 5. Contiguous stripping (standard behavior)
    if (stripChars("hhello", "h") !== "ello") throw new Error("Expected stripChars('hhello', 'h') to be 'ello'");
    if (stripChars("hhelloh", "h") !== "ello") throw new Error("Expected stripChars('hhelloh', 'h') to be 'ello'");

    // 6. Scanning offset window contiguous stripping tests
    if (stripChars("aloud", "lou", { maxScanStart: 2, maxScanEnd: 2 }) !== "ad") throw new Error("Expected stripChars('aloud', 'lou', { maxScanStart: 2, maxScanEnd: 2 }) to be 'ad'");
    if (stripChars("aaloud", "lou", { maxScanStart: 2, maxScanEnd: 2 }) !== "aad") throw new Error("Expected stripChars('aaloud', 'lou', { maxScanStart: 2, maxScanEnd: 2 }) to be 'aad'");
    if (stripChars("aaloud", "lou", { maxScanStart: 2, maxScanEnd: 1 }) !== "aaloud") throw new Error("Expected stripChars('aaloud', 'lou', { maxScanStart: 2, maxScanEnd: 1 }) to be 'aaloud'");
    if (stripChars("aaloud", "lou", { maxScanStart: 3, maxScanEnd: 1 }) !== "aad") throw new Error("Expected stripChars('aaloud', 'lou', { maxScanStart: 3, maxScanEnd: 1 }) to be 'aad'");

    // 7. stripChars with RegExp characters
    if (stripChars("123hello456", /[0-9]/) !== "hello") throw new Error("Expected stripChars('123hello456', /[0-9]/) to be 'hello'");
    if (stripChars("123hello456", /[0-9]/, { mode: "start" }) !== "hello456") throw new Error("Expected stripChars('123hello456', /[0-9]/, { mode: 'start' }) to be 'hello456'");
    if (stripChars("123hello456", /[0-9]/, { mode: "end" }) !== "123hello") throw new Error("Expected stripChars('123hello456', /[0-9]/, { mode: 'end' }) to be '123hello'");
    if (stripChars("abc123xyz", /[a-z]/, { maxScanStart: 3, maxScanEnd: 3 }) !== "123") throw new Error("Expected stripChars('abc123xyz', /[a-z]/, { maxScanStart: 3, maxScanEnd: 3 }) to be '123'");
    if (stripChars("12abc34", /[a-z]/, { maxScanStart: 3, maxScanEnd: 3 }) !== "1234") throw new Error("Expected stripChars('12abc34', /[a-z]/, { maxScanStart: 3, maxScanEnd: 3 }) to be '1234'");

    // 8. stripChars with unlimited (-1 or null) scanning
    if (stripChars("aaloud", "lou", { maxScanStart: -1, maxScanEnd: 1 }) !== "aad") throw new Error("Expected -1 maxScanStart to do unlimited start scanning");
    if (stripChars("12abc34xyz56", /[a-z]/, { maxScanStart: null, maxScanEnd: null }) !== "123456") throw new Error("Expected null maxScanStart/End to do unlimited scanning");
    if (stripChars("12abc34xyz56", /[a-z]/, { maxScanStart: -1, maxScanEnd: 1 }) !== "1234xyz56") throw new Error("Expected -1 maxScanStart with 1 maxScanEnd to only strip start match");

    // 9. stripChars with multiple matches (maxMatchesStart / maxMatchesEnd)
    if (stripChars("alouloud", "ou", { maxScanStart: -1, maxMatchesStart: 2 }) !== "alld") throw new Error("Expected 2 matches to strip both ou blocks");
    if (stripChars("alouloud", "ou", { maxScanStart: -1, maxMatchesStart: 1 }) !== "alloud") throw new Error("Expected 1 match to only strip the first ou block");
    if (stripChars("abc12xyz34xyz56", "xyz", { maxScanEnd: -1, maxMatchesEnd: 2 }) !== "abc123456") throw new Error("Expected 2 matches from end to strip both xyz blocks");
    if (stripChars("alouloud", "ou", { maxScanStart: 4, maxMatchesStart: 2 }) !== "alld") throw new Error("Expected 2 matches to be allowed with maxScanStart 4");
    if (stripChars("alouloud", "ou", { maxScanStart: 3, maxMatchesStart: 2 }) !== "alloud") throw new Error("Expected only 1 match to be allowed with maxScanStart 3");

    // 10. stripChars with literal substring match
    if (stripChars("alouloud", "laou", { maxScanStart: -1, stringOptions: { literal: true } }) !== "alouloud") throw new Error("Expected literal laou to fail matching alouloud");
    if (stripChars("alou", "alou", { maxScanStart: -1, stringOptions: { literal: true } }) !== null) throw new Error("Expected literal alou to match alou");
    if (stripChars("abc12xyz34xyz56", "xyz", { maxScanEnd: -1, maxMatchesEnd: 2, stringOptions: { literal: true } }) !== "abc123456") throw new Error("Expected literal multi-match from end to succeed");

    // 11. stripChars with caseInsensitive option
    if (stripChars("aBcDeFg", "bdf", { maxScanStart: -1, maxScanEnd: -1, maxMatchesStart: -1, maxMatchesEnd: -1, stringOptions: { caseInsensitive: true } }) !== "aceg") throw new Error("Expected case-insensitive string character match to succeed");
    if (stripChars("aBcDeFg", /[bdf]/, { maxScanStart: -1, maxScanEnd: -1, maxMatchesStart: -1, maxMatchesEnd: -1 }) !== "aBcDeFg") throw new Error("Expected case-sensitive regex to remain case-sensitive");
    if (stripChars("aBcDeFg", /[bdf]/i, { maxScanStart: -1, maxScanEnd: -1, maxMatchesStart: -1, maxMatchesEnd: -1 }) !== "aceg") throw new Error("Expected case-insensitive regex with i flag match to succeed");
    if (stripChars("alOuLoUd", "ALOU", { maxScanStart: -1, stringOptions: { literal: true, caseInsensitive: true } }) !== "LoUd") throw new Error("Expected case-insensitive literal match to strip start");
    if (stripChars("AlOuAlOuD", "alou", { maxScanStart: -1, maxMatchesStart: 2, stringOptions: { literal: true, caseInsensitive: true } }) !== "D") throw new Error("Expected case-insensitive literal multi-match to succeed");

    // 11b. Complex edge cases for stripChars
    // Empty strings & 0 limits
    if (stripChars("", "abc") !== null) throw new Error("Expected stripChars('', 'abc') to be null");
    if (stripChars("", "abc", { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('', 'abc', { returnStringOnNull: true }) to be ''");
    if (stripChars("", "") !== null) throw new Error("Expected stripChars('', '') to be null");
    if (stripChars("", "", { returnStringOnNull: true }) !== "") throw new Error("Expected stripChars('', '', { returnStringOnNull: true }) to be ''");
    if (stripChars("hello", "") !== "hello") throw new Error("Expected empty characters string to strip nothing");
    if (stripChars("hello", "", { stringOptions: { literal: true } }) !== "hello") throw new Error("Expected empty literal characters string to strip nothing");
    if (stripChars("hello", "l", { maxMatchesStart: 0, maxMatchesEnd: 0 }) !== "hello") throw new Error("Expected maxMatches: 0 to strip nothing");
    if (stripChars("hello", "h", { mode: "end" }) !== "hello") throw new Error("Expected mode: 'end' not to strip start");
    if (stripChars("hello", "o", { mode: "start" }) !== "hello") throw new Error("Expected mode: 'start' not to strip end");

    // Overlapping literal substrings and boundary limits
    if (stripChars("banana", "na", { mode: "end", stringOptions: { literal: true }, maxMatchesEnd: 1 }) !== "bana") throw new Error("Expected single literal strip from end of banana");
    if (stripChars("banana", "na", { mode: "end", stringOptions: { literal: true }, maxMatchesEnd: 2 }) !== "ba") throw new Error("Expected dual literal strip from end of banana");
    if (stripChars("banana", "an", { mode: "end", stringOptions: { literal: true }, maxScanEnd: 2, maxMatchesEnd: 1 }) !== "bana") throw new Error("Expected single literal strip with maxScanEnd 2");
    if (stripChars("aaaaa", "aa", { mode: "start", stringOptions: { literal: true }, maxMatchesStart: 2 }) !== "a") throw new Error("Expected non-overlapping literal block consumption from start");
    if (stripChars("abababa", "aba", { mode: "both", stringOptions: { literal: true } }) !== "b") throw new Error("Expected non-overlapping literal strip from both sides");
    if (stripChars("XabcXYZabcX", "abc", { stringOptions: { literal: true }, maxScanStart: 1, maxScanEnd: 1 }) !== "XabcXYZabcX") throw new Error("Expected maxScan 1 to skip match when 1 char before pattern");
    if (stripChars("XabcXYZabcX", "abc", { stringOptions: { literal: true }, maxScanStart: 2, maxScanEnd: 2 }) !== "XXYZX") throw new Error("Expected maxScan 2 to strip abc while retaining non-matching X characters");

    // Unicode, Multi-byte & Surrogate Pair edge cases
    if (stripChars("🚀🚀Hello World🚀", "🚀") !== "Hello World") throw new Error("Expected multi-byte emoji stripping to succeed");
    if (stripChars("🎉✨Hello✨🎉", "🎉✨") !== "Hello") throw new Error("Expected multi-emoji character set stripping to succeed");
    if (stripChars("🎉✨Hello✨🎉", "✨🎉", { mode: "end" }) !== "🎉✨Hello") throw new Error("Expected multi-emoji stripping from end only");
    if (stripChars("🎉✨Hello✨🎉", "🎉✨", { stringOptions: { literal: true }, mode: "start" }) !== "Hello✨🎉") throw new Error("Expected literal multi-emoji sequence to strip start");
    if (stripChars("   \t\n  \r\n   ", null) !== null) throw new Error("Expected pure mixed whitespace to return null");
    if (stripChars("   \t\n  \r\n   ", null, { returnStringOnNull: true }) !== "") throw new Error("Expected pure mixed whitespace with returnStringOnNull: true to return ''");

    // trimFirst interaction with mode and character sets
    if (stripChars("  \t abcXYZcba \t  ", "abc", { trimFirst: true, mode: "both" }) !== "XYZ") throw new Error("Expected trimFirst with mode both to cleanly strip surrounded characters");
    if (stripChars("  \t abcXYZcba \t  ", "abc", { trimFirst: true, mode: "start" }) !== "XYZcba \t  ") throw new Error("Expected trimFirst with mode start to preserve trailing whitespace and end characters");
    if (stripChars("  \t abcXYZcba \t  ", "abc", { trimFirst: true, mode: "end" }) !== "  \t abcXYZ") throw new Error("Expected trimFirst with mode end to preserve leading whitespace and start characters");
    if (stripChars("   \t\n   ", "abc", { trimFirst: true }) !== null) throw new Error("Expected trimFirst on pure whitespace to return null");
    if (stripChars("   \t\n   ", "abc", { trimFirst: true, returnStringOnNull: true }) !== "") throw new Error("Expected trimFirst on pure whitespace with returnStringOnNull: true to return ''");

    // Stateful regex safety (regex with 'g' flag and non-zero lastIndex)
    const statefulRegex = /[0-9]/g;
    statefulRegex.lastIndex = 3;
    if (stripChars("123abc456", statefulRegex) !== "abc") throw new Error("Expected stateful regex with lastIndex to reset cleanly and strip correctly");
    const stickyRegex = /[0-9]/y;
    stickyRegex.lastIndex = 2;
    if (stripChars("123abc456", stickyRegex) !== "abc") throw new Error("Expected sticky regex to test from index 0");

    // String characters with special regex characters as literal characters
    if (stripChars("$$$hello$$$", "$") !== "hello") throw new Error("Expected $ character to be stripped cleanly without regex parsing issues");
    if (stripChars("***[hello]***", "*[]") !== "hello") throw new Error("Expected * and brackets to strip correctly");
    if (stripChars("+++[hello]+++", "[hello]", { stringOptions: { literal: true }, maxScanStart: -1, maxScanEnd: -1 }) !== "++++++") throw new Error("Expected literal bracketed string to strip out completely");
    if (stripChars("(((test)))", "(", { mode: "start" }) !== "test)))") throw new Error("Expected parenthesis set in mode start to strip cleanly");
    if (stripChars("(((test)))", ")", { mode: "end" }) !== "(((test") throw new Error("Expected parenthesis set in mode end to strip cleanly");

    // Complete stripping resulting in empty vs null
    if (stripChars("xxxxx", "x") !== null) throw new Error("Expected complete character stripping to return null by default");
    if (stripChars("xxxxx", "x", { returnStringOnNull: true }) !== "") throw new Error("Expected complete character stripping to return '' when returnStringOnNull: true");
    if (stripChars("abcabc", "abc", { stringOptions: { literal: true }, maxScanStart: -1, maxScanEnd: -1 }) !== null) throw new Error("Expected complete literal stripping to return null");
    if (stripChars("abcabc", "abc", { stringOptions: { literal: true }, maxScanStart: -1, maxScanEnd: -1, returnStringOnNull: true }) !== "") throw new Error("Expected complete literal stripping to return '' with returnStringOnNull");

    // 11c. Comprehensive Edge Case Tests for stripChars
    // Bounded matching with maxMatches & maxScan limits
    if (stripChars("Xabc", "a", { maxScanStart: 1 }) !== "Xabc") throw new Error("Expected maxScanStart 1 to stop when first char does not match");
    if (stripChars("abcX", "c", { maxScanEnd: 1 }) !== "abcX") throw new Error("Expected maxScanEnd 1 to stop when last char does not match");
    if (stripChars("Xabc", "a", { maxScanStart: 2 }) !== "Xbc") throw new Error("Expected maxScanStart 2 to skip 1 char and strip 'a'");
    if (stripChars("abcX", "c", { maxScanEnd: 2 }) !== "abX") throw new Error("Expected maxScanEnd 2 to skip 1 char and strip 'c'");
    if (stripChars("axaya", "a", { mode: "start", maxScanStart: -1, maxMatchesStart: 2 }) !== "xya") throw new Error("Expected 2 matches from start to strip first two 'a' chars in mode start");
    if (stripChars("axaya", "a", { mode: "end", maxScanEnd: -1, maxMatchesEnd: 1 }) !== "axay") throw new Error("Expected 1 match from end to strip last 'a' char only in mode end");

    // Complete character depletion and returnStringOnNull
    if (stripChars("---", "-") !== null) throw new Error("Expected complete character strip to return null by default");
    if (stripChars("---", "-", { returnStringOnNull: true }) !== "") throw new Error("Expected complete character strip to return '' with returnStringOnNull: true");
    if (stripChars("###", /[#]/) !== null) throw new Error("Expected complete regex strip to return null by default");
    if (stripChars("###", /[#]/, { returnStringOnNull: true }) !== "") throw new Error("Expected complete regex strip to return '' with returnStringOnNull: true");

    // Case-folding & accented Unicode characters
    if (stripChars("HELLOworldhello", "hello", { stringOptions: { literal: true, caseInsensitive: true }, maxScanStart: -1, maxScanEnd: -1, mode: "both" }) !== "world") throw new Error("Expected case-insensitive literal stripping from both sides");
    if (stripChars("ÁÉÍÓÚtestáéíóú", "ÁÉÍÓÚ", { stringOptions: { literal: true, caseInsensitive: true }, maxScanStart: -1, maxScanEnd: -1, mode: "both" }) !== "test") throw new Error("Expected accented case-insensitive literal strip");
    if (stripChars("ΣhelloΣ", "σ", { stringOptions: { caseInsensitive: true } }) !== "hello") throw new Error("Expected Greek sigma case insensitive match");

    // 11d. Additional Edge Cases: ZWJ emoji sequences, zero-width regex, negative limits, special metacharacters
    if (stripChars("👨‍👩‍👧‍👦hello👨‍👩‍👧‍👦", "👨‍👩‍👧‍👦", { stringOptions: { literal: true } }) !== "hello") throw new Error("Expected complex ZWJ emoji sequence literal strip to succeed");
    if (stripChars("hello", /(?:)/) !== "hello") throw new Error("Expected zero-width empty regex to strip nothing and not loop");
    if (stripChars("[-^hello$-]", "-[]^$") !== "hello") throw new Error("Expected character set containing special regex characters to strip cleanly");
    if (stripChars("aaloud", "lou", { maxScanStart: -5 }) !== "aad") throw new Error("Expected arbitrary negative maxScan to act as unlimited scan");
    if (stripChars("axaya", "a", { mode: "start", maxScanStart: -1, maxMatchesStart: -10 }) !== "xy") throw new Error("Expected arbitrary negative maxMatches to act as unlimited matches");
    if (stripChars("   ", "abc", { trimFirst: true }) !== null) throw new Error("Expected trimFirst on whitespace-only string to return null");
    if (stripChars("   ", "abc", { trimFirst: true, returnStringOnNull: true }) !== "") throw new Error("Expected trimFirst on whitespace-only string with returnStringOnNull to return ''");

    // 11e. 10/10 Difficulty Edge Cases
    // 1. Unicode Property Escapes in RegExp
    if (stripChars("你好World世界", /\p{Script=Han}/u) !== "World") throw new Error("Expected Unicode property escape \\p{Script=Han} to strip Chinese characters");
    if (stripChars("αβγHelloωψχ", /\p{Script=Greek}/u) !== "Hello") throw new Error("Expected Unicode property escape \\p{Script=Greek} to strip Greek characters");

    // 2. Dual-Direction Overlapping Boundary Strip with Symmetrical Patterns
    if (stripChars("abracadabra", "abra", { stringOptions: { literal: true }, mode: "both" }) !== "cad") throw new Error("Expected overlapping dual-direction literal stripping of abracadabra to leave cad");
    if (stripChars("abaXaba", "aba", { stringOptions: { literal: true }, maxMatchesStart: 1, maxMatchesEnd: 1 }) !== "X") throw new Error("Expected dual-direction exact match limit to leave X");

    // 3. Combining Diacritical Marks (NFD decomposed forms)
    const nfd = "e\u0301";
    if (stripChars(`${nfd}hello${nfd}`, nfd, { stringOptions: { literal: true } }) !== "hello") throw new Error("Expected NFD combining mark literal stripping to succeed");

    // 4. Zero maxMatches / Zero maxScan vs Unlimited settings
    if (stripChars("hello", "h", { maxMatchesStart: 0, maxScanStart: -1 }) !== "hello") throw new Error("Expected maxMatches: 0 to override unlimited maxScan");
    if (stripChars("Xhello", "h", { maxScanStart: 0 }) !== "Xhello") throw new Error("Expected maxScan: 0 to prevent match when not at index 0");

    // 5. Unprintable Control Characters & Null Bytes in Character Set
    const controlChars = "\x00\x01\x1f\x7f";
    if (stripChars(`\x00\x01hello\x1f\x7f`, controlChars) !== "hello") throw new Error("Expected unprintable control codes and null bytes to strip cleanly");

    // 6. Lone Surrogates in character set
    if (stripChars("\uD800hello\uD800", "\uD800") !== "hello") throw new Error("Expected lone surrogate to strip cleanly without RegExp escape throwing");

    // 7. Full-span pattern matches with mode: 'start' and mode: 'end'
    if (stripChars("aaaa", "aa", { mode: "start", stringOptions: { literal: true }, maxMatchesStart: 1 }) !== "aa") throw new Error("Expected start mode to strip single block on full pattern");
    if (stripChars("aaaa", "aa", { mode: "end", stringOptions: { literal: true }, maxMatchesEnd: 1 }) !== "aa") throw new Error("Expected end mode to strip single block on full pattern");

    // 8. Literal regex syntax characters (ranges like 'a-z' and '\\w')
    if (stripChars("a-zHelloa-z", "a-z", { stringOptions: { literal: true } }) !== "Hello") throw new Error("Expected literal range string 'a-z' to strip literally");

    // 10. Non-string / Non-RegExp or unexpected characters argument
    if (stripChars("hello", 123 as any) !== "hello") throw new Error("Expected invalid characters type to return original string");
    if (stripChars("hello", {} as any) !== "hello") throw new Error("Expected invalid characters object to return original string");
    if (stripChars("hello", true as any) !== "hello") throw new Error("Expected boolean characters type to return original string");

    // 11. Single character inputs
    if (stripChars("a", "a") !== null) throw new Error("Expected single char matching to return null");
    if (stripChars("a", "a", { returnStringOnNull: true }) !== "") throw new Error("Expected single char matching with returnStringOnNull to return ''");
    if (stripChars("a", "b") !== "a") throw new Error("Expected single char non-matching to return 'a'");
    if (stripChars("a", /[a]/) !== null) throw new Error("Expected single char regex match to return null");

    // 12. Multiline newline stripping
    if (stripChars("\r\nhello\r\n", "\r\n", { stringOptions: { literal: true } }) !== "hello") throw new Error("Expected single multiline CRLF literal strip to succeed");
    if (stripChars("\r\n\r\nhello\r\n", "\r\n", { stringOptions: { literal: true }, maxMatchesStart: -1 }) !== "hello") throw new Error("Expected multiline CRLF literal strip to succeed with maxMatchesStart: -1");
    if (stripChars("\n\n\nhello\n\n", "\n") !== "hello") throw new Error("Expected LF character strip to succeed");
    if (stripChars("\r\nhello\r\n", "\r\n", { stringOptions: { literal: true }, mode: "start" }) !== "hello\r\n") throw new Error("Expected start-only CRLF literal strip to preserve trailing CRLF");

    // 13. Non-matching pattern preserves identity
    if (stripChars("hello world", "xyz") !== "hello world") throw new Error("Expected non-matching string characters to return original string");
    if (stripChars("hello world", /[0-9]/) !== "hello world") throw new Error("Expected non-matching regex to return original string");


    console.log(`SUCCESS: All stripChars tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: stripChars test failed!`, err);
    process.exit(1);
}
