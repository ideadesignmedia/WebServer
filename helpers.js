const https = require('https')
const fs = require ('fs')
const path = require('path')
const request = (host, page, method, data) => {
    return new Promise((res, rej) => {
        let d = ''
        data = data ? JSON.stringify(data) : JSON.stringify({})
        let req = https.request({
            hostname: host,
            method: method && typeof method === 'string' ? method.toUpperCase() : 'GET',
            path: page,
            port: 443,
            headers: method ? {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            } : {
                'Content-Type': 'application/json'
            }
        }, resp => {
            resp.on('data', l => d+= l)
            resp.on('end', () => {
                let o
                try {
                    o=JSON.parse(d)
                } catch(e) {
                    return res(d)
                }
                return res(o)
            })
        })
        req.on('error', e => rej(e))
        if (method) req.write(data)
        req.end()
    })
}
const tanrequest = (host, page, method, headers, data) => {
    return new Promise((res, rej) => {
        let d = ''
        let req = https.request({
            hostname: host,
            method: method && typeof method === 'string' ? method.toUpperCase() : 'GET',
            path: page,
            port: 443,
            headers: headers
        }, resp => {
            resp.on('data', l => d+= l)
            resp.on('end', () => {
                let o
                try {
                    o=JSON.parse(d)
                } catch(e) {
                    return res(d)
                }
                return res(o)
            })
        })
        req.on('error', e => rej(e))
        if (method) req.write(data)
        req.end()
    })
}
const readFile = file => {
    return new Promise((res, rej) => {
        if (!file) return rej('No path specified')
        fs.readFile(file, (err, doc) => {
            if (err) return rej(err)
            if (!doc) return rej('No Data')
            if (path.extname(file) === '.json') {
                let d
                try {
                    d = JSON.parse(doc)
                } catch(e) {
                    return rej('INVALID JSON')
                }
                return res(d)
            }
            return res(doc)
        })
    })
}
const writeFile = (name, data, read) => {
    return new Promise((res, rej) => {
        if (!name || !data) return rej('(fullPathName, data) => saved')
        if (typeof data !== 'string') data = JSON.stringify(data)
        fs.writeFile(name, data, err => {
            if (err) return rej(err)
            if (read) {
                readFile(name).then(result => {
                    return res(result)
                }).catch(e => {
                    return rej(e)
                })
            } else {
                return res(true)
            }
        })
    })
}
const textMessage = (page, data) => {
    return new Promise((resolve, reject) => {
        let o = JSON.stringify({ ...data, auth: 'password' })
        console.log(o)
        let options = {
            host: 'sms.ideadesignmedia.com',
            port: '443',
            path: page,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }
        let req = https.request(options, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                return resolve(data)
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            return reject(err)
        });
        req.write(o)
        req.end()
    })
}
const genCode = (user, extended) => {
    let r = () => Math.floor(Math.random() * 10)
    return { issued: new Date(),user, expires: new Date(new Date().getTime() + (extended ? 1000*60*60*24*180 : 1000*60*60*24*7)), code: `${r()}${r()}${r()}${r()}${r()}${r()}` }
}
const verifyCode = (code, a) => {
    if (!code || !code.issued || code.issued.getTime() < new Date().getTime() - 1000 * 60 * 15) return false
    let b = code.code
    if (!a || !b || typeof a !== typeof b) return false
    if (a === b) return true
    return false
}
const expired = time => new Date().getTime() - new Date(time).getTime() >= 0
const textAdmin = message => textMessage('/send', { number: '+14802985540', message: message }).then(result => {
    let d
    try {
        d = JSON.parse(result)
    } catch (e) {
        console.log(e)
    } finally {
        if (d && d.error) {
            console.log(d.message ? d.message : d)
        }
    }
}).catch(e => console.log(e))
const text = (number, message) => {
    return new Promise((res, rej) => {
        textMessage('/send', { number: number, message: message }).then(result => {
            let d
            try {
                d = JSON.parse(result)
            } catch (e) {
                rej(e)
            } finally {
                if (d && d.error) {
                    rej(d.message ? d.message : JSON.stringify(d))
                } else {
                    res(d)
                }
            }
        }).catch(e => rej(e))
    })
}
const parsePhone = num => {
    let a = num.split('')
    let res = []
    for (let i = 0; i < a.length; i++) {
        if (!isNaN(parseInt(a[i])) && res.length < 11) {
            res.push(a[i])
            continue
        }
        if (res.length === 10 && res[0] === '1' && !isNaN(parseInt(a[i]))) res.push(a[i])
    }
    return res[0] !== '1' ? '+1' + res.join('') : '+' + res.join('')
}
const timeout = async (callback, time, callbackArguments) => {
    if (!callback || typeof callback !== 'function') throw new Error('Invalid Callback')
    let args = ((callbackArguments && typeof callbackArguments === 'object' && callbackArguments.length > 0) ? callbackArguments : [])
    let max = 2147483647
    if (isNaN(time) || time < 0) time = 0
    if (callback && callbackArguments) return callback(...callbackArguments)
    if (time > max) {
        let t = Math.floor(time / max)
        let r = time % max
        for (let i = 0; i < t; i++) await (() => new Promise(res => setTimeout(() => res(), max)))();
        if (r) {
            return setTimeout(() => callback(...args), r)
        } else {
            return callback(...args)
        }
    } else {
        return setTimeout(() => callback(...args), time)
    }
}
const verifyEmail = email => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test.test(email)
module.exports = {
    request,
    tanrequest,
    readFile,
    writeFile,
    genCode,
    parsePhone,
    textAdmin,
    text,
    verifyCode,
    textMessage,
    expired,
    timeout,
    verifyEmail,
    IP: req => (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim() || req.ip
}