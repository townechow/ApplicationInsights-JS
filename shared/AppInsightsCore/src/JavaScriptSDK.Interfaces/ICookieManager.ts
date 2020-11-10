// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface ICookieManager {

    /**
     * Returns whether the usage of cookies are available
     */
    isAvailable(): boolean;

    /**
     * Enable the usage of cookies
     */
    enable(): void;

    /**
     * Disable the usage of cookies
     */
    disable(): void;

    /**
     * Can the system use cookies, if this returns false then all cookie setting and access functions will return nothing
     */
    isEnabled(): boolean;

    /**
     * Set the named cookie with the value and optional domain and optional 
     * @param name - The name of the cookie
     * @param value - The value of the cookie (Must already be encoded)
     * @param domain - [optional] The domain to set for the cookie
     * @param maxAge - [optional] The maximum number of SECONDS that this cookie should survive
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     */
    set(name: string, value: string, domain?: string, maxAge?: number, path?: string): void;

    /**
     * Get the value of the named cookie
     * @param name - The name of the cookie
     */
    get(name: string): string;

    /**
     * Delete/Remove the named cookie.
     * Note: Not using "delete" as the name because it's a reserved word which would cause issues on older browsers
     * @param name - The name of the cookie
     * @param path - [optional] Path to set for the cookie, if not supplied will default to "/"
     */
    del(name: string, path?: string): void;
}

export interface ICookieManagerConfig {
    enabled?: boolean;

    domain?: string;
}