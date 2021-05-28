import React,{useEffect, useState} from 'react';
import {CDN_PROVIDER,ENDPOINTS,CDN_ALIAS,validteCdnRlt} from "../functions/helper"

const CheckCDN =()=> {
    const [rlt,setrlt] = useState({});

    useEffect(()=>{
        Promise.all(CDN_ALIAS.map(key =>
         fetch(ENDPOINTS[key])
         .then((response)=>{Promise.resolve(response); return response.status})
         .catch((err)=>{Promise.reject(err); return err.toString()})
        )).then((res)=> {
            const resObj = Object.assign({},res)
            setrlt(resObj)}); 
     },[]);

    return (
        <div className="check-cdn-wrapper">
            <div className="check-cdn-time">Last testing time:  {Date().toLocaleString()}</div>
            <div className="all-endpoint-status">
                CDN Check: 
                {rlt == null? " loading":validteCdnRlt(rlt)? " success":" error"}</div>
            {Object.keys(rlt).map((val)=> {
                let provider = CDN_ALIAS[val]
                return <li className={provider} key ={provider}>{CDN_PROVIDER[provider]} : {rlt[val]}</li>})}
        </div>
    )
}

export default CheckCDN;