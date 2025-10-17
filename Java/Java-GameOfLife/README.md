# Java-GameOfLife

## Overview
Java-GameOfLife is a console-based implementation of Conway's Game of Life. The game is a cellular automaton devised by John Horton Conway in 1970, which simulates the life and death of cells on a grid based on a set of simple rules.

## Features
- **Console-based Simulation:** Runs in the terminal or command prompt, displaying the grid and generations.
- **Customizable Initial State:** Users can set the initial state of the grid by specifying alive cells.
- **Automatic Evolution:** The game evolves automatically following Conway's Game of Life rules.

## Rules
1. **Birth:** A dead cell with exactly three live neighbors becomes alive.
2. **Death:** A live cell with fewer than two or more than three live neighbors dies.
3. **Survival:** A live cell with two or three live neighbors continues to live.

## Requirements
- Java Development Kit (JDK) 8 or higher

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/Java-GameOfLife.git
    cd Java-GameOfLife
    ```

2. **Compile the project:**
    ```sh
    javac -d bin src/*.java
    ```

3. **Run the application:**
    ```sh
    java -cp bin GameOfLife
    ```

## Usage
- Follow the on-screen prompts to set the initial configuration of the grid.
- The application will display the grid and its evolution over generations.

## Project Structure

- `src/`: Contains the Java source code files.
- `bin/`: Directory for compiled Java classes.
- `.classpath`: Eclipse project classpath file.
- `.project`: Eclipse project file.
- `input.txt`: Text file for input configuration (if used).
- `README.md`: This file.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- John Horton Conway for creating the Game of Life.
- Java Programming Community
- Contributors and Supporters

