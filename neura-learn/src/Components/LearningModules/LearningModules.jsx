import { Link } from 'react-router-dom';
import './LearningModules.css';
import VideoSection from './VideoSection';

function LearningModules() {
    return (
        <div className="body-learning">
            <div className="container">
                <h1 className="text-center mt-4">Select a Subject</h1>

                <VideoSection
                    title="Before starting, please watch this video:"
                    src="https://www.youtube.com/embed/hU8xEH5yRnA"
                />

                <div className="row subject-selection">
                    <div className="col-md-6 col-lg-3">
                        <div className="subject-card">
                            <i className="fas fa-calculator"></i>
                            <h3>Math</h3>
                            <p>Learn numbers and counting!</p>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-3">
                        <Link to="/learning-modules/alphabets" className="learning-modules-link">
                            <div className="subject-card">
                                <i className="fas fa-font"></i>
                                <h3>Alphabet</h3>
                                <p>Explore letters and words!</p>
                            </div>
                        </Link>
                    </div>
                    <div className="col-md-6 col-lg-3">
                        <Link to="/learning-modules/colors" className="learning-modules-link">
                            <div className="subject-card">
                                <i className="fas fa-paint-brush"></i>
                                <h3>Colors</h3>
                                <p>Learn about colors!</p>
                            </div>
                        </Link>
                    </div>
                    <div className="col-md-6 col-lg-3">
                        <Link to="/learning-modules/shapes" className="learning-modules-link">
                            <div className="subject-card">
                                <i className="fas fa-square"></i>
                                <h3>Shapes</h3>
                                <p>Discover shapes!</p>
                            </div>
                        </Link>
                    </div>
                    <div className="col-md-6 col-lg-3">
                        <Link to="/learning-modules/social-emotions" className="learning-modules-link">
                            <div className="subject-card-multiple">
                                <i className="fas fa-smile"></i>
                                <i className="fas fa-frown"></i>
                                <i className="fas fa-surprise"></i>
                                <i className="fas fa-angry"></i>
                                <h3>Social Emotions</h3>
                                <p>Learn about Social cues and Emotions!</p>
                            </div>
                        </Link>
                    </div>
                    <div className="col-md-6 col-lg-3">
                        <Link to="/learning-modules/VoiceRecognition" className="learning-modules-link">
                        <div className="subject-card">
                            <i className="fas fa-microphone"></i>
                            <h3>Speech Training</h3>
                            <p>Enhance the conversational skills!</p>
                        </div>
                        </Link>
                    </div>
                </div>


                <div id="feedback" className="feedback-message"></div>


                <div className="progress">
                    <div id="progressBar" className="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                </div>
            </div>
        </div>

    )
}

export default LearningModules;

/*
<script>
    function selectSubject(subject) {
        const totalSubjects = 4;
        let completedSubjects = 1;

        const progressPercentage = (completedSubjects / totalSubjects) * 100;
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);
        progressBar.innerText = `${Math.round(progressPercentage)}%`;

        const feedback = document.getElementById('feedback');
        feedback.innerText = `Great! You chose ${subject.charAt(0).toUpperCase() + subject.slice(1)}!`;

        setTimeout(() => {
            window.location.href = `${subject}.html`;
        }, 1000);
    }
</script>*/