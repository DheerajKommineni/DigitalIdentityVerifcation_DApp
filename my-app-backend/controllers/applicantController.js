const Applicant = require('../models/Applicant');
const tesseract = require('tesseract.js');

exports.uploadResume = async (req, res) => {
  const { name, resumeHash } = req.body;

  try {
    // Extract text from resumeHash using Pinata or IPFS gateway
    const resumeText = await tesseract.recognize(
      `https://gateway.pinata.cloud/ipfs/${resumeHash}`,
      'eng',
    );

    // Parse credentials (simple regex example, improve as needed)
    const parsedCredentials =
      resumeText.data.text.match(/Projects?:.*\n/g) || [];

    // Save applicant and credentials to DB
    const applicant = new Applicant({
      name,
      resumeHash,
      credentials: parsedCredentials.map(cred => ({ description: cred })),
    });

    await applicant.save();
    res
      .status(201)
      .send({ message: 'Resume uploaded and credentials parsed!', applicant });
  } catch (error) {
    console.error('Error uploading resume:', error.message);
    res.status(500).send({ error: 'Failed to process resume.' });
  }
};

exports.fetchCredentials = async (req, res) => {
  const { applicantId } = req.params;

  try {
    const applicant = await Applicant.findById(applicantId);
    if (!applicant)
      return res.status(404).send({ error: 'Applicant not found' });

    res.send(applicant.credentials);
  } catch (error) {
    console.error('Error fetching credentials:', error.message);
    res.status(500).send({ error: 'Failed to fetch credentials.' });
  }
};
