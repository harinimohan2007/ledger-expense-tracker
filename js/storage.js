/* =========================================================
   storage.js — localStorage persistence & shared state
   ========================================================= */

const STORAGE_KEY = "ledger_finance_data_v1";

const EXPENSE_CATEGORIES = [
  "Food", "Transport", "Shopping", "Education", "Entertainment",
  "Health", "Personal", "Bills", "Snacks", "Gifts", "Travel", "Technology", "Other"
];

const INCOME_CATEGORIES = [
  "Salary", "Allowance", "Scholarship", "Freelance", "Business",
  "Gift", "Refund", "Other"
];

/**
 * Shape of the persisted state.
 * {
 *   onboarded: bool,
 *   openingCash: number,
 *   openingBank: number,
 *   transactions: [{id,type,amount,date,category,account,from,to,source,description,notes,recurring,frequency,createdAt}],
 *   budgets: [{id,category,limit}],
 *   goals: [{id,name,category,target,current,createdAt}],
 *   theme: 'light'|'dark',
 *   demoLoaded: bool
 * }
 */
function defaultState(){
  return {
    onboarded: false,
    openingCash: 0,
    openingBank: 0,
    transactions: [],
    budgets: [],
    goals: [],
    theme: "light",
    demoLoaded: false
  };
}

let STATE = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  }catch(e){
    console.error("Failed to load ledger data", e);
    return defaultState();
  }
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
  }catch(e){
    console.error("Failed to save ledger data", e);
    showToast("Couldn't save — storage may be full.");
  }
}

function uid(){
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function todayISO(){
  return new Date().toISOString().slice(0,10);
}

function formatMoney(n){
  const v = Number(n) || 0;
  const sign = v < 0 ? "-" : "";
  return sign + "₹" + Math.abs(v).toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2});
}

function formatDate(iso){
  const d = new Date(iso + "T00:00:00");
  if(isNaN(d)) return iso;
  return d.toLocaleDateString("en-IN", {day:"2-digit", month:"short", year:"numeric"});
}

/* -------------------- Derived balances -------------------- */
function computeBalances(){
  let cash = STATE.openingCash;
  let bank = STATE.openingBank;
  for(const t of STATE.transactions){
    if(t.type === "income"){
      if(t.account === "cash") cash += t.amount; else bank += t.amount;
    }else if(t.type === "expense"){
      if(t.account === "cash") cash -= t.amount; else bank -= t.amount;
    }else if(t.type === "transfer"){
      if(t.from === "cash"){ cash -= t.amount; bank += t.amount; }
      else{ bank -= t.amount; cash += t.amount; }
    }
  }
  return {cash, bank, total: cash + bank};
}

/** Balance available in a given account BEFORE a hypothetical new transaction
 *  (used for insufficient-balance validation), optionally excluding a txn id (for edits). */
function accountBalanceExcluding(account, excludeId){
  let bal = account === "cash" ? STATE.openingCash : STATE.openingBank;
  for(const t of STATE.transactions){
    if(t.id === excludeId) continue;
    if(t.type === "income" && t.account === account) bal += t.amount;
    else if(t.type === "expense" && t.account === account) bal -= t.amount;
    else if(t.type === "transfer"){
      if(t.from === account) bal -= t.amount;
      if(t.to === account) bal += t.amount;
    }
  }
  return bal;
}

/* -------------------- CRUD -------------------- */
function addTransaction(txn){
  txn.id = uid();
  txn.createdAt = new Date().toISOString();
  STATE.transactions.unshift(txn);
  saveState();
  return txn;
}

function updateTransaction(id, patch){
  const idx = STATE.transactions.findIndex(t => t.id === id);
  if(idx === -1) return;
  STATE.transactions[idx] = Object.assign({}, STATE.transactions[idx], patch);
  saveState();
}

function deleteTransaction(id){
  STATE.transactions = STATE.transactions.filter(t => t.id !== id);
  saveState();
}

function getTransaction(id){
  return STATE.transactions.find(t => t.id === id);
}

/* -------------------- Toasts -------------------- */
function showToast(message){
  const container = document.getElementById("toastContainer");
  if(!container) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* -------------------- Date range helpers -------------------- */
function isInRange(dateStr, range, customFrom, customTo){
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if(range === "all") return true;
  if(range === "today"){
    return d.getTime() === startOfToday.getTime();
  }
  if(range === "week"){
    const dayOfWeek = now.getDay();
    const start = new Date(startOfToday); start.setDate(start.getDate() - dayOfWeek);
    return d >= start && d <= now;
  }
  if(range === "month"){
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if(range === "lastmonth"){
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
  }
  if(range === "year"){
    return d.getFullYear() === now.getFullYear();
  }
  if(range === "custom"){
    if(!customFrom || !customTo) return true;
    return dateStr >= customFrom && dateStr <= customTo;
  }
  return true;
}

function isThisMonth(dateStr){
  return isInRange(dateStr, "month");
}
