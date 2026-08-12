import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { clearSession, getAccessToken } from '../../utils/tokenUtils';
import LOGO from '../../assets/images/home/Founderport_Logo_Horizontal_Mariner_Main.svg';

interface NavItem { label: string; to: string; }
const navItems: NavItem[] = [
  { label: 'Who We Are', to: '/about' },
  { label: 'Services', to: '/services' },
];

const isSessionActive = Boolean(getAccessToken());

const handleAction = () => {
  if (isSessionActive) {
    clearSession();
    window.location.href = '/';
  } else {
    window.location.href = '/login';
  }
};

interface NavBarContentProps {
  toggleMenu: () => void;
  isOpen: boolean;
  isSessionActive: boolean;
}

const NavBarContent: React.FC<NavBarContentProps> = ({ toggleMenu, isOpen, isSessionActive }) => {
  return (
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
      <Link to="/" className="flex h-full shrink-0 items-center">
        <img
          src={LOGO}
          alt="Founderport Logo"
          className="h-[4.75rem] w-auto transition-all duration-300"
        />
      </Link>

      <nav className="hidden items-center space-x-8 md:flex">
        {navItems.map(item => (
          <motion.div key={item.to} whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
            <Link to={item.to} className="font-medium text-black transition-colors hover:text-teal-600">
              {item.label}
            </Link>
          </motion.div>
        ))}
        {isSessionActive && (
          <>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Link
                to="/ventures"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2 font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg"
              >
                Your Business
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2 font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleAction}
              className="ml-2 rounded-full bg-teal-600 px-5 py-2 font-semibold text-white shadow-lg transition-all"
            >
              Logout
            </motion.button>
          </>
        )}
        {!isSessionActive && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleAction}
            className="rounded-full bg-teal-600 px-5 py-2 font-semibold text-white shadow-lg transition-all"
          >
            Get Started
          </motion.button>
        )}
      </nav>

      <button
        onClick={toggleMenu}
        className="text-black transition-colors focus:outline-none md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
      </button>
    </div>
  );
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="md:hidden bg-white"
    >
      <div className="flex flex-col space-y-4 px-6 pb-6 pt-2">
        {navItems.map(i => (
          <Link
            key={i.to}
            to={i.to}
            onClick={onClose}
            className="font-medium text-black transition-colors hover:text-teal-600"
          >
            {i.label}
          </Link>
        ))}
        {isSessionActive && (
          <>
            <Link
              to="/ventures"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-600"
            >
              Your Business
            </Link>
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>
            <button
              onClick={handleAction}
              className="w-full rounded-full bg-teal-600 px-4 py-2 font-medium text-white shadow-sm transition-all"
            >
              Logout
            </button>
          </>
        )}
        {!isSessionActive && (
          <button
            onClick={handleAction}
            className="mt-2 w-full rounded-full bg-teal-600 px-4 py-2 font-medium text-white shadow-sm transition-all"
          >
            Get Started
          </button>
        )}
      </div>
    </motion.div>
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

  const toggleMenu = () => setIsOpen(prev => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isOpen
          ? 'bg-white shadow-md'
          : scrolled
          ? 'bg-white/90 shadow-md backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <NavBarContent toggleMenu={toggleMenu} isOpen={isOpen} isSessionActive={isSessionActive} />
      <MobileMenu isOpen={isOpen} onClose={closeMenu} />
    </header>
  );
};

export default Header;
