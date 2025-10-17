/**
* The Coffee program implements an application to purchase types of coffee.
* This is the class for store coffees and prices and sizes.
* @author  MohammadReza Goodarzvand Chegini
* @studentNumber 300354368
* @Email   goodarzvandcheginim@student.douglascollege.ca
* @Date 2022-10-06
*/

import java.text.DecimalFormat;
import java.util.Scanner;

public class Coffe {
	
	// Declare the variables 
	
	public final static double LATTE_SMALL = 3.70;
	public final static double LATTE_MEDIUM = 4.45;
	public final static double LATTE_LARGE = 5.00;
	public final static double AMERICANO_SMALL = 2.95;
	public final static double AMERICANO_MEDIUM = 3.50;
	public final static double AMERICANO_LARGE = 4.10;
	public final static double CAPPUCCINO_SMALL = 3.70;
	public final static double CAPPUCCINO__MEDIUM = 4.55;
	public final static double CAPPUCCINO_LARGE = 5.00;
	public final static double CARAMEL_MACCHIATO_SMALL = 3.75;
	public final static double CARAMEL_MACCHIATO_MEDIUM = 4.50;
	public final static double CARAMEL_MACCHIATO_LARGE = 5.00;
	public final static double MOCHA_SMALL = 4.50;
	public final static double MOCHA_MEDIUM = 5.40;
	public final static double MOCHA_LARGE = 6.00;
	private double price_total;
	private int milk,cream,sugar;
	private String size,name;
	
	// Default Constructor
	
	public Coffe() {
		
	}
	
	// Constructor
	
	public Coffe(double price_total, int milk, int cream, int sugar, String size, String name) {
		this.price_total = price_total;
		this.milk = milk;
		this.cream = cream;
		this.sugar = sugar;
		this.size = size;
		this.name = name;
	}
	
	
	
	// Apply Decimal Format on Coffee price
	
	public static double getLatteSmall() {
		
		double price = formatPrice(LATTE_SMALL);
		return price;
		
	}
	public static double getLatteMedium() {
		
		double price = formatPrice(LATTE_MEDIUM);
		return price;
	}
	public static double getLatteLarge() {
		double price = formatPrice(LATTE_LARGE);
		
		return price;
	}
	public static double getAmericanoSmall() {
		
		double price = formatPrice(AMERICANO_SMALL);
		return price;
		
	}
	public static double getAmericanoMedium() {
		double price = formatPrice(AMERICANO_MEDIUM);
		return price;
	}
	public static double getAmericanoLarge() {
		double price = formatPrice(AMERICANO_LARGE);
		return price;
	}
	public static double getCappuccinoSmall() {
		double price = formatPrice(CAPPUCCINO_SMALL);
		return price;
	}
	public static double getCappuccinoMedium() {
		double price = formatPrice(CAPPUCCINO__MEDIUM);
		return price;
	}
	public static double getCappuccinoLarge() {
		double price = formatPrice(CAPPUCCINO_LARGE);
		return price;
	}
	public static double getCaramelMacchiatoSmall() {
		double price = formatPrice(CARAMEL_MACCHIATO_SMALL);
		return price;
	}
	public static double getCaramelMacchiatoMedium() {
		double price = formatPrice(CARAMEL_MACCHIATO_MEDIUM);
		return price;
	}
	public static double getCaramelMacchiatoLarge() {
		double price = formatPrice(CARAMEL_MACCHIATO_LARGE);
		return price;
	}
	public static double getMochaSmall() {
		double price = formatPrice(MOCHA_SMALL);
		return price;
	}
	public static double getMochaMedium() {
		double price = formatPrice(MOCHA_MEDIUM);
		return price;
	}
	public static double getMochaLarge() {
		double price = formatPrice(MOCHA_LARGE);
		return price;
	}
	
	// getter and setter for class
	
	public double getPrice_total() {
		return price_total;
	}
	public void setPrice_total(double price_total) {
		this.price_total = price_total;
	}
	public int getMilk() {
		return milk;
	}
	public void setMilk(int milk) {
		this.milk = milk;
	}
	public int getCream() {
		return cream;
	}
	public void setCream(int cream) {
		this.cream = cream;
	}
	public int getSugar() {
		return sugar;
	}
	public void setSugar(int sugar) {
		this.sugar = sugar;
	}
	public String getSize() {
		return size;
	}
	public void setSize(String size) {
		this.size = size;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	
	// Define a coffee size and pass to calculatePrice function for calculating the price base on size 
	
	public void CoffeeSize(String size) {
		switch (size) {
		case "L":
			setSize("Large");
			calculatePrice(this.size);
			displayServiceInfo();
			break;
		case "M":
			setSize("Medium");
			calculatePrice(this.size);
			displayServiceInfo();
			break;
		case "S":
			setSize("Small");
			displayServiceInfo();
			break;
		default:
			break;
		}
	}
	
	// function for dairy and information of purchase and also confirmation
	
	public void displayServiceInfo() {
		Scanner scanner = new Scanner(System.in);
		
		System.out.println("Do you want (M)ilk, (C)ream or (N)one?");
		
		String dairy = scanner.next().toString();
		
		String confirm;
		
		switch (dairy) {
		case "M":
			System.out.println("How many Milk do you want?");
			milk = scanner.nextInt();
			setMilk(milk);
			System.out.println("How many Sugar do you want?");
			sugar = scanner.nextInt();
			setSugar(sugar);
			System.out.println("Confirm you order (Y/N):");
			confirm = scanner.next();
			if (confirm.equals("Y")|| confirm.equals("y")) {
				System.out.printf("Thank you for your purchase! \nYour %s %s (%d Milk and %d Sugar) is ready to serve. \nTotal cost: $%.2f",
						this.size,this.name,this.milk,this.sugar,this.price_total);
			}
			else if (confirm.equals("N") || confirm.equals("n")) {
				CoffeMachine.Coffe_Machine();
			}
			
			break;
			
		case "C":
			
			System.out.println("How many Cream do you want?");
			cream = scanner.nextInt();
			setCream(cream);
			System.out.println("How many Sugar do you want?");
			sugar = scanner.nextInt();
			setSugar(sugar);
			System.out.println("Confirm you order (Y/N):");
			confirm = scanner.next();
			if (confirm.equals("Y")|| confirm.equals("y")) {
				System.out.printf("Thank you for your purchase! \nYour %s %s (%d Cream and %d Sugar) is ready to serve. \nTotal cost: $%.2f",
						this.size,this.name,this.cream,this.sugar,this.price_total);
			}
			else if (confirm.equals("N") || confirm.equals("n")) {
				CoffeMachine.Coffe_Machine();
			}

			break;
			
		case "N":
			System.out.println("How many Sugar do you want?");
			sugar = scanner.nextInt();
			setSugar(sugar);
			System.out.println("Confirm you order (Y/N):");
			confirm = scanner.next();
			if (confirm.equals("Y")|| confirm.equals("y")) {
				System.out.printf("Thank you for your purchase! \nYour %s %s (%d Sugar) is ready to serve. \nTotal cost: $%.2f",
						this.size,this.name,this.sugar,getPrice_total());
			}
			else if (confirm.equals("N") || confirm.equals("n")) {
				CoffeMachine.Coffe_Machine();
			}
			
			break;

		default:
			break;
		}
		
	}
	
	// Decimal Formatter function for coffee price
	
	public static double formatPrice(double price) {
		
		DecimalFormat formatter = new DecimalFormat("##.00");
		String str = formatter.format(price);
		double price_convert = Double.parseDouble(str);
		return price_convert;
	}

	// Calculate coffee price base on size and name
	
	public void calculatePrice(String size) {
		
		if(this.size.equals("Small") && this.name.equals("Latte")) {
			setPrice_total((getLatteSmall() * 5 / 100) + getLatteSmall());
		}
		else if(this.size.equals("Medium") && this.name.equals("Latte")) {
			setPrice_total((getLatteMedium() * 5 / 100) + getLatteMedium());
		}
		else if(this.size.equals("Large") && this.name.equals("Latte")) {
			setPrice_total((getLatteLarge() * 5 / 100) + getLatteLarge());

		}
		else if(this.size.equals("Small") && this.name.equals("Americano")) {
			setPrice_total((getAmericanoSmall() * 5 / 100) + getAmericanoSmall());
		}
		else if(this.size.equals("Medium") && this.name.equals("Americano")) {
			setPrice_total((getAmericanoMedium() * 5 / 100) + getAmericanoMedium());
		}
		else if(this.size.equals("Large") && this.name.equals("Americano")) {
			setPrice_total((getAmericanoLarge() * 5 / 100) + getAmericanoLarge());
		}
		else if(this.size.equals("Small") && this.name.equals("Cappuccino")) {
			setPrice_total((getCappuccinoSmall() * 5 / 100) + getCappuccinoSmall());
		}
		else if(this.size.equals("Medium") && this.name.equals("Cappuccino")) {
			setPrice_total((getCappuccinoMedium() * 5 / 100) + getCappuccinoMedium());
		}
		else if(this.size.equals("Large") && this.name.equals("Cappuccino")) {
			setPrice_total((getCappuccinoLarge() * 5 / 100) + getCappuccinoLarge());
		}
		else if(this.size.equals("Small") && this.name.equals("Caramel Macchiato")) {
			setPrice_total((getCaramelMacchiatoSmall() * 5 / 100) + getCaramelMacchiatoSmall());
		}
		else if(this.size.equals("Medium") && this.name.equals("Caramel Macchiato")) {
			setPrice_total((getCaramelMacchiatoMedium() * 5 / 100) + getCaramelMacchiatoMedium());
		}
		else if(this.size.equals("Large") && this.name.equals("Caramel Macchiato")) {
			setPrice_total((getCaramelMacchiatoLarge() * 5 / 100) + getCaramelMacchiatoLarge());
		}
		else if(this.size.equals("Small") && this.name.equals("Mocha")) {
			setPrice_total((getMochaSmall() * 5 / 100) + getMochaSmall());
		}
		else if(this.size.equals("Medium") && this.name.equals("Mocha")) {
			setPrice_total((getMochaMedium() * 5 / 100) + getMochaMedium());
		}
		else if(this.size.equals("Large") && this.name.equals("Mocha")) {
			setPrice_total((getMochaLarge() * 5 / 100) + getMochaLarge());
			
		}
	}
	
	
}
