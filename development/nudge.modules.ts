declare function require(name:string);

var WebSocket = require('ws'),
WebSocketServer = WebSocket.Server,
HTTPServer = require('http'),
IP = require('ip'),
DGRAM = require('dgram'),
colors = require('colors');

/*
module.exports = {
    WebSocketClient: WebSocket,
    WebSocketServer: WebSocketServer,
    HTTPServer: HTTPServer,
    FileSystem: FileSystem,
    IP: IP,
    DGRAM: DGRAM,

};

*/

