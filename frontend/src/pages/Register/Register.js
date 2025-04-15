import React, {useEffect, useState, useCallback   } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css';
import logoImage from '../../assets/logo.png'; 

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  
  // same as login login page, not explain again
  // a. focus vistor stay on register page if they don't authenticate
  const checkuserlogin = useCallback(() => {
    if (userId) {
      console.log("User ID found, navigating to /quizlist");
      navigate('/quizlist');
      return;
    }
    console.log("No user ID found");
  }, [userId, navigate]);

  useEffect(() => {
    checkuserlogin();
  }, [checkuserlogin]);

  // b. register form data pass to api to authenticate user, create new user account
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if re-entered passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/register`, {
        username,
        password
      });

      if (response.status === 201) {
        localStorage.setItem('userId', response.data.userId); 
        navigate('/quizlist');
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError('Username already exists');
      } else {
        setError('Registration failed');
      }
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