import { Link } from 'react-router-dom';
import '../Assets/CSS/ChooseGames.css'

function ChooseGames() {
    return (
        <section className="games-section py-5" style={{ backgroundImage: 'url(/Images/cloudStar.png)' }}>

            <div className="container">
                <h1 className="text-center mb-4"><b>Fun Interactive Games</b></h1>
                <div className="row justify-content-center">
                    <div className="col-md-4 col-sm-6 mb-4">
                        <div className="game-card">
                            <img src="Images/guessNo.jpg" alt="Game 1" className="img-fluid" />
                            <div className="card-content">
                                <h3 className="text-center">Guess the number</h3>
                                <p className="text-center">Challenge your mind and guess the secret number! Improve your
                                    problem-solving skills and logical thinking with this
                                    fun and interactive game</p>

                                <Link className="btn btn-primary btn-block" to="/games/guess-number">Play Now!</Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 col-sm-6 mb-4">
                        <div className="game-card">
                            <img src="/Images/memory.png" alt="Game 1" className="img-fluid" />

                            <div className="card-content">
                                <h3 className="text-center">Memory card game</h3>
                                <p className="text-center"> Match identical cards to test your memory and
                                    concentration skills in this fun and challenging game.</p>
                                <a href="/Games/Memory Card Games/Memory Cards Game [Demo 2]/memory.html" className="btn btn-primary btn-block">Play Now!</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 col-sm-6 mb-4">
                        <div className="game-card">
                            <img src="/Images/wordleImg.png" alt="Game 1" className="img-fluid" />
                            <div className="card-content">
                                <h3 className="text-center">Wordle Game</h3>
                                <p className="text-center">Guess the 5-letter word in 6 attempts or less.</p>
                                <a href="/Games/wordle/wordleHome.html" className="btn btn-primary btn-block">Play Now!</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    )
}

export default ChooseGames;