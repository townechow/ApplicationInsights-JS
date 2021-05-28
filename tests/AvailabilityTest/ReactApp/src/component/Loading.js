function Loading (props) {
    return (
    <div className="loading">
      <div className="loading-body">
      {props.isloading? <p className="isloading">Loading</p>:props.isInitialized?
        <p className="loaded">appInsights loaded successfully</p>:<p className="loaded-error">Error</p>}
      {props.sv? <p className="sv">snippetVer: {props.sv}</p>:""}
      {props.ver? <p className="ver">version: {props.ver}</p>:""}
      {props.cookie? <p className="cookie">cookie: {props.cookie}</p>:""}
      </div>
    </div>);   
}

export default Loading;