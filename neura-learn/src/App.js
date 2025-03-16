import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";

// import './Assets/CSS/main.css';

import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import HomeCarousel from "./Components/Home/HomeCarousel";
import HomeCard from "./Components/Home/HomeCard";
import Contact from "./Components/Misc/Contact";
import About from "./Components/Misc/About";
import GuessNumber from "./Components/Games/GuessNumber";
import ChooseGames from "./Components/Games/ChooseGames";
import Landing from "./Components/Landing/LandingPage";
import PrintableActivities from "./Components/Printables/PrintableActivities";
import ScrollToTop from "./Components/ScrollToTop";
import LearningModules from './Components/LearningModules/LearningModules';
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import ModulesAlphabets from "./Components/LearningModules/ModulesAlphabets";
import SocialEmotions from "./Components/LearningModules/SocialEmotions";
import VoiceRecognition from "./Components/LearningModules/VoiceRecognition";

const HomePage = () => {
  return (
    <>
      <HomeCarousel />
      <HomeCard />

    </>
  );
};


function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/games" element={<ChooseGames />} />
          <Route path="/games/guess-number" element={<GuessNumber />} />
          <Route path="/printables" element={<PrintableActivities />} />
          <Route path="/learning-modules" element = {<LearningModules/>}/>
          <Route path="/learning-modules/alphabets" element = {<ModulesAlphabets/>}/>
          <Route path="/learning-modules/social-emotions" element = {<SocialEmotions/>}/>
          <Route path="/learning-modules/VoiceRecognition" element={<VoiceRecognition />} />
          
        </Route>

      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
