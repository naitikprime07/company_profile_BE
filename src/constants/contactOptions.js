const SERVICE_OPTIONS = Object.freeze([
  "Mobile application",
  "UX / UI design",
  "Web development",
  "Digital marketing",
  "Product strategy",
  "Other",
]);

const BUDGET_OPTIONS = Object.freeze([
  "Under $10k",
  "$10k – $25k",
  "$25k – $50k",
  "$50k+",
  "Not decided",
]);

const CONTACT_STATUSES = Object.freeze(["new", "in_progress", "resolved"]);

module.exports = { SERVICE_OPTIONS, BUDGET_OPTIONS, CONTACT_STATUSES };

