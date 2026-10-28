import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import "./styles/BannerPage.css";
import { BANNER_API } from "../constants";

export default function BannerPage() {
    const { bannerId } = useParams();
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
    
    return (
      <div className="banner-page">
        <div className="path">
          <Link to={`/`}>Главная</Link>
          {banner.categories.map((category) => (
            <div>
            <span> {` > `} </span>
            <Link key={category.id} to={`/?categoryId=${category.id}`}>
              {category.name}
            </Link>
            </div>
          ))}
        </div>
        <div className="banner-block">
          <HorizontalPhotoGallery imageSize={500} photos={banner.images} />
          <div className="text-block">
            <h2> {banner.name} </h2>
            <h3> Описание </h3>
            <p> {banner.description} </p>
          </div>
        </div>
      </div>
    );
}