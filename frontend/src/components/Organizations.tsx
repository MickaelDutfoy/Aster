import "../styles/Organizations.scss"
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import { api } from "../api";
import type { Org, PendingMember } from "../types";

const Organizations = ({ userOrgs, selectedOrg, pendingRequests, pendingMembers, setUserOrgs, setSelectedOrg, setPendingRequests, setPendingMembers }: { userOrgs: Org[], selectedOrg: number | null, pendingRequests: Org[], pendingMembers: PendingMember[], setUserOrgs: (userOrgs: Org[]) => void, setSelectedOrg: (userOrgs: number | null) => void, setPendingRequests: (userOrgs: Org[]) => void, setPendingMembers: (userOrgs: PendingMember[]) => void }) => {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Org[]>([]);
    const [pickedOrg, setPickedOrg] = useState<Org | null>(null);
    const suppressFetch = useRef(false);

    useEffect(() => {
        if (suppressFetch.current) {
            suppressFetch.current = false;
            return;
        }

        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        const token = localStorage.getItem("token");

        const fetchResults = async () => {
            try {
                const res = await fetch(api(`/api/organizations?q=${encodeURIComponent(searchTerm)}`), {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Erreur serveur");

                const data = await res.json();
                setSearchResults(data);
            } catch (err) {
                console.error("Erreur fetch orga:", err);
            }
        };

        fetchResults();
    }, [searchTerm]);

    const handleOrgSelector = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "") {
            setSelectedOrg(null)
        } else {
            setSelectedOrg(Number(e.target.value))
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(api("/api/organizations"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                console.log("Échec de la requête")
                return;
            }

            const newOrg = await res.json();
            setUserOrgs([...userOrgs, newOrg]);
            navigate("/");
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelect = (org: Org) => {
        suppressFetch.current = true;
        setSearchTerm(org.name);
        setPickedOrg(org);
        setSearchResults([]);
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pickedOrg) {
            showToast("Veuillez sélectionner une association.");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(api("/api/member-organization"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ organizationId: pickedOrg.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === "already_member") {
                    showToast("Vous êtes déjà membre de cette association (ou en attente d'approbation).");
                } else {
                    showToast("Erreur lors de la candidature.");
                }
                return;
            }

            showToast("Votre demande d’adhésion a été envoyée !");

            if (pickedOrg) {
                const exists = pendingRequests.some(o => o.id === pickedOrg.id);
                if (!exists) {
                    setPendingRequests([...pendingRequests, { id: pickedOrg.id, name: pickedOrg.name }]);
                }
            }
        } catch (err) {
            console.error("Erreur POST candidature :", err);
            showToast("Erreur réseau");
        }
    };

    const handleApprove = async (orgId: number, memberId: number) => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(api(`/api/member-organization/${orgId}/members/${memberId}`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "validated" }),
            });

            if (!res.ok) {
                console.error("Erreur:", await res.json());
                return;
            }

            showToast("Membre approuvé !");

            const next = pendingMembers.filter(
                x => !(x.org_id === orgId && x.member_id === memberId)
            );
            setPendingMembers(next);
        } catch (error) {
            console.error(error);
        }
    }

    return <div className="page">
        <div className="overlay">
            <header>
                <Link className="backlink" to="/">&larr; Revenir au bureau</Link>
            </header>
            <hr />
            {userOrgs.length > 0 && <div className="dash-orga">
                <div className="orga-select">
                    <h3>Vos associations :</h3>
                    <select name="user-orgs" id="userOrgs" value={selectedOrg ?? ""} onChange={handleOrgSelector}>
                        {userOrgs.map((org, index) => <option key={index} value={org.id}>{org.name}</option>)}
                    </select>
                </div>
                <hr />
            </div>}
            <h3>Enregistrer une nouvelle association ?</h3>
            <div className="orga-register">
                <form onSubmit={handleCreate}>
                    <input className="field"
                        type="text"
                        placeholder="Nom de l'association"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <button type="submit" className="little-button">Enregistrer</button>
                </form>
            </div>
            <h3>Rechercher une association existante ?</h3>
            <div className="orga-search">
                <form onSubmit={handleJoin}>
                    <input
                        className="field"
                        type="text"
                        placeholder="Nom de l'association"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="little-button">Rejoindre</button>
                </form>
                <ul>
                    {searchResults.map((org) => (
                        <li key={org.id} onClick={() => handleSelect(org)}>
                            {org.name} ({org.superadmin_first_name} {org.superadmin_last_name})
                        </li>
                    ))}
                </ul>
            </div>
            {pendingMembers.length > 0 && <>
                <h3>Demandes d'adhésion à approuver :</h3>
                <ul className="pending-list">
                    {pendingMembers.map(p => (
                        <li key={`${p.org_id}-${p.member_id}`} onClick={() => handleApprove(p.org_id, p.member_id)}>
                            {p.first_name} {p.last_name} pour {p.org_name}
                        </li>
                    ))}
                </ul>
                <p className="note">(Cliquez sur une demande pour l'approuver.)</p>
            </>}
            {pendingRequests.length > 0 && <>
                <h3>Demandes d'adhésion en attente :</h3>
                <ul className="waiting-list">
                    {pendingRequests.map(r => (
                        <li key={`${r.id}`}>{r.name}</li>
                    ))}
                </ul>
                <p className="note">(Un administrateur doit valider la demande.)</p>
            </>}
        </div>
    </div>
}

export default Organizations;