function About() {
    return (
        <div className = "container my-4">
        <div className = "row featurette d-flex justify-content-center align-items-center" >
            <div className="col-md-7">
                <h2 className="featurette-heading">Our Mission - <span className="text-muted">Making the future of autistic children better</span></h2>
                <p className="lead">At NeuraLearn, our mission is to create a supportive and engaging learning environment tailored specifically for children with autism. 
                    We believe that every child has the potential to learn and grow, and our goal is to provide the tools and resources that make learning accessible, 
                    enjoyable, and meaningful. By integrating sensory-friendly activities, interactive games, and expert-designed educational content, we aim to empower 
                    children with autism to develop critical skills at their own pace, while fostering a love for learning. Our commitment is to create a space where every 
                    child can thrive, be understood, and be celebrated for their unique abilities.</p>
            </div>
            <div className="col-md-5">
                <img className="img-fluid" src="/Images/about-1.jpg" alt=""/>
                 
            </div>
        </div>
        <div className="row featurette d-flex justify-content-center align-items-center">
            <div className="col-md-7 order-md-2">
                <h2 className="featurette-heading">Our story <span className="text-muted">We started NeuraLearn in 2024</span></h2>
                <p className="lead">It all began with a simple question: How can we make learning more engaging and accessible for every child? As we delved into this question,
                    we discovered the unique challenges faced by autistic children in traditional learning environments. We saw a need for a tool that not only supports learning
                    but also embraces and celebrates the individual strengths and needs of each child.We reached out to parents, educators, and therapists to understand their experiences
                    and insights. Their stories painted a vivid picture of the hurdles and triumphs in the world of autism education.
                    We listened intently, gathering ideas and inspiration that would shape our vision.Armed with our newfound knowledge, we set out to design an app that goes beyond
                    traditional educational tools. Our goal was to create a platform that offers a personalized and inclusive learning experience. We integrated features that cater to
                    different learning styles, sensory preferences, and communication needs,
                    all while making learning fun and rewarding.</p>
            </div>
            <div className="col-md-5 order-md-1">
                <img className="img-fluid" src="/Images/empower.png" alt="" />

            </div>
        </div>
    </div>
    )
}

export default About;