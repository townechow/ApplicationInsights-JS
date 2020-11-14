// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const UglifyJs = require('uglify-js');

function isSourceMapEnabled(options) {
    if (options) {
        return options.sourceMap !== false && options.sourcemap !== false;
    }

    return false;
} 

function _doMinify(code, filename, options, chunkOptions) {
    var theCode = {};
    theCode[filename] = code;

    let theOptions = Object.assign({}, options);
    if (theOptions.hasOwnProperty("sourcemap")) {
        delete theOptions.sourcemap;
    }

    if (isSourceMapEnabled(options)) {
        theOptions.sourceMap = {
            filename: filename
        }
        if (filename) {
            theOptions.sourceMap.url = filename + ".map";
        }
    }

    var result = UglifyJs.minify(theCode, theOptions);

    if (result.error) {
        throw new Error(JSON.stringify(result.error));
    }

    var transform = {
        code: result.code
    };

    if (isSourceMapEnabled(options) && result.map) {
        transform.map = result.map;
    }

    return transform;
}

export function uglify(options = {}) {

    return {
        name: 'ms-rollup-uglify-js',
        renderChunk(code, chunk, chkOpt) {
            return _doMinify(code, chunk.filename, options, chkOpt);
        }
    }
}
