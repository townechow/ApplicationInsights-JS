const puppeteer = require("puppeteer");

module.exports = async function (context, req) {
    const url = req.query.url || "http://localhost:3000/";
    var isloaded = "loading...";
    var isTelemetryTracked = "loading...";
    var isCdnTracked = "loading...";
    var error = "";
    try
    {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);
      await page.waitForTimeout(8000);
      let content = await page.evaluate(()=> document.body.outerHTML);
      isloaded = content.includes("appInsights loaded successfully");
      isTelemetryTracked = content.includes("All Telemetry Signals Tracked: Yes");
      isCdnTracked = content.includes("CDN Check: success");
      await browser.close();
    } catch(e) { error = e.message; }

    context.res = {
        body: {
          "isAppInsightsLoaded": isloaded,
          "isAllTelemetryTracked": isTelemetryTracked,
          "isAllCdnAvailable": isCdnTracked,
          "internalError": error
        },
        headers: {
            "content-type": "text/plain"
        }
    };
};


 


 