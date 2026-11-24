import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import "./styles/BannerPage.css";
import { BANNER_API } from "../constants";
import { useAuth } from "react-oidc-context";

export default function BannerPage() {
    const auth = useAuth();
    const isAuthenticated = auth.isAuthenticated;

    const { bannerId } = useParams();
    const navigate = useNavigate();
    const [banner, setBanner] = useState(null);

    useEffect(() => {
      fetch(`${BANNER_API}/${bannerId}`)
        .then((response) => response.json())
        .then((data) => {
          setBanner(data);
        });
    }, [bannerId]);

    if (!banner) {
        return <div>Loading...</div>;
    }

    // Функция для перехода в чат
    const handleOpenChat = () => {
        const params = new URLSearchParams();
        params.set("userId", banner.ownerId);
        navigate(`/chats?${params.toString()}`);
    };

    const handleOpenEditPage = () => {
        navigate(`/editBanner/${banner.id}`);
    };

    return (
      <div className="banner-page">
        <div className="path">
          <Link to={`/`}>Главная</Link>
          {banner.categories.map((category) => (
            <div key={category.id}>
              <span> {` > `} </span>
              <Link to={`/?categoryId=${category.id}`}>{category.name}</Link>
            </div>
          ))}
        </div>
        <div className="banner-block">
          <HorizontalPhotoGallery imageSize={500} photos={banner.images} />
          <div className="text-block">
            <h2>{banner.name}</h2>

            {isAuthenticated &&
              (auth.user?.profile?.sub !== banner.ownerId ? (
                <button className="btn-style-1" onClick={handleOpenChat}>
                  Написать пользователю
                </button>
              ) : (
                <button className="btn-style-1" onClick={handleOpenEditPage}>
                  Редактировать объявление
                </button>
              ))}

            <h3>Описание</h3>
            <p>{banner.description}</p>
          </div>
        </div>
      </div>
    );
}