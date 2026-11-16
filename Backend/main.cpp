
#include <iostream>
#include <limits>
#include "ATM.h"

using namespace std;

int main() {
    // Creating ATM object
    ATM atm(1234, 10000);

    int enteredPin;
    int choice;
    double amount;

    cout << "===== WELCOME TO ATM =====\n";

    // PIN verification
    for (int i = 0; i < 3; i++) {
        cout << "Enter your 4-digit PIN: ";

        if (!(cin >> enteredPin)) {
            cout << "Invalid input! Please enter numbers only.\n";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            i--;
            continue;
        }

        if (atm.verifyPIN(enteredPin)) {
            break;
        }

        if (atm.getLockStatus()) {
            return 0;
        }
    }

    if (atm.getLockStatus()) {
        return 0;
    }

    // ATM menu
    do {
        cout << "\n===== ATM MENU =====\n";
        cout << "1. Balance Enquiry\n";
        cout << "2. Deposit Money\n";
        cout << "3. Withdraw Money\n";
        cout << "4. Transaction History\n";
        cout << "5. Exit\n";
        cout << "Enter your choice: ";

        if (!(cin >> choice)) {
            cout << "Invalid choice! Enter a number.\n";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            continue;
        }

        try {
            switch (choice) {

                case 1:
                    cout << "Available Balance: Rs. "
                         << atm.checkBalance() << "\n";
                    break;

                case 2:
                    cout << "Enter amount to deposit: ";
                    if (!(cin >> amount)) {
                        throw invalid_argument("Please enter a valid number.");
                    }

                    cout << "Amount deposited successfully!\n";
                    cout << "Updated Balance: Rs. "
                         << atm.deposit(amount) << "\n";
                    break;

                case 3:
                    cout << "Enter amount to withdraw: ";
                    if (!(cin >> amount)) {
                        throw invalid_argument("Please enter a valid number.");
                    }

                    {
                    double newBalance = atm.withdraw(amount);
                    cout << "Please collect your cash.\n";
                    cout << "Updated Balance: Rs. " << newBalance << "\n";
                    }
                    break;

                case 4: {
                   const vector<Transaction>& history = atm.getTransactionHistory();

                   if (history.empty()) {
                        cout << "No transactions found.\n";
                    }
                   else {
                        cout << "\n===== TRANSACTION HISTORY =====\n";

                        for (int i = 0; i < history.size(); i++) {
                            cout << "\nTransaction " << i + 1 << "\n";
                            cout << "Type: " << history[i].type << "\n";
                            cout << "Amount: Rs. " << history[i].amount << "\n";
                            cout << "Balance After Transaction: Rs. "
                            << history[i].balanceAfter << "\n";
                        }
                    }
                    break;
            }

                case 5:
                    cout << "Thank you for using our ATM!\n";
                    break;

                default:
                    cout << "Invalid menu choice!\n";
            }
        }
        catch (const invalid_argument& e) {
            cout << "Invalid Input: " << e.what() << "\n";
        }
        catch (const runtime_error& e) {
            cout << "Transaction Error: " << e.what() << "\n";
        }

    } while (choice != 5);

    return 0;
}
