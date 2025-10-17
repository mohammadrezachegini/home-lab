
/**
* 
* It is a subclass of Question
* It presents a True/False question.
* 
* @author  Mohammad Reza Goodarzvand Chegini
* @StudentID 300354368
* @Email goodarzvandcheginim@student.douglascollege.ca
* @since   2022-11-24
*  
*/


import java.util.ArrayList;

public class TFQuestion extends Question{

	
	protected boolean answer;
	protected String ans;
	protected double total = 0;
	
	public TFQuestion() {
		super();
	}


	public TFQuestion( String questionText,boolean answer, double point ) {
		super();
		this.answer = answer;
		this.questionText = questionText;
		this.point = point;
	}

	
	
	

	public boolean getAnswer() {
		return answer;
	}


	public void setAnswer(boolean answer) {
		this.answer = answer;
	}


	@Override
	public void checkAnswer(String answer) {
		
		this.ans = answer;
//		if (answer.equals("T")) {
//			this.answer = Boolean.valueOf(answer);
//			
//		}
//		if (answer.equals("F")) {
//			this.answer = Boolean.valueOf("false");
//		}
		
	}


	@Override
	public void getCorrectAnswer() {
		
		if (this.answer == Boolean.valueOf(this.ans)) {
			System.out.println("You are correct!");
			total += this.point;
		}
		
		if (this.answer != Boolean.valueOf(this.ans)) {
			if(this.answer == false) {
				System.out.println("You are wrong. The correct answer is false.");
			}
			if(this.answer == true) {
				System.out.println("You are wrong. The correct answer is true.");
			}
		}
		
		
	}

	
	
	
}
