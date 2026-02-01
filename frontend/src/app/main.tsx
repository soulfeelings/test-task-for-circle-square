import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Настройка MSW для разработки (только если включены моки)
async function enableMocking() {
  // Включаем моки только если явно указано в переменной окружения
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
    const { worker } = await import("@shared/mocks/browser");
    return worker.start({
      onUnhandledRequest: "bypass",
    });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
