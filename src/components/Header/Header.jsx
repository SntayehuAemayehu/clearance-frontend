// src/components/Header/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { clearSession } from "../../utils/api";
import { useTheme } from "../../App"; 
import { Sun, Moon } from "lucide-react";

export default function Header() {
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();   // THEME CONTEXT

  const userRaw = sessionStorage.getItem("ucs_current");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="header" style={{ background: "var(--header-bg)", color: "var(--header-text)" }}>
      <div className="header-container">

        {/* LEFT LOGO */}
        <div className="header-logo">
          <img className="logo-img" src="../images/logos11.jpg" alt="University Logo" />
          <Link to="/">Online Clearance</Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button className="menu-btn" onClick={() => setOpen(!open)}>
          {open ? "✖" : "☰"}
        </button>

        {/* NAVIGATION MENU */}
        <nav className={`nav ${open ? "open" : ""}`}>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>

          {!user && (
            <>
              {/* <Link to="/login">Login</Link> */}
              <Link to="/register">Register</Link>
            </>
          )}

          {user?.role === "student" && (
            <>
              <Link to="/student">Dashboard</Link>
              <Link to="/clearance-form">Clearance Form</Link>
            </>
          )}

          {user?.role === "departmenthead" && <Link to="/departmenthead">Department</Link>}
          {user?.role === "librarian" && <Link to="/librarian">Library</Link>}
          {user?.role === "dormitory" && <Link to="/dormitory">Dormitory</Link>}
          {user?.role === "cafeteria" && <Link to="/cafeteria">Cafeteria</Link>}
          {user?.role === "registrar" && <Link to="/registrar">Registrar</Link>}
          {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        </nav>

        {/* AUTH SECTION */}
        <div className="header-auth">
          {user ? (
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          ) : (
            <Link className="signin-btn" to="/login">Sign In</Link>
          )}
        </div>
         {/* THEME TOGGLE */}
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

      </div>
    </header>
  );
}
