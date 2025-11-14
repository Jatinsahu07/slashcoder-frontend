import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/mylogo.jpeg";

/** Inline SVG icons (consistent, lightweight) */
const Icon = {
  menu: (c = "currentColor") => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  x: (c = "currentColor") => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6l-12 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  dash: (c = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v11h-7zM4 13h7v8H4z" stroke={c} strokeWidth="1.6" />
    </svg>
  ),
  swords: (c = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 3l4 4-7 7-2-2 5-5-2-2 2-2zM17 3l4 4-7 7-2-2 5-5-2-2 2-2z" stroke={c} strokeWidth="1.6" />
      <path d="M3 21l6-6M21 21l-6-6" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  trophy: (c = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v3a6 6 0 01-12 0V4z" stroke={c} strokeWidth="1.6" />
      <path d="M8 20h8M10 20v-3h4v3" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M18 7h1a3 3 0 003-3H18M6 7H5a3 3 0 01-3-3h4" stroke={c} strokeWidth="1.6" />
    </svg>
  ),
  team: (c = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M8 13a4 4 0 100-8 4 4 0 000 8zM16 11a3 3 0 100-6 3 3 0 000 6z" stroke={c} strokeWidth="1.6" />
      <path d="M2 20c0-3.314 2.686-6 6-6h0M14 20c0-2.761 2.239-5 5-5h1" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  user: (c = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" stroke={c} strokeWidth="1.6" />
      <path d="M4 20a8 8 0 0116 0" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  gear: (c = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" stroke={c} strokeWidth="1.6" />
      <path
        d="M19.4 15a7.96 7.96 0 000-6l2.1-1.2-2-3.5-2.4.7A8 8 0 0012 4l-.1-2.5H8.1L8 4a8 8 0 00-5.1 1.8l-2.4-.7-2 3.5L2.6 9a8 8 0 000 6l-2.1 1.2 2 3.5 2.4-.7A8 8 0 0012 20l.1 2.5h3.8L16 20a8 8 0 005.1-1.8l2.4.7 2-3.5L19.4 15z"
        stroke={c}
        strokeWidth="1.6"
        opacity=".35"
      />
    </svg>
  ),
  logout: (c = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10 7V5a2 2 0 012-2h7v18h-7a2 2 0 01-2-2v-2" stroke={c} strokeWidth="1.6" />
      <path d="M15 12H3m0 0l3-3M3 12l3 3" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  chat: (c = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16v12H5.17L4 18.17V4z" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  slash: (c = "currentColor") => (
    <span className="text-lg font-extrabold leading-none" style={{ color: c }}>＼</span>
  ),
};

function NavItem({ to, icon, label, onClick, collapsed }) {
  const [hovered, setHovered] = useState(false);

  const activeClass = ({ isActive }) =>
    [
      "group flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm relative",
      isActive
        ? "bg-[#ff4655] text-white shadow-[0_0_12px_rgba(255,70,85,.45)]"
        : "text-white/70 hover:text-white hover:bg-white/10",
    ].join(" ");

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NavLink to={to} className={activeClass} onClick={onClick}>
        <span className="grid place-items-center w-5 h-5">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </NavLink>

      {collapsed && hovered && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </div>
  );
}

export default function NavShell({ children, user }) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("sc_sidebar_collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("sc_sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  const onLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    localStorage.removeItem("match_active");
    localStorage.removeItem("active_match");
    window.location.href = "/login";
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /** 🧠 Smart Find Match handler — redirects to MatchPage if match is active */
  const handleFindMatch = () => {
    const matchActive = localStorage.getItem("match_active") === "true";
    if (matchActive) {
      navigate("/matchpage");
    } else {
      navigate("/match");
    }
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 h-[56px] border-b border-white/10">
        <Link to="/dashboard" className="text-white font-extrabold tracking-wide">
          {collapsed && !isMobile ? "SC" : "Slashcoder"}
        </Link>
        {!isMobile && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="ml-auto p-1.5 rounded-md hover:bg-white/10 text-white/70"
          >
            {Icon.menu()}
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <NavItem to="/dashboard" icon={Icon.dash()} label="Dashboard" collapsed={collapsed} />
        <NavItem
          to="/match"
          icon={Icon.swords()}
          label="Find Match"
          collapsed={collapsed}
          onClick={(e) => {
            e.preventDefault();
            handleFindMatch();
          }}
        />
        <NavItem to="/leaderboard" icon={Icon.trophy()} label="Leaderboard" collapsed={collapsed} />
        <NavItem to="/teams" icon={Icon.team()} label="Teams" collapsed={collapsed} />
        <NavItem to="/slashai" icon={Icon.slash()} label="Slash AI" collapsed={collapsed} />
        <NavItem to="/chatrooms" icon={Icon.chat()} label="Chatrooms" collapsed={collapsed} />
        <NavItem to="/profile" icon={Icon.user()} label="Profile" collapsed={collapsed} />
        <NavItem to="/tournament" icon={Icon.trophy()} label="Tournament" collapsed={collapsed} />
        <NavItem to="/practice" icon={Icon.swords()} label="Practice Problems" collapsed={collapsed} />
        
      </div>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            [
              "group flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
              isActive
                ? "bg-[#ff4655] text-white shadow-[0_0_12px_rgba(255,70,85,.45)]"
                : "text-white/70 hover:text-white hover:bg-white/10",
            ].join(" ")
          }
        >
          <span className="grid place-items-center w-5 h-5">{Icon.gear()}</span>
          {!collapsed && "Settings"}
        </NavLink>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-white/80 hover:text-white hover:bg-white/10 text-sm"
        >
          <span className="grid place-items-center w-5 h-5">{Icon.logout()}</span>
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* ✅ Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[56px] px-4 border-b border-white/10 bg-[#0A0A0F]/90 backdrop-blur-md flex items-center justify-center">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-extrabold tracking-wide"
        >
          <span className="text-[#ff4655] text-2xl font-extrabold">Slash</span>
          <span className="text-white text-2xl font-extrabold">coder</span>
          <img
            src={logo}
            alt="Slashcoder Logo"
            className="h-8 w-8 rounded-full object-cover"
          />
        </Link>
      </header>

      {/* Layout */}
      <div className="pt-[56px] flex">
        {/* Sidebar */}
        <aside
          className={`hidden lg:block sticky top-[56px] h-[calc(100vh-56px)] border-r border-white/10 bg-[#0B0F14]/90 backdrop-blur-md ${
            collapsed ? "w-[68px]" : "w-[240px]"
          } transition-[width] duration-200`}
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255,70,85,0.15), 0 0 18px rgba(255,70,85,0.05)",
          }}
        >
          <SidebarContent />
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <div
              className="absolute left-0 top-0 h-full w-[78%] max-w-[320px] bg-[#0B0F14] border-r border-white/10"
              style={{ boxShadow: "0 0 22px rgba(255,70,85,0.15)" }}
            >
              <div className="h-[56px] px-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-extrabold tracking-wide">Slashcoder</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-md hover:bg-white/10"
                >
                  {Icon.x()}
                </button>
              </div>
              <SidebarContent isMobile />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 md:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
