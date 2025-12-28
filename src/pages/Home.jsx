import React from 'react';
import MinimalistHeader from '../components/MinimalistHeader';
import MinimalistHero from '../components/MinimalistHero';
import Services from '../components/Services';
import About from '../components/About';
import Contact from '../components/Contact';
import MinimalistFooter from '../components/MinimalistFooter';

const Home = ({ navigate }) => {
    return (
        <div>
            <MinimalistHeader navigate={navigate} />
            <MinimalistHero navigate={navigate} />
            <Services />
            <About />
            <Contact />
            <MinimalistFooter />
        </div>
    );
};

export default Home;
