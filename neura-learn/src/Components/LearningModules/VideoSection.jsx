import './VideoSection.css'

function VideoSection(props) {
    return (
        <div className="video-section">
            <h3>{props.title}</h3>
            <p><strong>{props.desc}</strong></p>
            <iframe className="w-100 rounded"
            src={props.src} 
            title="YouTube video player" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen></iframe>
        </div>
    )
}

export default VideoSection;
