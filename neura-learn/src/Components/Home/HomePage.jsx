import HomeCard from "./HomeCard";
import HomeCarousel from "./HomeCarousel";
import ChatbotHover from "../Chatbot/ChatbotHover";
import Recommendation from "./Recommendation";
import "./HomePage.css";

const HomePage = () => {
  return (
    <div className="homepage-container">

      <HomeCarousel />
      <Recommendation />
      <HomeCard />
      <ChatbotHover/>

    </div>
  );
};

export default HomePage;
