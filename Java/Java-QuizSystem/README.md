# Java-QuizSystem

## Overview
Java-QuizSystem is a console-based quiz application designed to test users on programming concepts. The system supports various types of questions, including multiple-choice and true/false questions. It dynamically fetches questions from a Microsoft Access database, presents them to the user, and evaluates the responses to calculate the user's score.

## Features
- **Dynamic Question Loading:** Questions are loaded from a Microsoft Access database, allowing for a flexible and expandable question set.
- **Support for Multiple Question Types:** The system can handle different types of questions, including multiple-choice and true/false.
- **Interactive User Interface:** Users interact with the quiz through the console, receiving immediate feedback on their answers.
- **Score Calculation:** The system calculates the user's score based on the correctness of their answers.

## Requirements
- Java Development Kit (JDK) 8 or higher
- Microsoft Access or a compatible DBMS installed
- The database file `Question.accdb` set up with the required schema

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/Java-QuizSystem.git
    cd Java-QuizSystem
    ```

2. **Compile the project:**
    ```sh
    javac -d bin src/*.java
    ```

3. **Run the application:**
    ```sh
    java -cp bin QuizSystem
    ```

## Database Setup

1. **Create the `Questions` table in Microsoft Access:**
    - Open `Question.accdb` in Microsoft Access.
    - Create a table named `Questions` with the following columns:
      - `ID` (AutoNumber, Primary Key)
      - `QText` (Text) - The question text
      - `Answer` (Text) - The correct answer
      - `Point` (Number) - The point value of the question
      - `Type` (Text) - The type of question (e.g., MC for multiple-choice, TF for true/false)

2. **Populate the `Questions` table with sample data:**
    - Add sample questions to test the application.

## Usage
- The application will connect to the `Question.accdb` database.
- It will retrieve and display questions to the user.
- Users will input their answers through the console.
- The application will provide feedback on the correctness of each answer and calculate the total score.

## Project Structure

- `src/`: Contains the Java source code files.
  - `Question.java`: Represents a Question object with properties such as text, answer, point, and type.
  - `QuizDatabase.java`: Handles database operations such as connecting to the database and retrieving questions.
  - `QuizSystem.java`: The main class that runs the application and interacts with the user.
- `bin/`: Directory for compiled Java classes.
- `.classpath`: Eclipse project classpath file.
- `.project`: Eclipse project file.
- `Question.accdb`: Microsoft Access database file.
- `README.md`: This file.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Java Programming Community
- Contributors and Supporters

## Troubleshooting
- **Database Connection Issues:** Ensure that the `Question.accdb` file is in the correct directory and that the JDBC-ODBC bridge is properly configured.
- **Compilation Errors:** Make sure you have the correct version of the JDK installed and that your `classpath` is set up correctly.

## Contact
For any issues or questions, please open an issue in the repository or contact the repository owner.
