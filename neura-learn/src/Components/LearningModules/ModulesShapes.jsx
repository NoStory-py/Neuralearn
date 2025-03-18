import { useState } from 'react'
import './ModulesShapes.css';
import VideoSection from './VideoSection';

function ModulesShapes() {
    const [visibleInfo, setVisibleInfo] = useState(null);

    const toggleInfo = (shape) => {
        setVisibleInfo(visibleInfo === shape ? null : shape);
        console.log(visibleInfo);
    };

    const shapes = [
        { name: "Circle", img: "/Images/circle.png", desc: "A circle is a round shape with no corners. All points on the edge are the same distance from the center.", fact: "The circumference of a circle is calculated as 2πr!" },
        { name: "Square", img: "/Images/square.png", desc: "A square has four equal sides and four right angles. All sides are the same length.", fact: "The area of a square is calculated as side²!" },
        { name: "Triangle", img: "/Images/triangle.png", desc: "A triangle has three sides and three corners. The sum of the angles in a triangle is always 180 degrees.", fact: "Triangles are the building blocks of geometry!" },
        { name: "Rectangle", img: "/Images/rectangle.png", desc: "A rectangle has four sides, with opposite sides being equal in length. It also has four right angles.", fact: "The area of a rectangle is calculated as length × width!" },
        { name: "Hexagon", img: "/Images/hexagon.png", desc: "A hexagon has six sides and six corners. The interior angles of a hexagon add up to 720 degrees.", fact: "Honeycombs are made up of hexagonal shapes!" },
    ];

    return (
        <div className="body-shape">

            <h1>Learn About Shapes</h1>

            <div className="shape-container">
                {shapes.map((shape) => (
                    <div key={shape.name} className="shape" onClick={() => toggleInfo(shape.name)}>
                        <h2>{shape.name}</h2>
                        <img src={shape.img} alt={shape.name} />
                        <p>{shape.desc}</p>
                        {visibleInfo === shape.name && <div className="info">Fun Fact: {shape.fact}</div>} 
                    </div>
                ))}
            </div>

            <div className="navigation">
                <button className="nav-button">Home</button>
                <button className="nav-button">Take Test</button>
            </div>

            <VideoSection
                title="Video Explanation"
                desc="Refer to this video for better understanding:"
                src="https://www.youtube.com/embed/MnOKD_I6vSU?start=9"
            />

        </div >
    )
}

export default ModulesShapes