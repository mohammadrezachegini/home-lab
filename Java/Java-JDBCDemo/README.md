# SkyTrain Fare Checker

## Overview

The SkyTrain Fare Checker is a Java-based application designed to allow users to calculate the fare between two stations within the SkyTrain network. Featuring a graphical user interface (GUI), it offers an intuitive way for users to select their journey's start and end points, choose their fare type, and categorize themselves as either an adult or a concession for accurate fare calculation. The application is backed by a database to retrieve the latest station and line information, ensuring up-to-date fare calculations.

## Features

- **Interactive GUI:** A user-friendly interface for selecting stations and fare types.
- **Dynamic Fare Calculation:** Calculates fares based on user selections, including station zones, payment methods, and passenger types.
- **Database Integration:** Utilizes a database to store and retrieve station information, ensuring up-to-date fare calculations.
- **Customizable Options:** Supports various payment methods and passenger types for accurate fare estimation.

## Requirements

- Java Development Kit (JDK) 8 or higher
- Microsoft Access or a compatible DBMS installed
- The database file `SkytrainFare.accdb` set up with the required schema

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/Java-SkytrainFare.git
    cd Java-SkytrainFare
    ```

2. **Compile the project:**
    ```sh
    javac -d bin src/*.java
    ```

3. **Run the application:**
    ```sh
    java -cp bin SkyTrainFare
    ```

## Database Setup

1. **Create the necessary tables in Microsoft Access:**
    - Open `SkytrainFare.accdb` in Microsoft Access.
    - Create tables named `Stations`, `Fares`, and `Zones` with the following columns:
      - **Stations:** `ID` (AutoNumber, Primary Key), `StationName` (Text), `ZoneID` (Number, Foreign Key)
      - **Fares:** `ID` (AutoNumber, Primary Key), `StartStationID` (Number, Foreign Key), `EndStationID` (Number, Foreign Key), `Fare` (Currency)
      - **Zones:** `ID` (AutoNumber, Primary Key), `ZoneName` (Text)

2. **Populate the tables with sample data:**
    - Add sample stations, fares, and zone entries to test the application.

## Usage

- The application will connect to the `SkytrainFare.accdb` database.
- It will display a GUI for selecting start and end stations, fare type, and passenger type.
- Users can calculate and view the fare for their selected journey.

## Project Structure

- `src/`: Contains the Java source code files.
  - `Station.java`: Represents a Station object with properties such as ID, name, and zone.
  - `Fare.java`: Represents a Fare object with properties such as start station ID, end station ID, and fare amount.
  - `Zone.java`: Represents a Zone object with properties such as ID and name.
  - `Database.java`: Handles database operations such as connecting to the database and retrieving fare information.
  - `SkyTrainFare.java`: The main class that runs the application and interacts with the user.
- `bin/`: Directory for compiled Java classes.
- `.classpath`: Eclipse project classpath file.
- `.project`: Eclipse project file.
- `SkytrainFare.accdb`: Microsoft Access database file.
- `README.md`: This file.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Java Programming Community
- Contributors and Supporters

## Troubleshooting

- **Database Connection Issues:** Ensure that the `SkytrainFare.accdb` file is in the correct directory and that the JDBC-ODBC bridge is properly configured.
- **Compilation Errors:** Make sure you have the correct version of the JDK installed and that your `classpath` is set up correctly.

## Contact

For any issues or questions, please open an issue in the repository or contact the repository owner.

## Screenshots

### Main Screen
![Main Screen](path/to/screenshot1.png)

### Fare Calculation
![Fare Calculation](path/to/screenshot2.png)

