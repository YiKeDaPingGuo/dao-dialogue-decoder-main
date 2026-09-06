import { User } from "lucide-react";

type UserAvatarProps = {
  name?: string;
  src?: string | null;
  size?: "sm" | "md";
};

const UserAvatar = ({ name, src, size = "sm" }: UserAvatarProps) => {
  const dimension = size === "md" ? "h-12 w-12" : "h-9 w-9";
  if (src) {
    return <img src={src} alt={name || "avatar"} className={`${dimension} rounded-full border border-border object-cover`} />;
  }
  return (
    <div className={`${dimension} flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary`}>
      <User className={size === "md" ? "h-6 w-6 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
    </div>
  );
};

export default UserAvatar;
