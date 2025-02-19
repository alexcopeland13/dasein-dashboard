
import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Users,
  DollarSign,
  Settings,
  LineChart,
} from "lucide-react";

const DashboardNav = () => {
  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 p-4 space-y-6 animate-fade-in">
      <div className="flex items-center space-x-2 px-2 py-4">
        <DollarSign className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-semibold">Fund Dashboard</h1>
      </div>
      
      <nav className="space-y-1">
        <NavItem icon={<BarChart3 />} label="Overview" to="/" active />
        <NavItem icon={<Users />} label="Investors" to="/investors" />
        <NavItem icon={<LineChart />} label="Performance" to="/performance" />
        <NavItem icon={<Settings />} label="Settings" to="/settings" />
      </nav>
    </div>
  );
};

const NavItem = ({ 
  icon, 
  label, 
  to, 
  active 
}: { 
  icon: React.ReactNode; 
  label: string; 
  to: string; 
  active?: boolean;
}) => {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? "bg-primary text-primary-foreground" 
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export default DashboardNav;
