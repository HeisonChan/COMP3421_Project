import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Quiz.css';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
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

  // fetch quiz questions and choice from api 
  const fetchQuiz = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/quiz/${id}/start`, {
        timeout: 5000
      });
      const { quiz, questions } = res.data;
      
      const endTimeDate = new Date(quiz.endTime);
      
      
      // Store the date's milliseconds timestamp in localStorage
      localStorage.setItem('quizEndTimeMS', endTimeDate.getTime().toString());
      
      // Calculate time left using consistent timestamp values
      const now = new Date().getTime();
      const endTimeMS = endTimeDate.getTime();
      const timeLeft = Math.max(0, Math.floor((endTimeMS - now) / 1000));
      
      console.log("Now:", now, "EndTime:", endTimeMS, "TimeLeft:", timeLeft);
      
      setQuizData({ quiz, questions });
      setTimeRemaining(timeLeft);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError('Failed to load quiz');
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // when anwser selected anw, put his/her choice into this big big array and pass to api for storing ar.
  const handleAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  // submit the quiz anw to api for grading like nromal mc test doing in blackbaord.
  const submitQuiz = useCallback(async (forceSubmit = false) => {
    if (!quizData) return;

    try {
      // fromat questionid and answer into the object like dictionary
      const formattedAnswers = Object.entries(answers).map(([questionId, answerChosen]) => ({
        questionId,
        answerChosen
      }));
      
      // Get end time as milliseconds timestamp
      const now = Date.now();
      
      // Check if time has expired
      const endTimeMS = parseInt(localStorage.getItem('quizEndTimeMS') || '0');
      if (!forceSubmit && endTimeMS < now) {
        console.warn("Quiz time expired");
      }
      
      // Use start time from localStorage or quiz data (as milliseconds)
      const startTimeMS = parseInt(localStorage.getItem('quizStartTimeMS') || '0') || 
                          (quizData.quiz.startTime ? new Date(quizData.quiz.startTime).getTime() : now);
      
      // post the user anw record to the api
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/quiz/${id}/submit`, {
        answers: formattedAnswers,
        startTime: startTimeMS,
        endTime: now,
        quizId: id
      });
      
      // the api return the score and print the score in the next page later.
      setScore(res.data.score);
      
      // Clear stored times from localStorage after submission
      localStorage.removeItem('quizStartTimeMS');
      localStorage.removeItem('quizEndTimeMS');
    } catch (err) {
      setError('Failed to submit quiz');
      console.error("Submit error:", err);
    }
  }, [id, answers, quizData]);

  // Update the timer effect to use persistent endTime
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || score !== null) return;

    console.log("Starting timer with initial time:", timeRemaining);
    
    // Use stored endTime timestamp for more accurate timing across page refreshes
    const endTimeMS = localStorage.getItem('quizEndTimeMS');
    const endTime = endTimeMS ? parseInt(endTimeMS) : (Date.now() + timeRemaining * 1000);
    
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeRemaining(0);
        submitQuiz(true); 
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [score, submitQuiz]);

  // if user not anw all the question and submit will return a warning message
  if (error) return (
    <div>
      <p>{error}</p>
      {error.includes('Please answer') && (
        <button onClick={() => setError(null)}>Try Again</button>
      )}
    </div>
  );

  // if quiz qeustion not loaed in page.
  if (!quizData) return <div>Loading...</div>;

  // if score is released, the quiz page set a score page.
  if (score !== null) return (
    <div
    style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        alignItems: 'center',
    }}
    >

      <h1>Quiz Completed</h1>
      <p>Your Score: {score}/{quizData.questions.length}</p>
      <button onClick={() => navigate(`/quiz/${id}/review`)}>Review answer</button>
    </div>
  );


  // time variable.
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const allAnswered = quizData.questions.every(q => answers[q.id] !== undefined);

  
  return (
    <div className="quiz-container">
      <h1>{quizData.quiz.title}</h1>
      <p>Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</p>
      <div className="questions-list">
        {quizData.questions.map((question, index) => (
          <div key={question.id} className="question-block">
            <h2>{index + 1}. {question.question_text} <span style={{color: 'red'}}>*</span> </h2> 
            <div className="options">
              {question.options.map((opt, idx) => (
                <label key={idx} className="option">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === idx}
                    onChange={() => handleAnswer(question.id, idx)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="submit-section">
        <button 
          onClick={submitQuiz}
          disabled={timeRemaining <= 0 || !allAnswered}
        >
          Submit Quiz
        </button>
        {!allAnswered && (
          <p className="warning">Please answer all questions to submit</p>
        )}
      </div>
    </div>
  );
};

export default Quiz;