
/**
* The Coffee program implements an application to purchase types of coffee.
*
* @author  MohammadReza Goodarzvand Chegini
* @studentNumber 300354368
* @Email   goodarzvandcheginim@student.douglascollege.ca
* @Date 2022-10-06
*/


import java.util.Scanner;

public class CoffeMachine {

	
	public static void main(String[] args) {
		Coffe_Machine();
		
	}
	
	// Menu for coffee machine
	
	public static void Coffe_Machine() {
		System.out.println("Welcome to N&I Cafe \nPlease choose your coffee\nCoffee 1: Latte \nCoffee 2: Americano \nCoffee 3: Cappuccino \nCoffee 4: Caramel Macchiato \nCoffee 5: Mocha \nEnter the coffee number >>");
		Scanner scanner  = new Scanner(System.in);
		int coffeNumber;
		coffeNumber = scanner.nextInt();
		Coffe_Number(coffeNumber);
	}
	
	// function for choosing coffee number and also create object from class and pass information to class functions
	
	public static void Coffe_Number(int coffeNumber) {
		
		Coffe coffee = new Coffe();
		Scanner scanner = new Scanner(System.in);
		String size;
		switch (coffeNumber) {
		case 1:
			System.out.printf("Please choose the size (S/M/L):\n(S)mall: $%.2f / (M)edium: $%.2f / (L)arge: $%.2f >>",Coffe.getLatteSmall(),Coffe.getLatteMedium(),Coffe.getLatteLarge());
			size = scanner.next();
			coffee.setName("Latte");
			coffee.CoffeeSize(size);
			
			break;
		case 2:
			System.out.printf("Please choose the size (S/M/L):\n(S)mall: $%.2f / (M)edium: $%.2f / (L)arge: $%.2f >>",Coffe.getAmericanoSmall(),Coffe.getAmericanoMedium(),Coffe.getAmericanoLarge());
			size = scanner.next();
			coffee.setName("Americano");
			coffee.CoffeeSize(size);
			
			break;
		case 3:
			System.out.printf("Please choose the size (S/M/L):\n(S)mall: $%.2f / (M)edium: $%.2f / (L)arge: $%.2f >>",Coffe.getCappuccinoSmall(),Coffe.getCappuccinoMedium(),Coffe.getCappuccinoLarge());
			size = scanner.next();
			coffee.setName("Cappuccino");
			coffee.CoffeeSize(size);
			
			break;
		case 4:
			System.out.printf("Please choose the size (S/M/L):\n(S)mall: $%.2f / (M)edium: $%.2f / (L)arge: $%.2f >>",Coffe.getCaramelMacchiatoSmall(),Coffe.getCaramelMacchiatoMedium(),Coffe.getCaramelMacchiatoLarge());
			size = scanner.next();
			coffee.setName("Caramel Macchiato");
			coffee.CoffeeSize(size);
			
			break;
		case 5:
			System.out.printf("Please choose the size (S/M/L):\n(S)mall: $%.2f / (M)edium: $%.2f / (L)arge: $%.2f >>",Coffe.getMochaSmall(),Coffe.getMochaMedium(),Coffe.getMochaLarge());
			size = scanner.next();
			coffee.setName("Mocha");
			coffee.CoffeeSize(size);
			
			break;
		default:
			Coffe_Machine();
			break;
		}
	}

}
