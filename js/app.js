/* =========================================================
   app.js — routing, event wiring, form handling
   ========================================================= */

const PAGE_TITLES = {
  dashboard: ["Overview", "Dashboard"],
  transactions: ["All activity", "Transactions"],
  income: ["Money in", "Add Income"],
  expense: ["Money out", "Add Expense"],
  transfer: ["Move money", "Transfer Money"],
  budgets: ["Stay on plan", "Budgets"],
  analytics: ["The numbers", "Analytics"],
  goals: ["What you're saving for", "Financial Goals"],
  reports: ["Export & summarize", "Reports"],
  settings: ["Your ledger", "Settings"],
};

let currentPage = "dashboard";
let transferDirection = "bank-cash";

function navigateTo(page){
  currentPage = page;
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById("page-" + page).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
  document.querySelectorAll(".bn-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
  const [eyebrow, title] = PAGE_TITLES[page];
  document.getElementById("pageEyebrow").textContent = eyebrow;
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("backToDashboardBtn").classList.toggle("hidden", page === "dashboard");
  window.scrollTo({top:0, behavior:"instant"});

  if(page === "dashboard") renderDashboard();
  if(page === "transactions") renderTransactionsPage();
  if(page === "budgets") renderBudgetsPage();
  if(page === "analytics") renderAnalyticsPage();
  if(page === "goals") renderGoalsPage();
  if(page === "reports") renderReportsPage();
  if(page !== "income" && page !== "expense" && page !== "transfer") resetEditState();
}

function refreshAll(){
  renderDashboard();
  populateCategorySelects();
  if(currentPage === "transactions") renderTransactionsPage();
  if(currentPage === "budgets") renderBudgetsPage();
  if(currentPage === "analytics") renderAnalyticsPage();
  if(currentPage === "goals") renderGoalsPage();
  if(currentPage === "reports") renderReportsPage();
}

/* -------------------- Theme -------------------- */
function applyTheme(theme){
  STATE.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeLabel").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  document.getElementById("themeIcon").textContent = theme === "dark" ? "☀" : "◐";
  saveState();
  if(currentPage === "analytics") renderAnalyticsPage();
}
function toggleTheme(){ applyTheme(STATE.theme === "dark" ? "light" : "dark"); }

/* -------------------- Onboarding -------------------- */
function showOnboardingIfNeeded(){
  if(STATE.onboarded){
    document.getElementById("onboarding").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
  }else{
    document.getElementById("onboarding").classList.remove("hidden");
    document.getElementById("app").classList.add("hidden");
  }
}

document.getElementById("onboardingForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const cash = parseFloat(document.getElementById("ob-cash").value);
  const bank = parseFloat(document.getElementById("ob-bank").value);
  const err = document.getElementById("onboardingError");
  if(isNaN(cash) || isNaN(bank) || cash < 0 || bank < 0){
    err.textContent = "Please enter valid, non-negative amounts.";
    return;
  }
  err.textContent = "";
  STATE.openingCash = cash;
  STATE.openingBank = bank;
  STATE.onboarded = true;
  saveState();
  showOnboardingIfNeeded();
  navigateTo("dashboard");
  showToast("Your ledger is open!");
});

/* -------------------- Validation helpers -------------------- */
function validateAmount(value){
  const n = parseFloat(value);
  if(isNaN(n) || n <= 0) return "Enter an amount greater than zero.";
  return null;
}

/* -------------------- Income form -------------------- */
document.getElementById("incomeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = document.getElementById("inc-amount").value;
  const date = document.getElementById("inc-date").value;
  const source = document.getElementById("inc-source").value;
  const account = document.getElementById("inc-account").value;
  const category = document.getElementById("inc-category").value;
  const description = document.getElementById("inc-desc").value.trim();
  const err = document.getElementById("incomeError");

  const amtErr = validateAmount(amount);
  if(amtErr){ err.textContent = amtErr; return; }
  if(!date){ err.textContent = "Please select a date."; return; }
  if(!source){ err.textContent = "Please select a source."; return; }
  if(!category){ err.textContent = "Please select a category."; return; }
  err.textContent = "";

  const payload = {type:"income", amount:parseFloat(amount), date, source, account, category, description};

  if(editingTxnId){
    updateTransaction(editingTxnId, payload);
    showToast("Income updated.");
  }else{
    addTransaction(payload);
    showToast("Income added successfully!");
  }
  e.target.reset();
  document.getElementById("inc-date").value = todayISO();
  resetEditState();
  refreshAll();
  navigateTo("dashboard");
});

/* -------------------- Expense form -------------------- */
document.getElementById("exp-recurring").addEventListener("change", (e) => {
  document.getElementById("exp-recurring-fields").classList.toggle("hidden", !e.target.checked);
});

document.getElementById("expenseForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = document.getElementById("exp-amount").value;
  const date = document.getElementById("exp-date").value;
  const category = document.getElementById("exp-category").value;
  const account = document.getElementById("exp-account").value;
  const description = document.getElementById("exp-desc").value.trim();
  const notes = document.getElementById("exp-notes").value.trim();
  const recurring = document.getElementById("exp-recurring").checked;
  const frequency = document.getElementById("exp-frequency").value;
  const err = document.getElementById("expenseError");

  const amtErr = validateAmount(amount);
  if(amtErr){ err.textContent = amtErr; return; }
  if(!date){ err.textContent = "Please select a date."; return; }
  if(!category){ err.textContent = "Please select a category."; return; }

  const available = accountBalanceExcluding(account, editingTxnId);
  if(parseFloat(amount) > available){
    err.textContent = `Insufficient ${account} balance. Available: ${formatMoney(available)}.`;
    return;
  }
  err.textContent = "";

  const payload = {type:"expense", amount:parseFloat(amount), date, category, account, description, notes, recurring, frequency: recurring ? frequency : null};

  if(editingTxnId){
    updateTransaction(editingTxnId, payload);
    showToast("Expense updated.");
  }else{
    addTransaction(payload);
    showToast("Expense recorded successfully!");
  }
  e.target.reset();
  document.getElementById("exp-date").value = todayISO();
  document.getElementById("exp-recurring-fields").classList.add("hidden");
  resetEditState();
  refreshAll();
  navigateTo("dashboard");
});

/* -------------------- Transfer form -------------------- */
function setTransferDirection(dir){
  transferDirection = dir;
  document.querySelectorAll(".dir-btn").forEach(b => b.classList.toggle("active", b.dataset.dir === dir));
}
document.querySelectorAll(".dir-btn").forEach(btn => {
  btn.addEventListener("click", () => setTransferDirection(btn.dataset.dir));
});

document.getElementById("transferForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = document.getElementById("trf-amount").value;
  const date = document.getElementById("trf-date").value;
  const description = document.getElementById("trf-desc").value.trim();
  const err = document.getElementById("transferError");
  const from = transferDirection === "bank-cash" ? "bank" : "cash";
  const to = transferDirection === "bank-cash" ? "cash" : "bank";

  const amtErr = validateAmount(amount);
  if(amtErr){ err.textContent = amtErr; return; }
  if(!date){ err.textContent = "Please select a date."; return; }

  const available = accountBalanceExcluding(from, editingTxnId);
  if(parseFloat(amount) > available){
    err.textContent = `Insufficient ${from} balance. Available: ${formatMoney(available)}.`;
    return;
  }
  err.textContent = "";

  const payload = {type:"transfer", amount:parseFloat(amount), date, from, to, description, category:"Transfer"};

  if(editingTxnId){
    updateTransaction(editingTxnId, payload);
    showToast("Transfer updated.");
  }else{
    addTransaction(payload);
    showToast("Money transferred successfully!");
  }
  e.target.reset();
  document.getElementById("trf-date").value = todayISO();
  setTransferDirection("bank-cash");
  resetEditState();
  refreshAll();
  navigateTo("dashboard");
});

/* -------------------- Budget form -------------------- */
document.getElementById("addBudgetBtn").addEventListener("click", () => {
  resetBudgetForm();
  document.getElementById("budgetFormCard").classList.remove("hidden");
});
document.getElementById("cancelBudgetBtn").addEventListener("click", resetBudgetForm);

document.getElementById("budgetForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const category = document.getElementById("bud-category").value;
  const amount = document.getElementById("bud-amount").value;
  const err = document.getElementById("budgetError");
  const amtErr = validateAmount(amount);
  if(amtErr){ err.textContent = amtErr; return; }

  if(editingBudgetId){
    const b = STATE.budgets.find(x => x.id === editingBudgetId);
    b.category = category; b.limit = parseFloat(amount);
    showToast("Budget updated.");
  }else{
    if(STATE.budgets.some(b => b.category === category)){
      err.textContent = "A budget for this category already exists.";
      return;
    }
    STATE.budgets.push({id: uid(), category, limit: parseFloat(amount)});
    showToast("Budget created.");
  }
  saveState();
  resetBudgetForm();
  renderBudgetsPage();
  renderDashboard();
});

/* -------------------- Goal form -------------------- */
document.getElementById("addGoalBtn").addEventListener("click", () => {
  resetGoalForm();
  document.getElementById("goalFormCard").classList.remove("hidden");
});
document.getElementById("cancelGoalBtn").addEventListener("click", resetGoalForm);

document.getElementById("goalForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("goal-name").value.trim();
  const category = document.getElementById("goal-category").value;
  const target = document.getElementById("goal-target").value;
  const current = document.getElementById("goal-current").value || 0;
  const err = document.getElementById("goalError");
  if(!name){ err.textContent = "Please name your goal."; return; }
  const amtErr = validateAmount(target);
  if(amtErr){ err.textContent = amtErr; return; }
  if(parseFloat(current) < 0){ err.textContent = "Current savings can't be negative."; return; }
  err.textContent = "";

  if(editingGoalId){
    const g = STATE.goals.find(x => x.id === editingGoalId);
    Object.assign(g, {name, category, target:parseFloat(target), current:parseFloat(current)});
    showToast("Goal updated.");
  }else{
    STATE.goals.push({id: uid(), name, category, target:parseFloat(target), current:parseFloat(current), createdAt:new Date().toISOString()});
    showToast("Goal created.");
  }
  saveState();
  resetGoalForm();
  renderGoalsPage();
});

/* -------------------- Transactions page filters -------------------- */
["searchInput","filterType","filterAccount","filterCategory","customFrom","customTo"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderTransactionsPage);
});
document.getElementById("filterDate").addEventListener("change", (e) => {
  document.getElementById("customRangeBar").classList.toggle("hidden", e.target.value !== "custom");
  renderTransactionsPage();
});

/* -------------------- Reports -------------------- */
document.getElementById("reportRange").addEventListener("change", renderReportsPage);
document.getElementById("reportFrom").addEventListener("change", renderReportsPage);
document.getElementById("reportTo").addEventListener("change", renderReportsPage);
document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);
document.getElementById("printReportBtn").addEventListener("click", () => window.print());

/* -------------------- Settings -------------------- */
document.getElementById("settingsThemeBtn").addEventListener("click", toggleTheme);

document.getElementById("resetDataBtn").addEventListener("click", () => {
  document.getElementById("confirmMessage").textContent = "This permanently erases every transaction, budget, goal and balance. This cannot be undone.";
  openModal("confirmModal");
  const okBtn = document.getElementById("confirmOk");
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    STATE = defaultState();
    closeModal("confirmModal");
    showOnboardingIfNeeded();
    showToast("All data has been reset.");
  });
});

document.getElementById("loadDemoBtn").addEventListener("click", () => {
  loadDemoData();
  refreshAll();
  showToast("Demo data loaded.");
  navigateTo("dashboard");
});
document.getElementById("clearDemoBtn").addEventListener("click", () => {
  if(!STATE.demoLoaded){ showToast("No demo data to clear."); return; }
  STATE.transactions = STATE.transactions.filter(t => !t.isDemo);
  STATE.budgets = STATE.budgets.filter(b => !b.isDemo);
  STATE.goals = STATE.goals.filter(g => !g.isDemo);
  STATE.demoLoaded = false;
  saveState();
  refreshAll();
  showToast("Demo data cleared.");
});

function loadDemoData(){
  const today = new Date();
  const iso = (daysAgo) => { const d = new Date(today); d.setDate(d.getDate()-daysAgo); return d.toISOString().slice(0,10); };
  const demo = [
    {type:"income", amount:15000, date:iso(20), source:"Salary", account:"bank", category:"Salary", description:"August salary"},
    {type:"income", amount:1500, date:iso(15), source:"Parents", account:"cash", category:"Allowance", description:"Monthly allowance"},
    {type:"expense", amount:450, date:iso(18), category:"Food", account:"cash", description:"Groceries"},
    {type:"expense", amount:800, date:iso(16), category:"Shopping", account:"bank", description:"New shoes"},
    {type:"expense", amount:299, date:iso(14), category:"Bills", account:"bank", description:"Mobile recharge", recurring:true, frequency:"monthly"},
    {type:"expense", amount:649, date:iso(10), category:"Entertainment", account:"bank", description:"Netflix", recurring:true, frequency:"monthly"},
    {type:"expense", amount:120, date:iso(8), category:"Transport", account:"cash", description:"Auto fare"},
    {type:"expense", amount:250, date:iso(5), category:"Snacks", account:"cash", description:"Cafe with friends"},
    {type:"transfer", amount:1000, date:iso(4), from:"bank", to:"cash", description:"ATM withdrawal", category:"Transfer"},
    {type:"expense", amount:600, date:iso(2), category:"Health", account:"bank", description:"Pharmacy"},
  ];
  demo.forEach(t => { t.isDemo = true; addTransaction(t); });
  if(!STATE.budgets.some(b=>b.category==="Food")) STATE.budgets.push({id:uid(), category:"Food", limit:2000, isDemo:true});
  if(!STATE.budgets.some(b=>b.category==="Shopping")) STATE.budgets.push({id:uid(), category:"Shopping", limit:1500, isDemo:true});
  if(!STATE.goals.some(g=>g.name==="New Laptop")) STATE.goals.push({id:uid(), name:"New Laptop", category:"Laptop", target:60000, current:25000, createdAt:new Date().toISOString(), isDemo:true});
  STATE.demoLoaded = true;
  saveState();
}

/* -------------------- Global nav wiring -------------------- */
document.querySelectorAll("[data-page]").forEach(el => {
  el.addEventListener("click", () => navigateTo(el.dataset.page));
});
document.getElementById("quickAddBtn").addEventListener("click", () => navigateTo("expense"));
document.getElementById("backToDashboardBtn").addEventListener("click", () => {
  resetEditState();
  resetBudgetForm();
  resetGoalForm();
  navigateTo("dashboard");
});
document.getElementById("themeToggle").addEventListener("click", toggleTheme);
document.getElementById("closeDetailModal").addEventListener("click", () => closeModal("detailModal"));
document.getElementById("confirmCancel").addEventListener("click", () => closeModal("confirmModal"));
document.querySelectorAll(".modal-overlay").forEach(ov => {
  ov.addEventListener("click", (e) => { if(e.target === ov) ov.classList.add("hidden"); });
});

/* -------------------- Init -------------------- */
function init(){
  applyTheme(STATE.theme || "light");
  populateCategorySelects();
  document.getElementById("inc-date").value = todayISO();
  document.getElementById("exp-date").value = todayISO();
  document.getElementById("trf-date").value = todayISO();
  showOnboardingIfNeeded();
  navigateTo("dashboard");
}

init();
