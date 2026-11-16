/**
 * ==========================================================================
 * ATM SIMULATION SYSTEM - FRONTEND CLIENT CONTROLLER
 * Second-Year B.Tech IT College OOPs Project
 * Communicates with C++ HTTP Backend via Fetch API
 * ==========================================================================
 */

// Determine Backend API Base URL
// If served from backend server, uses relative path; otherwise defaults to localhost:8080
const API_BASE = window.location.origin.includes(':8080')
  ? '' 
  : 'http://localhost:8080';

// Global state synced directly with C++ backend
let state = {
  currentPin: '',
  isAuthenticated: false,
  isLocked: false,
  balance: 0.0,
  isServerOnline: true
};

// ==========================================================================
// DOM Elements
// ==========================================================================
const views = {
  login: document.getElementById('loginScreen'),
  dashboard: document.getElementById('dashboardScreen'),
  balance: document.getElementById('balanceScreen'),
  deposit: document.getElementById('depositScreen'),
  withdraw: document.getElementById('withdrawScreen'),
  history: document.getElementById('historyScreen'),
  logout: document.getElementById('logoutScreen')
};

// Keypad & Login Elements
const pinDots = document.getElementById('pinDots');
const loginMessage = document.getElementById('loginMessage');
const btnClear = document.getElementById('btnClear');
const btnEnter = document.getElementById('btnEnter');
const keypadBtns = document.querySelectorAll('.key-btn[data-key]');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// Dashboard Elements
const dashBalanceDisplay = document.getElementById('dashBalanceDisplay');
const btnRefreshBalance = document.getElementById('btnRefreshBalance');
const menuCheckBalance = document.getElementById('menuCheckBalance');
const menuDeposit = document.getElementById('menuDeposit');
const menuWithdraw = document.getElementById('menuWithdraw');
const menuHistory = document.getElementById('menuHistory');
const btnDashboardLogout = document.getElementById('btnDashboardLogout');

// Balance Screen Elements
const enquiryBalanceDisplay = document.getElementById('enquiryBalanceDisplay');
const balanceTimestamp = document.getElementById('balanceTimestamp');
const btnBalanceBack = document.getElementById('btnBalanceBack');

// Deposit Screen Elements
const depositCurrentBal = document.getElementById('depositCurrentBal');
const depositAmountInput = document.getElementById('depositAmount');
const btnSubmitDeposit = document.getElementById('btnSubmitDeposit');
const depositMessage = document.getElementById('depositMessage');
const btnDepositBack = document.getElementById('btnDepositBack');
const depositChips = document.querySelectorAll('.chip-btn[data-add]');

// Withdraw Screen Elements
const withdrawCurrentBal = document.getElementById('withdrawCurrentBal');
const withdrawAmountInput = document.getElementById('withdrawAmount');
const btnSubmitWithdraw = document.getElementById('btnSubmitWithdraw');
const withdrawMessage = document.getElementById('withdrawMessage');
const btnWithdrawBack = document.getElementById('btnWithdrawBack');
const withdrawChips = document.querySelectorAll('.chip-btn-set[data-val]');

// History Screen Elements
const historyCount = document.getElementById('historyCount');
const historyCurrentBal = document.getElementById('historyCurrentBal');
const historyTable = document.getElementById('historyTable');
const historyTableBody = document.getElementById('historyTableBody');
const historyEmptyState = document.getElementById('historyEmptyState');
const btnHistoryBack = document.getElementById('btnHistoryBack');

// Logout Elements
const logoutModal = document.getElementById('logoutModal');
const btnCancelLogout = document.getElementById('btnCancelLogout');
const btnConfirmLogout = document.getElementById('btnConfirmLogout');
const btnReturnToLogin = document.getElementById('btnReturnToLogin');

// ==========================================================================
// Web Audio Feedback (Zero-Dependency Tone Synthesizer)
// ==========================================================================
function playAudioTone(freq = 600, type = 'sine', duration = 0.08) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio optional, safe to ignore
  }
}

// ==========================================================================
// View Routing & Transitions
// ==========================================================================
function showScreen(screenKey) {
  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].classList.remove('active');
    }
  });

  if (views[screenKey]) {
    views[screenKey].classList.add('active');
  }

  // Clear transient error/success banners when switching screens
  hideMessage(depositMessage);
  hideMessage(withdrawMessage);
  if (screenKey !== 'login') {
    hideMessage(loginMessage);
  }
}

function formatCurrency(num) {
  if (typeof num !== 'number') {
    num = parseFloat(num) || 0;
  }
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function showMessage(el, text, type = 'error') {
  if (!el) return;
  el.textContent = text;
  el.className = `message-banner ${type}`;
  el.classList.remove('hidden');
}

function hideMessage(el) {
  if (!el) return;
  el.textContent = '';
  el.className = 'message-banner hidden';
}

// ==========================================================================
// API Communication Helpers
// ==========================================================================
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json().catch(() => ({
      success: false,
      message: 'Invalid JSON response from C++ server.'
    }));

    updateServerStatus(true);
    return { ok: response.ok, status: response.status, data: result };
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    updateServerStatus(false);
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message: 'Cannot connect to C++ backend server at localhost:8080. Please ensure Backend/server.exe is running.'
      }
    };
  }
}

function updateServerStatus(online) {
  state.isServerOnline = online;
  if (online) {
    statusIndicator.className = 'status-indicator';
    statusText.textContent = state.isLocked ? 'ATM Locked' : 'ATM Online';
  } else {
    statusIndicator.className = 'status-indicator offline';
    statusText.textContent = 'Server Offline';
  }
}

// ==========================================================================
// SCREEN 1: LOGIN & KEYPAD LOGIC
// ==========================================================================
function updatePinDots() {
  const dots = pinDots.querySelectorAll('.dot');
  dots.forEach((dot, index) => {
    if (index < state.currentPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

function appendPinDigit(digit) {
  if (state.isLocked) {
    showMessage(loginMessage, 'ATM is locked due to multiple incorrect attempts.', 'error');
    return;
  }
  if (state.currentPin.length < 4) {
    state.currentPin += digit;
    playAudioTone(700, 'sine', 0.05);
    updatePinDots();
  }
}

function clearPin() {
  state.currentPin = '';
  updatePinDots();
  hideMessage(loginMessage);
  playAudioTone(400, 'sine', 0.08);
}

async function submitLogin() {
  if (state.isLocked) {
    showMessage(loginMessage, 'ATM is locked. Access denied.', 'error');
    return;
  }

  if (state.currentPin.length !== 4) {
    showMessage(loginMessage, 'Please enter a complete 4-digit PIN.', 'error');
    playAudioTone(250, 'sawtooth', 0.15);
    return;
  }

  btnEnter.disabled = true;
  showMessage(loginMessage, 'Verifying PIN with C++ backend...', 'info');

  const { ok, data } = await apiRequest('/api/login', 'POST', {
    pin: parseInt(state.currentPin, 10)
  });

  btnEnter.disabled = false;

  if (ok && data.success) {
    state.isAuthenticated = true;
    state.balance = data.balance;
    playAudioTone(880, 'sine', 0.12);

    showMessage(loginMessage, 'PIN verified! Loading dashboard...', 'success');
    clearPin();

    setTimeout(() => {
      updateDashboardBalance(state.balance);
      showScreen('dashboard');
    }, 600);
  } else {
    playAudioTone(200, 'sawtooth', 0.2);
    clearPin();

    if (data.isLocked) {
      state.isLocked = true;
      updateServerStatus(true);
      showMessage(loginMessage, data.message || 'ATM Locked! Too many incorrect attempts.', 'error');
    } else {
      showMessage(loginMessage, data.message || 'Incorrect PIN.', 'error');
    }
  }
}

// Keypad Button Event Listeners
keypadBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-key');
    appendPinDigit(key);
  });
});

btnClear.addEventListener('click', clearPin);
btnEnter.addEventListener('click', submitLogin);

// Physical Keyboard Support
document.addEventListener('keydown', (e) => {
  // Only capture keyboard if on login screen
  if (!views.login.classList.contains('active')) return;

  if (e.key >= '0' && e.key <= '9') {
    appendPinDigit(e.key);
  } else if (e.key === 'Backspace' || e.key === 'Escape') {
    clearPin();
  } else if (e.key === 'Enter') {
    submitLogin();
  }
});

// ==========================================================================
// SCREEN 2: DASHBOARD LOGIC
// ==========================================================================
function updateDashboardBalance(bal) {
  state.balance = bal;
  dashBalanceDisplay.textContent = formatCurrency(bal);
  depositCurrentBal.textContent = `₹ ${formatCurrency(bal)}`;
  withdrawCurrentBal.textContent = `₹ ${formatCurrency(bal)}`;
  enquiryBalanceDisplay.textContent = formatCurrency(bal);
  historyCurrentBal.textContent = `₹ ${formatCurrency(bal)}`;
}

async function refreshBalance() {
  btnRefreshBalance.classList.add('loading');
  const { ok, data } = await apiRequest('/api/balance');
  btnRefreshBalance.classList.remove('loading');

  if (ok && data.success) {
    updateDashboardBalance(data.balance);
    playAudioTone(750, 'sine', 0.08);
  } else if (data.message && data.message.includes('authenticate')) {
    handleSessionExpired();
  }
}

btnRefreshBalance.addEventListener('click', refreshBalance);

menuCheckBalance.addEventListener('click', async () => {
  playAudioTone(600, 'sine', 0.08);
  const now = new Date();
  balanceTimestamp.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

  const { ok, data } = await apiRequest('/api/balance');
  if (ok && data.success) {
    updateDashboardBalance(data.balance);
    showScreen('balance');
  } else {
    handleSessionExpired();
  }
});

menuDeposit.addEventListener('click', () => {
  playAudioTone(600, 'sine', 0.08);
  depositAmountInput.value = '';
  hideMessage(depositMessage);
  showScreen('deposit');
  depositAmountInput.focus();
});

menuWithdraw.addEventListener('click', () => {
  playAudioTone(600, 'sine', 0.08);
  withdrawAmountInput.value = '';
  hideMessage(withdrawMessage);
  showScreen('withdraw');
  withdrawAmountInput.focus();
});

menuHistory.addEventListener('click', async () => {
  playAudioTone(600, 'sine', 0.08);
  await loadTransactionHistory();
  showScreen('history');
});

btnDashboardLogout.addEventListener('click', () => {
  logoutModal.classList.remove('hidden');
});

// ==========================================================================
// SCREEN 3: BALANCE ENQUIRY
// ==========================================================================
btnBalanceBack.addEventListener('click', () => {
  playAudioTone(500, 'sine', 0.06);
  showScreen('dashboard');
});

// ==========================================================================
// SCREEN 4: DEPOSIT CASH
// ==========================================================================
depositChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const addVal = parseFloat(chip.getAttribute('data-add')) || 0;
    const currentVal = parseFloat(depositAmountInput.value) || 0;
    depositAmountInput.value = currentVal + addVal;
    playAudioTone(650, 'sine', 0.05);
  });
});

async function executeDeposit() {
  const amountStr = depositAmountInput.value.trim();
  const amount = parseFloat(amountStr);

  if (!amountStr || isNaN(amount) || amount <= 0) {
    showMessage(depositMessage, 'Please enter a valid positive deposit amount.', 'error');
    playAudioTone(250, 'sawtooth', 0.15);
    return;
  }

  btnSubmitDeposit.disabled = true;
  hideMessage(depositMessage);

  const { ok, data } = await apiRequest('/api/deposit', 'POST', { amount });

  btnSubmitDeposit.disabled = false;

  if (ok && data.success) {
    updateDashboardBalance(data.balance);
    showMessage(depositMessage, `Success! ₹ ${formatCurrency(amount)} deposited. Updated Balance: ₹ ${formatCurrency(data.balance)}`, 'success');
    playAudioTone(900, 'sine', 0.15);
    depositAmountInput.value = '';
  } else {
    showMessage(depositMessage, data.message || 'Deposit failed.', 'error');
    playAudioTone(220, 'sawtooth', 0.2);
  }
}

btnSubmitDeposit.addEventListener('click', executeDeposit);
depositAmountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') executeDeposit();
});
btnDepositBack.addEventListener('click', () => {
  showScreen('dashboard');
});

// ==========================================================================
// SCREEN 5: WITHDRAW CASH
// ==========================================================================
withdrawChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const val = parseFloat(chip.getAttribute('data-val')) || 0;
    withdrawAmountInput.value = val;
    playAudioTone(650, 'sine', 0.05);
  });
});

async function executeWithdrawal() {
  const amountStr = withdrawAmountInput.value.trim();
  const amount = parseFloat(amountStr);

  if (!amountStr || isNaN(amount) || amount <= 0) {
    showMessage(withdrawMessage, 'Please enter a valid positive withdrawal amount.', 'error');
    playAudioTone(250, 'sawtooth', 0.15);
    return;
  }

  btnSubmitWithdraw.disabled = true;
  hideMessage(withdrawMessage);

  const { ok, data } = await apiRequest('/api/withdraw', 'POST', { amount });

  btnSubmitWithdraw.disabled = false;

  if (ok && data.success) {
    updateDashboardBalance(data.balance);
    showMessage(withdrawMessage, `Please collect your cash! Withdrawn: ₹ ${formatCurrency(amount)}. Updated Balance: ₹ ${formatCurrency(data.balance)}`, 'success');
    playAudioTone(920, 'sine', 0.15);
    withdrawAmountInput.value = '';
  } else {
    showMessage(withdrawMessage, data.message || 'Withdrawal failed.', 'error');
    playAudioTone(200, 'sawtooth', 0.2);
  }
}

btnSubmitWithdraw.addEventListener('click', executeWithdrawal);
withdrawAmountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') executeWithdrawal();
});
btnWithdrawBack.addEventListener('click', () => {
  showScreen('dashboard');
});

// ==========================================================================
// SCREEN 6: TRANSACTION HISTORY
// ==========================================================================
async function loadTransactionHistory() {
  const { ok, data } = await apiRequest('/api/transactions');

  if (ok && data.success) {
    if (data.balance !== undefined) {
      updateDashboardBalance(data.balance);
    }

    const txs = data.transactions || [];
    historyCount.textContent = `${txs.length} Transaction${txs.length === 1 ? '' : 's'}`;

    if (txs.length === 0) {
      historyTable.classList.add('hidden');
      historyEmptyState.classList.remove('hidden');
      historyTableBody.innerHTML = '';
    } else {
      historyEmptyState.classList.add('hidden');
      historyTable.classList.remove('hidden');

      let html = '';
      txs.forEach((tx, idx) => {
        const isDeposit = tx.type === 'Deposit';
        const badgeClass = isDeposit ? 'badge-deposit' : 'badge-withdrawal';
        const sign = isDeposit ? '+' : '-';
        const amountClass = isDeposit ? 'credit' : 'debit';

        html += `
          <tr>
            <td>${tx.id || idx + 1}</td>
            <td><span class="badge-tx ${badgeClass}">${tx.type}</span></td>
            <td class="tx-amount ${amountClass}">${sign} ₹ ${formatCurrency(tx.amount)}</td>
            <td class="tx-balance">₹ ${formatCurrency(tx.balanceAfter)}</td>
          </tr>
        `;
      });
      historyTableBody.innerHTML = html;
    }
  } else {
    handleSessionExpired();
  }
}

btnHistoryBack.addEventListener('click', () => {
  showScreen('dashboard');
});

// ==========================================================================
// SCREEN 7: LOGOUT & MODAL
// ==========================================================================
btnCancelLogout.addEventListener('click', () => {
  logoutModal.classList.add('hidden');
});

btnConfirmLogout.addEventListener('click', async () => {
  logoutModal.classList.add('hidden');
  await apiRequest('/api/logout', 'POST');

  state.isAuthenticated = false;
  state.currentPin = '';
  updatePinDots();
  playAudioTone(440, 'sine', 0.15);

  showScreen('logout');
});

btnReturnToLogin.addEventListener('click', () => {
  clearPin();
  showScreen('login');
});

function handleSessionExpired() {
  state.isAuthenticated = false;
  clearPin();
  showMessage(loginMessage, 'Session expired or unauthenticated. Please enter your PIN.', 'error');
  showScreen('login');
}

// ==========================================================================
// Initial Setup & Server Status Check
// ==========================================================================
async function initApp() {
  updatePinDots();
  const { ok, data } = await apiRequest('/api/status');

  if (ok && data) {
    if (data.isLocked) {
      state.isLocked = true;
      updateServerStatus(true);
      showMessage(loginMessage, 'ATM is locked due to multiple incorrect attempts.', 'error');
    } else if (data.isAuthenticated) {
      state.isAuthenticated = true;
      await refreshBalance();
      showScreen('dashboard');
    } else {
      showScreen('login');
    }
  } else {
    showScreen('login');
  }
}

initApp();
