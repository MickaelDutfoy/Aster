import "../styles/AnimalDetail.scss"
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { showToast } from "../utils/toast";
import { api } from "../api";
import type { AnimalListItem } from "../types";

const AnimalDetail = () => {
    const { id } = useParams();
    const location = useLocation();

    const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const initial = (location.state as { animal?: AnimalListItem } | null)?.animal ?? null;
    const [animal, setAnimal] = useState<AnimalListItem | null>(initial);
    const [animalForm, setAnimalForm] = useState({
        name: animal?.name,
        species: animal?.species,
        sex: animal?.sex,
        color: animal?.color,
        birthYear: animal?.birth_date ? Number(animal.birth_date.slice(0, 4)) : undefined,
        birthMonth: animal?.birth_date ? Number(animal.birth_date.slice(5, 7)) : undefined,
        birthDay: animal?.birth_date ? Number(animal.birth_date.slice(8, 10)) : undefined,
        neutered: animal?.is_neutered,
        vax: animal?.last_vax,
        primo: animal?.is_primo_vax,
        deworm: animal?.last_deworm,
        prime: animal?.is_first_deworm,
        notes: animal?.information,
    });

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

    const warningVax = (a: AnimalListItem): string => {
        const now = new Date();

        if (!a.last_vax) return " ⚠️";

        const vaxLast = new Date(a.last_vax);

        const vaxNext = new Date(vaxLast);
        if (a.is_primo_vax) {
            vaxNext.setMonth(vaxNext.getMonth() + 1);
        } else {
            vaxNext.setFullYear(vaxNext.getFullYear() + 1);
        }

        return now.getTime() >= vaxNext.getTime() ? " ⚠️" : "";
    };

    const warningDeworm = (a: AnimalListItem): string => {
        const now = new Date();

        if (!a.last_deworm) return " ⚠️";

        const dewormLast = new Date(a.last_deworm);

        const dewormNext = new Date(dewormLast);
        if (a.is_first_deworm) {
            dewormNext.setDate(dewormNext.getDate() + 15);
        } else {
            dewormNext.setMonth(dewormNext.getMonth() + 1);
        }

        return now.getTime() >= dewormNext.getTime() ? " ⚠️" : "";
    };

    const formatDate = (birthDate: string): string => {
        const bits = birthDate.split("-");
        return bits[2][0] + bits[2][1] + "/" + bits[1] + "/" + bits[0]
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
            const res = await fetch(api(`/api/animals/${id}`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify( animalForm ),
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.error);
                return;
            }

            showToast("Animal mis à jour avec succès.");

            console.log(data)
            setAnimal(data);
        } catch (error) {
            console.error(error);
        }
    }

    return <div className="page">
        <div className="overlay">
            <header>
                <Link className="backlink" to="/animals">&larr; Revenir aux animaux</Link>
            </header>
            <hr />
            {animal && <div className="animal-detail">
                <h3>{animal.name}</h3>
                <p>{animal.species} {animal.color.toLowerCase()} {animal.sex === "M" ? "Mâle" : "Femelle"} de {getAge(animal.birth_date)}.</p>
                <p>Né{animal.sex === "F" ? "e" : ""} le {formatDate(animal.birth_date)}.</p>
                <p>{animal.is_neutered ? "Stérilisé(e)." : ""}</p>
                <p>Dernier vaccin : {animal.last_vax ? formatDate(animal.last_vax) : "aucun"}{animal.is_primo_vax ? " (primo)" : ""}{warningVax(animal)}.</p>
                <p>Dernier déparasitage : {animal.last_deworm ? formatDate(animal.last_deworm) : "aucun"}{animal.is_first_deworm ? " (premier)" : ""}{warningDeworm(animal)}.</p>
                <p>{animal.information ? "Notes : " + animal.information : ""}</p>
            </div>}
            <hr />
            <h3>Modifier les informations :</h3>
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
                                <option value="" disabled>Année *</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select name="birthMonth" value={animalForm.birthMonth} onChange={handleAnimalChange}>
                                <option value="" disabled>Mois *</option>
                                {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                            </select>
                            <select name="birthDay" value={animalForm.birthDay} onChange={handleAnimalChange}>
                                <option value="" disabled>Jour</option>
                                {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="animal-neutered">
                        <p className="field-title">Stérilisé(e) ?</p>
                        <p>{animalForm.neutered}</p>
                        <input
                            className="box"
                            type="checkbox"
                            name="is_neutered"
                            checked={animalForm.neutered}
                            onChange={(e) => setAnimalForm(f => ({ ...f, is_neutered: e.target.checked }))}
                        />
                    </div>
                    <div className="animal-vax">
                        <p className="field-title">Vacciné(e) le :</p>
                        <div className="health-date">
                            <label className="note">Primo ?
                                <input className="box" type="checkbox" name="primo" checked={animalForm.primo} onChange={(e) => setAnimalForm(f => ({ ...f, primo: e.target.checked }))} /></label>
                            <input className="field" type="date" name="vax" value={animalForm.vax?.slice(0, 10)} onChange={handleAnimalChange} />
                        </div>
                    </div>
                    <div className="animal-deworm">
                        <p className="field-title">Déparasité(e) le :</p>
                        <div className="health-date">
                            <label className="note">Premier ?
                                <input className="box" type="checkbox" name="prime" checked={animalForm.prime} onChange={(e) => setAnimalForm(f => ({ ...f, prime: e.target.checked }))} /></label>
                            <input className="field" type="date" name="deworm" value={animalForm.deworm?.slice(0, 10)} onChange={handleAnimalChange} />
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

export default AnimalDetail;