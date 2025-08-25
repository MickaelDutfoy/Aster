import "../styles/Auth.scss";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LogForm } from "../types";
import { showToast } from "../utils/toast";

const Auth = ({setAuth, setName}: {setAuth: (auth: boolean) => void, setName: (name: string) => void}) => {
  const [logForm, setLogForm]: [LogForm, (form: LogForm) => void] = useState<LogForm>({
    email: "",
    password: "",
  });

  const logChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogForm({ ...logForm, [e.target.name]: e.target.value });
  }

  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3001/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logForm),
      });

      const data = await res.json();
      
      if (!res.ok) {
        showToast(data.error);
        return;
      }

      if (data.token) {
        setName(data.member.name);
        localStorage.setItem("name", data.member.name);
        localStorage.setItem("token", data.token);
        setAuth(true);
      } else {
        console.warn("Pas de token dans la réponse !");
      }

      setAuth(true);

    } catch (err) {
      console.error(err);
    }
  }

  const navigate = useNavigate();

  return <div className="login page">
    <h2>Pas encore membre ?</h2>
    <button className="main-button" onClick={() => navigate("/register")}>Créer un compte</button>
    <div className="space-20"></div>
    <h2>Déjà membre ?</h2>
    <form onSubmit={login}>
      <label htmlFor="email">
        <p>E-mail :</p>
        <input className="auth-field" type="text" name="email" placeholder="E-mail" value={logForm.email} onChange={logChange} />
      </label>
      <label htmlFor="password">
        <p>Mot de passe :</p>
        <input className="auth-field" type="password" name="password" placeholder="Mot de passe" value={logForm.password} onChange={logChange} />
      </label>
      <button className="main-button" type="submit">Se connecter</button>
    </form>
  </div>
}

export default Auth;