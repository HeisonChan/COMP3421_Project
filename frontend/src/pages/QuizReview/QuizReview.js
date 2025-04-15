import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './QuizReview.css';

const QuizReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('userId');

  // Fetching quiz record of user. 
  const checkuserlogin = useCallback(async () => {
    if (!userId) {
      navigate('/login');
      return;
    }
  }, [userId, navigate]);

  useEffect(() => {
    checkuserlogin();
  }, [checkuserlogin]);

  // Safely parse options
  const parseOptions = (options) => {
    if (Array.isArray(options)) {
      return options;
    }
    
    try {
      // Try parsing as JSON
      return JSON.parse(options);
    } catch (err) {
      console.error('Error parsing options:', err);
      console.log('Raw options:', options);
      
      // Fallback: If it's a string, try to split by comma
      if (typeof options === 'string') {
        return options.split(',');
      }
      
      // Last resort fallback
      return ['No options available'];
    }
  };

  // Fetch quiz questions and user's answers
  const fetchQuizReview = useCallback(async () => {
    try {
      // Get quiz questions
      const quizRes = await axios.get(`${process.env.REACT_APP_API_URL}/quiz/${id}/start`);

      console.log('Quiz data:', quizRes.data);
      console.log('User ID:', userId);
      
      // Process options in questions
      const processedQuestions = quizRes.data.questions.map(q => ({
        ...q,
        parsedOptions: parseOptions(q.options)
      }));
      
      setQuizData({
        ...quizRes.data,
        questions: processedQuestions
      });
      
      try {
        // Get user answers and score
        const answersRes = await axios.get(`${process.env.REACT_APP_API_URL}/quiz/${id}/results/${userId}`);
        setUserAnswers(answersRes.data.userAnswers || {});
        setScore(answersRes.data.score || 0);
      } catch (answerErr) {
        console.error("Error fetching user answers:", answerErr);
        setUserAnswers({});
        setScore(0);
      }
    } catch (err) {
      console.error("Error fetching quiz review:", err);
      setError('Failed to load quiz review');
    }
  }, [id, userId]);

  useEffect(() => {
    fetchQuizReview();
  }, [fetchQuizReview]);


  // same as quiz page.
  if (error) return <div className="error-message">{error}</div>;
  if (!quizData) return <div className="loading">Loading...</div>;

  return (
    <div className="quiz-review-container">
      <div className="quiz-review-header">
        <h1>{quizData.quiz.title} - Review</h1>
        <p>Your Score: {score}/{quizData.questions.length}</p>
      </div>

      <div className="questions-list">
        {quizData.questions.map((question, index) => {
          const userAnswerIndex = userAnswers[question.id];
          const options = question.parsedOptions;
          
          // Find correct answer index from database
          const correctAnswerIndex = parseInt(question.correct_answer);
          if (correctAnswerIndex === -1) {
            correctAnswerIndex = 0; // Default if not found
          }
          
          return (
            <div key={question.id} className="question-block">
              <h2>{index + 1}. {question.question_text}</h2>
              <div className="options">
                {/* Mark the quiz question choice and answer, user answe as tick and correct as star, if user anw correct, show both tick and star. */}
                {options.map((opt, idx) => (
                  <div 
                    key={idx} 
                    className={`option-review ${
                      idx === correctAnswerIndex ? 'correct' : 
                      (idx === userAnswerIndex && idx !== correctAnswerIndex) ? 'incorrect' : ''
                    }`}
                  >
                    <span className="option-marker">
                      {idx === userAnswerIndex ? '✓' : ''}
                      {idx === correctAnswerIndex ? ' ★' : ''}
                    </span>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="back-section">
        <button onClick={() => navigate('/quizlist')}>Back to Quiz List</button>
      </div>
    </div>
  );
};

export default QuizReview;