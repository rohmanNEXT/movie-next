import React from "react";

interface AvatarProps {
  userId: number | string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ userId, className = "" }) => {
  // Generate consistent color based on user ID
  const colors = [
    "#6366f1", // purple
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f43f5e", // rose
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#0ea5e9", // sky
    "#3b82f6", // blue
  ];

  const colorIndex = (parseInt(String(userId)) % 10);
  const bgColor = colors[colorIndex];
  const initial = String(userId).charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-center justify-center text-white font-semibold ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {initial}
    </div>
  );
};

export default Avatar;
