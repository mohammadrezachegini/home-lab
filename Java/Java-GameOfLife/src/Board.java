/**
* <h1>Hello,Professor!!</h1>
* <p>
* This the implement a console application in Java. The application is a Conway's game called GameOfLife
* And this application calculate neighbors are alive or dead and store the neighbors for next generation
* </p>
* 
*
* @author  MohammadReza GoodarzvandChegini
* @StudentID 300354368
* @Email   goodarzvandcheginim@student.douglascollege.ca
* @since   2022/11/02 
*/



public class Board {

	// Default height and width of the board
	private static final int LENGTH = 20;

	private int width;
	private int height;
	public char[][] cells;
	int[][] board;


	public final static void clearConsole() {
		/*
		 * clearConsole method to clear the console if you are using Windows' command
		 * prompt or Linux-based system This method does not work in Eclipse IDE.
		 */
		try {
			final String os = System.getProperty("os.name");

			if (os.contains("Windows")) {
				new ProcessBuilder("cmd", "/c", "cls").inheritIO().start().waitFor();
			} else {
				Runtime.getRuntime().exec("clear");
			}
		} catch (final Exception e) {
			// Handle any exceptions.
		}
	}

	public void init() {
		/*
		 * Init method to create a 2-D array of characters, set all cells to space
		 * characters
		 */
		Board.clearConsole();
		cells = new char[height][width];
		for (int i = 0; i < height; i++) {
			for (int j = 0; j < width; j++) {
				cells[i][j] = ' ';
			}
		}
	}

	public Board() {
		/*
		 * Constructor to create a board with default height(20) and width(20)
		 */
		width = LENGTH;
		height = LENGTH;
		init();
	}

	public Board(int height, int width) {
		/*
		 * Constructor to create a board with height and width
		 */
		this.width = width;
		this.height = height;
		this.board = new int[width][height];
		init();
	}

	public void clear() {
		/*
		 * Set all cells to space characters
		 */
		for (int i = 0; i < height; i++) {
			for (int j = 0; j < width; j++) {
				cells[i][j] = ' ';
			}
		}
	}

	
	public void print() {
		Board.clearConsole();
        for (int y = 0; y < height; y++) {
            String line = " ";
            for (int x = 0; x < width; x++) {
                if (this.board[x][y] == 0) {
                    line += " ";
                } else {
                    line += "#";
                }
            }
            line += " ";
            System.out.println(line);
        }
    }
	
	// This method is for set state for alive cells
	
	public void setAlive(int x, int y) {
		// set state into 2d array
        this.board[x][y] = 1;
    }
	
	
	// This method is for set state for dead cells

    public void setDead(int x, int y) {
    	// set state into 2d array
        this.board[x][y] = 0;
    }
    
    
    // This method is calculate alive neighbors     
    public int countAliveNeighbours(int x, int y) {
        int count = 0;

        count += getState(x - 1, y - 1);
        count += getState(x, y - 1);
        count += getState(x + 1, y - 1);

        count += getState(x - 1, y);
        count += getState(x + 1, y);

        count += getState(x - 1, y + 1);
        count += getState(x, y + 1);
        count += getState(x + 1, y + 1);

        return count;
    }

    
    public int getState(int x, int y) {
        if (x < 0 || x >= width) {
            return 0;
        }

        if (y < 0 || y >= height) {
            return 0;
        }

        return this.board[x][y];
    }
    
    
    
    // This method is for current and next generation board and calculate alive neighbors
    
    public void step() {
        int[][] newBoard = new int[width][height];

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int aliveNeighbours = countAliveNeighbours(x, y);

                if (getState(x, y) == 1) {
                    if (aliveNeighbours < 2) {
                        newBoard[x][y] = 0;
                    } else if (aliveNeighbours == 2 || aliveNeighbours == 3) {
                        newBoard[x][y] = 1;
                    } else if (aliveNeighbours > 3) {
                        newBoard[x][y] = 0;
                    }
                } else {
                    if (aliveNeighbours == 3) {
                        newBoard[x][y] = 1;
                    }
                }

            }
           
        }
        

        this.board = newBoard;        
    }
    
    
	
	public int getWidth() {
		return width;
	}

	public void setWidth(int width) {
		this.width = width;
	}

	public int getHeight() {
		return height;
	}

	public void setHeight(int height) {
		this.height = height;
	}

	public char[][] getCells() {
		return cells;
	}

	public void setCells(char[][] cells) {
		this.cells = cells;
	}
}