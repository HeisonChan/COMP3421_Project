import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import logoImage from '../../assets/logo.png'; 

const Login = () => {
  const [username, setUsername] = useState(''); // username input varaible
  const [password, setPassword] = useState(''); // password input variable 
  const [error, setError] = useState(''); // error message variable
  const userId = localStorage.getItem('userId'); // get userId from local storage
  const navigate = useNavigate(); // hook to navigate between pages (Login -> Reigister / QuizList)
  

  // a. focus vistor stay on login page if they don't authenticate
  const checkuserlogin = useCallback(() => {
    // check useid contained in locol storage
    if (userId) {
      console.log("User ID found, navigating to /quizlist"); 
      navigate('/quizlist'); 
      return;
    }
    console.log("No user ID found");
  }, [userId, navigate]);
  
  // OnLoad function Call
  useEffect(() => {
    checkuserlogin();
  }, [checkuserlogin]);

  // b. lgoin form data pass to api to authenticate user
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // send input feild username and password to api  
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`, {
        username,
        password
      });

      // if api repononse ok, then pass to quizlist page
      if (response.data.userId) {
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('userName', response.data.username);
        navigate('/quizlist');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed');
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
          <button type="submit" ClassName="submitbutton">Login</button>
          <div className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;