import '@microsoft/applicationinsights-shims';
import { ApplicationInsightsCoreTests } from "./ApplicationInsightsCore.Tests";
import { CookieManagerTests } from "./CookieManager.Tests";

export function runTests() {
    new ApplicationInsightsCoreTests().registerTests();
    new CookieManagerTests().registerTests();
}