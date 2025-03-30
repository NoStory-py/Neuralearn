import { Link } from 'react-router-dom'
import React from 'react'
import './Navigation.css'

const Navigation = (SecondButton) => {
    return (

        <div className="modules-navigation">
            <Link to="/learning-modules"><button className="test-nav-button">Home</button></Link>
            <Link to={SecondButton.link}><button className="test-nav-button">{SecondButton.name}</button></Link>
        </div>

    )
}

export default Navigation
