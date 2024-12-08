import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './ApplicantPortal.css';

const ApplicantPortal = ({ contract, accounts, web3, handleLogout }) => {
  const [applicantName, setApplicantName] = useState('');
  const [resumeHash, setResumeHash] = useState('');
  const [uploading, setUploading] = useState(false);
  const [nfts, setNFTs] = useState([]);
  const [verificationStatuses, setVerificationStatuses] = useState([]);
  const [employers, setEmployers] = useState([]); // List of registered employers
  const [selectedEmployer, setSelectedEmployer] = useState(''); // Selected employer

  const PINATA_API_KEY = '6ead6cca462a961c7273';
  const PINATA_SECRET_API_KEY =
    '744cf8fe8bdeaef78027a3b96bb4d5876199a5520f4430280280c3dfae3b4c5b';

  const fetchRegisteredEmployers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/employers');
      if (response.status === 200) {
        setEmployers(response.data.employers);
        console.log('Registered Employers:', response.data.employers);
      } else {
        console.error('Failed to fetch employers:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching employers:', error.message);
    }
  }, []);

  const uploadToPinata = async file => {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({ name: file.name });
    formData.append('pinataMetadata', metadata);

    try {
      setUploading(true);
      console.log('Starting Pinata upload...');
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
        },
      );
      console.log('Pinata Response:', response.data);
      setUploading(false);
      return response.data.IpfsHash;
    } catch (error) {
      setUploading(false);
      console.error('Pinata Error:', error.response?.data || error.message);
      throw new Error('Failed to upload file to IPFS');
    }
  };

  const fetchVerificationStatus = useCallback(
    async mintedNFTs => {
      try {
        const statuses = await Promise.all(
          mintedNFTs.map(async nft => {
            const employerVerified = await contract.methods
              .isVerifiedByEmployer(nft.tokenId)
              .call();

            const institutionRequest = await contract.methods
              .getInstitutionRequest(nft.tokenId)
              .call();

            const institutionVerified = await contract.methods
              .isVerifiedByInstitution(nft.tokenId)
              .call();

            const institutionName = institutionRequest[0];
            const institutionRequested = institutionRequest[1];

            return {
              tokenId: nft.tokenId,
              employerName: nft.employerName,
              employerVerified,
              institutionVerified,
              institutionName: institutionName || 'N/A',
              institutionStatus: institutionVerified
                ? 'Approved'
                : institutionRequested
                ? 'Requested'
                : 'Not Requested',
            };
          }),
        );

        setVerificationStatuses(statuses);
        console.log('User-specific verification statuses:', statuses);
      } catch (error) {
        console.error('Error fetching verification statuses:', error.message);
      }
    },
    [contract],
  );

  const fetchNFTs = useCallback(async () => {
    if (!contract || accounts.length === 0) {
      console.warn('Contract or accounts not initialized.');
      return;
    }

    try {
      console.log('Fetching NFTMinted events...');
      const pastEvents = await contract.getPastEvents('NFTMinted', {
        fromBlock: 0,
        toBlock: 'latest',
      });

      const mintedNFTs = pastEvents
        .filter(
          event =>
            event.returnValues.applicant.toLowerCase() ===
            accounts[0].toLowerCase(), // Filter by current user's account
        )
        .map(event => ({
          tokenId: parseInt(event.returnValues.tokenId, 10),
          employerName: event.returnValues.employerName, // Include employer name
        }));

      console.log('Filtered NFTs for current user:', mintedNFTs);
      setNFTs(mintedNFTs);

      // Fetch verification statuses for the filtered NFTs
      fetchVerificationStatus(mintedNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error.message);
    }
  }, [contract, accounts, fetchVerificationStatus]);

  useEffect(() => {
    if (contract && accounts.length > 0) {
      fetchNFTs();
      fetchRegisteredEmployers();
    }
  }, [contract, accounts, fetchNFTs, fetchRegisteredEmployers]);

  const uploadResume = async e => {
    e.preventDefault();
    console.log('uploadResume triggered'); // Debug log

    if (!resumeHash || !applicantName || !selectedEmployer) {
      alert('Please provide a resume, applicant name, and select an employer.');
      return;
    }

    console.log('Parameters:', { applicantName, resumeHash, selectedEmployer });

    try {
      const txReceipt = await contract.methods
        .uploadResume(applicantName, resumeHash, selectedEmployer) // Pass employer name
        .send({ from: accounts[0] });

      console.log('Transaction Receipt:', txReceipt);

      const nftMintedEvent = txReceipt.events.NFTMinted;
      if (nftMintedEvent) {
        const { tokenId, applicant } = nftMintedEvent.returnValues;
        console.log('NFT Minted Event:', { tokenId, applicant });

        if (applicant.toLowerCase() === accounts[0].toLowerCase()) {
          const newNFT = {
            tokenId: parseInt(tokenId, 10),
            employerName: selectedEmployer,
          };
          setNFTs(prevNFTs => [...prevNFTs, newNFT]);
          alert(`NFT Minted with Token ID: ${tokenId}`);
        } else {
          console.warn('NFT minted for a different account:', applicant);
        }
        setSelectedEmployer(''); // Close the Apply Form
      } else {
        console.error('No NFTMinted event found in transaction receipt.');
      }
    } catch (error) {
      console.error('Blockchain Error:', error.message);
      alert('Failed to upload resume to the blockchain.');
    }
  };

  return (
    <div className="app-container">
      <div className="logout-container">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="applicant-portal">
        <header className="portal-header">
          <h2>Applicant Portal</h2>
        </header>

        <h3>Registered Employers</h3>
        <div className="employer-cards-container">
          {employers.map((employer, index) => {
            const isApplied = nfts.some(
              nft =>
                nft.employerName.toLowerCase() ===
                employer.username.toLowerCase(),
            );

            const employerStatus = verificationStatuses.find(
              v =>
                v.employerName.toLowerCase() ===
                employer.username.toLowerCase(),
            );

            return (
              <div key={index} className="employer-card">
                <h4 className="employer-name">{employer.username}</h4>
                {employerStatus?.employerVerified &&
                employerStatus?.institutionVerified ? (
                  <p className="employer-status" style={{ color: 'green' }}>
                    Applied - Verified by both employer and institution.
                  </p>
                ) : isApplied ? (
                  <p className="employer-status" style={{ color: 'orange' }}>
                    Applied - Awaiting verification.
                  </p>
                ) : (
                  <button
                    className="apply-button"
                    onClick={() => setSelectedEmployer(employer.username)}
                  >
                    Apply
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {selectedEmployer && (
          <div className="apply-form">
            <h3>Apply to {selectedEmployer}</h3>
            <form onSubmit={uploadResume}>
              <input
                type="text"
                placeholder="Applicant Name"
                value={applicantName}
                onChange={e => setApplicantName(e.target.value)}
                required
              />
              <input
                type="file"
                onChange={async e => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      const hash = await uploadToPinata(file);
                      setResumeHash(hash);
                    } catch (error) {
                      console.error('Error uploading file:', error.message);
                    }
                  }
                }}
                required
              />
              <button type="submit" disabled={!resumeHash || uploading}>
                {uploading ? 'Uploading to Pinata...' : 'Upload Resume'}
              </button>
            </form>
          </div>
        )}

        <h3>Your NFTs</h3>
        <ul>
          {nfts.map((nft, index) => (
            <li key={index}>NFT Token ID: {nft.tokenId}</li>
          ))}
        </ul>

        <h3>Verification Status</h3>
        <ul>
          {verificationStatuses.map((status, index) => (
            <li key={index}>
              <strong>NFT ID:</strong> {status.tokenId} <br />
              <strong>Employer Name:</strong> {status.employerName} <br />
              <strong>Employer Verified:</strong>{' '}
              {status.employerVerified ? (
                <span style={{ color: 'green' }}>✅ Yes</span>
              ) : (
                <span style={{ color: 'red' }}>❌ No</span>
              )}
              <br />
              <strong>Institution Name:</strong> {status.institutionName} <br />
              <strong>Institution Status:</strong>{' '}
              {status.institutionStatus === 'Approved' ? (
                <span style={{ color: 'green' }}>
                  ✅ {status.institutionStatus}
                </span>
              ) : status.institutionStatus === 'Requested' ? (
                <span style={{ color: 'orange' }}>
                  ⚠ {status.institutionStatus}
                </span>
              ) : (
                <span style={{ color: 'red' }}>
                  ❌ {status.institutionStatus}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ApplicantPortal;
