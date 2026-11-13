#ifndef ATM_H
#define ATM_H

class ATM {
private:
    int pin;
    double balance;
    int failedAttempts;
    bool isAuthenticated;
    bool isLocked;

public:
    ATM(int initialPin, double initialBalance);

    bool verifyPIN(int enteredPin);

    double checkBalance();

    double deposit(double amount);

    double withdraw(double amount);

    bool getLockStatus();
};

#endif
