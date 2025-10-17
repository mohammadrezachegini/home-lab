/**
* <h1>Hello,Professor!!</h1>
* <p>
* This the implement a console application in Java. The application is a game called Conway's GameOfLife
* And this application calculate neighbors are alive or dead and store the neighbors for next generation
* </p>
* 
*
* @author  MohammadReza GoodarzvandChegini
* @StudentID 300354368
* @Email   goodarzvandcheginim@student.douglascollege.ca
* @since   2022/11/02 
*/





import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class Main {

	final static String IN_FILE = "..\\input.txt";
	
	public static void main(String[] args) throws InterruptedException {
		
		
		
		BufferedReader br = null;
		int width;
		int height;
		int cellOne;
		int cellTwo;		
		
		try {
			br = new BufferedReader(new FileReader(IN_FILE));
			
			String line;
			
			
			height = Integer.parseInt(br.readLine());
			width = Integer.parseInt(br.readLine());

			
			Board bd = new Board(height,width);
			
			while ((line = br.readLine()) != null) {
				String[] tokens = line.split("\n");
				String[] str = tokens[0].split(" ");
				char charOne = str[0].charAt(0);
				char charTwo = str[1].charAt(0);
				cellOne = Integer.parseInt(String.valueOf(charOne));
				cellTwo = Integer.parseInt(String.valueOf(charTwo));				
				bd.setAlive(cellOne, cellTwo);
			}
			
			br.close();
			

			int i = 1;
			
			while(true) {
				bd.print();
				bd.step();
				System.out.println("Generation: " + i);
				TimeUnit.SECONDS.sleep(1);
				i++;
			}
			
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		
		


	}

}


