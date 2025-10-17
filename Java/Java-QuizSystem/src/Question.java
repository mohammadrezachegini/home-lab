
/**
* 
* This class represents the generic form of question
* It contains the question text and the point of a question.
* 
* @author  Mohammad Reza Goodarzvand Chegini
* @StudentID 300354368
* @Email goodarzvandcheginim@student.douglascollege.ca
* @since   2022-11-24
*  
*/


public abstract class Question {
	
	protected String questionText;
	protected double point;
	
	
	public Question() {
		
	}


	public Question(String questionText) {
		super();
		this.questionText = questionText;
	}


	public String getQuestionTest() {
		return questionText;
	}


	public void setQuestionTest(String questionTest) {
		this.questionText = questionTest;
	}


	public double getPoint() {
		return point;
	}


	public void setPoint(double point) {
		this.point = point;
	}
	
	
	
	public abstract void checkAnswer(String answer);
	
	public abstract void getCorrectAnswer();

}
