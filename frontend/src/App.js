import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import QuizList from './pages/QuizList/QuizList';
import Quiz from './pages/Quiz/Quiz';
import QuizReview from './pages/QuizReview/QuizReview';
import { Analytics } from '@vercel/analytics/react';

// Simple auth check function
const isAuthenticated = () => !!localStorage.getItem('userId');

// Protected route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Auth page component (redirects logged-in users)
const AuthRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/quizlist" />;
  }
  return children;
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/quizlist" element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
      <Route path="/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
      <Route path="/quiz/:id/review" element={<ProtectedRoute><QuizReview /></ProtectedRoute>} />
    </Routes>
    <Analytics />
  </Router>
);

export default App;