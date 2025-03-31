import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const isAuthenticated = localStorage.getItem("token");



  return (
    <>
      <div className="index-page">

        <main className="main">


          <section id="hero" className="hero section dark-background">

            <img src="/Images/kid2.jpg" alt="" data-aos="fade-in" />

            <div className="container">
              <h2 data-aos="fade-up" data-aos-delay="100">Learning Today,<br />Leading Tomorrow</h2>
              <p data-aos="fade-up" data-aos-delay="200">A Learning website for children with autism spectrum disorder</p>
              <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
                <Link className="btn-get-started" to={isAuthenticated ? "/home" : "/login"}>
                  {isAuthenticated ? "Go to Home" : "Get Started"}
                </Link>
              </div>
            </div>

          </section>


          <section id="about" className="about section">

            <div className="container">

              <div className="row gy-4">

                <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-up" data-aos-delay="100">
                  <img src="/Images/autistic_kid.jpg" className="img-fluid" alt="" />
                </div>

                <div className="col-lg-6 order-2 order-lg-1 content" data-aos="fade-up" data-aos-delay="200">
                  <h3>Personalized Learning Paths</h3>
                  <p className="fst-italic">
                    At EmpowerEd, we understand that every child with autism is unique, with their own strengths, challenges, and learning style.
                    That's why we offer personalized learning paths tailored to each individual's needs.
                  </p>
                  <ul> <li><i className="bi bi-check-circle"></i> <span>Customized lesson plans based on your child's goals and objectives</span></li>
                    <li><i className="bi bi-check-circle"></i> <span>Interactive activities and exercises designed to engage and motivate</span>
                    </li> <li><i className="bi bi-check-circle"></i> <span>Regular progress tracking and adjustments to ensure your child stays on track</span></li>
                  </ul>
                  <a href="#" className="read-more"><span>Learn More About Our Personalized Approach</span><i className="bi bi-arrow-right"></i></a>
                </div>

              </div>

            </div>

          </section>

          <section id="why-us" className="section why-us">

            <div className="container">

              <div className="row gy-4">

                <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
                  <div className="why-box">
                    <h3>Why Choose EmpowerEd?</h3>
                    <p>
                      At EmpowerEd, we're dedicated to empowering children with autism to reach their full potential.
                      Our platform is designed to provide a supportive and engaging learning environment that fosters growth, confidence, and independence.
                    </p>
                    <div className="text-center">
                      <a href="#" className="more-btn"><span>Learn More</span> <i className="bi bi-chevron-right"></i></a>
                    </div>
                  </div>
                </div>

                <div className="col-lg-8 d-flex align-items-stretch">
                  <div className="row gy-4" data-aos="fade-up" data-aos-delay="200">

                    <div className="col-xl-4">
                      <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                        <i className="bi bi-heart"></i>
                        <h4>Passionate About Autism Education</h4>
                        <p>We're dedicated to providing high-quality educational resources that cater to the unique needs of children with autism.</p>
                      </div>
                    </div>

                    <div className="col-xl-4" data-aos="fade-up" data-aos-delay="300">
                      <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                        <i className="bi bi-people"></i>
                        <h4>Expertise You Can Trust</h4>
                        <p>Our team of experienced educators and autism specialists have developed a curriculum that's tailored to the needs of children with autism.</p>
                      </div>
                    </div>

                    <div className="col-xl-4" data-aos="fade-up" data-aos-delay="400">
                      <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                        <i className="bi bi-lock"></i>
                        <h4>Safe and Supportive Environment</h4>
                        <p>We're committed to providing a safe and supportive online environment that fosters growth, confidence, and independence for children with autism.</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </section>


          <section id="features" className="features section">

            <div className="container">

              <div className="row gy-4">

                <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="100">
                  <div className="features-item">
                    <i className="bi bi-book" style={{ color: '#ffbb2c' }}></i>
                    <h3><a href="" className="stretched-link">Personalized Learning Paths</a></h3>
                  </div>
                </div>

                <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="200">
                  <div className="features-item">
                    <i className="bi bi-video" style={{ color: '#5578ff' }}></i>
                    <h3><a href="" className="stretched-link">Interactive Video Lessons</a></h3>
                  </div>
                </div>

                <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="300">
                  <div className="features-item">
                    <i className="bi bi-award" style={{ color: '#e80368' }}></i>
                    <h3><a href="" className="stretched-link">Track Progress and Achievements</a></h3>
                  </div>
                </div>

                <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="400">
                  <div className="features-item">
                    <i className="bi bi-controller" style={{ color: '#e361ff' }}></i>
                    <h3><a href="" className="stretched-link">Interactive games</a></h3>
                  </div>
                </div>

                <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="500">
                  <div className="features-item">
                    <i className="bi bi-lock" style={{ color: '#47aeff' }}></i>
                    <h3><a href="" className="stretched-link">Secure and Accessible</a></h3>
                  </div>
                </div>

                <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="600">
                  <div className="features-item">
                    <i className="bi bi-chat-left" style={{ color: '#ffa76e' }}></i>
                    <h3><a href="" className="stretched-link">Customer support</a></h3>
                  </div>
                </div>

                <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="700">
                  <div className="features-item">
                    <i className="bi bi-x-diamond" style={{ color: '#11dbcf' }}></i>
                    <h3><a href="" className="stretched-link">Printable Activities</a></h3>
                  </div>
                </div>

                <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="800">
                  <div className="features-item">
                    <i className="bi bi-person-lines-fill" style={{ color: '#4233ff' }}></i>
                    <h3><a href="" className="stretched-link">Expert-Led Curriculum</a></h3>
                  </div>
                </div>

              </div>

            </div>

          </section>


          <section id="courses" className="courses section">

            <div className="container section-title" data-aos="fade-up">
              <h2>Courses</h2>
              <p>Our Courses</p>
            </div>

            <div className="container">

              <div className="row">

                <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
                  <div className="course-item">
                    <img src="/Images/interactive-game2.jpg" className="img-fluid" style={{ width: '425px', height: '250px', objectFit: 'cover' }} alt="..." />
                    <div className="course-content">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="category">Interactive games</p>
                      </div>

                      <p className="description">Interactive games for autistic kids can provide a fun, engaging way to develop social, communication, and cognitive skills. </p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
                  <div className="course-item">
                    <img src="/Images/educational-videos.jpg" className="img-fluid" alt="..." style={{ width: '425px', height: '250px', objectFit: 'cover' }} />
                    <div className="course-content">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="category">Learning Modules</p>
                      </div>
                      <p className="description">Learning modules for autistic kids are designed to provide structured, engaging, and individualized instruction. </p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
                  <div className="course-item">
                    <img src="/Images/printable.jpg" className="img-fluid" alt="..." style={{ width: '425px', height: '250px', objectFit: 'cover' }} />
                    <div className="course-content">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="category">Printable activities</p>
                      </div>
                      <p className="description">Printable activities for autistic kids can provide structured, visual learning tools that support communication, social skills, and sensory engagement. </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </section>

        </main>
      </div>
    </>
  )
}

export default LandingPage;

{/*
        <div id="preloader"></div>
        <!-- Main JS File -->
        <script src="assets/js/main.js"></script>
        <script src="assets/js/search.js"></script>
      */}
