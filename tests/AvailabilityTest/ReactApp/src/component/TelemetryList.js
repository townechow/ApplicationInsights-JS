import React from 'react';

const TelemetryList =(props)=> {
    var result = props.res;
    var isEventTrack = result.includes("ai-test-trackevent");
    var isPageViewTrack = result.includes("ai-test-trackPageView")
    var isPageViewPerfTrack = result.includes("ai-test-trackPageViewPerformance");
    var isExceptionTrack = result.includes("ai-test-trackException");
    var isTraceTrack = result.includes("ai-test-trackTrace");
    var isMetricTrack = result.includes("ai-test-trackMetric");
    var isDependencyTrack = result.includes("https://api.npms.io/v2/search?q=react");
    var isAllTrack = isEventTrack && isPageViewTrack && isPageViewPerfTrack 
                    && isExceptionTrack && isTraceTrack && isMetricTrack && isDependencyTrack;

    return (
        <div className="test-tel-list">
            <div className="list-body">
            <div className="trackAll">
                All Telemetry Signals Tracked: {isAllTrack? "Yes":"No"}
            </div>
            <li className="trackEvent">
                trackEvent detected: {isEventTrack? "Yes":"No"}
            </li> 
            <li className="trackPageView">
                trackPageView detected: {isPageViewTrack? "Yes":"No"}
            </li>
            <li className="trackPageViewPerformance">
                trackPageViewPerformance detected: {isPageViewPerfTrack? "Yes":"No"}
            </li>
            <li className="trackException">
                trackException detected: {isExceptionTrack? "Yes":"No"}
            </li>
            <li className="trackTrace">
                trackTrace detected: {isTraceTrack? "Yes":"No"}
            </li>
            <li className="trackMetric">
                trackMetric detected: {isMetricTrack? "Yes":"No"}
            </li>
            <li className="trackDependencyData">
                trackDependencyData detected: {isDependencyTrack? "Yes":"No"}
            </li>
            </div>
        </div>
    );
}
export default TelemetryList;