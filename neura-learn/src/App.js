import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import HomeCarousel from "./Components/Home/HomeCarousel";
import HomeCard from "./Components/Home/HomeCard";
import Contact from "./Components/Misc/Contact";
import About from "./Components/Misc/About";
import GuessNumber from "./Components/Games/GuessNumber";
import ChooseGames from "./Components/Games/ChooseGames";
import LandingPage from "./Components/Landing/LandingPage";
import PrintableActivities from "./Components/Printables/PrintableActivities";
import ScrollToTop from "./Components/ScrollToTop";

import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";

import LearningModules from './Components/LearningModules/LearningModules';
import ModulesMaths from "./Components/LearningModules/ModulesMaths";
import ModulesAlphabets from "./Components/LearningModules/ModulesAlphabets";
import ModulesColors from "./Components/LearningModules/ModulesColors";
import ModulesShapes from "./Components/LearningModules/ModulesShapes";
import SocialEmotions from "./Components/LearningModules/SocialEmotions";
import VoiceRecognition from "./Components/LearningModules/Voice/VoiceRecognition";
//import SpeechTraining from "./Components/LearningModules/Voice/SpeechTraining";
//import EmotionPractice from "./Components/LearningModules/Voice/EmotionPractice";
import ConversationTraining from "./Components/LearningModules/Voice/ConversationTraining";

import TestColors from "./Components/LearningModules/TestColors";
import TestShapes from "./Components/LearningModules/TestShapes";
import TestAlphabets from "./Components/LearningModules/TestAlphabets";

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
        <Route path="/" element={<LandingPage />} />
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
          <Route path="/learning-modules/colors" element = {<ModulesColors/>}/>
          <Route path="/learning-modules/shapes" element = {<ModulesShapes/>}/>
          <Route path="/learning-modules/social-emotions" element = {<SocialEmotions/>}/>
          <Route path="/learning-modules/VoiceRecognition" element={<VoiceRecognition />} />
          {/*<Route path="/learning-modules/Voice/SpeechTraining" element={<SpeechTraining />} />
          <Route path="/learning-modules/Voice/EmotionPractice" element={<EmotionPractice />} />*/}
          <Route path="/learning-modules/Voice/ConversationTraining" element={<ConversationTraining />} />
          
          <Route path="/learning-modules/social-emotions" element={<SocialEmotions />} />
          <Route path="/learning-modules/VoiceRecognition" element={<VoiceRecognition />} />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Route>

      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
