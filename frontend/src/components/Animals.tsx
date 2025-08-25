import "../styles/Animals.scss"
import type { AnimalListItem, Org } from "../types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../utils/toast";

const Animals = ({ userOrgs, selectedOrg, setSelectedOrg }: { userOrgs: Org[], selectedOrg: number | null, setSelectedOrg: (userOrgs: number | null) => void }) => {

    const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const [animalForm, setAnimalForm] = useState({
        name: "",
        species: "",
        sex: "",
        color: "",
        birthYear: 0,
        birthMonth: 0,
        birthDay: 0,
        is_neutered: false,
        vax: "",
        primo: false,
        deworm: "",
        prime: false,
        notes: "",
    });
    const [animalList, setAnimalList] = useState<AnimalListItem[]>([]);
    const [refreshAnimals, setRefreshAnimals] = useState(0);

    useEffect(() => {
        if (!selectedOrg) return;
        setAnimalList([]);
        let abort = new AbortController();

        const getAnimals = async () => {
            const token = localStorage.getItem("token");

            try {
                const res = await fetch(`http://localhost:3001/api/animals?orgId=${selectedOrg}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    signal: abort.signal,
                });

                const data = await res.json();

                if (!res.ok) {
                    showToast(data.error);
                    return;
                }

                setAnimalList(data);
            } catch (error) {
                console.error(error);
            }
        }

        getAnimals();
        return () => abort.abort();
    }, [selectedOrg, refreshAnimals])

    const getAge = (birthDate: string): string => {
        const birth = new Date(birthDate);
        const now = new Date();

        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        if (years > 0) return `${years} an${years > 1 ? "s" : ""}`;
        return `${months} mois`;
    }

    const warning = (a: AnimalListItem): string => {
        const now = new Date();

        if (!a.last_vax || !a.last_deworm) return "⚠️";

        const vaxLast = new Date(a.last_vax);
        const dewormLast = new Date(a.last_deworm);

        const vaxNext = new Date(vaxLast);
        if (a.is_primo_vax) {
            vaxNext.setMonth(vaxNext.getMonth() + 1);
        } else {
            vaxNext.setFullYear(vaxNext.getFullYear() + 1);
        }

        const dewormNext = new Date(dewormLast);
        if (a.is_first_deworm) {
            dewormNext.setDate(dewormNext.getDate() + 15);
        } else {
            dewormNext.setMonth(dewormNext.getMonth() + 1);
        }

        const overdue =
            now.getTime() >= vaxNext.getTime() ||
            now.getTime() >= dewormNext.getTime();

        return overdue ? "⚠️" : "";
    };

    const handleOrgSelector = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "") {
            setSelectedOrg(null)
        } else {
            setSelectedOrg(Number(e.target.value))
        }
    }

    const handleAnimalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (["birthYear", "birthMonth", "birthDay"].includes(name)) {
            setAnimalForm({ ...animalForm, [name]: Number(value) });
        } else {
            setAnimalForm({ ...animalForm, [name]: value });
        }
    }

    const handleAnimal = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!animalForm.name || !animalForm.species || !animalForm.birthYear || !animalForm.birthMonth) {
            showToast("Veuillez remplir tous les champs requis.")
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:3001/api/animals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...animalForm, orgId: selectedOrg }),
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.error);
                return;
            }

            setRefreshAnimals(prev => prev + 1);
            showToast("Animal ajouté avec succès");
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
            {animalList.length > 0 && <div>
                <h3>Vos animaux :</h3>
                <ul className="animal-list">
                    {animalList.map(a => {
                        return <li key={a.id}><Link to={`/animals/${a.id}`} state={{ animal: a }}>{a.name} — {a.species} — {a.sex}{a.sex ? " —" : ""} {getAge(a.birth_date)} {warning(a)}</Link></li>
                    })}
                </ul>
                <p className="note">(Les animaux marqués d'un ⚠️ ont un rappel de vaccin ou un déparasitage à refaire)</p>
                <hr />
            </div>}
            <h3>Ajouter un animal :</h3>
            <div className="post-animal">
                <p className="note">(Les champs marqués d'une * sont obligatoires.)</p>
                <form onSubmit={handleAnimal}>
                    <div className="animal-name-species">
                        <input className="field"
                            type="text"
                            name="name"
                            placeholder="Nom *"
                            value={animalForm.name}
                            onChange={handleAnimalChange}
                        />
                        <input className="field"
                            type="text"
                            name="species"
                            placeholder="Espèce *"
                            value={animalForm.species}
                            onChange={handleAnimalChange}
                        />
                        <input className="field"
                            type="text"
                            name="color"
                            placeholder="Couleur"
                            value={animalForm.color}
                            onChange={handleAnimalChange}
                        />
                        <select name="sex" value={animalForm.sex} onChange={handleAnimalChange}>
                            <option value="">Inconnu</option>
                            <option value="M">Mâle</option>
                            <option value="F">Femelle</option>
                        </select>
                    </div>
                    <div className="animal-birth">
                        <p className="field-title">Né(e) le :</p>
                        <div>
                            <select name="birthYear" value={animalForm.birthYear} onChange={handleAnimalChange}>
                                <option value="">Année *</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select name="birthMonth" value={animalForm.birthMonth} onChange={handleAnimalChange}>
                                <option value="">Mois *</option>
                                {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                            </select>
                            <select name="birthDay" value={animalForm.birthDay} onChange={handleAnimalChange}>
                                <option value="">Jour</option>
                                {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="animal-neutered">
                        <p className="field-title">Stérilisé(e) ?</p>
                        <input
                            className="box"
                            type="checkbox"
                            name="is_neutered"
                            defaultChecked={animalForm.is_neutered}
                            onChange={(e) => setAnimalForm(f => ({ ...f, neutered: e.target.checked }))}
                        />
                    </div>
                    <div className="animal-vax">
                        <p className="field-title">Vacciné(e) le :</p>
                        <div className="health-date">
                            <label className="note">Primo ?
                                <input className="box" type="checkbox" name="primo" checked={animalForm.primo} onChange={(e) => setAnimalForm(f => ({ ...f, primo: e.target.checked }))} /></label>
                            <input className="field" type="date" name="vax" value={animalForm.vax} onChange={handleAnimalChange} />
                        </div>
                    </div>
                    <div className="animal-deworm">
                        <p className="field-title">Déparasité(e) le :</p>
                        <div className="health-date">
                            <label className="note">Premier ?
                                <input className="box" type="checkbox" name="prime" checked={animalForm.prime} onChange={(e) => setAnimalForm(f => ({ ...f, prime: e.target.checked }))} /></label>
                            <input className="field" type="date" name="deworm" value={animalForm.deworm} onChange={handleAnimalChange} />
                        </div>
                    </div>
                    <textarea className="animal-notes"
                        name="notes"
                        placeholder="Commentaires éventuels sur l'animal"
                        value={animalForm.notes}
                        onChange={handleAnimalChange}
                        onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = "auto";
                            el.style.height = `${el.scrollHeight}px`;
                        }}
                    />
                    <button type="submit" className="little-button">Enregistrer</button>
                </form>
            </div>
        </div>
    </div>
}

export default Animals;