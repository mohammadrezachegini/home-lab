import java.util.ArrayList;

public class BookSystem {
	
	static ArrayList<Book> books;
	static int count = 0;
	public static void main(String[] args) {
    books = Book.readDB(books);
    
    for(Book book : books) {
      System.out.println("######################");
      System.out.println(book);
    }
  }
}