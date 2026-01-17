import React from 'react';
import MinimalistHeader from '../components/MinimalistHeader';
import MinimalistHero from '../components/MinimalistHero';
import Services from '../components/Services';
import About from '../components/About';
import Contact from '../components/Contact';
import MinimalistFooter from '../components/MinimalistFooter';

const Home = () => {
    return (
        <div>
            <MinimalistHeader />
            <MinimalistHero />
            <Services />
            <About />
            <Contact />
            <MinimalistFooter />
        </div>
    );
};

export default Home;
