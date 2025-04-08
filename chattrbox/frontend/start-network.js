const { spawn } = require('child_process');
const os = require('os');

// Get local IP address
const interfaces = os.networkInterfaces();
let localIp = 'localhost';

Object.keys(interfaces).forEach((interfaceName) => {
  interfaces[interfaceName].forEach((interface) => {
    if (interface.family === 'IPv4' && !interface.internal) {
      localIp = interface.address;
    }
  });
});

console.log(`Starting development server accessible at: http://${localIp}:3000`);

// Start the React development server with host parameter
const reactScriptsStart = spawn('react-scripts', ['start'], {
  env: {
    ...process.env,
    HOST: '0.0.0.0',
    PORT: 3000
  }
});

reactScriptsStart.stdout.on('data', (data) => {
  console.log(data.toString());
});

reactScriptsStart.stderr.on('data', (data) => {
  console.error(data.toString());
});

reactScriptsStart.on('close', (code) => {
  console.log(`React development server exited with code ${code}`);
}); 