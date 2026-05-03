import { Link, Route, Routes } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { AdminPage } from "@/pages/AdminPage";
import { AuthPage } from "@/pages/AuthPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { MarketplacePage } from "@/pages/MarketplacePage";
import { useAuth } from "@/auth/AuthContext";

function App() {
  const { user } = useAuth();
  return (
    <div>
      <div className="noise" />
      <div className="grid-bg" />
      <div className="shell">
        <TopBar />
        {!user && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Link to="/auth" className="btn btn-primary">
              Sign in / Register
            </Link>
          </div>
        )}
        <div style={{ marginTop: 18 }}>
          <Routes>
            <Route path="/" element={<MarketplacePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
