import React, { useState } from 'react';

const AdminPortal = ({ contract, accounts }) => {
  const [employerAddress, setEmployerAddress] = useState('');
  const [message, setMessage] = useState('');

  const registerEmployer = async () => {
    try {
      if (!employerAddress) {
        alert('Please enter a valid Ethereum address.');
        return;
      }
      console.log('Registering employer:', employerAddress);
      await contract.methods
        .registerEmployer(employerAddress)
        .send({ from: accounts[0] }); // Ensure this is the owner account
      setMessage(`Employer ${employerAddress} registered successfully.`);
    } catch (error) {
      console.error('Error registering employer:', error.message);
      setMessage(
        'Failed to register employer. Ensure you are the contract owner.',
      );
    }
  };

  return (
    <div>
      <h2>Admin Portal</h2>
      <input
        type="text"
        placeholder="Enter Employer Address"
        value={employerAddress}
        onChange={e => setEmployerAddress(e.target.value)}
      />
      <button onClick={registerEmployer}>Register Employer</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminPortal;
