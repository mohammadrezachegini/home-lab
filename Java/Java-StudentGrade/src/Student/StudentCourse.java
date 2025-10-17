/**
* The GUI Application that fetch data from database and show in components and also update the grade 
*
* @author  Mohammad Reza Goodarzvand Chegini
* @StudentID 300354368
* @since   2022/12/02 
*/


package Student;

import java.awt.EventQueue;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.stream.Collectors;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;
import javax.swing.DefaultListModel;
import javax.swing.GroupLayout;
import javax.swing.GroupLayout.Alignment;
import javax.swing.JComboBox;
import javax.swing.JTextPane;
import javax.swing.JLabel;
import javax.swing.LayoutStyle.ComponentPlacement;
import javax.swing.JButton;
import javax.swing.JList;
import javax.swing.JOptionPane;
import javax.swing.ListSelectionModel;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import javax.swing.event.ListSelectionListener;

import com.healthmarketscience.jackcess.expr.Value;

import javax.swing.event.ListSelectionEvent;
import javax.swing.DefaultComboBoxModel;
import java.awt.Font;




public class StudentCourse extends JFrame {
	
	
	static Connection connection = null;
	static Statement statement = null;
	static ResultSet resultSet = null;
	static ArrayList<String> studentName = new ArrayList<>();
	static ArrayList<String> studentInfo = new ArrayList<>();
	static ArrayList<String> studentID = new ArrayList<>();
	static DefaultListModel model = new DefaultListModel();
	static Grade gr;

	private JPanel contentPane;
	private JComboBox studentCombo;
	private JList gradeList;
	private JComboBox gradeCombo;
	private JLabel titleLabel;
	private JButton storeBtn;


	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					StudentCourse frame = new StudentCourse();
					frame.setVisible(true);
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		});
	}


	
	 // creating a connection for connecting to DB 
	
	public static void dbInit() {
		try {
			Class.forName("net.ucanaccess.jdbc.UcanaccessDriver");
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}
		
		String msAccDB = "Studentcourse.accdb";
		String dbURL = "jdbc:ucanaccess://" + msAccDB;
		
		try {
			connection = DriverManager.getConnection(dbURL);
			statement = connection.createStatement();
		} catch (SQLException e) {
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
			e.printStackTrace();
		}
	}
	
	public void createEvent() {
		
		
		studentCombo.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				gradeCombo.setSelectedItem(gr.NA);
				titleLabel.setText("");

				
				if(studentCombo.getSelectedItem().toString()== " " ) {
					storeBtn.setEnabled(false);
					gradeCombo.setEnabled(false);
					titleLabel.setText("");
					gradeCombo.setSelectedIndex(6);
					model.clear();
				}
				
				if(studentCombo.getSelectedItem().toString()!= " ") {
					
					String sqlStr = "SELECT sName,Grade,cTitle ,cCode FROM GRADES WHERE sID='" + studentCombo.getSelectedItem().toString().split(" ")[2].replace("(","").replace(")", "") + "'";
					dbInit();
					
					try {
						int i = 0;
						resultSet = statement.executeQuery(sqlStr);
						
						
						model.clear();
						while (resultSet.next()) {
							String name = resultSet.getString("sName");
							String title = resultSet.getString("cTitle");
							String code = resultSet.getString("cCode");
							String grade = resultSet.getString("grade");
							
							model.addElement( code + " - " + title);
							
							i++;
						}
						gradeList.setModel(model);
						closeDB();
						
					} catch (SQLException e1) {
						e1.printStackTrace();
					}
					
				}
				
			}
		});
		
		storeBtn.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				
				dbInit();
				
				
				
				
				if(gradeCombo.getSelectedIndex() == 0) {
					StudentDB.updateGrade("A", studentCombo.getSelectedItem().toString().split(" ")[2].replace("(", "").replace(")", ""), gradeList.getSelectedValuesList().toString().split("-")[0].replace("[", "").replace(" ", ""));
					JOptionPane.showMessageDialog(null,"Update Compelete");
				}
				if(gradeCombo.getSelectedIndex() == 1) {
					StudentDB.updateGrade("B", studentCombo.getSelectedItem().toString().split(" ")[2].replace("(", "").replace(")", ""), gradeList.getSelectedValuesList().toString().split("-")[0].replace("[", "").replace(" ", ""));
					JOptionPane.showMessageDialog(null,"Update Compelete");
				}
				if(gradeCombo.getSelectedIndex() == 2) {
					StudentDB.updateGrade("C", studentCombo.getSelectedItem().toString().split(" ")[2].replace("(", "").replace(")", ""), gradeList.getSelectedValuesList().toString().split("-")[0].replace("[", "").replace(" ", ""));
					JOptionPane.showMessageDialog(null,"Update Compelete");
				}
				if(gradeCombo.getSelectedIndex() == 3) {
					StudentDB.updateGrade("D", studentCombo.getSelectedItem().toString().split(" ")[2].replace("(", "").replace(")", ""), gradeList.getSelectedValuesList().toString().split("-")[0].replace("[", "").replace(" ", ""));
					JOptionPane.showMessageDialog(null,"Update Compelete");
				}
				if(gradeCombo.getSelectedIndex() == 4) {
					StudentDB.updateGrade("P", studentCombo.getSelectedItem().toString().split(" ")[2].replace("(", "").replace(")", ""), gradeList.getSelectedValuesList().toString().split("-")[0].replace("[", "").replace(" ", ""));
					JOptionPane.showMessageDialog(null,"Update Compelete");
				}
				if(gradeCombo.getSelectedIndex() == 5) {
					StudentDB.updateGrade("F", studentCombo.getSelectedItem().toString().split(" ")[2].replace("(", "").replace(")", ""), gradeList.getSelectedValuesList().toString().split("-")[0].replace("[", "").replace(" ", ""));
					JOptionPane.showMessageDialog(null,"Update Compelete");
				}
				if(gradeCombo.getSelectedIndex() == 6) {
					StudentDB.updateGrade("NA", studentCombo.getSelectedItem().toString().split(" ")[2].replace("(", "").replace(")", ""), gradeList.getSelectedValuesList().toString().split("-")[0].replace("[", "").replace(" ", ""));
					JOptionPane.showMessageDialog(null,"Update Compelete");
				}
				closeDB();
			}
		});
		
		gradeList.addListSelectionListener(new ListSelectionListener() {
			public void valueChanged(ListSelectionEvent e) {
				
				dbInit();
				
				if (gradeList.getValueIsAdjusting()) {
					
					String sqlStr = "SELECT sID,sName,Grade,cTitle ,cCode FROM GRADES WHERE sID='" + studentCombo.getSelectedItem().toString().split(" ")[2].replace("(","").replace(")", "") + "' AND cCode = '" + gradeList.getSelectedValue().toString().split(" ")[0] + "'";
					try {
						resultSet = statement.executeQuery(sqlStr);
						int i = 0;
						while (resultSet.next()) {
							String sid = resultSet.getString("sID");
							String name = resultSet.getString("sName");
							String title = resultSet.getString("cTitle");
							String code = resultSet.getString("cCode");
							String grade = resultSet.getString("grade");
							
							
							titleLabel.setText(title);
							
							for( Grade grs : Grade.values()) {
								if(grs.name().equals(grade)) {
									gradeCombo.setSelectedItem(grs);
									if(grs != grs.NA) {
										storeBtn.setEnabled(false);
										gradeCombo.setEnabled(false);
									}
									if(grs == grs.NA) {
										storeBtn.setEnabled(true);
										gradeCombo.setEnabled(true);
										
									}
								}
							}
							
						}
						
						closeDB();
						
					} catch (SQLException e1) {
						e1.printStackTrace();
					}

				
				
				}
			}
		});
		
		
	}
	
	public void setupComponents() {
		
		String[] studentArray = studentName.toArray(new String[studentName.size()]);
		
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setBounds(100, 100, 800, 500);
		contentPane = new JPanel();
		contentPane.setBorder(new EmptyBorder(5, 5, 5, 5));

		setContentPane(contentPane);
		
		studentCombo = new JComboBox(studentArray);
		
		
		
		
		titleLabel = new JLabel("");
		titleLabel.setFont(new Font("Tahoma", Font.BOLD, 12));
		
		gradeCombo = new JComboBox();
		gradeCombo.setFont(new Font("Tahoma", Font.BOLD, 20));
		gradeCombo.setModel(new DefaultComboBoxModel(Grade.values()));
		gradeCombo.setSelectedIndex(6);
		
		storeBtn = new JButton("Save");
		
		
		gradeList = new JList();
		
		storeBtn.setEnabled(false);
		gradeCombo.setEnabled(false);
		
		
		gradeList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
		GroupLayout gl_contentPane = new GroupLayout(contentPane);
		gl_contentPane.setHorizontalGroup(
			gl_contentPane.createParallelGroup(Alignment.TRAILING)
				.addGroup(gl_contentPane.createSequentialGroup()
					.addContainerGap()
					.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
						.addGroup(gl_contentPane.createSequentialGroup()
							.addComponent(gradeList, GroupLayout.PREFERRED_SIZE, 334, GroupLayout.PREFERRED_SIZE)
							.addPreferredGap(ComponentPlacement.RELATED, 138, Short.MAX_VALUE)
							.addGroup(gl_contentPane.createParallelGroup(Alignment.LEADING)
								.addComponent(titleLabel, Alignment.TRAILING, GroupLayout.PREFERRED_SIZE, 282, GroupLayout.PREFERRED_SIZE)
								.addGroup(Alignment.TRAILING, gl_contentPane.createSequentialGroup()
									.addComponent(storeBtn, GroupLayout.PREFERRED_SIZE, 90, GroupLayout.PREFERRED_SIZE)
									.addGap(148))
								.addGroup(Alignment.TRAILING, gl_contentPane.createSequentialGroup()
									.addComponent(gradeCombo, GroupLayout.PREFERRED_SIZE, 142, GroupLayout.PREFERRED_SIZE)
									.addGap(116))))
						.addComponent(studentCombo, GroupLayout.PREFERRED_SIZE, 197, GroupLayout.PREFERRED_SIZE))
					.addContainerGap())
		);
		gl_contentPane.setVerticalGroup(
			gl_contentPane.createParallelGroup(Alignment.LEADING)
				.addGroup(gl_contentPane.createSequentialGroup()
					.addGap(14)
					.addComponent(studentCombo, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
					.addGap(18)
					.addGroup(gl_contentPane.createParallelGroup(Alignment.BASELINE)
						.addComponent(gradeList, GroupLayout.PREFERRED_SIZE, 372, GroupLayout.PREFERRED_SIZE)
						.addGroup(gl_contentPane.createSequentialGroup()
							.addComponent(titleLabel)
							.addPreferredGap(ComponentPlacement.RELATED, 59, Short.MAX_VALUE)
							.addComponent(gradeCombo, GroupLayout.PREFERRED_SIZE, 50, GroupLayout.PREFERRED_SIZE)
							.addGap(18)
							.addComponent(storeBtn, GroupLayout.PREFERRED_SIZE, 38, GroupLayout.PREFERRED_SIZE)
							.addGap(207)))
					.addContainerGap(25, Short.MAX_VALUE))
		);
		contentPane.setLayout(gl_contentPane);
	}
	
//	Fetching Data from the database 
	
	public  void retrieveRecords() {
		String sqlStr = "SELECT * FROM GRADES";
		
		try {
			resultSet = statement.executeQuery(sqlStr);
			studentName.add(" ");
			while (resultSet.next()) {
				int id = resultSet.getInt("ID");
				String name = resultSet.getString("sName");
				String sid = resultSet.getString("sID");
				String code = resultSet.getString("cCode");
				String title = resultSet.getString("cTitle");
				String grade = resultSet.getString("grade");
				
				studentInfo.add(sid + "##" + title + " " + grade);
				studentName.add(name + " (" +  sid + ")");
				studentID.add(sid);
				
				
				
				
			}
			
			studentName = (ArrayList<String>) studentName.stream().distinct().collect(Collectors.toList());
			studentID = (ArrayList<String>) studentID.stream().distinct().collect(Collectors.toList());

		} catch (SQLException e) {
			e.printStackTrace();
		}
	}
	
	public StudentCourse() {
		dbInit();
		retrieveRecords();
		
		setupComponents();
		createEvent();
		closeDB();
	}
}
