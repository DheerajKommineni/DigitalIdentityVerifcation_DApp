import React, { useState, useEffect, useCallback } from 'react';

import './InstitutionPortal.css';

const InstitutionPortal = ({ contract, accounts, handleLogout }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [requests, setRequests] = useState([]);
  const [institutionName, setInstitutionName] = useState('');
  const [resumes, setResumes] = useState([]);
  // const [approvedRequests, setApprovedRequests] = useState([]); // Track approved requests

  const checkInstitutionRegistration = useCallback(async () => {
    try {
      const registered = await contract.methods
        .institutions(accounts[0])
        .call();
      setIsRegistered(registered);
      console.log(`Institution registration status: ${registered}`);
    } catch (error) {
      console.error('Error checking institution registration:', error.message);
    }
  }, [contract, accounts]);

  const fetchInstitutionName = useCallback(async () => {
    try {
      const name = await contract.methods
        .getInstitutionName(accounts[0])
        .call();
      setInstitutionName(name.toLowerCase());
      console.log(`Fetched institution name: ${name}`);
    } catch (error) {
      console.error('Error fetching institution name:', error.message);
    }
  }, [contract, accounts]);

  const fetchRequests = useCallback(async () => {
    try {
      const events = await contract.getPastEvents(
        'InstitutionVerificationRequested',
        {
          fromBlock: 0,
          toBlock: 'latest',
        },
      );

      const seenTokenIds = new Set();
      const institutionRequests = await Promise.all(
        events
          .filter(event => {
            const eventInstitutionName = event.returnValues.institutionName
              .trim()
              .toLowerCase();
            const currentInstitutionName = institutionName.trim().toLowerCase();
            return eventInstitutionName === currentInstitutionName;
          })
          .filter(event => {
            const tokenId = event.returnValues.tokenId;
            if (seenTokenIds.has(tokenId)) {
              return false;
            }
            seenTokenIds.add(tokenId);
            return true;
          })
          .map(async event => {
            const tokenId = event.returnValues.tokenId;
            const isVerified = await contract.methods
              .isVerifiedByInstitution(tokenId)
              .call();

            return {
              tokenId,
              employer: event.returnValues.employer,
              employerName: event.returnValues.employerName,
              isVerified, // Include verification status
            };
          }),
      );

      setRequests(institutionRequests);
      console.log(
        'Filtered Verification Requests with Status:',
        institutionRequests,
      );
    } catch (error) {
      console.error('Error fetching verification requests:', error.message);
    }
  }, [contract, institutionName]);

  const fetchResumes = useCallback(async () => {
    try {
      const events = await contract.getPastEvents('NFTMinted', {
        fromBlock: 0,
        toBlock: 'latest',
      });

      const filteredResumes = await Promise.all(
        events.map(async event => {
          const tokenId = event.returnValues.tokenId;
          const applicantAddress = event.returnValues.applicant;

          const result = await contract.methods
            .getResume(applicantAddress)
            .call();
          if (result && result[2] === requests[0]?.employerName) {
            // Match employerName
            return {
              tokenId,
              applicantName: result[0],
              resumeHash: result[1],
              employerName: result[2],
            };
          }
          return null;
        }),
      );

      setResumes(filteredResumes.filter(Boolean));
      console.log('Resumes matching employer:', filteredResumes);
    } catch (error) {
      console.error('Error fetching resumes:', error.message);
    }
  }, [contract, requests]);

  const approveRequest = async tokenId => {
    try {
      await contract.methods
        .verifyByInstitution(tokenId)
        .send({ from: accounts[0] });
      alert(`Request for Token ID ${tokenId} approved.`);

      fetchRequests(); // Refresh the list of requests after approval
    } catch (error) {
      console.error('Error approving request:', error.message);
    }
  };

  useEffect(() => {
    checkInstitutionRegistration();
    fetchInstitutionName();
  }, [checkInstitutionRegistration, fetchInstitutionName]);

  useEffect(() => {
    if (institutionName) {
      fetchRequests();
    }
  }, [institutionName, fetchRequests]);

  useEffect(() => {
    if (requests.length > 0) {
      fetchResumes();
    }
  }, [requests, fetchResumes]);

  if (!isRegistered) {
    return (
      <div>
        You are not a registered institution. Please contact the administrator.
      </div>
    );
  }

  return (
    <div>
      <div className="logout-container">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="institution-portal">
        <h2>Institution Portal</h2>
        <h3>Verification Requests</h3>
        <div className="list-container">
          <ul>
            {requests.map(request => (
              <li key={request.tokenId}>
                <strong>Token ID:</strong> {String(request.tokenId) || 'N/A'}{' '}
                <br />
                <strong>Requested by:</strong> {request.employerName} (
                {request.employer})
                {request.isVerified ? (
                  <span style={{ color: 'green', marginLeft: '10px' }}>
                    ✅ Approved
                  </span>
                ) : (
                  <button onClick={() => approveRequest(request.tokenId)}>
                    Approve
                  </button>
                )}
              </li>
            ))}
          </ul>

          <h3>Resumes Matching Employer</h3>
          <ul>
            {resumes.map(resume => (
              <li key={resume.tokenId}>
                <strong>Token ID:</strong> {String(resume.tokenId) || 'N/A'}{' '}
                <br />
                <strong>Applicant:</strong> {resume.applicantName} <br />
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${resume.resumeHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Resume
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstitutionPortal;
