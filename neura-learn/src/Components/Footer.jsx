import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    return (
        <footer className="kids-footer">
            <div className="container">
                <div className="row">
                    <div className="col-md-4 footer-section">
                        <h3 className="footer-title">🎠 Let's Stay Connected! 🌈</h3>
                        <div className="footer-contact">
                            <p>📧 Email: friend@neuralearn.com</p>
                            <p>📞 Call: 1-800-LEARN-FUN</p>
                        </div>
                    </div>
                    
                    <div className="col-md-4 footer-section">
                        <h3 className="footer-title">🚀 Quick Links</h3>
                        <ul className="footer-links">
                            <li><Link to="/about" className="footer-link">✨ About Us</Link></li>
                            <li><Link to="/contact" className="footer-link">📮 Contact</Link></li>
                        </ul>
                    </div>
                    
                    <div className="col-md-4 footer-section">
                        <h3 className="footer-title">🌟 Follow Us on </h3>
                        <div className="social-icons">
                            <a href="#" className="social-icon">🅾</a>
                            <a href="#" className="social-icon">ⓕ</a>
                            <a href="#" className="social-icon">𝕏</a>
                        </div>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p className="copyright">
                        🎨 Made with ❤️ for our amazing learners © 2024 
                        <span className="bounce">🌟</span>
                    </p>
                </div>
            </div>
            
            <div className="floating-shapes">
                <div className="shape circle"></div>
                <div className="shape triangle"></div>
                <div className="shape star"></div>
            </div>
        </footer>
    )
}

export default Footer;