# COMP3421 Project (COMP3421-25-P8) 
This is PolyU 2024-2025 Sem 2 COMP3421 Project - Online Quiz Application with Timer (COMP3421-25-P8) 
devopled by Chan Chun Hei 23112503d.

Note: Please do not copy or distribute this project without proper authorization.

---

## Project Overview

This project is an online quiz application with a timer feature. It allows users to register, log in, create quizzes, take quizzes, and review their results. The application is built with a React frontend and an Express backend, with a MySQL database for data storage.

---

## Features

- **User Authentication**: Register and log in with a username and password.
- **Quiz Management**: Create quizzes with random questions from a question pool.
- **Timer Functionality**: Quizzes have a countdown timer to ensure timely completion.
- **Quiz Review**: Users can review their answers and see the correct answers after completing a quiz.
- **Responsive Design**: The application is designed to work on both desktop and mobile devices brower.

---

## Local Setup

### Prerequisites

1. **Node.js**: Install Node.js (version 16 or higher).
2. **MySQL**: Install MySQL and set up a database.

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/COMP3421_Project.git
   cd COMP3421_Project/backend
   ```

2. Create a `.env` file in the `backend` directory with the following content:
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=quizdb
   DB_PORT=3306
   ```

3. Initialize the database using the `init.sql` file:
   ```bash
   mysql -u your_mysql_username -p < init.sql
   ```
   or run the script `backend/reset_db.sh`
   ```bash
   ~/COMP3421_Project/backend$ ./reset_db.sh
   ```

4. Install backend dependencies:
   ```bash
   npm install
   ```

5. Start the backend server:
   ```bash
   npm run
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```

2. Create a `.env` file in the `frontend` directory with the following content:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

3. Install frontend dependencies:
   ```bash
   npm install
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

### While Running

1. push the question pool into the database. Sample Question contained in `backend/samplequestion.json`

    ```javascript
    const response = await axios.post('https://API-HOST-ADDRESS/quizzes_question_push', {
      questions: [
        {
          question_text: "What is the capital of France?",
          options: ["Paris", "London", "Berlin", "Madrid"],
          correctAnswer: "Paris"
        },
        {
          question_text: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correctAnswer: "4"
        },
        ...
      ]
    });
    ```
    Reponse
    ```json
    {
        "message": "Questions added successfully"
    }
    ```


2. You can check the databse table by run the script `backend/checkdatabase.sh`

    ```
    ~/COMP3421_Project/backend$ ./checkdatabase.sh
    ```

---

## Online Hosting

To host the project online, follow these steps:

### Database Hosting

1. Deploy the database to a hosting platform that supports MySQL (e.g., Amazon RDS for MySQL ).
2. Set and review the database env data for later use.
2. Ensure the database is accessible from the hosting platform (e.g., allowlist the hosting platform's IP address in your MySQL server).

### Backend Hosting

1. Deploy the backend to a hosting platform that supports Node.js (e.g., Vercel, AWS Lambda, or Heroku).
2. Set the environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) in the hosting platform's configuration.
3. Ensure the database is accessible from the hosting platform (e.g., allowlist the hosting platform's IP address in your MySQL server).

### Frontend Hosting

1. Deploy the frontend to a hosting platform that supports React (e.g., Vercel or Netlify).
2. Set the `REACT_APP_API_URL` environment variable to the backend's URL.

### Data Configtion

---

## Testing

### Manual Testing for API using frontend

1. **Register**: Create a new user account.
2. **Login**: Log in with the registered account.
3. **Create Quiz**: Create a new quiz and verify that it appears in the quiz list.
4. **Take Quiz**: Start a quiz, answer the questions, and submit the quiz.
5. **Review Quiz**: Review the quiz results and verify the correct answers.

Or you can using some API call techqiue like `Postman` or `Insomnia`


---

## Troubleshooting

1. **Database Connection Issues**:
   - Ensure the database credentials in the `.env` file are correct.
   - Verify that the MySQL server is running and accessible.

2. **Frontend Not Connecting to Backend**:
   - Check the `REACT_APP_API_URL` value in the frontend `.env` file.
   - Ensure the backend server is running and accessible.
   - Check the error code on the brower console

3. **Hosting Issues**:
   - Verify that the environment variables are correctly set in the hosting platform.
   - Check the hosting platform's logs for errors.

---

## Folder Structure

```
COMP3421_Project/
├── backend/
│   ├── api/                # Backend API code
│   ├── init.sql            # Database schema
│   ├── .env                # Backend environment variables
│   ├── package.json        # Backend dependencies
│   └── ...                 # Other backend files
├── frontend/
│   ├── src/                # Frontend source code
│   ├── public/             # Public assets (like app icon)
│   ├── .env                # Frontend environment variables
│   ├── package.json        # Frontend dependencies
│   └── ...                 # Other frontend files
└── README.md               # Project documentation
```

---

## License

This project is for educational purposes only and is not licensed for commercial use.