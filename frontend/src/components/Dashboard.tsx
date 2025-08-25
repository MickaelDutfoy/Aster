import "../styles/Dashboard.scss";
import { useNavigate } from "react-router-dom";
import type { Org } from "../types";
import { PawPrint, Home, Map, Folder } from "lucide-react";

const Dashboard = ({ setAuth, userOrgs, name }: { setAuth: (auth: boolean) => void, userOrgs: Org[], name: string }) => {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        setAuth(false);
    }

    return <div className="page">
        <div className="dash overlay">
            <header>
                <h2>Bienvenue {name} !</h2>
                <button className="little-button" onClick={logout}>Déconnexion</button>
            </header>
            <hr />
            <div className="dash-panel">
                <figure className={userOrgs.length === 0 ? "disabled" : ""}>
                    <PawPrint className="icon" size={80} strokeWidth={1.5} onClick={() => navigate("/animals")} />
                    <figcaption className="legend">Animaux</figcaption>
                </figure>
                <figure className={userOrgs.length === 0 ? "disabled" : ""}>
                    <Home className="icon" size={80} strokeWidth={1.5} onClick={() => navigate("/families")} />
                    <figcaption className="legend">Familles</figcaption>
                </figure>
                <figure className={userOrgs.length === 0 ? "disabled" : ""}>
                    <Map className="icon" size={80} strokeWidth={1.5} onClick={() => navigate("/map")} />
                    <figcaption className="legend">Carte</figcaption>
                </figure>
                <figure>
                    <Folder className="icon" size={80} strokeWidth={1.5} onClick={() => navigate("/organizations")} />
                    <figcaption className="legend">Associations</figcaption>
                </figure>
            </div>
            {userOrgs.length === 0 && <p className="notice">Vous devez d'abord ajouter une association ou en rejoindre une.</p>}
            <p className="notice">Un problème ? Une suggestion ? <a href="mailto:m.dutfoy@gmail.com">Envoyez-moi un message</a> !</p>
        </div>
    </div>
}

export default Dashboard;