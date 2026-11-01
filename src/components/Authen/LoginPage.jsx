import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Select, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { apiFetch, setSession } from "../../utils/api";
import "./LoginPage.css";

const { Title, Text } = Typography;
const { Option } = Select;

const roles = [
  "student",
  "departmenthead",
  "librarian",
  "cafeteria",
  "dormitory",
  "registrar",
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Preselect role from URL (?role=admin)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qrole = params.get("role");
    if (qrole && roles.includes(qrole)) setRole(qrole);
  }, [location.search]);

  const onFinish = async (values) => {
    if (!role) return message.warning("Please select your role");
    setLoading(true);

    try {
      // Build payload based on role
      const payload =
        role === "student"
          ? { email: values.email, password: values.password, role }
          : { username: values.username, password: values.password, role };

      // Use apiFetch which automatically sets Content-Type and Authorization
      const res = await apiFetch("login/", {
        method: "POST",
        body: payload, // DO NOT JSON.stringify here; apiFetch handles it
      });

      // Save session: token + user info
      setSession({ ...res.user, token: res.token });

      message.success("Login successful");

      // Navigate based on role
      const routes = {
        student: "/student",
        departmenthead: "/departmenthead",
        librarian: "/librarian",
        cafeteria: "/cafeteria",
        dormitory: "/dormitory",
        registrar: "/registrar",
      };

      navigate(routes[res.user.role] || "/login");
    } catch (err) {
      console.error(err);
      message.error(err.message || "Invalid login");
    } finally {
      setLoading(false);
    }
  };
  // Add a link to admin login
<div style={{ textAlign: "center", marginTop: 10 }}>
  <Text>System Administrator? </Text>
  <Button type="link" onClick={() => navigate("/admin/login")}>
    Access Admin Portal
  </Button>
</div>

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 20,
          padding: "40px 30px",
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <Title level={2}>Welcome Back</Title>
          <Text type="secondary">Login to your account</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Select Role">
            <Select placeholder="Select your role" value={role || undefined} onChange={setRole}>
              {roles.map((r) => (
                <Option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {role === "student" ? (
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: "email", message: "Email is required" }]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>
          ) : role ? (
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>
          ) : null}

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 45 }}>
            Login
          </Button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Button type="link" onClick={() => navigate("/forgot-password")}>
            Forgot password?
          </Button>
        </div>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Text>Don't have an account? </Text>
          <Button type="link" onClick={() => navigate("/register")}>
            Sign Up
          </Button>
        </div>
      </Card>
    </div>
  );
}
