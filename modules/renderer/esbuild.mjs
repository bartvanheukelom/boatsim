#!/usr/bin/env -S npx node

import * as esbuild from "esbuild";
import yargs from "yargs";

// import path from "path";



const args = yargs(process.argv)
    .option("indir", {
        type: "string",
    })
    .option("rootdir", {
        type: "string",
    })
    .option("outfile", {
        type: "string",
    })
    .parseSync();

// const root = path.resolve(".")
const jsRoot = args.indir;

await esbuild.build({
    entryPoints: [`${jsRoot}/src/renderer/index.js`],
    outfile: args.outfile,
    bundle: true,
    // external: [
    //     "electron",
    // ],
    plugins: [
        {
            name: 'resolver',
            setup(build) {
                // EUI imports must be specified from @elastic/eui/src, but the actual compiled ESM JS files are in .../es,
                // so make a custom resolver for that. TODO surely this is overkill and all we need is the right config param or plugin
                build.onResolve({ filter: /^@elastic\/eui\/src\// }, async (args) => {
                    const result = await build.resolve(args.path.replace("@elastic/eui/src", "@elastic/eui/lib"), { // TODO WHYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY did i have to make this LIB to prevent both versions being imported, when the same config works fine in altin admin client????????? ALSO JUST FIX THIS *&(#@$*U@#(*$*$#^($# SITUATION WITH THE IMPORTS BEING THAT WAY
                        // importer: args.importer,
                        // namespace: args.namespace,
                        resolveDir: args.resolveDir,
                        // kind: args.kind,
                        // pluginData: args.pluginData,
                    });
                    // console.log(`esbuild: Resolved '${args.path}' to '${result.path}'`);
                    // https://esbuild.github.io/plugins/#on-resolve-results
                    // return result;

                    // const result = await build.resolve(args.path.replace("@elastic/eui/src", "@elastic/eui/es"), { resolveDir: args.resolveDir })
                    if (result.errors.length > 0) {
                        return { errors: result.errors }
                    }
                    return { path: result.path };
                });

                // TODO d'oh, this doesn't work for main of course. disabled here for now because untested
                // TODO for main, check out https://github.com/soldair/node-module-resolution
                // // if a file in tsRoot tries to import a file at `${rootdir}/typisch/src/X`,
                // // translate it to `@typisch/X`. X can contain slashes.
                // build.onResolve({ filter: /typisch\/src\// }, async (args) => {
                //     // check that importer is in jsRoot
                //     if (args.importer.startsWith(jsRoot)) {
                //         console.log(`esbuild: Resolving '${args.path}' from '${args.importer}'`);
                //         // find absolute path the import would resolve to
                //         const result = await build.resolve(args.path, { resolveDir: args.resolveDir });
                //         console.log(`esbuild: Resolved '${args.path}' to '${JSON.stringify(result)}'`);
                //         // TODO rest
                //     }
                // });
            },
        },
        // {
        //     name: 'resolveLogger',
        //     setup(build) {
        //         build.onResolve({ filter: /.*/ }, async (args) => {
        //             console.log(`esbuild: onResolve(${JSON.stringify(args)})`);
        //             const result = await build.resolve(args.path, {
        //                 importer: args.importer,
        //                 namespace: args.namespace,
        //                 resolveDir: args.resolveDir,
        //                 kind: args.kind,
        //                 pluginData: args.pluginData,
        //             });
        //             console.log(`esbuild: Resolved '${args.path}' to '${result.path}'`);
        //             return result;
        //         });
        //     }
        // }
    ]
});
