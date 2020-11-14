/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../src/JavaScriptSDK/AppInsightsCore.ts" />
/// <reference path="../../src/applicationinsights-core-js.ts" />

import { IConfiguration, ITelemetryPlugin, ITelemetryItem, IPlugin, CoreUtils, IAppInsightsCore, getCrypto, getMsCrypto, CookieMgr, normalizeJsName } from "../../src/applicationinsights-core-js"
import { AppInsightsCore } from "../../src/JavaScriptSDK/AppInsightsCore";
import { IChannelControls } from "../../src/JavaScriptSDK.Interfaces/IChannelControls";
import { _InternalMessageId, LoggingSeverity } from "../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage, DiagnosticLogger } from "../../src/JavaScriptSDK/DiagnosticLogger";

export class CookieManagerTests extends TestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "CookieManager: Initialization",
            test: () => {

                let manager = new CookieMgr();

                let value = manager.get("Test");

                Assert.equal("", value, "Validates configuration");
            }
        });
    }
}
