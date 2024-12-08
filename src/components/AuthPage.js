import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = ({ setUserRole, contract, accounts }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('applicant'); // Default role
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async e => {
    e.preventDefault();
    const endpoint = isRegister
      ? 'http://localhost:5001/api/register'
      : 'http://localhost:5001/api/login';

    setLoading(true);

    try {
      const payload = { username, password, role };

      // Include Ethereum address during registration for employer or institution
      if (isRegister && (role === 'employer' || role === 'institution')) {
        console.log('Accounts:', accounts);

        if (!accounts || accounts.length === 0) {
          alert('No Ethereum account found. Please connect your wallet.');
          setLoading(false);
          return;
        }

        payload.address = accounts[0];
        payload.name = username;
      }

      const response = await axios.post(endpoint, payload);
      console.log('Response:', response.data);

      if (isRegister) {
        if (role === 'employer' || role === 'institution') {
          try {
            const methodName =
              role === 'employer' ? 'registerEmployer' : 'registerInstitution';

            console.log(
              `Registering ${role} on the blockchain: ${accounts[0]}`,
            );
            let receipt;

            if (role === 'institution') {
              receipt = await contract.methods[methodName](
                accounts[0],
                username,
              ).send({ from: accounts[0] });
            } else {
              receipt = await contract.methods[methodName](accounts[0]).send({
                from: accounts[0],
              });
            }

            if (receipt.status) {
              console.log(
                `${
                  role.charAt(0).toUpperCase() + role.slice(1)
                } registered on the blockchain successfully.`,
              );
              alert(
                `${
                  role.charAt(0).toUpperCase() + role.slice(1)
                } registration completed successfully.`,
              );
            } else {
              alert(
                `${
                  role.charAt(0).toUpperCase() + role.slice(1)
                } registration failed on the blockchain.`,
              );
            }
          } catch (err) {
            console.error(
              `Blockchain registration failed for ${role}:`,
              err.message,
            );
            alert(
              `${
                role.charAt(0).toUpperCase() + role.slice(1)
              } registration failed on the blockchain.`,
            );
          }
        }

        alert('Registration successful! Please log in with your credentials.');
        setIsRegister(false);
        setUsername('');
        setPassword('');
        return; // Stop further execution for registration
      }

      if (response.data.role) {
        // Login flow
        setUserRole(response.data.role);
        navigate(`/${response.data.role}`); // Redirect to the appropriate role page
      } else {
        alert('Authentication failed!'); // Fallback for unexpected scenarios
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert('Authentication failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>{isRegister ? 'Register' : 'Login'}</h1>
      <form className="auth-form" onSubmit={handleAuth}>
        <input
          type="text"
          className="username"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          className="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="applicant">Applicant</option>
          <option value="employer">Employer</option>
          <option value="institution">Institution</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <button
        className="switch-button"
        onClick={() => setIsRegister(!isRegister)}
        disabled={loading}
      >
        Switch to {isRegister ? 'Login' : 'Register'}
      </button>
    </div>
  );
};

export default AuthPage;
