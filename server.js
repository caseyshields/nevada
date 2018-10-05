
// web server

const express = require('express')
const app = express()

// express single file server
// let options = {
//   root: __dirname+'/public',
//   headers: {
//     'x-timestamp': Date.now(),
//     'x-sent' : true
//   }
// };
// app.get('/', (req, res) => res.sendFile(
//   'index.html',
//   options,
//   function(err){ console.log(err); }
// ));
// // app.get('/', (req, res) => res.send('Hello World!'))
// app.listen(3001, () => console.log('Example app listening on port 3000!'))

//var serveStatic = require('serve-static');
// host static files
let options = {
  etag : false,
  extensions : ['htm', 'html'],
  fallthrough : false,
  index : 'index.html',
  redirect: false
}
app.use( express.static('./', options) );
app.listen( 43210 );

// node http single file server
// console.log("starting server.");

// var http = require('http');
// var fs = require('fs');
// http.createServer(function (req, res) {
//   fs.readFile('index.html', function(err, data) {
//     if(err) {
//       console.log(error);
//       throw err;
//     }
//     res.writeHead(200, {'Content-Type': 'text/html'});
//     res.write(data);
//     res.end();
//   });
// }).listen(8080);

// var http = require('http');
// http.createServer(function (req, res) {
//   res.writeHead(200, {'Content-Type': 'text/html'});
//   res.write('Hello World!');
//   res.end();
// }).listen(8080);