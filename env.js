const { readFileSync } = require('fs')
const { join } = require('path')
let config = readFileSync(join(process.cwd(), '.env')).toString('utf-8').concat().trim().split('=').map(u => u.replace(/[\n\r]/g, '=')).map(u => u.split('=')).reduce((a, b) => {
    for (let i = 0; i < b.length; i++) if (b[i]) a.push(b[i].trim())
    return a
}, [])
for (let i = 0; i < config.length; i++) {
    if (i+1 <= config.length) {
        let a = config[i]
        let b = config[i+1]
        process.env[a] = b
        i++
    }
}