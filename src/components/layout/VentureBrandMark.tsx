import { Link } from 'react-router-dom';
import LOGO from '../../assets/images/home/Founderport_Logo_Horizontal_Mariner_Main.svg';

interface VentureBrandMarkProps {
  className?: string;
}

export default function VentureBrandMark({ className = '' }: VentureBrandMarkProps) {
  return (
    <Link
      to="/"
      className={`flex shrink-0 items-center rounded-sm transition-opacity hover:opacity-80 ${className}`}
      aria-label="Founderport home"
    >
      <img
        src={LOGO}
        alt="Founderport"
        className="h-[4.5rem] w-auto lg:h-[5.5rem]"
      />
    </Link>
  );
}
