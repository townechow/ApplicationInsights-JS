export const getStatus=(response)=>{
    if (response.ok) {
        return Promise.resolve(response);
    } else {
        return Promise.reject(new Error(response.statusText));
    }
}

export const validteCdnRlt = (rlt) => {
    var result = true;
    Object.keys(rlt).forEach((val) => {
        if(!(rlt[val] >= 200 && rlt[val] < 400)) {result = false; return -1;}})
    return result;
}

export const CDN_ALIAS = [
    'js_m',
    'az', 
    'js_cdn_a', 
    'js_cdn_m',
    'js0_cdn_a',
    'js0_cdn_m',
    //'js1_cdn_a',
    'js1_cdn_m',
    'js2_cdn_a',
    'js2_cdn_m'
]

export const CDN_PROVIDER = {
    js_m: "js.monitor.azure.com",
    az: "az416426.vo.msecnd",
    js_cdn_a: "js.cdn.applicationinsights.io",
    js_cdn_m: "js.cdn.monitor.azure.com",
    js0_cdn_a: "js0.cdn.applicationinsights.io",
    js0_cdn_m: "js0.cdn.monitor.azure.com",
    //js1_cdn_a: "js1.cdn.applicationinsights.io",
    js1_cdn_m: "js1.cdn.monitor.azure.com",
    js2_cdn_a: "js2.cdn.applicationinsights.io",
    js2_cdn_m: "js2.cdn.monitor.azure.com"
}

export const ENDPOINTS = {
    js_m: 'https://js.monitor.azure.com/scripts/b/ai.2.min.js',
    az: 'https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js',
    js_cdn_a: 'https://js.cdn.applicationinsights.io/scripts/b/ai.2.min.js',
    js_cdn_m: 'https://js.cdn.monitor.azure.com/scripts/b/ai.2.min.js',
    js0_cdn_a: 'https://js0.cdn.applicationinsights.io/scripts/b/ai.2.min.js',
    js0_cdn_m: 'https://js0.cdn.monitor.azure.com/scripts/b/ai.2.min.js',
    //js1_cdn_a: 'https://js1.cdn.applicationinsights.io/scripts/b/ai.2.min.js',
    js1_cdn_m: 'https://js1.cdn.monitor.azure.com/scripts/b/ai.2.min.js',
    js2_cdn_a: 'https://js2.cdn.applicationinsights.io/scripts/b/ai.2.min.js',
    js2_cdn_m: 'https://js2.cdn.monitor.azure.com/scripts/b/ai.2.min.js'  
}
