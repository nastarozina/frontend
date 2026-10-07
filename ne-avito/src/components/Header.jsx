import { NavLink } from "react-router-dom";
import "./styles/Header.css";
import { APP_NAME } from "../constants";
import { Link } from "react-router-dom";

const navLinks = [
    {to: '/addBanner', label: '+ Разместить объявление'},
    { to: '/about', label: 'О нас' },
];

export default function Header() {
    return (
      <header className="header">
        <Link to={`/`} className="logo">
          {APP_NAME}
        </Link>
        <nav className="nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
    );
  }
