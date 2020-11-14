// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";
import { objCreateFn, strShimUndefined } from "@microsoft/applicationinsights-shims";
import { getWindow, getDocument, getCrypto, getPerformance, getMsCrypto, getNavigator, isIE }  from "./EnvUtils";
import { _ckIsEnabled, _ckEnable, _ckDisable }  from "./CookieMgr";
import { 
    arrForEach, arrIndexOf, arrMap, arrReduce, attachEvent, dateNow, detachEvent, hasOwnProperty, 
    isArray, isBoolean, isDate, isError, isFunction, isNullOrUndefined, isNumber, isObject, isString, isTypeof, 
    isUndefined, objDefineAccessors, objKeys, strEndsWith, strTrim, toISOString
} from "./HelperFuncs";

// Added to help with minfication
export const Undefined = strShimUndefined;
const UInt32Mask = 0x100000000;
const MaxUInt32 = 0xffffffff;

// MWC based Random generator (for IE)
let _mwcSeeded = false;
let _mwcW = 123456789;
var _mwcZ = 987654321;

// Takes any integer
function _mwcSeed(seedValue: number) {
    if (seedValue < 0) {
        // Make sure we end up with a positive number and not -ve one.
        seedValue >>>= 0;    
    }

    _mwcW = (123456789 + seedValue) & MaxUInt32;
    _mwcZ = (987654321 - seedValue) & MaxUInt32;
    _mwcSeeded = true;
}

function _autoSeedMwc() {
    // Simple initialization using default Math.random() - So we inherit any entropy from the browser
    // and bitwise XOR with the current milliseconds
    _mwcSeed((Math.random() * UInt32Mask) ^ new Date().getTime());
}

/**
 * Trys to add an event handler for the specified event to the window, body and document
 * @param eventName {string} - The name of the event
 * @param callback {any} - The callback function that needs to be executed for the given event
 * @return {boolean} - true if the handler was successfully added
 */
export function addEventHandler(eventName: string, callback: any): boolean {
    let result = false;
    let w = getWindow();
    if (w) {
        result = attachEvent(w, eventName, callback);
        result = attachEvent(w["body"], eventName, callback) || result;
    }

    let doc = getDocument();
    if (doc) {
        result = EventHelper.Attach(doc, eventName, callback) || result;
    }

    return result;
}

export class CoreUtils {
    public static _canUseCookies: boolean;

    public static isTypeof: (value: any, theType: string) => boolean = isTypeof;

    public static isUndefined: (value: any) => boolean = isUndefined;

    public static isNullOrUndefined: (value: any) => boolean = isNullOrUndefined;

    public static hasOwnProperty: (obj: any, prop: string) => boolean = hasOwnProperty;

    /**
     * Checks if the passed of value is a function.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    public static isFunction: (value: any) => value is Function = isFunction;

    /**
     * Checks if the passed of value is a function.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    public static isObject: (value: any) => boolean = isObject;

    /**
     * Check if an object is of type Date
     */
    public static isDate: (obj: any) => obj is Date = isDate;

    /**
     * Check if an object is of type Array
     */
    public static isArray: (obj: any) => boolean = isArray;

    /**
     * Check if an object is of type Error
     */
    public static isError: (obj: any) => boolean = isError;

    /**
     * Checks if the type of value is a string.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a string, false otherwise.
     */
    public static isString: (value: any) => value is string = isString;

    /**
     * Checks if the type of value is a number.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a number, false otherwise.
     */
    public static isNumber: (value: any) => value is number = isNumber;

    /**
     * Checks if the type of value is a boolean.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    public static isBoolean: (value: any) => value is boolean = isBoolean;

    /**
     * Convert a date to I.S.O. format in IE8
     */
    public static toISOString: (date: Date) => string = toISOString;

    /**
     * Performs the specified action for each element in an array. This helper exists to avoid adding a polyfil for older browsers
     * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
     * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
     * cause a testing requirement to test with and without the implementations
     * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array. It can return -1 to break out of the loop
     * @param thisArg  [Optional] An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    public static arrForEach: <T>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => void|number, thisArg?: any) => void  = arrForEach;

    /**
     * Returns the index of the first occurrence of a value in an array. This helper exists to avoid adding a polyfil for older browsers
     * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
     * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
     * cause a testing requirement to test with and without the implementations
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    public static arrIndexOf: <T>(arr: T[], searchElement: T, fromIndex?: number) => number = arrIndexOf;

    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results. This helper exists 
     * to avoid adding a polyfil for older browsers that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page 
     * checks for presence/absence of the prototype implementation. Note: For consistency this will not use the Array.prototype.xxxx 
     * implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    public static arrMap: <T, R>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => R, thisArg?: any) => R[] = arrMap;

    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is
     * provided as an argument in the next call to the callback function. This helper exists to avoid adding a polyfil for older browsers that do not define
     * Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation. Note: For consistency 
     * this will not use the Array.prototype.xxxx implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    public static arrReduce: <T, R>(arr: T[], callbackfn: (previousValue: T | R, currentValue?: T, currentIndex?: number, array?: T[]) => R, initialValue?: R) => R = arrReduce;

    /**
     * helper method to trim strings (IE8 does not implement String.prototype.trim)
     */
    public static strTrim: (str: any) => string = strTrim;

    /**
     * Creates an object that has the specified prototype, and that optionally contains specified properties. This helper exists to avoid adding a polyfil
     * for older browsers that do not define Object.create eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
     * Note: For consistency this will not use the Object.create implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param obj Object to use as a prototype. May be null
     */
    // tslint:disable-next-line: member-ordering
    public static objCreate:(obj: object) => any = objCreateFn;

    /**
     * Returns the names of the enumerable string properties and methods of an object. This helper exists to avoid adding a polyfil for older browsers 
     * that do not define Object.keys eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
     * Note: For consistency this will not use the Object.keys implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param obj Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
    public static objKeys: (obj: {}) => string[] = objKeys;

    /**
     * Try to define get/set object property accessors for the target object/prototype, this will provide compatibility with
     * existing API definition when run within an ES5+ container that supports accessors but still enable the code to be loaded
     * and executed in an ES3 container, providing basic IE8 compatibility.
     * @param target The object on which to define the property.
     * @param prop The name of the property to be defined or modified.
     * @param getProp The getter function to wire against the getter.
     * @param setProp The setter function to wire against the setter.
     * @returns True if it was able to create the accessors otherwise false
     */
    public static objDefineAccessors: <T>(target: any, prop: string, getProp?: () => T, setProp?: (v: T) => void) => boolean = objDefineAccessors;

    /**
     * Trys to add an event handler for the specified event to the window, body and document
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static addEventHandler: (eventName: string, callback: any) => boolean = addEventHandler;

    /**
     * Return the current time via the Date now() function (if available) and falls back to (new Date()).getTime() if now() is unavailable (IE8 or less)
     * https://caniuse.com/#search=Date.now
     */
    public static dateNow = dateNow;

    /**
     * Identifies whether the current environment appears to be IE
     */
    public static isIE = isIE;

    /**
     * @deprecated - Use the core.getCookieMgr().disable()
     * Force the SDK not to store and read any data from cookies.
     */
    public static disableCookies() {
        _ckDisable();
    }

    public static newGuid(): string {
        function randomHexDigit() {
            return CoreUtils.randomValue(15); // Get a random value from 0..15
        }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(GuidRegex, (c) => {
            const r = (randomHexDigit() | 0), v = (c === 'x' ? r : r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Return the current value of the Performance Api now() function (if available) and fallback to CoreUtils.dateNow() if it is unavailable (IE9 or less)
     * https://caniuse.com/#search=performance.now
     */
    public static perfNow() {
        let perf = getPerformance();
        if (perf && perf.now) {
            return perf.now();
        }

        return dateNow();
    }

    /**
     * Generate random base64 id string. 
     * The default length is 22 which is 132-bits so almost the same as a GUID but as base64 (the previous default was 5)
     * @param maxLength - Optional value to specify the length of the id to be generated, defaults to 22
     */
    public static newId(maxLength = 22): string {
        const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        // Start with an initial random number, consuming the value in reverse byte order
        let number = CoreUtils.random32() >>> 0;  // Make sure it's a +ve number
        let chars = 0;
        let result = "";
        while (result.length < maxLength) {
            chars ++;
            result += base64chars.charAt(number & 0x3F);
            number >>>= 6;              // Zero fill with right shift
            if (chars === 5) {
                // 5 base64 characters === 30 bits so we don't have enough bits for another base64 char
                // So add on another 30 bits and make sure it's +ve
                number = (((CoreUtils.random32() << 2) & 0xFFFFFFFF) | (number & 0x03)) >>> 0;
                chars = 0;      // We need to reset the number every 5 chars (30 bits)
            }
        }

        return result;
    }

    /**
     * Generate a random value between 0 and maxValue, max value should be limited to a 32-bit maximum.
     * So maxValue(16) will produce a number from 0..16 (range of 17)
     * @param maxValue
     */
    public static randomValue(maxValue: number) {
        if (maxValue > 0) {
            return Math.floor((CoreUtils.random32() / MaxUInt32) * (maxValue + 1)) >>> 0;
        }

        return 0;
    }

    /**
     * generate a random 32-bit number (0x000000..0xFFFFFFFF) or (-0x80000000..0x7FFFFFFF), defaults un-unsigned.
     * @param signed - True to return a signed 32-bit number (-0x80000000..0x7FFFFFFF) otherwise an unsigned one (0x000000..0xFFFFFFFF)
     */
    public static random32(signed?: boolean) {
        let value;
        let c = getCrypto() || getMsCrypto();
        if (c && c.getRandomValues) {
            // Make sure the number is converted into the specified range (-0x80000000..0x7FFFFFFF)
            value = c.getRandomValues(new Uint32Array(1))[0] & MaxUInt32;
        } else if (CoreUtils.isIE()) {
            // For IE 6, 7, 8 (especially on XP) Math.random is not very random
            if (!_mwcSeeded) {
                // Set the seed for the Mwc algorithm
                _autoSeedMwc();
            }

            // Don't use Math.random for IE
            // Make sure the number is converted into the specified range (-0x80000000..0x7FFFFFFF)
            value = CoreUtils.mwcRandom32() & MaxUInt32;
        } else {
            // Make sure the number is converted into the specified range (-0x80000000..0x7FFFFFFF)
            value = Math.floor((UInt32Mask * Math.random()) | 0);
        }

        if (!signed) {
            // Make sure we end up with a positive number and not -ve one.
            value >>>= 0;
        }

        return value;
    }

    /**
     * Seed the MWC random number generator with the specified seed or a random value
     * @param value - optional the number to used as the seed, if undefined, null or zero a random value will be chosen
     */
    public static mwcRandomSeed(value?: number)
    {
        if (!value) {
            _autoSeedMwc();
        } else {
            _mwcSeed(value);
        }
    }

    /**
     * Generate a random 32-bit number between (0x000000..0xFFFFFFFF) or (-0x80000000..0x7FFFFFFF), using MWC (Multiply with carry)
     * instead of Math.random() defaults to un-signed.
     * Used as a replacement random generator for IE to avoid issues with older IE instances.
     * @param signed - True to return a signed 32-bit number (-0x80000000..0x7FFFFFFF) otherwise an unsigned one (0x000000..0xFFFFFFFF)
     */
    public static mwcRandom32(signed?: boolean) {
        _mwcZ = (36969 * (_mwcZ & 0xFFFF) + (_mwcZ >> 16)) & MaxUInt32;
        _mwcW = (18000 * (_mwcW & 0xFFFF) + (_mwcW >> 16)) & MaxUInt32;

        let value = (((_mwcZ << 16) + (_mwcW & 0xFFFF)) >>> 0) & MaxUInt32 | 0;

        if (!signed) {
            // Make sure we end up with a positive number and not -ve one.
            value >>>= 0;
        }

        return value;
    }

    /**
     * generate W3C trace id
     */
    public static generateW3CId() {
        const hexValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

        // rfc4122 version 4 UUID without dashes and with lowercase letters
        let oct = "", tmp;
        for (let a = 0; a < 4; a++) {
            tmp = CoreUtils.random32();
            oct +=
                hexValues[tmp & 0xF] +
                hexValues[tmp >> 4 & 0xF] +
                hexValues[tmp >> 8 & 0xF] +
                hexValues[tmp >> 12 & 0xF] +
                hexValues[tmp >> 16 & 0xF] +
                hexValues[tmp >> 20 & 0xF] +
                hexValues[tmp >> 24 & 0xF] +
                hexValues[tmp >> 28 & 0xF];
        }

        // "Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively"
        const clockSequenceHi = hexValues[8 + (CoreUtils.random32() & 0x03) | 0];
        return oct.substr(0, 8) + oct.substr(9, 4) + "4" + oct.substr(13, 3) + clockSequenceHi + oct.substr(16, 3) + oct.substr(19, 12);
    }

    /**
     * Static constructor, attempt to create accessors
     */
    // tslint:disable-next-line
    private static _staticInit = (() => {
        // Dynamically create get/set property accessors for backward compatibility for enabling / disabling cookies
        // this WILL NOT work for ES3 browsers (< IE8)
        CoreUtils.objDefineAccessors<boolean>(CoreUtils, "_canUseCookies", 
            () => {
                return _ckIsEnabled();
            }, 
            (value) => {
                if (value) {
                    _ckEnable();
                } else {
                    _ckDisable();
                }
            });
    })();
}

const GuidRegex = /[xy]/g;

export class EventHelper {
    /**
     * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
     * @param obj Object to add the event too.
     * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
     * @param handlerRef Pointer that specifies the function to call when event fires
     * @returns True if the function was bound successfully to the event, otherwise false
     */
    public static Attach: (obj: any, eventNameWithoutOn: string, handlerRef: any) => boolean = attachEvent;

    /**
     * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
     * @deprecated Use {@link EventHelper#Attach} as we are already in a class call EventHelper the extra "Event" just causes a larger result
     * @param obj Object to add the event too.
     * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
     * @param handlerRef Pointer that specifies the function to call when event fires
     * @returns True if the function was bound successfully to the event, otherwise false
     */
    public static AttachEvent: (obj: any, eventNameWithoutOn: string, handlerRef: any) => boolean = attachEvent;

    /**
     * Removes an event handler for the specified event
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static Detach: (obj: any, eventNameWithoutOn: string, handlerRef: any) => void = detachEvent;

    /**
     * Removes an event handler for the specified event
     * @deprecated Use {@link EventHelper#Detach} as we are already in a class call EventHelper the extra "Event" just causes a larger result
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static DetachEvent: (obj: any, eventNameWithoutOn: string, handlerRef: any) => void = detachEvent;
}

