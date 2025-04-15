#!/bin/bash

DB_NAME="quizdb"
DB_USER="root"
DB_PASS="password"
INIT_FILE="init.sql" 

mysql -u$DB_USER -p$DB_PASS -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME;"
echo "Database $DB_NAME has been dropped and recreated."


mysql -u$DB_USER -p$DB_PASS $DB_NAME < $INIT_FILE
echo "Database $DB_NAME has been initialized with $INIT_FILE."


