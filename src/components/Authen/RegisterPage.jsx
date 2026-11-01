import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Select,
  Spin,
  Row,
  Col,
  Divider,
  Alert,
  Modal,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  IdcardOutlined,
  BankOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import "./RegisterPage.css";

const { Title, Text } = Typography;
const { Option } = Select;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [matchError, setMatchError] = useState(null);
  const [showNotAuthorizedModal, setShowNotAuthorizedModal] = useState(false);
  const [showAlreadyRegisteredModal, setShowAlreadyRegisteredModal] =
    useState(false);

  const [form] = Form.useForm();
  const navigate = useNavigate();

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collegeRes, deptRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/public/colleges/"),
          fetch("http://127.0.0.1:8000/api/public/departments/"),
        ]);

        setColleges(await collegeRes.json());
        setDepartments(await deptRes.json());
      } catch {
        message.error("Failed to load colleges or departments");
      } finally {
        setLoadingDropdowns(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      setFilteredDepartments(
        departments.filter((d) => d.college === selectedCollege)
      );
    }
  }, [selectedCollege, departments]);

  /* ================= MATCH CHECK ================= */
  const checkNameIDMatch = async () => {
    const values = form.getFieldsValue([
      "first_name",
      "last_name",
      "id_number",
    ]);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/check-student-match/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setMatchError(data.error || "Name and ID do not match records");
        return false;
      }

      setMatchError(null);
      return true;
    } catch {
      setMatchError("Unable to verify student information");
      return false;
    }
  };

  /* ================= SUBMIT ================= */
  const onFinish = async (values) => {
    const matchValid = await checkNameIDMatch();
    if (!matchValid) return;

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "student",
          ...values,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        message.success("🎉 Registration successful");
        navigate("/login");
      } else if (data.error?.includes("already")) {
        setShowAlreadyRegisteredModal(true);
      } else {
        setShowNotAuthorizedModal(true);
      }
    } catch {
      message.error("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingDropdowns) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="register-page-container">
      {/* ================= MODALS ================= */}
      <Modal
        open={showNotAuthorizedModal}
        title="Registration Not Authorized"
        onCancel={() => setShowNotAuthorizedModal(false)}
        footer={null}
      >
        <Alert
          type="warning"
          showIcon
          message="Your details do not match the authorized student list."
        />
      </Modal>

      <Modal
        open={showAlreadyRegisteredModal}
        title="Already Registered"
        onOk={() => navigate("/login")}
        onCancel={() => setShowAlreadyRegisteredModal(false)}
      >
        <Alert
          type="info"
          showIcon
          message="This student is already registered."
        />
      </Modal>

      {/* ================= FORM ================= */}
      <Card className="register-card">
<Title level={2} className="register-title">
  🎓 Welcome to the Student Registration Portal
</Title>
<Text className="register-subtitle">
  Create your student account to access university services and clearance
</Text>


        <Divider />

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* ===== IDENTITY ===== */}
          <Divider orientation="left">Identity Verification</Divider>
          <Text>The First and Last name must be writen in Upercase laters only and Id must be Your corrected Id </Text>
          {matchError && (
            <Alert type="error" showIcon message={matchError} />
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="first_name"
                rules={[{ required: true }]}
              >
                <Input prefix={<UserOutlined />} 
                placeholder="Enter your first name"/>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="last_name"
                rules={[{ required: true }]}
              >
                <Input prefix={<UserOutlined />}
                placeholder="Enter your Last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Student ID"
            name="id_number"
            rules={[{ required: true }]}
          >
            <Input prefix={<IdcardOutlined />} 
            placeholder="Enter your Id  the id Must be writen format like AAA1234"/>
          </Form.Item>

          {/* ===== CONTACT ===== */}
          <Divider orientation="left">Contact Information</Divider>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input prefix={<MailOutlined />}
            placeholder="Enter your Email " />
          </Form.Item>

          {/* ===== ACADEMIC ===== */}
          <Divider orientation="left">Academic Information</Divider>

          <Form.Item
            label="College"
            name="college"
            rules={[{ required: true }]}
          >
            <Select onChange={setSelectedCollege} prefix={<BankOutlined />}>
              {colleges.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Department"
            name="department"
            rules={[{ required: true }]}
          >
            <Select disabled={!selectedCollege}>
              {filteredDepartments.map((d) => (
                <Option key={d.id} value={d.name}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* ===== PASSWORD ===== */}
          <Divider orientation="left">Security</Divider>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} 
            placeholder="Enter your strongest Password"/>
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirm_password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value === getFieldValue("password")) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Passwords do not match");
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />}
            placeholder="Confirm your Password" />
          </Form.Item>

          <Divider />

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            icon={<CheckCircleOutlined />}
          >
            Register Account
          </Button>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Text type="secondary">Already have an account?</Text>
            <Button type="link" onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
