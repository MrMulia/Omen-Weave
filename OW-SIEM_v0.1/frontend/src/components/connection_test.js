const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5000/ws');

ws.on('open', function open() {
  console.log('connected');
  ws.send(Date.now());
});

ws.on('close', function close() {
  console.log('disconnected');
});

ws.on('message', function incoming(data) {
  console.log(`Received: ${data}`);
});

ws.on('error', function error(err) {
  console.log('Error:', err);
});

