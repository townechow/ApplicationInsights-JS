import './App.css';
import React, {useState, useEffect} from 'react';
import testTelemetry from "./functions/telemetryFunc";
import TelemetryList from "./component/TelemetryList";
import Loading from "./component/Loading";
import CheckCDN from "./component/CheckCDN";

function App() {
  const [appInsights,setappInsights] = useState()
  const [isInitialized,setisInitialized] = useState(false)
  const [sv,setsv] = useState()
  const [ver,setver] = useState()
  const [cookie,setcookie] = useState()
  const [isloading,setisloading] = useState(true)
  const [sentTime, setsentTime] = useState()
  const [sentBuffer,setsentBuffer] = useState("")
  const [istrigger,setistrigger] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      let insightOject =  window.appInsights;
      setappInsights(insightOject);
      insightOject.sv? setsv(insightOject.sv):setsv();
      insightOject.version? setver(insightOject.version):setver();
      insightOject.cookie? setcookie(insightOject.cookie):setcookie();
      if(insightOject.appInsights && insightOject.appInsights.core.isInitialized())
      {setisInitialized(true); setisloading(false);}
    }, 1000);
    return () => clearTimeout(timer);
  }, []); 
  
  useEffect(() =>{
    if (!isloading) {
      let notificationManager = appInsights.core.getNotifyMgr() || appInsights.core["_notificationManager"];
      notificationManager.addNotificationListener({ eventsSendRequest: (sendReason, isAsync) => {
            var sentData = sessionStorage.getItem("AI_sentBuffer");
            var newData = sentBuffer+sentData;
            setsentBuffer(newData);}  
    });}
  },[appInsights,sentBuffer,isloading]);

  useEffect(() => {
    if (!isloading) {
      testTelemetry(appInsights);
      setistrigger(true);
    }
    setsentTime(Date().toLocaleString());
  },[isloading,appInsights]);

  return (
    <div className="App">
      <div className="App-wrapper">
        <p className="testing-title">Application Insights Snippet Testing 1</p>
        <div className="App-body">
        <div className="loading-wrapper">
          <Loading isloading={isloading} isInitialized={isInitialized} sv={sv} ver={ver} cookie={cookie}/>
        </div>
        <div className="switch-list-wrapper">
          {!isloading? <div className="test-tel-title">Telemetry Testing</div>:""}
          {(!isloading && sentTime)? <div className="test-sent-time">Telemetry sent time: {sentTime}</div>:""}
          {istrigger? <TelemetryList res = {sentBuffer}/>:""}
        </div>
        <div className="cdn-status">
          {!isloading? <div className="cdn-title">CDN Status</div>:""}
          {!isloading? <CheckCDN />:""}
        </div>
       </div>
      </div>
   </div>);
}
export default App;