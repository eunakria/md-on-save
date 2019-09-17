const fs =     require('fs')
const http =   require('http')
const url =    require('url')
const qs =     require('querystring')

const ws =     require('ws')
const marked = require('marked')

var doc =      ''
var favicon =  fs.readFileSync('favicon.ico')
var base =     fs.readFileSync('template.html', 'utf-8')

if (process.argv.length !== 3) {
	console.error('You must specify one Markdown file to watch!')
	process.exit(1)
}

var server = http.createServer((req, res) => {
	let urlParts = url.parse(req.url, true)
	switch (urlParts.pathname) {
		case '/':
		case '/index.html':
			res.writeHead(200, {
				'Content-Type': 'text/html'
			})
			res.end(doc)
			break
		case '/favicon.ico':
			res.writeHead(200, {
				'Content-Type': 'image/x-icon'
			})
			res.end(favicon)
			break
		default:
			res.writeHead(404, {
				'Content-Type': 'text/html'
			})
			res.end(`
				<!DOCTYPE html><html><head><title>404</title></head><body>
				<p>It's dangerous to go alone! Take <a href="/">this!</a></p>
				</body></html>
			`)
	}
})

var wss = new ws.Server({
	server,
	path: '/ws'
})
onWrite()

var watch
function onWrite() {
	let md =   fs.readFileSync(process.argv[2], 'utf-8')
	let body = marked(md)
	doc =      base.replace('{}', body)
	for (let client of wss.clients) {
		client.send('md-on-save-reload')
	}
	if (watch !== undefined) {
		watch.close()
	}
	watch = fs.watch(process.argv[2], onWrite)
}

server.listen(8000, () => {
	console.log("Server's up; knock yourself out.")
})
