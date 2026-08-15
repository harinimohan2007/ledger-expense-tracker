/* =========================================================
   goals.js — financial goals
   ========================================================= */

let editingGoalId = null;

function renderGoalsPage(){
  const wrap = document.getElementById("goalsList");
  if(STATE.goals.length === 0){
    wrap.innerHTML = `
      <div class="empty-state">
        <h3>No goals yet</h3>
        <p>Set a savings target — like a new laptop or an emergency fund — and track your progress.</p>
        <button class="btn btn-primary" onclick="document.getElementById('addGoalBtn').click()">Create a goal</button>
      </div>`;
    return;
  }
  wrap.innerHTML = STATE.goals.map(g => {
    const pct = Math.min((g.current / g.target) * 100, 100);
    const remaining = Math.max(g.target - g.current, 0);
    return `
      <div class="goal-card">
        <div class="goal-top">
          <span class="goal-name">${escapeHtml(g.name)} <span class="muted">· ${escapeHtml(g.category)}</span></span>
          <span class="goal-pct">${pct.toFixed(1)}%</span>
        </div>
        <div class="goal-nums">${formatMoney(g.current)} of ${formatMoney(g.target)} · ${formatMoney(remaining)} remaining</div>
        <div class="budget-bar-track"><div class="budget-bar-fill" style="width:${pct}%"></div></div>
        <div class="budget-row-actions">
          <button class="btn btn-ghost add-goal-funds" data-id="${g.id}">+ Add funds</button>
          <button class="btn btn-ghost edit-goal" data-id="${g.id}">Edit</button>
          <button class="btn btn-ghost delete-goal" data-id="${g.id}">Delete</button>
        </div>
      </div>`;
  }).join("");

  wrap.querySelectorAll(".edit-goal").forEach(btn => btn.addEventListener("click", () => startEditGoal(btn.dataset.id)));
  wrap.querySelectorAll(".delete-goal").forEach(btn => btn.addEventListener("click", () => {
    STATE.goals = STATE.goals.filter(g => g.id !== btn.dataset.id);
    saveState();
    showToast("Goal deleted.");
    renderGoalsPage();
  }));
  wrap.querySelectorAll(".add-goal-funds").forEach(btn => btn.addEventListener("click", () => {
    const g = STATE.goals.find(x => x.id === btn.dataset.id);
    const amt = parseFloat(prompt(`Add how much to "${g.name}"?`, "0"));
    if(!isNaN(amt) && amt > 0){
      g.current += amt;
      saveState();
      showToast("Goal updated.");
      renderGoalsPage();
    }
  }));
}

function startEditGoal(id){
  const g = STATE.goals.find(x => x.id === id);
  if(!g) return;
  editingGoalId = id;
  document.getElementById("goalFormCard").classList.remove("hidden");
  document.getElementById("goal-name").value = g.name;
  document.getElementById("goal-category").value = g.category;
  document.getElementById("goal-target").value = g.target;
  document.getElementById("goal-current").value = g.current;
}

function resetGoalForm(){
  editingGoalId = null;
  document.getElementById("goalForm").reset();
  document.getElementById("goalError").textContent = "";
  document.getElementById("goalFormCard").classList.add("hidden");
}
