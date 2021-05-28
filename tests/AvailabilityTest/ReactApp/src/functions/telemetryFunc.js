export default function testTelemetry (appInsights) {
    appInsights.trackEvent({name: 'ai-test-trackevent'});
    appInsights.trackPageView({name: 'ai-test-trackPageView'});
    appInsights.trackPageViewPerformance({name : 'ai-test-trackPageViewPerformance'});
    appInsights.trackException({exception: new Error('ai-test-trackException')});
    appInsights.trackTrace({message: 'ai-test-trackTrace'});
    appInsights.trackMetric({name: 'ai-test-trackMetric', average: 42});
    fetch('https://api.npms.io/v2/search?q=react')
    .then(response => response.json())
    .finally(appInsights.trackDependencyData({name:'https://api.npms.io/v2/search?q=react', absoluteUrl: 'https://api.npms.io/v2/search?q=react', responseCode: 200, method: 'GET'}))
    appInsights.flush();
}

