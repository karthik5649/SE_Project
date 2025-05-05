import React from "react";
import { motion } from "framer-motion";
import "./HomePage.css";

const HomePage = () => {
  return (
    <div className="homepage">
      <motion.h1 
        className="title"
        initial={{ opacity: 0, y: -50 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1 }}
      >
        Welcome to <span className="highlight">Student Hub</span>
      </motion.h1>

      <motion.p 
        className="description"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1, delay: 0.5 }}
      >
        Explore resources, tools, and opportunities to enhance your learning experience.
      </motion.p>

      <motion.div 
        className="button-container"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1, delay: 1 }}
      >
        <motion.button 
          className="btn join-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Join Now
        </motion.button>

        <motion.button 
          className="btn contact-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Contact Us
        </motion.button>
      </motion.div>
    </div>
  );
};

export default HomePage;
