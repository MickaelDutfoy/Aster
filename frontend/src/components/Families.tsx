import { Link } from "react-router-dom";
import type { Org } from "../types";

const Family = ({userOrgs, selectedOrg, setSelectedOrg}: { userOrgs: Org[], selectedOrg: number | null, setSelectedOrg: (userOrgs: number | null) => void }) => {

    const handleOrgSelector = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "") {
            setSelectedOrg(null)
        } else {
            setSelectedOrg(Number(e.target.value))
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
        </div>
    </div>
}

export default Family;