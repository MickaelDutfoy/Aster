import "../styles/Register.scss";
import { useState } from "react";
import type { MemberForm } from "../types";
import { showToast } from "../utils/toast";
import { api } from "../api";

const Register = ({setAuth, setName}: {setAuth: (auth: boolean) => void, setName: (name: string) => void}) => {

    const [regForm, setRegForm]: [MemberForm, (form: MemberForm) => void] = useState<MemberForm>({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
    });

    const regChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegForm({ ...regForm, [e.target.name]: e.target.value });
    }

    const register = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!regForm.first_name || !regForm.last_name || !regForm.email || !regForm.phone_number || !regForm.password) {
            showToast("Merci de remplir tous les champs.");
            return;
        }

        try {
            const res = await fetch(api("/api/members"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(regForm),
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.error);
                return;
            }

            setName(regForm.first_name)
            localStorage.setItem("name", regForm.first_name);
            localStorage.setItem("token", data.token);
            setAuth(true);
        } catch (err) {
            console.error(err);
        }
    };

    return <div className="register page">
        <form onSubmit={register}>
            <label htmlFor="first_name">
                <p>Prénom :</p>
                <input className="auth-field" type="text" name="first_name" placeholder="Nom" value={regForm.first_name} onChange={regChange} />
            </label>
            <label htmlFor="last_name">
                <p>Nom :</p>
                <input className="auth-field" type="text" name="last_name" placeholder="Prénom" value={regForm.last_name} onChange={regChange} />
            </label>
            <label htmlFor="email">
                <p>E-mail :</p>
                <input className="auth-field" type="email" name="email" placeholder="E-mail" value={regForm.email} onChange={regChange} />
            </label>
            <label htmlFor="phone_number">
                <p>Téléphone :</p>
                <input className="auth-field" type="text" name="phone_number" placeholder="Téléphone" value={regForm.phone_number} onChange={regChange} />
            </label>
            <label htmlFor="password">
                <p>Mot de passe :</p>
                <input className="auth-field" type="password" name="password" placeholder="Mot de passe" value={regForm.password} onChange={regChange} />
            </label>
            <p className="disclaimer">Le numéro de téléphone n'est requis que par commodité de communication pour les membres d'une association. Aster n'utilisera jamais votre numéro.</p>
            <button className="main-button" type="submit">Créer un compte</button>
        </form>
    </div>
}

export default Register;