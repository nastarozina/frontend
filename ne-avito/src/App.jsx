import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Header />

      {/* main растягивается и занимает всё свободное место */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          {/* Маршрут для несуществующих страниц (404) */}
          <Route path="*" element={<h1>Страница не найдена (404)</h1>} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
