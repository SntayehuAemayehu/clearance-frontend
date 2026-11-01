import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Card, Button, Typography, Input, message, Spin, Modal, 
  Table, Tag, Statistic, Row, Col, Descriptions, Alert,
  Space, Tooltip, Badge, Progress, Steps, Divider
} from "antd";
import { 
  LogoutOutlined, CheckOutlined, CloseOutlined, DownloadOutlined,
  FileDoneOutlined, ClockCircleOutlined, CheckCircleOutlined,
  TeamOutlined, EyeOutlined, UserOutlined, HomeOutlined,
  BookOutlined, CoffeeOutlined, ReloadOutlined,
  FileTextOutlined, BankOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";


const { Title, Text } = Typography;
const { Step } = Steps;
const API_BASE = "http://127.0.0.1:8000/api/";
export default function RegistrarPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ 
    total: 0, 
    cleared: 0, 
    pending: 0, 
    waiting: 0,
    completion_rate: 0
  });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [loadingStats, setLoadingStats] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Get token and user info
  useEffect(() => {
    const stored = sessionStorage.getItem("ucs_current");
    if (!stored) {
      message.error("Please login first");
      window.location.href = "/login";
      return;
    }

    const parsed = JSON.parse(stored);
    if (parsed.role !== "registrar") {
      message.error("Access denied. Registrar only.");
      window.location.href = "/login";
      return;
    }

    setUser(parsed);
    setToken(parsed.token);
    loadForms(parsed.token);
    loadStatistics(parsed.token);
  }, []);

  // ---------------- Load forms ----------------
  const loadForms = async (authToken) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}registrar/forms/`, {
        headers: { 
          Authorization: `Token ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data && Array.isArray(res.data)) {
        setForms(res.data);
      } else {
        console.error("Invalid response format:", res.data);
        setForms([]);
      }
      
    } catch (err) {
      console.error("Error loading forms:", err);
      if (err.response?.status === 401) {
        message.error("Session expired. Please login again.");
        sessionStorage.clear();
        window.location.href = "/login";
      } else {
        message.error(`Failed to load forms: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Load statistics ----------------
  const loadStatistics = async (authToken) => {
    try {
      setLoadingStats(true);
      const res = await axios.get(`${API_BASE}registrar/statistics/`, {
        headers: { 
          Authorization: `Token ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data) {
        setStats({
          total: res.data.total || 0,
          cleared: res.data.cleared || 0,
          pending: res.data.pending || 0,
          waiting: res.data.waiting || 0,
          completion_rate: res.data.completion_rate || 0
        });
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
      calculateStats();
    } finally {
      setLoadingStats(false);
    }
  };

  // ---------------- Calculate statistics (fallback) ----------------
  const calculateStats = () => {
    const total = forms.length;
    const cleared = forms.filter(f => f.status === "Cleared by Registrar").length;
    const pending = forms.filter(f => f.status === "approved_dormitory").length;
    const waiting = total - cleared - pending;
    const completion_rate = total > 0 ? (cleared / total) * 100 : 0;
    
    setStats({ 
      total, 
      cleared, 
      pending, 
      waiting,
      completion_rate
    });
  };

  // ---------------- Get approval status based on form status ----------------
  const getApprovalStatus = (form) => {
    if (!form) return [];
    
    const statusMap = {
      "approved_department": {
        department: "Approved",
        library: "Pending",
        cafeteria: "Pending",
        dormitory: "Pending"
      },
      "approved_library": {
        department: "Approved",
        library: "Approved",
        cafeteria: "Pending",
        dormitory: "Pending"
      },
      "approved_cafeteria": {
        department: "Approved",
        library: "Approved",
        cafeteria: "Approved",
        dormitory: "Pending"
      },
      "approved_dormitory": {
        department: "Approved",
        library: "Approved",
        cafeteria: "Approved",
        dormitory: "Approved"
      },
      "Cleared by Registrar": {
        department: "Approved",
        library: "Approved",
        cafeteria: "Approved",
        dormitory: "Approved",
        registrar: "Approved"
      }
    };
    
    const status = statusMap[form.status] || {
      department: "Pending",
      library: "Pending",
      cafeteria: "Pending",
      dormitory: "Pending"
    };
    
    const approvals = [
      { 
        department: "Department Head", 
        status: status.department === "Approved", 
        note: status.department,
        icon: <UserOutlined />,
        color: status.department === "Approved" ? "green" : "orange"
      },
      { 
        department: "Librarian", 
        status: status.library === "Approved", 
        note: status.library,
        icon: <BookOutlined />,
        color: status.library === "Approved" ? "green" : "orange"
      },
      { 
        department: "Cafeteria", 
        status: status.cafeteria === "Approved", 
        note: status.cafeteria,
        icon: <CoffeeOutlined />,
        color: status.cafeteria === "Approved" ? "green" : "orange"
      },
      { 
        department: "Dormitory", 
        status: status.dormitory === "Approved", 
        note: status.dormitory,
        icon: <HomeOutlined />,
        color: status.dormitory === "Approved" ? "green" : "orange"
      },
    ];
    
    return approvals;
  };

  const isReadyForClearance = (form) => {
    return form.status === "approved_dormitory";
  };

  // ---------------- Finalize ----------------
  const finalizeForm = async (formId) => {
    try {
      const form = forms.find(f => f.id === formId);
      if (!form) {
        message.error("Form not found");
        return;
      }

      if (!isReadyForClearance(form)) {
        message.error("Form must be approved by dormitory first");
        return;
      }

      const res = await axios.patch(`${API_BASE}registrar/action/${formId}/`, 
        { 
          action: "approve", 
          note: "Cleared by Registrar" 
        },
        { 
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      message.success("✅ Form cleared and finalized");
      loadForms(token);
      loadStatistics(token);
    } catch (err) {
      console.error("Error finalizing form:", err);
      if (err.response?.status === 400) {
        message.error(err.response.data?.error || "Cannot approve this form");
      } else {
        message.error("Failed to finalize form");
      }
    }
  };

  // ---------------- Reject ----------------
  const rejectForm = async () => {
    if (!rejectionNote) {
      message.error("Please enter rejection reason");
      return;
    }

    try {
      await axios.patch(`${API_BASE}registrar/action/${selectedFormId}/`, 
        { 
          action: "reject", 
          note: rejectionNote 
        },
        { 
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      message.success("❌ Form rejected");
      setRejectModalVisible(false);
      setRejectionNote("");
      loadForms(token);
      loadStatistics(token);
    } catch (err) {
      console.error("Error rejecting form:", err);
      if (err.response?.status === 400) {
        message.error(err.response.data?.error || "Cannot reject this form");
      } else {
        message.error("Failed to reject form");
      }
    }
  };

  // ---------------- View Form Details ----------------
  const viewFormDetails = (form) => {
    setSelectedForm(form);
    setViewModalVisible(true);
  };

  // ---------------- Render clearance flow ----------------
  const renderClearanceFlow = (form) => {
    const approvals = getApprovalStatus(form);
    
    return (
      <Steps size="small" style={{ marginTop: 20 }}>
        {approvals.map((approval, index) => (
          <Step
            key={index}
            title={approval.department}
            description={approval.status ? "Approved" : "Pending"}
            icon={approval.status ? 
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
              <ClockCircleOutlined style={{ color: '#faad14' }} />}
          />
        ))}
        <Step
          title="Registrar"
          description={form.status === "Cleared by Registrar" ? "Cleared" : "Waiting"}
          icon={form.status === "Cleared by Registrar" ? 
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
            <FileTextOutlined />}
        />
      </Steps>
    );
  };

  // ---------------- Logout ----------------
  const logout = () => {
    sessionStorage.clear();
    message.success("Logged out successfully");
    window.location.href = "/login";
  };

  return (
    <div style={{ minHeight: '100vh', padding: 20, background: '#f0f2f5' }}>
      {/* Header */}
      <Card style={{ marginBottom: 20, borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <BankOutlined /> Registrar Clearance System
            </Title>
            <Text type="secondary">
              Welcome, {user?.username || 'Registrar Officer'}
            </Text>
          </Col>
          <Col>
                      <Space size="middle">
                      {/* ... other buttons ... */}
                      <Button 
                        icon={<UserOutlined />}
                        onClick={() => navigate("/profile")}
                        style={{ 
                          background: 'rgba(255,255,255,0.2)', 
                          color: 'white', 
                          border: 'none'
                        }}
                      >
                        My Profile
                      </Button>
                      {/* ... other buttons ... */}
                    </Space>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  loadForms(token);
                  loadStatistics(token);
                }}
                loading={loading}
              >
                Refresh
              </Button>
              <Button 
                type="primary" 
                danger 
                icon={<LogoutOutlined />} 
                onClick={logout}
              >
                Logout
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ textAlign: 'center', borderRadius: 10 }}>
            <Statistic 
              title="Total Forms" 
              value={stats.total} 
              prefix={<TeamOutlined />} 
              loading={loadingStats}
              valueStyle={{ fontSize: '28px' }}
            />
            <Text type="secondary">From all departments</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ textAlign: 'center', borderRadius: 10, border: '2px solid #52c41a' }}>
            <Statistic 
              title="Cleared" 
              value={stats.cleared} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a', fontSize: '28px' }}
              loading={loadingStats}
            />
            <Text type="secondary">Finalized & sent to students</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ textAlign: 'center', borderRadius: 10, border: '2px solid #1890ff' }}>
            <Statistic 
              title="Pending" 
              value={stats.pending} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
              loading={loadingStats}
            />
            <Text type="secondary">Ready for final approval</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ textAlign: 'center', borderRadius: 10, border: '2px solid #faad14' }}>
            <Statistic 
              title="Waiting" 
              value={stats.waiting} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#faad14', fontSize: '28px' }}
              loading={loadingStats}
            />
            <Text type="secondary">Pending department approvals</Text>
          </Card>
        </Col>
      </Row>

      {/* Forms List */}
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            <span>Pending Clearance Forms</span>
            <Tag color="blue">{forms.length} forms</Tag>
          </Space>
        } 
        style={{ marginBottom: 20, borderRadius: 10 }}
        extra={
          <Button 
            type="link" 
            icon={<ReloadOutlined />} 
            onClick={() => {
              loadForms(token);
              loadStatistics(token);
            }}
            loading={loading}
          >
            Refresh List
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip="Loading forms..." size="large" />
          </div>
        ) : forms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} type="secondary">No forms ready for clearance</Title>
            <Text type="secondary">
              {stats.waiting > 0 
                ? `There are ${stats.waiting} forms waiting for department approvals.`
                : "All forms have been processed."}
            </Text>
          </div>
        ) : (
          forms.map(form => {
            const ready = isReadyForClearance(form);
            const cleared = form.status === "Cleared by Registrar";
            
            return (
              <Card 
                key={form.id} 
                style={{ 
                  marginBottom: 20, 
                  borderRadius: 10,
                  borderLeft: `5px solid ${cleared ? '#52c41a' : ready ? '#1890ff' : '#faad14'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <UserOutlined />
                      <Title level={5} style={{ margin: 0 }}>{form.full_name}</Title>
                      <Badge count="ID" style={{ backgroundColor: '#1890ff' }} />
                      <Text strong>{form.id_number}</Text>
                    </Space>
                    <Space>
                      {cleared ? (
                        <Tag color="green" icon={<CheckCircleOutlined />}>CLEARED</Tag>
                      ) : ready ? (
                        <Tag color="blue" icon={<ClockCircleOutlined />}>READY FOR CLEARANCE</Tag>
                      ) : (
                        <Tag color="orange" icon={<ClockCircleOutlined />}>WAITING FOR APPROVALS</Tag>
                      )}
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />} 
                        onClick={() => viewFormDetails(form)}
                      >
                        View Details
                      </Button>
                    </Space>
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Descriptions size="small" column={4}>
                      <Descriptions.Item label="College">{form.college}</Descriptions.Item>
                      <Descriptions.Item label="Department">{form.department_name}</Descriptions.Item>
                      <Descriptions.Item label="Program">{form.program_level}</Descriptions.Item>
                      <Descriptions.Item label="Submitted">
                        {new Date(form.created_at).toLocaleDateString()}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  
                  <Col span={24}>
                    {renderClearanceFlow(form)}
                  </Col>
                  
                  <Col span={24}>
                    <Divider style={{ margin: '16px 0' }} />
                    <div style={{ textAlign: 'center' }}>
                      <Space size="large">
                        {cleared ? (
                          <Alert
                            message="Cleared"
                            description="This form has been cleared and sent to student."
                            type="success"
                            showIcon
                            style={{ width: '100%' }}
                          />
                        ) : (
                          <>
                            <Tooltip title={ready ? "Finalize and clear this form" : "Wait for all departments to approve"}>
                              <Button 
                                type="primary" 
                                icon={<CheckOutlined />} 
                                onClick={() => finalizeForm(form.id)} 
                                disabled={!ready}
                                style={{ 
                                  background: ready ? '#1890ff' : '#d9d9d9',
                                  borderColor: ready ? '#1890ff' : '#d9d9d9',
                                  cursor: ready ? 'pointer' : 'not-allowed'
                                }}
                              >
                                Finalize & Clear
                              </Button>
                            </Tooltip>
                            
                            <Button 
                              danger 
                              icon={<CloseOutlined />} 
                              onClick={() => {
                                setSelectedFormId(form.id);
                                setRejectionNote("");
                                setRejectModalVisible(true);
                              }}
                            >
                              Reject Form
                            </Button>
                          </>
                        )}
                      </Space>
                    </div>
                  </Col>
                </Row>
              </Card>
            );
          })
        )}
      </Card>

      {/* View Form Details Modal */}
      <Modal
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
        style={{ top: 20 }}
        title={
          <Space>
            <FileTextOutlined />
            <span>Clearance Form Details - {selectedForm?.full_name}</span>
            {selectedForm && (
              <Tag color={selectedForm.status === "Cleared by Registrar" ? "green" : "blue"}>
                {selectedForm.status}
              </Tag>
            )}
          </Space>
        }
      >
        {selectedForm && (
          <div style={{ maxHeight: '70vh', overflow: 'auto', padding: '0 10px' }}>
            <Descriptions bordered column={1} size="middle" labelStyle={{ fontWeight: 'bold', background: '#fafafa' }}>
              <Descriptions.Item label="Student Information">
                <Space direction="vertical">
                  <Text strong>{selectedForm.full_name}</Text>
                  <Text>ID: {selectedForm.id_number}</Text>
                  <Text type="secondary">
                    Submitted: {new Date(selectedForm.created_at).toLocaleString()}
                  </Text>
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Academic Information">
                <Space direction="vertical">
                  <Text>College: {selectedForm.college}</Text>
                  <Text>Department: {selectedForm.department_name}</Text>
                  <Text>Program: {selectedForm.program_level}</Text>
                  <Text>Year/Semester: {selectedForm.year}/{selectedForm.semester}</Text>
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Clearance Reason">
                <Card size="small" style={{ background: '#f6ffed', marginTop: 5 }}>
                  <div style={{ whiteSpace: 'pre-wrap', padding: '8px' }}>
                    {selectedForm.reason}
                  </div>
                </Card>
              </Descriptions.Item>
              
              <Descriptions.Item label="Current Status">
                <Alert
                  message={selectedForm.status}
                  description="Form progress through departments"
                  type={
                    selectedForm.status === "Cleared by Registrar" ? "success" :
                    selectedForm.status === "approved_dormitory" ? "info" :
                    "warning"
                  }
                  showIcon
                />
              </Descriptions.Item>
              
              {isReadyForClearance(selectedForm) && (
                <Descriptions.Item label="Action Required">
                  <Alert
                    message="Ready for Final Clearance"
                    description="All departments have approved this form. You can now finalize it."
                    type="success"
                    showIcon
                    style={{ marginTop: 15 }}
                    action={
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => {
                          finalizeForm(selectedForm.id);
                          setViewModalVisible(false);
                        }}
                      >
                        Finalize Now
                      </Button>
                    }
                  />
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Reject Form Modal */}
      <Modal
        open={rejectModalVisible}
        title={
          <Space>
            <CloseOutlined style={{ color: '#ff4d4f' }} />
            <span>Reject Clearance Form</span>
          </Space>
        }
        onOk={rejectForm}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectionNote("");
        }}
        okText="Confirm Rejection"
        cancelText="Cancel"
        okButtonProps={{ 
          danger: true,
          disabled: !rejectionNote.trim(),
          icon: <CloseOutlined />
        }}
      >
        <Alert
          message="Warning: Rejecting Form"
          description="This action will send the form back to the student with your rejection reason."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Text strong>Reason for Rejection (Required):</Text>
        <Input.TextArea
          value={rejectionNote}
          onChange={(e) => setRejectionNote(e.target.value)}
          rows={4}
          placeholder="Please provide a detailed reason for rejecting this form..."
          style={{ marginTop: 8 }}
          maxLength={500}
          showCount
          autoFocus
        />
        
        <Alert
          message="Note for Student"
          description="The student will be notified and can resubmit after addressing your concerns."
          type="info"
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* Footer */}
      <div style={{
        marginTop: 40,
        padding: '20px 0',
        textAlign: 'center',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Text type="secondary">
          Registrar Clearance System • {new Date().getFullYear()} • 
          <span style={{ marginLeft: 8, color: '#1890ff' }}>
            Total Cleared: {stats.cleared} • Pending: {stats.pending}
          </span>
        </Text>
      </div>
    </div>
  );
}