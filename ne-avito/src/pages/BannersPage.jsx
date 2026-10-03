import { useEffect, useState } from "react";
import "./styles/BannersPage.css";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";

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
          <HorizontalPhotoGallery photos={banner.images} />
          <p className="name_banner">{banner.name}</p>
        </div>
      ))}
    </div>
  );
}