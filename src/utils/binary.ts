/** @internalfile */
import {
    isObj,
    isDetachedBuffer,
    isArrayBuffer,
    isSharedArrayBuffer,
    isDataView,
    isUint8Array,
    isUint8ClampedArray,
} from "./object";
import { isValidInt, type IntOptions } from "./number";
import type { AnyTypedArray } from "../types";
import { TEXT_ENCODER } from "../constants";

export interface BinaryValidationOptions {
    strict?: boolean;
}

export function isBinaryObj(
    v: unknown
): v is Uint8Array | Uint8ClampedArray | ArrayBuffer | SharedArrayBuffer | DataView {
    if (!isObj(v) || isDetachedBuffer(v)) return false;
    if (ArrayBuffer.isView(v)) {
        return isUint8Array(v) || isUint8ClampedArray(v) || isDataView(v);
    }
    return isArrayBuffer(v) || isSharedArrayBuffer(v);
}

const UINT8_INT_OPTS: IntOptions = { range: "UInt8" };

export function isValidBinary(
    v: unknown,
    options?: BinaryValidationOptions
): v is Uint8Array | Uint8ClampedArray | ArrayBuffer | SharedArrayBuffer | DataView | string | number[] | AnyTypedArray {
    if (v == null) return false;
    try {
        if (isBinaryObj(v)) return true;
        if (options?.strict) return false;
        if (typeof v === "string") return true;
        if (ArrayBuffer.isView(v)) return !isDetachedBuffer(v);
        if (Array.isArray(v)) {
            const len = v.length;
            for (let i = 0; i < len; i++) {
                if (!isValidInt(v[i], UINT8_INT_OPTS)) {
                    return false;
                }
            }
            return true;
        }
    } catch {
        return false;
    }
    return false;
}

export function toValidBinary(v: unknown, options?: BinaryValidationOptions): Uint8Array | null {
    try {
        if (!isValidBinary(v, options)) return null;
        if (isUint8Array(v)) {
            return v;
        }
        if (ArrayBuffer.isView(v)) {
            return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
        }
        if (isArrayBuffer(v) || isSharedArrayBuffer(v)) {
            return new Uint8Array(v);
        }
        if (typeof v === "string") {
            return TEXT_ENCODER.encode(v);
        }
        if (Array.isArray(v)) {
            return Uint8Array.from(v);
        }
    } catch {
        return null;
    }
    return null;
}

