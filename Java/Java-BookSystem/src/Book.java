import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;

public class Book {

	private String title;
	private String[] authors;
	private double price;
	
	protected static Connection connection = null;
	protected static Statement statement = null;
	protected static ResultSet resultSet = null;
	
	static ArrayList<Book> books = new ArrayList<>();
	
	public Book() {
		
	}

	public Book(String title, String[] authors, double price) {
		super();
		this.title = title;
		this.authors = authors;
		this.price = price;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String[] getAuthors() {
		return authors;
	}

	public void setAuthors(String[] authors) {
		this.authors = authors;
	}

	public double getPrice() {
		return price;
	}

	public void setPrice(double price) {
		this.price = price;
	}
	
	
	
	public static void dbInit() {
		// Loading driver
		try {
			Class.forName("net.ucanaccess.jdbc.UcanaccessDriver");
		} catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		String msAccDB = "BookDB.accdb";
		String dbURL = "jdbc:ucanaccess://" + msAccDB;

		try {
			connection = DriverManager.getConnection(dbURL);
			statement = connection.createStatement();
		} catch (SQLException e) {
			e.printStackTrace();
		}

	}
	
	public static ArrayList<Book> readDB(ArrayList<Book> book) {
		dbInit();
		String sqlStr = "SELECT * FROM Books";
		Book abook = new Book();
		
		try {
			resultSet = statement.executeQuery(sqlStr);

			while (resultSet.next()) {
				
				int id = resultSet.getInt("ID");
				String title = resultSet.getString("Title");
				abook.setTitle(title);
				String authors = resultSet.getString("Authors");
				String replaceString= authors.replace("##","; ");//replaces all occurrences of 'a' to 'e'  
				String[] strArray = new String[] {replaceString};  
				abook.setAuthors(strArray);
				double price = resultSet.getDouble("Price");
				abook.setPrice(price);
				books.add(new Book(abook.getTitle(), abook.getAuthors(), abook.getPrice()));
				book = books;
			}

		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return book;
	}
	
	public String toString() {

		return "Title: " + title + "\n" + "Authors: " + Arrays.toString(getAuthors()).replace("[", "").replace("]", ";") + "\n" + "Price: $" + price; 
	}
	
	

}
