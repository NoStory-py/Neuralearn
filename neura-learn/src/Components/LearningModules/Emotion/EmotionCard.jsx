import NavigationButtons from "../NavigationButtons";
import { useState } from 'react'

const EmotionsCard = ({ title, chapter, desc, src, alt, task, answer = true, emotionAnswer, response }) => {
    const [userAnswer, setUserAnswer] = useState('');

    const handleSubmit = () => {
        emotionAnswer(userAnswer);
        setUserAnswer('');
    };

    const handleInputChange = (e) => {
        setUserAnswer(e.target.value);
    };

    return (
        <>
            <h1><strong>{title}</strong></h1><br />
            <h2><strong>Chapter {chapter}</strong></h2>
            <p>{desc}</p>
            <img src={src} alt={alt} className="img-fluid" />
            <h3>{task}</h3>
            {answer && (
                <>
                    <select id="userAnswer" className="form-control" value={userAnswer} onChange={handleInputChange}>
                        <option value="">Select an answer</option>
                        <option value="happiness">happiness</option>
                        <option value="angry">angry</option>
                        <option value="sadness">sadness</option>
                        <option value="surprise">surprise</option>
                    </select>
                    <NavigationButtons
                        buttons={[
                            { name: "Submit", action: handleSubmit },
                        ]}
                        includeModules={false}
                    />
                    <div className="response-message-emotions">{response}</div>
                </>
            )}
        </>
    );
}

export default EmotionsCard