import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Typography,
  Input,
  Modal,
  Spin,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  message,
  Alert,
  Descriptions,
  Table,
  Badge,
  Steps,
  Tooltip,
  Popconfirm,
  notification,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Tabs,
  Divider,
  Dropdown,
  Menu,
} from "antd";
import { 
  LogoutOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  CoffeeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  HistoryOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DatabaseOutlined,
  ShopOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  DollarCircleOutlined,
  CheckSquareOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Option } = Select;
const API_BASE = "http://127.0.0.1:8000/api/";

export default function CafeteriaPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [rejectAction, setRejectAction] = useState('reject_only');
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReason, setPaymentReason] = useState("");
  const [viewModal, setViewModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [duesModal, setDuesModal] = useState(false);
  const [mealDues, setMealDues] = useState({
    has_meal_dues: false,
    dues: [],
    total_amount: 0,
    can_approve: true,
    student_info: null
  });
  const [checkingDues, setCheckingDues] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  
  // ================= MEAL DUES REGISTRATION SYSTEM =================
  const [duesRegistrationModal, setDuesRegistrationModal] = useState(false);
  const [dueStudents, setDueStudents] = useState([]);
  const [dueSearchId, setDueSearchId] = useState("");
  const [dueSearchName, setDueSearchName] = useState("");
  const [loadingDues, setLoadingDues] = useState(false);
  const [registerDueModal, setRegisterDueModal] = useState(false);
  const [editingDue, setEditingDue] = useState(null);

  // ================= PAYMENT VERIFICATION STATE =================
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  // ================= AUTH =================
  useEffect(() => {
    const stored = sessionStorage.getItem("ucs_current");
    if (!stored) {
      message.error("Please login first");
      navigate("/login");
      return;
    }
    
    const parsed = JSON.parse(stored);
    if (parsed.role !== "cafeteria") {
      message.error("Access denied. Cafeteria only.");
      navigate("/login");
      return;
    }
    
    setUser(parsed);
    setToken(parsed.token);
    loadForms(parsed.token);
    loadDueStudents();
    // Don't load pending payments count initially - wait for token to be set
  }, [navigate]);

  // ================= LOAD PENDING PAYMENTS COUNT =================
  const loadPendingPaymentsCount = async () => {
    if (!token) {
      console.log("No token available for payment count");
      return;
    }
    
    try {
      const res = await axios.get(`${API_BASE}payment/pending/`, {
        headers: { 
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.data && Array.isArray(res.data)) {
        const cafeteriaPayments = res.data.filter(payment => 
          payment.department_type === 'cafeteria'
        );
        setPendingPaymentsCount(cafeteriaPayments.length);
      }
    } catch (err) {
      console.error("Error loading pending payments count:", err);
      // Don't show error message for unauthorized - just set count to 0
      if (err.response?.status === 401) {
        console.log("Payment endpoint unauthorized - cafeteria may not have access");
        setPendingPaymentsCount(0);
      } else {
        console.log("Failed to load payment count, setting to 0");
        setPendingPaymentsCount(0);
      }
    }
  };

  // ================= PAYMENT VERIFICATION DROPDOWN MENU =================
  const paymentVerificationMenu = (
    <Menu
      onClick={({ key }) => {
        if (key === "payment-verification") {
          // Store current cafeteria data and navigate
          sessionStorage.setItem("payment_verification_dept", "cafeteria");
          navigate("/staff/payments");
        }
        if (key === "clearance-forms") {
          loadForms(token);
        }
        if (key === "dues-registry") {
          setDuesRegistrationModal(true);
        }
      }}
      items={[
        {
          key: 'payment-verification',
          label: (
            <Space>
              <CheckSquareOutlined />
              <span>Payment Verification</span>
              {pendingPaymentsCount > 0 && (
                <Badge count={pendingPaymentsCount} size="small" />
              )}
            </Space>
          ),
        },
        {
          key: 'clearance-forms',
          label: (
            <Space>
              <FileTextOutlined />
              <span>Clearance Forms</span>
              {stats.pending > 0 && (
                <Badge count={stats.pending} size="small" />
              )}
            </Space>
          ),
        },
        {
          key: 'dues-registry',
          label: (
            <Space>
              <DatabaseOutlined />
              <span>Dues Registry</span>
              {dueStudents.length > 0 && (
                <Badge count={dueStudents.length} size="small" />
              )}
            </Space>
          ),
        },
      ]}
    />
  );

  // ================= LOAD FORMS =================
  const loadForms = async (authToken) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}cafeteria/forms/`, {
        headers: { 
          Authorization: `Token ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data && Array.isArray(res.data)) {
        // NO AUTOMATIC DUES CHECKING
        setForms(res.data);
        calculateStats(res.data);
      } else {
        setForms([]);
        calculateStats([]);
      }
    } catch (err) {
      console.error("Load forms error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        message.error("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 500) {
        message.error("Server error. Please contact administrator.");
      } else {
        message.error("Failed to load forms. Please try again.");
      }
      setForms([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      // Load payment count after forms are loaded
      loadPendingPaymentsCount();
    }
  };

  // ================= LOAD DUE STUDENTS =================
  const loadDueStudents = async () => {
    try {
      setLoadingDues(true);
      const savedDues = localStorage.getItem("cafeteria_due_students");
      if (savedDues) {
        setDueStudents(JSON.parse(savedDues));
      } else {
        // Start with empty registry
        setDueStudents([]);
      }
    } catch (err) {
      console.error("Error loading due students:", err);
      message.error("Failed to load due students list.");
      setDueStudents([]);
    } finally {
      setLoadingDues(false);
    }
  };

  // ================= SAVE DUE STUDENTS =================
  const saveDueStudents = (dues) => {
    localStorage.setItem("cafeteria_due_students", JSON.stringify(dues));
    setDueStudents(dues);
  };

  // ================= REGISTER NEW DUE =================
  const registerNewDue = async (values) => {
    try {
      const newDue = {
        id: Date.now(),
        student_id: values.student_id,
        student_name: values.student_name,
        description: values.description,
        amount: values.amount || 0,
        due_date: values.due_date.format('YYYY-MM-DD'),
        status: dayjs(values.due_date).isBefore(dayjs()) ? 'overdue' : 'due_soon',
        registered_date: dayjs().format('YYYY-MM-DD'),
        registered_by: user?.username || 'cafeteria'
      };

      const updatedDues = [...dueStudents, newDue];
      saveDueStudents(updatedDues);
      
      message.success("Meal due registered successfully!");
      setRegisterDueModal(false);
      form.resetFields();
      
    } catch (err) {
      console.error("Error registering due:", err);
      message.error("Failed to register due.");
    }
  };

  // ================= UPDATE DUE =================
  const updateDue = async (values) => {
    try {
      const updatedDue = {
        ...editingDue,
        student_id: values.student_id,
        student_name: values.student_name,
        description: values.description,
        amount: values.amount || 0,
        due_date: values.due_date.format('YYYY-MM-DD'),
        status: dayjs(values.due_date).isBefore(dayjs()) ? 'overdue' : 'due_soon'
      };

      const updatedDues = dueStudents.map(due => 
        due.id === editingDue.id ? updatedDue : due
      );
      saveDueStudents(updatedDues);
      
      message.success("Due updated successfully!");
      setRegisterDueModal(false);
      setEditingDue(null);
      form.resetFields();
      
    } catch (err) {
      console.error("Error updating due:", err);
      message.error("Failed to update due.");
    }
  };

  // ================= DELETE DUE =================
  const deleteDue = (id) => {
    Modal.confirm({
      title: 'Delete Due Record',
      content: 'Are you sure you want to delete this due record?',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        const updatedDues = dueStudents.filter(due => due.id !== id);
        saveDueStudents(updatedDues);
        message.success("Due record deleted successfully!");
      }
    });
  };

  // ================= SEARCH DUE STUDENTS =================
  const searchDueStudents = () => {
    if (!dueSearchId.trim() && !dueSearchName.trim()) {
      return dueStudents;
    }
    
    return dueStudents.filter(due => 
      (dueSearchId && due.student_id.toLowerCase().includes(dueSearchId.toLowerCase())) ||
      (dueSearchName && due.student_name.toLowerCase().includes(dueSearchName.toLowerCase()))
    );
  };

  // ================= CHECK IF STUDENT HAS DUE =================
  const checkIfStudentHasDue = (studentId) => {
    return dueStudents.some(due => 
      due.student_id === studentId && 
      (due.status === 'overdue' || due.status === 'due_soon')
    );
  };

  // ================= GET STUDENT DUE DETAILS =================
  const getStudentDueDetails = (studentId) => {
    return dueStudents.filter(due => due.student_id === studentId);
  };

  // ================= CALCULATE TOTAL AMOUNT =================
  const calculateTotalAmount = (studentId) => {
    const studentDues = getStudentDueDetails(studentId);
    return studentDues.reduce((total, due) => total + due.amount, 0);
  };

  // ================= MANUAL CHECK MEAL DUES =================
  const checkMealDues = async (studentId, formId) => {
    try {
      setCheckingDues(true);
      setSelectedStudentId(studentId);
      setSelectedFormId(formId);
      
      // Check MANUAL due registry only
      const studentDues = getStudentDueDetails(studentId);
      const hasDueInRegistry = checkIfStudentHasDue(studentId);
      const totalAmount = calculateTotalAmount(studentId);
      
      let duesData = {
        has_meal_dues: hasDueInRegistry,
        dues: studentDues.map(due => ({
          id: due.id,
          description: due.description,
          amount: due.amount,
          due_date: due.due_date,
          status: due.status,
          registered_by: due.registered_by,
          registered_date: due.registered_date
        })),
        total_amount: totalAmount,
        can_approve: !hasDueInRegistry,
        student_info: {
          student_name: forms.find(f => f.id_number === studentId)?.full_name || studentId,
          id_number: studentId,
          email: forms.find(f => f.id_number === studentId)?.student_email || 'N/A'
        },
        // Add source info
        check_source: "manual_registry",
        checked_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        checked_by: user?.username
      };
      
      // REMOVED: No automatic API checking - only manual registry
      
      setMealDues({
        ...duesData,
        form_id: formId
      });
      setDuesModal(true);
      
      notification.info({
        message: 'Meal Dues Check',
        description: 'This is from the  registry. You must verify.',
        duration: 5,
      });
      
      return duesData;
      
    } catch (err) {
      console.error("Check meal dues error:", err);
      message.error("Could not check meal dues from registry.");
      return null;
    } finally {
      setCheckingDues(false);
    }
  };

  // ================= VIEW FORM DETAILS =================
  const viewFormDetails = (form) => {
    setSelectedForm(form);
    setViewModal(true);
  };

  // ================= APPROVE FORM =================
  const approveForm = async (formId, studentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [formId]: true }));
      
      // Step 1: Ask cafeteria officer to confirm manual verification
      Modal.confirm({
        title: 'Confirm Meal Dues Check',
        content: (
          <div>
            <p>Have you verified this student's meal dues status?</p>
            <Alert
              message="Important:"
              description="As the cafeteria officer, you must verify if the student has any unpaid meal dues."
              type="warning"
              showIcon
              style={{ marginTop: 10 }}
            />
          </div>
        ),
        okText: 'Yes, I have verified - Approve',
        cancelText: 'No, Check First',
        onOk: async () => {
          try {
            // Send approval request to server
            const note = "Approved by Cafeteria after  meal dues verification";
            const res = await axios.patch(
              `${API_BASE}cafeteria/action/${formId}/`,
              { 
                action: "approve", 
                note: note
              },
              { 
                headers: { 
                  Authorization: `Token ${token}`,
                  'Content-Type': 'application/json'
                } 
              }
            );
            
            // Update local state
            setForms(prev => prev.map(f => 
              f.id === formId ? { 
                ...f, 
                status: "approved_cafeteria",
                cafeteria_note: res.data.note
              } : f
            ));
            
            message.success("Form approved and sent to Dormitory!");
            
            // Show success notification
            notification.success({
              message: 'Clearance Approved',
              description: 'Form has been sent to Dormitory after  verification.',
              duration: 5,
            });
            
            // Reload stats
            setTimeout(() => loadForms(token), 1000);
            
          } catch (apiErr) {
            if (apiErr.response?.data?.error) {
              message.error(apiErr.response.data.error);
            } else {
              message.error("Approval failed. Please try again.");
            }
          }
        },
        onCancel: () => {
          // Suggest to check meal dues first
          message.info("Please check meal dues first using the 'Check Meal Dues' button.");
        }
      });
      
    } catch (err) {
      console.error("Approve error:", err);
      message.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(prev => ({ ...prev, [formId]: false }));
    }
  };

  // ================= REJECT FORM =================
  const openRejectModal = (formId, studentId) => {
    setSelectedFormId(formId);
    setSelectedStudentId(studentId);
    setRejectModal(true);
    setRejectAction('reject_only'); // Reset to default
    setPaymentAmount("");
    setPaymentReason("");
  };

  // ================= HANDLE REJECT FORM =================
  const handleRejectForm = async () => {
    try {
      // Validation
      if (!rejectNote.trim()) {
        message.error("Please provide a rejection reason");
        return;
      }
      
      // If payment required, validate payment data
      if (rejectAction === 'require_payment') {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
          message.error("Please enter a valid payment amount");
          return;
        }
        if (!paymentReason.trim()) {
          message.error("Please provide a payment reason");
          return;
        }
      }
      
      const payload = {
        action: "reject",
        note: rejectNote.trim()
      };
      
      // Add payment data if required
      if (rejectAction === 'require_payment') {
        payload.requires_payment = true;
        payload.payment_amount = parseFloat(paymentAmount);
        payload.payment_reason = paymentReason.trim();
      }
      
      const res = await axios.patch(
        `${API_BASE}cafeteria/action/${selectedFormId}/`,
        payload,
        { 
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      message.success(res.data.message || "Form rejected successfully");
      
      // Update local state
      setForms(prev => prev.map(f => {
        if (f.id === selectedFormId) {
          const updatedForm = { 
            ...f, 
            status: res.data.status || "rejected",
            cafeteria_note: res.data.note || rejectNote.trim()
          };
          
          // Add requires_payment flag for UI if applicable
          if (rejectAction === 'require_payment') {
            updatedForm.requires_payment = true;
            updatedForm.payment_amount = paymentAmount;
            updatedForm.payment_reason = paymentReason;
          }
          
          return updatedForm;
        }
        return f;
      }));
      
      // Show appropriate notification
      if (rejectAction === 'require_payment') {
        notification.info({
          message: 'Payment Required',
          description: 'Student will receive payment instructions. Form will continue after payment verification.',
          duration: 5,
        });
      } else {
        notification.error({
          message: 'Form Rejected',
          description: 'Form has been rejected and sent back to student.',
          duration: 5,
        });
      }
      
      // Close modal and reset
      setRejectModal(false);
      setRejectNote("");
      setRejectAction('reject_only');
      setPaymentAmount("");
      setPaymentReason("");
      setSelectedFormId(null);
      setSelectedStudentId(null);
      
      // Reload stats
      setTimeout(() => loadForms(token), 1000);
      
    } catch (err) {
      console.error("Reject error:", err);
      message.error(err.response?.data?.error || err.response?.data?.message || "Rejection failed");
    }
  };

  // ================= QUICK APPROVE AFTER DUES CHECK =================
  const quickApproveAfterDuesCheck = async () => {
    if (!mealDues.form_id || !selectedStudentId) return;
    
    try {
      Modal.confirm({
        title: 'Confirm Verification',
        content: 'Have you  verified this student has no meal dues?',
        onOk: async () => {
          const note = "Approved by Cafeteria after meal dues verification";
          const res = await axios.patch(
            `${API_BASE}cafeteria/action/${mealDues.form_id}/`,
            { 
              action: "approve", 
              note: note
            },
            { 
              headers: { 
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json'
              } 
            }
          );
          
          // Update local state
          setForms(prev => prev.map(f => 
            f.id === mealDues.form_id ? { 
              ...f, 
              status: "approved_cafeteria",
              cafeteria_note: res.data.note || note
            } : f
          ));
          
          message.success("Form approved and sent to Dormitory!");
          setDuesModal(false);
          
          notification.success({
            message: 'Sent to Dormitory',
            description: 'Clearance form has been forwarded to Dormitory department.',
            icon: <HomeOutlined />,
            duration: 4,
          });
          
          setTimeout(() => loadForms(token), 1000);
        }
      });
      
    } catch (err) {
      console.error("Quick approve error:", err);
      message.error("Failed to approve. Please try again.");
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    sessionStorage.clear();
    localStorage.removeItem("ucs_user");
    message.success("Logged out successfully");
    navigate("/login");
  };

  // ================= CALCULATE STATS =================
  const calculateStats = (formsList) => {
    const stats = {
      total: formsList.length,
      pending: formsList.filter(f => f.status === "approved_library").length,
      approved: formsList.filter(f => f.status === "approved_cafeteria").length,
      rejected: formsList.filter(f => f.status === "rejected" && f.cafeteria_note).length
    };
    setStats(stats);
  };

  // ================= FILTERED FORMS =================
  const filteredForms = forms.filter((f) =>
    f.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.student_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ================= RENDER STATUS =================
  const renderStatus = (status, cafeteriaNote) => {
    switch(status) {
      case "approved_cafeteria":
        return (
          <Badge 
            status="success" 
            text={
              <Space>
                <CheckCircleOutlined />
                <span style={{ fontWeight: 'bold' }}>APPROVED</span>
                <Tag color="green">Sent to Dormitory</Tag>
              </Space>
            }
          />
        );
      case "rejected":
        return (
          <Badge 
            status="error" 
            text={
              <Space>
                <CloseCircleOutlined />
                <span style={{ fontWeight: 'bold' }}>REJECTED</span>
                {cafeteriaNote && (
                  <Tooltip title={cafeteriaNote}>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                  </Tooltip>
                )}
              </Space>
            }
          />
        );
      case "approved_library":
        return (
          <Badge 
            status="processing" 
            text={
              <Space>
                <ClockCircleOutlined />
                <span style={{ fontWeight: 'bold' }}>PENDING</span>
                <Tag color="orange"> Meal Dues Check</Tag>
              </Space>
            }
          />
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // ================= RENDER CLEARANCE FLOW =================
  const renderClearanceFlow = (form) => {
    const currentStep = form.status === "approved_library" ? 2 : 
                      form.status === "approved_cafeteria" ? 3 : 0;
    
    return (
      <Steps size="small" current={currentStep} style={{ marginTop: 20 }}>
        <Step 
          title="Dept. Head" 
          description="Approved" 
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        />
        <Step 
          title="Library" 
          description="Approved" 
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        />
        <Step 
          title="Cafeteria" 
          description={
            form.status === "approved_cafeteria" ? " Verified" : 
            form.status === "rejected" ? "Rejected" : " Check Needed"
          } 
          icon={
            form.status === "approved_cafeteria" ? 
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
            form.status === "rejected" ? 
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> :
              <CoffeeOutlined style={{ color: '#faad14' }} />
          }
        />
        <Step 
          title="Dormitory" 
          description={form.status === "approved_cafeteria" ? "Waiting" : "Not Yet"} 
          icon={<HomeOutlined />}
        />
      </Steps>
    );
  };

  // ================= DUES TABLE COLUMNS =================
  const duesColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {date}
          {dayjs(date).isBefore(dayjs()) && (
            <Tag color="red" size="small">OVERDUE</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          color={status === 'overdue' ? 'red' : 'orange'}
          icon={status === 'overdue' ? <WarningOutlined /> : <ClockCircleOutlined />}
        >
          {status === 'overdue' ? 'OVERDUE' : 'DUE SOON'}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong type={amount > 0 ? "danger" : "success"}>
          <DollarOutlined /> {amount > 0 ? `$${amount.toFixed(2)}` : 'No dues'}
        </Text>
      ),
    },
    {
      title: 'Registered By',
      dataIndex: 'registered_by',
      key: 'registered_by',
      render: (by) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {by}
        </Text>
      ),
    },
  ];

  // ================= DUE STUDENTS TABLE COLUMNS =================
  const dueStudentsColumns = [
    {
      title: 'Student ID',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Student Name',
      dataIndex: 'student_name',
      key: 'student_name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {date}
          {dayjs(date).isBefore(dayjs()) && (
            <Tag color="red" size="small">OVERDUE</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          color={status === 'overdue' ? 'red' : 'orange'}
          icon={status === 'overdue' ? <WarningOutlined /> : <ClockCircleOutlined />}
        >
          {status === 'overdue' ? 'OVERDUE' : 'DUE SOON'}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong type="danger">
          <DollarOutlined /> ${amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  student_id: record.student_id,
                  student_name: record.student_name,
                  description: record.description,
                  amount: record.amount,
                  due_date: dayjs(record.due_date)
                });
                setEditingDue(record);
                setRegisterDueModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteDue(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ================= RENDER DECISION GUIDE =================
  const renderDecisionGuide = () => {
    if (!duesModal) return null;
    
    if (mealDues.has_meal_dues) {
      return (
        <Card 
          title={<Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Verification Required</Space>}
          size="small"
          style={{ 
            marginTop: 20,
            background: '#fff2f0',
            border: '1px solid #ffccc7'
          }}
        >
          <Space direction="vertical" size="small">
            <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
              <WarningOutlined /> CHECK
            </Text>
            <Text type="secondary">Student has registered meal dues. Verify.</Text>
            <Alert
              message="Action Required"
              description="You must verify if these meal dues have been paid."
              type="warning"
              showIcon
              style={{ marginTop: 10 }}
            />
            <Text type="secondary">
              <strong>Total Registered Dues:</strong> ${mealDues.total_amount?.toFixed(2) || 0}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
              Source: Registry • Checked by: {mealDues.checked_by} • {mealDues.checked_at}
            </Text>
          </Space>
        </Card>
      );
    } else {
      return (
        <Card 
          title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} />  Verification Required</Space>}
          size="small"
          style={{ 
            marginTop: 20,
            background: '#f6ffed',
            border: '1px solid #b7eb8f'
          }}
        >
          <Space direction="vertical" size="small">
            <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
              <InfoCircleOutlined /> NO REGISTERED DUES
            </Text>
            <Text type="secondary">No meal dues in  registry. Still requires  verification.</Text>
            <Alert
              message="Manual Check Still Needed"
              description="You must still  verify the student's meal dues status."
              type="info"
              showIcon
              style={{ marginTop: 10 }}
            />
            <Text type="secondary">
              <strong>Action:</strong>verify before approving
            </Text>
          </Space>
        </Card>
      );
    }
  };

  // ================= RENDER FORM CARD =================
  const renderFormCard = (form) => {
    const isPending = form.status === "approved_library";
    const isApproved = form.status === "approved_cafeteria";
    const isRejected = form.status === "rejected";
    
    // Check if student has due in MANUAL registry only
    const hasDue = checkIfStudentHasDue(form.id_number);
    const studentDues = getStudentDueDetails(form.id_number);
    const totalDue = calculateTotalAmount(form.id_number);
    
    return (
      <Card
        key={form.id}
        hoverable
        onClick={() => viewFormDetails(form)}
        style={{
          marginBottom: 15,
          borderRadius: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          borderLeft: `5px solid ${
            isApproved ? "#52c41a" :
            isRejected ? "#ff4d4f" :
            hasDue ? "#faad14" : "#faad14"
          }`,
          transition: 'all 0.3s',
          cursor: 'pointer',
          background: hasDue ? '#fff7e6' : 'white'
        }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <UserOutlined />
              <Text strong style={{ fontSize: '16px' }}>{form.full_name}</Text>
              {hasDue && (
                <Tooltip title={`Student has ${studentDues.length} registered meal due(s) - Verify`}>
                  <WarningOutlined style={{ color: '#faad14' }} />
                </Tooltip>
              )}
            </Space>
            {renderStatus(form.status, form.cafeteria_note)}
          </div>
        }
        extra={
          <Space>
            <Tooltip title="View Details">
              <Button 
                type="link" 
                icon={<EyeOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  viewFormDetails(form);
                }}
              />
            </Tooltip>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text>
                <IdcardOutlined /> ID: {form.id_number}
              </Text>
              <Text>
                <MailOutlined /> Email: {form.student_email || 'N/A'}
              </Text>
              <Text>
                <FileTextOutlined /> Dept: {form.department_name}
              </Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text>
                Year/Semester: {form.year} / {form.semester}
              </Text>
              <Text>
                Program: {form.program_level}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <HistoryOutlined /> Submitted: {dayjs(form.created_at).format('MMM D, YYYY HH:mm')}
              </Text>
            </Space>
          </Col>
        </Row>
        
        {hasDue && (
          <Alert
            message="Registered Meal Dues"
            description={
              <Space direction="vertical" size={2}>
                <Text>
                  Student has {studentDues.length} registered meal due(s) totaling ${totalDue.toFixed(2)} in registry.
                </Text>
                <Text type="secondary">
                  <strong>Note:</strong> This is from registry. Must verify.
                </Text>
              </Space>
            }
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginTop: 10 }}
          />
        )}
        
        {renderClearanceFlow(form)}
        
        {form.library_note && (
          <Alert
            message="Librarian Note"
            description={form.library_note}
            type="info"
            showIcon
            style={{ marginTop: 15 }}
          />
        )}
        
        {isPending && (
          <Space style={{ marginTop: 15, width: '100%', justifyContent: 'center' }}>
            <Tooltip title="Check Meal Dues Registry">
              <Button
                type="primary"
                icon={<CoffeeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  checkMealDues(form.student_id || form.id_number, form.id);
                }}
                loading={checkingDues && selectedStudentId === (form.student_id || form.id_number)}
                style={{ background: "#faad14", borderColor: "#faad14" }}
              >
                Check Manual Registry
              </Button>
            </Tooltip>
            
            <Popconfirm
              title="Meal Dues Verification Required"
              description="Have you verified this student's meal dues status?"
              onConfirm={(e) => {
                e?.stopPropagation();
                approveForm(form.id, form.student_id || form.id_number);
              }}
              okText="Yes, I've verified - Approve"
              cancelText="No, Check First"
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={(e) => e.stopPropagation()}
                loading={actionLoading[form.id]}
                style={{ 
                  background: hasDue ? "#faad14" : "#52c41a", 
                  borderColor: hasDue ? "#faad14" : "#52c41a"
                }}
              >
                {hasDue ? "Verify Dues First" : "Approve (Check)"}
              </Button>
            </Popconfirm>
            
            <Popconfirm
              title="Reject Clearance"
              description="Are you sure you want to reject and return to student?"
              onConfirm={(e) => {
                e?.stopPropagation();
                openRejectModal(form.id, form.student_id || form.id_number);
              }}
              okText="Yes, Reject"
              cancelText="Cancel"
            >
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={(e) => e.stopPropagation()}
                style={{ background: "#ff4d4f", borderColor: "#ff4d4f" }}
              >
                Reject
              </Button>
            </Popconfirm>
          </Space>
        )}
        
        {form.cafeteria_note && (
          <Alert
            message="Cafeteria Action"
            description={form.cafeteria_note}
            type={isRejected ? "error" : "success"}
            showIcon
            style={{ marginTop: 10 }}
          />
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: 30, maxWidth: 1400, margin: '0 auto', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* ================= HEADER ================= */}
      <Card 
        style={{ 
          marginBottom: 30,
          borderRadius: 15,
          background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
          color: 'white',
          boxShadow: '0 8px 25px rgba(250, 173, 20, 0.3)'
        }}
        bodyStyle={{ padding: '20px 30px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                <CoffeeOutlined /> Cafeteria Clearance System
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
                Welcome, {user?.username || 'Cafeteria Officer'} - Cafeterial Managers
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
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
              
              {/* PAYMENT VERIFICATION DROPDOWN */}
              <Dropdown 
                overlay={paymentVerificationMenu} 
                placement="bottomRight"
                trigger={['click', 'hover']}
              >
                <Button
                  type="primary"
                  icon={<DollarCircleOutlined />}
                  style={{ 
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)', 
                    borderColor: '#52c41a',
                    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
                    fontWeight: 'bold',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Space>
                    <CheckSquareOutlined />
                    <span>Verification Actions</span>
                    {pendingPaymentsCount > 0 && (
                      <Badge 
                        count={pendingPaymentsCount} 
                        size="small"
                        style={{ 
                          backgroundColor: '#ff4d4f',
                          boxShadow: '0 0 0 1px #fff'
                        }}
                      />
                    )}
                  </Space>
                </Button>
              </Dropdown>
              
              <Button 
                onClick={() => setDuesRegistrationModal(true)}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  border: 'none',
                  height: '40px'
                }}
              >
                <Space>
                  <DatabaseOutlined />
                  <span>Dues Registry</span>
                  {dueStudents.length > 0 && (
                    <Badge 
                      count={dueStudents.length} 
                      size="small"
                      style={{ 
                        backgroundColor: '#ff4d4f',
                        marginLeft: '8px'
                      }}
                    />
                  )}
                </Space>
              </Button>
              
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  loadForms(token);
                  loadPendingPaymentsCount();
                }}
                loading={loading}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  border: 'none',
                  height: '40px'
                }}
              >
                <Space>
                  <span>Refresh</span>
                </Space>
              </Button>
              <Button 
                danger 
                onClick={logout}
                style={{ 
                  background: 'rgba(255,77,79,0.9)', 
                  color: 'white', 
                  border: 'none',
                  height: '40px',
                  boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
                }}
              >
                <Space>
                  <LogoutOutlined />
                  <span>Logout</span>
                </Space>
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ================= STATS ================= */}
      <Row gutter={16} style={{ marginBottom: 30 }}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            style={{ 
              textAlign: 'center', 
              borderRadius: 10,
              border: '2px solid #faad14',
              background: 'white'
            }}
            onClick={() => setSearchTerm('')}
          >
            <Statistic 
              title="Total Forms" 
              value={stats.total} 
              valueStyle={{ color: '#faad14', fontSize: '32px' }}
              prefix={<FileTextOutlined />}
            />
            <Text type="secondary">From library</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            style={{ 
              textAlign: 'center', 
              borderRadius: 10,
              border: '2px solid #1890ff',
              background: 'white'
            }}
          >
            <Statistic 
              title="Pending Manual Check" 
              value={stats.pending} 
              valueStyle={{ color: '#1890ff', fontSize: '32px' }}
              prefix={<ClockCircleOutlined />}
            />
            <Text type="secondary">meal dues check required</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            style={{ 
              textAlign: 'center', 
              borderRadius: 10,
              border: '2px solid #52c41a',
              background: 'white'
            }}
          >
            <Statistic 
              title="Manually Approved" 
              value={stats.approved} 
              valueStyle={{ color: '#52c41a', fontSize: '32px' }}
              prefix={<CheckCircleOutlined />}
            />
            <Text type="secondary">After verification</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            style={{ 
              textAlign: 'center', 
              borderRadius: 10,
              border: '2px solid #ff4d4f',
              background: 'white'
            }}
          >
            <Statistic 
              title="Rejected" 
              value={stats.rejected} 
              valueStyle={{ color: '#ff4d4f', fontSize: '32px' }}
              prefix={<CloseCircleOutlined />}
            />
            <Text type="secondary">Meal dues/issues found</Text>
          </Card>
        </Col>
      </Row>

      {/* ================= TABS FOR MAIN CONTENT ================= */}
      <Tabs defaultActiveKey="1" style={{ marginBottom: 20 }}>
        <TabPane tab={<span><CoffeeOutlined /> Clearance Forms</span>} key="1">
          {/* =================  VERIFICATION ALERT ================= */}
          <Alert
            message="MEAL DUES VERIFICATION REQUIRED"
            description={
              <Space direction="vertical" size={8}>
                <Paragraph style={{ margin: 0 }}>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li><strong>No automatic checking - Cafeteria officer must verify</strong></li>
                    <li>Check the  due registry for reference</li>
                    <li>verify if student has unpaid meal dues</li>
                    <li>Check payment records</li>
                    <li>Update the registry if needed</li>
                  </ol>
                </Paragraph>
                <Alert
                  message="Important Notice"
                  description="Forms require verification by cafeteria officer before approval."
                  type="warning"
                  showIcon
                />
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 20, borderRadius: 10 }}
          />

          {/* ================= SEARCH ================= */}
          <Card 
            style={{ 
              marginBottom: 20, 
              borderRadius: 10,
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Input
              placeholder="Search by Name, ID, Department, or Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              size="large"
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">
                Showing {filteredForms.length} of {forms.length} forms
              </Text>
              <Button 
                type="link" 
                onClick={() => {
                  loadForms(token);
                  loadPendingPaymentsCount();
                }}
                icon={<ReloadOutlined />}
                loading={loading}
              >
                Refresh List
              </Button>
            </div>
          </Card>

          {/* ================= FORM LIST ================= */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <Spin size="large" />
              <p style={{ marginTop: 20, fontSize: '16px', color: '#666' }}>
                Loading clearance forms from library...
              </p>
            </div>
          ) : filteredForms.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 60, borderRadius: 10, background: 'white' }}>
              <div style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: 20 }}>
                <FileTextOutlined />
              </div>
              <Title level={4} type="secondary">
                {searchTerm ? `No results for "${searchTerm}"` : "No forms awaiting cafeteria clearance"}
              </Title>
              <Text type="secondary">
                All library-approved forms have been processed
              </Text>
            </Card>
          ) : (
            filteredForms.map(renderFormCard)
          )}
        </TabPane>
        
        <TabPane tab={<span><DatabaseOutlined />  Meal Dues Registry</span>} key="2">
          <Card 
            style={{ 
              marginBottom: 20, 
              borderRadius: 10,
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Input
                  placeholder="Search by Student ID"
                  value={dueSearchId}
                  onChange={(e) => setDueSearchId(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                  size="large"
                />
              </Col>
              <Col span={8}>
                <Input
                  placeholder="Search by Student Name"
                  value={dueSearchName}
                  onChange={(e) => setDueSearchName(e.target.value)}
                  prefix={<UserOutlined />}
                  allowClear
                  size="large"
                />
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingDue(null);
                      form.resetFields();
                      setRegisterDueModal(true);
                    }}
                  >
                    Register New Due
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={loadDueStudents}
                    loading={loadingDues}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Table
            columns={dueStudentsColumns}
            dataSource={searchDueStudents()}
            rowKey="id"
            loading={loadingDues}
            pagination={{ pageSize: 10 }}
            style={{ background: 'white', borderRadius: 10 }}
            title={() => (
              <Space>
                <DatabaseOutlined />
                <Text strong>Meal Dues Registry</Text>
                <Tag color="red">Total Students: {searchDueStudents().length}</Tag>
                <Tag color="orange">
                  Total Dues: ${searchDueStudents().reduce((sum, due) => sum + due.amount, 0).toFixed(2)}
                </Tag>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This is a registry. Not connected to automatic systems.
                </Text>
              </Space>
            )}
          />
        </TabPane>
      </Tabs>

      {/* ================= VIEW FORM MODAL ================= */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Clearance Form Details</span>
            {selectedForm && renderStatus(selectedForm.status, selectedForm.cafeteria_note)}
          </Space>
        }
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={[
          <Button key="close" onClick={() => setViewModal(false)}>
            Close
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        {selectedForm && (
          <div style={{ maxHeight: '60vh', overflow: 'auto', padding: '0 10px' }}>
            <Descriptions 
              column={2} 
              bordered 
              size="middle"
              labelStyle={{ fontWeight: 'bold', background: '#fafafa' }}
            >
              <Descriptions.Item label="Full Name" span={2}>
                <Space>
                  <UserOutlined />
                  <Text strong>{selectedForm.full_name}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="ID Number">
                <Space>
                  <IdcardOutlined />
                  {selectedForm.id_number}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Student Email">
                <Space>
                  <MailOutlined />
                  {selectedForm.student_email || 'N/A'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="College">
                {selectedForm.college}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedForm.department_name}
              </Descriptions.Item>
              <Descriptions.Item label="Program Level">
                {selectedForm.program_level}
              </Descriptions.Item>
              <Descriptions.Item label="Enrollment Type">
                {selectedForm.enrollment_type}
              </Descriptions.Item>
              <Descriptions.Item label="Year/Semester">
                {selectedForm.year} / {selectedForm.semester}
              </Descriptions.Item>
              <Descriptions.Item label="Section">
                {selectedForm.section}
              </Descriptions.Item>
              <Descriptions.Item label="Clearance Reason" span={2}>
                <Card 
                  size="small" 
                  style={{ background: '#f6ffed', marginTop: 5 }}
                  bodyStyle={{ padding: '12px' }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedForm.reason}
                  </div>
                </Card>
              </Descriptions.Item>
              <Descriptions.Item label="Submitted Date" span={2}>
                <Space>
                  <CalendarOutlined />
                  {dayjs(selectedForm.created_at).format('MMMM D, YYYY HH:mm:ss')}
                </Space>
              </Descriptions.Item>
              {selectedForm.library_note && (
                <Descriptions.Item label="Librarian Action" span={2}>
                  <Alert
                    message="Library Note"
                    description={selectedForm.library_note}
                    type="info"
                    showIcon
                  />
                </Descriptions.Item>
              )}
              {selectedForm.cafeteria_note && (
                <Descriptions.Item label="Cafeteria Action" span={2}>
                  <Alert
                    message={selectedForm.status === "approved_cafeteria" ? "Approval Note" : "Rejection Note"}
                    description={selectedForm.cafeteria_note}
                    type={selectedForm.status === "approved_cafeteria" ? "success" : "error"}
                    showIcon
                  />
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {selectedForm.status === "approved_library" && (
              <div style={{ marginTop: 20, padding: '20px', background: '#f6f8fa', borderRadius: 8 }}>
                <Title level={5} style={{ marginBottom: 15 }}>
                  <CoffeeOutlined /> Meal Dues Verification Required
                </Title>
                <Alert
                  message="No Automatic Checking"
                  description="You must verify the student's meal dues status. Check the registry for reference."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 15 }}
                />
                <Space size="large">
                  <Button
                    type="primary"
                    icon={<CoffeeOutlined />}
                    onClick={() => checkMealDues(selectedForm.student_id || selectedForm.id_number, selectedForm.id)}
                    loading={checkingDues}
                  >
                    Check Registry
                  </Button>
                  <Text type="secondary">
                    Reference only. Must verify.
                  </Text>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ================= MEAL DUES DETAILS MODAL ================= */}
      <Modal
        title={
          <Space>
            <CoffeeOutlined />
            <span>Meal Dues Registry Check</span>
            {mealDues.student_info && (
              <Tag color="blue">
                {mealDues.student_info.student_name || mealDues.student_info.id_number}
              </Tag>
            )}
          </Space>
        }
        open={duesModal}
        onCancel={() => setDuesModal(false)}
        footer={[
          <Button key="close" onClick={() => setDuesModal(false)}>
            Close
          </Button>,
          <Button 
            key="approve" 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Confirm Verification',
                content: 'Have you verified this student has no meal dues?',
                onOk: () => quickApproveAfterDuesCheck()
              });
            }}
            disabled={!mealDues.form_id}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Approve (Verified)
          </Button>
        ]}
        width={800}
      >
        {mealDues.student_info && (
          <Alert
            message="Registry Check Only"
            description="This is from the registry. You must  verify."
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}
        
        <div style={{ marginBottom: 20 }}>
          <Alert
            message={mealDues.has_meal_dues ? "REGISTERED MEAL DUES" : "NO REGISTERED MEAL DUES"}
            description={
              mealDues.has_meal_dues 
                ? `Student has ${mealDues.dues.length} registered meal due(s) in registry.`
                : "No meal dues found in  registry. Still requires verification."
            }
            type={mealDues.has_meal_dues ? "warning" : "info"}
            showIcon
            icon={
              mealDues.has_meal_dues ? <WarningOutlined /> : <InfoCircleOutlined />
            }
          />
        </div>
        
        {mealDues.dues.length > 0 ? (
          <>
            <Table 
              columns={duesColumns} 
              dataSource={mealDues.dues} 
              pagination={false}
              rowKey="id"
              style={{ marginBottom: 20 }}
              title={() => (
                <Text type="secondary">
                  Registry Records • Last checked: {mealDues.checked_at}
                </Text>
              )}
            />
            
            <Card 
              title={<><DollarOutlined /> Registered Dues Summary</>}
              size="small"
              style={{ 
                background: mealDues.has_meal_dues ? '#fff2f0' : '#f6ffed',
                border: mealDues.has_meal_dues ? '1px solid #ffccc7' : '1px solid #b7eb8f'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Registered Dues"
                    value={mealDues.total_amount || 0}
                    prefix="$"
                    valueStyle={{ color: mealDues.has_meal_dues ? '#ff4d4f' : '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Number of Dues"
                    value={mealDues.dues.length}
                  />
                </Col>
              </Row>
            </Card>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: 16 }}>
              <DatabaseOutlined />
            </div>
            <Title level={4} type="secondary">
              No Records in Registry
            </Title>
            <Text type="secondary">
              This student has no meal due records in the registry.
              <br />
              You must still verify.
            </Text>
          </div>
        )}
        
        {/* Manual Verification Guide */}
        {renderDecisionGuide()}
      </Modal>

      {/* ================= REJECT MODAL ================= */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Reject Clearance Form</span>
          </Space>
        }
        open={rejectModal}
        onOk={handleRejectForm}
        onCancel={() => {
          setRejectModal(false);
          setRejectNote("");
          setRejectAction('reject_only');
          setPaymentAmount("");
          setPaymentReason("");
          setSelectedFormId(null);
          setSelectedStudentId(null);
        }}
        okText={rejectAction === 'require_payment' ? "Require Payment" : "Reject & Return to Student"}
        okButtonProps={{ 
          danger: true,
          icon: rejectAction === 'require_payment' ? <DollarOutlined /> : <CloseOutlined />
        }}
        cancelText="Cancel"
        width={600}
      >
        <Alert
          message="Verification Required"
          description="This action is based on your verification of meal dues status."
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
        />
        
        {/* Rejection Type Selection */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>Rejection Type:</Text>
          <Select
            style={{ width: '100%' }}
            value={rejectAction}
            onChange={setRejectAction}
          >
            <Option value="reject_only">Reject Only (Return to Student)</Option>
            <Option value="require_payment">Require Payment First</Option>
          </Select>
        </div>
        
        {/* Payment Details (Conditional) */}
        {rejectAction === 'require_payment' && (
          <div style={{ marginBottom: 20, padding: 15, background: '#f6f8fa', borderRadius: 8 }}>
            <Title level={5} style={{ marginBottom: 10 }}>
              <DollarOutlined /> Payment Details
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Payment Amount"
                prefix="$"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <Input.TextArea
                placeholder="Payment Reason (e.g., 'Unpaid meal dues for March 2024')"
                value={paymentReason}
                onChange={(e) => setPaymentReason(e.target.value)}
                rows={2}
              />
            </Space>
          </div>
        )}
        
        {/* Rejection Reason */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>
            {rejectAction === 'require_payment' ? 'Payment & Rejection Reason:' : 'Rejection Reason:'}
          </Text>
          <Input.TextArea
            rows={4}
            placeholder={
              rejectAction === 'require_payment' 
                ? "Explain why payment is required (e.g., 'Student has unpaid meal dues that need to be settled')"
                : "Enter rejection reason based on verification (e.g., 'Student has unpaid meal dues', 'verification failed', etc.)"
            }
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            maxLength={500}
            showCount
            autoFocus
          />
        </div>
        
        <Alert
          message="Note for Student"
          description={`This note will be visible to the student on their dashboard.${
            rejectAction === 'require_payment' 
              ? " Student will also receive payment instructions." 
              : ""
          }`}
          type="info"
          showIcon
        />
      </Modal>

      {/* ================= MEAL DUE REGISTRATION MODAL ================= */}
      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            <span>{editingDue ? 'Edit Meal Due Record' : 'Register New Meal Due'}</span>
          </Space>
        }
        open={registerDueModal}
        onCancel={() => {
          setRegisterDueModal(false);
          setEditingDue(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="Manual Registry Only"
          description="This registry is for record keeping. Not connected to automatic systems."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={editingDue ? updateDue : registerNewDue}
          initialValues={{
            amount: 0
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="student_id"
                label="Student ID"
                rules={[{ required: true, message: 'Please enter student ID' }]}
              >
                <Input 
                  placeholder="Enter student ID" 
                  prefix={<IdcardOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="student_name"
                label="Student Name"
                rules={[{ required: true, message: 'Please enter student name' }]}
              >
                <Input 
                  placeholder="Enter student name" 
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Due Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea 
              placeholder="Enter description (e.g., 'Unpaid meal charges - March 2024')" 
              rows={3}
            />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="due_date"
                label="Due Date"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Select due date"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter amount"
                  prefix={<DollarOutlined />}
                  min={0}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setRegisterDueModal(false);
                setEditingDue(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDue ? 'Update Record' : 'Register Record'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ================= FOOTER ================= */}
      <div style={{ 
        marginTop: 40, 
        padding: '20px 0', 
        textAlign: 'center',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Text type="secondary">
          Cafeteria Clearance System • Verification Only • {new Date().getFullYear()} • 
          <span style={{ marginLeft: 8, color: '#faad14' }}>
            Total Forms: {stats.total} • Records: {dueStudents.length} • Pending Payments: {pendingPaymentsCount}
          </span>
        </Text>
        <div style={{ marginTop: 10 }}>
          <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
            Note: This system requires verification by cafeteria officer. No automatic checking.
          </Text>
        </div>
      </div>
    </div>
  );
}
