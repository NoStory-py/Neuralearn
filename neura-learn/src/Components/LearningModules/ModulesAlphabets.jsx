import React, { useEffect, useState } from 'react'
import "./ModulesAlphabets.css"
import VideoSection from './VideoSection.jsx'
import NavigationButtons from './NavigationButtons.jsx'

const ModulesAlphabets = () => {
  return (
    <div className="body-alphabets">
      <h1>Learn Alphabets A to Z</h1>

      <div className="alphabet-cards">
        {[
          ["A","Apple"], ["B","Ball"], ["C","Cat"], ["D","Dog"], ["E","Elephant"],
          ["F","Fish"], ["G","Goat"], ["H","Hat"], ["I","Ice cream"], ["J","Jelly"],
          ["K","Kite"], ["L","Lion"], ["M","Monkey"], ["N","Nest"], ["O","Orange"],
          ["P","Parrot"], ["Q","Queen"], ["R","Rabbit"], ["S","Sun"], ["T","Tiger"],
          ["U","Umbrella"], ["V","Van"], ["W","Whale"], ["X","Xylophone"], ["Y","Yak"],
          ["Z","Zebra"]
        ].map(([letter, word]) => (
          <AlphabetsCard key={letter} letter={letter} word={word} />
        ))}
      </div>

      <NavigationButtons
        buttons={[{ name: "Start Test", link: "/learning-modules/alphabets/test" }]}
      />

      <VideoSection
        title="Video Explanation"
        desc="Refer to this video for better understanding:"
        src="https://www.youtube.com/embed/hq3yfQnllfQ?si=x6gqUyw_rbeg8FTK&amp;start=9"
      />
    </div>
  )
}

export default ModulesAlphabets;


function AlphabetsCard({ letter, word }) {
  const [voice, setVoice] = useState(null)

  useEffect(() => {
    const loadVoices = () => {
      const all = speechSynthesis.getVoices()
      // find any voice whose name includes "female"
      let female = all.find(v => v.name.toLowerCase().includes("female"))
      if (!female) {
        // fallback: use first English voice
        female = all.find(v => v.lang.startsWith("en")) || all[0]
      }
      setVoice(female)
    }

    // Chrome/Firefox fire this event once voices are loaded
    speechSynthesis.onvoiceschanged = loadVoices
    // try immediate load too (in case voices are already available)
    loadVoices()

    // cleanup
    return () => { speechSynthesis.onvoiceschanged = null }
  }, [])

  const speak = () => {
    if (!voice) return // not ready yet
    const utterance = new SpeechSynthesisUtterance(`${letter} for ${word}`)
    utterance.voice = voice
    utterance.pitch = 1.3
    utterance.rate = 0.95

    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }

  return (
    <div className="alphabet-card" onMouseEnter={speak}>
      <div className="hover-effect"></div>
      <div className="letter">{letter}</div>
      <div className="word">{word}</div>
    </div>
  )
}
