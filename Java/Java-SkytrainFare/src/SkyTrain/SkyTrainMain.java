package SkyTrain;

import java.awt.EventQueue;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;

import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;
import javax.swing.JLabel;
import javax.swing.GroupLayout;
import javax.swing.GroupLayout.Alignment;
import javax.swing.JList;
import javax.swing.JOptionPane;
import javax.swing.LayoutStyle.ComponentPlacement;
import javax.swing.JScrollPane;
import javax.swing.JRadioButton;
import javax.swing.JButton;
import javax.swing.ButtonGroup;
import javax.swing.DefaultListModel;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import java.awt.event.ItemListener;
import java.awt.event.ItemEvent;
import javax.swing.ListSelectionModel;

public class SkyTrainMain extends JFrame {

	
	
	static Connection connection = null;
	static Statement statement = null;
	static ResultSet resultSet = null;
	
	static String line1 = "", line2="";
	
	static DefaultListModel<String> nameModel = new DefaultListModel<>();
	static ArrayList<String> stations = new ArrayList<>();
	static ArrayList<Station> stationsArrayList = new ArrayList<>();
	static Station stationObj = new Station("","",0);
	
	private JPanel contentPane;
	private JList listSource;
	private JList listDestination;
	private JLabel lblFrom;
	private JLabel lblNewLabel;
	private JRadioButton rdbtnCashFare;
	private JRadioButton rdbtnContactLess;
	private JRadioButton rdbtnStoredValue;
	private JRadioButton rdbtnAdult;
	private JRadioButton rdbtnConcession;
	private JButton btnCheckFare;
	private JButton btnReset;
	private final ButtonGroup payment = new ButtonGroup();
	private final ButtonGroup age = new ButtonGroup();

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					SkyTrainMain frame = new SkyTrainMain();
					frame.setVisible(true);
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		});
	}
	
	
	
	public static void dbInit() {
		
		try {
			Class.forName("net.ucanaccess.jdbc.UcanaccessDriver");
			
		} catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		String msAccDB = "SkytrainFare.accdb";
		String dbURL = "jdbc:ucanaccess://" + msAccDB;
		
		
		try {
			connection = DriverManager.getConnection(dbURL);
			statement = connection.createStatement();
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
	}
	
	
	
	
	public  void retrieveRecords() {
		String sqlStr = "SELECT * FROM Stations";
		
		
		Line lineELine = null;
		
		
		
		try {
			resultSet = statement.executeQuery(sqlStr);
			while (resultSet.next()) {
				
				int id = resultSet.getInt("ID");
				String line = resultSet.getString("Line");
				String name = resultSet.getString("Name");
				int zone  = resultSet.getInt("Zone");
				
				
				for (Line lines : Line.values()) {
			        if(lines.name().equals(line)) {
			        	stationObj.setLine(lines.name());
			        }
			    }
				
				
				
				stationObj.setName(name);
				stationObj.setZone(zone);
				
				
				stationsArrayList.add(new Station(stationObj.getLine(),stationObj.getName(),stationObj.getZone()) );
				nameModel.addElement(stationObj.getName() + "(" + stationObj.getLine() + ")");
				
				
			}
			
			
	        

			
			
		} catch (SQLException e) {
			e.printStackTrace();
		}
		

	}
	
	
	public static void closeDB() {
		try {
			connection.close();
			statement.close();
			resultSet.close();
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}
	
	
	
	
	public void createEvent() {
		
		
		
		rdbtnStoredValue.addItemListener(new ItemListener() {
			public void itemStateChanged(ItemEvent e) {
				age.clearSelection();
			}
		});
		
		
		rdbtnCashFare.addItemListener(new ItemListener() {
			public void itemStateChanged(ItemEvent e) {
				age.clearSelection();
			}
		});
		
		
		
		
		
		rdbtnContactLess.addItemListener(new ItemListener() {
			public void itemStateChanged(ItemEvent e) {
				if(rdbtnContactLess.isEnabled()) {
					rdbtnConcession.setEnabled(false);
				}
				if(!(rdbtnContactLess.isSelected())) {
					rdbtnConcession.setEnabled(true);
				}
				
				age.clearSelection();
				
					
					
			}
		});
		
		
		
		btnReset.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				age.clearSelection();
				payment.clearSelection();
				listDestination.clearSelection();
				listSource.clearSelection();
			}
		});
		
		
		btnCheckFare.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				
				String src = listSource.getSelectedValue().toString();
				String[] srcStrings = src.split("\\(");
				
				String dest = listDestination.getSelectedValue().toString();
				String[] destStrings = dest.split("\\(");

				
				int zone1 = 0,zone2 =0;
				
				
				
				for(Station st: stationsArrayList){
		            if(st.getName().equals(srcStrings[0])){
		               zone1 = st.getZone();
		               line1 = st.getName();
		            }
		        }
				
				
				
				
				for(Station st: stationsArrayList){
		            if(st.getName().equals(destStrings[0])){
		               zone2 = st.getZone();
		               line2 = st.getName();
		            }
		        }
				
				
				if(rdbtnCashFare.isSelected()){
					if(rdbtnAdult.isSelected()) {
						Cash_Fare_Adult(zone1, zone2);
					}
					if(rdbtnConcession.isSelected()) {
						Cash_Fare_Concession(zone1, zone2);
					}
					else if(!(rdbtnAdult.isSelected()) && !(rdbtnConcession.isSelected())) {
						JOptionPane.showMessageDialog(null, "Please choose fair type");
					}
				}
				
				
				if(rdbtnContactLess.isSelected()) {
					if(rdbtnAdult.isSelected()) {
						ContactLess(zone1, zone2);
					}
					
					else if(!(rdbtnConcession.isSelected())) {
						JOptionPane.showMessageDialog(null, "Please choose fair type");
					}
				}
				

				
				if(rdbtnStoredValue.isSelected()) {
					
					
					if(rdbtnConcession.isSelected()) {
						StoredValue_Concession(zone1,zone2);
					}
					
					if(rdbtnAdult.isSelected()) {
						StoredValue_Adult(zone1,zone2);
					}
					
					else if(!(rdbtnAdult.isSelected()) && !(rdbtnConcession.isSelected())) {
						JOptionPane.showMessageDialog(null, "Please choose fair type");
					}
				}
				
									
			}
		});
		
	}
	
	
	
	public void Cash_Fare_Adult(int zone1, int zone2) {
		
		
		int fare = Math.abs(zone1 - zone2);
		
		
		if(line1.equals("YVR-Airport") || line1.equals("Templeton") || line1.equals("Sea Island Centre")) {
			
			

			if(line2.equals("YVR-Airport") || line2.equals("Templeton") || line2.equals("Sea Island Centre")) {
				printMessage("Adult", "CASH", line1, line2, 0, 0);
			}
			
			else if(fare == 0) {
				printMessage("Adult", "CASH", line1, line2, 8.05, 1);
			}
			
			else if(fare == 1) {
				printMessage("Adult", "CASH", line1, line2, 9.35, 2);
			}
			
			else if(fare == 2) {
				printMessage("Adult", "CASH", line1, line2, 10.90, 3);
			}
		}
		
		else if(fare == 0) {
			printMessage("Adult", "CASH", line1, line2, 3.05, 1);
		}
		
		else if(fare == 1) {
			printMessage("Adult", "CASH", line1, line2, 4.35, 2);
		}
		
		else if(fare == 2) {
			printMessage("Adult", "CASH", line1, line2, 5.90, 3);
		}
		
		
		
		
		
		
	}	
	
	
	public void Cash_Fare_Concession(int zone1, int zone2) {
		
		
		int fare = Math.abs(zone1 - zone2);
		
		
		if(line1.equals("YVR-Airport") || line1.equals("Templeton") || line1.equals("Sea Island Centre")) {
			
			
			if(line2.equals("YVR-Airport") || line2.equals("Templeton") || line2.equals("Sea Island Centre")) {
				printMessage("Concession", "CASH", line1, line2, 0, 0);
			}
			
			else if(fare == 0) {
				printMessage("Concession", "CASH", line1, line2, 7, 1);
			}
			
			else if(fare == 1) {
				printMessage("Concession", "CASH", line1, line2, 8, 2);
			}
			
			else if(fare == 2) {
				printMessage("Concession", "CASH", line1, line2, 9.05, 3);
			}
		}
		
		
		else if(fare == 0) {
			printMessage("Concession", "CASH", line1, line2, 2, 1);
		}
		
		else if(fare == 1) {
			printMessage("Concession", "CASH", line1, line2, 3, 2);
		}
		
		else if(fare == 2) {
			printMessage("Concession", "CASH", line1, line2, 4.05, 3);
		}
		
		
		
		
	}	
	
	public void ContactLess(int zone1, int zone2) {
		
		
		int fare = Math.abs(zone1 - zone2);
		
		
		if(line1.equals("YVR-Airport") || line1.equals("Templeton") || line1.equals("Sea Island Centre")) {
			
			
			if(line2.equals("YVR-Airport") || line2.equals("Templeton") || line2.equals("Sea Island Centre")) {
				printMessage("Adult", "CONTACTLESS PAYMENT", line1, line2,0, 0);
			}
			
			else if(fare == 0) {
				printMessage("Adult", "CONTACTLESS PAYMENT", line1, line2, 8.05, 1);
			}
			
			else if(fare == 1) {
				printMessage("Adult", "CONTACTLESS PAYMENT", line1, line2, 9.35, 2);
			}
			
			else if(fare == 2) {
				printMessage("Adult", "CONTACTLESS PAYMENT", line1, line2, 10.90, 3);
			}
		}
		
		
		else if(fare == 0) {
			printMessage("Adult", "CONTACTLESS PAYMENT", line1, line2, 3.05, 1);
		}
		
		else if(fare == 1) {
			printMessage("Adult", "CONTACTLESS PAYMENT", line1, line2, 4.35, 2);
		}
		
		else if(fare == 2) {
			printMessage("Adult", "CONTACTLESS PAYMENT", line1, line2, 5.90, 3);
		}
		
		
		
		
	}
	
	
	
	public void StoredValue_Adult(int zone1, int zone2) {
		
		
		int fare = Math.abs(zone1 - zone2);
		
		
		if(line1.equals("YVR-Airport") || line1.equals("Templeton") || line1.equals("Sea Island Centre")) {
			
			
			if(line2.equals("YVR-Airport") || line2.equals("Templeton") || line2.equals("Sea Island Centre")) {
				printMessage("Adult", "STORED VALUE", line1, line2, 0, 0);
			}
			
			else if(fare == 0) {
				printMessage("Adult", "STORED VALUE", line1, line2, 7.45, 1);
			}
			
			else if(fare == 1) {
				printMessage("Adult", "STORED VALUE", line1, line2, 8.55, 2);
			}
			
			else if(fare == 2) {
				printMessage("Adult", "STORED VALUE", line1, line2, 9.60, 3);
			}
		}
		
		
		
		else if(fare == 0) {
			printMessage("Adult", "STORED VALUE", line1, line2, 2.45, 1);
		}
		
		else if(fare == 1) {
			printMessage("Adult", "STORED VALUE", line1, line2, 3.55, 2);
		}
		
		else if(fare == 2) {
			printMessage("Adult", "STORED VALUE", line1, line2, 4.60, 3);
		}
		
		
		
		
	}
	
	
	
	public void StoredValue_Concession(int zone1, int zone2) {
		
		
		int fare = Math.abs(zone1 - zone2);
		
		
		if(line1.equals("YVR-Airport") || line1.equals("Templeton") || line1.equals("Sea Island Centre")) {
			
			
			if(line2.equals("YVR-Airport") || line2.equals("Templeton") || line2.equals("Sea Island Centre")) {
				printMessage("Concessio", "STORED VALUE", line1, line2, 0,0);
			}
			
			else if(fare == 0) {
				printMessage("Concessio", "STORED VALUE", line1, line2, 7, 1);
			}
			
			else if(fare == 1) {
				printMessage("Concessio", "STORED VALUE", line1, line2, 8, 2);
			}
			
			else if(fare == 2) {
				printMessage("Concessio", "STORED VALUE", line1, line2, 9.05, 3);
			}
		}
		
		
		else if(fare == 0) {
			printMessage("Concessio", "STORED VALUE", line1, line2, 2, 1);
		}
		
		else if(fare == 1) {
			printMessage("Concessio", "STORED VALUE", line1, line2, 3, 2);
		}
		
		else if(fare == 2) {
			printMessage("Concessio", "STORED VALUE", line1, line2, 4.05, 3);
		}
		
		
	}
	
	
	
	
	public void printMessage(String age, String typePaid, String zone1, String zone2 , double price, int zoneNum) {
		
		if(zoneNum == 0) {
			JOptionPane.showMessageDialog(null, "The " + age  + " fare" + "(by " + typePaid + ")\n from " + zone1 + "\nTo " + zone2 + "\nis $" + price );
		}
		
		if(zoneNum>0) {
			JOptionPane.showMessageDialog(null, "The " + age  + " fare" + "(by " + typePaid + ")\n from " + zone1 + "\nTo " + zone2 + "\nis $" + price + " (" + zoneNum + "-ZONE)" );
		}
		
		
		
	}
	
	
	
	
	public void setupComponent() {
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setBounds(100, 100, 800, 600);
		contentPane = new JPanel();
		contentPane.setBorder(new EmptyBorder(5, 5, 5, 5));

		setContentPane(contentPane);
		
		lblFrom = new JLabel("From");
		
		lblNewLabel = new JLabel("To");
		
		JScrollPane scrollPane = new JScrollPane();
		
		JScrollPane scrollPane_1 = new JScrollPane();
		
		rdbtnCashFare = new JRadioButton("Cash Fare");
		
		payment.add(rdbtnCashFare);
		
		rdbtnContactLess = new JRadioButton("Contactless Payment Fee");
		
		payment.add(rdbtnContactLess);
		
		rdbtnStoredValue = new JRadioButton("Stored Value");
		
		payment.add(rdbtnStoredValue);
		
		rdbtnAdult = new JRadioButton("Adult");
		age.add(rdbtnAdult);
		
		rdbtnConcession = new JRadioButton("Concession");
		age.add(rdbtnConcession);
		
		btnCheckFare = new JButton("Check Fare");
		
		
		
		
		
		btnReset = new JButton("Reset");
		
		GroupLayout gl_contentPane = new GroupLayout(contentPane);
		gl_contentPane.setHorizontalGroup(
			gl_contentPane.createParallelGroup(Alignment.LEADING)
				.addGroup(gl_contentPane.createSequentialGroup()
					.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
						.addGroup(gl_contentPane.createSequentialGroup()
							.addGap(33)
							.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
								.addGroup(gl_contentPane.createSequentialGroup()
									.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
										.addComponent(scrollPane, GroupLayout.PREFERRED_SIZE, 255, GroupLayout.PREFERRED_SIZE)
										.addComponent(lblFrom))
									.addGap(150)
									.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
										.addComponent(lblNewLabel)
										.addComponent(scrollPane_1, GroupLayout.PREFERRED_SIZE, 247, GroupLayout.PREFERRED_SIZE)))
								.addGroup(gl_contentPane.createSequentialGroup()
									.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
										.addComponent(rdbtnCashFare)
										.addComponent(rdbtnAdult))
									.addGap(18)
									.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
										.addGroup(gl_contentPane.createSequentialGroup()
											.addComponent(rdbtnContactLess)
											.addGap(10)
											.addComponent(rdbtnStoredValue))
										.addComponent(rdbtnConcession)))))
						.addGroup(gl_contentPane.createSequentialGroup()
							.addGap(70)
							.addComponent(btnCheckFare, GroupLayout.PREFERRED_SIZE, 149, GroupLayout.PREFERRED_SIZE)
							.addGap(49)
							.addComponent(btnReset, GroupLayout.PREFERRED_SIZE, 193, GroupLayout.PREFERRED_SIZE)))
					.addContainerGap(89, Short.MAX_VALUE))
		);
		gl_contentPane.setVerticalGroup(
			gl_contentPane.createParallelGroup(Alignment.LEADING)
				.addGroup(gl_contentPane.createSequentialGroup()
					.addGap(57)
					.addGroup(gl_contentPane.createParallelGroup(Alignment.BASELINE)
						.addComponent(lblFrom)
						.addComponent(lblNewLabel))
					.addGap(18)
					.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
						.addComponent(scrollPane_1, GroupLayout.DEFAULT_SIZE, 320, Short.MAX_VALUE)
						.addComponent(scrollPane, GroupLayout.PREFERRED_SIZE, 320, GroupLayout.PREFERRED_SIZE))
					.addGap(32)
					.addGroup(gl_contentPane.createParallelGroup(Alignment.BASELINE)
						.addComponent(rdbtnCashFare)
						.addComponent(rdbtnContactLess)
						.addComponent(rdbtnStoredValue))
					.addPreferredGap(ComponentPlacement.UNRELATED)
					.addGroup(gl_contentPane.createParallelGroup(Alignment.BASELINE)
						.addComponent(rdbtnAdult)
						.addComponent(rdbtnConcession))
					.addPreferredGap(ComponentPlacement.RELATED, 16, Short.MAX_VALUE)
					.addGroup(gl_contentPane.createParallelGroup(Alignment.BASELINE)
						.addComponent(btnReset, GroupLayout.PREFERRED_SIZE, 34, GroupLayout.PREFERRED_SIZE)
						.addComponent(btnCheckFare, GroupLayout.PREFERRED_SIZE, 31, GroupLayout.PREFERRED_SIZE))
					.addContainerGap())
		);
		
		listDestination = new JList();
		listDestination.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
		scrollPane_1.setViewportView(listDestination);
		listDestination.setModel(nameModel);
		
		
		listSource = new JList();
		listSource.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
		listSource.setModel(nameModel);
		
		scrollPane.setViewportView(listSource);
		contentPane.setLayout(gl_contentPane);
	}
	
	
	

	

	/**
	 * Create the frame.
	 */
	public SkyTrainMain() {
		setTitle("Skytrain Fare Checker");
		
		dbInit();
		retrieveRecords();
		setupComponent();
		createEvent();
		closeDB();
		
	}
}
