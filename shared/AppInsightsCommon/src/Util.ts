// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { StorageType } from "./Enums";
import {
    EventHelper, _InternalMessageId, LoggingSeverity, IDiagnosticLogger, IPlugin,
    getGlobal, getGlobalInst, getWindow, getDocument, getNavigator, getPerformance, 
    getExceptionName as coreGetExceptionName, dumpObj, CookieMgr, uaDisallowsSameSiteNone, objForEachKey,
    isString, isFunction, isNullOrUndefined, CoreUtils
} from "@microsoft/applicationinsights-core-js";
import { RequestHeaders } from "./RequestResponseHeaders";
import { DataSanitizer } from "./Telemetry/Common/DataSanitizer";
import { ICorrelationConfig } from "./Interfaces/ICorrelationConfig";

let _navigator = getNavigator();

export class Util {
    private static _canUseLocalStorage: boolean = undefined;
    private static _canUseSessionStorage: boolean = undefined;
    // listing only non-geo specific locations
    private static _internalEndpoints: string[] = [
        "https://dc.services.visualstudio.com/v2/track",
        "https://breeze.aimon.applicationinsights.io/v2/track",
        "https://dc-int.services.visualstudio.com/v2/track"
    ];
    public static NotSpecified = "not_specified";

    public static createDomEvent(eventName: string): Event {
        let event: Event = null;

        if (isFunction(Event)) { // Use Event constructor when available
            event = new Event(eventName);
        } else { // Event has no constructor in IE
            let doc = getDocument();
            if (doc && doc.createEvent) {
                event = doc.createEvent("Event");
                event.initEvent(eventName, true, true);
            }
        }

        return event;
    }

    /*
     * Force the SDK not to use local and session storage
    */
    public static disableStorage() {
        Util._canUseLocalStorage = false;
        Util._canUseSessionStorage = false;
    }

    /**
     * Gets the localStorage object if available
     * @return {Storage} - Returns the storage object if available else returns null
     */
    private static _getLocalStorageObject(): Storage {
        if (Util.canUseLocalStorage()) {
            return Util._getVerifiedStorageObject(StorageType.LocalStorage);
        }

        return null;
    }

    /**
     * Tests storage object (localStorage or sessionStorage) to verify that it is usable
     * More details here: https://mathiasbynens.be/notes/localstorage-pattern
     * @param storageType Type of storage
     * @return {Storage} Returns storage object verified that it is usable
     */
    private static _getVerifiedStorageObject(storageType: StorageType): Storage {
        let storage: Storage = null;
        let fail: boolean;
        let uid: Date;
        try {
            if (isNullOrUndefined(getGlobal())) {
                return null;
            }
            uid = new Date;
            storage = storageType === StorageType.LocalStorage ? getGlobalInst("localStorage") : getGlobalInst("sessionStorage");
            storage.setItem(uid.toString(), uid.toString());
            fail = storage.getItem(uid.toString()) !== uid.toString();
            storage.removeItem(uid.toString());
            if (fail) {
                storage = null;
            }
        } catch (exception) {
            storage = null;
        }

        return storage;
    }

    /**
     *  Checks if endpoint URL is application insights internal injestion service URL.
     *
     *  @param endpointUrl Endpoint URL to check.
     *  @returns {boolean} True if if endpoint URL is application insights internal injestion service URL.
     */
    public static isInternalApplicationInsightsEndpoint(endpointUrl: string): boolean {
        return Util._internalEndpoints.indexOf(endpointUrl.toLowerCase()) !== -1;
    }

    /**
     *  Check if the browser supports local storage.
     *
     *  @returns {boolean} True if local storage is supported.
     */
    public static canUseLocalStorage(): boolean {
        if (Util._canUseLocalStorage === undefined) {
            Util._canUseLocalStorage = !!Util._getVerifiedStorageObject(StorageType.LocalStorage);
        }

        return Util._canUseLocalStorage;
    }

    /**
     *  Get an object from the browser's local storage
     *
     *  @param {string} name - the name of the object to get from storage
     *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
     */
    public static getStorage(logger: IDiagnosticLogger, name: string): string {
        const storage = Util._getLocalStorageObject();
        if (storage !== null) {
            try {
                return storage.getItem(name);
            } catch (e) {
                Util._canUseLocalStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserCannotReadLocalStorage,
                    "Browser failed read of local storage. " + coreGetExceptionName(e),
                    { exception: dumpObj(e) });
            }
        }
        return null;
    }

    /**
     *  Set the contents of an object in the browser's local storage
     *
     *  @param {string} name - the name of the object to set in storage
     *  @param {string} data - the contents of the object to set in storage
     *  @returns {boolean} True if the storage object could be written.
     */
    public static setStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
        const storage = Util._getLocalStorageObject();
        if (storage !== null) {
            try {
                storage.setItem(name, data);
                return true;
            } catch (e) {
                Util._canUseLocalStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserCannotWriteLocalStorage,
                    "Browser failed write to local storage. " + coreGetExceptionName(e),
                    { exception: dumpObj(e) });
            }
        }
        return false;
    }

    /**
     *  Remove an object from the browser's local storage
     *
     *  @param {string} name - the name of the object to remove from storage
     *  @returns {boolean} True if the storage object could be removed.
     */
    public static removeStorage(logger: IDiagnosticLogger, name: string): boolean {
        const storage = Util._getLocalStorageObject();
        if (storage !== null) {
            try {
                storage.removeItem(name);
                return true;
            } catch (e) {
                Util._canUseLocalStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserFailedRemovalFromLocalStorage,
                    "Browser failed removal of local storage item. " + coreGetExceptionName(e),
                    { exception: dumpObj(e) });
            }
        }
        return false;
    }

    /**
     * Gets the sessionStorage object if available
     * @return {Storage} - Returns the storage object if available else returns null
     */
    private static _getSessionStorageObject(): Storage {
        if (Util.canUseSessionStorage()) {
            return Util._getVerifiedStorageObject(StorageType.SessionStorage);
        }

        return null;
    }

    /**
     *  Check if the browser supports session storage.
     *
     *  @returns {boolean} True if session storage is supported.
     */
    public static canUseSessionStorage(): boolean {
        if (Util._canUseSessionStorage === undefined) {
            Util._canUseSessionStorage = !!Util._getVerifiedStorageObject(StorageType.SessionStorage);
        }

        return Util._canUseSessionStorage;
    }

    /**
     *  Gets the list of session storage keys
     *
     *  @returns {string[]} List of session storage keys
     */
    public static getSessionStorageKeys(): string[] {
        const keys: string[] = [];

        if (Util.canUseSessionStorage()) {
            objForEachKey(getGlobalInst<any>("sessionStorage"), (key) => {
                keys.push(key);
            });
        }

        return keys;
    }

    /**
     *  Get an object from the browser's session storage
     *
     *  @param {string} name - the name of the object to get from storage
     *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
     */
    public static getSessionStorage(logger: IDiagnosticLogger, name: string): string {
        const storage = Util._getSessionStorageObject();
        if (storage !== null) {
            try {
                return storage.getItem(name);
            } catch (e) {
                Util._canUseSessionStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserCannotReadSessionStorage,
                    "Browser failed read of session storage. " + coreGetExceptionName(e),
                    { exception: dumpObj(e) });
            }
        }
        return null;
    }

    /**
     *  Set the contents of an object in the browser's session storage
     *
     *  @param {string} name - the name of the object to set in storage
     *  @param {string} data - the contents of the object to set in storage
     *  @returns {boolean} True if the storage object could be written.
     */
    public static setSessionStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
        const storage = Util._getSessionStorageObject();
        if (storage !== null) {
            try {
                storage.setItem(name, data);
                return true;
            } catch (e) {
                Util._canUseSessionStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserCannotWriteSessionStorage,
                    "Browser failed write to session storage. " + coreGetExceptionName(e),
                    { exception: dumpObj(e) });
            }
        }
        return false;
    }

    /**
     *  Remove an object from the browser's session storage
     *
     *  @param {string} name - the name of the object to remove from storage
     *  @returns {boolean} True if the storage object could be removed.
     */
    public static removeSessionStorage(logger: IDiagnosticLogger, name: string): boolean {
        const storage = Util._getSessionStorageObject();
        if (storage !== null) {
            try {
                storage.removeItem(name);
                return true;
            } catch (e) {
                Util._canUseSessionStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserFailedRemovalFromSessionStorage,
                    "Browser failed removal of session storage item. " + coreGetExceptionName(e),
                    { exception: dumpObj(e) });
            }
        }
        return false;
    }

    /**
     * @deprecated - Use the core.getCookieMgr().disable()
     * Force the SDK not to store and read any data from cookies.
     */
    public static disableCookies = CoreUtils.disableCookies;

    /**
     * @deprecated - Use the core.getCookieMgr().isEnabled()
     * Helper method to tell if document.cookie object is available and whether it can be used.
     */
    public static canUseCookies(logger: IDiagnosticLogger): any {
        return CookieMgr._gbl(logger).isEnabled();
    }

    public static disallowsSameSiteNone = uaDisallowsSameSiteNone;

    /**
     * @deprecated - Use the core.getCookieMgr().set()
     * helper method to set userId and sessionId cookie
     */
    public static setCookie(logger: IDiagnosticLogger, name: string, value: string, domain?: string) {
        CookieMgr._gbl(logger).set(name, value, domain);
    }

    public static stringToBoolOrDefault(str: any, defaultValue = false): boolean {
        if (str === undefined || str === null) {
            return defaultValue;
        }

        return str.toString().toLowerCase() === "true";
    }

    /**
     * @deprecated - Use the core.getCookieMgr().get()
     * helper method to access userId and sessionId cookie
     */
    public static getCookie(logger: IDiagnosticLogger, name: string) {
        return CookieMgr._gbl(logger).get(name);
    }

    /**
     * @deprecated - Use the core.getCookieMgr().del()
     * Deletes a cookie by setting it's expiration time in the past.
     * @param name - The name of the cookie to delete.
     */
    public static deleteCookie(logger: IDiagnosticLogger, name: string) {
        return CookieMgr._gbl(logger).del(name);
    }

    /**
     * helper method to trim strings (IE8 does not implement String.prototype.trim)
     */
    public static trim = CoreUtils.strTrim;

    /**
     * generate random id string
     */
    public static newId = CoreUtils.newId;

    /**
     * generate a random 32bit number (-0x80000000..0x7FFFFFFF).
     */
    public static random32() {
        return CoreUtils.random32(true);
    }

    /**
     * generate W3C trace id
     */
    public static generateW3CId = CoreUtils.generateW3CId;

    /**
     * Check if an object is of type Array
     */
    public static isArray = CoreUtils.isArray;

    /**
     * Check if an object is of type Error
     */
    public static isError = CoreUtils.isError;

    /**
     * Check if an object is of type Date
     */
    public static isDate = CoreUtils.isDate;

    // Keeping this name for backward compatibility (for now)
    public static toISOStringForIE8 = CoreUtils.toISOString;

    /**
     * Gets IE version returning the document emulation mode if we are running on IE, or null otherwise
     */
    public static getIEVersion(userAgentStr: string = null): number {
        const myNav = userAgentStr ? userAgentStr.toLowerCase() : (_navigator ? (_navigator.userAgent || "").toLowerCase() : "");
        if (myNav.indexOf("msie") !== -1) {
            return parseInt(myNav.split("msie")[1]);
        } else if (myNav.indexOf("trident/")) {
            let tridentVer = parseInt(myNav.split("trident/")[1]);
            if (tridentVer) {
                return tridentVer + 4;
            }
        }

        return null;
    }

    /**
     * Convert ms to c# time span format
     */
    public static msToTimeSpan(totalms: number): string {
        if (isNaN(totalms) || totalms < 0) {
            totalms = 0;
        }

        totalms = Math.round(totalms);

        let ms = "" + totalms % 1000;
        let sec = "" + Math.floor(totalms / 1000) % 60;
        let min = "" + Math.floor(totalms / (1000 * 60)) % 60;
        let hour = "" + Math.floor(totalms / (1000 * 60 * 60)) % 24;
        const days = Math.floor(totalms / (1000 * 60 * 60 * 24));

        ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
        sec = sec.length < 2 ? "0" + sec : sec;
        min = min.length < 2 ? "0" + min : min;
        hour = hour.length < 2 ? "0" + hour : hour;

        return (days > 0 ? days + "." : "") + hour + ":" + min + ":" + sec + "." + ms;
    }

    /**
     * Checks if error has no meaningful data inside. Ususally such errors are received by window.onerror when error
     * happens in a script from other domain (cross origin, CORS).
     */
    public static isCrossOriginError(message: string|Event, url: string, lineNumber: number, columnNumber: number, error: Error): boolean {
        return !error && isString(message) && (message === "Script error." || message === "Script error");
    }

    /**
     * Returns string representation of an object suitable for diagnostics logging.
     */
    public static dump = dumpObj;

    /**
     * Returns the name of object if it's an Error. Otherwise, returns empty string.
     */
    public static getExceptionName = coreGetExceptionName;

    /**
     * Adds an event handler for the specified event to the window
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static addEventHandler(eventName: string, callback: any): boolean {
        return EventHelper.Attach(getWindow(), eventName, callback);
    }

    /**
     * Tells if a browser supports a Beacon API
     */
    public static IsBeaconApiSupported(): boolean {
        return ('sendBeacon' in _navigator && (_navigator as any).sendBeacon);
    }

    public static getExtension(extensions: IPlugin[], identifier: string) {
        let extension = null;
        let extIx = 0;

        while (!extension && extIx < extensions.length) {
            if (extensions[extIx] && extensions[extIx].identifier === identifier) {
                extension = extensions[extIx];
            }
            extIx++;
        }

        return extension;
    }
}

export class UrlHelper {
    private static document: any = getDocument() || {};

    private static _htmlAnchorIdx: number = 0;
    // Use an array of temporary values as it's possible for multiple calls to parseUrl() will be called with different URLs
    // Using a cache size of 5 for now as it current depth usage is at least 2, so adding a minor buffer to handle future updates
    private static _htmlAnchorElement: HTMLAnchorElement[] = [null, null, null, null, null];

    public static parseUrl(url: string): HTMLAnchorElement {
        let anchorIdx = UrlHelper._htmlAnchorIdx;
        let anchorCache = UrlHelper._htmlAnchorElement;
        let tempAnchor = anchorCache[anchorIdx];
        if (!UrlHelper.document.createElement) {
            // Always create the temp instance if createElement is not available
            tempAnchor = { host: UrlHelper.parseHost(url, true) } as HTMLAnchorElement;
        } else if (!anchorCache[anchorIdx]) {
            // Create and cache the unattached anchor instance 
            tempAnchor = anchorCache[anchorIdx] = UrlHelper.document.createElement('a');
        }

        tempAnchor.href = url;

        // Move the cache index forward
        anchorIdx++;
        if (anchorIdx >= anchorCache.length) {
            anchorIdx = 0;
        }

        UrlHelper._htmlAnchorIdx = anchorIdx;

        return tempAnchor;
    }

    public static getAbsoluteUrl(url: string): string {
        let result: string;
        const a = UrlHelper.parseUrl(url);
        if (a) {
            result = a.href;
        }

        return result;
    }

    public static getPathName(url: string): string {
        let result: string;
        const a = UrlHelper.parseUrl(url);
        if (a) {
            result = a.pathname;
        }

        return result;
    }

    public static getCompleteUrl(method: string, absoluteUrl: string) {
        if (method) {
            return method.toUpperCase() + " " + absoluteUrl;
        } else {
            return absoluteUrl;
        }
    }

    // Fallback method to grab host from url if document.createElement method is not available
    public static parseHost(url: string, inclPort?: boolean) {
        let fullHost = UrlHelper.parseFullHost(url, inclPort);
        if (fullHost) {
            const match = fullHost.match(/(www[0-9]?\.)?(.[^/:]+)(\:[\d]+)?/i);
            if (match != null && match.length > 3 && isString(match[2]) && match[2].length > 0) {
                return match[2] + (match[3] || "");
            }
        }

        return fullHost;
    }

    /**
     * Get the full host from the url, optionally including the port
     */
    public static parseFullHost(url: string, inclPort?: boolean) {
        let result = null;
        if (url) {
            const match = url.match(/(\w*):\/\/(.[^/:]+)(\:[\d]+)?/i);
            if (match != null && match.length > 2 && isString(match[2]) && match[2].length > 0) {
                result = match[2] || "";
                if (inclPort && match.length > 2) {
                    const protocol = (match[1] || "").toLowerCase();
                    let port = match[3] || "";
                    // IE includes the standard port so pass it off if it's the same as the protocol
                    if (protocol === "http" && port === ":80") {
                        port = "";
                    } else if (protocol === "https" && port === ":443") {
                        port = "";
                    }

                    result += port;
                }
            }
        }

        return result;
    }
}

export class CorrelationIdHelper {
    public static correlationIdPrefix = "cid-v1:";

    /**
     * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers.
     * Headers are always included if the current domain matches the request domain. If they do not match (CORS),
     * they are regex-ed across correlationHeaderDomains and correlationHeaderExcludedDomains to determine if headers are included.
     * Some environments don't give information on currentHost via window.location.host (e.g. Cordova). In these cases, the user must
     * manually supply domains to include correlation headers on. Else, no headers will be included at all.
     */
    public static canIncludeCorrelationHeader(config: ICorrelationConfig, requestUrl: string, currentHost?: string) {
        if (!requestUrl || (config && config.disableCorrelationHeaders)) {
            return false;
        }

        if (config && config.correlationHeaderExcludePatterns) {
            for (let i = 0; i < config.correlationHeaderExcludePatterns.length; i++) {
                if (config.correlationHeaderExcludePatterns[i].test(requestUrl)) {
                    return false;
                }
            }
        }

        let requestHost = UrlHelper.parseUrl(requestUrl).host.toLowerCase();
        if (requestHost && (requestHost.indexOf(":443") !== -1 || requestHost.indexOf(":80") !== -1)) {
            // [Bug #1260] IE can include the port even for http and https URLs so if present 
            // try and parse it to remove if it matches the default protocol port
            requestHost = (UrlHelper.parseFullHost(requestUrl, true) || "").toLowerCase();
        }

        if ((!config || !config.enableCorsCorrelation) && requestHost !== currentHost) {
            return false;
        }

        const includedDomains = config && config.correlationHeaderDomains;
        if (includedDomains) {
            let matchExists: boolean;
            CoreUtils.arrForEach(includedDomains, (domain) => {
                const regex = new RegExp(domain.toLowerCase().replace(/\./g, "\.").replace(/\*/g, ".*"));
                matchExists = matchExists || regex.test(requestHost);
            });

            if (!matchExists) {
                return false;
            }
        }

        const excludedDomains = config && config.correlationHeaderExcludedDomains;
        if (!excludedDomains || excludedDomains.length === 0) {
            return true;
        }

        for (let i = 0; i < excludedDomains.length; i++) {
            const regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\./g, "\.").replace(/\*/g, ".*"));
            if (regex.test(requestHost)) {
                return false;
            }
        }

        // if we don't know anything about the requestHost, require the user to use included/excludedDomains.
        // Previously we always returned false for a falsy requestHost
        return requestHost && requestHost.length > 0;
    }

    /**
     * Combines target appId and target role name from response header.
     */
    public static getCorrelationContext(responseHeader: string) {
        if (responseHeader) {
            const correlationId = CorrelationIdHelper.getCorrelationContextValue(responseHeader, RequestHeaders.requestContextTargetKey);
            if (correlationId && correlationId !== CorrelationIdHelper.correlationIdPrefix) {
                return correlationId;
            }
        }
    }

    /**
     * Gets key from correlation response header
     */
    public static getCorrelationContextValue(responseHeader: string, key: string) {
        if (responseHeader) {
            const keyValues = responseHeader.split(",");
            for (let i = 0; i < keyValues.length; ++i) {
                const keyValue = keyValues[i].split("=");
                if (keyValue.length === 2 && keyValue[0] === key) {
                    return keyValue[1];
                }
            }
        }
    }
}

export class AjaxHelper {
    public static ParseDependencyPath(logger: IDiagnosticLogger, absoluteUrl: string, method: string, commandName: string) {
        let target, name = commandName, data = commandName;

        if (absoluteUrl && absoluteUrl.length > 0) {
            const parsedUrl: HTMLAnchorElement = UrlHelper.parseUrl(absoluteUrl)
            target = parsedUrl.host;
            if (!name) {
                if (parsedUrl.pathname != null) {
                    let pathName: string = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                    if (pathName.charAt(0) !== '/') {
                        pathName = "/" + pathName;
                    }
                    data = parsedUrl.pathname;
                    name = DataSanitizer.sanitizeString(logger, method ? method + " " + pathName : pathName);
                } else {
                    name = DataSanitizer.sanitizeString(logger, absoluteUrl);
                }
            }
        } else {
            target = commandName;
            name = commandName;
        }

        return {
            target,
            name,
            data
        };
    }
}

/**
 * A utility class that helps getting time related parameters
 */
export class DateTimeUtils {
    /**
     * Get the number of milliseconds since 1970/01/01 in local timezone
     */
    public static Now = () => {
        // returns the window or webworker performance object
        let perf = getPerformance();
        if (perf && perf.now && perf.timing) {
            let now = perf.now() + perf.timing.navigationStart;
            // Known issue with IE where this calculation can be negative, so if it is then ignore and fallback
            if (now > 0) {
                return now;
            }
        }

        return new Date().getTime();
    };

    /**
     * Gets duration between two timestamps
     */
    public static GetDuration = (start: number, end: number): number => {
        let result = null;
        if (start !== 0 && end !== 0 && !CoreUtils.isNullOrUndefined(start) && !CoreUtils.isNullOrUndefined(end)) {
            result = end - start;
        }

        return result;
    }
}
