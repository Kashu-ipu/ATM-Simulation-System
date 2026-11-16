# ATM Simulation System (OOPs Practical Project)

An interactive, full-stack **ATM Simulation System** designed for a second-year B.Tech IT Object-Oriented Programming (OOPs) project. The project demonstrates core C++ OOPs concepts connected to a responsive, dark navy blue banking web interface.

---

## 🏛️ Project Architecture

The project consists of an authentic **C++ backend** communicating via HTTP and JSON with a **pure HTML5/CSS3/Vanilla JS** frontend. All account balances, transaction validations, authentication attempts, and history records remain strictly on the C++ backend.

```
ATM-Simulation-System/
├── Backend/
│   ├── ATM.h             # ATM Class header & Transaction struct
│   ├── ATM.cpp           # ATM Class member function definitions
│   ├── server.cpp        # Lightweight C++ HTTP REST API Server
│   ├── main.cpp          # Console/CLI interactive ATM mode
│   ├── httplib.h         # cpp-httplib (single-header HTTP server)
│   ├── json.hpp          # nlohmann/json (single-header JSON library)
│   ├── server.exe        # Compiled web backend executable
│   └── atm.exe           # Compiled console executable
├── frontend/
│   ├── index.html        # 7-Screen ATM Kiosk UI & interactive keypad
│   ├── style.css         # Modern dark navy blue banking stylesheet
│   └── script.js         # Frontend controller & API fetch client
└── README.md             # Project documentation & viva guide
```

---

## 💡 Object-Oriented Programming (OOP) Concepts Demonstrated

| OOP Concept | Implementation in this Project |
| :--- | :--- |
| **Classes & Objects** | `ATM` class represents the ATM machine entity; objects (`ATM atm(1234, 10000.0);`) are instantiated to maintain state. |
| **Encapsulation** | Sensitive state (`pin`, `balance`, `failedAttempts`, `isAuthenticated`, `isLocked`, `transactions`) is declared `private` and only accessed or modified through authorized public member functions. |
| **Constructors** | Parameterized constructor `ATM(int initialPin, double initialBalance)` validates 4-digit PIN bounds and non-negative initial balance before initialization. |
| **Member Functions** | Methods like `verifyPIN()`, `checkBalance()`, `deposit()`, `withdraw()`, `logout()`, `getLockStatus()` implement business logic. |
| **Access Specifiers** | Clear demarcation between `private` variables and `public` API interfaces. |
| **Data Abstraction** | The frontend and client interact through abstract banking operations (`checkBalance()`, `withdraw()`) without needing to know internal data structures. |
| **Exception Handling** | Throws and catches `std::invalid_argument` (for negative amounts, invalid PIN formats) and `std::runtime_error` (for unauthenticated access, insufficient funds). |
| **STL Container (`std::vector`)** | `std::vector<Transaction> transactions;` dynamically stores audit trails of deposits and withdrawals. |

---

## 🖥️ The 7 ATM Screens

1. **ATM Welcome & PIN Login**: Interactive numeric keypad (0–9, CLEAR, ENTER), PIN dot masking, attempt countdown, and 3-attempt lock protection.
2. **ATM Dashboard**: Real-time balance card synced with C++, greeting, account badge, and quick action cards.
3. **Balance Enquiry**: Formatted ATM receipt slip showing current balance, timestamp, and account details.
4. **Cash Deposit**: Deposit input with quick increment chips (+₹500, +₹1,000, +₹2,000, +₹5,000) and balance updates.
5. **Cash Withdrawal**: Input with quick withdrawal chips, insufficient balance checking, and cash dispensing confirmation.
6. **Transaction History**: Audit trail table displaying transaction type (Deposit/Withdrawal), amount, and post-transaction balance with an empty state.
7. **Logout**: Confirmation modal, secure session termination on the C++ backend, and redirection to login.

---

## 🔌 Backend REST API Endpoints

| Method | Endpoint | Description | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | Authenticate 4-digit PIN | `{"pin": 1234}` | `{"success": true, "balance": 10000.0, ...}` |
| `GET` | `/api/balance` | Query current balance | _None_ | `{"success": true, "balance": 10000.0}` |
| `POST` | `/api/deposit` | Deposit positive amount | `{"amount": 2500}` | `{"success": true, "balance": 12500.0, ...}` |
| `POST` | `/api/withdraw` | Withdraw cash | `{"amount": 1500}` | `{"success": true, "balance": 11000.0, ...}` |
| `GET` | `/api/transactions`| Fetch STL vector history | _None_ | `{"success": true, "transactions": [...]}` |
| `POST` | `/api/logout` | Terminate session | _None_ | `{"success": true, "message": "..."}` |
| `GET` | `/api/status` | ATM machine status | _None_ | `{"isAuthenticated": false, "isLocked": false}` |

---

## 🚀 How to Run the Application

### Option A: Web Application Mode (C++ Backend + Web Frontend)

#### 1. Compile the C++ Backend Server
Open PowerShell / Command Prompt in the project root directory and run:

```powershell
g++ -std=c++17 -O2 Backend/ATM.cpp Backend/server.cpp -o Backend/server.exe -lws2_32
```

#### 2. Start the Backend Server
```powershell
.\Backend\server.exe
```

Output:
```
=======================================================
    ATM SIMULATION SYSTEM - C++ REST API BACKEND       
=======================================================
[ATM Server] Serving static frontend from: ./frontend
[ATM Server] Initial Account Balance : Rs. 10000.00
[ATM Server] Default 4-Digit PIN     : 1234
[ATM Server] Server listening on     : http://localhost:8080
[ATM Server] Open in browser         : http://localhost:8080
=======================================================
```

#### 3. Open in Browser
Visit **[http://localhost:8080](http://localhost:8080)** in any modern web browser.
- **Default PIN:** `1234`
- **Initial Balance:** `₹10,000`

---

### Option B: Interactive Console / CLI Mode (For Viva/CLI Demonstration)

To demonstrate the pure command-line version during viva:

```powershell
# Compile CLI version
g++ -std=c++17 -O2 Backend/ATM.cpp Backend/main.cpp -o Backend/atm.exe

# Run CLI version
.\Backend\atm.exe
```

---

## 🧪 Verified Test Cases

The application has been verified against all 12 test specifications:

1. ✅ **Successful PIN authentication**: Validated using PIN `1234`.
2. ✅ **Incorrect PIN handling**: Increments failed attempts and displays remaining tries.
3. ✅ **Three incorrect attempts session lock**: ATM session locks completely after 3 incorrect tries, denying further operations until reset.
4. ✅ **Balance enquiry**: Live balance retrieved directly from C++ `checkBalance()`.
5. ✅ **Successful cash deposit**: Balance updates correctly in C++ backend memory.
6. ✅ **Invalid deposit handling**: Negative or zero values rejected by `std::invalid_argument`.
7. ✅ **Successful cash withdrawal**: Validated and deducted from balance.
8. ✅ **Insufficient funds error**: Withdrawing amounts exceeding available funds is blocked by `std::runtime_error`.
9. ✅ **Transaction history**: Every deposit and withdrawal is logged in `std::vector<Transaction>`.
10. ✅ **Logout**: Ends active session and resets authentication flags.
11. ✅ **Protected operations guard**: Calling deposit, withdrawal, or balance while unauthenticated returns HTTP 401.
12. ✅ **Seamless integration**: Frontend communicates with C++ backend using asynchronous HTTP requests with CORS support.

---

## 🎓 College Viva Preparation Guide

**Q1: Why are the balance and PIN declared as private?**  
*Answer:* To uphold the principle of **Encapsulation**. By keeping them private, external code cannot arbitrarily modify the balance or bypass PIN verification without invoking validated member functions.

**Q2: What is the purpose of the constructor here?**  
*Answer:* The parameterized constructor initializes the object state upon creation, verifying that the PIN is a 4-digit integer and that the initial balance is non-negative.

**Q3: How are transactions maintained?**  
*Answer:* We use `std::vector<Transaction>` from the C++ Standard Template Library (STL). A `Transaction` struct holds the `type`, `amount`, and `balanceAfter`.

**Q4: How does the web frontend talk to the C++ code?**  
*Answer:* The C++ program hosts a lightweight HTTP server using `cpp-httplib`. When the user clicks an action in the browser, JavaScript issues an asynchronous `fetch()` HTTP request (e.g., `POST /api/withdraw`). The C++ server parses the JSON payload, calls the corresponding member function on the `ATM` object, and returns a JSON response.
