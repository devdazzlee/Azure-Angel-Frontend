import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { clearSession, getAccessToken } from '../../utils/tokenUtils';
import LOGO from '../../assets/images/home/Founderport_Logo_Horizontal_Mariner_Main.svg';

interface NavItem {
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'How It Works', to: '/#how-it-works' },
  { label: "Who It's For", to: '/#who-its-for' },
  { label: 'Pricing', to: '/services' },
  { label: 'Learn More', to: '/learn-more' },
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

const navLinkClass =
  'font-medium text-[var(--landing-navy,#1e3a5f)] transition-colors hover:text-[var(--landing-navy-deep,#152a45)]';

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

      <nav className="hidden items-center space-x-7 lg:flex">
        {navItems.map((item) => (
          <motion.div key={item.to} whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
            <Link to={item.to} className={navLinkClass}>
              {item.label}
            </Link>
          </motion.div>
        ))}
        {isSessionActive && (
          <>
            <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
              <Link
                to="/ventures"
                className="rounded-md bg-[var(--landing-navy,#1e3a5f)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--landing-navy-deep,#152a45)]"
              >
                Your Business
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
              <Link
                to="/profile"
                className="rounded-md border border-[var(--landing-navy,#1e3a5f)]/20 px-4 py-2 text-sm font-semibold text-[var(--landing-navy,#1e3a5f)] transition hover:bg-[var(--landing-cream,#f4f1ea)]"
              >
                My Profile
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              onClick={handleAction}
              className="ml-1 rounded-md bg-[var(--landing-navy,#1e3a5f)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--landing-navy-deep,#152a45)]"
            >
              Logout
            </motion.button>
          </>
        )}
        {!isSessionActive && (
          <>
            <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
              <Link to="/login" className={navLinkClass}>
                Log in
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              onClick={handleAction}
              className="rounded-md bg-[var(--landing-navy,#1e3a5f)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--landing-navy-deep,#152a45)]"
            >
              Get Started
            </motion.button>
          </>
        )}
      </nav>

      <button
        onClick={toggleMenu}
        className="text-[var(--landing-navy,#1e3a5f)] transition-colors focus:outline-none lg:hidden"
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
      className="bg-white lg:hidden"
    >
      <div className="flex flex-col space-y-4 px-6 pb-6 pt-2">
        {navItems.map((i) => (
          <Link key={i.to} to={i.to} onClick={onClose} className={navLinkClass}>
            {i.label}
          </Link>
        ))}
        {isSessionActive && (
          <>
            <Link
              to="/ventures"
              onClick={onClose}
              className="flex items-center justify-center rounded-md bg-[var(--landing-navy,#1e3a5f)] px-4 py-2.5 font-semibold text-white shadow-sm"
            >
              Your Business
            </Link>
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center justify-center rounded-md border border-[var(--landing-navy,#1e3a5f)]/20 px-4 py-2.5 font-semibold text-[var(--landing-navy,#1e3a5f)]"
            >
              My Profile
            </Link>
            <button
              onClick={handleAction}
              className="w-full rounded-md bg-[var(--landing-navy,#1e3a5f)] px-4 py-2.5 font-medium text-white shadow-sm"
            >
              Logout
            </button>
          </>
        )}
        {!isSessionActive && (
          <>
            <Link to="/login" onClick={onClose} className={navLinkClass}>
              Log in
            </Link>
            <button
              onClick={handleAction}
              className="mt-1 w-full rounded-md bg-[var(--landing-navy,#1e3a5f)] px-4 py-2.5 font-medium text-white shadow-sm"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isOpen
          ? 'bg-white shadow-md'
          : scrolled
            ? 'bg-white/95 shadow-sm backdrop-blur-md'
            : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <NavBarContent toggleMenu={toggleMenu} isOpen={isOpen} isSessionActive={isSessionActive} />
      <MobileMenu isOpen={isOpen} onClose={closeMenu} />
    </header>
  );
};

export default Header;
