/* =========================================================
   analytics.js — Chart.js visualizations
   ========================================================= */

let charts = {};

function chartColors(){
  const styles = getComputedStyle(document.documentElement);
  return {
    ink: styles.getPropertyValue("--ink").trim(),
    inkSoft: styles.getPropertyValue("--ink-soft").trim(),
    line: styles.getPropertyValue("--line").trim(),
    emerald: styles.getPropertyValue("--emerald").trim(),
    amber: styles.getPropertyValue("--amber").trim(),
    crimson: styles.getPropertyValue("--crimson").trim(),
    navy: styles.getPropertyValue("--navy").trim(),
  };
}

const PALETTE_EXTRA = ["#7C9EB2","#C9A76A","#9C7FB0","#6FA88A","#B0778A","#8B9DC3","#D3A05A","#6FB0A0","#A98CC9","#8FAA6E","#C97D8C","#7E9FC0"];

function categoryPalette(n){
  const c = chartColors();
  const base = [c.emerald, c.amber, c.crimson, c.navy];
  const all = base.concat(PALETTE_EXTRA);
  return all.slice(0, n);
}

function renderAnalyticsPage(){
  const monthTxns = STATE.transactions.filter(t => isThisMonth(t.date));
  const income = sum(monthTxns.filter(t => t.type === "income"));
  const expense = sum(monthTxns.filter(t => t.type === "expense"));
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings/income*100) : 0;
  const daysPassed = new Date().getDate();
  const avgDaily = expense / daysPassed;

  document.getElementById("analyticsStrip").innerHTML = `
    <div class="card"><span class="stat-label">Total income</span><span class="stat-value income">${formatMoney(income)}</span></div>
    <div class="card"><span class="stat-label">Total expenses</span><span class="stat-value expense">${formatMoney(expense)}</span></div>
    <div class="card"><span class="stat-label">Savings rate</span><span class="stat-value" style="color:var(--navy)">${savingsRate.toFixed(1)}%</span></div>
    <div class="card"><span class="stat-label">Avg. daily spend</span><span class="stat-value" style="color:var(--amber)">${formatMoney(avgDaily)}</span></div>
  `;

  renderCategoryChart(monthTxns);
  renderCashBankChart();
  renderTrendChart();
  renderIncomeExpenseChart();
}

function destroyChart(key){
  if(charts[key]){ charts[key].destroy(); delete charts[key]; }
}

function renderCategoryChart(monthTxns){
  destroyChart("category");
  const byCat = {};
  monthTxns.filter(t => t.type === "expense").forEach(t => { byCat[t.category] = (byCat[t.category]||0)+t.amount; });
  const labels = Object.keys(byCat);
  const data = Object.values(byCat);
  const ctx = document.getElementById("chartCategory");
  const c = chartColors();
  if(labels.length === 0){
    ctx.getContext("2d").clearRect(0,0,ctx.width,ctx.height);
    return;
  }
  charts.category = new Chart(ctx, {
    type: "doughnut",
    data: {labels, datasets:[{data, backgroundColor:categoryPalette(labels.length), borderWidth:2, borderColor:c.line}]},
    options: {plugins:{legend:{position:"bottom", labels:{color:c.inkSoft, font:{family:"Inter", size:11}}}}, cutout:"62%"}
  });
}

function renderCashBankChart(){
  destroyChart("cashbank");
  const {cash, bank} = computeBalances();
  const ctx = document.getElementById("chartCashBank");
  const c = chartColors();
  charts.cashbank = new Chart(ctx, {
    type: "doughnut",
    data: {labels:["Cash","Bank"], datasets:[{data:[Math.max(cash,0),Math.max(bank,0)], backgroundColor:[c.amber, c.navy], borderWidth:2, borderColor:c.line}]},
    options: {plugins:{legend:{position:"bottom", labels:{color:c.inkSoft, font:{family:"Inter", size:11}}}}, cutout:"62%"}
  });
}

function lastNMonths(n){
  const arr = [];
  const now = new Date();
  for(let i=n-1;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    arr.push({year:d.getFullYear(), month:d.getMonth(), label:d.toLocaleDateString("en-IN",{month:"short"})});
  }
  return arr;
}

function renderTrendChart(){
  destroyChart("trend");
  const months = lastNMonths(6);
  const data = months.map(m => sum(STATE.transactions.filter(t => {
    const d = new Date(t.date+"T00:00:00");
    return t.type === "expense" && d.getFullYear()===m.year && d.getMonth()===m.month;
  })));
  const c = chartColors();
  charts.trend = new Chart(document.getElementById("chartTrend"), {
    type: "bar",
    data: {labels: months.map(m=>m.label), datasets:[{label:"Expenses", data, backgroundColor:c.crimson, borderRadius:5, maxBarThickness:36}]},
    options: {
      plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{color:c.inkSoft, font:{family:"Inter"}}, grid:{display:false}},
        y:{ticks:{color:c.inkSoft, font:{family:"Inter"}}, grid:{color:c.line}}
      }
    }
  });
}

function renderIncomeExpenseChart(){
  destroyChart("incexp");
  const months = lastNMonths(6);
  const income = months.map(m => sum(STATE.transactions.filter(t => {
    const d = new Date(t.date+"T00:00:00");
    return t.type === "income" && d.getFullYear()===m.year && d.getMonth()===m.month;
  })));
  const expense = months.map(m => sum(STATE.transactions.filter(t => {
    const d = new Date(t.date+"T00:00:00");
    return t.type === "expense" && d.getFullYear()===m.year && d.getMonth()===m.month;
  })));
  const c = chartColors();
  charts.incexp = new Chart(document.getElementById("chartIncomeExpense"), {
    type: "line",
    data: {
      labels: months.map(m=>m.label),
      datasets:[
        {label:"Income", data:income, borderColor:c.emerald, backgroundColor:c.emerald, tension:.3, pointRadius:3},
        {label:"Expenses", data:expense, borderColor:c.crimson, backgroundColor:c.crimson, tension:.3, pointRadius:3}
      ]
    },
    options:{
      plugins:{legend:{position:"bottom", labels:{color:c.inkSoft, font:{family:"Inter"}}}},
      scales:{
        x:{ticks:{color:c.inkSoft, font:{family:"Inter"}}, grid:{display:false}},
        y:{ticks:{color:c.inkSoft, font:{family:"Inter"}}, grid:{color:c.line}}
      }
    }
  });
}
