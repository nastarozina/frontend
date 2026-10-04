import "./styles/footer.css";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {currentYear} MyApp. Все права защищены.</p>
    </footer>
  );
}
