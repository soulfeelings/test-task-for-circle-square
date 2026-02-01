import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider } from "@shared/contexts/UserContext";
import { routes } from "@/app/routes";
import LoginPage from "@pages/LoginPage";
import RoundsPage from "@pages/RoundsPage";
import GamePage from "@pages/GamePage";
import StatsPage from "@pages/StatsPage";
import ProtectedRoute from "@shared/components/ProtectedRoute";
import "@shared/styles/global.scss";

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app">
          <div className="main-content">
            <Routes>
              <Route path={routes.login} element={<LoginPage />} />
              <Route
                path={routes.rounds}
                element={
                  <ProtectedRoute>
                    <RoundsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/round/:id"
                element={
                  <ProtectedRoute>
                    <GamePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/round/:id/stats"
                element={
                  <ProtectedRoute>
                    <StatsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={<Navigate to={routes.login} replace />}
              />
            </Routes>
          </div>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
