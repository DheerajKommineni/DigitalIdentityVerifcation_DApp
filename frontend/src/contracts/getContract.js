import contractData from './contract.json';

const IdentityVerification = {
  address: contractData.address, // Dynamically loaded address
  abi: contractData.abi, // ABI loaded from JSON
};

export default IdentityVerification;
