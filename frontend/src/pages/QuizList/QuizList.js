import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizList.css';

const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [remainingTimes, setRemainingTimes] = useState({});
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('userName');

  // Fetching quiz record of user. 
  const fetchQuizzes = useCallback(async () => {
    // if user doesnt login in, focus put them to login page.
    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      // fetch quiz record from api
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/quizzes/user/${userId}`, {
        timeout: 5000
      });
      setQuizzes(res.data.quizzes || []);
      setMessage(res.data.message || '');
      
      // Initialize remaining times
      const times = {};
      (res.data.quizzes || []).forEach(quiz => {
        const endTime = parseInt(quiz.endTime);
        const now = Date.now();
        times[quiz.id] = Math.max(0, Math.floor((endTime - now) / 1000));
      });
      setRemainingTimes(times);
    } catch (error) {
      setMessage(error.response?.data?.error || 'No Quiz Record Found');
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  
  // Onload
  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // b. update timer for all quizzes timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setRemainingTimes(prev => {
        const updated = {...prev};
        quizzes.forEach(quiz => {
          const endTime = parseInt(quiz.endTime);
          const now = Date.now();
          updated[quiz.id] = Math.max(0, Math.floor((endTime - now) / 1000));
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [quizzes]);

  // Format time from timespan 
  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return "Expired";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // c. Start quiz function, create new quiz record though api call .
  const handleCreateQuiz = useCallback(async () => {
    try {
      setLoading(true);

      // only the user click ok to start the timer quiz
      if (window.confirm("Server Connection Successfully! Ready to start? The timer will begin when you click OK.")) {
        const nowMS = Date.now();
        const endTimeMS = nowMS + (600 * 1000);

        // the following data is pass to api to create new quiz session.
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/quizzes/create`, {
          title: `Quiz ${new Date(nowMS).toLocaleDateString()}`,
          description: "Random quiz with 10 questions",
          userId,
          startTime: nowMS,
          endTime: endTimeMS
        }, { timeout: 5000 });

        // route to quiz page if quiz created with api feedback oked
        if (response.data.quizId) {
          localStorage.setItem('quizStartTimeMS', nowMS.toString());
          localStorage.setItem('quizEndTimeMS', endTimeMS.toString());
          navigate(`/quiz/${response.data.quizId}`);
        }
      }
    } catch (error) {
      console.error("SQL Error:", error.response?.data?.error);
      // set error message to user when some bug or things that cannot gen the quiz, return them essage for user to know what happened.
      setMessage(error.response?.data?.error || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  }, [userId, navigate, fetchQuizzes]);

  // d. logout function
  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/login');
  };


  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <h1>My Quizzes - Welcome {username}</h1>

        <div className="header-buttons">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="create-quiz-container"> 
        <button className="create-quiz-btn" onClick={handleCreateQuiz}>
          Create Quiz
        </button>
      </div>

      {message && (
        <div className="message-container">
          <p>{message}</p>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : quizzes.length > 0 ? (
        <ul className="quiz-list">
          {/* api quiz record printing in card form */}
          {quizzes.map(quiz => (
            <li key={quiz.id} className="quiz-item">
              <div className="quiz-info">
                <h2>{quiz.title}</h2>
                <p>{quiz.description}</p>
                <div className="quiz-stats">
                  <span>Questions: {quiz.question_count || 10}</span>
                  <span>Score: {quiz.score || "Not attempted"}</span>
                  <span className={remainingTimes[quiz.id] > 0 ? "time-remaining" : "time-expired"}>
                    Time Remaining: {(quiz.score === null) ? formatTimeRemaining(remainingTimes[quiz.id]) : "Expired" }
                  </span>
                  <span> --------</span>
                  <span>Started at: {new Date(parseInt(quiz.startTime)).toLocaleString('en-HK')}</span>
                  <span>Terminated at: {new Date(parseInt(quiz.endTime)).toLocaleString('en-HK')}</span>
                  
                </div>
              </div>
              {quiz.score !== null ? (
                // 1. If quiz has been attempted already, only show Review button
                <button 
                  className="review-quiz-btn"
                  onClick={() => navigate(`/quiz/${quiz.id}/review`)}
                >
                  Review Quiz
                </button>
              ) : (
                // 2. If Quiz is still active and not attempted let user take quiz.
                remainingTimes[quiz.id] > 0 ? (
                  <button 
                    className="take-quiz-btn"
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
                    Take Quiz
                  </button>
                ) : (
                  // 3. Quiz has expired and not attempted
                  <button 
                    className="null-bth"
                    disabled
                  >
                    Quiz Expired
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      ) : (
        <></>
      )}
    </div>
  );
};

export default QuizList;