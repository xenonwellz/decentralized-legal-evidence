const { execSync } = require('child_process');
const { platform } = require('os');
const fs = require('fs');
const path = require('path');

// Get the platform
const isWindows = platform() === 'win32';

// Function to execute commands and log output
function runCommand(command, options = {}) {
    console.log(`Executing: ${command}`);
    try {
        execSync(command, { stdio: 'inherit', ...options });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
        process.exit(1);
    }
}

// Determine workspace root directory
const workspaceRoot = process.cwd();

// Clean up directories
console.log('Cleaning up directories...');
const directories = [
    path.join(workspaceRoot, 'packages', 'frontend', 'src', 'artifacts'),
    path.join(workspaceRoot, 'packages', 'hardhat', 'artifacts'),
    path.join(workspaceRoot, 'packages', 'hardhat', 'ignition', 'deployments'),
    path.join(workspaceRoot, 'packages', 'hardhat', 'cache')
];

directories.forEach(dir => {
    if (fs.existsSync(dir)) {
        if (isWindows) {
            runCommand(`rmdir /s /q "${dir}"`);
        } else {
            runCommand(`rm -rf "${dir}"`);
        }
    }
});

// Navigate to hardhat directory and run the node in background
console.log('Starting hardhat node in background...');
const hardhatDir = path.join(workspaceRoot, 'packages', 'hardhat');
if (isWindows) {
    // Start the node in a new window on Windows
    runCommand('start cmd /k pnpm run dev', { cwd: hardhatDir, shell: true });
} else {
    // Start the node in the background on Unix
    runCommand('pnpm run dev &', { cwd: hardhatDir, shell: true });
}

// Wait a moment for the node to start
console.log('Waiting for hardhat node to start...');
setTimeout(() => {
    // Deploy contracts
    console.log('Deploying contracts...');
    runCommand('pnpm run deploy', { cwd: hardhatDir });

    // Copy artifacts to frontend
    console.log('Copying artifacts to frontend...');
    const frontendArtifactsDir = path.join(workspaceRoot, 'packages', 'frontend', 'src', 'artifacts');

    // Create artifacts directory in frontend if it doesn't exist
    if (!fs.existsSync(frontendArtifactsDir)) {
        fs.mkdirSync(frontendArtifactsDir, { recursive: true });
    }

    // Copy artifacts from hardhat to frontend
    const hardhatArtifactsDir = path.join(hardhatDir, 'artifacts');
    if (isWindows) {
        runCommand(`xcopy /E /I /Y "${hardhatArtifactsDir}" "${frontendArtifactsDir}"`);
    } else {
        runCommand(`cp -r "${hardhatArtifactsDir}"/* "${frontendArtifactsDir}"`);
    }

    // Find and copy deployed_addresses.json
    console.log('Finding and copying deployed_addresses.json...');
    const deploymentsDir = path.join(hardhatDir, 'ignition', 'deployments');

    let deployedAddressesPath = null;
    if (fs.existsSync(deploymentsDir)) {
        const findDeployedAddressesFile = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    const found = findDeployedAddressesFile(filePath);
                    if (found) return found;
                } else if (file === 'deployed_addresses.json') {
                    return filePath;
                }
            }
            return null;
        };

        deployedAddressesPath = findDeployedAddressesFile(deploymentsDir);
    }

    if (deployedAddressesPath) {
        console.log(`Found deployed addresses at ${deployedAddressesPath}`);
        fs.copyFileSync(deployedAddressesPath, path.join(frontendArtifactsDir, 'deployed_addresses.json'));
    } else {
        console.log('deployed_addresses.json not found');
    }

    // Start frontend
    console.log('Starting frontend...');
    const frontendDir = path.join(workspaceRoot, 'packages', 'frontend');
    runCommand('pnpm run dev', { cwd: frontendDir });

}, 5000); // Wait 5 seconds for the node to start 