import { useEffect, useState } from "react";
import "./styles/BannersPage.css";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:8000";

export default function BannersPage() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        setBanners(data);
      });
  }, []);

  return (
    <div className="banners-container">
      {banners.map((banner) => (
        <div className="banner" key={banner.id}>
          <HorizontalPhotoGallery imageSize={230} photos={banner.images} />
          <Link to={`/banner/${banner.id}`} className="name_banner">
            {banner.name}
          </Link>
        </div>
      ))}
    </div>
  );
}
