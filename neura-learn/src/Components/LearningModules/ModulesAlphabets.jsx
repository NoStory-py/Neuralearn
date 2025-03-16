import React from 'react'
import "./ModulesAlphabets.css"
import VideoSection from './VideoSection.jsx'

const ModulesAlphabets = () => {
    return (
        <div className="body-alphabets">

            <h1>Learn Alphabets A to Z</h1>

            <div className="alphabet-cards">
                <AlphabetsCard letter="A" word="Apple" />
                <AlphabetsCard letter="B" word="Ball" />
                <AlphabetsCard letter="C" word="Cat" />
                <AlphabetsCard letter="D" word="Dog" />
                <AlphabetsCard letter="E" word="Elephant" />
                <AlphabetsCard letter="F" word="Fish" />
                <AlphabetsCard letter="G" word="Goat" />
                <AlphabetsCard letter="H" word="Hat" />
                <AlphabetsCard letter="I" word="Ice cream" />
                <AlphabetsCard letter="J" word="Jelly" />
                <AlphabetsCard letter="K" word="Kite" />
                <AlphabetsCard letter="L" word="Lion" />
                <AlphabetsCard letter="M" word="Monkey" />
                <AlphabetsCard letter="N" word="Nest" />
                <AlphabetsCard letter="O" word="Orange" />
                <AlphabetsCard letter="P" word="Parrot" />
                <AlphabetsCard letter="Q" word="Queen" />
                <AlphabetsCard letter="R" word="Rabbit" />
                <AlphabetsCard letter="S" word="Sun" />
                <AlphabetsCard letter="T" word="Tiger" />
                <AlphabetsCard letter="U" word="Umbrella" />
                <AlphabetsCard letter="V" word="Van" />
                <AlphabetsCard letter="W" word="Whale" />
                <AlphabetsCard letter="X" word="Xylophone" />
                <AlphabetsCard letter="Y" word="Yak" />
                <AlphabetsCard letter="Z" word="Zebra" />
            </div>

            <div className="navigation">
                <button className="nav-button" onclick="location.href='1.html'">Home</button>
                <button className="nav-button" onclick="location.href='alphatest.html'">Test</button>
            </div>

            <VideoSection
            title = "Video Explaination"
            desc = "Refer to this video for better understanding:"
            src="https://www.youtube.com/embed/hq3yfQnllfQ?si=x6gqUyw_rbeg8FTK&amp;start=9"
            />

        </div>
    )
}

export default ModulesAlphabets;

function AlphabetsCard(props) {

    return (
        <>
            <div className="alphabet-card">
                <div className="hover-effect"></div>
                <div className="letter">{props.letter}</div>
                <div className="word">{props.word}</div>

            </div>
        </>

    )
}