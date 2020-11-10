/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */

import {
    BaseTelemetryPlugin, IConfiguration, CoreUtils,
    IAppInsightsCore, IPlugin, ITelemetryItem, IProcessTelemetryContext, _InternalLogMessage, LoggingSeverity, _InternalMessageId, getNavigator,
    ITelemetryPluginChain, objForEachKey
} from '@microsoft/applicationinsights-core-js';
import { TelemetryContext } from './TelemetryContext';
import { PageView, IConfig, BreezeChannelIdentifier, PropertiesPluginIdentifier, IPropertiesPlugin, Extensions, Util } from '@microsoft/applicationinsights-common';
import { ITelemetryConfig } from './Interfaces/ITelemetryConfig';
import dynamicProto from "@microsoft/dynamicproto-js";

export default class PropertiesPlugin extends BaseTelemetryPlugin implements IPropertiesPlugin {

    public static getDefaultConfig(): ITelemetryConfig {
        const defaultConfig: ITelemetryConfig = {
            instrumentationKey: () => undefined,
            accountId: () => null,
            sessionRenewalMs: () => 30 * 60 * 1000,
            samplingPercentage: () => 100,
            sessionExpirationMs: () => 24 * 60 * 60 * 1000,
            cookieDomain: () => null,
            sdkExtension: () => null,
            isBrowserLinkTrackingEnabled: () => false,
            appId: () => null,
            namePrefix: () => undefined,
            idLength: () => 22
        }
        return defaultConfig;
    }
    public context: TelemetryContext;

    public priority = 110;
    public identifier = PropertiesPluginIdentifier;

    constructor() {
        super();

        let _breezeChannel: IPlugin; // optional. If exists, grab appId from it
        let _extensionConfig: ITelemetryConfig;

        dynamicProto(PropertiesPlugin, this, (_self, _base) => {

            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => {
                _base.initialize(config, core, extensions, pluginChain);
                let ctx = _self._getTelCtx();
                let identifier = _self.identifier;
                const defaultConfig: ITelemetryConfig = PropertiesPlugin.getDefaultConfig();
                _extensionConfig = _extensionConfig || PropertiesPlugin.getDefaultConfig();
                objForEachKey(defaultConfig, (field, value) => {
                    _extensionConfig[field] = () => ctx.getConfig(identifier, field, value());
                });
    
                _self.context = new TelemetryContext(core, _extensionConfig);
                _breezeChannel = Util.getExtension(extensions, BreezeChannelIdentifier);
                _self.context.appId = () => _breezeChannel ? _breezeChannel["_appId"] : null;
            };
    
            /**
             * Add Part A fields to the event
             * @param event The event that needs to be processed
             */
            _self.processTelemetry = (event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                if (CoreUtils.isNullOrUndefined(event)) {
                    // TODO(barustum): throw an internal event once we have support for internal logging
                } else {
                    itemCtx = _self._getTelCtx(itemCtx);
                    // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                    if (event.name === PageView.envelopeType) {
                        itemCtx.diagLog().resetInternalMessageCount();
                    }
    
                    if (_self.context.session) {
                        // If customer did not provide custom session id update the session manager
                        if (typeof _self.context.session.id !== "string") {
                            _self.context.sessionManager.update();
                        }
                    }
    
                    _processTelemetryInternal(event, itemCtx);
    
                    if (_self.context && _self.context.user && _self.context.user.isNewUser) {
                        _self.context.user.isNewUser = false;
                        const message = new _InternalLogMessage(_InternalMessageId.SendBrowserInfoOnUserInit, ((getNavigator()||{} as any).userAgent||""));
                        itemCtx.diagLog().logInternalMessage(LoggingSeverity.CRITICAL, message);
                    }
    
                    _self.processNext(event, itemCtx);
                }
            };
    
            function _processTelemetryInternal(event: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
                // set part A  fields
                if (!event.tags) {
                    event.tags = [];
                }
    
                if (!event.ext) {
                    event.ext = {};
                }
    
                let ext = event.ext;
                ext[Extensions.DeviceExt] = ext[Extensions.DeviceExt] || {};
                ext[Extensions.WebExt] = ext[Extensions.WebExt] || {};
                ext[Extensions.UserExt] = ext[Extensions.UserExt] || {};
                ext[Extensions.OSExt] = ext[Extensions.OSExt] || {};
                ext[Extensions.AppExt] = ext[Extensions.AppExt] || {};
                ext[Extensions.TraceExt] = ext[Extensions.TraceExt] || {};
    
                let context = _self.context;
                context.applySessionContext(event, itemCtx);
                context.applyApplicationContext(event, itemCtx);
                context.applyDeviceContext(event, itemCtx);
                context.applyOperationContext(event, itemCtx);
                context.applyUserContext(event, itemCtx);
                context.applyOperatingSystemContxt(event, itemCtx);
                context.applyWebContext(event, itemCtx);
    
                context.applyLocationContext(event, itemCtx); // legacy tags
                context.applyInternalContext(event, itemCtx); // legacy tags
                context.cleanUp(event, itemCtx);
            }
        });
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add Part A fields to the event
     * @param event The event that needs to be processed
     */
    public processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
       // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}