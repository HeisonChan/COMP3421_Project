import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import QuizList from './pages/QuizList/QuizList';
import Quiz from './pages/Quiz/Quiz';

const App = () => (
  <Router>
    <Routes>
      <Route exact path="/" element={<Login/>} />
      <Route path="/register" element={<Register />} />
      <Route path="/quizlist" element={<QuizList />} />
      <Route path="/quiz/:id" element={<Quiz />} />
    </Routes>
  </Router>
);

export default App;