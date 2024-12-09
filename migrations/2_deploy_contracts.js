const fs = require('fs');
const path = require('path');
const DigitalIdentityVerification = artifacts.require(
  'DigitalIdentityVerification',
);
const IdentityVerification = require('../build/contracts/DigitalIdentityVerification.json');

module.exports = async function (deployer) {
  await deployer.deploy(DigitalIdentityVerification, { gas: 6500000 });

  const deployedAddress = DigitalIdentityVerification.address;
  const abi = IdentityVerification.abi;

  // Structure the contract data
  const contractData = {
    abi, // Add the ABI directly
    networks: {
      5777: { address: deployedAddress }, // Dynamically add the network ID and deployed address
    },
  };

  // Paths for frontend and backend contract.json
  const frontendContractPath = path.resolve(
    __dirname,
    '../digitalidentity-verification-dapp/src/contracts/contract.json',
  );

  const backendContractPath = path.resolve(
    __dirname,
    '../my-app-backend/contract.json',
  );

  // Ensure directories exist before writing files
  const ensureDirectoryExists = filePath => {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  };

  // Ensure frontend directory exists
  ensureDirectoryExists(frontendContractPath);

  // Write the contract data for the frontend
  fs.writeFileSync(frontendContractPath, JSON.stringify(contractData, null, 2));

  // Ensure backend directory exists
  ensureDirectoryExists(backendContractPath);

  // Write the contract data for the backend
  fs.writeFileSync(backendContractPath, JSON.stringify(contractData, null, 2));

  console.log(`Contract deployed at address: ${deployedAddress}`);
  console.log(`Frontend contract data saved to ${frontendContractPath}`);
  console.log(`Backend contract data saved to ${backendContractPath}`);
};
