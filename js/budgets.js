/* =========================================================
   budgets.js — monthly budget tracking
   ========================================================= */

let editingBudgetId = null;

function renderBudgetsPage(){
  const wrap = document.getElementById("budgetsList");
  if(STATE.budgets.length === 0){
    wrap.innerHTML = `
      <div class="empty-state">
        <h3>No budgets yet</h3>
        <p>Create a monthly budget to keep your spending on track.</p>
        <button class="btn btn-primary" onclick="document.getElementById('addBudgetBtn').click()">Create a budget</button>
      </div>`;
    return;
  }
  const spentByCat = {};
  STATE.transactions.filter(t => t.type === "expense" && isThisMonth(t.date)).forEach(t => {
    spentByCat[t.category] = (spentByCat[t.category]||0) + t.amount;
  });

  wrap.innerHTML = STATE.budgets.map(b => {
    const spent = spentByCat[b.category] || 0;
    const pct = Math.min((spent / b.limit) * 100, 999);
    let barClass = "";
    let msg = "";
    if(pct >= 100){ barClass = "over"; msg = `<p class="budget-msg over">🚨 You have exceeded your ${b.category} budget.</p>`; }
    else if(pct >= 80){ barClass = "warn"; msg = `<p class="budget-msg warn">⚠️ You have used ${pct.toFixed(0)}% of your ${b.category} budget.</p>`; }
    return `
      <div class="budget-item">
        <div class="budget-top">
          <span class="budget-cat">${escapeHtml(b.category)}</span>
          <span class="budget-nums">${formatMoney(spent)} / ${formatMoney(b.limit)}</span>
        </div>
        <div class="budget-bar-track"><div class="budget-bar-fill ${barClass}" style="width:${Math.min(pct,100)}%"></div></div>
        ${msg}
        <div class="budget-row-actions">
          <button class="btn btn-ghost edit-budget" data-id="${b.id}">Edit</button>
          <button class="btn btn-ghost delete-budget" data-id="${b.id}">Delete</button>
        </div>
      </div>`;
  }).join("");

  wrap.querySelectorAll(".edit-budget").forEach(btn => btn.addEventListener("click", () => startEditBudget(btn.dataset.id)));
  wrap.querySelectorAll(".delete-budget").forEach(btn => btn.addEventListener("click", () => {
    STATE.budgets = STATE.budgets.filter(b => b.id !== btn.dataset.id);
    saveState();
    showToast("Budget deleted.");
    renderBudgetsPage();
  }));
}

function startEditBudget(id){
  const b = STATE.budgets.find(x => x.id === id);
  if(!b) return;
  editingBudgetId = id;
  document.getElementById("budgetFormCard").classList.remove("hidden");
  document.getElementById("bud-category").value = b.category;
  document.getElementById("bud-amount").value = b.limit;
}

function resetBudgetForm(){
  editingBudgetId = null;
  document.getElementById("budgetForm").reset();
  document.getElementById("budgetError").textContent = "";
  document.getElementById("budgetFormCard").classList.add("hidden");
}
