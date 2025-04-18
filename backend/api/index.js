const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();
const dns = require('dns');


dns.setDefaultResultOrder('ipv4first'); 

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.RAILWAY_PRIVATE_DOMAIN || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: parseInt(process.env.MYSQLPORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00'
  
});

pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

/**
 * 1. register                  (Register)     - (create) {User}          register a new user to database table users
 * 2. login                     (Login Page)   - (Read)   {User}          login checking user to database table users
 * 3. quizzes_question_push     (admin use)    - (create) {questions}     push deafult questions pool to database for quiz
 * 4. /quizzes/user/:userId     (QuizListPage) - (Read)   {quizzes}       fetch all quizzes created by a user [quiz data]
 *                                                        {quiz_attempts}                                     [Score] 
 * 5. /quizzes/create           (QuizListPage) - (create) {quizzes}       create a new quiz and add random questions from the pool
 * 6. /quiz/:id/start           (QuizPage)     - (create) {quizzes}       start a quiz and get quiz details and questions
 *                                                        {quiz_attempts}
 * 7. /quiz/:id/submit          (QuizPage)     - (create) {quizzes}       submit quiz answers and calculate score
 *                                                        {quiz_attempts}                           
 * 8. /quiz/:id/results/:userId (QuizReview)   - (Read)   {quizzes}       get quiz results for review
 *                                                        {quiz_attempts}                        
 */

app.get('/', async (req, res) => {
  res.status(201).json({
    message: 'Hello World'
  });

});

// 1. Auth endpoints
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Store the result of the insert operation to get the new user ID
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, password]
    );
    
    // Send only ONE response with both the success message and new user ID
    res.status(201).json({
      message: 'Registration successful',
      userId: result.insertId,
      username: username 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 2. Login endpoint  
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ userId: users[0].id, username: users[0].username });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. Question pool push
app.post('/quizzes_question_push', async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions must be an array' });
    }

    const questionValues = questions.map(q => {
      const correctAnswerIndex = q.options.indexOf(q.correctAnswer);
      if (correctAnswerIndex === -1) throw new Error('Invalid correct answer');
      return [q.questionText, JSON.stringify(q.options), correctAnswerIndex];
    });

    await pool.query(
      'INSERT INTO questions (question_text, options, correct_answer) VALUES ?',
      [questionValues]
    );
    
    res.status(201).json({ message: 'Questions added successfully' });
  } catch (error) {
    console.error('Error adding questions:', error);
    res.status(500).json({ error: 'Failed to add questions' });
  }
});

// fetch user's quizzes
app.get('/quizzes/user/:userId', async (req, res) => {
  try {
    const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.userId]);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [quizzes] = await pool.query(`
      SELECT 
        q.id, 
        q.title, 
        q.description, 
        q.endTime, 
        q.startTime,
        q.question_count,
        MAX(qa.score) as score
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE q.user_id = ?
      GROUP BY q.id, q.title, q.description, q.endTime, q.startTime, q.question_count 
      ORDER BY q.startTime DESC
    `, [req.params.userId]);

    res.json({
      quizzes,
      message: quizzes.length === 0 ? 'No quizzes found' : null
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// quiz create
app.post('/quizzes/create', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { title, description, userId, startTime, endTime } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [userExists] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userExists.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    await connection.beginTransaction();

    // Create timestamps for quiz timing
    const nowMS = Date.now();
    // 10 minutes from now
    const endTimeMS = nowMS + (600 * 1000); 
    

    // Get the total number of questions
    const [countResult] = await connection.query('SELECT COUNT(*) as count FROM questions');
    const totalQuestions = countResult[0].count;

    // Generate a random offset
    const randomOffset = Math.floor(Math.random() * (totalQuestions - 10)); 


    // Get random questions from the global pool
    const [randomQuestions] = await connection.query(
      'SELECT id, question_text, options, correct_answer FROM questions WHERE id BETWEEN 61 AND 260 ORDER BY RAND() LIMIT 10'
    );

    // Extract just the IDs to store in the quiz record
    const selectedQuestionIds = randomQuestions.map(q => q.id);

    // Insert the quiz with selected question IDs
    const [quiz] = await connection.query(
      'INSERT INTO quizzes (title, description, user_id, startTime, endTime, selected_questions) VALUES (?, ?, ?, ?, ?, ?)',
      [
        title, 
        description || '', 
        userId, 
        startTime || nowMS, 
        endTime || endTimeMS, 
        JSON.stringify(selectedQuestionIds)
      ]
    );

    await connection.commit();
    
    res.status(201).json({
      quizId: quiz.insertId,
      startTime: startTime || nowMS,
      endTime: endTime || endTimeMS
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: error.message || 'Failed to create quiz' });
  } finally {
    connection.release();
  }
});


// Start quiz
app.get('/quiz/:id/start', async (req, res) => {
  try {
    // Use camelCase field names to match the database schema
    const [quiz] = await pool.query(
      'SELECT id, title, description, startTime, endTime, selected_questions FROM quizzes WHERE id = ?',
      [req.params.id]
    );
    if (!quiz.length) return res.status(404).json({ error: 'Quiz not found' });

    // Parse the selected questions
    let selectedQuestionIds = [];
    try {
        const rawQuestions = quiz[0].selected_questions;
        // ensure it is strong
        if (typeof rawQuestions === 'string') {
            // Del illgeal word
            const cleanedQuestions = rawQuestions.replace(/,\s*,/g, ',').replace(/,\s*]/g, ']');
            selectedQuestionIds = JSON.parse(cleanedQuestions);
        } else if (Array.isArray(rawQuestions)) {
            // already array
            selectedQuestionIds = rawQuestions;
        }
    } catch (err) {
        console.log('oringal json:', quiz[0].selected_questions);
        console.error('JSON解析错误:', err.message);
        selectedQuestionIds = []; // Empty
    }
    
    // Only fetch questions if there are selected question IDs
    let questions = [];
    if (selectedQuestionIds.length > 0) {
      const placeholders = selectedQuestionIds.map(() => '?').join(',');
      [questions] = await pool.query(
        `SELECT id, question_text, options, correct_answer FROM questions WHERE id IN (${placeholders})`,
        selectedQuestionIds
      );
    }

    // Convert the UTC dates to Hong Kong time (adding 8 hours)
    const adjustTimeForHongKong = (mysqlDateTime) => {
      // Parse the MySQL datetime (stored in UTC by default with TIMESTAMP type)
      const date = new Date(mysqlDateTime);
      // Convert to Hong Kong time by adding the timezone offset
      const hkTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      // Return as ISO string without the Z to prevent automatic UTC interpretation
      return hkTime.toISOString().slice(0, -1);
    };

    // Return adjusted times without 'Z' suffix to prevent automatic UTC interpretation
    res.json({
      quiz: {
        ...quiz[0],
        startTime: adjustTimeForHongKong(quiz[0].startTime),
        endTime: adjustTimeForHongKong(quiz[0].endTime)
      },
      questions,
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// Submit quiz
app.post('/quiz/:id/submit', async (req, res) => {
  try {
    const { answers, startTime, endTime } = req.body;

    // Get the quiz data including selected question IDs
    const [quiz] = await pool.query(
      'SELECT endTime, selected_questions FROM quizzes WHERE id = ?', 
      [req.params.id]
    );
    
    if (!quiz.length) return res.status(404).json({ error: 'Quiz not found' });

    const quizEndTime = parseInt(quiz[0].endTime);
    const submitTime = Date.now();

    // Parse the selected questions
    let selectedQuestions = [];
    try {
        const rawQuestions = quiz[0].selected_questions;
        // Ensure it is string 
        if (typeof rawQuestions === 'string') {
            // clean the ilegal string
            const cleanedQuestions = rawQuestions.replace(/,\s*,/g, ',').replace(/,\s*]/g, ']');
            selectedQuestions = JSON.parse(cleanedQuestions);
        } else if (Array.isArray(rawQuestions)) {
            // ensure it is array
            selectedQuestions = rawQuestions;
        }
    } catch (err) {
        console.log('oringal json:', quiz[0].selected_questions);
        console.error('Error on submit:', err.message);
        selectedQuestions = []; // Empty
    }
    
    // If submission is after the quiz end time, score is 0
    let score = 0;

    if (submitTime <= quizEndTime) {
      // Fetch the correct answers for the selected questions
      const [questions] = await pool.query(
        'SELECT id, correct_answer FROM questions WHERE id IN (?)',
        [selectedQuestions]
      );

      // Create a map of question ID to correct answer
      const correctAnswers = new Map(
        questions.map(q => [parseInt(q.id), q.correct_answer])
      );
      
      // Create a map of submitted answers by question ID
      const answerMap = new Map(
        answers.map(a => [parseInt(a.questionId), a.answerChosen])
      );

      // Calculate score
      selectedQuestions.forEach(qId => {
        if (answerMap.get(qId) === correctAnswers.get(qId)) {
          score++;
        }
      });
    }

    // Save the quiz attempt
    await pool.query(
      'INSERT INTO quiz_attempts (quiz_id, startTime, endTime, answers, score) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, startTime, endTime, JSON.stringify(answers), score]
    );

    res.json({
      score,
      total: selectedQuestions.length,
      percentage: Math.round((score / selectedQuestions.length) * 100),
      expired: submitTime > quizEndTime
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get quiz results for review
app.get('/quiz/:id/results/:userId', async (req, res) => {
  try {
    // Check if the quiz exists and get selected questions
    const [quiz] = await pool.query(
      'SELECT id, selected_questions FROM quizzes WHERE id = ?',
      [req.params.id]
    );
    if (!quiz.length) return res.status(404).json({ error: 'Quiz not found' });

    // Parse the selected questions
    let selectedQuestionIds = [];
    try {
      const rawQuestions = quiz[0].selected_questions;
      if (typeof rawQuestions === 'string') {
        const cleanedQuestions = rawQuestions.replace(/,\s*,/g, ',').replace(/,\s*]/g, ']');
        selectedQuestionIds = JSON.parse(cleanedQuestions);
      } else if (Array.isArray(rawQuestions)) {
        selectedQuestionIds = rawQuestions;
      }
    } catch (err) {
      console.error('Error parsing selected questions:', err);
      selectedQuestionIds = []; 
    }

    // Fetch user's attempt
    const [attempts] = await pool.query(
      'SELECT answers, score FROM quiz_attempts WHERE quiz_id = ? ORDER BY startTime DESC LIMIT 1',
      [req.params.id]
    );

    if (!attempts.length) {
      return res.status(404).json({ error: 'No attempts found for this user' });
    }

    // Parse user answers
    let userAnswers = {};
    try {
      if (typeof attempts[0].answers === 'string') {
        const answersData = JSON.parse(attempts[0].answers);
        answersData.forEach(answer => {
          userAnswers[answer.questionId] = answer.answerChosen;
        });
      } else if (Array.isArray(attempts[0].answers)) {
        attempts[0].answers.forEach(answer => {
          userAnswers[answer.questionId] = answer.answerChosen;
        });
      }
    } catch (err) {
      console.error('Error parsing user answers:', err);
      console.log('Raw answers data:', attempts[0].answers);
    }

    // Fetch questions with correct answers
    let questions = [];
    if (selectedQuestionIds.length > 0) {
      const placeholders = selectedQuestionIds.map(() => '?').join(',');
      [questions] = await pool.query(
        `SELECT id, question_text, options, correct_answer FROM questions WHERE id IN (${placeholders})`,
        selectedQuestionIds
      );
    }

    res.json({
      userAnswers,
      score: attempts[0].score,
      questions // Include questions with correct answers in the response
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));