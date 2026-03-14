import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { clearSession } from '../../utils/tokenUtils';
import LOGO from '../../assets/images/home/Founderport_Logo_Horizontal_Mariner_Main.svg';

interface NavItem { label: string; to: string; }
const navItems: NavItem[] = [
  { label: 'Who We Are', to: '/about' },
  { label: 'Services', to: '/services' },
];

const headerVariants: Variants = {
  hidden: { y: -50, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const isSessionActive = Boolean(localStorage.getItem('sb_access_token'));

const handleAction = () => {
  if (isSessionActive) {
    clearSession();
    window.location.href = '/';
  } else {
    window.location.href = '/login';
  }
};

interface NavBarContentProps { scrolled: boolean; toggleMenu: () => void; isOpen: boolean; isSessionActive: boolean; }
const NavBarContent: React.FC<NavBarContentProps> = ({ scrolled, toggleMenu, isOpen, isSessionActive }) => {

  return (
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      {/* Logo */}
      <Link to="/" className="flex items-center">
        <img
          src={LOGO}
          alt="Founderport Logo"
          className={`transition-all duration-300 ${scrolled ? 'h-14' : 'h-14'} w-auto`}
        />
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center space-x-8">
        {navItems.map(item => (
          <motion.div key={item.to} whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
            <Link to={item.to} className="font-medium text-black hover:text-teal-600 transition-colors">
              {item.label}
            </Link>
          </motion.div>
        ))}
        {isSessionActive && (
          <>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Link
                to="/ventures"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                Your Business
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Link
                to="/profile"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={toggleMenu}
              className="ml-2 bg-teal-600 text-white px-5 py-2 rounded-full font-semibold shadow-lg transition-all"
            >
              Logout
            </motion.button>
          </>
        )}
        {!isSessionActive && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={toggleMenu}
            className="bg-teal-600 text-white px-5 py-2 rounded-full font-semibold shadow-lg transition-all"
          >
            Get Started
          </motion.button>
        )}
      </nav>

      {/* Mobile Toggle */}
      <button onClick={toggleMenu} className="md:hidden text-black focus:outline-none transition-colors" aria-label="Toggle menu">
        {isOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
      </button>
    </div>
  );
};

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(prev => !prev);
    handleAction();
  };


  return (
    <>
      {/* Top Header */}
      <AnimatePresence>
        {!scrolled && (
          <motion.header
            key="top"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={headerVariants}
            transition={{ duration: 0.3 }}
            className="absolute inset-x-0 top-0 z-40 bg-transparent"
          >
            <NavBarContent
              scrolled={false}
              toggleMenu={toggleMenu}
              isOpen={isOpen}
              isSessionActive={isSessionActive}
            />
            {/* Mobile Menu */}
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden bg-transparent"
              >
                <div className="px-6 pt-2 pb-6 flex flex-col space-y-4">
                  {navItems.map(i => (
                    <Link key={i.to} to={i.to} onClick={() => setIsOpen(false)} className="text-black font-medium hover:text-gray-600 transition-colors">
                      {i.label}
                    </Link>
                  ))}
                  {isSessionActive && (
                    <>
                      <Link
                        to="/ventures"
                        onClick={() => setIsOpen(false)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-full font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        Your Business
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-full font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                      <button onClick={handleAction} className="bg-teal-600 text-white px-4 py-2 rounded-full font-medium shadow-sm transition-all w-full">
                        Logout
                      </button>
                    </>
                  )}
                  {!isSessionActive && (
                    <button onClick={handleAction} className="mt-2 bg-teal-600 text-white px-4 py-2 rounded-full font-medium shadow-sm transition-all w-full">
                      Get Started
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.header>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <AnimatePresence>
        {scrolled && (
          <motion.header
            key="sticky"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={headerVariants}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 top-0 z-50 bg-white bg-opacity-90 backdrop-blur-md shadow-md"
          >
            <NavBarContent scrolled={true} toggleMenu={toggleMenu} isOpen={isOpen} isSessionActive={isSessionActive} />
            {/* Mobile Menu */}
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden bg-white bg-opacity-90 backdrop-blur-md shadow-inner"
              >
                <div className="px-6 pt-2 pb-6 flex flex-col space-y-4">
                  {navItems.map(i => (
                    <Link key={i.to} to={i.to} onClick={() => setIsOpen(false)} className="text-black font-medium hover:text-teal-600 transition-colors">
                      {i.label}
                    </Link>
                  ))}
                  {isSessionActive && (
                    <>
                      <Link
                        to="/ventures"
                        onClick={() => setIsOpen(false)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-full font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        Your Business
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-full font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                      <button onClick={handleAction} className="bg-teal-600 text-white px-4 py-2 rounded-full font-medium shadow-sm transition-all w-full">
                        Logout
                      </button>
                    </>
                  )}
                  {!isSessionActive && (
                    <button onClick={handleAction} className="mt-2 bg-teal-600 text-white px-4 py-2 rounded-full font-medium shadow-sm transition-all w-full">
                      Get Started
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.header>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
