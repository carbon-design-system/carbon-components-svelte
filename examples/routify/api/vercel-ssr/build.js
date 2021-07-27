const { resolve } = require('path')
const { existsSync } = require('fs')
const { execSync } = require('child_process')
const { rollup } = require('rollup')

const shouldBuildSpa = process.env.NOW_GITHUB_DEPLOYMENT || process.env.NOW_BUILDER
const script = resolve(__dirname, '../../dist/build/main.js')
const bundlePath = resolve(__dirname, '../../dist/build/bundle.js')

build()


async function build() {
    if (shouldBuildSpa)
        execSync('npm install && npm run build:app', { cwd: resolve('..', '..'), stdio: 'inherit' })
    else
        await waitForAppToExist()

    buildSSRBundle()
}

async function waitForAppToExist() {
    while (!existsSync(script)) {
        console.log(`checking if "${script}" exists`)
        await new Promise(r => setTimeout(r, 2000))
    }
    console.log(`found "${script}"`)
}

async function buildSSRBundle() {
    const bundle = await rollup({
        input: script,
        inlineDynamicImports: true,
    })
    await bundle.write({ format: 'umd', file: bundlePath, name: 'roxi-ssr' })
}
