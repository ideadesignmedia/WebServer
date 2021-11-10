const env = require('./env')
const nodeArgs = process.argv.slice(2)
global.DEV = nodeArgs.find(u => u.split('=')[0] === 'dev' && u.split('=')[1] === 'true')
console.log(`Starting in ${DEV ? 'Development' : 'Production'} Mode`)
const http = require('http')
const express = require('express')
const path = require('path')
const loggingtool = require('morgan');
const sanitize = require('sanitize')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
global.db = require('./db')
global.saveError = u => { console.log(u); db.save(new db.Data({ ERROR: u && u.message ? u.message : u, time: new Date() })).catch(e => console.log(e)) }
process.on('uncaughtException', u => { console.log(`UNCAUGHT ERROR: ${u}`); saveError(u) })
process.on('unhandledRejection', u => { console.log(`UNCAUGHT REJECTION: ${u}`); saveError(u) })
const app = express();
app.set('trust proxy', true);
app.use(loggingtool('dev'));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, authentication, Content-Length');
    next();
});
app.options('*', (req, res) => res.status(200).json({ methods: 'PUT,GET,POST,DELETE,OPTIONS' }))
app.use(sanitize.middleware)
app.use('/static', express.static('./public'))
app.get('/', (req, res) => {

})
app.get((error = 'PAGE NOT FOUND', req, res, next) => {
    const e = new Error(error);
    e.status = 404;
    next(e);
});
app.use((error, req, res, next) => {
    saveError(error)
    res.status(error.status || 500);
    res.json({
        error: true,
        message: error.message ? error.message : 'Error please try again later.'
    })
});
const server = http.createServer(app);
server.listen(process.env.PORT || 3000);