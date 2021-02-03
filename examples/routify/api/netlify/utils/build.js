/**
 * Creates a JSON and inlines it with esbuild for ssr.js to consume
 * {
 *   data: duh,
 *   script: inlined main.js
 *   template: __app.html
 * }
 */

const { resolve } = require('path')
const { readFileSync, writeFileSync } = require('fs')
const { build } = require('esbuild')

const scriptPath = resolve(__dirname, '../../../dist/build/main.js')
const templatePath = resolve(__dirname, '../../../dist/__app.html')
const bundlePath = resolve(__dirname, '../build/bundle.js')

build({ entryPoints: [scriptPath], outfile: bundlePath, bundle: true }).then(() => {
    const bundle = {
        date: new Date,
        script: readFileSync(bundlePath, 'utf8'),
        template: readFileSync(templatePath, 'utf8')
    }

    writeFileSync(resolve(__dirname, '../bundle.json'), JSON.stringify(bundle, null, 2))
})
