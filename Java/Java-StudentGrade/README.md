# Java-StudentGrade

## Overview
Java-StudentGrade is a graphical user interface (GUI) application designed to manage student courses and grades. The application allows users to view student details, including courses enrolled and grades received, as well as update student grades. It interacts with a Microsoft Access database to retrieve and update information.

## Features
- **Database Connectivity:** Connects to a Microsoft Access database to fetch and update student information.
- **View Student Information:** Displays a list of students, their enrolled courses, and current grades.
- **Update Grades:** Allows the user to update the grades for any course enrolled by a student.
- **Grade Enumeration:** Utilizes an enumeration for grades to standardize grade values within the application.

## Requirements
- Java Development Kit (JDK) 8 or higher
- Microsoft Access or a compatible DBMS installed

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/Java-StudentGrade.git
    cd Java-StudentGrade
    ```

2. **Compile the project:**
    ```sh
    javac -d bin src/*.java
    ```

3. **Run the application:**
    ```sh
    java -cp bin StudentGrade
    ```

## Database Setup

1. **Create the necessary tables in Microsoft Access:**
    - Open `Studentcourse.accdb` in Microsoft Access.
    - Create tables named `Students`, `Courses`, and `Grades` with the following columns:
      - **Students**: `ID` (AutoNumber, Primary Key), `Name` (Text)
      - **Courses**: `ID` (AutoNumber, Primary Key), `CourseName` (Text)
      - **Grades**: `StudentID` (Number, Foreign Key), `CourseID` (Number, Foreign Key), `Grade` (Text)

2. **Populate the tables with sample data:**
    - Add sample entries to test the application.

## Usage
- The application will connect to the `Studentcourse.accdb` database.
- It will display students and their course enrollments.
- Users can update grades through the GUI.

## Project Structure

- `src/`: Contains the Java source code files.
  - `Student.java`: Represents a Student object with properties such as ID and name.
  - `Course.java`: Represents a Course object with properties such as ID and course name.
  - `Grade.java`: Represents a Grade object with properties such as student ID, course ID, and grade.
  - `Database.java`: Handles database operations such as connecting to the database and retrieving/updating student information.
  - `StudentGrade.java`: The main class that runs the application and interacts with the user.
- `bin/`: Directory for compiled Java classes.
- `.classpath`: Eclipse project classpath file.
- `.project`: Eclipse project file.
- `Studentcourse.accdb`: Microsoft Access database file.
- `README.md`: This file.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Java Programming Community
- Contributors and Supporters

## Troubleshooting
- **Database Connection Issues:** Ensure that the `Studentcourse.accdb` file is in the correct directory and that the JDBC-ODBC bridge is properly configured.
- **Compilation Errors:** Make sure you have the correct version of the JDK installed and that your `classpath` is set up correctly.

## Contact
For any issues or questions, please open an issue in the repository or contact the repository owner.
