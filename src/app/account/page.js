"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil, X, Check } from "lucide-react";
import "./account.css";

const FIELDS = [
  { name: "username", label: "Name",             type: "text" },
  { name: "email",    label: "Email",            type: "email" },
  { name: "phone",    label: "Phone Number",     type: "tel" },
  { name: "birthday", label: "Birthday",         type: "date" },
  { name: "gender",   label: "Gender",           type: "text" },
  { name: "weight",   label: "Weight",           type: "text" },
  { name: "height",   label: "Height",           type: "text" },
];

const PREF_FIELDS = [
  { name: "allergies",   label: "Allergies",            type: "text" },
  { name: "favorites",   label: "Favorite Foods",       type: "text" },
  { name: "nofavorites", label: "Least Favorite Foods", type: "text" },
  { name: "budgets",     label: "Budget per Week",      type: "text" },
];

const EMPTY = {
  username: "", email: "", phone: "", birthday: "",
  gender: "", weight: "", height: "",
  allergies: "", favorites: "", nofavorites: "", budgets: "",
};

export default function Account() {
  const { data: session } = useSession();

  // Pre-fill email from session if available
  const [saved, setSaved]   = useState({ ...EMPTY, email: session?.user?.email || "" });
  const [draft, setDraft]   = useState({ ...EMPTY, email: session?.user?.email || "" });
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);

  function startEdit() {
    setDraft({ ...saved });
    setEditing(true);
    setSuccess(false);
  }

  function cancelEdit() {
    setDraft({ ...saved });
    setEditing(false);
  }

  function handleChange(e) {
    setDraft(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: persist to your API here, e.g. fetch("/api/account", { method: "POST", body: JSON.stringify(draft) })
    setSaved({ ...draft });
    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  // Display value — shows a dash when empty in view mode
  function display(val) {
    return val?.trim() || "—";
  }

  return (
    <div className="account-page">

      {/* ── Header ── */}
      <div className="account-header">
        <h1 className="account-title">Account</h1>
        {!editing ? (
          <button className="account-edit-btn" onClick={startEdit}>
            <Pencil size={14} /> Edit
          </button>
        ) : (
          <button className="account-cancel-btn" onClick={cancelEdit}>
            <X size={14} /> Cancel
          </button>
        )}
      </div>

      {success && (
        <div className="account-success">Changes saved successfully.</div>
      )}

      <form className="account-card" onSubmit={handleSubmit}>

        {/* ── Personal info ── */}
        <div className="account-section-label">Personal Information</div>

        {FIELDS.map(f => (
          <div key={f.name} className="account-field">
            <span className="account-label">{f.label}</span>
            {editing ? (
              <input
                className="account-input"
                type={f.type}
                name={f.name}
                value={draft[f.name]}
                onChange={handleChange}
                placeholder={`Enter ${f.label.toLowerCase()}…`}
              />
            ) : (
              <span className={`account-value ${!saved[f.name]?.trim() ? "account-value--empty" : ""}`}>
                {display(saved[f.name])}
              </span>
            )}
          </div>
        ))}

        {/* ── Food preferences ── */}
        <div className="account-section-label">Food Preferences</div>

        {PREF_FIELDS.map(f => (
          <div key={f.name} className="account-field">
            <span className="account-label">{f.label}</span>
            {editing ? (
              <input
                className="account-input"
                type={f.type}
                name={f.name}
                value={draft[f.name]}
                onChange={handleChange}
                placeholder={`Enter ${f.label.toLowerCase()}…`}
              />
            ) : (
              <span className={`account-value ${!saved[f.name]?.trim() ? "account-value--empty" : ""}`}>
                {display(saved[f.name])}
              </span>
            )}
          </div>
        ))}

        {/* ── Save button (only in edit mode) ── */}
        {editing && (
          <div className="account-actions">
            <button type="submit" className="account-save-btn">
              <Check size={15} /> Save changes
            </button>
          </div>
        )}

      </form>
    </div>
  );
}