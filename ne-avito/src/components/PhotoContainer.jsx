import "./styles/PhotoContainer.css";

export default function PhotoContainer({ photo, className }) {
  const photoURL = `http://localhost:9000/banner/${photo.objectKey}`;

  return (
    <div className="photo-container">
      <img className={className} src={photoURL} alt={photo.name} />
    </div>
  );
}
