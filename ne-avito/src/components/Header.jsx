import { NavLink } from "react-router-dom";
import "./styles/Header.css";
import { APP_NAME } from "../constants";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const navLinks = [
  { to: "/addBanner", label: "+ Разместить объявление" }
];

export default function Header() {
  const auth = useAuth();
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
          {auth.isAuthenticated ? (
            <div>
              {auth.user?.profile.name}
              <button onClick={() => void auth.signoutSilent()}>Log out</button>
            </div>
          ) : (
            <Link onClick={() => void auth.signinRedirect()}>Войти</Link>
          )}
        </nav>
      </header>
    );
  }
