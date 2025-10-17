/**
* 
* It is a subclass of Question
* It represents a multiple-choice question. A multiple-choice question may have 3-5 options.
* 
* @author  Mohammad Reza Goodarzvand Chegini
* @StudentID 300354368
* @Email goodarzvandcheginim@student.douglascollege.ca
* @since   2022-11-24
*  
*/


import java.util.ArrayList;

public class MCQuestion extends Question {
	
	ArrayList<String> options = new ArrayList<>();
	protected String answer;
	protected double total = 0;
	
	public MCQuestion() {
		super();
	}


	public MCQuestion( String questionText,ArrayList<String> options, double point ) {
		super();
		this.options = options;
		this.questionText = questionText;
		this.point = point;
	}


	public ArrayList<String> getOptions() {
		return options;
	}


	public void setOptions(ArrayList<String> options) {
		this.options = options;
	}


	public String getAnswer() {
		return answer;
	}


	public void setAnswer(String answer) {
		this.answer = answer;
	}


	@Override
	public void checkAnswer(String answer) {
		
		this.answer  = answer;
		
	}


	@Override
	public void getCorrectAnswer() {
		
		String correct = "";
		
		
		for (int j = 0; j < getOptions().size();j++) 
	      { 		      

	          
				if((getOptions().get(j).contains("*") ==  true)) {
					if(getOptions().get(j).contains("A:") ==  true) {
							correct = "A";
					}
					if(getOptions().get(j).contains("B:") ==  true) {
							correct = "B";
						}
					if(getOptions().get(j).contains("C:") ==  true) {
							correct = "C";
					}
					if(getOptions().get(j).contains("D:") ==  true) {
							correct = "D";

					}
					if(getOptions().get(j).contains("E:") ==  true) {
							correct = "E";
					}

				}
				

			}
		
		
		for (int j = 0; j < getOptions().size();j++) 
	      { 		      

	          
				if((j == 0) && (getOptions().get(j).contains("*") ==  true)  && (String.valueOf(getOptions().get(j).charAt(0)).equals(this.answer))) {
					System.out.println("You are correct!");
					total += this.point;
					break;
				}
				
				else if((j == 0) && (getOptions().get(j).contains("*") !=  true)) {
					continue;
				}
				
	          	if((j == 1) && (getOptions().get(j).contains("*") ==  true)  && (String.valueOf(getOptions().get(j).charAt(0)).equals(this.answer))) {
					System.out.println("You are correct!");
					total += this.point;
					break;
				}
	          	
	          	else if((j == 1) && (getOptions().get(j).contains("*") !=  true)) {
					continue;
				}
				
				
				if((j == 2) && (getOptions().get(j).contains("*") ==  true)  && (String.valueOf(getOptions().get(j).charAt(0)).equals(this.answer))) {
					System.out.println("You are correct!");
					total += this.point;
					break;
				}
				
				else if((j == 2) && (getOptions().get(j).contains("*") !=  true)) {
					continue;
				}

				
				if((j == 3) && (getOptions().get(j).contains("*") ==  true)  && (String.valueOf(getOptions().get(j).charAt(0)).equals(this.answer))) {
					System.out.println("You are correct!");
					total += this.point;
					break;
				}
				
				else if((j == 3) && (getOptions().get(j).contains("*") !=  true)) {
					continue;
				}
	
				if((j == 4) && (getOptions().get(j).contains("*") ==  true) && (String.valueOf(getOptions().get(j).charAt(0)).equals(this.answer))) {
					System.out.println("You are correct!");
					total += this.point;
					break;
				}
				
				else if((j == 4) && (getOptions().get(j).contains("*") !=  true)) {
					continue;
				}
				
				else {
					System.out.println("You are wrong." + " The correct answer is " + correct);
				}

	          
	      }
		
		
		
	}
	
	
	
	
	
}
