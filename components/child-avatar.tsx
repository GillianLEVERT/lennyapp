// Affiche la photo de l'enfant si elle existe, sinon l'emoji avatar.
// Centralisé pour rester cohérent entre vue enfant et espace parent.

type ChildAvatarProps = {
  avatar: string;
  photoURL: string | null;
  name: string;
  size?: number;
  className?: string;
};

export function ChildAvatar({
  avatar,
  photoURL,
  name,
  size = 40,
  className = "",
}: ChildAvatarProps) {
  if (photoURL) {
    return (
      // dataURL local : next/image n'apporte rien ici.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.58 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[color:var(--shell)] leading-none ${className}`}
    >
      {avatar}
    </span>
  );
}
