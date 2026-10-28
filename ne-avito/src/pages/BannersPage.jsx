import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./styles/BannersPage.css";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import { Link } from "react-router-dom";
import { BANNER_API } from "../constants";

export default function BannersPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  const [banners, setBanners] = useState([]);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.append("categoryId", categoryId);

    const queryString = params.toString();
    const url = queryString ? `${BANNER_API}?${queryString}` : BANNER_API;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          console.error(`HTTP ${response.status}: ${response.statusText}, ${response.text()}`);
          throw new Error("Ошибка при получении всех баннеров");
        }

        return response.json();
      })
      .then((data) => {
        setBanners(data);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, [categoryId]);

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
      {error && <p className="error">{error}</p>}
    </div>
  );
}
