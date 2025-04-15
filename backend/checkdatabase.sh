DB_NAME="quizdb"
DB_USER="root"
DB_PASS="password"
INIT_FILE="init.sql" 


mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "SELECT * FROM users;"

mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "SELECT * FROM quizzes;"

mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "SELECT * FROM quiz_attempts;"

mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "SELECT * FROM questions;"