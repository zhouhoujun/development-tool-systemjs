# packaged development-tool-systemjs

This repo is for distribution on `npm`. The source for this module is in the
[main repo](https://github.com/zhouhoujun/development-tool-systemjs/src/mastert).
Please file issues and pull requests against that repo.
This package use to bundle jspm project by custom group.

# note

* `if you use jspm package manager, do not setting jspm baseURL!!!`

## Install

You can install this package either with `npm`

### npm

```shell

npm install development-tool-systemjs

```

## group bundles， demo for angular 2

test, zip bundle, and publish docker service.

```ts
import * as gulp from 'gulp';
import * as _ from 'lodash';
import { Pipe, Operation, IMap, IDynamicTaskOption } from 'development-core';
import { Development, ITaskOption } from 'development-tool';
import { IBundlesConfig, IBundleGroup } from 'development-tool-systemjs';
import { IWebTaskOption } from 'development-tool-web';
import * as path from 'path';

const tslint = require('gulp-tslint');
const cache = require('gulp-cached');
const rename = require('gulp-rename');
const jeditor = require('gulp-json-editor');
const through = require('through2');
const JSONC = require('json-comments');
const replace = require('gulp-replace');
// const babel = require('gulp-babel');
const del = require('del');
const htmlMin = require('gulp-minify-html');
const uglify = require('gulp-uglify');
// const inlineNg2Template = require('gulp-inline-ng2-template');
const sass = require('gulp-sass');

interface Packages {
    name: string;
    items?: string[];
    pattern?: string;
}

Development.create(gulp, __dirname, [
    <ITaskOption>{
        name: 'serv',
        src: 'server',
        dist: 'dist',
        testSrc: 'server/test/**/*.spec.ts',
        cleanSrc: ['dist/views', 'dist/*.*'],
        asserts: {
            css: '', less: '',
            jpeg: Operation.default, jpg: Operation.default, png: Operation.default, svg: Operation.default,
            ttf: Operation.default, woff: Operation.default, eot: Operation.default, xlsx: Operation.default,
            pdf: Operation.default,
            template: {
                src: ['server/views/**/*.html', 'server/views/**/*.ejs'],
                dist: 'dist/views'
            },
            copys: { src: ['package.json', 'start.bat'], oper: Operation.deploy },
            pm2: {
                src: 'pm2.json',
                oper: Operation.deploy,
                loader: [{
                    pipes: [(ctx) => replace('"script": "dist/index.js",', '"script": "index.js",')]
                }]

            }
        },
        tasks: [
            {
                src: 'dist/config/*',
                dist: 'dist/config',
                loader: <IDynamicTaskOption>{
                    name: 'server-config',
                    oper: Operation.release | Operation.deploy,
                    pipes: [(ctx) => replace('./development', './production')]
                }
            }
        ],
        loader: 'development-tool-node'
    },
    <IWebTaskOption>{
        name: 'web',
        src: 'client',
        dist: 'dist/development',
        releaseDist: 'dist/production',
        cleanSrc: (ctx) => {
            if (ctx.env.release || ctx.env.deploy) {
                let srcs: string[] = [];
                if (ctx.env.gb) {
                    srcs.push('dist/production/!(*.js)');
                } else {
                    srcs.push('dist/production');
                }
                if (ctx.oper & Operation.deploy) {
                    srcs.push('dist/development');
                }
                return srcs;
            } else {
                return 'dist/development';
            }
        },
        browsersync: {
            files: ['node_modules/**/*']
        },
        karma: {
            jspm: {
                systemjs: ['systemjs/dist/system-polyfills', 'systemjs/dist/system'],
                config: ['systemjs.config.js'],
                resource: 'assets'
            }
        },
        loader: 'development-tool-web',
        assertsOrder: total => 1 / total,
        asserts: {
            css: '', // less: '',
            jpeg: Operation.default, jpg: Operation.default, png: Operation.default, svg: Operation.default,
            ttf: Operation.default, woff: Operation.default, eot: Operation.default, xlsx: Operation.default,
            pdf: Operation.default,
            bootstrapfonts: {
                src: 'node_modules/bootstrap-sass/assets/fonts/**',
                dist: ctx => ctx.parent.toDistPath('./fonts')
            },
            scss: {
                src: 'client/**/*.scss',
                loader: [{
                    oper: Operation.default | Operation.autoWatch,
                    pipes: [
                        (ctx) => sass({
                            outputStyle: 'compressed',
                            includePaths: [
                                ctx.toDistPath('asserts'),
                                ctx.toRootPath('node_modules/bootstrap-sass/assets/stylesheets')
                            ]
                        }).on('error', sass.logError)
                    ]
                }]
            },
            json: {
                src: ['client/**/*.json', '!client/data/**/*.json', '!client**/jsconfig.json', '!client/config*.json'],
                loader: [
                    {
                        oper: Operation.default | Operation.autoWatch,
                        pipes: [
                            () => cache('config_json'),
                            () => through.obj(function (file, encoding, callback) {
                                if (file.isNull()) {
                                    return callback(null, file);
                                }

                                if (file.isStream()) {
                                    return callback('doesn\'t support Streams');
                                }

                                var min = JSONC.minify(file.contents.toString('utf8'));
                                file.contents = new Buffer(min);
                                this.push(file);
                                callback();
                            })
                        ]
                    }
                ]
            },
            config: {
                src(ctx) {
                    if (ctx.env.config) {
                        return `client/config-${ctx.env.config}.json`;
                    } else {
                        return 'client/config.json';
                    }
                },
                loader: [
                    {
                        oper: Operation.default | Operation.autoWatch,
                        pipes: [
                            () => cache('config_json'),
                            () => through.obj(function (file, encoding, callback) {
                                if (file.isNull()) {
                                    return callback(null, file);
                                }

                                if (file.isStream()) {
                                    return callback('doesn\'t support Streams');
                                }

                                var min = JSONC.minify(file.contents.toString('utf8'));
                                file.contents = new Buffer(min);
                                this.push(file);
                                callback();
                            }),
                            () => rename('config.json'),
                            () => jeditor({})
                        ]
                    }
                ]
            },
            html: ['client/*.html'],
            template: {
                src: ['client/**/*.template.html', 'client/**/*.component.html', 'client/**/*.tpl.html'],
                loader: [{
                    oper: Operation.default | Operation.autoWatch,
                    pipes: [
                        () => cache('component_template_cache'),
                        () => htmlMin({
                            empty: true,
                            spare: true,
                            quotes: true,
                            dom: {
                                lowerCaseAttributeNames: false,
                                lowerCaseTags: false
                            }
                        })]
                }]
            },
            ts: {
                src: ['client/**/*.ts', 'test/**/*.ts'],
                loader: {
                    module: 'development-assert-ts',
                    pipes: <Pipe[]>[
                        { toTransform: () => tslint(), order: total => 2 / total }
                    ]
                }
            },
            tsx: {
                loader: 'development-assert-ts'
            },
            js: 'client/**/*.js'
        },
        subTaskOrder: total => 3 / total,
        tasks: [
            <IBundlesConfig>{
                index: ['client/index.html'],
                bundleBaseDir: 'dist/production',
                src: 'dist/production/**/*.js',
                dist: 'dist/production',
                systemConfig: 'dist/production/systemjs.config.js',
                mainfile: 'boot.js',
                loader: 'development-tool-systemjs',
                bust: (ctx) => <string>ctx.getPackage()['version'],
                baseURL: (ctx) => {
                    let val = ctx.env['aspnet'];
                    if (_.isString(val)) {
                        return val;
                    } else if (val) {
                        return 'app/dist/production';
                    }
                    return './';
                },
                includePackageFiles: [
                    'node_modules/systemjs/dist/system-polyfills.js',
                    'node_modules/systemjs/dist/system.js'
                ],
                dependencies: (ctx) => {
                    let config = require(ctx.toDistPath('systemjs.config.js')).default;
                    return _.keys(config.map);
                },
                bundles: (ctx) => {
                    let routes: Packages[] = [
                        { name: 'core', pattern: 'app/core/**/!(routing).module.js' },
                        { name: 'shared', pattern: 'app/shared/**/!(routing).module.js' },
                        { name: 'dashboard', pattern: 'app/dashboard/**/!(routing).module.js' },
                        { name: 'app', items: ['app/app.module.js', 'app/boot.js'] }
                    ];
                    let dist = ctx.parent.getDist();
                    return Promise.all(_.map(routes, r => {
                        if (r.items) {
                            return {
                                name: r.name,
                                items: r.items
                            }
                        } else {
                            return ctx.fileFilter(path.join(dist, r.pattern), null, n => ctx.toUrl(dist, n))
                                .then(items => {
                                    return {
                                        name: r.name,
                                        items: items
                                    }
                                });
                        }
                    })).then(its => {
                        let bundle: IMap<IBundleGroup> = {};
                        its.forEach(it => {
                            let exclude = ['core', 'shared'];
                            if (it.name === 'core') {
                                exclude = [];
                            } else if (it.name === 'shared') {
                                exclude = ['core']
                            }
                            bundle[it.name] = {
                                combine: true,
                                exclude: exclude,
                                items: it.items
                            }
                        });
                        return bundle;
                    });
                },
                depsExclude: ['angular-i18n', 'jquery', 'rxjs', 'app', 'ag-grid', '@angularclass', 'plugin-babel', 'systemjs-babel-build', 'ts', 'typescript'],
                bundleDeps: (ctx, deps) => {
                    let libs = ['css', 'json', 'lodash', 'text', 'zone.js', 'reflect-metadata', 'moment', 'core-js-shim', 'url'];
                    let angularlibs = _.filter(deps, it => {
                        return it.indexOf('@angular') === 0 && it.indexOf('@angularclass') < 0;
                    });

                    let ngtools = ['angular2-grid', 'highcharts', 'angular2-highcharts', 'ng2-validation', 'ng2-file-upload', 'ng2-translate', 'ng2-bootstrap'];

                    return {
                        libs: {
                            combine: true,
                            items: libs
                        },
                        angularlibs: {
                            combine: true,
                            items: angularlibs,
                            exclude: ['libs']
                        },
                        tools: {
                            combine: true,
                            items: _.filter(deps, function (d) {
                                return skslibs.indexOf(d) < 0 && libs.indexOf(d) < 0 && angularlibs.indexOf(d) < 0 && ngtools.indexOf(d) < 0;
                            }),
                            exclude: ['libs', 'angularlibs']
                        },
                        ngtools: {
                            combine: true,
                            items: ngtools,
                            exclude: ['libs', 'angularlibs', 'tools']
                        }
                    };
                },
                pipes: [
                    () => uglify()
                ]
                , mainfilePipes: [
                    () => uglify()
                ]
            },
            {
                loader: <IDynamicTaskOption[]>[
                    {
                        name: 'clean-production',
                        oper: Operation.release,
                        task: (ctx) => del(ctx.toDistSrc(['app', 'common', 'jspm-config', 'assets/**/*.less']))
                    },
                    {
                        name: 'copy-index',
                        oper: Operation.default,
                        src: ctx => ctx.parent.toDistPath('./index.html'),
                        dist: 'dist/views',
                        pipes: []
                    }
                ]
            }
        ]
    },
    <ITaskOption>{
        name: 'docker',
        oper: Operation.deploy,
        tasks: [
            {
                src: 'dist/**',
                loader: [
                    {
                        name: 'clean-development',
                        task: (ctx) => del('dist/development')
                    }
                ]
            },
            {
                name: 'deploy-server',
                src: 'docker-compose.yml',
                dist: './publish',
                exportImage: true,
                images: ['test_webapp', 'test_nginx'],
                service: 'www.yourserver.com',
                user: 'test',
                psw: 'test',
                loader: 'development-tool-docker'
            }]
    }
]);

```


## Documentation

Documentation is available on the
[development-tool-systemjs docs site](https://github.com/zhouhoujun/development-tool-systemjs).

## License

MIT © [Houjun](https://github.com/zhouhoujun/)