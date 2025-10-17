import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Scanner;

public class EmployeeDemo {

	static Connection connection = null;
	static Statement statement = null;
	static ResultSet resultSet = null;

	// init DB
	public static void dbInit() {
		// Loading driver
		try {
			Class.forName("net.ucanaccess.jdbc.UcanaccessDriver");
		} catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		String msAccDB = "Employee.accdb";
		String dbURL = "jdbc:ucanaccess://" + msAccDB;

		try {
			connection = DriverManager.getConnection(dbURL);
			statement = connection.createStatement();
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	// retrieve records
	public static void retrieveRecords() {
		String sqlStr = "SELECT * FROM EMPLOYEE";

		try {
			resultSet = statement.executeQuery(sqlStr);

			while (resultSet.next()) {
				int id = resultSet.getInt("ID");
				String name = resultSet.getString("Name");
				double salary = resultSet.getDouble("Salary");
				System.out.println("Employe #" + id + ": " + name + ", $" + salary);
			}

		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public static void insertEmployeeMenu() {
		Scanner scanner = new Scanner(System.in);
		String name;
		double salary;

		System.out.print("Enter your name >> ");
		name = scanner.nextLine();
		System.out.print("Enter your salary >> ");
		salary = Double.parseDouble(scanner.nextLine());
		insertEmployee(name, salary);
	}

	public static void updateEmployee(String name, double salary) {
		String sqlStr = "UPDATE EMPLOYEE SET SALARY = "
				+ salary + " WHERE NAME='" + name + "'";
		try {
			statement.executeUpdate(sqlStr);
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public static void insertEmployee(String name, double salary) {
		String sqlStr = "INSERT INTO EMPLOYEE (Name, Salary) VALUES " + "('" + name + "', " + salary + ")";
		System.out.println(sqlStr);
		try {
			statement.executeUpdate(sqlStr);
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	// close DB
	public static void dbClose() {
		try {
			connection.close();
			statement.close();
			resultSet.close();
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public static void employeeRun() {
		dbInit();
		System.out.println("Original Records:");
		retrieveRecords();
		insertEmployeeMenu();
//		updateEmployee("Ivan Wong", 30000);
		System.out.println("Updated Records:");
		retrieveRecords();
		dbClose();

	}

	public static void main(String[] args) {
		employeeRun();
	}

}
