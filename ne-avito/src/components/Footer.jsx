import "./styles/Footer.css";
import { APP_NAME } from "../constants";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {currentYear} {APP_NAME}. Все права защищены.</p>
    </footer>
  );
}
