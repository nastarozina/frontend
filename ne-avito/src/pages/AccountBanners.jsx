import { useEffect, useState } from "react";
import "./styles/BannersPage.css";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import { Link } from "react-router-dom";
import { BANNER_API } from "../constants";
import { useAuth } from "react-oidc-context";

export default function AccountBanners() {
  const [banners, setBanners] = useState([]);
  const [error, setError] = useState("");
  const auth = useAuth();
  useEffect(() => {
    const params = new URLSearchParams({
      ownerId: auth.user.profile.sub,
    });
    
    fetch(`${BANNER_API}?${params.toString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка при получении всех баннеров");
        }

        return response.json();
      })
      .then((data) => {
        setBanners(data);
      })
      .catch((err) => {
        setError(err.message);
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
      {error && <p className="error">{error}</p>}
    </div>
  );
}
