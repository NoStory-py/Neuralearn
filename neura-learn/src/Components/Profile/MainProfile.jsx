import React, { useEffect, useState } from 'react';
import NavigationButtons from '../LearningModules/NavigationButtons';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MainProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const performanceData = [
    { week: "Week 1", progress: 20, accuracy: 70 },
    { week: "Week 2", progress: 40, accuracy: 75 },
    { week: "Week 3", progress: 60, accuracy: 80 },
    { week: "Week 4", progress: 80, accuracy: 85 },
    { week: "Week 5", progress: 90, accuracy: 90 }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:8000/profile", {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div style={{
      backgroundColor: "#f5faff",
      padding: "2rem",
      borderRadius: "1rem",
      maxWidth: "900px",
      margin: "0 auto",
      fontFamily: "'Comic Sans MS', cursive, sans-serif"
    }}>
      <h1 style={{ fontSize: "2rem", color: "#4a90e2", textAlign: "center", marginBottom: "1rem" }}>
        🌟 Your Profile 🌟
      </h1>

      {loading ? (
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>Loading profile...</p>
      ) : profile ? (
        <div className="profile-details" style={{
          backgroundColor: "#e6f7ff",
          padding: "1.5rem",
          borderRadius: "1rem",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          marginBottom: "2rem",
          fontSize: "1.3rem",
          lineHeight: "2rem"
        }}>
          <p><strong style={{ color: "#333" }}>Name:</strong> <span style={{ fontWeight: "500" }}>{profile.name}</span></p>
          <p><strong style={{ color: "#333" }}>Email:</strong> <span style={{ fontWeight: "500" }}>{profile.email}</span></p>
          <p><strong style={{ color: "#333" }}>Age:</strong> <span style={{ fontWeight: "500" }}>{profile.age}</span></p>
        </div>
      ) : (
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>No profile data found.</p>
      )}

      <h2 style={{ color: "#333", marginBottom: "1rem", textAlign: "center" }}>📊 Performance Overview</h2>

      <div style={{ backgroundColor: "#fff", borderRadius: "1rem", padding: "1rem", marginBottom: "2rem" }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="progress" fill="#ffb347" />
            <Bar dataKey="accuracy" fill="#87cefa" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "1rem", padding: "1rem", marginBottom: "2rem" }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="progress" stroke="#ff69b4" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="accuracy" stroke="#8a2be2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ textAlign: "center" }}>
        <NavigationButtons
          buttons={[{ name: "Update Profile", link: "/profile/update" }]}
          includeModules={false}
        />
      </div>
    </div>
  );
};

export default MainProfile;
