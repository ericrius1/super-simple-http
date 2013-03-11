var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/public');

http.createServer(ecstatic).listen(3000);
