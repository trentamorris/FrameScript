declare const process: any;
import { changeCase } from "../../../src/utils/string";

console.log("=========================================");
console.log("STARTING CHANGECASE TESTS...");
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

    assertEqual(changeCase("hello world", { format: "camel" }), "helloWorld", "camel");
    assertEqual(changeCase("hello world", { format: "pascal" }), "HelloWorld", "pascal");
    assertEqual(changeCase("hello world", { format: "snake" }), "hello_world", "snake");
    assertEqual(changeCase("hello world", { format: "kebab" }), "hello-world", "kebab");
    assertEqual(changeCase("hello world", { format: "title" }), "Hello World", "title");


    console.log(`SUCCESS: All changeCase tests passed! (${testsPassed} assertions)`);
} catch (err) {
    console.error(`FAILURE: changeCase test failed!`, err);
    process.exit(1);
}
