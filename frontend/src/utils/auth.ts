import axios from "axios";

export async function checkToken(): Promise<boolean> {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    await axios.get("http://localhost:3001/api/sessions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch (err) {
    return false;
  }
}