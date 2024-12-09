require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');
const IdentityVerification = require('../build/contracts/DigitalIdentityVerification.json'); // Adjust path as needed
const contractData = require('./contract.json');

const app = express();
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to the MySQL database.');
  }
});

const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
const contractAddress = contractData.networks[5777]?.address;
const contractABI = contractData.abi;

const contract = new web3.eth.Contract(contractABI, contractAddress);

// API for user registration
app.post('/api/register', async (req, res) => {
  const { username, password, role, address } = req.body;

  // Validate required fields
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'applicant') {
      // Register applicant in database only
      const query =
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
      const values = [username, hashedPassword, role];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ message: 'Applicant registration failed.' });
        }
        return res
          .status(201)
          .json({ message: 'Applicant registered successfully.' });
      });
    } else if (role === 'employer' || role === 'institution') {
      // Ethereum address is mandatory for employer and institution
      if (!address || !web3.utils.isAddress(address)) {
        return res.status(400).json({ message: 'Invalid Ethereum address.' });
      }

      const accounts = await web3.eth.getAccounts();
      const ownerAccount = accounts[0];

      try {
        // Blockchain registration
        if (role === 'employer') {
          console.log(`Registering employer ${address} on blockchain...`);
          await contract.methods.registerEmployer(address).send({
            from: ownerAccount,
            gas: 500000,
          });
          console.log(
            `Employer ${address} successfully registered on blockchain.`,
          );
        } else if (role === 'institution') {
          console.log(
            `Registering institution ${address} with name ${username} on blockchain...`,
          );
          await contract.methods.registerInstitution(address, username).send({
            from: ownerAccount,
            gas: 500000,
          });
          console.log(
            `Institution ${address} successfully registered on blockchain.`,
          );
        }

        // Insert into database after successful blockchain registration
        const query =
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        const values = [username, hashedPassword, role];

        db.query(query, values, (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res
              .status(500)
              .json({ message: 'Database insertion failed.' });
          }
          return res
            .status(201)
            .json({ message: `${role} registered successfully.` });
        });
      } catch (contractError) {
        console.error(
          `Blockchain registration error for ${role}:`,
          contractError,
        );
        return res.status(500).json({
          message: `${
            role.charAt(0).toUpperCase() + role.slice(1)
          } registration failed on blockchain.`,
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

app.get('/api/employers', (req, res) => {
  const query = 'SELECT username FROM users WHERE role = "employer"';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching employers:', err);
      res.status(500).json({ message: 'Failed to fetch employers.' });
    } else {
      res.status(200).json({ employers: results });
    }
  });
});

app.get('/api/institutions', (req, res) => {
  const query = 'SELECT username FROM users WHERE role = "institution"';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching institutions:', err);
      res.status(500).json({ message: 'Failed to fetch institutions.' });
    } else {
      const institutions = results.map(result => result.username);
      res.status(200).json({ institutions });
    }
  });
});

// API for user login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  db.query(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error.' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'User not found.' });
      }

      const user = results[0];

      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials.' });
        }

        res.json({
          message: 'Login successful.',
          role: user.role,
        });
      } catch (compareError) {
        console.error('Error comparing passwords:', compareError);
        res.status(500).json({ message: 'Server error.' });
      }
    },
  );
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
