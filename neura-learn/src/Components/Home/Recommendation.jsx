import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Recommendation.css";

function Recommendation() {

  const [recommended, setRecommended] = useState([]);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) return;

    fetch("http://localhost:8000/api/recommend", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {

      console.log("Recommendation response:", data);

      if (data && data.recommended) {
        setRecommended(data.recommended);
      } else {
        setRecommended([]);
      }

    })
    .catch(err => {
      console.error("Recommendation fetch error:", err);
      setRecommended([]);
    });

  }, []);


  const getRoute = (item) => {

    if (item && typeof item === "object" && item.route)
      return item.route;

    if (typeof item === "string") {

      const name = item.toLowerCase();

      if (name.includes("math"))
        return "/learning-modules/maths";

      if (name.includes("alphabet"))
        return "/learning-modules/alphabets";

      if (name.includes("color"))
        return "/learning-modules/colors";

      if (name.includes("shape"))
        return "/learning-modules/shapes";

      if (name.includes("emotion"))
        return "/learning-modules/social-emotions";

      if (name.includes("speech"))
        return "/learning-modules/VoiceRecognition";
    }

    return "/learning-modules";
  };


  const getModuleName = (item) => {

    if (!item) return "MODULE";

    if (typeof item === "string")
      return item.replaceAll("-", " ").toUpperCase();

    if (typeof item === "object" && item.module)
      return item.module.replaceAll("-", " ").toUpperCase();

    return "MODULE";
  };


  if (!recommended || recommended.length === 0)
    return null;


  return (

    <div className="container my-4">

      <h2 className="mb-3 text-center">
        ⭐ Recommended for you
      </h2>

      <div className="recommendation-wrapper">

        <div className="recommendation-container">

          <div className="recommendation-list">

            {recommended.slice(0, 2).map((item, index) => (

              <div
                className="recommendation-item"
                key={index}
              >

                <div className="recommendation-title">
                  Recommended Module
                </div>

                <div className="recommendation-module">
                  🧩 {getModuleName(item)}
                </div>

                <Link
                  to={getRoute(item)}
                  className="recommendation-start"
                >
                  Start →
                </Link>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

}

export default Recommendation;
