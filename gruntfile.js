module.exports = function (grunt) {

    function addTsConfigBuilds(modules) {
        var buildCmds = {
            ts: {
                options: {
                    comments: true
                }            
            },
            tslint: {
            }
        };
    
        for (var key in modules) {
            if (modules.hasOwnProperty(key)) {
                var modulePath = modules[key];

                if (grunt.file.exists(modulePath + '/tsconfig.json')) {
                    buildCmds.ts[key] = {
                        'tsconfig': modulePath + "/tsconfig.json",
                    };
                } else {
                    console.error("Missing tsconfig.json for " + key + " - " + modulePath + "/tsconfig.json");
                }

                buildCmds.tslint[key + '-lint-fix'] = {
                    options: {
                        configuration: './tslint.json',
                        project: modulePath + '/tsconfig.json',
                        rulesDirectory: 'node_modules/tslint-microsoft-contrib',
                        force: true,
                        fix: true
                    },
                    files: {
                        src: [
                            modulePath +'/src/**/*.ts'
                        ]
                    }                    
                };

                buildCmds.tslint[key + '-lint'] = {
                    options: {
                        configuration: './tslint.json',
                        project: modulePath + '/tsconfig.json',
                        rulesDirectory: 'node_modules/tslint-microsoft-contrib',
                        force: false,
                        fix: false
                    },
                    files: {
                        src: [
                            modulePath +'/src/**/*.ts'
                        ]
                    }                    
                };
            }
        }

        return buildCmds;
    }

    function addTsConfig(buildCmds, modules) {
        for (var key in modules) {
            if (modules.hasOwnProperty(key) && !buildCmds.ts.hasOwnProperty(key)) {
                buildCmds.ts[key] = modules[key];
            }
        }

        return buildCmds;
    }

    function tsBuildActions(name, replaceName) {
        var actions = [
            "tslint:" + name + "-lint-fix",
            "ts:" + name
        ];

        // actions.push("tslint:" + name + "-lint");

        return actions;
    }    

    var buildCmds = addTsConfigBuilds({
        // Channels
        'aichannel':    './channels/applicationinsights-channel-js',

        // Extensions
        'appinsights':      './extensions/applicationinsights-analytics-js',
        'properties':       './extensions/applicationinsights-properties-js',
        'reactnative':      './extensions/applicationinsights-react-native',
        'debugplugin':      './extensions/applicationinsights-debugplugin-js',
        'deps':             './extensions/applicationinsights-dependencies-js',
        'clickanalytics':   './extensions/applicationinsights-clickanalytics-js',

        // Skus
        'aisku':        './AISKU',
        'aiskulite':    './AISKULight',

        // Shared
        'core':         './shared/AppInsightsCore',
        'common':       './shared/AppInsightsCommon',

        // Tools
        'rollupes3':    './tools/rollup-es3',
        'shims':        './tools/shims',
        'tst-framework':'./common/Tests/Framework'
    });

    // Add Test Configs
    buildCmds = addTsConfig(buildCmds, {
        default: {
            tsconfig: './tsconfig.json',
            src: [
                'legacy/JavaScript/JavaScriptSDK.Interfaces/*.ts',
                'legacy/JavaScript/JavaScriptSDK/*.ts',
            ],
            out: 'legacy/bundle/ai.js',
        },
        // coretest: {
        //     tsconfig: './shared/AppInsightsCore/Tests/tsconfig.json',
        //     src: [
        //         './shared/AppInsightsCore/Tests/Selenium/ApplicationInsightsCore.Tests.ts',
        //         './shared/AppInsightsCore/Tests/Selenium/aitests.ts'
        //     ],
        //     out: 'shared/AppInsightsCore/Tests/Selenium/aicore.tests.js'
        // },
        commontest: {
            tsconfig: './shared/AppInsightsCommon/Tests/tsconfig.json',
            src: [
                './shared/AppInsightsCommon/Tests/Selenium/appinsights-common.tests.ts',
            ],
            out: 'shared/AppInsightsCommon/Tests/Selenium/aicommon.tests.js'
        },
        appinsightstests: {
            tsconfig: './extensions/applicationinsights-analytics-js/Tests/tsconfig.json',
            src: [
                './extensions/applicationinsights-analytics-js/Tests/Selenium/*.ts',
                './extensions/applicationinsights-analytics-js/Tests/*.ts'
            ],
            out: 'extensions/applicationinsights-analytics-js/Tests/Selenium/appinsights-analytics.tests.js'
        },
        aiskutests: {
            tsconfig: './AISKU/Tests/tsconfig.json',
            src: [
                'AISKU/Tests/Selenium/*.ts',
                'AISKU/Tests/*.ts'
            ],
            out: 'AISKU/Tests/Selenium/appinsights-sdk.tests.js'
        },
        propertiestests: {
            tsconfig: './extensions/applicationinsights-properties-js/Tests/tsconfig.json',
            src: './extensions/applicationinsights-properties-js/Tests/**/*.ts',
            out: './extensions/applicationinsights-properties-js/Tests/Selenium/properties.tests.js'
        },
        clickanalyticstests: {
            tsconfig: './extensions/applicationinsights-clickanalytics-js/Tests/tsconfig.json',
            src: [
                './extensions/applicationinsights-clickanalytics-js/Tests/Selenium/*.ts',
                './extensions/applicationinsights-clickanalytics-js/Tests/*.ts'
            ],
            out: 'extensions/applicationinsights-clickanalytics-js/Tests/Selenium/appinsights-clickanalytics.tests.js'
        },
        reactnativetests: {
            tsconfig: './extensions/applicationinsights-react-native/Tests/tsconfig.json',
            src: './extensions/applicationinsights-react-native/Tests/**/*.ts',
            out: './extensions/applicationinsights-react-native/Tests/Selenium/reactnativeplugin.tests.js'
        },
        depstest: {
            tsconfig: './extensions/applicationinsights-dependencies-js/Tests/tsconfig.json',
            src: [
                './extensions/applicationinsights-dependencies-js/Tests/Selenium/*.ts',
                './extensions/applicationinsights-dependencies-js/Tests/TestsFramework/*.ts'
            ],
            out: './extensions/applicationinsights-dependencies-js/Tests/Selenium/dependencies.tests.js'
        },
        aichanneltest: {
            tsconfig: './channels/applicationinsights-channel-js/Tests/tsconfig.json',
            src: [
                './channels/applicationinsights-channel-js/Tests/Selenium/*.ts',
                './channels/applicationinsights-channel-js/Tests/*.ts',
            ],
            out: './channels/applicationinsights-channel-js/Tests/Selenium/aichannel.tests.js'
        },
        rollupes3test: {
            tsconfig: './tools/rollup-es3/Tests/tsconfig.json',
            src: [
                './tools/rollup-es3/Tests/Selenium/Es3RollupTests.ts'
            ],
            out: './tools/rollup-es3/Tests/Selenium/es3rolluptests.js'
        },
        shimstest: {
            tsconfig: './tools/shims/Tests/tsconfig.json',
            src: [
                './tools/shims/src/*.ts',
                './tools/shims/Tests/**/*.ts'
            ],
            out: './tools/shims/Tests/Selenium/shimstests.js'
        }
    });

    // Add Legacy Configs
    buildCmds = addTsConfig(buildCmds, {
        module: {
            // Use a different tsconfig for building module in order to not generate a declaration file for module, while keeping declaration for other modules
            tsconfig: './tsconfigmodule.json',
            src: [
                'legacy/JavaScript/JavaScriptSDK.Interfaces/*.ts',
                'legacy/JavaScript/JavaScriptSDK.Module/*.ts',
            ],
            out: 'legacy/bundle/ai.module.js'
        },
        types: {
            tsconfig: './tsconfig.json',
            src: [
                'legacy/JavaScript/JavaScriptSDK.Tests/DefinitionTypes/*.ts'
            ],
            out: 'legacy/bundle/test/ai.types.js'
        },
        test: {
            tsconfig: './tsconfig.json',
            src: [
                'legacy/JavaScript/JavaScriptSDK.Tests/Selenium/*.ts'
            ],
            out: 'legacy/JavaScript/JavaScriptSDK.Tests/Selenium/ai.tests.js'
        },
        testSchema: {
            tsconfig: './tsconfig.json',
            src: [
                'legacy/JavaScript/JavaScriptSDK.Tests/Contracts/Generated/*.ts'
            ],
            out: 'legacy/bundle/test/ai.schema.tests.js'
        },
        testE2E: {
            tsconfig: './tsconfig.json',
            files: [
                {
                    src: 'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/DisableTelemetry.tests.ts',
                    dest: 'legacy/bundle/test/e2e/DisableTelemetry.tests.js'
                },
                {
                    src: 'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/PublicApi.tests.ts',
                    dest: 'legacy/bundle/test/e2e/PublicApiTests.tests.js'
                },
                {
                    src: 'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/SanitizerE2E.tests.ts',
                    dest: 'legacy/bundle/test/e2e/SanitizerE2E.tests.js'
                },
                {
                    src: 'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/SenderE2E.tests.ts',
                    dest: 'legacy/bundle/test/e2e/SenderE2E.tests.js'
                },
                {
                    src: 'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/Snippet.tests.ts',
                    dest: 'legacy/bundle/test/e2e/Snippet.tests.js'
                },
                {
                    src: 'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/ValidateApi.tests.ts',
                    dest: 'legacy/bundle/test/e2e/ValidateApi.tests.js'
                }
            ],
            outDir: 'legacy/bundle/test/e2e'
        }
    });

    buildCmds = Object.assign({}, 
        buildCmds,
        {
        uglify: {
            ai: {
                files: {
                    'legacy/bundle/ai.0.js': ['legacy/bundle/ai.js'],
                },
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                    sourceMapIn: 'legacy/bundle/ai.js.map',
                    compress: {
                        ie8: true
                    },
                    mangle: {
                        ie8: true
                    }
                },
            },
            snippet: {
                files: {
                    'legacy/bundle/snippet/snippet.min.js': ['legacy/JavaScript/JavaScriptSDK/snippet.js']
                }
            },
            snippetvNext: {
                files: {
                    'AISKU/snippet/snippet.min.js': ['AISKU/snippet/snippet.js']
                },
                options: {
                    sourceMap: false,
                    ie8: true,
                    compress: {
                      passes:3,
                      unsafe: true,
                    },
                    output: {
                      webkit:true
                    }
                }
            }
        },
        qunit: {
            all: {
                options: {
                    urls: [
                        'legacy/JavaScript/JavaScriptSDK.Tests/Selenium/Tests.html',
                        'legacy/JavaScript/JavaScriptSDK.Tests/Contracts/Schema.tests.htm',
                        'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.DisableTelemetry.tests.htm',
                        'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.PublicApi.tests.htm',
                        'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.SanitizerE2E.tests.htm',
                        'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.Sender.tests.htm',
                        'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.snippetTests.htm',
                        'legacy/JavaScript/JavaScriptSDK.Tests/E2ETests/E2E.ValidateApi.tests.htm'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            core: {
                options: {
                    urls: [
                        './shared/AppInsightsCore/Tests/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            common: {
                options: {
                    urls: [
                        './shared/AppInsightsCommon/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            aitests: {
                options: {
                    urls: [
                        './extensions/applicationinsights-analytics-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: true,
                    summaryOnly: false,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            deps: {
                options: {
                    urls: [
                        './extensions/applicationinsights-dependencies-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: true,
                    summaryOnly: false,
                    '--web-security': 'false'
                }
            },
            properties: {
                options: {
                    urls: [
                        './extensions/applicationinsights-properties-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 5 * 60 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            },
            reactnative: {
                options: {
                    urls: [
                        './extensions/applicationinsights-react-native/Tests/Selenium/Tests.html'
                    ],
                    timeout: 5 * 60 * 1000, // 5 min
                    console: true,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            },
            aisku: {
                options: {
                    urls: [
                        './AISKU/Tests/Selenium/Tests.html'
                    ],
                    timeout: 5 * 60 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            },
            aichannel: {
                options: {
                    urls: [
                        './channels/applicationinsights-channel-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false'
                }
            },
            rollupes3: {
                options: {
                    urls: [
                        './tools/rollup-es3/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            shims: {
                options: {
                    urls: [
                        './tools/shims/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: false,
                    summaryOnly: true,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
            clickanalytics: {
                options: {
                    urls: [
                        './extensions/applicationinsights-clickanalytics-js/Tests/Selenium/Tests.html'
                    ],
                    timeout: 300 * 1000, // 5 min
                    console: true,
                    summaryOnly: false,
                    '--web-security': 'false' // we need this to allow CORS requests in PhantomJS
                }
            },
        }
    });

    
    grunt.initConfig(buildCmds);

    grunt.event.on('qunit.testStart', function (name) {
        grunt.log.ok('Running test: ' + name);
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-run');
    grunt.registerTask("default", ["ts:rollupes3", "ts:rollupes3test", "qunit:rollupes3", "ts:shims", "ts:shimstest", "qunit:shims", "ts:default", "uglify:ai", "uglify:snippet"]);
    grunt.registerTask("core", tsBuildActions("core"));
    grunt.registerTask("common", tsBuildActions("common"));
    grunt.registerTask("module", ["ts:module"]);
    grunt.registerTask("ai", tsBuildActions("appinsights"));
    grunt.registerTask("aitests", ["ts:appinsights", "ts:appinsightstests", "qunit:aitests"]);
    grunt.registerTask("aisku", tsBuildActions("aisku"));
    grunt.registerTask("aiskulite", tsBuildActions("aiskulite"));
    grunt.registerTask("snippetvnext", ["uglify:snippetvNext"]);
    grunt.registerTask("aiskutests", ["ts:aisku", "ts:aiskutests", "qunit:aisku"]);
    grunt.registerTask("test", ["ts:default", "ts:test", "ts:testSchema", "ts:testE2E", "qunit:all"]);
    grunt.registerTask("test1ds", ["coretest", "common", "propertiestests", "depstest", "aitests", "aiskutests", "reactnativetests", "reacttests"]);
    grunt.registerTask("coretest", ["ts:core", "qunit:core"]);
    grunt.registerTask("commontest", ["ts:common", "ts:commontest", "qunit:common"]);
    grunt.registerTask("properties", tsBuildActions("properties"));
    grunt.registerTask("propertiestests", ["ts:properties", "ts:propertiestests", "qunit:properties"]);
    grunt.registerTask("reactnative", tsBuildActions("reactnative"));
    grunt.registerTask("reactnativetests", ["qunit:reactnative"]);
    grunt.registerTask("deps", tsBuildActions("deps"));
    grunt.registerTask("depstest", ["ts:deps", "ts:depstest", "qunit:deps"]);
    grunt.registerTask("debugplugin",tsBuildActions("debugplugin"));
    grunt.registerTask("aichannel", tsBuildActions("aichannel"));
    grunt.registerTask("aichanneltest", ["ts:aichannel", "ts:aichanneltest", "qunit:aichannel"]);
    grunt.registerTask("rollupes3", ["ts:rollupes3", "ts:rollupes3test", "qunit:rollupes3"]);
    grunt.registerTask("rollupes3test", ["ts:rollupes3", "ts:rollupes3test", "qunit:rollupes3"]);
    grunt.registerTask("shims", ["ts:shims", "ts:shimstest", "qunit:shims"]);
    grunt.registerTask("shimstest", ["ts:shims", "ts:shimstest", "qunit:shims"]);
    grunt.registerTask("clickanalytics", ["ts:clickanalytics"]);
    grunt.registerTask("clickanalyticstests", ["ts:clickanalytics", "ts:clickanalyticstests", "qunit:clickanalytics"]);
    grunt.registerTask("tst-framework", ["ts:tst-framework"]);
};
