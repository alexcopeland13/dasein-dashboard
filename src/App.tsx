
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardNav from "./components/nav/DashboardNav";
import Index from "./pages/Index";
import InvestorsPage from "./pages/Investors";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <DashboardNav />
        <main className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/investors" element={<InvestorsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
