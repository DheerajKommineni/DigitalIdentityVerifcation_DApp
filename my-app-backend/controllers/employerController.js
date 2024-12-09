const Credential = require('../models/Credential');

exports.addCredential = async (req, res) => {
  const { description, applicantId, issuer } = req.body;

  try {
    const credential = new Credential({ description, applicantId, issuer });
    await credential.save();

    res
      .status(201)
      .send({ message: 'Credential added successfully!', credential });
  } catch (error) {
    console.error('Error adding credential:', error.message);
    res.status(500).send({ error: 'Failed to add credential.' });
  }
};

exports.verifyCredential = async (req, res) => {
  const { credentialId } = req.body;

  try {
    const credential = await Credential.findByIdAndUpdate(
      credentialId,
      { verified: true },
      { new: true },
    );
    if (!credential)
      return res.status(404).send({ error: 'Credential not found' });

    res.send({ message: 'Credential verified successfully!', credential });
  } catch (error) {
    console.error('Error verifying credential:', error.message);
    res.status(500).send({ error: 'Failed to verify credential.' });
  }
};
