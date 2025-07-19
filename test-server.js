#!/usr/bin/env node

// Simple test server to verify port connectivity
const http = require('http');
const port = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Test server running',
      port: port,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test'
    }, null, 2));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Test server running on port ${port}\nTry accessing /health\n`);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🧪 Test server listening on http://0.0.0.0:${port}`);
  console.log(`📍 Local URL: http://localhost:${port}/health`);
  console.log(`📍 Network URL: http://0.0.0.0:${port}/health`);
  console.log('\nPress Ctrl+C to stop\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
    console.log('Try: lsof -i :' + port + ' to see what\'s using it');
  } else if (err.code === 'EACCES') {
    console.error(`❌ Permission denied to bind to port ${port}`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});