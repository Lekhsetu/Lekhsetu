type AvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

/** Profile picture if the user has uploaded one, otherwise an initial-letter circle. */
export default function Avatar({ src, name, size = 40, className = "" }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className={`rounded-full flex items-center justify-center font-display font-bold flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: "rgba(245,166,35,0.1)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.25)", fontSize: size * 0.45 }}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
