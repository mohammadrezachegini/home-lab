import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.Scanner;

public class Course {

	
	private  int credit;
	private  String grade;
	private  String course;

	public Course() {
		
	}

	public Course(int credit, String grade, String course) {
		super();
		this.credit = credit;
		this.grade = grade;
		this.course = course;
	}
	
	public int getCredit() {
		return credit;
	}
	public void setCredit(int credit) {
		this.credit = credit;
	}
	public String getGrade() {
		return grade;
	}
	public void setGrade(String grade) {
		this.grade = grade;
	}
	public String getCourse() {
		return course;
	}
	public void setCourse(String course) {
		this.course = course;
	}
	
	
	public static void displayMenu() {
		Scanner scanner = new Scanner(System.in);
		System.out.println("Welcome to Student Info. System.\n");
		
		String choice;
		int studentID;

		double marks = 0;

		
		
		while(true) {
			
			System.out.println("Please select an option:\n(R)ead a student report\n(S)how all courses and GPA\n(E)xit\nEnter your option >>");
			choice = scanner.next();
			
			String option;
			int count = 0;
//			int credit = 0;
			
			if(choice.equals("R")) {
				System.out.println("Enter the student ID >>");
				studentID = scanner.nextInt();
				System.out.println("Please select an option:\n(R)ead a student report\n(S)how all courses and GPA\n(E)xit\nEnter your option >>");
				option = scanner.next();
				if(option.equals("S")) {

					final String IN_FILE = Integer.toString(studentID) +".txt";
					BufferedReader br = null;
					try {
						br = new BufferedReader(new FileReader(IN_FILE));
						String line;
						
						while ((line = br.readLine()) != null) {
							String[] toks = line.split(",");
							System.out.printf("Course #%d: (%s credit): %s\n", ++count,toks[1],toks[2]);
					
							if(toks[2].equals("A+")) {
								
								
								credit += Integer.parseInt(toks[1]);
								marks += 4.3 * Integer.parseInt(toks[1]);

								
							}
							else if(toks[2].equals("A")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 4.0 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("A-")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 3.7 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("B+")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 3.3 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("B")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 3.0 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("B-")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 2.7 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("C+")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 2.3 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("C")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 2.0 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("C-")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 1.7 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("D+")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 1.3 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("D")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 1.0 * Integer.parseInt(toks[1]);

							}
							else if(toks[2].equals("F")) {
								
								credit += Integer.parseInt(toks[1]);
								marks += 0 * Integer.parseInt(toks[1]);

							}
						}
					} catch (IOException e) {
						e.printStackTrace();
					}
					double gpa = marks / credit;
					System.out.printf("GPA: %.2f\n",gpa);
					
				}
				else if(option.equals("E")) {
					System.out.println("Thank you for using!");
					break;
				}
			
			}	
			else if(choice.equals("E")) {
				System.out.println("Thank you for using!");
				break;
			}
		}	
		
		
		
		
	}
	
	
}
