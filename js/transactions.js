/* =========================================================
   transactions.js — transaction list, search, filters, CRUD UI
   ========================================================= */

let editingTxnId = null;

function populateCategorySelects(){
  const fill = (sel, list, includeAll) => {
    if(!sel) return;
    const current = sel.value;
    sel.innerHTML = "";
    if(includeAll){
      const opt = document.createElement("option");
      opt.value = "all"; opt.textContent = "All categories";
      sel.appendChild(opt);
    }
    list.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat; opt.textContent = cat;
      sel.appendChild(opt);
    });
    if(current) sel.value = current;
  };
  fill(document.getElementById("inc-category"), INCOME_CATEGORIES, false);
  fill(document.getElementById("exp-category"), EXPENSE_CATEGORIES, false);
  fill(document.getElementById("bud-category"), EXPENSE_CATEGORIES, false);
  fill(document.getElementById("filterCategory"), [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])], true);
}

function getFilteredTransactions(){
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  const type = document.getElementById("filterType")?.value || "all";
  const account = document.getElementById("filterAccount")?.value || "all";
  const category = document.getElementById("filterCategory")?.value || "all";
  const dateRange = document.getElementById("filterDate")?.value || "all";
  const customFrom = document.getElementById("customFrom")?.value;
  const customTo = document.getElementById("customTo")?.value;

  return STATE.transactions.filter(t => {
    if(type !== "all" && t.type !== type) return false;
    if(account !== "all"){
      if(t.type === "transfer"){
        if(t.from !== account && t.to !== account) return false;
      }else if(t.account !== account) return false;
    }
    if(category !== "all" && t.category !== category) return false;
    if(!isInRange(t.date, dateRange, customFrom, customTo)) return false;
    if(search){
      const haystack = [t.description, t.category, t.source, t.notes].filter(Boolean).join(" ").toLowerCase();
      if(!haystack.includes(search)) return false;
    }
    return true;
  }).sort((a,b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

function txnAccountLabel(t){
  if(t.type === "transfer") return `${t.from} → ${t.to}`;
  return t.account;
}

function txnAmountDisplay(t){
  if(t.type === "income") return {sign:"+", cls:"income"};
  if(t.type === "expense") return {sign:"-", cls:"expense"};
  return {sign:"", cls:"transfer"};
}

function renderTxnRow(t, compact){
  const {sign, cls} = txnAmountDisplay(t);
  const label = t.description || t.category || (t.type === "transfer" ? "Transfer" : t.source) || "—";
  const actions = compact ? "" : `
    <div class="txn-actions">
      <button class="icon-btn edit-txn" data-id="${t.id}" title="Edit">✎</button>
      <button class="icon-btn delete-txn" data-id="${t.id}" title="Delete">🗑</button>
    </div>`;
  return `
    <tr class="txn-row" data-id="${t.id}">
      <td>${formatDate(t.date)}</td>
      <td><span class="pill ${t.type}">${t.type}</span></td>
      <td><div class="txn-desc">${escapeHtml(label)}</div><div class="txn-sub">${escapeHtml(t.category || "")}</div></td>
      <td style="text-transform:capitalize">${txnAccountLabel(t)}</td>
      <td class="amount ${cls}">${sign}${formatMoney(t.amount)}</td>
      <td>${compact ? "" : actions}</td>
    </tr>`;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]));
}

function renderTransactionsPage(){
  const list = getFilteredTransactions();
  const wrap = document.getElementById("txnTableWrap");
  if(!wrap) return;
  if(list.length === 0){
    wrap.innerHTML = `
      <div class="empty-state">
        <h3>No transactions found</h3>
        <p>Try adjusting your filters, or add your first transaction.</p>
        <button class="btn btn-primary" onclick="navigateTo('income')">Add transaction</button>
      </div>`;
    return;
  }
  wrap.innerHTML = `
    <table class="txn-table">
      <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Account</th><th>Amount</th><th>Actions</th></tr></thead>
      <tbody>${list.map(t => renderTxnRow(t, false)).join("")}</tbody>
    </table>`;
  wrap.querySelectorAll(".txn-row").forEach(row => {
    row.addEventListener("click", (e) => {
      if(e.target.closest(".icon-btn")) return;
      openDetailModal(row.dataset.id);
    });
  });
  wrap.querySelectorAll(".edit-txn").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation(); startEditTransaction(btn.dataset.id);
  }));
  wrap.querySelectorAll(".delete-txn").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation(); confirmDeleteTransaction(btn.dataset.id);
  }));
}

function renderRecentTransactions(){
  const wrap = document.getElementById("recentTxns");
  if(!wrap) return;
  const list = STATE.transactions.slice().sort((a,b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0,6);
  if(list.length === 0){
    wrap.innerHTML = `
      <div class="empty-state">
        <h3>No transactions yet</h3>
        <p>Start tracking your money by adding your first income or expense.</p>
        <button class="btn btn-primary" onclick="navigateTo('income')">Add transaction</button>
      </div>`;
    return;
  }
  wrap.innerHTML = `<table class="txn-table"><tbody>${list.map(t => renderTxnRow(t, true)).join("")}</tbody></table>`;
  wrap.querySelectorAll(".txn-row").forEach(row => {
    row.addEventListener("click", () => openDetailModal(row.dataset.id));
  });
}

/* -------------------- Detail modal -------------------- */
function openDetailModal(id){
  const t = getTransaction(id);
  if(!t) return;
  const body = document.getElementById("detailModalBody");
  const {sign, cls} = txnAmountDisplay(t);
  body.innerHTML = `
    <h2 style="margin-bottom:16px;">Transaction details</h2>
    <div class="detail-row"><span>Amount</span><span class="amount ${cls}">${sign}${formatMoney(t.amount)}</span></div>
    <div class="detail-row"><span>Type</span><span style="text-transform:capitalize">${t.type}</span></div>
    <div class="detail-row"><span>Category</span><span>${escapeHtml(t.category || "—")}</span></div>
    <div class="detail-row"><span>Date</span><span>${formatDate(t.date)}</span></div>
    <div class="detail-row"><span>Account</span><span style="text-transform:capitalize">${txnAccountLabel(t)}</span></div>
    <div class="detail-row"><span>Description</span><span>${escapeHtml(t.description || "—")}</span></div>
    <div class="detail-row"><span>Notes</span><span>${escapeHtml(t.notes || "—")}</span></div>
    <div class="detail-row"><span>Created</span><span>${new Date(t.createdAt).toLocaleString("en-IN")}</span></div>
    <div class="form-row" style="margin-top:18px;">
      <button class="btn btn-secondary" id="detailEditBtn">Edit</button>
      <button class="btn btn-danger" id="detailDeleteBtn">Delete</button>
    </div>`;
  document.getElementById("detailEditBtn").onclick = () => { closeModal("detailModal"); startEditTransaction(id); };
  document.getElementById("detailDeleteBtn").onclick = () => { closeModal("detailModal"); confirmDeleteTransaction(id); };
  openModal("detailModal");
}

function openModal(id){ document.getElementById(id).classList.remove("hidden"); }
function closeModal(id){ document.getElementById(id).classList.add("hidden"); }

/* -------------------- Delete with confirmation -------------------- */
function confirmDeleteTransaction(id){
  document.getElementById("confirmMessage").textContent = "Are you sure you want to delete this transaction?";
  openModal("confirmModal");
  const okBtn = document.getElementById("confirmOk");
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener("click", () => {
    deleteTransaction(id);
    closeModal("confirmModal");
    showToast("Transaction deleted.");
    refreshAll();
  });
}

/* -------------------- Edit -------------------- */
function startEditTransaction(id){
  const t = getTransaction(id);
  if(!t) return;
  editingTxnId = id;
  if(t.type === "income"){
    navigateTo("income");
    document.getElementById("inc-amount").value = t.amount;
    document.getElementById("inc-date").value = t.date;
    document.getElementById("inc-source").value = t.source || "";
    document.getElementById("inc-account").value = t.account;
    document.getElementById("inc-category").value = t.category || "";
    document.getElementById("inc-desc").value = t.description || "";
    document.querySelector("#incomeForm button[type=submit]").textContent = "Save changes";
  }else if(t.type === "expense"){
    navigateTo("expense");
    document.getElementById("exp-amount").value = t.amount;
    document.getElementById("exp-date").value = t.date;
    document.getElementById("exp-category").value = t.category || "";
    document.getElementById("exp-account").value = t.account;
    document.getElementById("exp-desc").value = t.description || "";
    document.getElementById("exp-notes").value = t.notes || "";
    document.getElementById("exp-recurring").checked = !!t.recurring;
    document.getElementById("exp-recurring-fields").classList.toggle("hidden", !t.recurring);
    if(t.frequency) document.getElementById("exp-frequency").value = t.frequency;
    document.querySelector("#expenseForm button[type=submit]").textContent = "Save changes";
  }else{
    navigateTo("transfer");
    document.getElementById("trf-amount").value = t.amount;
    document.getElementById("trf-date").value = t.date;
    document.getElementById("trf-desc").value = t.description || "";
    setTransferDirection(t.from === "cash" ? "cash-bank" : "bank-cash");
    document.querySelector("#transferForm button[type=submit]").textContent = "Save changes";
  }
}

function resetEditState(){
  editingTxnId = null;
  document.querySelector("#incomeForm button[type=submit]").textContent = "Add income";
  document.querySelector("#expenseForm button[type=submit]").textContent = "Add expense";
  document.querySelector("#transferForm button[type=submit]").textContent = "Transfer";
}
