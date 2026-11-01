import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  message,
  Row,
  Col,
  Statistic,
  Button,
  Modal,
  Input,
  Popconfirm,
  Space,
  Select,
  Switch,
  Spin,
  Table,
  Tabs,
  Tag,
  Form,
  Tooltip,
  Alert,
  Descriptions,
  Divider,
  Badge,
  Progress,
  Timeline,
  Upload,
  Image,
  List,
  Avatar,
} from "antd";
import { useNavigate } from "react-router-dom";
import { 
  UserAddOutlined, 
  UserOutlined,
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  TeamOutlined,
  BankOutlined,
  ShopOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  FileTextOutlined,
  WarningOutlined,
  SafetyOutlined,
  HomeOutlined,
  SolutionOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  CheckOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PercentageOutlined,
  DashboardOutlined,
  DollarOutlined,
  CreditCardOutlined,
  //AccountBookOutlined,
  TransactionOutlined,
  HistoryOutlined,
  FileDoneOutlined,
  MoneyCollectOutlined,
  PhoneOutlined,
  AccountNumberOutlined,
  VerifiedOutlined,
  StopOutlined,
  SyncOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  UploadOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { apiFetch } from "../../utils/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const ROLE_OPTIONS = [
  { value: "departmenthead", label: "Department Head", color: "blue", icon: <ShopOutlined /> },
  { value: "librarian", label: "Librarian", color: "green", icon: <FileTextOutlined /> },
  { value: "cafeteria", label: "Cafeteria", color: "orange", icon: <ShopOutlined /> },
  { value: "dormitory", label: "Dormitory", color: "purple", icon: <HomeOutlined /> },
  { value: "registrar", label: "Registrar", color: "volcano", icon: <SolutionOutlined /> },
  { value: "admin", label: "Admin", color: "red", icon: <SafetyOutlined /> },
];

const PAYMENT_METHOD_TYPES = [
  { value: "telebirr", label: "Telebirr", color: "green", icon: <PhoneOutlined /> },
  { value: "cbe", label: "CBE Bank", color: "blue", icon: <BankOutlined /> },
];

const PAYMENT_STATUS = {
  pending: { text: "Pending", color: "orange", icon: <ClockCircleOutlined /> },
  verified: { text: "Verified", color: "green", icon: <CheckCircleOutlined /> },
  rejected: { text: "Rejected", color: "red", icon: <CloseCircleOutlined /> },
  expired: { text: "Expired", color: "gray", icon: <StopOutlined /> },
};

// Mock data generators
const generateMockStats = () => ({
  total_users: 0,
  active_departments: 0,
  total_colleges: 0,
  total_forms: 0,
  approved_forms: 0,
  pending_forms: 0,
  rejected_forms: 0,
  efficiency: 0,
  avg_processing_time: "0",
  today_forms: 0,
  weekly_trend: "+0%"
});

const generateMockActivities = () => [
  { id: 1, user: "John Doe", action: "approved clearance form", target: "Form #1234", time: "5 minutes ago", icon: "check", color: "green" },
  { id: 2, user: "Jane Smith", action: "registered new dormitory due", target: "Student STU2024001", time: "15 minutes ago", icon: "home", color: "purple" },
  { id: 3, user: "Admin", action: "created new department", target: "Computer Science", time: "1 hour ago", icon: "shop", color: "blue" },
  { id: 4, user: "System", action: "auto-generated report", target: "Weekly Efficiency", time: "2 hours ago", icon: "line-chart", color: "orange" },
  { id: 5, user: "Librarian", action: "checked book dues", target: "5 students", time: "3 hours ago", icon: "book", color: "green" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Data states
  const [stats, setStats] = useState(generateMockStats());
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [systemControls, setSystemControls] = useState([]);
  const [forms, setForms] = useState([]);
  const [recentActivities, setRecentActivities] = useState(generateMockActivities());

  // Payment states
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    total_payments: 0,
    total_amount: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    by_department: {
      library: 0,
      cafeteria: 0,
      dormitory: 0,
      other: 0,
    }
  });

  // Student Registration states
  const [authorizedStudents, setAuthorizedStudents] = useState([]);
  const [csvUploads, setCsvUploads] = useState([]);
  const [csvUploadModal, setCSVUploadModal] = useState(false);
  const [csvUploading, setCSVUploading] = useState(false);
  const [csvFile, setCSVFile] = useState(null);

  // Modal states
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserForm] = Form.useForm();

  const [deptOpen, setDeptOpen] = useState(false);
  const [deptForm] = Form.useForm();
  const [deptEdit, setDeptEdit] = useState(null);

  const [collegeOpen, setCollegeOpen] = useState(false);
  const [collegeForm] = Form.useForm();
  const [collegeEdit, setCollegeEdit] = useState(null);

  const [userModal, setUserModal] = useState({ open: false, user: null });
  const [userForm] = Form.useForm();

  const [systemControlOpen, setSystemControlOpen] = useState(false);
  const [systemControlForm] = Form.useForm();

  const [paymentMethodModal, setPaymentMethodModal] = useState({ open: false, method: null });
  const [paymentMethodForm] = Form.useForm();

  const [viewPaymentModal, setViewPaymentModal] = useState({ open: false, payment: null });
  const [paymentLogsModal, setPaymentLogsModal] = useState({ open: false, payment: null, logs: [] });

  const [viewFormModal, setViewFormModal] = useState({ open: false, form: null });
  const [viewUserModal, setViewUserModal] = useState({ open: false, user: null });
  const [efficiencyModal, setEfficiencyModal] = useState(false);

  // ==================== AUTH GUARD ====================
  useEffect(() => {
    const stored = sessionStorage.getItem("ucs_current");
    if (!stored) {
      message.error("Please login first");
      navigate("/login");
      return;
    }
    
    const parsed = JSON.parse(stored);
    if (parsed.role !== "admin") {
      message.error("Access denied. Admin only.");
      navigate("/login");
      return;
    }
    
    setSession(parsed);
  }, [navigate]);

  // ==================== LOAD ALL DATA ====================
  const loadAllData = useCallback(async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      console.log("Loading all admin data...");
      
      // Load stats
      try {
        const statsData = await apiFetch("admin/stats/");
        console.log("Stats data:", statsData);
        setStats(prev => ({
          ...prev,
          ...statsData,
          efficiency: statsData?.efficiency || 0,
        }));
      } catch (err) {
        console.warn("Failed to load stats:", err.message);
        setStats(generateMockStats());
      }
      
      // Load users
      try {
        const usersData = await apiFetch("users/");
        console.log("Users data count:", usersData?.length);
        setUsers(usersData || []);
      } catch (err) {
        console.warn("Failed to load users:", err.message);
        setUsers([]);
      }
      
      // Load departments
      try {
        const departmentsData = await apiFetch("departments/");
        console.log("Departments data count:", departmentsData?.length);
        setDepartments(departmentsData || []);
      } catch (err) {
        console.warn("Failed to load departments:", err.message);
        setDepartments([]);
      }
      
      // Load colleges
      try {
        const collegesData = await apiFetch("colleges/");
        console.log("Colleges data count:", collegesData?.length);
        setColleges(collegesData || []);
      } catch (err) {
        console.warn("Failed to load colleges:", err.message);
        setColleges([]);
      }
      
      // Load system controls
      try {
        const systemData = await apiFetch("system-controls/");
        console.log("System controls:", systemData);
        setSystemControls(systemData || []);
      } catch (err) {
        console.warn("Failed to load system controls:", err.message);
        setSystemControls([]);
      }
      
      // Load forms
      try {
        const formsData = await apiFetch("admin/form-requests/");
        console.log("Forms data count:", formsData?.length);
        setForms(formsData || []);
      } catch (err) {
        console.warn("Failed to load forms:", err.message);
        setForms([]);
      }
      
      // Load payment methods
      try {
      console.log("Loading payment methods...");
      const paymentMethodsData = await apiFetch("admin/payment-methods/");
      console.log("Payment methods loaded successfully:", paymentMethodsData);
      setPaymentMethods(paymentMethodsData || []);
    } catch (err) {
      console.warn("Failed to load payment methods from admin endpoint:", err.message);
      }
      

            try {
        const publicPaymentMethods = await apiFetch("payment/methods/");
        console.log("Falling back to public payment methods:", publicPaymentMethods);
        setPaymentMethods(publicPaymentMethods || []);
      } catch (fallbackErr) {
        console.warn("Failed to load any payment methods:", fallbackErr.message);
        setPaymentMethods([]);
      }
    
      // Load all payments
      try {
      const paymentsData = await apiFetch("admin/payments/all/");
      console.log("Payments data loaded:", paymentsData?.length);
      setStudentPayments(paymentsData || []);
    } catch (err) {
      console.warn("Failed to load payments:", err.message);
      setStudentPayments([]);
      }
      
      // Load payment statistics
      try {
        const paymentStatsData = await apiFetch("payment/statistics/");
        console.log("Payment stats:", paymentStatsData);
        setPaymentStats(paymentStatsData || {
          total_payments: 0,
          total_amount: 0,
          pending: 0,
          verified: 0,
          rejected: 0,
          by_department: {
            library: 0,
            cafeteria: 0,
            dormitory: 0,
            other: 0,
          }
        });
      } catch (err) {
        console.warn("Failed to load payment stats:", err.message);
      }
      
      // Load authorized students
      try {
        const authStudentsData = await apiFetch("admin/authorized-students/");
        console.log("Authorized students count:", authStudentsData?.length);
        setAuthorizedStudents(authStudentsData || []);
      } catch (err) {
        console.warn("Failed to load authorized students:", err.message);
        setAuthorizedStudents([]);
      }
      
      // Load CSV uploads
      try {
        const csvUploadsData = await apiFetch("admin/csv-uploads/");
        console.log("CSV uploads count:", csvUploadsData?.length);
        setCsvUploads(csvUploadsData || []);
      } catch (err) {
        console.warn("Failed to load CSV uploads:", err.message);
        setCsvUploads([]);
      }
      
      // Set activities
      setRecentActivities(generateMockActivities());
      
      message.success("Data loaded successfully");
    } catch (err) {
      console.error("Failed to load admin data:", err);
      message.error(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      loadAllData();
    }
  }, [session, loadAllData]);

  // ==================== STUDENT REGISTRATION FUNCTIONS ====================
  const uploadCSVFile = async (file) => {
    setCSVUploading(true);
    try {
      const formData = new FormData();
      formData.append('csv_file', file);
      
      const token = sessionStorage.getItem("ucs_current") 
        ? JSON.parse(sessionStorage.getItem("ucs_current")).token 
        : '';
      
      const response = await fetch('http://127.0.0.1:8000/api/admin/csv-upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        message.success(`CSV uploaded successfully: ${data.summary?.successful || 0} students added`);
        setCSVUploadModal(false);
        setCSVFile(null);
        loadAllData();
      } else {
        message.error(`Failed to upload CSV: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      message.error(`CSV upload failed: ${err.message}`);
    } finally {
      setCSVUploading(false);
    }
  };

  const toggleStudentStatus = async (student) => {
    try {
      await apiFetch(`admin/authorized-students/${student.id}/toggle/`, {
        method: "PATCH",
      });
      message.success(`Student ${student.is_active ? "deactivated" : "activated"}`);
      loadAllData();
    } catch (err) {
      message.error(`Failed to update student: ${err.message}`);
    }
  };

  const deleteAuthorizedStudent = async (studentId) => {
    try {
      await apiFetch(`admin/authorized-students/${studentId}/`, {
        method: "DELETE",
      });
      message.success("Student deleted successfully");
      loadAllData();
    } catch (err) {
      message.error(`Failed to delete student: ${err.message}`);
    }
  };

  const deleteCSVUpload = async (uploadId) => {
    try {
      await apiFetch(`admin/csv-uploads/${uploadId}/`, {
        method: "DELETE",
      });
      message.success("CSV upload deleted successfully");
      loadAllData();
    } catch (err) {
      message.error(`Failed to delete CSV upload: ${err.message}`);
    }
  };

  const downloadCSVTemplate = () => {
    const token = sessionStorage.getItem("ucs_current") 
      ? JSON.parse(sessionStorage.getItem("ucs_current")).token 
      : '';
    
    window.open(`http://127.0.0.1:8000/api/admin/download-csv-template/?token=${token}`, '_blank');
  };

  // ==================== PAYMENT MANAGEMENT FUNCTIONS ====================
const initializePaymentMethods = async () => {
  try {
    // First check if we need to create default methods
    if (paymentMethods.length === 0) {
      const defaultMethods = [
        {
          name: 'telebirr',
          account_name: 'Mekdela Amba University',
          phone_number: '0918114545',
          instructions: 'Send payment via Telebirr to 0918114545\nInclude your student ID in the reference\nSave the receipt for verification',
          is_active: true
        },
        {
          name: 'cbe',
          account_name: 'Mekdela Amba University',
          account_number: '1000225566778',
          instructions: 'Deposit to CBE Account 1000225566778\nInclude your student ID in the reference\nSave the deposit slip for verification',
          is_active: true
        }
      ];

      let createdCount = 0;
      for (const method of defaultMethods) {
        try {
          await apiFetch("admin/payment-methods/create/", {
            method: "POST",
            body: method,
          });
          createdCount++;
        } catch (createErr) {
          console.warn(`Failed to create ${method.name}:`, createErr.message);
        }
      }
      
      if (createdCount > 0) {
        message.success(`${createdCount} default payment methods initialized`);
        loadAllData(); // Refresh the list
      } else {
        message.info("Payment methods already exist or failed to create");
      }
    } else {
      message.info("Payment methods already exist");
    }
  } catch (err) {
    message.error(`Failed to initialize: ${err.message}`);
  }
};

const savePaymentMethod = async (values) => {
  try {
    console.log("Saving payment method with values:", values);
    
    // Determine endpoint and method
    let endpoint, method;
    
    if (paymentMethodModal.method) {
      endpoint = `admin/payment-methods/${paymentMethodModal.method.id}/`;
      method = "PUT";
    } else {
      endpoint = "admin/payment-methods/create/";
      method = "POST";
    }
    
    // Call API
    const response = await apiFetch(endpoint, {
      method: method,
      body: values,
    });
    
    console.log("Payment method saved successfully:", response);
    
    message.success(`Payment method ${paymentMethodModal.method ? "updated" : "created"} successfully`);
    setPaymentMethodModal({ open: false, method: null });
    paymentMethodForm.resetFields();
    loadAllData();
  } catch (err) {
    console.error("Failed to save payment method:", err);
    message.error(`Failed to save payment method: ${err.message}`);
  }
};

  const deletePaymentMethod = async (id) => {
    try {
      await apiFetch(`admin/payment-methods/${id}/delete/`, {
        method: "DELETE",
      });
      message.success("Payment method deleted successfully");
      loadAllData();
    } catch (err) {
      message.error(`Failed to delete payment method: ${err.message}`);
    }
  };
// Add this function to debug data loading
const debugDataLoading = async () => {
  console.log("=== DEBUG DATA LOADING ===");
  console.log("Session:", session);
  console.log("Active Tab:", activeTab);
  
  try {
    // Test each endpoint
    const endpoints = [
      "admin/stats/",
      "users/",
      "departments/",
      "colleges/",
      "admin/payment-methods/",
      "admin/payments/all/",
      "payment/statistics/",
      "admin/authorized-students/"
    ];
    
    for (const endpoint of endpoints) {
      try {
        const data = await apiFetch(endpoint);
        console.log(`${endpoint}:`, Array.isArray(data) ? `Array(${data.length})` : data);
      } catch (err) {
        console.error(`Failed to load ${endpoint}:`, err.message);
      }
    }
    
    message.info("Check console for debug information");
  } catch (err) {
    console.error("Debug error:", err);
  }
};

// Add a debug button to your header
<Button 
  icon={<ReloadOutlined />}
  onClick={debugDataLoading}
  style={{ marginRight: 8 }}
>
  Debug Data
</Button>
const debugPaymentMethods = async () => {
  try {
    console.log("Debugging payment methods...");
    
    // Try admin endpoint
    const adminResponse = await fetch('http://127.0.0.1:8000/api/admin/payment-methods/all/', {
      headers: {
        'Authorization': `Token ${session.token}`,
        'Content-Type': 'application/json',
      }
    });
    console.log("Admin endpoint status:", adminResponse.status);
    const adminData = await adminResponse.json();
    console.log("Admin endpoint data:", adminData);
    
    // Try public endpoint
    const publicResponse = await fetch('http://127.0.0.1:8000/api/payment/methods/');
    console.log("Public endpoint status:", publicResponse.status);
    const publicData = await publicResponse.json();
    console.log("Public endpoint data:", publicData);
    
    message.info("Check console for debug information");
  } catch (err) {
    console.error("Debug error:", err);
  }
};



// Add a debug button to your component:
<Button 
  icon={<ReloadOutlined />}
  onClick={debugPaymentMethods}
  style={{ marginRight: 8 }}
>
  Debug Payment Methods
</Button>

  const togglePaymentMethodStatus = async (method) => {
    try {
      await apiFetch(`admin/payment-methods/${method.id}/toggle/`, {
        method: "PATCH",
        body: { is_active: !method.is_active }
      });
      message.success(`Payment method ${!method.is_active ? "activated" : "deactivated"} successfully`);
      loadAllData();
    } catch (err) {
      message.error(`Failed to update payment method: ${err.message}`);
    }
  };

  const viewPaymentDetails = async (payment) => {
    setViewPaymentModal({ open: true, payment });
  };

  const viewPaymentLogs = async (payment) => {
    try {
      const logs = await apiFetch(`payment/${payment.id}/logs/`);
      setPaymentLogsModal({ open: true, payment, logs });
    } catch (err) {
      message.error(`Failed to load payment logs: ${err.message}`);
    }
  };

  const updatePaymentStatus = async (paymentId, status, reason = "") => {
    try {
      await apiFetch(`admin/payments/${paymentId}/update/`, {
        method: "PATCH",
        body: { status, rejection_reason: reason },
      });
      message.success(`Payment status updated to ${status}`);
      loadAllData();
      setViewPaymentModal({ open: false, payment: null });
    } catch (err) {
      message.error(`Failed to update payment: ${err.message}`);
    }
  };

  // ==================== RENDER PAYMENT STATUS ====================
  const renderPaymentStatus = (status) => {
    const statusInfo = PAYMENT_STATUS[status] || { text: status, color: "default", icon: <ClockCircleOutlined /> };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text.toUpperCase()}
      </Tag>
    );
  };

  const renderPaymentMethod = (method) => {
    if (!method) return <Tag color="default">N/A</Tag>;
    
    const methodInfo = PAYMENT_METHOD_TYPES.find(m => m.value === method) || {
        label: method,
        color: "default",
        icon: <CreditCardOutlined />
    };

    return (
        <Tag color={methodInfo.color} icon={methodInfo.icon}>
            {String(methodInfo.label).toUpperCase()}
        </Tag>
    );
  };

  const renderDepartmentType = (type) => {
    const deptMap = {
      library: { label: "Library", color: "blue" },
      cafeteria: { label: "Cafeteria", color: "orange" },
      dormitory: { label: "Dormitory", color: "purple" },
      other: { label: "Other", color: "gray" },
    };
    const deptInfo = deptMap[type] || { label: type, color: "default" };
    return (
      <Tag color={deptInfo.color}>
        {deptInfo.label}
      </Tag>
    );
  };

  // ==================== RENDER STATS CARD FOR PAYMENTS ====================
  const renderPaymentStats = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #52c41a' }}>
          <Statistic 
            title="Total Payments" 
            value={paymentStats.total_payments || 0}
            prefix={<MoneyCollectOutlined />}
            valueStyle={{ color: '#52c41a', fontSize: '28px' }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>All transactions</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #1890ff' }}>
          <Statistic 
            title="Total Amount" 
            value={paymentStats.total_amount || 0}
            prefix="ETB"
            valueStyle={{ color: '#1890ff', fontSize: '28px' }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>Total revenue</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #fa8c16' }}>
          <Statistic 
            title="Pending" 
            value={paymentStats.pending || 0}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#fa8c16', fontSize: '28px' }}
          />
          <Progress 
            percent={paymentStats.total_payments ? Math.round((paymentStats.pending / paymentStats.total_payments) * 100) : 0}
            size="small"
            strokeColor="#fa8c16"
            showInfo={false}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #13c2c2' }}>
          <Statistic 
            title="Verified" 
            value={paymentStats.verified || 0}
            prefix={<VerifiedOutlined />}
            valueStyle={{ color: '#13c2c2', fontSize: '28px' }}
          />
          <Progress 
            percent={paymentStats.total_payments ? Math.round((paymentStats.verified / paymentStats.total_payments) * 100) : 0}
            size="small"
            strokeColor="#13c2c2"
            showInfo={false}
          />
        </Card>
      </Col>
    </Row>
  );

  // ==================== PAYMENT DISTRIBUTION CHART ====================
  const renderPaymentDistribution = () => {
    const departmentData = [
      { department: "Library", count: paymentStats.by_department?.library || 0, color: "#1890ff" },
      { department: "Cafeteria", count: paymentStats.by_department?.cafeteria || 0, color: "#fa8c16" },
      { department: "Dormitory", count: paymentStats.by_department?.dormitory || 0, color: "#722ed1" },
      { department: "Other", count: paymentStats.by_department?.other || 0, color: "#52c41a" },
    ];

    const total = departmentData.reduce((sum, dept) => sum + dept.count, 0);

    return (
      <Card title="Payment Distribution by Department" style={{ borderRadius: 12 }}>
        <div style={{ padding: '0 10px' }}>
          {departmentData.map((dept, index) => (
            <div key={index} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>{dept.department}</Text>
                <Space>
                  <Text type="secondary">{dept.count} payments</Text>
                  <Text type="secondary">
                    ({total > 0 ? Math.round((dept.count / total) * 100) : 0}%)
                  </Text>
                </Space>
              </div>
              <Progress 
                percent={total > 0 ? Math.round((dept.count / total) * 100) : 0}
                strokeColor={dept.color}
                size="small"
                showInfo={false}
              />
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // ==================== RECENT PAYMENTS ====================
  const renderRecentPayments = () => (
    <Card 
      title="Recent Payments" 
      extra={
        <Button type="link" onClick={() => setActiveTab("payments")}>
          View All
        </Button>
      }
      style={{ borderRadius: 12, marginTop: 16 }}
    >
      <Table
        dataSource={studentPayments.slice(0, 5)}
        rowKey="id"
        loading={loading}
        pagination={false}
        columns={[
          { 
            title: "ID", 
            dataIndex: "transaction_id", 
            width: 120,
            render: (id) => <Tag color="blue">{id?.substring?.(0, 8) || 'N/A'}...</Tag>
          },
          { 
            title: "Student", 
            dataIndex: ["student", "username"],
            render: (text, record) => (
              <Space direction="vertical" size={0}>
                <Text strong>{text || 'Unknown'}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {record.student?.email || 'No email'}
                </Text>
              </Space>
            )
          },
          { 
            title: "Department", 
            dataIndex: "department_type",
            render: (type) => renderDepartmentType(type)
          },
          { 
            title: "Amount", 
            dataIndex: "amount",
            render: (amount) => (
              <Text strong style={{ color: '#52c41a' }}>
                {amount || 0} ETB
              </Text>
            )
          },
          { 
            title: "Status", 
            dataIndex: "status",
            render: (status) => renderPaymentStatus(status)
          },
          {
            title: "Actions",
            width: 80,
            render: (_, payment) => (
              <Tooltip title="View Details">
                <Button 
                  icon={<EyeOutlined />} 
                  size="small"
                  type="link"
                  onClick={() => viewPaymentDetails(payment)}
                />
              </Tooltip>
            ),
          },
        ]}
      />
    </Card>
  );

  // ==================== CALCULATE EFFICIENCY ====================
  const calculateSystemEfficiency = () => {
    const totalForms = forms.length;
    if (totalForms === 0) return 100;
    
    const approvedForms = forms.filter(f => 
      f.status === "completed" || 
      f.status === "Cleared by Registrar"
    ).length;
    
    const pendingForms = forms.filter(f => 
      f.status === "pending" || 
      f.status.includes("pending") ||
      f.status === "approved_dormitory"
    ).length;
    
    const efficiency = Math.round(((approvedForms + (pendingForms * 0.5)) / totalForms) * 100);
    return Math.min(efficiency, 100);
  };

  // ==================== USER MANAGEMENT ====================
  const createStaff = async (values) => {
    try {
      await apiFetch("admin/create-user/", {
        method: "POST",
        body: values,
      });
      message.success("Staff user created successfully");
      setCreateUserOpen(false);
      createUserForm.resetFields();
      loadAllData();
    } catch (err) {
      message.error(`Failed to create staff: ${err.message}`);
    }
  };

  const updateUser = async (id, data) => {
    try {
      await apiFetch(`users/${id}/`, { 
        method: "PUT", 
        body: data 
      });
      message.success("User updated successfully");
      loadAllData();
      setUserModal({ open: false, user: null });
      userForm.resetFields();
    } catch (err) {
      message.error(`Failed to update user: ${err.message}`);
    }
  };

  const deleteUser = async (id) => {
    try {
      await apiFetch(`users/${id}/`, { method: "DELETE" });
      message.success("User deleted successfully");
      loadAllData();
    } catch (err) {
      message.error(`Failed to delete user: ${err.message}`);
    }
  };

  const toggleUserBlock = async (user) => {
    try {
      await apiFetch(`users/${user.id}/`, {
        method: "PATCH",
        body: { is_blocked: !user.is_blocked }
      });
      message.success(`User ${user.is_blocked ? "unblocked" : "blocked"} successfully`);
      loadAllData();
    } catch (err) {
      message.error(`Failed to update user: ${err.message}`);
    }
  };

  // ==================== DEPARTMENT MANAGEMENT ====================
  const saveDepartment = async (values) => {
    try {
      if (deptEdit) {
        await apiFetch(`departments/${deptEdit.id}/`, { 
          method: "PUT", 
          body: values 
        });
        message.success("Department updated successfully");
      } else {
        await apiFetch("departments/create/", { 
          method: "POST", 
          body: values 
        });
        message.success("Department created successfully");
      }
      setDeptOpen(false);
      setDeptEdit(null);
      deptForm.resetFields();
      loadAllData();
    } catch (err) {
      message.error(`Failed to save department: ${err.message}`);
    }
  };

  const deleteDepartment = async (id) => {
    try { 
      await apiFetch(`departments/${id}/`, { method: "DELETE" }); 
      message.success("Department deleted successfully"); 
      loadAllData(); 
    } catch (err) { 
      message.error(`Failed to delete department: ${err.message}`); 
    }
  };

  const openEditDepartment = (dept) => {
    setDeptEdit(dept);
    deptForm.setFieldsValue({
      name: dept.name,
      college: dept.college
    });
    setDeptOpen(true);
  };

  // ==================== COLLEGE MANAGEMENT ====================
  const saveCollege = async (values) => {
    try {
      if (collegeEdit) {
        await apiFetch(`colleges/${collegeEdit.id}/`, { 
          method: "PUT", 
          body: values 
        });
        message.success("College updated successfully");
      } else {
        await apiFetch("colleges/create/", { 
          method: "POST", 
          body: values 
        });
        message.success("College created successfully");
      }
      setCollegeOpen(false);
      setCollegeEdit(null);
      collegeForm.resetFields();
      loadAllData();
    } catch (err) {
      message.error(`Failed to save college: ${err.message}`);
    }
  };

  const deleteCollege = async (id) => {
    try { 
      await apiFetch(`colleges/${id}/`, { method: "DELETE" }); 
      message.success("College deleted successfully"); 
      loadAllData(); 
    } catch (err) { 
      message.error(`Failed to delete college: ${err.message}`); 
    }
  };

  const openEditCollege = (college) => {
    setCollegeEdit(college);
    collegeForm.setFieldsValue({
      name: college.name
    });
    setCollegeOpen(true);
  };

  // ==================== FORM MANAGEMENT ====================
  const updateFormStatus = async (formId, status) => {
    try {
      await apiFetch(`admin/form-requests/${formId}/`, {
        method: "PATCH",
        body: { status },
      });
      message.success(`Form status updated to ${status}`);
      loadAllData();
    } catch (err) {
      message.error(`Failed to update form: ${err.message}`);
    }
  };

  // ==================== SYSTEM CONTROL ====================
  const saveSystemControl = async (values) => {
    try {
      if (systemControls.length > 0) {
        await apiFetch(`system-controls/${systemControls[0].id}/`, { 
          method: "PUT", 
          body: values 
        });
      } else {
        await apiFetch("system-controls/", { 
          method: "POST", 
          body: values 
        });
      }
      message.success("System control updated successfully");
      setSystemControlOpen(false);
      systemControlForm.resetFields();
      loadAllData();
    } catch (err) {
      message.error(`Failed to update system control: ${err.message}`);
    }
  };

  const toggleSystem = async (value) => {
    try {
      if (systemControls.length > 0) {
        await apiFetch(`system-controls/${systemControls[0].id}/`, { 
          method: "PATCH", 
          body: { is_open: value } 
        });
      } else {
        await apiFetch("system-controls/", { 
          method: "POST", 
          body: { is_open: value } 
        });
      }
      message.success(`System ${value ? "opened" : "closed"} successfully`);
      loadAllData();
    } catch (err) {
      message.error(`Failed to update system: ${err.message}`);
    }
  };

  // ==================== RENDER STATUS ====================
  const renderStatus = (status) => {
    switch(status?.toLowerCase()) {
      case "approved":
      case "completed":
      case "cleared by registrar":
        return <Tag icon={<CheckCircleOutlined />} color="success">APPROVED</Tag>;
      case "rejected":
        return <Tag icon={<CloseCircleOutlined />} color="error">REJECTED</Tag>;
      case "pending":
      case "pending_department":
        return <Tag icon={<ClockCircleOutlined />} color="warning">PENDING</Tag>;
      case "approved_department":
        return <Tag color="blue" icon={<CheckCircleOutlined />}>APPROVED BY DEPT</Tag>;
      case "approved_library":
        return <Tag color="green" icon={<CheckCircleOutlined />}>APPROVED BY LIBRARY</Tag>;
      case "approved_cafeteria":
        return <Tag color="orange" icon={<CheckCircleOutlined />}>APPROVED BY CAFETERIA</Tag>;
      case "approved_dormitory":
        return <Tag color="purple" icon={<CheckCircleOutlined />}>APPROVED BY DORMITORY</Tag>;
      default:
        return <Tag color="default">{status || "Unknown"}</Tag>;
    }
  };

  const renderUserStatus = (user) => (
    <Badge 
      status={user.is_blocked ? "error" : "success"} 
      text={user.is_blocked ? "Blocked" : "Active"}
    />
  );

  const renderRoleTag = (role) => {
    const roleInfo = ROLE_OPTIONS.find(r => r.value === role) || { label: role, color: "default" };
    return (
      <Tag color={roleInfo.color} icon={roleInfo.icon}>
        {roleInfo.label.toUpperCase()}
      </Tag>
    );
  };

  // ==================== LOGOUT ====================
  const logout = () => {
    sessionStorage.clear();
    localStorage.removeItem("ucs_user");
    message.success("Logged out successfully");
    navigate("/login");
  };

  // ==================== RENDER EFFICIENCY METRICS ====================
  const renderEfficiencyMetrics = () => {
    const efficiencyData = [
      { department: "Department Head", efficiency: 92, color: "#1890ff" },
      { department: "Library", efficiency: 88, color: "#52c41a" },
      { department: "Cafeteria", efficiency: 85, color: "#fa8c16" },
      { department: "Dormitory", efficiency: 78, color: "#722ed1" },
      { department: "Registrar", efficiency: 95, color: "#fa541c" },
    ];

    return (
      <Card title="Department Efficiency" extra={
        <Button type="link" size="small" onClick={() => setEfficiencyModal(true)}>
          View Details
        </Button>
      }>
        <div style={{ padding: '0 10px' }}>
          {efficiencyData.map((dept, index) => (
            <div key={index} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>{dept.department}</Text>
                <Text type="secondary">{dept.efficiency}%</Text>
              </div>
              <Progress 
                percent={dept.efficiency} 
                strokeColor={dept.color}
                size="small"
                showInfo={false}
              />
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // ==================== RENDER ====================
  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Card 
        style={{ 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
          color: 'white',
          borderRadius: 12,
          boxShadow: '0 8px 25px rgba(24, 144, 255, 0.3)'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 700 }}>
                <SafetyOutlined /> Admin Dashboard
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                <DashboardOutlined /> Welcome, {session.username} | Role: {session.role}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadAllData}
                loading={loading}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600
                }}
              >
                Refresh
              </Button>
              <Button 
                danger 
                icon={<LogoutOutlined />}
                onClick={logout}
                style={{ 
                  background: 'rgba(255,77,79,0.9)', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600
                }}
              >
                Logout
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #1890ff' }}>
            <Statistic 
              title="Total Users" 
              value={stats.total_users || users.length} 
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>Across all roles</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #52c41a' }}>
            <Statistic 
              title="Colleges" 
              value={stats.total_colleges || colleges.length} 
              prefix={<BankOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #722ed1' }}>
            <Statistic 
              title="Departments" 
              value={stats.active_departments || departments.length} 
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #fa8c16' }}>
            <Statistic 
              title="Forms Today" 
              value={stats.today_forms || 0} 
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #13c2c2' }}>
            <Statistic
              title="System Efficiency"
              value={stats.efficiency || calculateSystemEfficiency()}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: '#13c2c2', fontSize: '28px' }}
            />
            <Progress 
              percent={stats.efficiency || calculateSystemEfficiency()} 
              size="small" 
              strokeColor="#13c2c2"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', border: '2px solid #eb2f96' }}>
            <Statistic
              title="Weekly Trend"
              value={stats.weekly_trend || "+0%"}
              prefix={stats.weekly_trend?.startsWith?.('+') ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ 
                color: stats.weekly_trend?.startsWith?.('+') ? '#52c41a' : '#ff4d4f', 
                fontSize: '28px' 
              }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>Form submissions</Text>
          </Card>
        </Col>
      </Row>

      {/* Payment Stats */}
      {renderPaymentStats()}

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Left Column - Efficiency & Activity */}
        <Col xs={24} lg={8}>
          {renderEfficiencyMetrics()}
          {renderPaymentDistribution()}
          
          <Card title="Recent Activities" style={{ marginTop: 16, borderRadius: 12 }}>
            <Timeline>
              {recentActivities.slice(0, 5).map((activity, index) => (
                <Timeline.Item
                  key={index}
                  color={activity.color}
                  dot={activity.icon === 'check' ? <CheckCircleOutlined /> : 
                        activity.icon === 'home' ? <HomeOutlined /> :
                        activity.icon === 'shop' ? <ShopOutlined /> :
                        activity.icon === 'line-chart' ? <LineChartOutlined /> :
                        <FileTextOutlined />}
                >
                  <Space direction="vertical" size={2}>
                    <Text strong>{activity.user}</Text>
                    <Text type="secondary">{activity.action} - {activity.target}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{activity.time}</Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          <Card title="Quick Stats" style={{ marginTop: 16, borderRadius: 12 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Statistic 
                    title="Approved Forms" 
                    value={stats.approved_forms || forms.filter(f => f.status === "completed").length} 
                    valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: '#fff2f0', border: '1px solid #ffccc7' }}>
                  <Statistic 
                    title="Rejected Forms" 
                    value={stats.rejected_forms || forms.filter(f => f.status === "rejected").length} 
                    valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                  <Statistic
                    title="Avg. Processing" 
                    value={stats.avg_processing_time || "0"}
                    suffix="days"
                    valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: '#f9f0ff', border: '1px solid #d3adf7' }}>
                  <Statistic 
                    title="Active Staff" 
                    value={users.filter(u => !u.is_blocked && u.role !== 'student').length} 
                    valueStyle={{ color: '#722ed1', fontSize: '24px' }}
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Column - Main Tabs */}
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 12, minHeight: '100%' }}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              size="large"
              style={{ marginBottom: 0 }}
            >
              <TabPane 
                tab={<span><DatabaseOutlined /> Dashboard</span>}
                key="dashboard"
              >
                {/* Quick Actions */}
                <Card title="Quick Actions" style={{ marginBottom: 24, borderRadius: 8 }}>
                  <Space wrap>
                    <Button 
                      type="primary" 
                      icon={<UserAddOutlined />} 
                      onClick={() => {
                        createUserForm.resetFields();
                        setCreateUserOpen(true);
                      }}
                      size="large"
                    >
                      Create Staff User
                    </Button>
                    <Button 
                      type="default"
                      icon={<BankOutlined />} 
                      onClick={() => {
                        setCollegeEdit(null);
                        collegeForm.resetFields();
                        setCollegeOpen(true);
                      }}
                      size="large"
                    >
                      Add College
                    </Button>
                    <Button 
                      type="default"
                      icon={<ShopOutlined />} 
                      onClick={() => {
                        setDeptEdit(null);
                        deptForm.resetFields();
                        setDeptOpen(true);
                      }}
                      size="large"
                    >
                      Add Department
                    </Button>
                    <Button 
                      type="primary"
                      icon={<MoneyCollectOutlined />}
                      onClick={() => {
                        paymentMethodForm.resetFields();
                        setPaymentMethodModal({ open: true, method: null });
                      }}
                      size="large"
                    >
                      Add Payment Method
                    </Button>
                  </Space>
                </Card>

                {/* Recent Forms */}
                <Card 
                  title="Recent Clearance Forms" 
                  extra={
                    <Button type="link" onClick={() => setActiveTab("forms")}>View All</Button>
                  }
                  style={{ borderRadius: 8, marginBottom: 16 }}
                >
                  <Table
                    dataSource={forms.slice(0, 5)}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    columns={[
                      { 
                        title: "ID", 
                        dataIndex: "id", 
                        width: 60,
                        render: (id) => <Tag color="blue">#{id}</Tag>
                      },
                      { 
                        title: "Student", 
                        dataIndex: "student_name",
                        render: (text, record) => (
                          <Space direction="vertical" size={0}>
                            <Text strong>{text || 'Unknown'}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {record.student_email || 'No email'}
                            </Text>
                          </Space>
                        )
                      },
                      { title: "Department", dataIndex: "department" },
                      { 
                        title: "Status", 
                        dataIndex: "status",
                        render: (status) => renderStatus(status)
                      },
                      { 
                        title: "Created", 
                        dataIndex: "created_at",
                        render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
                      },
                      {
                        title: "Actions",
                        width: 80,
                        render: (_, form) => (
                          <Tooltip title="View Details">
                            <Button 
                              icon={<EyeOutlined />} 
                              size="small"
                              type="link"
                              onClick={() => setViewFormModal({ open: true, form })}
                            />
                          </Tooltip>
                        ),
                      },
                    ]}
                  />
                </Card>

                {/* Recent Payments */}
                {renderRecentPayments()}
              </TabPane>

              {/* Payments Tab */}
              <TabPane 
                tab={<span><MoneyCollectOutlined /> Payments ({studentPayments.length})</span>}
                key="payments"
              >
                <Card 
                  title="Payment Management"
                  extra={
                    <Space>
                      <Button 
                        icon={<SyncOutlined />}
                        onClick={initializePaymentMethods}
                      >
                        Initialize Default Methods
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<MoneyCollectOutlined />}
                        onClick={() => {
                          paymentMethodForm.resetFields();
                          setPaymentMethodModal({ open: true, method: null });
                        }}
                      >
                        Add Payment Method
                      </Button>
                    </Space>
                  }
                  style={{ borderRadius: 8 }}
                >
                  <Tabs defaultActiveKey="all" size="middle">
                    <TabPane tab="All Payments" key="all">
                      <Table
                        dataSource={studentPayments}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        columns={[
                          { 
                            title: "Transaction ID", 
                            dataIndex: "transaction_id",
                            width: 150,
                            render: (id) => <Tag color="blue">{id || 'N/A'}</Tag>
                          },
                          { 
                            title: "Student", 
                            dataIndex: ["student", "username"],
                            render: (text, record) => (
                              <Space direction="vertical" size={0}>
                                <Text strong>{text || 'Unknown'}</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {record.student?.email || 'No email'}
                                </Text>
                              </Space>
                            )
                          },
                          { 
                            title: "Department", 
                            dataIndex: "department_type",
                            render: (type) => renderDepartmentType(type)
                          },
                          { 
                            title: "Method", 
                            dataIndex: ["payment_method", "name"],
                            render: (method) => renderPaymentMethod(method)
                          },
                          { 
                            title: "Amount", 
                            dataIndex: "amount",
                            render: (amount) => (
                              <Text strong style={{ color: '#52c41a' }}>
                                {amount || 0} ETB
                              </Text>
                            )
                          },
                          { 
                            title: "Status", 
                            dataIndex: "status",
                            render: (status) => renderPaymentStatus(status)
                          },
                          { 
                            title: "Date", 
                            dataIndex: "created_at",
                            render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
                          },
                          {
                            title: "Actions",
                            width: 120,
                            render: (_, payment) => (
                              <Space size="small">
                                <Tooltip title="View Details">
                                  <Button 
                                    icon={<EyeOutlined />} 
                                    size="small"
                                    onClick={() => viewPaymentDetails(payment)}
                                  />
                                </Tooltip>
                                <Tooltip title="View Logs">
                                  <Button 
                                    icon={<HistoryOutlined />} 
                                    size="small"
                                    onClick={() => viewPaymentLogs(payment)}
                                  />
                                </Tooltip>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </TabPane>
                    <TabPane tab="Payment Methods" key="methods">
                      <Table
                        dataSource={paymentMethods}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        columns={[
                          { 
                            title: "Method", 
                            dataIndex: "name",
                            render: (method) => renderPaymentMethod(method)
                          },
                          { 
                            title: "Account Name", 
                            dataIndex: "account_name"
                          },
                          { 
                            title: "Account Number", 
                            dataIndex: "account_number",
                            render: (num) => num || "N/A"
                          },
                          { 
                            title: "Phone Number", 
                            dataIndex: "phone_number",
                            render: (num) => num || "N/A"
                          },
                          { 
                            title: "Status", 
                            dataIndex: "is_active",
                            render: (active) => (
                              <Tag color={active ? "success" : "error"}>
                                {active ? "ACTIVE" : "INACTIVE"}
                              </Tag>
                            )
                          },
                          { 
                            title: "Created", 
                            dataIndex: "created_at",
                            render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
                          },
                          {
                            title: "Actions",
                            width: 150,
                            render: (_, method) => (
                              <Space size="small">
                                <Tooltip title="Edit">
                                  <Button 
                                    icon={<EditOutlined />} 
                                    size="small"
                                    onClick={() => {
                                      setPaymentMethodModal({ open: true, method });
                                      paymentMethodForm.setFieldsValue({
                                        name: method.name,
                                        account_name: method.account_name,
                                        account_number: method.account_number,
                                        phone_number: method.phone_number,
                                        instructions: method.instructions,
                                        is_active: method.is_active
                                      });
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip title={method.is_active ? "Deactivate" : "Activate"}>
                                  <Button 
                                    icon={method.is_active ? <CloseCircleOutlined /> : <CheckCircleOutlined />} 
                                    size="small"
                                    type={method.is_active ? "default" : "primary"}
                                    onClick={() => togglePaymentMethodStatus(method)}
                                  />
                                </Tooltip>
                                <Popconfirm
                                  title="Delete this payment method?"
                                  description="This action cannot be undone."
                                  onConfirm={() => deletePaymentMethod(method.id)}
                                  okText="Yes"
                                  cancelText="No"
                                  okType="danger"
                                >
                                  <Tooltip title="Delete">
                                    <Button 
                                      icon={<DeleteOutlined />} 
                                      size="small" 
                                      danger
                                    />
                                  </Tooltip>
                                </Popconfirm>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </TabPane>
                  </Tabs>
                </Card>
              </TabPane>

              {/* Student Registration Tab */}
              <TabPane 
                tab={<span><FileExcelOutlined /> Student Registration ({authorizedStudents.length})</span>}
                key="studentRegistration"
              >
                <Card 
                  title="Student Registration Management"
                  extra={
                    <Space>
                      <Button 
                        icon={<DownloadOutlined />}
                        onClick={downloadCSVTemplate}
                      >
                        Download Template
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<UploadOutlined />}
                        onClick={() => setCSVUploadModal(true)}
                      >
                        Upload CSV
                      </Button>
                    </Space>
                  }
                  style={{ borderRadius: 8 }}
                >
                  <Tabs defaultActiveKey="authorized" size="middle">
                    <TabPane tab="Authorized Students" key="authorized">
                      <Table
                        dataSource={authorizedStudents}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        columns={[
                          { 
                            title: "ID Number", 
                            dataIndex: "id_number",
                            width: 120,
                            render: (id) => <Tag color="blue">{id}</Tag>
                          },
                          { 
                            title: "Name", 
                            render: (_, student) => (
                              <Text strong>{student.first_name} {student.last_name}</Text>
                            )
                          },
                          { 
                            title: "Email", 
                            dataIndex: "email",
                            render: (email) => email || "-"
                          },
                          { 
                            title: "College", 
                            dataIndex: "college_name",
                            render: (name) => name || "-"
                          },
                          { 
                            title: "Department", 
                            dataIndex: "department_name",
                            render: (name) => name || "-"
                          },
                          { 
                            title: "Status", 
                            render: (_, student) => (
                              <Space>
                                <Tag color={student.is_active ? "success" : "error"}>
                                  {student.is_active ? "ACTIVE" : "INACTIVE"}
                                </Tag>
                                <Tag color={student.is_registered ? "green" : "orange"}>
                                  {student.is_registered ? "REGISTERED" : "PENDING"}
                                </Tag>
                              </Space>
                            )
                          },
                          { 
                            title: "Registered", 
                            dataIndex: "registration_date",
                            render: (date) => date ? dayjs(date).format('MMM D, YYYY') : "-"
                          },
                          {
                            title: "Actions",
                            width: 120,
                            render: (_, student) => (
                              <Space size="small">
                                <Tooltip title={student.is_active ? "Deactivate" : "Activate"}>
                                  <Button 
                                    icon={student.is_active ? <CloseCircleOutlined /> : <CheckCircleOutlined />} 
                                    size="small"
                                    type={student.is_active ? "default" : "primary"}
                                    onClick={() => toggleStudentStatus(student)}
                                  />
                                </Tooltip>
                                {!student.is_registered && (
                                  <Popconfirm
                                    title="Delete this student?"
                                    description="This action cannot be undone."
                                    onConfirm={() => deleteAuthorizedStudent(student.id)}
                                    okText="Yes"
                                    cancelText="No"
                                    okType="danger"
                                  >
                                    <Tooltip title="Delete">
                                      <Button 
                                        icon={<DeleteOutlined />} 
                                        size="small" 
                                        danger
                                      />
                                    </Tooltip>
                                  </Popconfirm>
                                )}
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </TabPane>
                    <TabPane tab="CSV Uploads" key="uploads">
                      <Table
                        dataSource={csvUploads}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        columns={[
                          { 
                            title: "Filename", 
                            dataIndex: "filename",
                            render: (name) => <Text strong>{name}</Text>
                          },
                          { 
                            title: "Uploaded By", 
                            dataIndex: ["uploaded_by", "username"]
                          },
                          { 
                            title: "Records", 
                            render: (_, upload) => (
                              <Space>
                                <Text strong style={{ color: '#52c41a' }}>{upload.successful_records || 0}</Text>
                                <Text>/</Text>
                                <Text>{upload.total_records || 0}</Text>
                              </Space>
                            )
                          },
                          { 
                            title: "Failed", 
                            dataIndex: "failed_records",
                            render: (count) => count > 0 ? (
                              <Text type="danger" strong>{count || 0}</Text>
                            ) : (
                              <Text type="success">0</Text>
                            )
                          },
                          { 
                            title: "Date", 
                            dataIndex: "created_at",
                            render: (date) => date ? dayjs(date).format('MMM D, YYYY HH:mm') : 'N/A'
                          },
                          {
                            title: "Actions",
                            width: 80,
                            render: (_, upload) => (
                              <Popconfirm
                                title="Delete this upload?"
                                description="This will also delete all associated students that are not registered."
                                onConfirm={() => deleteCSVUpload(upload.id)}
                                okText="Yes"
                                cancelText="No"
                                okType="danger"
                              >
                                <Tooltip title="Delete">
                                  <Button 
                                    icon={<DeleteOutlined />} 
                                    size="small" 
                                    danger
                                  />
                                </Tooltip>
                              </Popconfirm>
                            ),
                          },
                        ]}
                      />
                    </TabPane>
                  </Tabs>
                </Card>
              </TabPane>

              {/* Users Tab */}
              <TabPane 
                tab={<span><TeamOutlined /> Users ({users.length})</span>}
                key="users"
              >
                <Card 
                  title="User Management"
                  extra={
                    <Button 
                      type="primary" 
                      icon={<UserAddOutlined />} 
                      onClick={() => {
                        createUserForm.resetFields();
                        setCreateUserOpen(true);
                      }}
                    >
                      Add User
                    </Button>
                  }
                  style={{ borderRadius: 8 }}
                >
                  <Table
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      { 
                        title: "ID", 
                        dataIndex: "id", 
                        width: 60,
                        render: (id) => <Tag color="blue">#{id}</Tag>
                      },
                      { 
                        title: "User", 
                        dataIndex: "username",
                        render: (text, record) => (
                          <Space direction="vertical" size={0}>
                            <Text strong>{text}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {record.email}
                            </Text>
                          </Space>
                        )
                      },
                      { 
                        title: "Role", 
                        dataIndex: "role",
                        render: (role) => renderRoleTag(role)
                      },
                      { 
                        title: "Department", 
                        dataIndex: "department_name",
                        render: (name) => name || "-"
                      },
                      { 
                        title: "Status", 
                        dataIndex: "is_blocked",
                        render: (_, user) => renderUserStatus(user)
                      },
                      {
                        title: "Actions",
                        width: 150,
                        render: (_, user) => (
                          <Space size="small">
                            <Tooltip title="View Details">
                              <Button 
                                icon={<EyeOutlined />} 
                                size="small"
                                onClick={() => setViewUserModal({ open: true, user })}
                              />
                            </Tooltip>
                            <Tooltip title="Edit">
                              <Button 
                                icon={<EditOutlined />} 
                                size="small"
                                onClick={() => {
                                  setUserModal({ open: true, user });
                                  userForm.setFieldsValue({
                                    username: user.username,
                                    email: user.email,
                                    role: user.role,
                                    department: user.department,
                                    is_blocked: user.is_blocked
                                  });
                                }}
                              />
                            </Tooltip>
                            <Tooltip title={user.is_blocked ? "Unblock" : "Block"}>
                              <Button 
                                icon={user.is_blocked ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 
                                size="small"
                                type={user.is_blocked ? "primary" : "danger"}
                                onClick={() => toggleUserBlock(user)}
                              />
                            </Tooltip>
                            <Popconfirm
                              title="Delete this user?"
                              description="This action cannot be undone."
                              onConfirm={() => deleteUser(user.id)}
                              okText="Yes"
                              cancelText="No"
                              okType="danger"
                            >
                              <Tooltip title="Delete">
                                <Button 
                                  icon={<DeleteOutlined />} 
                                  size="small" 
                                  danger
                                />
                              </Tooltip>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </TabPane>

              {/* Colleges Tab */}
              <TabPane 
                tab={<span><BankOutlined /> Colleges ({colleges.length})</span>}
                key="colleges"
              >
                <Card 
                  title="College Management"
                  extra={
                    <Button 
                      icon={<BankOutlined />} 
                      onClick={() => {
                        setCollegeEdit(null);
                        collegeForm.resetFields();
                        setCollegeOpen(true);
                      }}
                    >
                      Add College
                    </Button>
                  }
                  style={{ borderRadius: 8 }}
                >
                  <Table
                    dataSource={colleges}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      { 
                        title: "ID", 
                        dataIndex: "id", 
                        width: 60,
                        render: (id) => <Tag color="green">#{id}</Tag>
                      },
                      { title: "Name", dataIndex: "name" },
                      { 
                        title: "Created", 
                        dataIndex: "created_at",
                        render: (date) => date ? dayjs(date).format('MMM D, YYYY') : "-"
                      },
                      {
                        title: "Actions",
                        width: 100,
                        render: (_, college) => (
                          <Space size="small">
                            <Tooltip title="Edit">
                              <Button 
                                icon={<EditOutlined />} 
                                size="small"
                                onClick={() => openEditCollege(college)}
                              />
                            </Tooltip>
                            <Popconfirm
                              title="Delete this college?"
                              description="This will also delete all associated departments."
                              onConfirm={() => deleteCollege(college.id)}
                              okText="Yes"
                              cancelText="No"
                              okType="danger"
                            >
                              <Tooltip title="Delete">
                                <Button 
                                  icon={<DeleteOutlined />} 
                                  size="small" 
                                  danger
                                />
                              </Tooltip>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </TabPane>

              {/* Departments Tab */}
              <TabPane 
                tab={<span><ShopOutlined /> Departments ({departments.length})</span>}
                key="departments"
              >
                <Card 
                  title="Department Management"
                  extra={
                    <Button 
                      icon={<ShopOutlined />} 
                      onClick={() => {
                        setDeptEdit(null);
                        deptForm.resetFields();
                        setDeptOpen(true);
                      }}
                    >
                      Add Department
                    </Button>
                  }
                  style={{ borderRadius: 8 }}
                >
                  <Table
                    dataSource={departments}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      { 
                        title: "ID", 
                        dataIndex: "id", 
                        width: 60,
                        render: (id) => <Tag color="purple">#{id}</Tag>
                      },
                      { title: "Name", dataIndex: "name" },
                      { 
                        title: "College", 
                        dataIndex: "college_name",
                        render: (name) => name || "-"
                      },
                      { 
                        title: "Created", 
                        dataIndex: "created_at",
                        render: (date) => date ? dayjs(date).format('MMM D, YYYY') : "-"
                      },
                      {
                        title: "Actions",
                        width: 100,
                        render: (_, dept) => (
                          <Space size="small">
                            <Tooltip title="Edit">
                              <Button 
                                icon={<EditOutlined />} 
                                size="small"
                                onClick={() => openEditDepartment(dept)}
                              />
                            </Tooltip>
                            <Popconfirm
                              title="Delete this department?"
                              onConfirm={() => deleteDepartment(dept.id)}
                              okText="Yes"
                              cancelText="No"
                              okType="danger"
                            >
                              <Tooltip title="Delete">
                                <Button 
                                  icon={<DeleteOutlined />} 
                                  size="small" 
                                  danger
                                />
                              </Tooltip>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </TabPane>

              {/* Forms Tab */}
              <TabPane 
                tab={<span><FileTextOutlined /> Forms ({forms.length})</span>}
                key="forms"
              >
                <Card title="Clearance Forms Management" style={{ borderRadius: 8 }}>
                  <Table
                    dataSource={forms}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      { 
                        title: "ID", 
                        dataIndex: "id", 
                        width: 60,
                        render: (id) => <Tag color="blue">#{id}</Tag>
                      },
                      { 
                        title: "Student", 
                        dataIndex: "student_name",
                        render: (text, record) => (
                          <Space direction="vertical" size={0}>
                            <Text strong>{text || 'Unknown'}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {record.student_email || 'No email'}
                            </Text>
                          </Space>
                        )
                      },
                      { title: "Department", dataIndex: "department" },
                      { 
                        title: "Status", 
                        dataIndex: "status",
                        render: (status) => renderStatus(status)
                      },
                      { 
                        title: "Created", 
                        dataIndex: "created_at",
                        render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
                      },
                      {
                        title: "Actions",
                        width: 150,
                        render: (_, form) => (
                          <Space size="small">
                            <Tooltip title="View Details">
                              <Button 
                                icon={<EyeOutlined />} 
                                size="small"
                                onClick={() => setViewFormModal({ open: true, form })}
                              />
                            </Tooltip>
                            {form.status !== "completed" && form.status !== "rejected" && (
                              <Select
                                size="small"
                                style={{ width: 140 }}
                                placeholder="Change Status"
                                onChange={(value) => updateFormStatus(form.id, value)}
                              >
                                <Option value="pending_department">Pending Dept</Option>
                                <Option value="approved_department">Approve Dept</Option>
                                <Option value="approved_library">Approve Library</Option>
                                <Option value="approved_cafeteria">Approve Cafeteria</Option>
                                <Option value="approved_dormitory">Approve Dormitory</Option>
                                <Option value="approved_registrar">Approve Registrar</Option>
                                <Option value="Cleared by Registrar">Cleared</Option>
                                <Option value="completed">Complete</Option>
                                <Option value="rejected">Reject</Option>
                              </Select>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </TabPane>

              {/* System Tab */}
              <TabPane 
                tab={<span><SettingOutlined /> System</span>}
                key="system"
              >
                <Card 
                  title="System Control"
                  extra={
                    <Button 
                      icon={<SettingOutlined />}
                      onClick={() => {
                        if (systemControls.length > 0) {
                          systemControlForm.setFieldsValue({
                            is_open: systemControls[0].is_open,
                            maintenance_message: systemControls[0].maintenance_message || ""
                          });
                        }
                        setSystemControlOpen(true);
                      }}
                    >
                      Edit System Settings
                    </Button>
                  }
                  style={{ borderRadius: 8 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <Switch 
                          checked={systemControls[0]?.is_open || false} 
                          onChange={toggleSystem}
                          checkedChildren="System Open"
                          unCheckedChildren="System Closed"
                          size="large"
                          style={{ transform: 'scale(1.2)' }}
                        />
                        <Text strong style={{ fontSize: '16px' }}>
                          System is currently: 
                          <Tag 
                            color={systemControls[0]?.is_open ? "success" : "error"} 
                            style={{ marginLeft: 8, fontSize: '14px', padding: '4px 8px' }}
                          >
                            {systemControls[0]?.is_open ? "OPEN" : "CLOSED"}
                          </Tag>
                        </Text>
                      </div>
                      
                      {systemControls[0]?.maintenance_message && !systemControls[0]?.is_open && (
                        <Alert
                          message="Maintenance Message"
                          description={systemControls[0].maintenance_message}
                          type="warning"
                          showIcon
                          icon={<WarningOutlined />}
                          style={{ borderRadius: 8 }}
                        />
                      )}
                    </div>

                    <Divider />

                    <div>
                      <Title level={5}>System Information</Title>
                      {systemControls[0] ? (
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="System Status">
                            {systemControls[0].is_open ? (
                              <Tag color="green" icon={<CheckCircleOutlined />}>Operational</Tag>
                            ) : (
                              <Tag color="red" icon={<CloseCircleOutlined />}>Under Maintenance</Tag>
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="Last Updated">
                            {systemControls[0].updated_at ? dayjs(systemControls[0].updated_at).format('MMM D, YYYY HH:mm:ss') : 'N/A'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Created">
                            {systemControls[0].created_at ? dayjs(systemControls[0].created_at).format('MMM D, YYYY') : 'N/A'}
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Alert
                          message="No system control settings found"
                          description="Click 'Edit System Settings' to create system control configuration."
                          type="info"
                          style={{ borderRadius: 8 }}
                        />
                      )}
                    </div>
                  </div>
                </Card>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* ==================== MODALS ==================== */}
      
      {/* Create User Modal */}
      <Modal
        title={<span><UserAddOutlined /> Create Staff User</span>}
        open={createUserOpen}
        onOk={() => {
          createUserForm.validateFields().then(values => {
            createStaff(values);
          });
        }}
        onCancel={() => {
          setCreateUserOpen(false);
          createUserForm.resetFields();
        }}
        okText="Create"
        cancelText="Cancel"
        width={500}
        okButtonProps={{ icon: <CheckOutlined /> }}
      >
        <Form form={createUserForm} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Enter username" size="large" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password placeholder="Enter password" size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Enter email" size="large" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select role" size="large">
              {ROLE_OPTIONS.filter(r => r.value !== "student").map((r) => (
                <Option key={r.value} value={r.value}>
                  <Space>
                    {r.icon}
                    {r.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item 
            noStyle 
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) => 
              getFieldValue('role') === 'departmenthead' ? (
                <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                  <Select placeholder="Select department" size="large">
                    {departments.map((d) => (
                      <Option key={d.id} value={d.id}>{d.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title={<span><EditOutlined /> Edit User</span>}
        open={userModal.open}
        onOk={() => {
          userForm.validateFields().then(values => {
            updateUser(userModal.user.id, values);
          });
        }}
        onCancel={() => {
          setUserModal({ open: false, user: null });
          userForm.resetFields();
        }}
        okText="Update"
        cancelText="Cancel"
        width={500}
        okButtonProps={{ icon: <CheckOutlined /> }}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select size="large">
              {ROLE_OPTIONS.filter(r => r.value !== "student").map((r) => (
                <Option key={r.value} value={r.value}>
                  <Space>
                    {r.icon}
                    {r.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Select allowClear placeholder="Select department" size="large">
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="is_blocked" label="Account Status" valuePropName="checked">
            <Switch 
              checkedChildren="Blocked" 
              unCheckedChildren="Active" 
              size="large"
              style={{ transform: 'scale(1.1)' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Department Modal */}
      <Modal
        title={deptEdit ? <span><EditOutlined /> Edit Department</span> : <span><ShopOutlined /> Create Department</span>}
        open={deptOpen}
        onOk={() => {
          deptForm.validateFields().then(values => {
            saveDepartment(values);
          });
        }}
        onCancel={() => {
          setDeptOpen(false);
          setDeptEdit(null);
          deptForm.resetFields();
        }}
        okText={deptEdit ? "Update" : "Create"}
        cancelText="Cancel"
        width={500}
        okButtonProps={{ icon: <CheckOutlined /> }}
      >
        <Form form={deptForm} layout="vertical">
          <Form.Item name="name" label="Department Name" rules={[{ required: true }]}>
            <Input placeholder="Enter department name" size="large" />
          </Form.Item>
          <Form.Item name="college" label="College">
            <Select allowClear placeholder="Select college (optional)" size="large">
              {colleges.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* College Modal */}
      <Modal
        title={collegeEdit ? <span><EditOutlined /> Edit College</span> : <span><BankOutlined /> Create College</span>}
        open={collegeOpen}
        onOk={() => {
          collegeForm.validateFields().then(values => {
            saveCollege(values);
          });
        }}
        onCancel={() => {
          setCollegeOpen(false);
          setCollegeEdit(null);
          collegeForm.resetFields();
        }}
        okText={collegeEdit ? "Update" : "Create"}
        cancelText="Cancel"
        width={500}
        okButtonProps={{ icon: <CheckOutlined /> }}
      >
        <Form form={collegeForm} layout="vertical">
          <Form.Item name="name" label="College Name" rules={[{ required: true }]}>
            <Input placeholder="Enter college name" size="large" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Method Modal */}
<Modal
  title={paymentMethodModal.method ? 
    <span><EditOutlined /> Edit Payment Method</span> : 
    <span><MoneyCollectOutlined /> Add Payment Method</span>
  }
  open={paymentMethodModal.open}
  onOk={() => {
    paymentMethodForm.validateFields().then(values => {
      savePaymentMethod(values);
    });
  }}
  onCancel={() => {
    setPaymentMethodModal({ open: false, method: null });
    paymentMethodForm.resetFields();
  }}
  okText={paymentMethodModal.method ? "Update" : "Create"}
  cancelText="Cancel"
  width={600}
  okButtonProps={{ icon: <CheckOutlined /> }}
>
  <Form form={paymentMethodForm} layout="vertical">
    <Form.Item 
      name="name" 
      label="Payment Method Name" 
      rules={[{ required: true, message: "Please enter payment method name" }]}
    >
      <Input 
        placeholder="e.g., Telebirr, CBE Bank, Awash Bank" 
        size="large" 
      />
    </Form.Item>
    
    <Form.Item 
      name="bank_name" 
      label="Bank Name (Optional)"
    >
      <Input 
        placeholder="e.g., Commercial Bank of Ethiopia" 
        size="large" 
      />
    </Form.Item>
    
    <Form.Item 
      name="account_name" 
      label="Account Name" 
      rules={[{ required: true, message: "Please enter account name" }]}
    >
      <Input 
        placeholder="e.g., Mekdela Amba University" 
        size="large" 
      />
    </Form.Item>
    
    <Form.Item 
      name="account_number" 
      label="Account Number"
      rules={[{ required: true, message: "Please enter account number" }]}
    >
      <Input 
        placeholder="e.g., 1000225566778" 
        size="large" 
      />
    </Form.Item>
    
    <Form.Item 
      name="phone_number" 
      label="Phone Number (Optional)"
    >
      <Input 
        placeholder="e.g., 0918114545" 
        size="large" 
      />
    </Form.Item>
    
    <Form.Item 
      name="instructions" 
      label="Payment Instructions" 
      rules={[{ required: true, message: "Please enter payment instructions" }]}
    >
      <TextArea 
        rows={4} 
        placeholder="Enter detailed payment instructions for students..."
        size="large"
      />
    </Form.Item>
    
    <Form.Item 
      name="is_active" 
      label="Status" 
      valuePropName="checked" 
      initialValue={true}
    >
      <Switch 
        checkedChildren="Active" 
        unCheckedChildren="Inactive" 
        size="large"
        style={{ transform: 'scale(1.1)' }}
      />
    </Form.Item>
  </Form>
</Modal>

      {/* View Payment Details Modal */}
      <Modal
        title={<span><EyeOutlined /> Payment Details</span>}
        open={viewPaymentModal.open}
        onCancel={() => setViewPaymentModal({ open: false, payment: null })}
        footer={[
          <Button key="close" onClick={() => setViewPaymentModal({ open: false, payment: null })}>
            Close
          </Button>
        ]}
        width={700}
      >
        {viewPaymentModal.payment && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Transaction ID" span={2}>
              <Tag color="blue">{viewPaymentModal.payment.transaction_id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Student Name">
              <Text strong>{viewPaymentModal.payment.student?.username || 'Unknown'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Student Email">
              {viewPaymentModal.payment.student?.email || 'No email'}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {renderDepartmentType(viewPaymentModal.payment.department_type)}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">
              {renderPaymentMethod(viewPaymentModal.payment.payment_method?.name)}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                {viewPaymentModal.payment.amount || 0} ETB
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              {renderPaymentStatus(viewPaymentModal.payment.status)}
            </Descriptions.Item>
            {viewPaymentModal.payment.phone_number && (
              <Descriptions.Item label="Phone Number">
                {viewPaymentModal.payment.phone_number}
              </Descriptions.Item>
            )}
            {viewPaymentModal.payment.account_last_digits && (
              <Descriptions.Item label="Account Last Digits">
                ****{viewPaymentModal.payment.account_last_digits}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Payment Date">
              {viewPaymentModal.payment.payment_date ? dayjs(viewPaymentModal.payment.payment_date).format('MMM D, YYYY') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {viewPaymentModal.payment.created_at ? dayjs(viewPaymentModal.payment.created_at).format('MMM D, YYYY HH:mm') : 'N/A'}
            </Descriptions.Item>
            {viewPaymentModal.payment.verified_at && (
              <Descriptions.Item label="Verified At">
                {dayjs(viewPaymentModal.payment.verified_at).format('MMM D, YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {viewPaymentModal.payment.verified_by && (
              <Descriptions.Item label="Verified By">
                {viewPaymentModal.payment.verified_by?.username || 'System'}
              </Descriptions.Item>
            )}
            {viewPaymentModal.payment.rejection_reason && (
              <Descriptions.Item label="Rejection Reason" span={2}>
                <Alert
                  message={viewPaymentModal.payment.rejection_reason}
                  type="error"
                  showIcon
                />
              </Descriptions.Item>
            )}
            {viewPaymentModal.payment.receipt_file && (
              <Descriptions.Item label="Receipt" span={2}>
                <Image
                  width={200}
                  src={viewPaymentModal.payment.receipt_file}
                  alt="Payment Receipt"
                  style={{ borderRadius: 8 }}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Payment Logs Modal */}
      <Modal
        title={<span><HistoryOutlined /> Payment Verification Logs</span>}
        open={paymentLogsModal.open}
        onCancel={() => setPaymentLogsModal({ open: false, payment: null, logs: [] })}
        footer={[
          <Button key="close" onClick={() => setPaymentLogsModal({ open: false, payment: null, logs: [] })}>
            Close
          </Button>
        ]}
        width={800}
      >
        {paymentLogsModal.payment && (
          <>
            <div style={{ marginBottom: 24 }}>
              <Text strong>Transaction: </Text>
              <Tag color="blue">{paymentLogsModal.payment.transaction_id}</Tag>
              <Text strong style={{ marginLeft: 16 }}>Amount: </Text>
              <Text strong style={{ color: '#52c41a' }}>
                {paymentLogsModal.payment.amount || 0} ETB
              </Text>
            </div>
            
            <List
              dataSource={paymentLogsModal.logs || []}
              renderItem={(log) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={log.action === 'verify' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 
                              style={{ backgroundColor: log.action === 'verify' ? '#52c41a' : '#ff4d4f' }} />
                    }
                    title={
                      <Space>
                        <Text strong>{log.verified_by?.username || 'System'}</Text>
                        <Tag color={log.action === 'verify' ? 'success' : 'error'}>
                          {log.action?.toUpperCase?.() || 'UNKNOWN'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <>
                        <Text>{log.note}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {log.created_at ? dayjs(log.created_at).format('MMM D, YYYY HH:mm:ss') : 'N/A'}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        title={<span><UploadOutlined /> Upload Student CSV</span>}
        open={csvUploadModal}
        onOk={() => {
          if (csvFile) {
            uploadCSVFile(csvFile);
          } else {
            message.error("Please select a CSV file first");
          }
        }}
        onCancel={() => {
          setCSVUploadModal(false);
          setCSVFile(null);
        }}
        okText="Upload"
        cancelText="Cancel"
        confirmLoading={csvUploading}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <Alert
            message="CSV Upload Requirements"
            description={
              <div>
                <p>Your CSV file must have these columns in order:</p>
                <ul>
                  <li><strong>first_name</strong> - Student's first name</li>
                  <li><strong>last_name</strong> - Student's last name</li>
                  <li><strong>email</strong> - Student's email address (must be unique)</li>
                  <li><strong>id_number</strong> - Student's ID number (must be unique)</li>
                  <li><strong>college</strong> - College name (must exist in system)</li>
                  <li><strong>department</strong> - Department name (must exist in system and belong to college)</li>
                </ul>
                <p>Download the template to see the correct format.</p>
              </div>
            }
            type="info"
            style={{ marginBottom: 20 }}
          />
          
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed #d9d9d9', borderRadius: 8 }}>
            {csvFile ? (
              <div>
                <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                <div>
                  <Text strong>{csvFile.name}</Text>
                  <br />
                  <Text type="secondary">
                    {(csvFile.size / 1024).toFixed(2)} KB
                  </Text>
                </div>
                <Button 
                  type="link" 
                  onClick={() => setCSVFile(null)}
                  style={{ marginTop: 16 }}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <Upload.Dragger
                accept=".csv"
                showUploadList={false}
                beforeUpload={(file) => {
                  setCSVFile(file);
                  return false; // Prevent automatic upload
                }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">Click or drag CSV file to upload</p>
                <p className="ant-upload-hint">Only .csv files are supported</p>
              </Upload.Dragger>
            )}
          </div>
          
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Button 
              type="link" 
              icon={<DownloadOutlined />}
              onClick={downloadCSVTemplate}
            >
              Download CSV Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* System Control Modal */}
      <Modal
        title={<span><SettingOutlined /> System Control Settings</span>}
        open={systemControlOpen}
        onOk={() => {
          systemControlForm.validateFields().then(values => {
            saveSystemControl(values);
          });
        }}
        onCancel={() => {
          setSystemControlOpen(false);
          systemControlForm.resetFields();
        }}
        okText="Save"
        cancelText="Cancel"
        width={500}
        okButtonProps={{ icon: <CheckOutlined /> }}
      >
        <Form form={systemControlForm} layout="vertical">
          <Form.Item name="is_open" label="System Status" valuePropName="checked">
            <Switch 
              checkedChildren="Open" 
              unCheckedChildren="Closed" 
              size="large"
              style={{ transform: 'scale(1.1)' }}
            />
          </Form.Item>
          <Form.Item 
            noStyle 
            shouldUpdate={(prevValues, currentValues) => prevValues.is_open !== currentValues.is_open}
          >
            {({ getFieldValue }) => 
              !getFieldValue('is_open') ? (
                <Form.Item name="maintenance_message" label="Maintenance Message">
                  <TextArea rows={3} placeholder="Enter maintenance message" size="large" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* Efficiency Modal */}
      <Modal
        title={<span><LineChartOutlined /> System Efficiency Details</span>}
        open={efficiencyModal}
        onCancel={() => setEfficiencyModal(false)}
        footer={[
          <Button key="close" onClick={() => setEfficiencyModal(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Overall Efficiency" span={2}>
            <Progress 
              percent={stats.efficiency || calculateSystemEfficiency()} 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              size="small"
            />
          </Descriptions.Item>
          <Descriptions.Item label="Avg. Processing Time">
            {stats.avg_processing_time || "0"} days
          </Descriptions.Item>
          <Descriptions.Item label="Weekly Trend">
            <Tag color={stats.weekly_trend?.startsWith?.('+') ? "green" : "red"}>
              {stats.weekly_trend || "+0%"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Forms Today">
            {stats.today_forms || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Total Forms Processed">
            {stats.total_forms || forms.length}
          </Descriptions.Item>
          <Descriptions.Item label="Approval Rate">
            {Math.round((stats.approved_forms / (stats.total_forms || forms.length)) * 100) || 0}%
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      {/* View Form Modal */}
      <Modal
        title={<span><FileTextOutlined /> Form Details</span>}
        open={viewFormModal.open}
        onCancel={() => setViewFormModal({ open: false, form: null })}
        footer={[
          <Button key="close" onClick={() => setViewFormModal({ open: false, form: null })}>
            Close
          </Button>
        ]}
        width={700}
      >
        {viewFormModal.form && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Form ID" span={2}>
              <Tag color="blue">#{viewFormModal.form.id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Student Name">
              <Text strong>{viewFormModal.form.student_name || 'Unknown'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Student Email">
              {viewFormModal.form.student_email || 'No email'}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {viewFormModal.form.department || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              {renderStatus(viewFormModal.form.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Created" span={2}>
              {viewFormModal.form.created_at ? dayjs(viewFormModal.form.created_at).format('MMMM D, YYYY HH:mm:ss') : 'N/A'}
            </Descriptions.Item>
            {viewFormModal.form.reason && (
              <Descriptions.Item label="Clearance Reason" span={2}>
                <Text type="secondary">{viewFormModal.form.reason}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* View User Modal */}
      <Modal
        title={<span><TeamOutlined /> User Details</span>}
        open={viewUserModal.open}
        onCancel={() => setViewUserModal({ open: false, user: null })}
        footer={[
          <Button key="close" onClick={() => setViewUserModal({ open: false, user: null })}>
            Close
          </Button>
        ]}
        width={600}
      >
        {viewUserModal.user && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="User ID" span={2}>
              <Tag color="blue">#{viewUserModal.user.id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Username">
              <Text strong>{viewUserModal.user.username}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {viewUserModal.user.email}
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              {renderRoleTag(viewUserModal.user.role)}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {viewUserModal.user.department || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              {renderUserStatus(viewUserModal.user)}
            </Descriptions.Item>
            <Descriptions.Item label="Last Login" span={2}>
              {viewUserModal.user.last_login || "Never logged in"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}