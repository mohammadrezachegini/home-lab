# Java Projects Collection

## Overview

This repository contains multiple Java applications that demonstrate different programming concepts and technologies. Each project shows various aspects of Java development including console applications, GUI programming, database connectivity, and object-oriented design.

## Projects Included

### 1. Java-BookSystem
A database-driven application that manages book information using Microsoft Access database.

**Features:**
- Connect to Microsoft Access database
- Display book information (title, authors, price)
- Read data from database tables
- Console-based interface

**Technologies:** Java, JDBC, Microsoft Access

### 2. Java-CoffeeMachine
A console application that simulates a coffee ordering system.

**Features:**
- Multiple coffee types (Latte, Americano, Cappuccino, Caramel Macchiato, Mocha)
- Different sizes (Small, Medium, Large)
- Add-ons (Milk, Cream, Sugar)
- Price calculation with tax
- Order confirmation system

**Technologies:** Java, Console I/O

### 3. Java-GPACalculator
A student grade management system that calculates GPA from course data.

**Features:**
- Read student reports from text files
- Calculate GPA based on grades and credits
- Display course information
- Support for multiple students

**Technologies:** Java, File I/O

### 4. Java-GameOfLife
Implementation of Conway's Game of Life cellular automaton.

**Features:**
- Grid-based simulation
- Automatic evolution based on game rules
- Console display
- Configuration from input files

**Technologies:** Java, Algorithms, File I/O

### 5. Java-JDBCDemo
Demonstration of database operations using JDBC.

**Features:**
- Employee database management
- CRUD operations (Create, Read, Update, Delete)
- Connection handling
- SQL query execution

**Technologies:** Java, JDBC, Microsoft Access

### 6. Java-QuizSystem
An electronic quiz system with database integration.

**Features:**
- Multiple choice and true/false questions
- Question creation and management
- Score calculation
- Database storage for questions

**Technologies:** Java, JDBC, Microsoft Access, OOP

### 7. Java-SkytrainFare
GUI application for calculating public transit fares.

**Features:**
- Station selection interface
- Fare calculation based on zones
- Multiple payment types
- Swing GUI implementation

**Technologies:** Java Swing, GUI, Database Integration

### 8. Java-StudentGrade
GUI application for managing student grades and courses.

**Features:**
- Student information display
- Grade updates
- Course enrollment tracking
- Database integration

**Technologies:** Java Swing, JDBC, Microsoft Access

## Requirements

### System Requirements
- Java Development Kit (JDK) 8 or higher
- Microsoft Access (for database projects)
- Windows/Linux/macOS operating system

### Dependencies
For database projects, you need UCanAccess drivers:
- commons-lang3-3.8.1.jar
- commons-logging-1.2.jar
- hsqldb-2.5.0.jar
- jackcess-3.0.1.jar
- ucanaccess-5.0.1.jar

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mohammadrezachegini/Java-Projects.git
   cd Java-Projects
   ```

2. **Choose a project:**
   ```bash
   cd Java-ProjectName
   ```

3. **Compile the project:**
   ```bash
   javac -d bin src/*.java
   ```

4. **Run the application:**
   ```bash
   java -cp bin MainClassName
   ```

## Project Structure

Each project follows a similar structure:
```
Project-Name/
├── src/                 # Source code files
├── bin/                 # Compiled class files
├── .classpath          # Eclipse classpath file
├── .project            # Eclipse project file
├── .settings/          # Eclipse settings
├── README.md           # Project-specific documentation
└── database-files/     # Database files (if applicable)
```

## Usage Examples

### Running the Coffee Machine
```bash
cd Java-CoffeeMachine
javac -d bin src/*.java
java -cp bin CoffeMachine
```

### Running the Book System
```bash
cd Java-BookSystem
javac -d bin src/*.java
java -cp bin BookSystem
```

### Running GUI Applications
For GUI projects like SkytrainFare:
```bash
cd Java-SkytrainFare
javac -d bin src/*.java
java -cp bin SkyTrain.SkyTrainMain
```

## Database Setup

For projects using Microsoft Access databases:

1. Ensure the database file (.accdb) is in the project directory
2. Configure the UCanAccess drivers in your classpath
3. Update connection strings if necessary

## Learning Objectives

These projects demonstrate:
- **Object-Oriented Programming:** Classes, inheritance, encapsulation
- **Database Programming:** JDBC, SQL queries, connection management
- **GUI Development:** Swing components, event handling
- **File I/O:** Reading and writing text files
- **Algorithm Implementation:** Game logic, calculations
- **Software Design:** MVC patterns, modular design

## Troubleshooting

### Common Issues

1. **Database Connection Problems:**
   - Check if database files are in correct location
   - Verify UCanAccess drivers are in classpath
   - Ensure Microsoft Access is installed

2. **Compilation Errors:**
   - Verify JDK version compatibility
   - Check classpath configuration
   - Ensure all dependencies are available

3. **Runtime Issues:**
   - Check file paths for input files
   - Verify database permissions
   - Ensure proper Java version
