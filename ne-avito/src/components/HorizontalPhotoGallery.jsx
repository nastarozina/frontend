import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import PhotoContainer from "./PhotoContainer";
import "./styles/HorizontalPhotoGallery.css";

export default function HorizontalPhotoGallery({ photos: galleryPhotos, className }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    containScroll: "trimSnaps",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  return (
    <div className="horizontal-photo-gallery">
      {!galleryPhotos || galleryPhotos.length === 0 ? (
        <p>Нет фотографий</p>
      ) : (
        <div className="gallery-wrapper">
          <div className={className} ref={emblaRef}>
            <div className="embla__container">
              {galleryPhotos.map((photo) => (
                <div className="embla__slide" key={photo.id}>
                  <PhotoContainer className={className} photo={photo} />
                </div>
              ))}
            </div>

            {scrollSnaps.length > 1 && (
              <div className="embla__dots">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    className={`embla__dot ${index === selectedIndex ? "embla__dot--selected" : ""}`}
                    onClick={() => scrollTo(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
