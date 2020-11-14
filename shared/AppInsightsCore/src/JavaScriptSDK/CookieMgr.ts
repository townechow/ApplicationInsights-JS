// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IDiagnosticLogger } from '../JavaScriptSDK.Interfaces/IDiagnosticLogger';
import { ICookieMgr, ICookieMgrConfig } from '../JavaScriptSDK.Interfaces/ICookieMgr';
import { _InternalMessageId, LoggingSeverity } from '../JavaScriptSDK.Enums/LoggingEnums';
import { dumpObj, getDocument, getLocation, getNavigator, isIE } from './EnvUtils';
import { DiagnosticLogger } from "./DiagnosticLogger";
import { arrForEach, getExceptionName, isFunction, isNullOrUndefined, isString, isUndefined, objForEachKey, strEndsWith, strTrim } from "./HelperFuncs";

const strToGMTString = 'toGMTString';
const strToUTCString = 'toUTCString';
const strExpires = "expires";
const strMaxAge = "max-age";
const strDomain = "domain";
const strSecure = "secure";
const strSameSite = "SameSite";
const strPath = "path";

const strDelCookie = "delCookie";
const strSetCookie = "setCookie";
const strGetCookie = "getCookie";

// Global cached values are stored against the class instance
const strGblValues = "_inst";
const strGblInst = "g";
const strCanUseCookies = "u";
const strUaSameSite = "s";
const strParsedCookieValue = "p";
const strCookieCache = "c"

export class CookieMgr implements ICookieMgr {
    /**
     * DO NOT USE, this is exposed as public to support backward compatibility of previous static utility methods only.
     * If you want to manager cookies either use the ICookieMgr available from the core instance via getCookieMgr() or create
     * your own instance of the CookieMgr and use that.
     * Using this directly for enabling / disabling cookie handling will not only affect your usage but EVERY user of cookies.
     * Example, if you are using a shared component that is also using Application Insights you will affect their cookie handling.
     * @param logger - The DiagnosticLogger to use for reporting errors.
     */
    public static _gbl(logger?: IDiagnosticLogger): ICookieMgr {
        // Stash the global instance against the BaseCookieMgr class
        let inst = CookieMgr[strGblInst];
        if (!inst) {
            inst = CookieMgr[strGblInst] = new CookieMgr({}, logger);
        }
    
        return inst;
    }

    /**
     * Enable or disable the usage of cookies
     */
    public setEnabled: (value: boolean) => void;

    /**
     * Can the system use cookies, if this returns false then all cookie setting and access functions will return nothing
     */
    public isEnabled: () => boolean;

    /**
     * Set the named cookie with the value and optional domain and optional 
     * @param name - The name of the cookie
     * @param value - The value of the cookie (Must already be encoded)
     * @param domain - [optional] The domain to set for the cookie
     * @param maxAge - [optional] The maximum number of SECONDS that this cookie should survive
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     */
    public set: (name: string, value: string, domain?: string, maxAge?: number, path?: string) => void;

    /**
     * Get the value of the named cookie
     * @param name - The name of the cookie
     */
    public get: (name: string) => string;

    /**
     * Delete/Remove the named cookie.
     * Note: Not using "delete" as the name because it's a reserved word which would cause issues on older browsers
     * @param name - The name of the cookie
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     */
    public del: (name: string, path?: string) => void;

    constructor(config?: ICookieMgrConfig, logger?: IDiagnosticLogger) {
        let _enabled = true;
        if (!logger) {
            logger = new DiagnosticLogger();
        }
        if (!config) {
            config = {};
        }

        let _self = this;

        _self.isEnabled = () => {
            let enabled = _enabled && _areCookiesAvailable(logger);;
            let gblManager = CookieMgr._gbl(logger);
            if (enabled && _self !== gblManager) {
                // Make sure the GlobalCookie Manager instance (if not this instance) is also enabled, as the global functions may have been called (for backward compatibility)
                enabled = gblManager.isEnabled();
            }

            return enabled;
        };

        _self.setEnabled = (value: boolean) => {
            _enabled = value;
        };

        _self.set = (name: string, value: string, domain?: string, maxAge?: number, path?: string) => {
            if (_self.isEnabled()) {
                let values = _extractParts(value);

                // Only update domain if not already present
                if (isUndefined(values[strDomain]) && (domain || config.domain)) {
                    values[strDomain] = domain || config.domain;
                }
            
                if (!isNullOrUndefined(maxAge)) {
                    const _isIE = isIE();
                    if (isUndefined(values[strExpires])) {
                        const now = (new Date()).getTime();
                        // Only add expires if not already present
                        let expireTicks = now + (maxAge * 1000);
            
                        // Sanity check, if zero or -ve then ignore
                        if (expireTicks > 0) {
                            let expiry = new Date();
                            expiry.setTime(expireTicks);
                            let expiresTime = _formatDate(expiry, !_isIE ? strToUTCString : strToGMTString) || _formatDate(expiry, _isIE ? strToGMTString : strToUTCString) || "";
                            if (expiresTime) {
                                values[strExpires] = expiresTime;
                            }
                        }
                    }
            
                    if (!_isIE && isUndefined(values[strMaxAge])) {
                        values[strMaxAge] = "" + maxAge;
                    }
                }
            
                let location = getLocation();
                if (location && location.protocol === "https:") {
                    if (isUndefined(values[strSecure])) {
                        values[strSameSite] = null;
                    }
            
                    if (isUndefined(values[strSameSite])) {
                        let allowSameSite = _getGlobalValues<boolean>(strUaSameSite);
                        if (allowSameSite === null) {
                            allowSameSite = !uaDisallowsSameSiteNone((getNavigator() || {} as Navigator).userAgent);
                            _setGlobalValues(strUaSameSite, allowSameSite);
                        }
                
                        if (allowSameSite) {
                            values[strSameSite] = "None"; // SameSite can only be set on secure pages
                        }
                    }
                }
            
                if (isUndefined(values[strPath])) {
                    values[strPath] = path || "/";
                }
            
                let setCookie = config[strSetCookie] || _setCookieValue;
                setCookie(name, _formatCookieValue(values));
            }
        };

        _self.get = (name: string): string => {
            let value = ""
            if (_self.isEnabled()) {
                value = (config[strGetCookie] || _getCookieValue)(name);
            }

            return value;
        };

        _self.del = (name: string, path?: string) => {
            if (_self.isEnabled()) {
                // Setting the expiration date in the past immediately removes the cookie
                let values = {
                    [strPath]: path ? path : "/",
                    [strExpires]: "Thu, 01 Jan 1970 00:00:01 GMT"
                }

                let delCookie = config[strDelCookie] || _setCookieValue;
                delCookie(name, _formatCookieValue(values));
            }
        }
    }
}

function _getGlobalValues<T>(name: string): T {
    let values = CookieMgr[strGblValues];
    let value = null;
    if (values) {
        value = values[name];
        if (isUndefined(value)) {
            value = null;
        }
    }

    return value;
}

function _setGlobalValues<T>(name: string, value: T) {
    let values = CookieMgr[strGblValues];
    if (!values) {
        values = {};
        CookieMgr[strGblValues] = values;
    }

    values[name] = value;
}

/*
* helper method to tell if document.cookie object is available
*/
function _areCookiesAvailable(logger: IDiagnosticLogger): any {
    let supportsCookies = _getGlobalValues<boolean>(strCanUseCookies);
    if (supportsCookies === null) {
        supportsCookies = false;

        try {
            let doc = getDocument() || {} as Document;
            supportsCookies = doc.cookie !== undefined;
        } catch (e) {
            logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.CannotAccessCookie,
                "Cannot access document.cookie - " + getExceptionName(e),
                { exception: dumpObj(e) });
        }

        _setGlobalValues(strCanUseCookies, supportsCookies);
    }

    return supportsCookies;
}

function _extractParts(theValue: string) {
    let values: { [key: string]: string } = {};
    if (theValue && theValue.length) {
        let parts = strTrim(theValue).split(";");
        arrForEach(parts, (thePart) => {
            if (thePart) {
                let idx = thePart.indexOf("=");
                if (idx === -1) {
                    values[thePart] = null;
                } else {
                    let name: string = strTrim(thePart.substring(0, idx));
                    values[name] = thePart.substring(idx + 1);
                }
            }
        });
    }

    return values;
}

function _formatDate(theDate: Date, func: string) {
    if (isFunction(theDate[func])) {
        return theDate[func]();
    }
    
    return null;
}

function _formatCookieValue(values: any) {
    let cookieValue = "";
    objForEachKey(values, (name, theValue) => {
        if (cookieValue) {
            cookieValue += ";"
        }
        
        cookieValue += !isNullOrUndefined(theValue) ? name + "=" + theValue : name;
    });

    return cookieValue;
}

function _getCookieValue(name: string) {
    let cookieValue = "";
    let doc = getDocument();
    if (doc) {
        let parsedCookieValue = _getGlobalValues<string>(strParsedCookieValue);
        if (parsedCookieValue !== doc.cookie) {
            let value = doc.cookie || "";
            _setGlobalValues(strCookieCache, _extractParts(value));
            _setGlobalValues(strParsedCookieValue, value);
        }

        let cookieCache = _getGlobalValues(strCookieCache) || {};
        cookieValue = strTrim(cookieCache[name] || "");
    }

    return cookieValue;
}

function _setCookieValue(name: string, cookieValue: string) {
    let doc = getDocument();
    if (doc) {
        doc.cookie = name + "=" + cookieValue;
    }
}

/**
 * Returns the global cookie manager instance
 */
function _gblCookieMgr(): ICookieMgr {
    return CookieMgr._gbl();
}

/**
 * DO NOT USE, this is exported for internal use to support backward compatibility of previous static utility methods/properties ONLY.
 * IT SHOULD NEVER be EXPORTED BY THE MODULE VIA THE applicationinsights-core-js
 * This is also why the names are prefixed with an "_" and minimized (not externally friendly)
 */
export function _ckEnable(): void {
    _gblCookieMgr().setEnabled(true);
}

/**
 * DO NOT USE, this is exported for internal use to support backward compatibility of previous static utility methods/properties ONLY.
 * IT SHOULD NEVER be EXPORTED BY THE MODULE VIA THE applicationinsights-core-js
 * This is also why the names are prefixed with an "_" and minimized (not externally friendly)
 */
export function _ckDisable(): void {
    _gblCookieMgr().setEnabled(false);
}

/**
 * DO NOT USE, this is exported for internal use to support backward compatibility of previous static utility methods/properties ONLY.
 * IT SHOULD NEVER be EXPORTED BY THE MODULE VIA THE applicationinsights-core-js
 * This is also why the names are prefixed with an "_" and minimized (not externally friendly)
 */
export function _ckIsEnabled(): boolean {
    return _gblCookieMgr().isEnabled();
}

export function uaDisallowsSameSiteNone(userAgent: string) {
    if (!isString(userAgent)) {
        return false;
    }

    // Cover all iOS based browsers here. This includes:
    // - Safari on iOS 12 for iPhone, iPod Touch, iPad
    // - WkWebview on iOS 12 for iPhone, iPod Touch, iPad
    // - Chrome on iOS 12 for iPhone, iPod Touch, iPad
    // All of which are broken by SameSite=None, because they use the iOS networking stack
    if (userAgent.indexOf("CPU iPhone OS 12") !== -1 || userAgent.indexOf("iPad; CPU OS 12") !== -1) {
        return true;
    }

    // Cover Mac OS X based browsers that use the Mac OS networking stack. This includes:
    // - Safari on Mac OS X
    // This does not include:
    // - Internal browser on Mac OS X
    // - Chrome on Mac OS X
    // - Chromium on Mac OS X
    // Because they do not use the Mac OS networking stack.
    if (userAgent.indexOf("Macintosh; Intel Mac OS X 10_14") !== -1 && userAgent.indexOf("Version/") !== -1 && userAgent.indexOf("Safari") !== -1) {
        return true;
    }

    // Cover Mac OS X internal browsers that use the Mac OS networking stack. This includes:
    // - Internal browser on Mac OS X
    // This does not include:
    // - Safari on Mac OS X
    // - Chrome on Mac OS X
    // - Chromium on Mac OS X
    // Because they do not use the Mac OS networking stack.
    if (userAgent.indexOf("Macintosh; Intel Mac OS X 10_14") !== -1 && strEndsWith(userAgent, "AppleWebKit/605.1.15 (KHTML, like Gecko)")) {
        return true;
    }

    // Cover Chrome 50-69, because some versions are broken by SameSite=None, and none in this range require it.
    // Note: this covers some pre-Chromium Edge versions, but pre-Chromim Edge does not require SameSite=None, so this is fine.
    // Note: this regex applies to Windows, Mac OS X, and Linux, deliberately.
    if (userAgent.indexOf("Chrome/5") !== -1 || userAgent.indexOf("Chrome/6") !== -1) {
        return true;
    }

    // Unreal Engine runs Chromium 59, but does not advertise as Chrome until 4.23. Treat versions of Unreal
    // that don't specify their Chrome version as lacking support for SameSite=None.
    if (userAgent.indexOf("UnrealEngine") !== -1 && userAgent.indexOf("Chrome") === -1) {
        return true;
    }

    // UCBrowser < 12.13.2 ignores Set-Cookie headers with SameSite=None
    // NB: this rule isn't complete - you need regex to make a complete rule.
    // See: https://www.chromium.org/updates/same-site/incompatible-clients
    if (userAgent.indexOf("UCBrowser/12") !== -1 || userAgent.indexOf("UCBrowser/11") !== -1) {
        return true;
    }

    return false;
}
