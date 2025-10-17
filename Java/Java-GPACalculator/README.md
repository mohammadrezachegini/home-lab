# Java-GPACalculator

## Overview
Java-GPACalculator is a console-based application designed to manage and display student course information. It processes student reports from text files, displaying course enrollments and calculating the GPA based on grades and credits. This application is a useful tool for educational institutions or individual educators to track student performance efficiently.

## Features
- **Read Student Reports:** Process student reports from text files, each named after a student's ID.
- **Display Courses:** List all courses a student is enrolled in, along with their grades and credits.
- **Calculate GPA:** Compute the GPA based on course credits and grades using a standard grading scale.
- **User-friendly Interface:** Simple and intuitive console interface for ease of use.
- **Dynamic File Handling:** Automatically reads student data from text files.

## Requirements
- Java Development Kit (JDK) 8 or higher

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/Java-GPACalculator.git
    cd Java-GPACalculator
    ```

2. **Compile the project:**
    ```sh
    javac -d bin src/*.java
    ```

3. **Run the application:**
    ```sh
    java -cp bin GPACalculator
    ```

## Usage
- Ensure student report files are in the same directory as the application.
- The file names should be the student IDs (e.g., `300123456.txt`).
- Each report file should contain lines formatted as `CourseCode Grade Credit`.
- Follow the on-screen prompts to enter student IDs and view their course details and GPA.

## Project Structure

- `src/`: Contains the Java source code files.
- `bin/`: Directory for compiled Java classes.
- `.classpath`: Eclipse project classpath file.
- `.project`: Eclipse project file.
- `sample-reports/`: Directory containing sample student report files.
- `README.md`: This file.

## Sample Student Report File
Example of `300123456.txt`:
