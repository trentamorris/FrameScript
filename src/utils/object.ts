/** @internalfile */
export const TAG_DATE = "[object Date]";
export const TAG_REGEXP = "[object RegExp]";
export const TAG_SET = "[object Set]";
export const TAG_MAP = "[object Map]";
export const TAG_ERROR = "[object Error]";
export const TAG_URL_PARAMS = "[object URLSearchParams]";
export const TAG_STRING = "[object String]";
export const TAG_NUMBER = "[object Number]";
export const TAG_BOOLEAN = "[object Boolean]";
export const TAG_BIGINT = "[object BigInt]";
export const TAG_SYMBOL = "[object Symbol]";
export const TAG_UINT8ARRAY = "[object Uint8Array]";
export const TAG_UINT8CLAMPEDARRAY = "[object Uint8ClampedArray]";
export const TAG_ARRAYBUFFER = "[object ArrayBuffer]";
export const TAG_SHAREDARRAYBUFFER = "[object SharedArrayBuffer]";
export const TAG_DATAVIEW = "[object DataView]";
export const TAG_OBJECT = "[object Object]";

const dateProto = typeof Date === "function" ? Date.prototype : undefined;
const regExpProto = typeof RegExp === "function" ? RegExp.prototype : undefined;
const setProto = typeof Set === "function" ? Set.prototype : undefined;
const mapProto = typeof Map === "function" ? Map.prototype : undefined;
const urlParamsProto = typeof URLSearchParams === "function" ? URLSearchParams.prototype : undefined;

const stringProto = typeof String === "function" ? String.prototype : undefined;
const numberProto = typeof Number === "function" ? Number.prototype : undefined;
const booleanProto = typeof Boolean === "function" ? Boolean.prototype : undefined;
const bigIntProto = typeof BigInt === "function" ? BigInt.prototype : undefined;
const symbolProto = typeof Symbol === "function" ? Symbol.prototype : undefined;

const regExpSource = regExpProto ? Object.getOwnPropertyDescriptor(regExpProto, "source")?.get : undefined;
const setSize = setProto ? Object.getOwnPropertyDescriptor(setProto, "size")?.get : undefined;
const mapSize = mapProto ? Object.getOwnPropertyDescriptor(mapProto, "size")?.get : undefined;

const arrayBufferProto = typeof ArrayBuffer === "function" ? ArrayBuffer.prototype : undefined;
const sharedArrayBufferProto = typeof SharedArrayBuffer === "function" ? SharedArrayBuffer.prototype : undefined;
const dataViewProto = typeof DataView === "function" ? DataView.prototype : undefined;

export const typedArrayTagGetter = typeof Uint8Array === "function"
    ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag)?.get
    : undefined;
const arrayBufferByteLength = arrayBufferProto
    ? Object.getOwnPropertyDescriptor(arrayBufferProto, "byteLength")?.get
    : undefined;
const arrayBufferSlice = arrayBufferProto?.slice;
const sharedArrayBufferByteLength = sharedArrayBufferProto
    ? Object.getOwnPropertyDescriptor(sharedArrayBufferProto, "byteLength")?.get
    : undefined;

const dataViewByteLength = dataViewProto
    ? Object.getOwnPropertyDescriptor(dataViewProto, "byteLength")?.get
    : undefined;

const dateValueOf = dateProto?.valueOf;
const urlSearchParamsHas = urlParamsProto?.has;
const stringValueOf = stringProto?.valueOf;
const numberValueOf = numberProto?.valueOf;
const booleanValueOf = booleanProto?.valueOf;
const bigIntValueOf = bigIntProto?.valueOf;
const symbolValueOf = symbolProto?.valueOf;
const objectCtorString = Function.prototype.toString.call(Object);

export function isObj(v: unknown): v is Record<PropertyKey, unknown> {
    return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function isPlainObj(v: unknown): v is Record<PropertyKey, unknown> {
    if (!isObj(v)) return false;

    try {
        // Exclude [object Arguments] and exotic objects whose prototype chain specifies a tag
        if (
            !Object.prototype.hasOwnProperty.call(v, Symbol.toStringTag) &&
            Object.prototype.toString.call(v) !== TAG_OBJECT
        ) {
            return false;
        }

        const proto = Object.getPrototypeOf(v);
        if (proto === null) return true;
        if (Object.getPrototypeOf(proto) !== null) return false;

        // Cross-realm safe: verify proto is a true Object.prototype
        if (!Object.prototype.hasOwnProperty.call(proto, "isPrototypeOf")) return false;

        const desc = Object.getOwnPropertyDescriptor(proto, "toString");
        if (!desc || typeof desc.value !== "function") return false;

        const ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
        if (typeof ctor !== "function") return false;

        return Function.prototype.toString.call(ctor) === objectCtorString;
    } catch {
        return false;
    }
}

const _dummyProxyTarget = function () { };
const _dummyProxy = new Proxy(_dummyProxyTarget, { construct() { return this; } });
const _dummyArrayBuffer = typeof ArrayBuffer === "function" ? new ArrayBuffer(0) : undefined;
const _dummyConstructProbes: readonly any[][] = [
    [],
    [_dummyProxyTarget],
    [_dummyArrayBuffer],
    [{}]
];

export function isClass(v: unknown): v is new (...args: any[]) => any {
    if (typeof v !== "function") return false;

    try {
        const fnStr = Function.prototype.toString.call(v);

        // 1. ES6 class syntax (strips leading comments/whitespace, handles dotted & parameterized decorators)
        const s = fnStr.replace(/^(?:\s+|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)+/, "");
        if (/^(?:@[\w$.]+(?:\([^)]*\))?\s+)*class\b/.test(s)) return true;

        // 2. Native constructible classes (Map, Set, Date, Promise, TypedArrays, DataView, WeakRef, etc.)
        // Non-constructible native builtins (Symbol, BigInt) throw on Reflect.construct and safely return false
        const desc = Object.getOwnPropertyDescriptor(v, "prototype");
        if (desc && !desc.writable && fnStr.includes("[native code]")) {
            const len = _dummyConstructProbes.length;
            for (let i = 0; i < len; i++) {
                try {
                    Reflect.construct(v as Function, _dummyConstructProbes[i], _dummyProxy);
                    return true;
                } catch { }
            }
        }
    } catch {
        return false;
    }

    return false;
}

function _checkNativeSlot(
    v: unknown,
    tag: string,
    getterOrMethod: Function | undefined,
    expectedReturn?: any
): boolean {
    if (!isObj(v)) return false;

    if (getterOrMethod) {
        try {
            const res = getterOrMethod.call(v);
            return expectedReturn !== undefined ? res === expectedReturn : true;
        } catch {
            return false;
        }
    }

    try {
        if (Object.prototype.hasOwnProperty.call(v, Symbol.toStringTag)) return false;
        return Object.prototype.toString.call(v) === tag;
    } catch {
        return false;
    }
}

export function isValidDateObj(v: unknown): v is Date {
    if (!isObj(v)) return false;
    if (dateValueOf) {
        try { return !Number.isNaN(dateValueOf.call(v)); } catch { return false; }
    }
    try {
        if (Object.prototype.hasOwnProperty.call(v, Symbol.toStringTag)) return false;
        return Object.prototype.toString.call(v) === TAG_DATE && !Number.isNaN((v as any).getTime());
    } catch {
        return false;
    }
}

export function isRegExp(v: unknown): v is RegExp {
    return _checkNativeSlot(v, TAG_REGEXP, regExpSource);
}

export function isSet(v: unknown): v is Set<unknown> {
    return _checkNativeSlot(v, TAG_SET, setSize);
}

export function isMap(v: unknown): v is Map<unknown, unknown> {
    return _checkNativeSlot(v, TAG_MAP, mapSize);
}

export function isURLSearchParams(v: unknown): v is URLSearchParams {
    if (!isObj(v)) return false;
    if (urlSearchParamsHas) {
        try {
            urlSearchParamsHas.call(v, "key");
            return true;
        } catch {
            return false;
        }
    }
    return _checkNativeSlot(v, TAG_URL_PARAMS, undefined);
}

export function isError(v: unknown): v is Error {
    if (!isObj(v)) return false;

    try {
        if (v instanceof Error) return true;

        let p: any = v;
        while (p !== null) {
            if (!Object.prototype.hasOwnProperty.call(p, Symbol.toStringTag)) {
                if (Object.prototype.toString.call(p) === TAG_ERROR) return true;
            }
            p = Object.getPrototypeOf(p);
        }
    } catch {
        return false;
    }

    return false;
}

export function isStringObj(v: unknown): v is String {
    return _checkNativeSlot(v, TAG_STRING, stringValueOf);
}

export function isNumberObj(v: unknown): v is Number {
    return _checkNativeSlot(v, TAG_NUMBER, numberValueOf);
}

export function isBooleanObj(v: unknown): v is Boolean {
    return _checkNativeSlot(v, TAG_BOOLEAN, booleanValueOf);
}

export function isBigIntObj(v: unknown): v is Object {
    return _checkNativeSlot(v, TAG_BIGINT, bigIntValueOf);
}

export function isSymbolObj(v: unknown): v is Object {
    return _checkNativeSlot(v, TAG_SYMBOL, symbolValueOf);
}

export function isDetachedBuffer(v: unknown): boolean {
    if (!isObj(v)) return false;

    try {
        const buf = ArrayBuffer.isView(v) ? v.buffer : v;

        if (isSharedArrayBuffer(buf)) return false;
        if (!isArrayBuffer(buf)) return false;

        if ("detached" in buf && (buf as any).detached !== undefined) {
            return (buf as any).detached === true;
        }

        arrayBufferSlice?.call(buf, 0, 0);
        return false;
    } catch {
        return true;
    }
}

export function isArrayBuffer(v: unknown): v is ArrayBuffer {
    return _checkNativeSlot(v, TAG_ARRAYBUFFER, arrayBufferByteLength);
}

export function isSharedArrayBuffer(v: unknown): v is SharedArrayBuffer {
    return _checkNativeSlot(v, TAG_SHAREDARRAYBUFFER, sharedArrayBufferByteLength);
}

export function isDataView(v: unknown): v is DataView {
    return _checkNativeSlot(v, TAG_DATAVIEW, dataViewByteLength);
}

export function isUint8Array(v: unknown): v is Uint8Array {
    return _checkNativeSlot(v, TAG_UINT8ARRAY, typedArrayTagGetter, "Uint8Array");
}

export function isUint8ClampedArray(v: unknown): v is Uint8ClampedArray {
    return _checkNativeSlot(v, TAG_UINT8CLAMPEDARRAY, typedArrayTagGetter, "Uint8ClampedArray");
}

const PRIMITIVE_VALUE_OFS = [numberValueOf, stringValueOf, booleanValueOf, bigIntValueOf, symbolValueOf];

export function unboxPrimitiveObj(v: unknown): unknown {
    if (!isObj(v)) return v;

    const len = PRIMITIVE_VALUE_OFS.length;
    for (let i = 0; i < len; i++) {
        const fn = PRIMITIVE_VALUE_OFS[i];
        if (fn) {
            try { return fn.call(v); } catch { }
        }
    }

    return v;
}