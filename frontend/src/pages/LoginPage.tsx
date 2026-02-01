import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@shared/contexts/UserContext";
import { routes } from "@/app/routes";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const { user, login, isLoading } = useUser();
  const navigate = useNavigate();

  // Если пользователь уже авторизован, перенаправляем на страницу раундов
  useEffect(() => {
    if (user && !isLoading) {
      navigate(routes.rounds);
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Введите имя пользователя");
      return;
    }

    try {
      await login(username.trim());
      navigate(routes.rounds);
    } catch (error) {
      setError("Ошибка входа. Попробуйте еще раз.");
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>🦆 The Last of Guss</h1>
        <p>Введите ваше имя для входа в игру</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ваше имя"
            disabled={isLoading}
            className={styles.input}
          />

          {error && <div className="error">{error}</div>}

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className={styles.button}
          >
            {isLoading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
