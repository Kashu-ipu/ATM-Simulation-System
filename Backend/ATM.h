#ifndef ATM_H
#define ATM_H
#include <vector>
#include <string>

struct Transaction {
    std::string type;
    double amount;
    double balanceAfter;
};

class ATM {
private:
    int pin;
    double balance;
    int failedAttempts;
    bool isAuthenticated;
    bool isLocked;
    std::vector<Transaction> transactions;

public:
    ATM(int initialPin, double initialBalance);

    bool verifyPIN(int enteredPin);

    double checkBalance();

    double deposit(double amount);

    double withdraw(double amount);

    bool getLockStatus();

    void logout();

    bool getAuthStatus() const;

    int getRemainingAttempts() const;

    const std::vector<Transaction>& getTransactionHistory() const;
};

#endif
