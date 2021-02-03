const fs = require('fs')
const { tossr } = require('tossr')

const script = fs.readFileSync(require.resolve('../../dist/build/bundle.js'), 'utf8')
const template = fs.readFileSync(require.resolve('../../dist/__app.html'), 'utf8')

module.exports = async (req, res) => {
    const html = await tossr(template, script, req.url, {})
    res.send(html + '\n<!--ssr rendered-->')
}

