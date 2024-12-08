import React, { useEffect, useState, useCallback } from 'react';

const CredentialList = ({ contract, accounts }) => {
  const [credentials, setCredentials] = useState([]);

  const fetchCredentials = useCallback(async () => {
    if (!contract || accounts.length === 0) return;

    const applicant = accounts[0];
    const credentialsList = [];
    let credentialIndex = 0;

    try {
      while (true) {
        const credential = await contract.methods
          .getCredential(applicant, credentialIndex)
          .call();
        credentialsList.push({
          description: credential[0],
          issuer: credential[1],
          verified: credential[2],
        });
        credentialIndex++;
      }
    } catch (error) {
      // Exit the loop when no more credentials are found
    }

    setCredentials(credentialsList);
  }, [contract, accounts]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  return (
    <div>
      <h2>Your Credentials</h2>
      {credentials.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Issuer</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((credential, index) => (
              <tr key={index}>
                <td>{credential.description}</td>
                <td>{credential.issuer}</td>
                <td>{credential.verified ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No credentials found.</p>
      )}
    </div>
  );
};

export default CredentialList;
