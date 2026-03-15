import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAowrcTwOp8Yt3DE56JavxK2laKtq2RrxI");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState(null); // 'student' or 'faculty'
  const [studentData, setStudentData] = useState(null);
  const [facultyData, setFacultyData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Real data - yeh actual API se bhi aa sakta hai
  useEffect(() => {
    // Student Data
    setStudentData({
      name: "Harshit Tripathi",
      rollNo: "CS2021001",
      branch: "Computer Science",
      semester: 5,
      timetable: [
        { day: "Monday", subjects: ["DBMS (10-11 AM)", "AI (11-12 AM)", "Lab (2-4 PM)"] },
        { day: "Tuesday", subjects: ["OS (9-10 AM)", "DBMS (10-11 AM)", "Maths (11-12 AM)"] },
        { day: "Wednesday", subjects: ["AI (10-11 AM)", "OS (11-12 AM)", "CN (2-3 PM)"] },
        { day: "Thursday", subjects: ["CN (9-10 AM)", "DBMS (10-11 AM)", "OS (11-12 AM)"] },
        { day: "Friday", subjects: ["Mini Project (10-12 AM)", "AI Lab (2-4 PM)"] },
        { day: "Saturday", subjects: ["Sports Activity (8-10 AM)"] }
      ],
      results: {
        semester4: {
          DBMS: 85,
          OS: 78,
          AI: 92,
          CN: 81,
          Maths: 88,
          totalCGPA: 8.7
        },
        semester3: {
          totalCGPA: 8.4
        }
      },
      attendance: {
        DBMS: 85,
        OS: 72,
        AI: 90,
        CN: 68,
        Maths: 95,
        overall: 82
      },
      notices: [
        { id: 1, title: "Internal Exam Schedule", date: "2024-03-15", content: "Internal exams from 25th March. Check portal for detailed schedule." },
        { id: 2, title: "Project Submission", date: "2024-03-10", content: "Mini project submissions by 20th March." },
        { id: 3, title: "Holiday", date: "2024-03-08", content: "College closed on 15th March for festival." }
      ],
      assignments: [
        { subject: "DBMS", title: "ER Diagram Project", deadline: "2024-03-20", status: "Pending" },
        { subject: "AI", title: "Python Assignment", deadline: "2024-03-18", status: "Submitted" }
      ]
    });

    // Faculty Data
    setFacultyData({
      name: "Prof. Sharma",
      department: "Computer Science",
      classes: [
        { id: "SE-COMP-A", subject: "DBMS", students: 65, time: "10-11 AM" },
        { id: "SE-COMP-B", subject: "AI", students: 68, time: "11-12 AM" },
        { id: "TE-COMP-A", subject: "OS", students: 72, time: "2-3 PM" }
      ],
      studentList: {
        "SE-COMP-A": [
          { rollNo: "CS001", name: "Harshit Tripathi", attendance: 85 },
          { rollNo: "CS002", name: "Aman Verma", attendance: 78 },
          { rollNo: "CS003", name: "Riya Shah", attendance: 92 },
          { rollNo: "CS004", name: "Priya Patel", attendance: 88 },
          { rollNo: "CS005", name: "Rahul Kumar", attendance: 76 }
        ],
        "SE-COMP-B": [
          { rollNo: "CS051", name: "Neha Singh", attendance: 90 },
          { rollNo: "CS052", name: "Vikram Mehta", attendance: 82 }
        ]
      },
      todaysClasses: [
        { time: "10:00 AM", class: "SE-COMP-A", subject: "DBMS", topic: "Normalization" },
        { time: "11:00 AM", class: "SE-COMP-B", subject: "AI", topic: "Neural Networks" },
        { time: "2:00 PM", class: "TE-COMP-A", subject: "OS", topic: "Process Scheduling" }
      ],
      recentNotices: [
        { id: 1, title: "Faculty Meeting", date: "2024-03-16", time: "3 PM" },
        { id: 2, title: "Exam Duty", date: "2024-03-20", time: "10 AM" }
      ]
    });

    // Welcome message based on user type selection
    setMessages([{
      sender: "bot",
      text: "👋 Welcome to Campus AI Assistant!\n\nPlease select your role to continue:",
      options: ["🎓 Student", "👨‍🏫 Faculty"]
    }]);
  }, []);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleRoleSelection = (role) => {
    setUserType(role === "🎓 Student" ? "student" : "faculty");
    
    const welcomeMessages = {
      student: `Welcome back, ${studentData?.name || 'Student'}! 👋\n\nYou can ask me about:\n• 📚 Timetable\n• 📊 Results\n• 📝 Attendance\n• 📢 Notices\n• 📋 Assignments`,
      faculty: `Welcome, ${facultyData?.name || 'Faculty'}! 👋\n\nI can help you with:\n• 📋 Attendance marking\n• 👥 Student lists\n• 📢 Upload notices\n• 📅 Today's schedule`
    };

    setMessages(prev => [...prev, 
      { sender: "user", text: role },
      { sender: "bot", text: welcomeMessages[role === "🎓 Student" ? "student" : "faculty"] }
    ]);
  };

  const formatTimetable = () => {
    if (!studentData?.timetable) return "No timetable available";
    
    return `📅 Weekly Timetable - Semester ${studentData.semester}\n\n${
      studentData.timetable.map(day => 
        `📌 ${day.day}:\n${day.subjects.map(s => `   • ${s}`).join('\n')}`
      ).join('\n\n')
    }`;
  };

  const formatResults = () => {
    if (!studentData?.results) return "No results available";
    
    return `📊 Academic Results\n\n` +
      `Semester 4 Results:\n` +
      `• DBMS: ${studentData.results.semester4.DBMS}\n` +
      `• OS: ${studentData.results.semester4.OS}\n` +
      `• AI: ${studentData.results.semester4.AI}\n` +
      `• Computer Networks: ${studentData.results.semester4.CN}\n` +
      `• Maths: ${studentData.results.semester4.Maths}\n\n` +
      `🎯 Current CGPA: ${studentData.results.semester4.totalCGPA}\n` +
      `📈 Previous CGPA: ${studentData.results.semester3.totalCGPA}`;
  };

  const formatAttendance = () => {
    if (!studentData?.attendance) return "No attendance data available";
    
    const attendance = studentData.attendance;
    return `📋 Attendance Report\n\n` +
      `Subject-wise:\n` +
      `• DBMS: ${attendance.DBMS}% ${attendance.DBMS < 75 ? '⚠️' : '✅'}\n` +
      `• OS: ${attendance.OS}% ${attendance.OS < 75 ? '⚠️' : '✅'}\n` +
      `• AI: ${attendance.AI}% ✅\n` +
      `• CN: ${attendance.CN}% ${attendance.CN < 75 ? '⚠️' : '✅'}\n` +
      `• Maths: ${attendance.Maths}% ✅\n\n` +
      `📊 Overall Attendance: ${attendance.overall}%\n` +
      `${attendance.overall < 75 ? '⚠️ Below 75% - Please attend classes regularly!' : '✅ Good standing'}`;
  };

  const formatNotices = () => {
    if (!studentData?.notices) return "No notices available";
    
    return `📢 Latest Notices\n\n${
      studentData.notices.map(notice => 
        `📌 ${notice.title}\n   📅 ${notice.date}\n   📝 ${notice.content}`
      ).join('\n\n')
    }`;
  };

  const formatAssignments = () => {
    if (!studentData?.assignments) return "No assignments available";
    
    return `📚 Pending Assignments\n\n${
      studentData.assignments.map(ass => 
        `📌 ${ass.subject}: ${ass.title}\n   📅 Deadline: ${ass.deadline}\n   Status: ${ass.status === 'Pending' ? '⏳' : '✅'} ${ass.status}`
      ).join('\n\n')
    }`;
  };

  // Faculty response formatters
  const formatAttendancePanel = () => {
    if (!facultyData?.classes) return "No classes assigned";
    
    return `📋 Attendance Panel\n\nYour Classes:\n${
      facultyData.classes.map(cls => 
        `• ${cls.id} - ${cls.subject}\n  Students: ${cls.students}\n  Time: ${cls.time}`
      ).join('\n\n')
    }\n\nSelect a class to mark attendance in Faculty Dashboard.`;
  };

  const formatStudentList = () => {
    if (!facultyData?.studentList) return "No students available";
    
    return `👥 Student Lists\n\n${
      Object.entries(facultyData.studentList).map(([className, students]) => 
        `📌 ${className}:\n${
          students.map((s, i) => `   ${i+1}. ${s.name} (${s.rollNo}) - ${s.attendance}%`).join('\n')
        }`
      ).join('\n\n')
    }`;
  };

  const formatTodaysSchedule = () => {
    if (!facultyData?.todaysClasses) return "No classes today";
    
    return `📅 Today's Schedule\n\n${
      facultyData.todaysClasses.map(cls => 
        `⏰ ${cls.time}\n   Class: ${cls.class}\n   Subject: ${cls.subject}\n   Topic: ${cls.topic}`
      ).join('\n\n')
    }`;
  };

  const sendMessage = async (text = input) => {
    if (!text.trim() || !userType) return;

    const userMessage = { sender: "user", text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const query = text.toLowerCase();
      let botResponse = "";

      if (!userType) {
        if (query.includes("student") || query.includes("🎓")) {
          handleRoleSelection("🎓 Student");
          return;
        } else if (query.includes("faculty") || query.includes("👨‍🏫")) {
          handleRoleSelection("👨‍🏫 Faculty");
          return;
        }
      }

      // Student features
      if (userType === "student") {
        if (query.includes("timetable") || query.includes("time table")) {
          botResponse = formatTimetable();
        } else if (query.includes("result") || query.includes("marks") || query.includes("grade")) {
          botResponse = formatResults();
        } else if (query.includes("attendance")) {
          botResponse = formatAttendance();
        } else if (query.includes("notice") || query.includes("announcement")) {
          botResponse = formatNotices();
        } else if (query.includes("assignment") || query.includes("homework")) {
          botResponse = formatAssignments();
        } else {
          // AI fallback for student queries
          const context = `Student query about college: ${text}. Provide helpful response.`;
          const result = await model.generateContent(context);
          botResponse = result.response.text();
        }
      }
      // Faculty features
      else if (userType === "faculty") {
        if (query.includes("attendance")) {
          botResponse = formatAttendancePanel();
        } else if (query.includes("student list") || query.includes("students")) {
          botResponse = formatStudentList();
        } else if (query.includes("upload notice") || query.includes("create notice")) {
          botResponse = "📝 To upload a notice:\n1. Go to Faculty Dashboard\n2. Click on 'Notices' section\n3. Click 'Upload New Notice'\n4. Fill title and description\n5. Select target classes\n6. Click Publish";
        } else if (query.includes("schedule") || query.includes("today") || query.includes("class")) {
          botResponse = formatTodaysSchedule();
        } else {
          // AI fallback for faculty queries
          const context = `Faculty query about teaching/administration: ${text}. Provide helpful response.`;
          const result = await model.generateContent(context);
          botResponse = result.response.text();
        }
      }

      setMessages([...newMessages, { sender: "bot", text: botResponse }]);

    } catch (error) {
      console.error(error);
      setMessages([...newMessages, {
        sender: "bot",
        text: "⚠️ Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div style={styles.chatIcon} onClick={toggleChat}>
        {isOpen ? "✕" : "💬"}
        {!isOpen && messages.length > 1 && (
          <span style={styles.notificationBadge}>•</span>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <span style={styles.headerIcon}>🤖</span>
              <div>
                <div style={styles.headerTitle}>Campus AI Assistant</div>
                <div style={styles.headerSubtitle}>
                  {userType === 'student' ? `🎓 ${studentData?.name}` : 
                   userType === 'faculty' ? `👨‍🏫 ${facultyData?.name}` : 
                   'Select your role'}
                </div>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={toggleChat}>✕</button>
          </div>

          {/* Messages */}
          <div style={styles.messagesContainer} id="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} style={styles.messageWrapper}>
                {msg.sender === 'bot' && (
                  <div style={styles.botAvatar}>🤖</div>
                )}
                <div
                  style={{
                    ...styles.message,
                    ...(msg.sender === "user" ? styles.userMessage : styles.botMessage)
                  }}
                >
                  {msg.text.split('\n').map((line, j) => (
                    <React.Fragment key={j}>
                      {line}
                      {j < msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  
                  {msg.options && (
                    <div style={styles.optionsContainer}>
                      {msg.options.map((option, j) => (
                        <button
                          key={j}
                          style={styles.optionButton}
                          onClick={() => handleRoleSelection(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.sender === 'user' && (
                  <div style={styles.userAvatar}>👤</div>
                )}
              </div>
            ))}
            
            {loading && (
              <div style={styles.messageWrapper}>
                <div style={styles.botAvatar}>🤖</div>
                <div style={{...styles.message, ...styles.botMessage}}>
                  <div style={styles.typingIndicator}>
                    <span>•</span><span>•</span><span>•</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {userType && (
            <div style={styles.quickActions}>
              {userType === 'student' ? (
                <>
                  <button onClick={() => sendMessage("Show timetable")} style={styles.quickActionBtn}>
                    📅 Timetable
                  </button>
                  <button onClick={() => sendMessage("Show attendance")} style={styles.quickActionBtn}>
                    📋 Attendance
                  </button>
                  <button onClick={() => sendMessage("Show results")} style={styles.quickActionBtn}>
                    📊 Results
                  </button>
                  <button onClick={() => sendMessage("Show notices")} style={styles.quickActionBtn}>
                    📢 Notices
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => sendMessage("Show attendance panel")} style={styles.quickActionBtn}>
                    📋 Attendance
                  </button>
                  <button onClick={() => sendMessage("Show student list")} style={styles.quickActionBtn}>
                    👥 Students
                  </button>
                  <button onClick={() => sendMessage("Today's schedule")} style={styles.quickActionBtn}>
                    📅 Schedule
                  </button>
                </>
              )}
            </div>
          )}

          {/* Input Area */}
          <div style={styles.inputContainer}>
            <input
              type="text"
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={userType ? "Type your message..." : "Please select your role first..."}
              disabled={!userType}
            />
            <button
              style={{
                ...styles.sendButton,
                opacity: (!input.trim() || !userType) ? 0.6 : 1,
                cursor: (!input.trim() || !userType) ? 'not-allowed' : 'pointer'
              }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || !userType}
            >
              📤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Modern styles
const styles = {
  chatIcon: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 24,
    boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
    transition: "all 0.3s ease",
    zIndex: 1000
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 12,
    color: "#ff6b6b",
    fontSize: 24
  },
  chatWindow: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 380,
    height: 600,
    background: "#ffffff",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
    overflow: "hidden",
    zIndex: 1000,
    animation: "slideIn 0.3s ease"
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  headerIcon: {
    fontSize: 24
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 600
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.9,
    marginTop: 2
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "#f8fafd"
  },
  messageWrapper: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start"
  },
  botAvatar: {
    width: 32,
    height: 32,
    background: "#e0e7ff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0
  },
  userAvatar: {
    width: 32,
    height: 32,
    background: "#667eea",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#fff",
    flexShrink: 0
  },
  message: {
    padding: "12px 16px",
    borderRadius: 18,
    maxWidth: "calc(100% - 80px)",
    fontSize: 14,
    lineHeight: 1.5,
    wordWrap: "break-word"
  },
  userMessage: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    borderBottomRightRadius: 4,
    marginLeft: "auto"
  },
  botMessage: {
    background: "#ffffff",
    color: "#1a1a1a",
    borderBottomLeftRadius: 4,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
  },
  optionsContainer: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap"
  },
  optionButton: {
    padding: "8px 16px",
    background: "#f0f4ff",
    border: "1px solid #e0e7ff",
    borderRadius: 20,
    fontSize: 13,
    color: "#4f46e5",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  typingIndicator: {
    display: "flex",
    gap: 4,
    padding: "4px 8px"
  },
  quickActions: {
    padding: "12px 16px",
    background: "#ffffff",
    borderTop: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
    display: "flex",
    gap: 8,
    overflowX: "auto",
    scrollbarWidth: "none"
  },
  quickActionBtn: {
    padding: "8px 16px",
    background: "#f8fafd",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    fontSize: 13,
    color: "#4a5568",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  inputContainer: {
    padding: "16px 20px",
    background: "#ffffff",
    borderTop: "1px solid #edf2f7",
    display: "flex",
    gap: 8
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s ease",
    background: "#f8fafd"
  },
  sendButton: {
    width: 44,
    height: 44,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "50%",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
  }
};

export default ChatWidget;