import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import logoImage from '../../assets/logo.png'; // Add your logo image

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/quizlist');
      }
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-image"></div>
      <div className="login-right">
        <img src={logoImage} alt="Logo" className="login-logo" />
        <form onSubmit={handleSubmit} className="login-form">
          Sign in with your Username and Password
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
          <button type="submit">Login</button>
          <div className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;