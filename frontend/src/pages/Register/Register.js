import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css';
import logoImage from '../../assets/logo.png'; // Add your logo image

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

   // Check if re eneter passwords match
   if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/register', {
      username,
      password
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      navigate('/quizlist');
    }
  } catch (err) {
    setError('Registration failed');
  }
  };

  return (
    <div className="login-container">
      <div className="login-image"></div>
      <div className="login-right">
        <img src={logoImage} alt="Logo" className="login-logo" />
        <form onSubmit={handleSubmit} className="login-form">
          Register with your Username and Password
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Username"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm Password"
            />
          </div>

          <button type="submit">Register</button>
          <div className="register-link">
            Have an account? <Link to="/">Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;