import { useEffect, useState } from "react";
import "./styles/BannersPage.css";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import { Link } from "react-router-dom";
import { BANNER_API } from "../constants";
import { useAuth } from "react-oidc-context";
import { MdDelete } from "react-icons/md";

export default function AccountBanners() {
  const [banners, setBanners] = useState([]);
  const [error, setError] = useState("");
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const currentUserId = auth.user?.profile?.sub;
  const token = auth.user?.access_token;
  useEffect(() => {
    const params = new URLSearchParams({
      ownerId: currentUserId,
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
  }, [isAuthenticated]);

  const handleDelete = async (bannerId) => {
    if (!window.confirm("Удалить объявление?")) return;

    try {
      const response = await fetch(`${BANNER_API}/${bannerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении объявления");
      }

      setBanners((prev) => prev.filter((banner) => banner.id !== bannerId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="banners-grid">
        {banners.length > 0
          ? banners.map((banner) => (
              <div className="banner" key={banner.id}>
                <button
                  type="button"
                  className="delete-banner-btn"
                  onClick={() => handleDelete(banner.id)}
                  title="Удалить объявление"
                >
                  <MdDelete size={20} />
                </button>

                <HorizontalPhotoGallery
                  imageSize={230}
                  photos={banner.images}
                />
                <Link to={`/banner/${banner.id}`} className="name_banner">
                  {banner.name}
                </Link>
              </div>
            ))
          : !error && <p className="empty-state">У вас пока нет объявлений</p>}
      </div>
    </>
  );
}
