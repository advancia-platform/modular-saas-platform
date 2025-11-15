"use client";

interface RoleBadgeProps {
  role: "USER" | "STAFF" | "ADMIN";
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const styles = {
    USER: {
      backgroundColor: "#4caf50",
      color: "white",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: "500",
      display: "inline-flex",
      alignItems: "center",
    },
    ADMIN: {
      backgroundColor: "#2196f3",
      color: "white",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: "500",
      display: "inline-flex",
      alignItems: "center",
    },
    STAFF: {
      backgroundColor: "#ff9800",
      color: "white",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: "500",
      display: "inline-flex",
      alignItems: "center",
    },
  };

  return <span style={styles[role]}>{role}</span>;
}
