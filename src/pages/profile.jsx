import React, { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import useAppStore from "../store/useAppStore";


const Profile = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [profile, setProfile] = useState(null);
  const startAll = useAppStore(s => s.startAll);
  const stopAll = useAppStore(s => s.stopAll);

  
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      if (u?.uid) startAll(u.uid);
      else stopAll();
    });
    return () => { off(); stopAll(); };
  }, [startAll, stopAll]);



  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/profile/${user.uid}`);
        if (!res.ok) {
          throw new Error("Profile not found");
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="p-8">
      <h1>Profile</h1>
      {profile ? (
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      ) : (
        <p>Loading profile...</p>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;
