#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
#include "ATM.h"
#include "httplib.h"
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

int main() {
    // Initializing the ATM object with initial PIN 1234 and balance Rs. 10000
    // Demonstrating Object Creation, Constructor, and Encapsulation
    ATM atm(1234, 10000.0);

    httplib::Server svr;

    // Set CORS headers for seamless frontend-backend communication
    svr.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type, Authorization"}
    });

    // Handle preflight OPTIONS requests
    svr.Options(".*", [](const httplib::Request&, httplib::Response& res) {
        res.status = 200;
    });

    // ==========================================
    // API ENDPOINT 1: USER AUTHENTICATION / LOGIN
    // ==========================================
    svr.Post("/api/login", [&atm](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Content-Type", "application/json");

        if (atm.getLockStatus()) {
            json err = {
                {"success", false},
                {"message", "ATM is locked due to multiple incorrect attempts. Please contact bank."},
                {"isLocked", true},
                {"remainingAttempts", 0}
            };
            res.status = 403;
            res.set_content(err.dump(), "application/json");
            return;
        }

        try {
            auto body = json::parse(req.body);
            if (!body.contains("pin")) {
                json err = {
                    {"success", false},
                    {"message", "PIN is required."}
                };
                res.status = 400;
                res.set_content(err.dump(), "application/json");
                return;
            }

            int enteredPin = 0;
            if (body["pin"].is_number()) {
                enteredPin = body["pin"].get<int>();
            } else if (body["pin"].is_string()) {
                enteredPin = std::stoi(body["pin"].get<string>());
            } else {
                json err = {
                    {"success", false},
                    {"message", "Invalid PIN format. Must be numeric."}
                };
                res.status = 400;
                res.set_content(err.dump(), "application/json");
                return;
            }

            bool verified = atm.verifyPIN(enteredPin);

            if (verified) {
                json success = {
                    {"success", true},
                    {"message", "PIN verified successfully!"},
                    {"balance", atm.checkBalance()},
                    {"isLocked", false},
                    {"remainingAttempts", atm.getRemainingAttempts()}
                };
                res.status = 200;
                res.set_content(success.dump(), "application/json");
            } else {
                bool isLocked = atm.getLockStatus();
                int remaining = atm.getRemainingAttempts();

                string msg = isLocked
                    ? "ATM locked! Too many incorrect attempts."
                    : "Incorrect PIN. Attempts remaining: " + to_string(remaining);

                json fail = {
                    {"success", false},
                    {"message", msg},
                    {"isLocked", isLocked},
                    {"remainingAttempts", remaining}
                };
                res.status = isLocked ? 403 : 401;
                res.set_content(fail.dump(), "application/json");
            }
        } catch (const exception& e) {
            json err = {
                {"success", false},
                {"message", string("Error: ") + e.what()}
            };
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    });

    // ==========================================
    // API ENDPOINT 2: BALANCE ENQUIRY
    // ==========================================
    svr.Get("/api/balance", [&atm](const httplib::Request&, httplib::Response& res) {
        res.set_header("Content-Type", "application/json");

        try {
            double bal = atm.checkBalance();
            json resp = {
                {"success", true},
                {"balance", bal}
            };
            res.status = 200;
            res.set_content(resp.dump(), "application/json");
        } catch (const runtime_error& e) {
            json err = {
                {"success", false},
                {"message", e.what()},
                {"isLocked", atm.getLockStatus()}
            };
            res.status = 401;
            res.set_content(err.dump(), "application/json");
        }
    });

    // ==========================================
    // API ENDPOINT 3: CASH DEPOSIT
    // ==========================================
    svr.Post("/api/deposit", [&atm](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Content-Type", "application/json");

        try {
            auto body = json::parse(req.body);
            if (!body.contains("amount")) {
                json err = {{"success", false}, {"message", "Amount is required."}};
                res.status = 400;
                res.set_content(err.dump(), "application/json");
                return;
            }

            double amount = 0.0;
            if (body["amount"].is_number()) {
                amount = body["amount"].get<double>();
            } else if (body["amount"].is_string()) {
                amount = std::stod(body["amount"].get<string>());
            } else {
                throw invalid_argument("Invalid amount format.");
            }

            double newBal = atm.deposit(amount);

            json success = {
                {"success", true},
                {"message", "Amount deposited successfully!"},
                {"depositedAmount", amount},
                {"balance", newBal}
            };
            res.status = 200;
            res.set_content(success.dump(), "application/json");
        } catch (const invalid_argument& e) {
            json err = {{"success", false}, {"message", e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        } catch (const runtime_error& e) {
            json err = {{"success", false}, {"message", e.what()}};
            res.status = 401;
            res.set_content(err.dump(), "application/json");
        } catch (const exception& e) {
            json err = {{"success", false}, {"message", string("Invalid request: ") + e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    });

    // ==========================================
    // API ENDPOINT 4: CASH WITHDRAWAL
    // ==========================================
    svr.Post("/api/withdraw", [&atm](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Content-Type", "application/json");

        try {
            auto body = json::parse(req.body);
            if (!body.contains("amount")) {
                json err = {{"success", false}, {"message", "Amount is required."}};
                res.status = 400;
                res.set_content(err.dump(), "application/json");
                return;
            }

            double amount = 0.0;
            if (body["amount"].is_number()) {
                amount = body["amount"].get<double>();
            } else if (body["amount"].is_string()) {
                amount = std::stod(body["amount"].get<string>());
            } else {
                throw invalid_argument("Invalid amount format.");
            }

            double newBal = atm.withdraw(amount);

            json success = {
                {"success", true},
                {"message", "Please collect your cash."},
                {"withdrawnAmount", amount},
                {"balance", newBal}
            };
            res.status = 200;
            res.set_content(success.dump(), "application/json");
        } catch (const invalid_argument& e) {
            json err = {{"success", false}, {"message", e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        } catch (const runtime_error& e) {
            json err = {{"success", false}, {"message", e.what()}};
            // Distinguish authentication error vs insufficient balance
            string msg = e.what();
            res.status = (msg.find("authenticate") != string::npos) ? 401 : 400;
            res.set_content(err.dump(), "application/json");
        } catch (const exception& e) {
            json err = {{"success", false}, {"message", string("Invalid request: ") + e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    });

    // ==========================================
    // API ENDPOINT 5: TRANSACTION HISTORY
    // ==========================================
    svr.Get("/api/transactions", [&atm](const httplib::Request&, httplib::Response& res) {
        res.set_header("Content-Type", "application/json");

        if (!atm.getAuthStatus()) {
            json err = {{"success", false}, {"message", "Please authenticate yourself first."}};
            res.status = 401;
            res.set_content(err.dump(), "application/json");
            return;
        }

        const auto& history = atm.getTransactionHistory();
        json txList = json::array();

        for (size_t i = 0; i < history.size(); ++i) {
            txList.push_back({
                {"id", static_cast<int>(i + 1)},
                {"type", history[i].type},
                {"amount", history[i].amount},
                {"balanceAfter", history[i].balanceAfter}
            });
        }

        json resp = {
            {"success", true},
            {"transactions", txList},
            {"balance", atm.checkBalance()}
        };
        res.status = 200;
        res.set_content(resp.dump(), "application/json");
    });

    // ==========================================
    // API ENDPOINT 6: LOGOUT
    // ==========================================
    svr.Post("/api/logout", [&atm](const httplib::Request&, httplib::Response& res) {
        res.set_header("Content-Type", "application/json");
        atm.logout();
        json resp = {
            {"success", true},
            {"message", "Thank you for using our ATM! You have been logged out successfully."}
        };
        res.status = 200;
        res.set_content(resp.dump(), "application/json");
    });

    // ==========================================
    // API ENDPOINT 7: STATUS / HEALTH CHECK
    // ==========================================
    svr.Get("/api/status", [&atm](const httplib::Request&, httplib::Response& res) {
        res.set_header("Content-Type", "application/json");
        json resp = {
            {"success", true},
            {"isAuthenticated", atm.getAuthStatus()},
            {"isLocked", atm.getLockStatus()},
            {"remainingAttempts", atm.getRemainingAttempts()}
        };
        res.status = 200;
        res.set_content(resp.dump(), "application/json");
    });

    // Mount static frontend files if folder exists
    string frontendPath = "";
    if (filesystem::exists("./frontend")) {
        frontendPath = "./frontend";
    } else if (filesystem::exists("../frontend")) {
        frontendPath = "../frontend";
    }

    if (!frontendPath.empty()) {
        svr.set_mount_point("/", frontendPath);
        cout << "[ATM Server] Serving static frontend from: " << frontendPath << "\n";
    }

    int port = 8080;
    cout << "=======================================================\n";
    cout << "    ATM SIMULATION SYSTEM - C++ REST API BACKEND       \n";
    cout << "=======================================================\n";
    cout << "[ATM Server] Initial Account Balance : Rs. 10000.00\n";
    cout << "[ATM Server] Default 4-Digit PIN     : 1234\n";
    cout << "[ATM Server] Server listening on     : http://localhost:" << port << "\n";
    cout << "[ATM Server] Open in browser         : http://localhost:" << port << "\n";
    cout << "=======================================================\n";

    if (!svr.listen("0.0.0.0", port)) {
        cerr << "[ATM Server Error] Failed to bind to port " << port << "!\n";
        return 1;
    }

    return 0;
}
