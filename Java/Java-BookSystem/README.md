# Java-BookSystem

## Overview
Java-BookSystem is a Java application designed to manage and display book information. The application connects to a Microsoft Access database to retrieve and display details about books, including their titles, authors, and prices. This project demonstrates basic database operations in Java, such as connecting to a database, executing SQL queries, and processing result sets.

## Features 
- **Database Connectivity:** Connects to a Microsoft Access database using JDBC.
- **Book Information Retrieval:** Retrieves book information from the database and stores it in Java objects.
- **Display Book Information:** Prints details of all books retrieved from the database, including titles, authors, and prices.
- **User-friendly Interface:** Simple and intuitive console interface for ease of use.

## Requirements
- Java Development Kit (JDK) 8 or higher
- Microsoft Access or a compatible DBMS installed
- The database file `BookDB.accdb` set up with a `Books` table

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/Java-BookSystem.git
    cd Java-BookSystem
    ```

2. **Compile the project:**
    ```sh
    javac -d bin src/*.java
    ```

3. **Run the application:**
    ```sh
    java -cp bin BookSystem
    ```

## Database Setup

1. **Create the `Books` table in Microsoft Access:**
    - Open `BookDB.accdb` in Microsoft Access.
    - Create a table named `Books` with the following columns:
      - `ID` (AutoNumber, Primary Key)
      - `Title` (Text)
      - `Author` (Text)
      - `Price` (Currency)

2. **Populate the `Books` table with sample data:**
    - Add a few sample entries to test the application.

## Usage
- The application will connect to the `BookDB.accdb` database.
- It will retrieve and display information about books stored in the `Books` table.
- Follow the on-screen prompts to interact with the application.

## Project Structure

- `src/`: Contains the Java source code files.
  - `Book.java`: Represents a Book object with properties such as title, author, and price.
  - `BookDatabase.java`: Handles database operations such as connecting to the database and retrieving book information.
  - `BookSystem.java`: The main class that runs the application and interacts with the user.
- `bin/`: Directory for compiled Java classes.
- `.classpath`: Eclipse project classpath file.
- `.project`: Eclipse project file.
- `BookDB.accdb`: Microsoft Access database file.
- `README.md`: This file.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Java Programming Community
- Contributors and Supporters

## Troubleshooting
- **Database Connection Issues:** Ensure that the `BookDB.accdb` file is in the correct directory and that the JDBC-ODBC bridge is properly configured.
- **Compilation Errors:** Make sure you have the correct version of the JDK installed and that your `classpath` is set up correctly.

