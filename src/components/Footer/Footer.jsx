import React from "react";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-section">
          <div className="brand-section">
            <img
              src="/images/logos11.jpg"
              alt="MAU Logo"
              className="brand-logo"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/40x40/3b82f6/ffffff?text=MAU";
              }}
            />
            <h2>Online Clearance System</h2>
          </div>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h3 className="section-title">Contact</h3>
          <p><MailOutlined /> sntualex@gmail.com</p>
          <p><PhoneOutlined /> +251 918 116 960</p>
          <p><EnvironmentOutlined /> Burie, Ethiopia</p>
        </div>

        {/* Links */}
        <div className="footer-section">
          <h3 className="section-title">Quick Links</h3>
          <a
            href="https://my-websites-qx7p.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            Website
          </a>
          <a
            href="https://github.com/lulieeliyas"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://t.me/abo9991"
            target="_blank"
            rel="noreferrer"
          >
            Telegram
          </a>
        </div>

      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        © {currentYear} Sntayehu Alemayehu • All rights reserved
      </div>
    </footer>
  );
}
