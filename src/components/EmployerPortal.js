import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import './EmployerPortal.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const EmployerPortal = ({ contract, accounts, handleLogout }) => {
  const [resumes, setResumes] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredInstitutions, setRegisteredInstitutions] = useState([]);
  const [requestStatus, setRequestStatus] = useState({}); // Track request status for institutions

  // Check if the employer is registered
  const checkEmployerRegistration = useCallback(async () => {
    try {
      const registered = await contract.methods.employers(accounts[0]).call();
      setIsRegistered(registered);
      console.log(`Employer registration status: ${registered}`);
    } catch (error) {
      console.error('Error checking employer registration:', error.message);
    }
  }, [contract, accounts]);

  // Fetch registered institutions from the backend
  const fetchRegisteredInstitutions = useCallback(async () => {
    try {
      const response = await axios.get(
        'http://localhost:5001/api/institutions',
      );
      if (response.data && response.data.institutions) {
        const institutions = response.data.institutions.map(inst =>
          inst.toLowerCase(),
        );
        setRegisteredInstitutions(institutions);
        console.log('Registered Institutions:', institutions);
      } else {
        console.warn('No institutions found in the response.');
      }
    } catch (error) {
      console.error('Error fetching registered institutions:', error.message);
    }
  }, []);

  const extractInstitutionNames = useCallback(textContent => {
    const institutions = [];
    let insideExperienceSection = false;
    let currentInstitution = '';

    textContent.items.forEach(item => {
      const text = item.str.trim();

      if (text.includes('EXPERIENCE')) insideExperienceSection = true;
      if (insideExperienceSection && text.includes('EDUCATION'))
        insideExperienceSection = false;

      if (insideExperienceSection) {
        const isAllCaps = text === text.toUpperCase();
        if (isAllCaps && text !== 'EXPERIENCE' && text.length > 1) {
          currentInstitution += ` ${text}`.trim();
        } else if (currentInstitution) {
          institutions.push(currentInstitution.trim());
          currentInstitution = '';
        }
      }
    });

    if (currentInstitution) institutions.push(currentInstitution.trim());
    return institutions;
  }, []);

  const extractTextFromPDF = useCallback(
    async fileUrl => {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        let institutions = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const institutionsFromPage = extractInstitutionNames(content);
          institutions = institutions.concat(institutionsFromPage);
        }

        return [...new Set(institutions)];
      } catch (error) {
        console.error('Error extracting text from PDF:', error.message);
        return [];
      }
    },
    [extractInstitutionNames],
  );

  const fetchResumes = useCallback(async () => {
    try {
      const events = await contract.getPastEvents('NFTMinted', {
        fromBlock: 0,
        toBlock: 'latest',
      });

      const resumeList = await Promise.all(
        events.map(async event => {
          const tokenId = event.returnValues.tokenId;
          const applicantAddress = event.returnValues.applicant;

          const resumeData = await contract.methods
            .getResume(applicantAddress)
            .call();

          const isVerifiedByEmployer = await contract.methods
            .isVerifiedByEmployer(tokenId)
            .call();

          const institutions = await extractTextFromPDF(
            `https://gateway.pinata.cloud/ipfs/${resumeData[1]}`,
          );

          const institutionStatus = {};
          for (const institution of institutions) {
            const lowerCaseInstitution = institution.toLowerCase();

            // Check if the institution is the one that has been verified for this tokenId
            const requestDetails = await contract.methods
              .getInstitutionRequest(tokenId)
              .call();
            const requestedInstitution = requestDetails[0]?.toLowerCase(); // Normalize case

            if (requestedInstitution === lowerCaseInstitution) {
              const isVerified = await contract.methods
                .isVerifiedByInstitution(tokenId)
                .call();
              institutionStatus[lowerCaseInstitution] = isVerified;
            } else {
              institutionStatus[lowerCaseInstitution] = false;
            }
          }

          return {
            tokenId,
            applicantName: resumeData[0], // Fetch correct applicant name
            resumeHash: resumeData[1],
            employerName: resumeData[2],
            institutions,
            institutionStatus,
            isVerifiedByEmployer,
          };
        }),
      );

      setResumes(resumeList);
    } catch (error) {
      console.error('Error fetching resumes:', error.message);
    }
  }, [contract, extractTextFromPDF]);

  const requestVerification = async (tokenId, institutionName) => {
    const institutionExists = registeredInstitutions.some(
      registeredInstitution =>
        registeredInstitution.toLowerCase() === institutionName.toLowerCase(),
    );

    if (!institutionExists) {
      alert(`Institution "${institutionName}" is not registered.`);
      return;
    }

    try {
      const employerName = 'Google'; // Replace with the actual employer name
      await contract.methods
        .requestVerificationByInstitution(
          tokenId,
          institutionName,
          employerName,
        )
        .send({ from: accounts[0] });

      // Update request status
      setRequestStatus(prev => ({
        ...prev,
        [tokenId]: { ...prev[tokenId], [institutionName]: 'Requested' },
      }));

      alert(`Verification request sent to "${institutionName}" successfully.`);
      fetchResumes(); // Refresh resumes after request
    } catch (error) {
      console.error('Error requesting verification:', error.message);
      alert(`Failed to request verification for "${institutionName}".`);
    }
  };

  const verifyResume = async tokenId => {
    try {
      await contract.methods
        .verifyByEmployer(tokenId)
        .send({ from: accounts[0] });
      alert(`Resume with Token ID ${tokenId} verified successfully.`);
      fetchResumes(); // Refresh resumes after verification
    } catch (error) {
      console.error('Error verifying resume:', error.message);
    }
  };

  useEffect(() => {
    checkEmployerRegistration();
    fetchRegisteredInstitutions();
    fetchResumes();
  }, [checkEmployerRegistration, fetchRegisteredInstitutions, fetchResumes]);

  if (!isRegistered) {
    return (
      <div>
        You are not a registered employer. Please contact the administrator.
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
      <div className="employer-portal">
        <h2>Employer Portal</h2>
        <h3>Resumes Associated with Your Company</h3>
        <ul>
          {resumes.map(resume => (
            <li key={resume.tokenId}>
              <div>
                <strong>Token ID:</strong> {resume.tokenId}
                <br />
                <strong>Applicant:</strong> {resume.applicantName}
                <br />
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${resume.resumeHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Resume
                </a>
                <br />
                <strong>Employer Verified:</strong>{' '}
                {resume.isVerifiedByEmployer ? (
                  <span style={{ color: 'green' }}>✅ Verified</span>
                ) : (
                  <button onClick={() => verifyResume(resume.tokenId)}>
                    Verify
                  </button>
                )}
                <h4>Institutions:</h4>
                <ul>
                  {resume.institutions.map((institution, index) => {
                    const lowerCaseInstitution = institution.toLowerCase();
                    const status =
                      requestStatus[resume.tokenId]?.[institution] ===
                      'Requested';

                    return (
                      <li key={index}>
                        {institution}{' '}
                        {resume.institutionStatus[lowerCaseInstitution] ? (
                          <span style={{ color: 'green' }}>✅ Verified</span>
                        ) : status ? (
                          <span style={{ color: 'orange' }}>⚠ Requested</span>
                        ) : (
                          <button
                            className="request-verification-button"
                            onClick={() =>
                              requestVerification(resume.tokenId, institution)
                            }
                          >
                            Request Verification
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EmployerPortal;
