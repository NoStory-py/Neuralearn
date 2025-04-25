import React, { useEffect, useState } from 'react';
import NavigationButtons from '../LearningModules/NavigationButtons';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const EXPECTED_TOTAL_TESTS = 5;

const MainProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);

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

    const fetchTestResults = async () => {
      try {
        const res = await axios.get("http://localhost:8000/test", {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        const rawData = res.data;
        const transformed = rawData.map(subject => {
          const totalMarks = subject.marks.reduce((sum, m) => sum + m, 0);
          const numTests = subject.marks.length;
          const avgMarks = numTests ? (totalMarks / numTests).toFixed(2) : 0;
          const progress = ((numTests / EXPECTED_TOTAL_TESTS) * 100).toFixed(2);

          return {
            subject: subject.module,
            average: parseFloat(avgMarks),
            progress: parseFloat(progress)
          };
        });

        setPerformanceData(transformed);
      } catch (err) {
        console.error("Failed to fetch test results:", err);
      }
    };

    fetchProfile();
    fetchTestResults();
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
          <p><strong style={{ color: "#333" }}>Name:</strong> <span style={{ fontWeight: "500" }}>{profile.username}</span></p>
          <p><strong style={{ color: "#333" }}>Gender:</strong> <span style={{ fontWeight: "500" }}>{profile.gender}</span></p>
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
          <XAxis dataKey="subject" />
          <YAxis yAxisId="left" domain={[0, 5]} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="average" fill="#4caf50" name="Average Marks" />
          <Bar yAxisId="right" dataKey="progress" fill="#2196f3" name="Progress (%)" />
        </BarChart>
      </ResponsiveContainer>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "1rem", padding: "1rem", marginBottom: "2rem" }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="subject" />
          <YAxis yAxisId="left" domain={[0, 5]} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="average" stroke="#ff69b4" activeDot={{ r: 8 }} name="Average Marks" />
          <Line yAxisId="right" type="monotone" dataKey="progress" stroke="#8a2be2" name="Progress (%)" />
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
