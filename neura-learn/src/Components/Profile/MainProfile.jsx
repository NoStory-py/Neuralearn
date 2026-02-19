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
  const [lineChartData, setLineChartData] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/profile", {
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
        const res = await axios.get("/api/test", {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        console.log("Test API response:", res.data);
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

        // Line Chart
        // --- Build allModules set ---
        const allModules = new Set();
        rawData.forEach(subject => allModules.add(subject.module));

        // --- Build dateMap ---
        const dateMap = rawData.reduce((acc, subject) => {
          const module = subject.module;
          subject.timestamps.forEach((ts, idx) => {
            const date = ts.split(' ')[0];
            const mark = subject.marks[idx];
            if (!acc[date]) acc[date] = {};
            acc[date][module] = acc[date][module] ? Math.max(acc[date][module], mark) : mark;
          });
          return acc;
        }, {});

        // --- Build line chart data with all modules ---
        const lineData = Object.keys(dateMap)
          .sort((a, b) => new Date(a) - new Date(b))
          .map(date => {
            const row = { date };
            allModules.forEach(module => {
              row[module] = dateMap[date][module] ?? null; // include null for missing modules
            });
            return row;
          });


        setLineChartData(lineData);

      } catch (err) {
        console.error("Failed to fetch test results:", err);
      }
    };

    fetchProfile();
    fetchTestResults();
  }, []);

  return (
    <div style={{
      backgroundImage: "url('/Images/profile_bg.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      padding: "clamp(4px, 2vw, 16px)",
      minHeight: "100vh",
    }}>
      <div style={{
        backgroundColor: "#f5faff",
        padding: "clamp(4px, 2vw, 16px)",
        borderRadius: "1rem",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "'Comic Sans MS', cursive, sans-serif"
      }}>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", color: "#4a90e2", textAlign: "center", marginBottom: "1rem" }}>
            🌟 Your Profile 🌟
          </h1>

          {loading ? (
            <p style={{ textAlign: "center", fontSize: "1.2rem" }}>Loading profile...</p>
          ) : profile ? (
            <div className="profile-details" style={{
              backgroundColor: "#ccefff",
              padding: "clamp(8px, 2vw, 24px)", 
              borderRadius: "1rem",
              boxShadow: "0 0 10px rgba(0,0,0,0.3)",
              marginBottom: "clamp(8px, 2vw, 24px)",
              fontSize: "clamp(1rem, 2.5vw, 1.3rem)", 
              lineHeight: "clamp(1.5rem, 2.5vw, 2rem)" 
            }}>
                {profile.username && (
                <p style={{ margin: 0, marginBottom: "clamp(2px, 1vw, 6px)" }}>
                    <strong style={{ color: "#333" }}>Name:</strong>{" "}
                    <span style={{ fontWeight: "500" }}>{profile.username}</span>
                </p>
                )}

                {profile.gender && (
                <p style={{ margin: 0, marginBottom: "clamp(2px, 1vw, 6px)" }}>
                    <strong style={{ color: "#333" }}>Gender:</strong>{" "}
                    <span style={{ fontWeight: "500" }}>{profile.gender}</span>
                </p>
                )}

                {profile.age && (
                <p style={{ margin: 0 }}>
                   <strong style={{ color: "#333" }}>Age:</strong>{" "}
                   <span style={{ fontWeight: "500" }}>{profile.age}</span>
                </p>
                )}
            </div>
          ) : (
            <p style={{ textAlign: "center", fontSize: "1.2rem" }}>No profile data found.</p>
          )}

          <h2 style={{ color: "#333", marginBottom: "1rem", textAlign: "center" }}>📊 Performance Overview</h2>

          <div style={{ boxShadow: "0 0 10px rgba(0,0,0,0.3)", backgroundColor: "#ccefff", borderRadius: "1rem", padding: "1rem", marginBottom: "2rem" }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="subject" tick={{ fontSize: 'clamp(0.7rem, 1.5vw, 1rem)' }} interval={0} angle={-45} textAnchor="end" height={80}/>
              <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 'clamp(0.7rem, 1.5vw, 1rem)' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 'clamp(0.7rem, 1.5vw, 1rem)' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="average" fill="#4caf50" name="Average Marks" />
              <Bar yAxisId="right" dataKey="progress" fill="#2196f3" name="Progress (%)" />
            </BarChart>
          </ResponsiveContainer>
          </div>

          <div style={{ boxShadow: "0 0 10px rgba(0,0,0,0.3)", backgroundColor: "#ccefff", borderRadius: "1rem", padding: "1rem", marginBottom: "2rem" }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis
                  dataKey="date"
                  angle={-45}                // rotate labels so they fit
                  textAnchor="end"
                  height={80}                // more space for rotated labels
                  interval="preserveStartEnd" // show start, end, and some in middle
                  tickFormatter={(date) => {
                    const [year, month, day] = date.split('-'); // "2026-02-15"
                    const monthName = new Date(date).toLocaleString('default', { month: 'short' }); // "Feb"
                    return `${monthName} ${parseInt(day, 10)}`; // "Feb 15"
                  }}
                  tick={{ fontSize: 'clamp(0.7rem, 1.5vw, 1rem)' }}
                />
                <YAxis domain={[0, 5]}  tick={{ fontSize: 'clamp(0.7rem, 1.5vw, 1rem)' }} />
                <Tooltip />
                <Legend />
                
                {lineChartData[0] &&
                  Object.keys(lineChartData[0])
                    .filter(key => key !== "date")
                    .map((module, idx) => (
                      <Line
                        key={module}
                        type="monotone"
                        dataKey={module}
                        stroke={["#ff69b4", "#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#00bcd4"][idx % 6]}
                        strokeWidth={3}
                        name={module}
                        connectNulls
                        activeDot={{ r: 6 }}
                      />
                  ))}
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
      </div>
  );
};

export default MainProfile;