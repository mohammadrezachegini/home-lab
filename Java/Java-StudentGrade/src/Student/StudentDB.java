/**
* The GUI Application that fetch data from database and show in components and also update the grade 
*
* @author  Mohammad Reza Goodarzvand Chegini
* @StudentID 300354368
* @since   2022/12/02 
*/



package Student;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class StudentDB {

	static Connection connection = null;
	static Statement statement = null;
	static ResultSet resultSet = null;
	
	
	public static void dbInit() {
		try {
			Class.forName("net.ucanaccess.jdbc.UcanaccessDriver");
		} catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		String msAccDB = "Studentcourse.accdb";
		String dbURL = "jdbc:ucanaccess://" + msAccDB;
		
		try {
			connection = DriverManager.getConnection(dbURL);
			statement = connection.createStatement();
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	
	
	
	public static void updateGrade(String grade, String sid, String ccode) {
		dbInit();
		String sqlStr = "UPDATE GRADES SET GRADE='" + grade +"' WHERE SID='" + sid + "' AND CCODE='" + ccode +"'";
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
}
