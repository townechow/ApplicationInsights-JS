// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import {  strShimUndefined, strShimObject, strShimPrototype, strShimFunction } from "@microsoft/applicationinsights-shims";

// RESTRICT and AVOID circular dependencies you should not import other contained modules or export the contents of this file directly

// Added to help with minfication
const strOnPrefix = "on";
const strAttachEvent = "attachEvent";
const strAddEventHelper = "addEventListener";
const strDetachEvent = "detachEvent";
const strRemoveEventListener = "removeEventListener";

export function isTypeof(value: any, theType: string): boolean {
    return typeof value === theType;
};

export function isUndefined(value: any): boolean {
    return isTypeof(value, strShimUndefined) || value === undefined;
};

export function isNullOrUndefined(value: any): boolean {
    return (isUndefined(value) || value === null);
}

export function hasOwnProperty(obj: any, prop: string): boolean {
    return obj && Object[strShimPrototype].hasOwnProperty.call(obj, prop);
};

export function isObject(value: any): boolean {
    return isTypeof(value, strShimObject);
};

export function isFunction(value: any): value is Function {
    return isTypeof(value, strShimFunction);
};

/**
 * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
 * @param obj Object to add the event too.
 * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
 * @param handlerRef Pointer that specifies the function to call when event fires
 * @param useCapture [Optional] Defaults to false
 * @returns True if the function was bound successfully to the event, otherwise false
 */
export function attachEvent(obj: any, eventNameWithoutOn: string, handlerRef: any, useCapture: boolean = false) {
    let result = false;
    if (!isNullOrUndefined(obj)) {
        try {
            if (!isNullOrUndefined(obj[strAddEventHelper])) {
                // all browsers except IE before version 9
                obj[strAddEventHelper](eventNameWithoutOn, handlerRef, useCapture);
                result = true;
            } else if (!isNullOrUndefined(obj[strAttachEvent])) {
                // IE before version 9                    
                obj[strAttachEvent](strOnPrefix + eventNameWithoutOn, handlerRef);
                result = true;
            }
        } catch (e) {
            // Just Ignore any error so that we don't break any execution path
        }
    }

    return result;
}

/**
 * Removes an event handler for the specified event
 * @param Object to remove the event from
 * @param eventNameWithoutOn {string} - The name of the event
 * @param handlerRef {any} - The callback function that needs to be executed for the given event
 * @param useCapture [Optional] Defaults to false
 */
export function detachEvent(obj: any, eventNameWithoutOn: string, handlerRef: any, useCapture: boolean = false) {
    if (!isNullOrUndefined(obj)) {
        try {
            if (!isNullOrUndefined(obj[strRemoveEventListener])) {
                obj[strRemoveEventListener](eventNameWithoutOn, handlerRef, useCapture);
            } else if (!isNullOrUndefined(obj[strDetachEvent])) {
                obj[strDetachEvent](strOnPrefix + eventNameWithoutOn, handlerRef);
            }
        } catch (e) {
            // Just Ignore any error so that we don't break any execution path
        }
    }
}

/**
 * Validates that the string name conforms to the JS IdentifierName specification and if not
 * normalizes the name so that it would. This method does not identify or change any keywords
 * meaning that if you pass in a known keyword the same value will be returned.
 * This is a simplified version
 * @param name The name to validate
 */
export function normalizeJsName(name: string): string {
    let value = name;
    let match = /([^\w\d_$])/g;
    if (match.test(name)) {
        value = name.replace(match, "_");
    }

    return value;
}

/**
 * This is a helper function for the equivalent of arForEach(objKeys(target), callbackFn), this is a 
 * performance optimization to avoid the creation of a new array for large objects
 * @param target The target object to find and process the keys
 * @param callbackfn The function to call with the details
 */
export function objForEachKey(target: any, callbackfn: (name: string, value: any) => void) {
    if (target && isObject(target)) {
        for (let prop in target) {
            if (hasOwnProperty(target, prop)) {
                callbackfn.call(target, prop, target[prop]);
            }
        }
    }
}

/**
 * The strEndsWith() method determines whether a string ends with the characters of a specified string, returning true or false as appropriate.
 * @param value - The value to check whether it ends with the search value.
 * @param search - The characters to be searched for at the end of the value.
 * @returns true if the given search value is found at the end of the string, otherwise false.
 */
export function strEndsWith(value: string, search: string) {
    if (value && search) {
        let len = value.length;
        let start = len - search.length;
        return value.substring(start >= 0 ? start : 0, len) === search;
    }

    return false;
}    

/**
 * Check if an object is of type Date
 */
export function isDate(obj: any): obj is Date {
    return Object[strShimPrototype].toString.call(obj) === "[object Date]";
}

/**
 * Check if an object is of type Array
 */
export function isArray(obj: any): boolean {
    return Object[strShimPrototype].toString.call(obj) === "[object Array]";
}

/**
 * Check if an object is of type Error
 */
export function isError(obj: any): boolean {
    return Object[strShimPrototype].toString.call(obj) === "[object Error]";
}

/**
 * Checks if the type of value is a string.
 * @param {any} value - Value to be checked.
 * @return {boolean} True if the value is a string, false otherwise.
 */
export function isString(value: any): value is string {
    return isTypeof(value, "string");
}

/**
 * Checks if the type of value is a number.
 * @param {any} value - Value to be checked.
 * @return {boolean} True if the value is a number, false otherwise.
 */
export function isNumber(value: any): value is number {
    return isTypeof(value, "number");
}

/**
 * Checks if the type of value is a boolean.
 * @param {any} value - Value to be checked.
 * @return {boolean} True if the value is a boolean, false otherwise.
 */
export function isBoolean(value: any): value is boolean {
    return isTypeof(value, "boolean");
}

/**
 * Convert a date to I.S.O. format in IE8
 */
export function toISOString(date: Date) {
    if (isDate(date)) {
        const pad = (num: number) => {
            let r = String(num);
            if (r.length === 1) {
                r = "0" + r;
            }

            return r;
        }

        return date.getUTCFullYear()
            + "-" + pad(date.getUTCMonth() + 1)
            + "-" + pad(date.getUTCDate())
            + "T" + pad(date.getUTCHours())
            + ":" + pad(date.getUTCMinutes())
            + ":" + pad(date.getUTCSeconds())
            + "." + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
            + "Z";
    }
}

/**
 * Performs the specified action for each element in an array. This helper exists to avoid adding a polyfil for older browsers
 * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
 * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
 * cause a testing requirement to test with and without the implementations
 * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array. It can return -1 to break out of the loop
 * @param thisArg  [Optional] An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
 */
export function arrForEach<T>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => void|number, thisArg?: any): void {
    let len = arr.length;
    for (let idx = 0; idx < len; idx++) {
        if (idx in arr) {
            if (callbackfn.call(thisArg || arr, arr[idx], idx, arr) === -1) {
                break;
            }
        }
    }
}

/**
 * Returns the index of the first occurrence of a value in an array. This helper exists to avoid adding a polyfil for older browsers
 * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
 * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
 * cause a testing requirement to test with and without the implementations
 * @param searchElement The value to locate in the array.
 * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
 */
export function arrIndexOf<T>(arr: T[], searchElement: T, fromIndex?: number): number {
    let len = arr.length;
    let from = fromIndex || 0;
    for (let lp = Math.max(from >= 0 ? from : len - Math.abs(from), 0); lp < len; lp++) {
        if (lp in arr && arr[lp] === searchElement) {
            return lp;
        }
    }

    return -1;
}

/**
 * Calls a defined callback function on each element of an array, and returns an array that contains the results. This helper exists 
 * to avoid adding a polyfil for older browsers that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page 
 * checks for presence/absence of the prototype implementation. Note: For consistency this will not use the Array.prototype.xxxx 
 * implementation if it exists as this would cause a testing requirement to test with and without the implementations
 * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
 * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
 */
export function arrMap<T, R>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => R, thisArg?: any): R[] {
    let len = arr.length;
    let _this = thisArg || arr;
    let results = new Array(len);

    for (let lp = 0; lp < len; lp++) {
        if (lp in arr) {
            results[lp] = callbackfn.call(_this, arr[lp], arr);
        }
    }

    return results;
}

/**
 * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is
 * provided as an argument in the next call to the callback function. This helper exists to avoid adding a polyfil for older browsers that do not define
 * Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation. Note: For consistency 
 * this will not use the Array.prototype.xxxx implementation if it exists as this would cause a testing requirement to test with and without the implementations
 * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
 * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
 */
export function arrReduce<T, R>(arr: T[], callbackfn: (previousValue: T | R, currentValue?: T, currentIndex?: number, array?: T[]) => R, initialValue?: R): R {
    let len = arr.length;
    let lp = 0;
    let value;

    // Specifically checking the number of passed arguments as the value could be anything
    if (arguments.length >= 3) {
        value = arguments[2];
    } else {
        while (lp < len && !(lp in arr)) {
            lp++;
        }

        value = arr[lp++];
    }

    while (lp < len) {
        if (lp in arr) {
            value = callbackfn(value, arr[lp], lp, arr);
        }
        lp++;
    }

    return value;
}

/**
 * helper method to trim strings (IE8 does not implement String.prototype.trim)
 */
export function strTrim(str: any): string {
    if (!isString(str)) {
        return str;
    }

    return str.replace(/^\s+|\s+$/g, "");
}

/**
 * Returns the names of the enumerable string properties and methods of an object. This helper exists to avoid adding a polyfil for older browsers 
 * that do not define Object.keys eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
 * Note: For consistency this will not use the Object.keys implementation if it exists as this would cause a testing requirement to test with and without the implementations
 * @param obj Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
 */
export function objKeys(obj: {}): string[] {
    var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString');

    if (!isFunction(obj) && (!isObject(obj) || obj === null)) {
        throw new TypeError('objKeys called on non-object');
    }

    let result: string[] = [];

    for (let prop in obj) {
        if (hasOwnProperty(obj, prop)) {
            result.push(prop);
        }
    }

    if (hasDontEnumBug) {
        let dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ];
        let dontEnumsLength = dontEnums.length;

        for (let lp = 0; lp < dontEnumsLength; lp++) {
            if (hasOwnProperty(obj, dontEnums[lp])) {
                result.push(dontEnums[lp]);
            }
        }
    }

    return result;
}

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
export function objDefineAccessors<T>(target: any, prop: string, getProp?: () => T, setProp?: (v: T) => void): boolean {
    let defineProp = Object["defineProperty"];
    if (defineProp) {
        try {
            let descriptor: PropertyDescriptor = {
                enumerable: true,
                configurable: true
            }

            if (getProp) {
                descriptor.get = getProp;
            }
            if (setProp) {
                descriptor.set = setProp;
            }

            defineProp(target, prop, descriptor);
            return true;
        } catch (e) {
            // IE8 Defines a defineProperty on Object but it's only supported for DOM elements so it will throw
            // We will just ignore this here.
        }
    }

    return false;
}

/**
 * Return the current time via the Date now() function (if available) and falls back to (new Date()).getTime() if now() is unavailable (IE8 or less)
 * https://caniuse.com/#search=Date.now
 */
export function dateNow() {
    let dt = Date;
    if (dt.now) {
        return dt.now();
    }

    return new dt().getTime();
}

/**
 * Returns the name of object if it's an Error. Otherwise, returns empty string.
 */
export function getExceptionName(object: any): string {
    if (isError(object)) {
        return object.name;
    }

    return "";
}
