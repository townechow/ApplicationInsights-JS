import React from 'react';

const List =(props)=> {
    return (
        <div className="test-tel-list">
            <div className="list-body">
            <li className="trackEvent">
                trackEvent detected: {props.res.includes("ai-test-trackevent")? "Yes":"No"}
            </li> 
            <li className="trackPageView">
                trackPageView detected: {props.res.includes("ai-test-trackPageView")? "Yes":"No"}
            </li>
            <li className="trackPageViewPerformance">
                trackPageViewPerformance detected: {props.res.includes("ai-test-trackPageViewPerformance")? "Yes":"No"}
            </li>
            <li className="trackException">
                trackException detected: {props.res.includes("ai-test-trackException")? "Yes":"No"}
            </li>
            <li className="trackTrace">
                trackTrace detected: {props.res.includes("ai-test-trackTrace")? "Yes":"No"}
            </li>
            <li className="trackMetric">
                trackMetric detected: {props.res.includes("ai-test-trackMetric")? "Yes":"No"}
            </li>
            <li className="trackDependencyData">
                trackDependencyData detected: {props.res.includes("https://api.npms.io/v2/search?q=react")? "Yes":"No"}
            </li>
            </div>
        </div>
    );
}
export default List;