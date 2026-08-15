/* =========================================================
   dashboard.js — balances, month summary, insights, upcoming
   ========================================================= */

function renderDashboard(){
  const {cash, bank, total} = computeBalances();
  document.getElementById("db-cash").textContent = formatMoney(cash);
  document.getElementById("db-bank").textContent = formatMoney(bank);
  document.getElementById("db-total").textContent = formatMoney(total);

  const monthTxns = STATE.transactions.filter(t => isThisMonth(t.date));
  const income = sum(monthTxns.filter(t => t.type === "income"));
  const expense = sum(monthTxns.filter(t => t.type === "expense"));
  const transfer = sum(monthTxns.filter(t => t.type === "transfer"));
  const savings = income - expense;

  document.getElementById("ms-income").textContent = formatMoney(income);
  document.getElementById("ms-expense").textContent = formatMoney(expense);
  document.getElementById("ms-transfer").textContent = formatMoney(transfer);
  document.getElementById("ms-savings").textContent = formatMoney(savings);

  renderInsights(income, expense, savings, cash, bank);
  renderRecentTransactions();
  renderUpcomingPayments();
}

function sum(list){ return list.reduce((a,t) => a + t.amount, 0); }

function renderInsights(income, expense, savings, cash, bank){
  const el = document.getElementById("insightsList");
  const insights = [];
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const lastMonthTxns = STATE.transactions.filter(t => {
    const d = new Date(t.date + "T00:00:00");
    return t.type === "expense" && d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
  });
  const lastMonthExpense = sum(lastMonthTxns);

  if(expense > 0) insights.push(`You spent ${formatMoney(expense)} this month.`);

  const byCat = {};
  STATE.transactions.filter(t => t.type === "expense" && isThisMonth(t.date)).forEach(t => {
    byCat[t.category] = (byCat[t.category]||0) + t.amount;
  });
  const topCat = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  if(topCat) insights.push(`${topCat[0]} is your highest spending category this month.`);

  if(lastMonthExpense > 0 && expense > 0){
    const diff = ((expense - lastMonthExpense) / lastMonthExpense) * 100;
    if(Math.abs(diff) >= 1){
      insights.push(`You spent ${Math.abs(diff).toFixed(0)}% ${diff >= 0 ? "more" : "less"} this month compared with last month.`);
    }
  }

  STATE.budgets.forEach(b => {
    const spent = byCat[b.category] || 0;
    const pct = (spent / b.limit) * 100;
    if(pct >= 80 && pct < 100) insights.push(`You have used ${pct.toFixed(0)}% of your ${b.category} budget.`);
    if(pct >= 100) insights.push(`You have exceeded your ${b.category} budget.`);
  });

  const daysPassed = now.getDate();
  if(expense > 0) insights.push(`Your average daily spending is ${formatMoney(expense / daysPassed)}.`);

  if(income > 0){
    const rate = (savings / income) * 100;
    insights.push(`You saved ${rate.toFixed(0)}% of your income this month.`);
  }

  if(cash < bank) insights.push(`Your cash balance is lower than your bank balance.`);
  else if(bank < cash) insights.push(`Your bank balance is lower than your cash balance.`);

  if(insights.length === 0){
    insights.push("Add a few transactions and we'll surface spending insights here.");
  }

  el.innerHTML = insights.slice(0,6).map(i => `<li>${escapeHtml(i)}</li>`).join("");
}

function renderUpcomingPayments(){
  const wrap = document.getElementById("upcomingList");
  const recurring = STATE.transactions.filter(t => t.type === "expense" && t.recurring);
  if(recurring.length === 0){
    wrap.innerHTML = `<p class="muted">No recurring expenses set up yet. Mark an expense as recurring to see it here.</p>`;
    return;
  }
  // Dedupe by description+category, show most recent occurrence + next due estimate
  const seen = {};
  recurring.forEach(t => {
    const key = (t.description || t.category) + "|" + t.frequency;
    if(!seen[key] || seen[key].date < t.date) seen[key] = t;
  });
  const items = Object.values(seen).map(t => {
    const next = nextDueDate(t.date, t.frequency);
    return `<div class="detail-row"><span>${escapeHtml(t.description || t.category)} <span class="muted">(${t.frequency})</span></span><span class="amount expense">${formatMoney(t.amount)} · Due ${formatDate(next)}</span></div>`;
  });
  wrap.innerHTML = items.join("");
}

function nextDueDate(dateStr, frequency){
  const d = new Date(dateStr + "T00:00:00");
  switch(frequency){
    case "daily": d.setDate(d.getDate()+1); break;
    case "weekly": d.setDate(d.getDate()+7); break;
    case "yearly": d.setFullYear(d.getFullYear()+1); break;
    default: d.setMonth(d.getMonth()+1);
  }
  return d.toISOString().slice(0,10);
}
