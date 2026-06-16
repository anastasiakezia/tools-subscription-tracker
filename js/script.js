/* ========= INITIALIZATION ========= */

let subscriptions = JSON.parse(localStorage.getItem("subscriptions")) || [];

if (!localStorage.getItem("subscriptions")) {
  subscriptions = [
    {
      id: 1,
      toolName: "Figma",
      department: "Design",
      renewalDate: "2026-08-15",
      monthlyCost: 250000,
      status: "Active",
      notes: "Design Team License",
    },
    {
      id: 2,
      toolName: "Slack",
      department: "Operations",
      renewalDate: "2026-06-25",
      monthlyCost: 450000,
      status: "Expiring Soon",
      notes: "Internal Communication",
    },
  ];
  localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
}

const form = document.getElementById("subscriptionForm");
const tableBody = document.getElementById("subscriptionTable");
const searchInput = document.getElementById("searchInput");

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

sortSubscriptions();
updateDashboard();

/* ========= EVENT LISTENERS ========= */

form.addEventListener("submit", function (e) {
  e.preventDefault();
  saveSubscription();
});

document
  .getElementById("sortSelect")
  .addEventListener("change", sortSubscriptions);
searchInput.addEventListener("keyup", searchSubscription);
document.getElementById("exportCsvBtn").addEventListener("click", exportToCSV);

/* ========= CRUD FUNCTIONS ========= */

function clearForm() {
  form.reset();
  document.getElementById("subscriptionId").value = "";
  document.getElementById("modalTitle").innerText = "Add Subscription";
}

function saveSubscription() {
  const id = document.getElementById("subscriptionId").value;

  const subscription = {
    id: id ? id : Date.now(),
    toolName: document.getElementById("toolName").value.trim(),
    department: document.getElementById("department").value.trim(),
    renewalDate: document.getElementById("renewalDate").value,
    monthlyCost: Number(document.getElementById("monthlyCost").value),
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value.trim(),
  };

  if (id) {
    subscriptions = subscriptions.map((item) =>
      item.id == id ? subscription : item,
    );
    Toast.fire({
      icon: "success",
      title: "Subscription updated successfully!",
    });
  } else {
    subscriptions.push(subscription);
    Toast.fire({
      icon: "success",
      title: "Subscription added successfully!",
    });
  }

  localStorage.setItem("subscriptions", JSON.stringify(subscriptions));

  sortSubscriptions();
  searchSubscription();
  updateDashboard();
  clearForm();

  const modalEl = document.getElementById("subscriptionModal");
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
}

function renderSubscriptions() {
  tableBody.innerHTML = "";

  if (subscriptions.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          No subscriptions available
        </td>
      </tr>
    `;
    return;
  }

  subscriptions.forEach((item) => {
    tableBody.innerHTML += `
      <tr>
        <td class="fw-medium text-dark">${item.toolName}</td>
        <td>${item.department}</td>
        <td>${formatDate(item.renewalDate)}</td>
        <td class="fw-semibold">${formatCurrency(item.monthlyCost)}</td>
        <td>${getDaysRemaining(item.renewalDate)}</td>
        <td>${generateStatusBadge(item.status)}</td>
        <td class="text-secondary">${item.notes || "-"}</td>
        <td class="text-center">
          <div class="action-btn-group">
            <button class="btn btn-sm btn-light text-primary fw-medium" onclick="editSubscription(${item.id})">Edit</button>
            <button class="btn btn-sm btn-light text-danger fw-medium" onclick="deleteSubscription(${item.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function editSubscription(id) {
  const item = subscriptions.find((item) => item.id == id);
  if (!item) return;

  document.getElementById("subscriptionId").value = item.id;
  document.getElementById("toolName").value = item.toolName;
  document.getElementById("department").value = item.department;
  document.getElementById("renewalDate").value = item.renewalDate;
  document.getElementById("monthlyCost").value = item.monthlyCost;
  document.getElementById("status").value = item.status;
  document.getElementById("notes").value = item.notes;

  document.getElementById("modalTitle").innerText = "Edit Subscription";

  let modalEl = document.getElementById("subscriptionModal");
  let modalInstance =
    bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modalInstance.show();
}

function deleteSubscription(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this subscription data!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      subscriptions = subscriptions.filter((item) => item.id != id);
      localStorage.setItem("subscriptions", JSON.stringify(subscriptions));

      sortSubscriptions();
      searchSubscription();
      updateDashboard();

      Swal.fire({
        title: "Deleted!",
        text: "Subscription has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
}

/* ========= DASHBOARD FUNCTIONS ========= */

function updateDashboard() {
  document.getElementById("totalSubscriptions").innerText =
    subscriptions.length;
  document.getElementById("activeSubscriptions").innerText =
    subscriptions.filter((item) => item.status === "Active").length;
  document.getElementById("expiringSubscriptions").innerText =
    subscriptions.filter((item) => item.status === "Expiring Soon").length;
  document.getElementById("expiredSubscriptions").innerText =
    subscriptions.filter((item) => item.status === "Expired").length;
}

/* ========= SEARCH FUNCTIONS ========= */

function searchSubscription() {
  const keyword = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll("#subscriptionTable tr");

  rows.forEach((row) => {
    if (row.cells.length === 1) return;
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(keyword) ? "" : "none";
  });
}

/* ========= SORT FUNCTIONS ========= */

function sortSubscriptions() {
  const sortBy = document.getElementById("sortSelect").value;
  if (!sortBy) return;

  subscriptions.sort((a, b) => {
    switch (sortBy) {
      case "renewalDate":
        return new Date(a.renewalDate) - new Date(b.renewalDate);
      case "monthlyCost":
        return a.monthlyCost - b.monthlyCost;
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  renderSubscriptions();
}

/* ========= EXPORT FUNCTION ========= */

function exportToCSV() {
  if (subscriptions.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No Data Available",
      text: "There are no subscription records to export.",
      confirmButtonColor: "#0d6efd",
    });
    return;
  }

  const headers = [
    "Tool Name",
    "Department",
    "Renewal Date",
    "Monthly Cost",
    "Status",
    "Notes",
  ];
  const csvRows = [
    headers.join(","),
    ...subscriptions.map((item) =>
      [
        `"${item.toolName.replace(/"/g, '""')}"`,
        `"${item.department.replace(/"/g, '""')}"`,
        `"${item.renewalDate}"`,
        item.monthlyCost,
        `"${item.status}"`,
        `"${(item.notes || "").replace(/"/g, '""')}"`,
      ].join(","),
    ),
  ];

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const downloadLink = document.createElement("a");
  downloadLink.setAttribute("href", encodedUri);
  downloadLink.setAttribute(
    "download",
    `subscription_report_${Date.now()}.csv`,
  );

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

/* ========= HELPER FUNCTIONS ========= */

function generateStatusBadge(status) {
  let badgeClass = "status-cancelled";
  if (status === "Active") badgeClass = "status-active";
  else if (status === "Expiring Soon") badgeClass = "status-expiring";
  else if (status === "Expired") badgeClass = "status-expired";

  return `<span class="badge-status ${badgeClass}">${status}</span>`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getDaysRemaining(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewalDate = new Date(date);
  renewalDate.setHours(0, 0, 0, 0);

  const diffTime = renewalDate - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0)
    return `<span class="badge-status status-expired">Expired</span>`;
  if (days <= 30)
    return `<span class="badge-status status-expiring">${days} Days Left</span>`;
  return `<span class="badge-status status-active">${days} Days Left</span>`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
