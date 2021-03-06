/* @flow */

require('dotenv').load();
var net = require('net'),
argv = require('minimist')(process.argv.slice(2)),
lo = require('lodash'),
chalk = require('chalk'),
streamSet = require('stream-set'),
jsonStream = require('duplex-json-stream'),
serverHost,
serverPort,
activeClients = streamSet();

//Check option arguments
function checkArgs() {
  // if ( !lo.has(argv, 's') || !lo.isString(argv.s) || lo.isEmpty(argv.s) ) {
  //   console.log("-s [string] server name");
  //   process.exit(1);
  // }
}
checkArgs();

//Load server variables
function prepConn() {
  serverHost = argv.h || process.env.SERVER_HOST;
  serverPort = argv.p || process.env.SERVER_PORT;
}
prepConn();

var server = net.createServer(function (client) {

  // enable client to work with object stream
  client = jsonStream(client);

  activeClients.add(client);
  console.log("Client connected " + chalk.green("[%d active]"), activeClients.size);

  client.on('data', function (data) {
    activeClients.forEach(function (c) {
      if (c !== client ) {
        c.write({
          user: data.user,
          message: data.message
        });
      }
    });
  });

  client.on('end', function (c) {
    var remaining = (activeClients.size - 1);
    console.log("Client disconnected " + chalk.gray("[%d active]"), remaining);
  });
});

server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
	console.error(error);
}

function onListening() {
  var connInfo = server.address();
	console.log(chalk.green("\nReady on -> %s:%s\n"), connInfo.address, connInfo.port);
}

server.listen({
  host: serverHost,
  port: serverPort
});
