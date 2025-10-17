/**
* 
* It is an application for implementing an electronic programming quiz system. 
* Users can create questions and preview the quiz.
* 
* @author  Mohammad Reza Goodarzvand Chegini
* @StudentID 300354368
* @Email goodarzvandcheginim@student.douglascollege.ca
* @since   2022-11-24
*  
*/


import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Scanner;

public class Asgn03 {

	static Connection connection = null;
	static Statement statement = null;
	static ResultSet resultSet = null;
	
	static double finalRes = 0;
	static String question;
	static double point;
	
	
	// creating a connection for connecting to DB 
 
	
	public static void InitDB() {
		try {
			Class.forName("net.ucanaccess.jdbc.UcanaccessDriver");
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}
		
		String msAccDB = "Question.accdb";
		String dbURL = "jdbc:ucanaccess://" + msAccDB;
		
		try {
			connection = DriverManager.getConnection(dbURL);
			statement = connection.createStatement();
		} catch (SQLException e) {
			e.printStackTrace();
		}
		
	}
	
	// Fetching Data from the database and process the ArrayList and database's data then passing the result to the object class 
	
	public static void readDB() {
		
		String sqlStr = "SELECT * FROM Questions";
		
		Scanner scanner = new Scanner(System.in);
		String sc;
		try {
			resultSet = statement.executeQuery(sqlStr);
			while (resultSet.next()) {
				int id = resultSet.getInt("ID");
				String question = resultSet.getString("QText");
				String answer = resultSet.getString("Answer");
				double point = resultSet.getDouble("Point");
				String type = resultSet.getString("Type");
				System.out.println(question + " (" + point +" Points)");
				
				
				if(type.equals("TF")) {
					
					TFQuestion tfQuestion = new TFQuestion(question, Boolean.valueOf(answer), point);
					System.out.println("Enter your Choice >> ");
					sc = scanner.next();
					if(sc.equals("T")) {
						tfQuestion.checkAnswer("true");
					}
					if(sc.equals("F")) {
						tfQuestion.checkAnswer("false");
					}
					
					tfQuestion.getCorrectAnswer();
					finalRes += tfQuestion.total;
				}
				
				
				if(type.equals("MC")) {
					
					ArrayList<String> option = new ArrayList<>();
					
					String[] mc = answer.split("##");
					
					
					for(int j = 0; j < mc.length; j++) {
						
						if(j == 0) {
							option.add("A: " + mc[j]);
						}
						if(j == 1) {
							option.add("B: " + mc[j]);
						}
						if(j == 2) {
							option.add("C: " + mc[j]);
						}
						if(j == 3) {
							option.add("D: " + mc[j]);
						}
						
						if(j == 4) {
							option.add("E: " + mc[j]);
						}
						
						
					}
					
					MCQuestion mcQuestion = new MCQuestion(question, option, point);
					
					for(int j = 0; j < mc.length; j++) {
						
						
						
						if((j == 0) && (mc[j].contains("*") ==  true)) {
							System.out.println(mc[j].replace("*", ""));
						}
						
						if((j == 0) && (mc[j].contains("*") ==  false)) {
							System.out.println(mc[j]);
						}
						if((j == 1) && (mc[j].contains("*") ==  true)) {
							System.out.println(mc[j].replace("*", ""));
						}
						
						if((j == 1) && (mc[j].contains("*") ==  false)) {
							System.out.println(mc[j]);
						}
						
						if((j == 2) && (mc[j].contains("*") ==  true)) {
							System.out.println(mc[j].replace("*", ""));
						}
						
						if((j == 2) && (mc[j].contains("*") ==  false)) {
							System.out.println(mc[j]);
						}
						
						
						if((j == 3) && (mc[j].contains("*") ==  true)) {
							System.out.println(mc[j].replace("*", ""));
						}
						
						if((j == 3) && (mc[j].contains("*") ==  false)) {
							System.out.println(mc[j]);
						}
						if((j == 4) && (mc[j].contains("*") ==  true)) {
							System.out.println(mc[j].replace("*", ""));
						}
						
						if((j == 4) && (mc[j].contains("*") ==  false)) {
							System.out.println(mc[j]);
						}
						
						
					}
					
					
					System.out.println("Enter your Choice >> ");
					sc = scanner.next();
					mcQuestion.checkAnswer(sc);
					mcQuestion.getCorrectAnswer();
					finalRes += mcQuestion.total;
			}
				

			}
			
			System.out.println("The quiz ends. Your score is " + finalRes + ".");
			finalRes = 0;
			
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	
	// Insert Data into Database
	
	public static void insertData(String QText, String Answer, double point, String Type) {
		
		
		String sqlStr = "INSERT INTO Questions (QText, Answer, Point, Type) VALUES " + "('" + QText +  "', " + "'" + Answer + "', " + point + ", " + "'" + Type + "' "  + ")" ;
		
		
		try {
			statement.executeUpdate(sqlStr);
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	// Disconnect from database
	
	public static void closeDB() {
		try {
			
			connection.close();
			statement.close();
			resultSet.close();
			
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	
	// It receives information from the user for the mc question and sends them to the database
	
	public static void createMCQuestion() {
		
		Scanner scanner = new Scanner(System.in);
		Scanner scanner2 = new Scanner(System.in);
		Scanner scanner3 = new Scanner(System.in);
		Scanner scanner4 = new Scanner(System.in);
		int options;
		String mcAnswer = "";
		String mcAnswerTemp = "";
		
		System.out.println("Enter the question text >> ");
		question = scanner4.nextLine();
		
		System.out.println("How many options? ");
		options = scanner2.nextInt();
		
		if(options == 3) {
			
			
			String[] mc1;

			String Answer;
			
			System.out.println("Enter Option A (Start with * for correct answer) >> ");
			mcAnswerTemp = "A: " + scanner3.next();
			
			
			mcAnswer += mcAnswerTemp;
			
			System.out.println("Enter Option B (Start with * for correct answer) >> ");
			mcAnswerTemp = "B: " + scanner3.next();
			
			
			mcAnswer += "##" + mcAnswerTemp;
			System.out.println("Enter Option C (Start with * for correct answer) >> ");
			mcAnswerTemp = "C: " + scanner3.next();
			
			
			mcAnswer += "##" + mcAnswerTemp + "##";
			System.out.println("How many points? ");
			point = scanner2.nextDouble();
			
			insertData(question, mcAnswer, point, "MC");
		}
		
		if(options == 4) {
			
			
			
			System.out.println("Enter Option A (Start with * for correct answer) >> ");
			mcAnswerTemp = "A: " +  scanner3.next();
			mcAnswer += mcAnswerTemp;
			System.out.println("Enter Option B (Start with * for correct answer) >> ");
			mcAnswerTemp = "B: " +  scanner3.next();
			mcAnswer += "##" + mcAnswerTemp;
			System.out.println("Enter Option C (Start with * for correct answer) >> ");
			mcAnswerTemp = "C: " + scanner3.next();
			mcAnswer += "##" + mcAnswerTemp;
			System.out.println("Enter Option D (Start with * for correct answer) >> ");
			mcAnswerTemp = "D: " + scanner3.next();
			mcAnswer += "##" + mcAnswerTemp + "##";
			System.out.println("How many points? ");
			point = scanner2.nextDouble();
			insertData(question, mcAnswer, point, "MC");
		}
		
		if(options == 5) {
			
			
			System.out.println("Enter Option A (Start with * for correct answer) >> ");
			mcAnswerTemp = "A: " +  scanner3.next();
			mcAnswer += mcAnswerTemp;
			System.out.println("Enter Option B (Start with * for correct answer) >> ");
			mcAnswerTemp = "B: " + scanner3.next();
			mcAnswer += "##" + mcAnswerTemp;
			System.out.println("Enter Option C (Start with * for correct answer) >> ");
			mcAnswerTemp = "C: " + scanner3.next();
			mcAnswer += "##" + mcAnswerTemp;
			System.out.println("Enter Option D (Start with * for correct answer) >> ");
			mcAnswerTemp = "D: " + scanner3.next();
			mcAnswer += "##" + mcAnswerTemp;
			System.out.println("Enter Option E (Start with * for correct answer) >> ");
			mcAnswerTemp = "E: " + scanner3.next();
			mcAnswer += "##" + mcAnswerTemp + "##";
			System.out.println("How many points? ");
			point = scanner2.nextDouble();
			insertData(question, mcAnswer, point, "MC");
		}
		
		if((options > 5) || (options < 3)) {
			System.out.println("The minimum option is 3 and the maximum option is 5");
		}
	}
	
	// It receives information from the user for the tf question and sends them to the database

	public static void createTFQuestion() {
		
		Scanner scanner = new Scanner(System.in);
		String answer;
		System.out.println("Enter the question text >> ");
		question = scanner.nextLine();
		System.out.println("Answer is True or False?");
		answer = scanner.next();
		System.out.println("How many points? ");
		point = scanner.nextDouble();
		insertData(question, answer, point, "TF");
	}
	
	public static void main(String[] args) {
		
		String choice;
		String qType;
		
		InitDB();		
		
		Scanner scanner = new Scanner(System.in);
		
		
		int i = 0;
		
		while(true) {
			
			System.out.println("Please choose (c)reate a question, (p)review or (e)xit >> ");
			choice = scanner.next();
			
			if(choice.equals("c")) {
				
				System.out.println("Enter the type of question (MC or TF) >> ");
				qType = scanner.next();
				
				if(qType.equals("MC")) {
					
					createMCQuestion();
					
				}
				
				if(qType.equals("TF")) {
					
					createTFQuestion();
				}
				
				if(!(qType.equals("TF")) && (qType.equals("MC")) ) {
					continue;
				}
				
			}
			
			
			if(choice.equals("p")) {
				readDB();
				closeDB();
				
			}
			
			if(choice.equals("e")) {
				System.out.println("Goodbye!");
				
				break;
			}
			
			i++;
		}
		

		

	}

}
