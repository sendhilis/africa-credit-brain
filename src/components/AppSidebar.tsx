import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Link2,
  Brain,
  BarChart3,
  Settings,
  Shield,
  Code2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Presentation,
  FileSpreadsheet,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import africaOneLogo from "@/assets/AfricaOne.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/applications", icon: FileText, label: "Applications" },
  { to: "/integrations", icon: Link2, label: "Integrations" },
  { to: "/models", icon: Brain, label: "Models & Policies" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/fairness", icon: Shield, label: "Fairness & Performance" },
  { to: "/developers", icon: Code2, label: "Developers" },
  { to: "/showcase", icon: Presentation, label: "Showcase" },
  { to: "/ground-truth", icon: FileSpreadsheet, label: "Ground Truth" },
  { to: "/admin", icon: Settings, label: "Admin" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border w-[60px] bg-sidebar transition-all duration-300",
        collapsed ? "md:w-[68px]" : "md:w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-2 md:px-4">
        <img src={africaOneLogo} alt="AfricaOne" className={cn("h-10 w-10 shrink-0 object-contain", !collapsed && "md:h-14 md:w-auto")} />
        {!collapsed && (
          <div className="hidden flex-col md:flex">
            <span className="font-display text-lg font-bold text-foreground tracking-tight">AfricaOne</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Credit Brain</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-1 py-4 md:px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  aria-label={item.label}
                  className={cn(
                    "flex items-center justify-center gap-3 rounded-lg px-1 py-2.5 md:justify-start md:px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="hidden md:inline">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Sign out */}
      <div className="border-t border-sidebar-border px-1 py-3 md:px-3">
        {!collapsed && user && (
          <p className="mb-2 hidden truncate md:block px-3 text-xs text-muted-foreground">{user.email}</p>
        )}
        <button
          onClick={signOut}
          aria-label="Sign Out"
          className={cn(
            "flex w-full items-center justify-center gap-3 rounded-lg px-1 py-2.5 md:justify-start md:px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors",
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="hidden md:inline">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden h-12 items-center justify-center md:flex border-t border-sidebar-border text-muted-foreground hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};

export default AppSidebar;
