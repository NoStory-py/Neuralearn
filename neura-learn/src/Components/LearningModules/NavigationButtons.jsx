import { Link } from 'react-router-dom'
import React from 'react'
import './NavigationButtons.css'

const NavigationButtons = ({buttons = [], includeModules = true}) => {
    return (

        <div className="modules-navigation">
            {includeModules && (
                <Link to="/learning-modules">
                    <button className="test-nav-button">Modules</button>
                </Link>
            )}
            {buttons.map((button, index) => (
                button.action ? (
                    <button key={index} className="test-nav-action-button" onClick={button.action}>{button.name}</button>
                ) :
                <Link key={index} to={button.link}>
                    <button className="test-nav-button">{button.name}</button>
                </Link>
            ))}
        </div>

    )
}

export default NavigationButtons;
