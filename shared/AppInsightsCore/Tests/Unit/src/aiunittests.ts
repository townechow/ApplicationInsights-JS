import '@microsoft/applicationinsights-shims';
import { ApplicationInsightsCoreTests } from "./ApplicationInsightsCore.Tests";
import { CookieManagerTests } from "./CookieManager.Tests";
import { HelperFuncTests } from './HelperFunc.Tests';
import { AppInsightsCoreSizeCheck } from "./AppInsightsCoreSize.Tests";
import { W3cTraceParentTests } from "./W3cTraceParentTests";

export function runTests() {
    new ApplicationInsightsCoreTests().registerTests();
    new CookieManagerTests(false).registerTests();
    new CookieManagerTests(true).registerTests();
    new HelperFuncTests().registerTests();
    new AppInsightsCoreSizeCheck().registerTests();
    new W3cTraceParentTests().registerTests();
}
