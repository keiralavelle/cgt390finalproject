"use client";

import "./account.css";

export default function Account() {
  const handleSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(e.target);

    const data = {
      username: form.get("username"),
      email: form.get("email"),
      phone: form.get("phone"),
      birthday: form.get("birthday"),
      gender: form.get("gender"),
      weight: form.get("weight"),
      height: form.get("height"),
      allergies: form.get("allergies"),
      favorites: form.get("favorites"),
      nofavorites: form.get("nofavorites"),
      budgets: form.get("budgets"),
    };

    console.log(data);
  };

  return (
    <div className="account-page">
      <h1>Personal Information</h1>

      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input name="username" defaultValue="" />

        <label>Email</label>
        <input name="email" type="email" defaultValue="" />

        <label>Phone Number</label>
        <input name="phone" defaultValue="" />

        <label>Birthday</label>
        <input type="date" name="birthday" defaultValue="" />

        <label>Gender</label>
        <input name="gender" defaultValue="" />

        <label>Weight</label>
        <input name="weight" defaultValue="" />

        <label>Height</label>
        <input name="height" defaultValue="" />

        <h3>Food Preferences</h3>

        <label>Allergies</label>
        <input name="allergies" defaultValue="" />

        <label>Favorite Foods</label>
        <input name="favorites" defaultValue="" />

        <label>Least Favorite Foods</label>
        <input name="nofavorites" defaultValue="" />

        <label>Budget per Week</label>
        <input name="budgets" defaultValue="" />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}