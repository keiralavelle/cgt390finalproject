export async function fetchCurrentUser() {
  const response = await fetch("/api/me", {
    credentials: "include",
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.user;
}

export async function signOutUser() {
  await fetch("/api/signout", {
    method: "POST",
    credentials: "include",
  });
}