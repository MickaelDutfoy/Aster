import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { checkToken } from "./utils/auth";
import { showToast } from "./utils/toast";
import Intro from "./components/Intro";
import Auth from "./components/Auth";
import Register from './components/Register';
import Dashboard from "./components/Dashboard";
import Animals from "./components/Animals";
import Families from "./components/Families";
import Map from "./components/Map";
import Organizations from "./components/Organizations";
import AnimalDetail from "./components/AnimalDetail";
import { api } from "./api";
import type { Org, PendingMember } from "./types";

const App = () => {
  
  const navigate = useNavigate();

  const [name, setName] = useState("invité");
  const [auth, setAuth]: [boolean, (auth: boolean) => void] = useState(false);
  const [introSeen, setIntroSeen]: [boolean, (auth: boolean) => void] = useState(localStorage.getItem("introSeen") === "true");
  const [loading, setLoading] = useState(false);
  const [userOrgs, setUserOrgs] = useState<Org[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Org[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("name");
    if (storedName) {
      setName(storedName);
    }
  }, []);

  useEffect(() => {
      if (userOrgs.length > 0 && selectedOrg === null) {
          setSelectedOrg(userOrgs[0].id);
      }
  }, [userOrgs]);

  useEffect(() => {
    const getOrgs = async () => {
      if (!introSeen || !auth) return;

      const valid = await checkToken();
      if (!valid) {
        setAuth(false)
        navigate("/login");
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(api("/api/member-organization"), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();

        if (res.ok) {
          setUserOrgs(data.organizations);
          setPendingRequests(data.myPending);
          setPendingMembers(data.pending);
        } else {
          showToast(data.error || "Erreur serveur");
        }
      } catch (err) {
        console.error(err);
      }
    }

    getOrgs();
  }, [auth, introSeen])

  useEffect(() => {
    const verify = async () => {
      const valid = await checkToken();
      setAuth(valid);
      if (!valid) localStorage.removeItem("token");
      setLoading(false);
    };

    setLoading(true);
    verify();
  }, []);

  return <>
    {loading && (
      <div className='page'></div>
    )}
    {!loading && <Routes>
      {!introSeen && (
        <>
          <Route path="/intro" element={<Intro setIntroSeen={setIntroSeen} />} />
          <Route path="*" element={<Navigate to="/intro" />} />
        </>
      )}
      {introSeen && !auth && (
        <>
          <Route path="/login" element={<Auth setAuth={setAuth} setName={setName} />} />
          <Route path="/register" element={<Register setAuth={setAuth} setName={setName} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      )}
      {introSeen && auth && (
        <>
          <Route path="/" element={<Dashboard setAuth={setAuth} userOrgs={userOrgs} name={name} />} />
          <Route path="/animals" element={<Animals userOrgs={userOrgs} selectedOrg={selectedOrg} setSelectedOrg={setSelectedOrg} />} />
          <Route path="/animals/:id" element={<AnimalDetail />} />
          <Route path="/families" element={<Families userOrgs={userOrgs} selectedOrg={selectedOrg} setSelectedOrg={setSelectedOrg} />} />
          <Route path="/map" element={<Map userOrgs={userOrgs} selectedOrg={selectedOrg} setSelectedOrg={setSelectedOrg} />} />
          <Route path="/organizations" element={<Organizations userOrgs={userOrgs} setUserOrgs={setUserOrgs} selectedOrg={selectedOrg} setSelectedOrg={setSelectedOrg} pendingRequests={pendingRequests} setPendingRequests={setPendingRequests} pendingMembers={pendingMembers} setPendingMembers={setPendingMembers} />} />
          <Route path="/intro" element={<Navigate to="/" />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/register" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>}
    <div id="toast-container"></div>
  </>
}

export default App;