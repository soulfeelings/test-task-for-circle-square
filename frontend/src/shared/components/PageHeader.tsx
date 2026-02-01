import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@shared/contexts/UserContext";
import styles from "./PageHeader.module.scss";

interface PageHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
  children?: ReactNode;
}

export default function PageHeader({
  title = "🦆 The Last of Guss",
  showBackButton = false,
  backTo = "/rounds",
  children,
}: PageHeaderProps) {
  const { user, logout } = useUser();

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.userInfo}>
        <span>Игрок: {user?.username}</span>
        <span className={styles.role}>({user?.role})</span>
        {showBackButton ? (
          <Link to={backTo} className={styles.backButton}>
            ← Назад
          </Link>
        ) : (
          <button onClick={logout} className={styles.logoutButton}>
            Выйти
          </button>
        )}
        {children}
      </div>
    </header>
  );
}
