const fs = require('fs');
const path = require('path');
const DigitalIdentityVerification = artifacts.require(
  'DigitalIdentityVerification',
);
const IdentityVerification = require('../build/contracts/DigitalIdentityVerification.json');

module.exports = async function (deployer) {
  await deployer.deploy(DigitalIdentityVerification, { gas: 7500000 });

  const deployedAddress = DigitalIdentityVerification.address;
  const abi = IdentityVerification.abi;
  const contractData = {
    abi, // Add the ABI directly
    networks: {
      5777: { address: deployedAddress }, // Dynamically add the network ID and deployed address
    },
  };

  // Save the contract address and ABI for frontend
  const frontendContractPath = path.resolve(
    __dirname,
    '../digitalidentity-verification-dapp/src/contracts/contract.json',
  );

  fs.writeFileSync(frontendContractPath, JSON.stringify(contractData, null, 2));

  // Save the contract address and ABI for backend
  const backendContractPath = path.resolve(
    __dirname,
    '../my-app-backend/contract.json',
  );

  fs.writeFileSync(backendContractPath, JSON.stringify(contractData, null, 2));

  console.log(`Contract deployed at address: ${deployedAddress}`);
  console.log(`Frontend contract data saved to ${frontendContractPath}`);
  console.log(`Backend contract data saved to ${backendContractPath}`);
};
