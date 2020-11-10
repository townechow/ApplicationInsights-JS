// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import dynamicProto from "@microsoft/dynamicproto-js";
import { IDiagnosticLogger } from '../JavaScriptSDK.Interfaces/IDiagnosticLogger';
import { ICookieManager, ICookieManagerConfig } from '../JavaScriptSDK.Interfaces/ICookieManager';
import { _InternalMessageId, LoggingSeverity } from '../JavaScriptSDK.Enums/LoggingEnums';
import { getDocument, getLocation, getNavigator } from '../JavaScriptSDK/EnvUtils';
import { getExceptionName, dumpObj, uaDisallowsSameSiteNone, CoreUtils, objForEachKey } from '../JavaScriptSDK/CoreUtils';
import { DiagnosticLogger } from "./DiagnosticLogger";

const strToGMTString = 'toGMTString';
const strToUTCString = 'toUTCString';
const strExpires = "expires";
const strMaxAge = "max-age";
const strDomain = "domain";
const strSecure = "secure";
const strSameSite = "SameSite";
const strPath = "path";

let _strTrim = CoreUtils.strTrim;
let _isUndefined = CoreUtils.isUndefined;
let _isNullOrUndefined = CoreUtils.isNullOrUndefined;
let _cookiesAvailable: boolean = null;
let _globalCookieManager: ICookieManager = null;
let _uaDisallowsSameSiteNone: boolean = null;

export function gblCookieMgr(logger?: IDiagnosticLogger) {
    if (!_globalCookieManager) {
        _globalCookieManager = new GlobalCookieManager(logger);
    }

    return _globalCookieManager;
}

/*
* helper method to tell if document.cookie object is available
*/
function _areCookiesAvailable(logger: IDiagnosticLogger): any {
    if (_cookiesAvailable === null) {
        _cookiesAvailable = false;

        try {
            let doc = getDocument() || {} as Document;
            _cookiesAvailable = doc.cookie !== undefined;
        } catch (e) {
            logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.CannotAccessCookie,
                "Cannot access document.cookie - " + getExceptionName(e),
                { exception: dumpObj(e) });
        };
    }

    return _cookiesAvailable;
}

function _extractParts(theValue: string) {
    let values: { [key: string]: string } = {};
    if (theValue && theValue.length) {
        let parts = _strTrim(theValue).split(";");
        CoreUtils.arrForEach(parts, (thePart) => {
            if (thePart) {
                let idx = thePart.indexOf("=");
                if (idx === -1) {
                    values[thePart] = null;
                } else {
                    let name: string = _strTrim(thePart.substring(0, idx));
                    values[name] = thePart.substring(idx + 1);
                }
            }
        });
    }

    return values;
}

function _formatCookieValue(values: any) {
    let cookieValue = "";
    objForEachKey(values, (name, theValue) => {
        if (cookieValue) {
            cookieValue += ";"
        }
        
        cookieValue += !_isNullOrUndefined(theValue) ? name + "=" + theValue : name;
    });

    return cookieValue;
}

class GlobalCookieManager implements ICookieManager {
    constructor(logger?: IDiagnosticLogger, config?: ICookieManagerConfig) {
        let _enabled = true;
        let _parsedCookieValue: string;
        let _cookieCache: { [name: string]: string } = {};
        if (!logger) {
            logger = new DiagnosticLogger();
        }

        if (!config) {
            config = {};
        }

        if (!_isNullOrUndefined(config.enabled)) {
            _enabled = config.enabled;
        }

        dynamicProto(CookieManager, this, (_self) => {
            _self.isAvailable = () => {
                return _areCookiesAvailable(logger);
            };

            _self.enable = () => {
                _enabled = true;
            };

            _self.disable = () => {
                _enabled = false;
            };

            _self.isEnabled = () => {
                return _enabled && _areCookiesAvailable(logger);
            };

            _self.set = (name: string, value: string, domain?: string, maxAge?: number, path?: string) => {
                let doc = getDocument();
                if (doc && _self.isEnabled()) {

                    let values = _extractParts(value);

                    // Only update domain if not already present
                    if (_isUndefined(values[strDomain]) && (domain || config.domain)) {
                        values[strDomain] = domain || config.domain;
                    }

                    if (!_isNullOrUndefined(maxAge)) {
                        const isIE = CoreUtils.isIE();
                        if (_isUndefined(values[strExpires])) {
                            const now = (new Date()).getTime();
                            // Only add expires if not already present
                            let expireTicks = now + (maxAge * 1000);
    
                            // Sanity check, if zero or -ve then ignore
                            if (expireTicks > 0) {
                                let expiry = new Date();
                                expiry.setTime(expireTicks);
                                let expiresTime = _formatDate(expiry, !isIE ? strToUTCString : strToGMTString) || _formatDate(expiry, isIE ? strToGMTString : strToUTCString) || "";
                                if (expiresTime) {
                                    values[strExpires] = expiresTime;
                                }
                            }
                        }

                        if (!isIE && _isUndefined(values[strMaxAge])) {
                            values[strMaxAge] = "" + maxAge;
                        }
                    }
                
                    let location = getLocation();
                    if (location && location.protocol === "https:") {
                        if (_isUndefined(values[strSecure])) {
                            values[strSameSite] = null;
                        }

                        if (_isUndefined(values[strSameSite])) {
                            if (_uaDisallowsSameSiteNone === null) {
                                _uaDisallowsSameSiteNone = uaDisallowsSameSiteNone((getNavigator() || {} as Navigator).userAgent);
                            }
                    
                            if (!_uaDisallowsSameSiteNone) {
                                values[strSameSite] = "None"; // SameSite can only be set on secure pages
                            }
                        }
                    }

                    if (_isUndefined(values[strPath])) {
                        values[strPath] = path || "/";
                    }
                
                    doc.cookie = name + "=" + _formatCookieValue(values);
                }
            };

            _self.get = (name: string) => {
                let cookieValue = "";
                let doc = getDocument();
                if (doc && _self.isEnabled()) {
                    if (_parsedCookieValue !== doc.cookie) {
                        let value = doc.cookie || "";
                        _cookieCache = _extractParts(value);
                        _parsedCookieValue = value;
                    }

                    cookieValue = _strTrim(_cookieCache[name] || "");
                }

                return cookieValue;
            };

            _self.del = (name: string, path?: string) => {
                let doc = getDocument();
                if (doc && _self.isEnabled()) {
                    // Setting the expiration date in the past immediately removes the cookie
                    let values = {
                        [strPath]: path ? path : "/",
                        [strExpires]: "Thu, 01 Jan 1970 00:00:01 GMT"
                    }

                    doc.cookie = name + "=" + _formatCookieValue(values);
                }
            }

            function _formatDate(theDate: Date, func: string) {
                if (CoreUtils.isFunction(theDate[func])) {
                    return theDate[func]();
                }
             
                return null;
            }
        });
    }

    /**
     * Returns whether the usage of cookies are available
     */
    public isAvailable(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    };

    /**
     * Enable the usage of cookies
     */
    public enable(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Disable the usage of cookies
     */
    public disable(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Can the system use cookies, if this returns false then all cookie setting and access functions will return nothing
     */
    public isEnabled(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Set the named cookie with the value and optional domain and optional 
     * @param name - The name of the cookie
     * @param value - The value of the cookie (Must already be encoded)
     * @param domain - [optional] The domain to set for the cookie
     * @param maxAge - [optional] The maximum number of SECONDS that this cookie should survive
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     */
    public set(name: string, value: string, domain?: string, maxAge?: number, path?: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get the value of the named cookie
     * @param name - The name of the cookie
     */
    public get(name: string): string  {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Delete/Remove the named cookie.
     * Note: Not using "delete" as the name because it's a reserved word which would cause issues on older browsers
     * @param name - The name of the cookie
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     */
    public del(name: string, path?: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

export class CookieManager implements ICookieManager {
    constructor(logger?: IDiagnosticLogger, config?: ICookieManagerConfig) {
        let _enabled = true;
        if (!logger) {
            logger = new DiagnosticLogger();
        }

        if (!config) {
            config = {};
        }

        if (!_isNullOrUndefined(config.enabled)) {
            _enabled = config.enabled;
        }

        dynamicProto(CookieManager, this, (_self) => {
            _self.isAvailable = () => {
                return gblCookieMgr(logger).isAvailable();
            };

            _self.enable = () => {
                _enabled = true;
            };

            _self.disable = () => {
                _enabled = false;
            };

            _self.isEnabled = () => {
                return _enabled && gblCookieMgr(logger).isEnabled();
            };

            _self.set = (name: string, value: string, domain?: string, maxAge?: number, path?: string) => {
                if (_enabled) {
                    gblCookieMgr(logger).set(name, value, domain, maxAge, path);
                }
            };

            _self.get = (name: string) => {
                return _enabled ? gblCookieMgr(logger).get(name) : null;
            };

            _self.del = (name: string, path?: string) => {
                if (_enabled) {
                    gblCookieMgr(logger).del(name, path);
                }
            }
        });
    }

    /**
     * Returns whether the usage of cookies are available
     */
    public isAvailable(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    };

    /**
     * Enable the usage of cookies
     */
    public enable(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Disable the usage of cookies
     */
    public disable(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Can the system use cookies, if this returns false then all cookie setting and access functions will return nothing
     */
    public isEnabled(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Set the named cookie with the value and optional domain and optional 
     * @param name - The name of the cookie
     * @param value - The value of the cookie (Must already be encoded)
     * @param domain - [optional] The domain to set for the cookie
     * @param maxAge - [optional] The maximum number of SECONDS that this cookie should survive
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     */
    public set(name: string, value: string, domain?: string, maxAge?: number, path?: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * get the value of the named cookie
     */
    public get(name: string): string  {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Delete/Remove the named cookie.
     * Note: Not using "delete" as the name because it's a reserved word which would cause issues on older browsers
     * @param name - The name of the cookie
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     */
    public del(name: string, path?: string): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
