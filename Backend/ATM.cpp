#include "ATM.h"
#include <iostream>
#include <stdexcept>

using namespace std;

// Constructor
ATM::ATM(int initialPin, double initialBalance) {
    if (initialPin < 1000 || initialPin > 9999) {
        throw invalid_argument("PIN must be a 4-digit number.");
    }

    if (initialBalance < 0) {
        throw invalid_argument("Initial balance cannot be negative.");
    }

    pin = initialPin;
    balance = initialBalance;
    failedAttempts = 0;
    isAuthenticated = false;
    isLocked = false;
}

// PIN verification
bool ATM::verifyPIN(int enteredPin) {
    if (isLocked) {
        cout << "ATM is locked due to multiple incorrect attempts.\n";
        return false;
    }

    if (enteredPin == pin) {
        isAuthenticated = true;
        failedAttempts = 0;
        cout << "PIN verified successfully!\n";
        return true;
    }

    failedAttempts++;

    cout << "Incorrect PIN. Attempts remaining: "
         << 3 - failedAttempts << "\n";

    if (failedAttempts >= 3) {
        isLocked = true;
        cout << "ATM locked! Too many incorrect attempts.\n";
    }

    return false;
}

// Balance enquiry
double ATM::checkBalance() {
    if (isLocked || !isAuthenticated) {
        throw runtime_error("Please authenticate yourself first.");
    }

    return balance;
}

// Deposit money
double ATM::deposit(double amount) {
    if (isLocked || !isAuthenticated) {
        throw runtime_error("Please authenticate yourself first.");
    }

    if (amount <= 0) {
        throw invalid_argument("Deposit amount must be positive.");
    }

    balance += amount;

    transactions.push_back({"Deposit", amount, balance});

    return balance;
}

// Withdraw money
double ATM::withdraw(double amount) {
    if (isLocked || !isAuthenticated) {
        throw runtime_error("Please authenticate yourself first.");
    }

    if (amount <= 0) {
        throw invalid_argument("Withdrawal amount must be positive.");
    }

    if (amount > balance) {
        throw runtime_error("Insufficient balance.");
    }

    balance -= amount;

    transactions.push_back({"Withdrawal", amount, balance});

    return balance;
}

// Check lock status
bool ATM::getLockStatus() {
    return isLocked;
}

// End current user session
void ATM::logout() {
    isAuthenticated = false;
}

// Get authentication status
bool ATM::getAuthStatus() const {
    return isAuthenticated;
}

// Get remaining PIN attempts
int ATM::getRemainingAttempts() const {
    int remaining = 3 - failedAttempts;
    return (remaining > 0) ? remaining : 0;
}

const std::vector<Transaction>& ATM::getTransactionHistory() const {
    return transactions;
}