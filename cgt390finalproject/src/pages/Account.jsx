import React, { useState } from "react";
import "../components/account.css";

const Account = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    weight: "",
    height: "",
    allergies: "",
    favorites: "",
    nofavorites: "",
    budgets: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    setIsEditing(false); 
  };

  return (
    <div className="page">
      <h1>Personal Information</h1>

      {!isEditing ? (
        <>
        <p>Name: {formData.username}</p>
        <p>Email: {formData.email}</p>
        <p>Phone Number: {formData.phone}</p>
        <p>Birthday: {formData.birthday}</p>
        <p>Gender: {formData.gender}</p>
        <p>Weight: {formData.weight}</p>
        <p>Height: {formData.height}</p>

        <h3>Food Preferences</h3>

        <p>Allergies: {formData.allergies}</p>
        <p>Favorite Foods: {formData.favorites}</p>
        <p>Least Favorite Foods: {formData.nofavorites}</p>
        <p>Budget per Week: {formData.budgets}</p>

          <button onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <label>Name</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
            />

            <label>Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
            />

            <label>Phone Number</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />

            <label>Birthday</label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
            />

            <label>Gender</label>
            <input
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            />

            <label>Weight</label>
            <input
              name="weight"
              value={formData.weight}
              onChange={handleChange}
            />

            <label>Height</label>
            <input
              name="height"
              value={formData.height}
              onChange={handleChange}
            />

            <h3>Food Preferences</h3>

            <label>Allergies</label>
            <input
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
            />

            <label>Favorite Foods</label>
            <input
              name="favorites"
              value={formData.favorites}
              onChange={handleChange}
            />

            <label>Least Favorite Foods</label>
            <input
              name="nofavorites"
              value={formData.nofavorites}
              onChange={handleChange}
            />

            <label>Budget per Week</label>
            <input
              name="budgets"
              value={formData.budgets}
              onChange={handleChange}
            />


            <button type="submit">Save Changes</button>
          </form>
        </>
      )}
    </div>
  );
};

export default Account;
