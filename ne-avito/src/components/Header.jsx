import { NavLink } from 'react-router-dom';
import './styles/header.css';

const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/about', label: 'О нас' },
  ];

export default function Header() {
    return (
      <header className="header">
        <div className="logo">MyApp</div>
        <nav className="nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to} // key обязателен при рендере списков
              to={link.to}
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
    );
  }
