package SkyTrain;

public class Station {
	
	private  String line;
	private  String name;
	private  int zone;
	
	
	public Station() {
		super();
	}


	public Station(String line, String name, int zone) {
		super();
		this.line = line;
		this.name = name;
		this.zone = zone;
	}


	public String getLine() {
		return line;
	}


	public void setLine(String line) {
		this.line = line;
	}


	public String getName() {
		return name;
	}


	public void setName(String name) {
		this.name = name;
	}


	public int getZone() {
		return zone;
	}


	public void setZone(int zone) {
		this.zone = zone;
	}
	
	
	public String toString() {
		return name + "(" +  line + ") : Zone: " + zone  ;
		
	}
	
	
	
	
}
