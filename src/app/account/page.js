"use client";

import { useState, useEffect } from "react";
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

const WEEK_START_OPTIONS = [
  { value: "MONDAY", label: "Monday" },
  { value: "SUNDAY", label: "Sunday" },
];

export default function Account() {
  const { data: session } = useSession();

  const [saved, setSaved]   = useState({ ...EMPTY, email: session?.user?.email || "" });
  const [draft, setDraft]   = useState({ ...EMPTY, email: session?.user?.email || "" });
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  // Week-start preference is its own thing because it's the only field
  // that actually persists right now (the others still TODO).
  const [weekStartDay, setWeekStartDay]               = useState("MONDAY");
  const [draftWeekStart, setDraftWeekStart]           = useState("MONDAY");
  const [prefsLoading, setPrefsLoading]               = useState(true);

  // Load preferences on mount
  useEffect(() => {
    async function loadPrefs() {
      try {
        const res  = await fetch("/api/account/preferences");
        const data = await res.json();
        if (res.ok && data?.weekStartDay) {
          setWeekStartDay(data.weekStartDay);
          setDraftWeekStart(data.weekStartDay);
        }
      } catch { /* keep default */ }
      finally { setPrefsLoading(false); }
    }
    loadPrefs();
  }, []);

  function startEdit() {
    setDraft({ ...saved });
    setDraftWeekStart(weekStartDay);
    setEditing(true);
    setSuccess(false);
    setError("");
  }

  function cancelEdit() {
    setDraft({ ...saved });
    setDraftWeekStart(weekStartDay);
    setEditing(false);
    setError("");
  }

  function handleChange(e) {
    setDraft(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Save preferences if changed
    if (draftWeekStart !== weekStartDay) {
      try {
        const res = await fetch("/api/account/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weekStartDay: draftWeekStart }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to save preferences");
        setWeekStartDay(data.weekStartDay);
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    // TODO: persist the rest of the form to your API
    // (kept as-is — this is a separate piece of work)
    setSaved({ ...draft });
    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  function display(val) {
    return val?.trim() || "—";
  }

  const weekStartLabel = WEEK_START_OPTIONS.find(o => o.value === weekStartDay)?.label || "Monday";

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
      {error && (
        <div className="account-error">{error}</div>
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

        {/* ── App preferences (week start) ── */}
        <div className="account-section-label">App Preferences</div>

        <div className="account-field">
          <span className="account-label">Week starts on</span>
          {editing ? (
            <select
              className="account-input"
              value={draftWeekStart}
              onChange={e => setDraftWeekStart(e.target.value)}
              disabled={prefsLoading}
            >
              {WEEK_START_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <span className="account-value">
              {prefsLoading ? "Loading…" : weekStartLabel}
            </span>
          )}
        </div>

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