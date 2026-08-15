/* =========================================================
   reports.js — reports & CSV export
   ========================================================= */

function getReportTransactions(){
  const range = document.getElementById("reportRange").value;
  const from = document.getElementById("reportFrom").value;
  const to = document.getElementById("reportTo").value;
  return STATE.transactions.filter(t => isInRange(t.date, range, from, to));
}

function renderReportsPage(){
  const range = document.getElementById("reportRange").value;
  document.getElementById("reportFromWrap").classList.toggle("hidden", range !== "custom");
  document.getElementById("reportToWrap").classList.toggle("hidden", range !== "custom");

  const list = getReportTransactions();
  const income = sum(list.filter(t => t.type === "income"));
  const expense = sum(list.filter(t => t.type === "expense"));
  const savings = income - expense;
  const byCat = {};
  list.filter(t => t.type === "expense").forEach(t => byCat[t.category] = (byCat[t.category]||0)+t.amount);
  const topCategory = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  const largestExpense = list.filter(t=>t.type==="expense").sort((a,b)=>b.amount-a.amount)[0];
  const {cash, bank} = computeBalances();

  const stat = (label, value) => `<div class="report-stat"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`;

  document.getElementById("reportSummary").innerHTML = [
    stat("Total income", formatMoney(income)),
    stat("Total expenses", formatMoney(expense)),
    stat("Total savings", formatMoney(savings)),
    stat("Top expense category", topCategory ? `${topCategory[0]} (${formatMoney(topCategory[1])})` : "—"),
    stat("Largest expense", largestExpense ? formatMoney(largestExpense.amount) : "—"),
    stat("Number of transactions", list.length),
    stat("Cash balance", formatMoney(cash)),
    stat("Bank balance", formatMoney(bank)),
    stat("Total money", formatMoney(cash+bank)),
  ].join("");
}

function exportCSV(){
  const list = getReportTransactions();
  if(list.length === 0){ showToast("No transactions to export in this range."); return; }
  const rows = [["Date","Type","Category","Description","Account","Amount"]];
  list.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(t => {
    rows.push([
      t.date, t.type, t.category || "",
      (t.description || "").replace(/,/g," "),
      t.type === "transfer" ? `${t.from}->${t.to}` : t.account,
      t.amount
    ]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const monthName = now.toLocaleDateString("en-IN",{month:"long"}).toLowerCase();
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-report-${monthName}-${now.getFullYear()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("CSV exported.");
}
