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
  Radio,
  Checkbox,
  Upload,
  Image,
  Avatar,
  List,
  Timeline,
  Progress,
  Layout,
  Breadcrumb
} from "antd";
import {
  LogoutOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  HomeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DatabaseOutlined,
  BuildOutlined,
  ToolOutlined,
  SafetyOutlined,
  KeyOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  DollarCircleOutlined,
  CheckSquareOutlined,
  ArrowRightOutlined,
  FileImageOutlined,
  MessageOutlined,
  SendOutlined,
  WechatOutlined,
  UserAddOutlined,
  SettingOutlined,
  FilterOutlined,
  DownloadOutlined,
  BarChartOutlined,
  TeamOutlined,
  BellOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  FormOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  BankOutlined,
  CreditCardOutlined,
  ReconciliationOutlined,
  FileDoneOutlined,
  ProfileOutlined,
  ScheduleOutlined,
  StarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Header, Content, Sider } = Layout;
const API_BASE = "http://127.0.0.1:8000/api/";

export default function DormitoryPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();

  // ================= STATE VARIABLES =================
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
    rejected: 0,
    payment_required: 0,
    today_forms: 0
  });
  
  // ================= DORMITORY DUES =================
  const [dormDuesModal, setDormDuesModal] = useState(false);
  const [dormDues, setDormDues] = useState({
    has_dorm_dues: false,
    dues: [],
    total_amount: 0,
    can_approve: true,
    student_info: null,
    form_id: null
  });
  const [checkingDues, setCheckingDues] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  
  // ================= DUES REGISTRATION =================
  const [dueStudents, setDueStudents] = useState([]);
  const [dueSearchId, setDueSearchId] = useState("");
  const [dueSearchName, setDueSearchName] = useState("");
  const [loadingDues, setLoadingDues] = useState(false);
  const [registerDueModal, setRegisterDueModal] = useState(false);
  const [editingDue, setEditingDue] = useState(null);
  
  // ================= PAYMENT VERIFICATION =================
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [paymentVerificationModal, setPaymentVerificationModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // ================= UI STATE =================
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('1');
  
  // ================= DAMAGE CHECKLIST =================
  const [damageChecklist, setDamageChecklist] = useState([
    { id: 1, name: "Door Damage", key: "door", icon: <SafetyOutlined />, price: 5000, selected: false },
    { id: 2, name: "Window Damage", key: "window", icon: <EnvironmentOutlined />, price: 3000, selected: false },
    { id: 3, name: "Bed Damage", key: "bed", icon: <HomeOutlined />, price: 8000, selected: false },
    { id: 4, name: "Wall Damage", key: "wall", icon: <BuildOutlined />, price: 4000, selected: false },
    { id: 5, name: "Floor Damage", key: "floor", icon: <BuildOutlined />, price: 6000, selected: false },
    { id: 6, name: "Electrical Issues", key: "electrical", icon: <ToolOutlined />, price: 2500, selected: false },
    { id: 7, name: "Missing Key", key: "key", icon: <KeyOutlined />, price: 1500, selected: false },
    { id: 8, name: "Safety Equipment", key: "safety", icon: <SafetyOutlined />, price: 10000, selected: false },
    { id: 9, name: "Furniture Damage", key: "furniture", icon: <ApartmentOutlined />, price: 7000, selected: false },
    { id: 10, name: "Plumbing Issues", key: "plumbing", icon: <ToolOutlined />, price: 4500, selected: false }
  ]);
  
  // ================= CHAT SYSTEM =================
  const [chatModal, setChatModal] = useState(false);
  const [selectedChatStudent, setSelectedChatStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatStudents, setChatStudents] = useState([]);
  
  // ================= ROOM INSPECTION =================
  const [roomInspectionModal, setRoomInspectionModal] = useState(false);
  const [inspectionImages, setInspectionImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // ================= REPORTS =================
  const [reportsData, setReportsData] = useState({
    monthlyStats: [],
    topDamages: [],
    revenueStats: { total: 0, pending: 0, collected: 0 }
  });

  // ================= AUTHENTICATION =================
  useEffect(() => {
    const stored = sessionStorage.getItem("ucs_current");
    if (!stored) {
      message.error("Please login first");
      navigate("/login");
      return;
    }
    
    const parsed = JSON.parse(stored);
    if (parsed.role !== "dormitory") {
      message.error("Access denied. Dormitory only.");
      navigate("/login");
      return;
    }
    
    setUser(parsed);
    setToken(parsed.token);
    loadForms(parsed.token);
    loadDueStudents();
    loadPendingPayments(parsed.token);
    loadChatStudents();
    loadReportsData();
  }, [navigate]);

  // ================= LOAD FORMS =================
  const loadForms = async (authToken) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}dormitory/forms/`, {
        headers: { 
          Authorization: `Token ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data && Array.isArray(res.data)) {
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
      } else {
        message.error("Failed to load forms. Please try again.");
      }
      setForms([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD PENDING PAYMENTS =================
  const loadPendingPayments = async (authToken) => {
    try {
      const res = await axios.get(`${API_BASE}payment/pending/`, {
        headers: { 
          Authorization: `Token ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.data && Array.isArray(res.data)) {
        const dormitoryPayments = res.data.filter(payment => 
          payment.department_type === 'dormitory'
        );
        setPendingPayments(dormitoryPayments);
        setPendingPaymentsCount(dormitoryPayments.length);
      }
    } catch (err) {
      console.error("Error loading pending payments:", err);
      setPendingPayments([]);
      setPendingPaymentsCount(0);
    }
  };

  // ================= LOAD DUE STUDENTS =================
  const loadDueStudents = async () => {
    try {
      setLoadingDues(true);
      const savedDues = localStorage.getItem("dormitory_due_students");
      if (savedDues) {
        setDueStudents(JSON.parse(savedDues));
      } else {
        // Initialize with sample data
        const sampleDues = [
          {
            id: 1,
            student_id: "STU2024001",
            student_name: "John Doe",
            room_number: "D-101",
            description: "Broken window and door damage",
            items: ["window", "door"],
            amount: 8000.00,
            due_date: "2024-03-15",
            status: "overdue",
            registered_date: "2024-03-20",
            payment_status: "unpaid"
          },
          {
            id: 2,
            student_id: "STU2024002",
            student_name: "Jane Smith",
            room_number: "D-205",
            description: "Bed damage and missing key",
            items: ["bed", "key"],
            amount: 9500.00,
            due_date: "2024-03-20",
            status: "due_soon",
            registered_date: "2024-03-25",
            payment_status: "pending"
          },
          {
            id: 3,
            student_id: "STU2024003",
            student_name: "Robert Johnson",
            room_number: "A-302",
            description: "Wall and floor damage",
            items: ["wall", "floor"],
            amount: 10000.00,
            due_date: "2024-03-30",
            status: "due_soon",
            registered_date: "2024-03-28",
            payment_status: "paid"
          }
        ];
        setDueStudents(sampleDues);
        localStorage.setItem("dormitory_due_students", JSON.stringify(sampleDues));
      }
    } catch (err) {
      console.error("Error loading due students:", err);
      message.error("Failed to load due students list.");
      setDueStudents([]);
    } finally {
      setLoadingDues(false);
    }
  };

  // ================= LOAD CHAT STUDENTS =================
  const loadChatStudents = async () => {
    // Mock data for demonstration
    const mockChatStudents = [
      {
        id: 1,
        student_id: "STU2024001",
        name: "John Doe",
        avatar: "https://i.pravatar.cc/150?img=1",
        lastMessage: "Hello, I have a question about my room inspection",
        lastMessageTime: "2024-03-25T10:30:00Z",
        unreadCount: 2,
        status: "online"
      },
      {
        id: 2,
        student_id: "STU2024002",
        name: "Jane Smith",
        avatar: "https://i.pravatar.cc/150?img=2",
        lastMessage: "Thank you for helping with my clearance",
        lastMessageTime: "2024-03-24T14:20:00Z",
        unreadCount: 0,
        status: "offline"
      },
      {
        id: 3,
        student_id: "STU2024003",
        name: "Robert Johnson",
        avatar: "https://i.pravatar.cc/150?img=3",
        lastMessage: "When will the room inspection happen?",
        lastMessageTime: "2024-03-25T09:15:00Z",
        unreadCount: 1,
        status: "online"
      }
    ];
    setChatStudents(mockChatStudents);
  };

  // ================= LOAD REPORTS DATA =================
  const loadReportsData = async () => {
    // Mock data for demonstration
    const mockReports = {
      monthlyStats: [
        { month: 'Jan', forms: 45, payments: 38000 },
        { month: 'Feb', forms: 52, payments: 42000 },
        { month: 'Mar', forms: 48, payments: 39000 },
        { month: 'Apr', forms: 60, payments: 52000 },
        { month: 'May', forms: 55, payments: 48000 },
        { month: 'Jun', forms: 58, payments: 51000 }
      ],
      topDamages: [
        { name: 'Bed Damage', count: 23, amount: 184000 },
        { name: 'Door Damage', count: 18, amount: 90000 },
        { name: 'Window Damage', count: 15, amount: 45000 },
        { name: 'Electrical Issues', count: 12, amount: 30000 },
        { name: 'Missing Key', count: 10, amount: 15000 }
      ],
      revenueStats: { 
        total: 354000, 
        pending: 17500, 
        collected: 336500 
      }
    };
    setReportsData(mockReports);
  };

  // ================= CALCULATE STATS =================
  const calculateStats = (formsList) => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayForms = formsList.filter(f => 
      dayjs(f.created_at).format('YYYY-MM-DD') === today
    ).length;
    
    const stats = {
      total: formsList.length,
      pending: formsList.filter(f => f.status === "approved_cafeteria").length,
      approved: formsList.filter(f => f.status === "approved_dormitory").length,
      rejected: formsList.filter(f => f.status === "rejected" && f.dormitory_note).length,
      payment_required: formsList.filter(f => f.status === "requires_dormitory_payment").length,
      today_forms: todayForms
    };
    setStats(stats);
  };

  // ================= SAVE DUE STUDENTS =================
  const saveDueStudents = (dues) => {
    localStorage.setItem("dormitory_due_students", JSON.stringify(dues));
    setDueStudents(dues);
  };

  // ================= REGISTER NEW DUE =================
  const registerNewDue = async (values) => {
    try {
      const selectedItems = damageChecklist.filter(item => item.selected).map(item => item.key);
      const itemsTotal = selectedItems.reduce((total, itemKey) => {
        const item = damageChecklist.find(d => d.key === itemKey);
        return total + (item?.price || 0);
      }, 0);

      const newDue = {
        id: Date.now(),
        student_id: values.student_id,
        student_name: values.student_name,
        room_number: values.room_number || "N/A",
        description: values.description || "Dormitory damages",
        items: selectedItems,
        amount: values.amount || itemsTotal,
        due_date: values.due_date.format('YYYY-MM-DD'),
        status: dayjs(values.due_date).isBefore(dayjs()) ? 'overdue' : 'due_soon',
        registered_date: dayjs().format('YYYY-MM-DD'),
        registered_by: user?.username || 'dormitory',
        payment_status: 'unpaid'
      };

      const updatedDues = [...dueStudents, newDue];
      saveDueStudents(updatedDues);
      
      message.success("Dormitory due registered successfully!");
      setRegisterDueModal(false);
      form.resetFields();
      resetChecklist();
      
    } catch (err) {
      console.error("Error registering due:", err);
      message.error("Failed to register due.");
    }
  };

  // ================= UPDATE DUE =================
  const updateDue = async (values) => {
    try {
      const selectedItems = damageChecklist.filter(item => item.selected).map(item => item.key);
      const itemsTotal = selectedItems.reduce((total, itemKey) => {
        const item = damageChecklist.find(d => d.key === itemKey);
        return total + (item?.price || 0);
      }, 0);

      const updatedDue = {
        ...editingDue,
        student_id: values.student_id,
        student_name: values.student_name,
        room_number: values.room_number || "N/A",
        description: values.description || "Dormitory damages",
        items: selectedItems,
        amount: values.amount || itemsTotal,
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
      resetChecklist();
      
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

  // ================= RESET CHECKLIST =================
  const resetChecklist = () => {
    setDamageChecklist(prev => prev.map(item => ({ ...item, selected: false })));
  };

  // ================= TOGGLE CHECKLIST ITEM =================
  const toggleChecklistItem = (key) => {
    setDamageChecklist(prev => prev.map(item => 
      item.key === key ? { ...item, selected: !item.selected } : item
    ));
  };

  // ================= CHECK IF STUDENT HAS DUE =================
  const checkIfStudentHasDue = (studentId) => {
    return dueStudents.some(due => 
      due.student_id === studentId && 
      due.payment_status !== 'paid'
    );
  };

  // ================= GET STUDENT DUE DETAILS =================
  const getStudentDueDetails = (studentId) => {
    return dueStudents.filter(due => due.student_id === studentId);
  };

  // ================= MANUAL CHECK DORMITORY DUES =================
  const checkDormitoryDues = async (studentId, formId) => {
    try {
      setCheckingDues(true);
      setSelectedStudentId(studentId);
      setSelectedFormId(formId);
      
      // Check manual due registry
      const studentDues = getStudentDueDetails(studentId);
      const hasDueInRegistry = checkIfStudentHasDue(studentId);
      const totalAmount = studentDues.reduce((total, due) => total + due.amount, 0);
      
      let duesData = {
        has_dorm_dues: hasDueInRegistry,
        dues: studentDues.map(due => ({
          id: due.id,
          description: due.description,
          amount: due.amount,
          due_date: due.due_date,
          status: due.status,
          payment_status: due.payment_status,
          registered_by: due.registered_by,
          registered_date: due.registered_date,
          room_number: due.room_number,
          items: due.items
        })),
        total_amount: totalAmount,
        can_approve: !hasDueInRegistry,
        student_info: {
          student_name: forms.find(f => f.id_number === studentId)?.full_name || studentId,
          id_number: studentId,
          email: forms.find(f => f.id_number === studentId)?.student_email || 'N/A',
          room_number: studentDues[0]?.room_number || 'N/A'
        },
        check_source: "manual_registry",
        checked_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        checked_by: user?.username
      };
      
      setDormDues({
        ...duesData,
        form_id: formId
      });
      setDormDuesModal(true);
      
      notification.info({
        message: 'Dormitory Dues Check',
        description: 'This is from the manual registry. You must verify.',
        duration: 5,
      });
      
      return duesData;
      
    } catch (err) {
      console.error("Check dormitory dues error:", err);
      message.error("Could not check dormitory dues from registry.");
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
      
      Modal.confirm({
        title: 'Confirm Dormitory Dues Check',
        content: (
          <div>
            <p>Have you verified this student's dormitory dues/damages status?</p>
            <Alert
              message="Important:"
              description="As the dormitory officer, you must verify if the student has any unpaid dues or damages."
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
            const note = "Approved by Dormitory after manual dues/damages verification";
            const res = await axios.patch(
              `${API_BASE}dormitory/action/${formId}/`,
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
                status: "approved_dormitory",
                dormitory_note: res.data.note
              } : f
            ));
            
            message.success("Form approved and sent to Registrar!");
            
            // Show success notification
            notification.success({
              message: 'Clearance Approved',
              description: 'Form has been sent to Registrar after manual verification.',
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
          // Suggest to check dues first
          message.info("Please check dormitory dues first using the 'Check Dues' button.");
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
    setRejectAction('reject_only');
    setPaymentAmount("");
    setPaymentReason("");
  };

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
        `${API_BASE}dormitory/action/${selectedFormId}/`,
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
            dormitory_note: res.data.note || rejectNote.trim()
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

  // ================= VERIFY PAYMENT =================
  const verifyPayment = async (paymentId, action) => {
    try {
      if (action === 'verify') {
        // Update payment status in local storage
        const updatedDues = dueStudents.map(due => 
          due.id === paymentId ? { ...due, payment_status: 'paid' } : due
        );
        saveDueStudents(updatedDues);
        
        message.success("Payment verified successfully!");
        notification.success({
          message: 'Payment Verified',
          description: 'Student can now proceed with clearance.',
          duration: 4,
        });
      } else {
        message.success("Payment rejected.");
      }
      
      // Reload data
      loadDueStudents();
      loadPendingPayments(token);
      
    } catch (err) {
      console.error("Payment verification error:", err);
      message.error("Payment verification failed");
    }
  };

  // ================= OPEN CHAT =================
  const openChat = (student) => {
    setSelectedChatStudent(student);
    setChatMessages([
      {
        id: 1,
        content: "Hello, I have a question about my dormitory clearance",
        sender: { id: student.student_id, name: student.name, role: "student" },
        created_at: "2024-03-25T10:30:00Z",
        is_own: false
      },
      {
        id: 2,
        content: "Yes, how can I help you?",
        sender: { id: user?.id, name: user?.username, role: "dormitory" },
        created_at: "2024-03-25T10:32:00Z",
        is_own: true
      }
    ]);
    setChatModal(true);
  };

  // ================= SEND MESSAGE =================
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      content: newMessage,
      sender: { id: user?.id, name: user?.username, role: "dormitory" },
      created_at: new Date().toISOString(),
      is_own: true
    };
    
    setChatMessages(prev => [...prev, newMsg]);
    setNewMessage("");
  };

  // ================= OPEN ROOM INSPECTION =================
  const openRoomInspection = (studentId) => {
    const student = forms.find(f => f.id_number === studentId) || 
                   dueStudents.find(d => d.student_id === studentId);
    
    if (student) {
      Modal.info({
        title: 'Room Inspection',
        content: (
          <div>
            <p>Inspection for {student.student_name || student.full_name} (Room: {student.room_number || 'N/A'})</p>
            <Upload
              multiple
              listType="picture-card"
              beforeUpload={() => false}
              onChange={({ fileList }) => setInspectionImages(fileList)}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload Photos</div>
              </div>
            </Upload>
          </div>
        ),
        width: 600,
        okText: 'Complete Inspection'
      });
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    sessionStorage.clear();
    localStorage.removeItem("ucs_user");
    message.success("Logged out successfully");
    navigate("/login");
  };

  // ================= FILTERED FORMS =================
  const filteredForms = forms.filter((f) =>
    f.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.student_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // ================= RENDER STATUS =================
  const renderStatus = (status, dormitoryNote) => {
    switch(status) {
      case "approved_dormitory":
        return (
          <Badge 
            status="success" 
            text={
              <Space>
                <CheckCircleOutlined />
                <span style={{ fontWeight: 'bold' }}>APPROVED</span>
                <Tag color="green">Sent to Registrar</Tag>
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
                {dormitoryNote && (
                  <Tooltip title={dormitoryNote}>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                  </Tooltip>
                )}
              </Space>
            }
          />
        );
      case "requires_dormitory_payment":
        return (
          <Badge 
            status="warning" 
            text={
              <Space>
                <DollarOutlined />
                <span style={{ fontWeight: 'bold' }}>PAYMENT REQUIRED</span>
                <Tag color="orange">Waiting Payment</Tag>
              </Space>
            }
          />
        );
      case "approved_cafeteria":
        return (
          <Badge 
            status="processing" 
            text={
              <Space>
                <ClockCircleOutlined />
                <span style={{ fontWeight: 'bold' }}>PENDING</span>
                <Tag color="blue"> Dormitory Check</Tag>
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
    const currentStep = form.status === "approved_cafeteria" ? 3 : 
                      form.status === "approved_dormitory" ? 4 : 0;
    
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
          description="Verified" 
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        />
        <Step 
          title="Dormitory" 
          description={
            form.status === "approved_dormitory" ? "Verified" : 
            form.status === "rejected" ? "Rejected" : 
            form.status === "requires_dormitory_payment" ? "Payment Required" : " Check Needed"
          } 
          icon={
            form.status === "approved_dormitory" ? 
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
            form.status === "rejected" ? 
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> :
            form.status === "requires_dormitory_payment" ?
              <DollarOutlined style={{ color: '#faad14' }} /> :
              <HomeOutlined style={{ color: '#1890ff' }} />
          }
        />
        <Step 
          title="Registrar" 
          description={form.status === "approved_dormitory" ? "Waiting" : "Not Yet"} 
          icon={<FileTextOutlined />}
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
      title: 'Room',
      dataIndex: 'room_number',
      key: 'room_number',
      render: (room) => (
        <Space>
          <HomeOutlined />
          {room || 'N/A'}
        </Space>
      ),
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
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => (
        <Tag 
          color={status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red'}
          icon={status === 'paid' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {status === 'paid' ? 'PAID' : status === 'pending' ? 'PENDING' : 'UNPAID'}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong type={amount > 0 ? "danger" : "success"}>
          <DollarOutlined /> {amount > 0 ? `ETB ${amount.toFixed(2)}` : 'No dues'}
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
// ================= DUE STUDENTS TABLE COLUMNS =================
const dueStudentsColumns = [
  {
    title: 'Student ID',
    dataIndex: 'student_id',
    key: 'student_id',
    render: (text) => <Text strong>{text || 'N/A'}</Text>,
  },
  {
    title: 'Student Name',
    dataIndex: 'student_name',
    key: 'student_name',
    render: (text) => text || 'N/A',
  },
  {
    title: 'Room',
    dataIndex: 'room_number',
    key: 'room_number',
    render: (room) => (
      <Tag color="blue">
        <HomeOutlined /> {room || 'N/A'}
      </Tag>
    ),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (text) => text || 'No description',
  },
  {
    title: 'Due Date',
    dataIndex: 'due_date',
    key: 'due_date',
    render: (date) => {
      if (!date) return 'N/A';
      return (
        <Space>
          <CalendarOutlined />
          {date}
          {dayjs(date).isBefore(dayjs()) && (
            <Tag color="red" size="small">OVERDUE</Tag>
          )}
        </Space>
      );
    },
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status) => {
      if (!status) return <Tag color="default">UNKNOWN</Tag>;
      const statusText = String(status);
      return (
        <Tag 
          color={statusText === 'overdue' ? 'red' : 'orange'}
          icon={statusText === 'overdue' ? <WarningOutlined /> : <ClockCircleOutlined />}
        >
          {statusText.toUpperCase().replace('_', ' ')}
        </Tag>
      );
    }
  },
  {
    title: 'Payment Status',
    dataIndex: 'payment_status',
    key: 'payment_status',
    render: (status) => {
      if (!status) return <Tag color="default">UNKNOWN</Tag>;
      const statusText = String(status);
      const colorMap = {
        'paid': 'green',
        'pending': 'orange',
        'unpaid': 'red',
        'unknown': 'default'
      };
      const color = colorMap[statusText] || 'default';
      return (
        <Tag color={color}>
          {statusText.toUpperCase()}
        </Tag>
      );
    }
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount) => {
      const amountValue = parseFloat(amount || 0);
      return (
        <Text strong type={amountValue > 0 ? "danger" : "success"}>
          <DollarOutlined /> ETB {amountValue.toFixed(2)}
        </Text>
      );
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => {
      if (!record) return null;
      return (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                // Pre-select checklist items
                const selectedItems = record.items || [];
                setDamageChecklist(prev => prev.map(item => ({
                  ...item,
                  selected: selectedItems.includes(item.key)
                })));
                
                form.setFieldsValue({
                  student_id: record.student_id || '',
                  student_name: record.student_name || '',
                  room_number: record.room_number || '',
                  description: record.description || '',
                  amount: record.amount || 0,
                  due_date: record.due_date ? dayjs(record.due_date) : dayjs()
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
              onClick={() => {
                if (record && record.id) {
                  deleteDue(record.id);
                }
              }}
            />
          </Tooltip>
          {record.payment_status === 'pending' && (
            <Tooltip title="Verify Payment">
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => verifyPayment(record.id, 'verify')}
              />
            </Tooltip>
          )}
        </Space>
      );
    },
  },
];
  // ================= PENDING PAYMENTS COLUMNS =================
  const pendingPaymentsColumns = [
    {
      title: 'Student ID',
      dataIndex: 'student_id',
      key: 'student_id',
    },
    {
      title: 'Student Name',
      dataIndex: 'student_name',
      key: 'student_name',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong type="success">ETB {parseFloat(amount).toFixed(2)}</Text>
      ),
    },
    {
      title: 'Payment Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedPayment(record);
              setPaymentVerificationModal(true);
            }}
          >
            Verify
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => verifyPayment(record.id, 'verify')}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            onClick={() => verifyPayment(record.id, 'reject')}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  // ================= RENDER FORM CARD =================
  const renderFormCard = (form) => {
    const isPending = form.status === "approved_cafeteria";
    const hasDue = checkIfStudentHasDue(form.id_number);
    const studentDues = getStudentDueDetails(form.id_number);
    const totalDue = studentDues.reduce((total, due) => total + due.amount, 0);
    
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
            form.status === "approved_dormitory" ? "#52c41a" :
            form.status === "requires_dormitory_payment" ? "#faad14" :
            form.status === "rejected" ? "#ff4d4f" :
            hasDue ? "#ff4d4f" : "#1890ff"
          }`,
          transition: 'all 0.3s',
          cursor: 'pointer',
          background: hasDue ? '#fff2f0' : 'white'
        }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <UserOutlined />
              <Text strong style={{ fontSize: '16px' }}>{form.full_name}</Text>
              {hasDue && (
                <Tooltip title={`Student has unpaid dormitory dues - Verify`}>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                </Tooltip>
              )}
            </Space>
            {renderStatus(form.status, form.dormitory_note)}
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
            message="Unpaid Dormitory Dues"
            description={
              <Space direction="vertical" size={2}>
                <Text>
                  Student has {studentDues.length} unpaid due(s) totaling ETB {totalDue.toFixed(2)}
                </Text>
                <Text type="secondary">
                  <strong>Note:</strong> This is from manual registry. Must verify payment.
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
        
        {form.cafeteria_note && (
          <Alert
            message="Cafeteria Note"
            description={form.cafeteria_note}
            type="info"
            showIcon
            style={{ marginTop: 15 }}
          />
        )}
        
        {isPending && (
          <Space style={{ marginTop: 15, width: '100%', justifyContent: 'center' }}>
            <Tooltip title="Check Dormitory Dues Registry">
              <Button
                type="primary"
                icon={<HomeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  checkDormitoryDues(form.id_number, form.id);
                }}
                loading={checkingDues && selectedStudentId === form.id_number}
                style={{ background: "#1890ff", borderColor: "#1890ff" }}
              >
                Check Dues Registry
              </Button>
            </Tooltip>
            
            <Tooltip title="Start Room Inspection">
              <Button
                icon={<VideoCameraOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  openRoomInspection(form.id_number);
                }}
              >
                Room Inspection
              </Button>
            </Tooltip>
            
            <Popconfirm
              title="Dormitory Dues Verification Required"
              description="Have you verified this student's dormitory dues/damages status?"
              onConfirm={(e) => {
                e?.stopPropagation();
                approveForm(form.id, form.id_number);
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
                  background: hasDue ? "#ff4d4f" : "#52c41a", 
                  borderColor: hasDue ? "#ff4d4f" : "#52c41a"
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
                openRejectModal(form.id, form.id_number);
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
        
        {form.dormitory_note && (
          <Alert
            message="Dormitory Action"
            description={form.dormitory_note}
            type={form.status === "rejected" ? "error" : form.status === "requires_dormitory_payment" ? "warning" : "success"}
            showIcon
            style={{ marginTop: 10 }}
          />
        )}
      </Card>
    );
  };

  // ================= PAYMENT VERIFICATION MENU =================
  const paymentVerificationMenu = (
    <Menu
      onClick={({ key }) => {
        if (key === "payment-verification") {
          sessionStorage.setItem("payment_verification_dept", "dormitory");
          navigate("/staff/payments");
        }
        if (key === "clearance-forms") {
          setSelectedMenu('clearance');
          setActiveTab('1');
        }
        if (key === "dues-registry") {
          setSelectedMenu('dues');
          setActiveTab('2');
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
              {dueStudents.filter(d => d.payment_status !== 'paid').length > 0 && (
                <Badge count={dueStudents.filter(d => d.payment_status !== 'paid').length} size="small" />
              )}
            </Space>
          ),
        },
      ]}
    />
  );

  // ================= SIDEBAR MENU ITEMS =================
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      badge: null
    },
    {
      key: 'clearance',
      icon: <FormOutlined />,
      label: 'Clearance Forms',
      badge: stats.pending
    },
    {
      key: 'dues',
      icon: <DatabaseOutlined />,
      label: 'Dues Registry',
      badge: dueStudents.filter(d => d.payment_status !== 'paid').length
    },
    {
      key: 'payments',
      icon: <DollarCircleOutlined />,
      label: 'Payments',
      badge: pendingPaymentsCount
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'Live Chat',
      badge: chatStudents.filter(s => s.unreadCount > 0).length
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      badge: null
    },
  ];

  // ================= RENDER CONTENT =================
  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <DashboardContent />;
      case 'clearance':
        return <ClearanceFormsContent />;
      case 'dues':
        return <DuesRegistryContent />;
      case 'payments':
        return <PaymentsContent />;
      case 'chat':
        return <ChatContent />;
      case 'reports':
        return <ReportsContent />;
      default:
        return <DashboardContent />;
    }
  };

  // ================= DASHBOARD CONTENT =================
  const DashboardContent = () => (
    <div style={{ padding: '24px' }}>
      {/* Quick Stats */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title="Pending Review"
              value={stats.pending}
              valueStyle={{ color: 'white', fontSize: 32 }}
              prefix={<ClockCircleOutlined />}
            />
            <Progress 
              percent={Math.min(stats.pending * 10, 100)} 
              size="small" 
              strokeColor="#fff"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: 12,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title="Approved"
              value={stats.approved}
              valueStyle={{ color: 'white', fontSize: 32 }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress 
              percent={Math.min(stats.approved * 10, 100)} 
              size="small" 
              strokeColor="#fff"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title="Payment Required"
              value={stats.payment_required}
              valueStyle={{ color: 'white', fontSize: 32 }}
              prefix={<DollarCircleOutlined />}
            />
            <Progress 
              percent={Math.min(stats.payment_required * 20, 100)} 
              size="small" 
              strokeColor="#fff"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: 12,
              background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
              color: 'white'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title="Today's Forms"
              value={stats.today_forms}
              valueStyle={{ color: 'white', fontSize: 32 }}
              prefix={<FormOutlined />}
            />
            <Progress 
              percent={Math.min(stats.today_forms * 25, 100)} 
              size="small" 
              strokeColor="#fff"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <AppstoreOutlined />
                <span>Quick Actions</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <Row gutter={[16, 16]}>
              {[
                { 
                  icon: <FormOutlined />, 
                  label: 'Review Forms', 
                  color: '#1890ff', 
                  onClick: () => setSelectedMenu('clearance'),
                  description: 'Process clearance forms'
                },
                { 
                  icon: <DatabaseOutlined />, 
                  label: 'Check Dues', 
                  color: '#52c41a', 
                  onClick: () => setSelectedMenu('dues'),
                  description: 'Manage dormitory dues'
                },
                { 
                  icon: <DollarCircleOutlined />, 
                  label: 'Verify Payments', 
                  color: '#faad14', 
                  onClick: () => setSelectedMenu('payments'),
                  description: 'Process payments'
                },
                { 
                  icon: <MessageOutlined />, 
                  label: 'Live Chat', 
                  color: '#722ed1', 
                  onClick: () => setSelectedMenu('chat'),
                  description: 'Chat with students'
                },
                { 
                  icon: <VideoCameraOutlined />, 
                  label: 'Room Inspection', 
                  color: '#13c2c2', 
                  onClick: () => message.info('Room inspection feature'),
                  description: 'Inspect rooms'
                },
                { 
                  icon: <BarChartOutlined />, 
                  label: 'Generate Report', 
                  color: '#eb2f96', 
                  onClick: () => setSelectedMenu('reports'),
                  description: 'Generate reports'
                },
              ].map((action, index) => (
                <Col xs={12} sm={8} md={6} lg={4} key={index}>
                  <div
                    onClick={action.onClick}
                    style={{
                      textAlign: 'center',
                      padding: '20px 10px',
                      borderRadius: 10,
                      background: '#fafafa',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      border: '1px solid #f0f0f0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f6ffed';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: action.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: 'white'
                    }}>
                      {action.icon}
                    </div>
                    <Text strong style={{ fontSize: 14 }}>{action.label}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{action.description}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <HistoryOutlined />
                <span>Recent Clearance Activity</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => setSelectedMenu('clearance')}>
                View All
              </Button>
            }
            style={{ borderRadius: 12 }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : forms.slice(0, 5).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>No recent activity</p>
              </div>
            ) : (
              <List
                dataSource={forms.slice(0, 5)}
                renderItem={(form) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            background: form.status === 'approved_dormitory' ? '#52c41a' :
                                       form.status === 'requires_dormitory_payment' ? '#faad14' :
                                       form.status === 'rejected' ? '#ff4d4f' : '#1890ff'
                          }}
                        >
                          {form.full_name?.charAt(0) || 'S'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>{form.full_name}</Text>
                          <Tag color={
                            form.status === 'approved_dormitory' ? 'green' :
                            form.status === 'requires_dormitory_payment' ? 'orange' :
                            form.status === 'rejected' ? 'red' : 'blue'
                          }>
                            {form.status?.replace('_', ' ')?.toUpperCase()}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">ID: {form.id_number} • {form.department_name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Submitted: {dayjs(form.created_at).fromNow()}
                          </Text>
                        </Space>
                      }
                    />
                    <Button 
                      type="link" 
                      icon={<EyeOutlined />}
                      onClick={() => viewFormDetails(form)}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <DollarCircleOutlined />
                <span>Payment Stats</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Pending Verification</Text>
                <Badge count={pendingPaymentsCount} style={{ background: '#faad14' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Total Dues Amount</Text>
                <Text strong type="danger">
                  ETB {dueStudents.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Collected Amount</Text>
                <Text strong type="success">
                  ETB {dueStudents.filter(d => d.payment_status === 'paid').reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                </Text>
              </div>
              <Divider />
              <Button 
                type="primary" 
                block
                onClick={() => setSelectedMenu('payments')}
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Go to Payment Verification
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // ================= CLEARANCE FORMS CONTENT =================
  const ClearanceFormsContent = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <FormOutlined />
            <span>Clearance Forms Management</span>
            <Tag color="blue">{stats.total} Total</Tag>
            <Tag color="orange">{stats.pending} Pending</Tag>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              allowClear
            />
            <Button icon={<FilterOutlined />}>Filter</Button>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={() => loadForms(token)}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Alert
          message="Workflow Instructions"
          description={
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Check each form manually for dormitory dues/damages</li>
              <li>If no issues found, approve and forward to Registrar</li>
              <li>If damages found, reject with payment requirement</li>
              <li>Verify payments in the Payment Verification tab</li>
            </ol>
          }
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : filteredForms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 20 }} />
            <Title level={4} type="secondary">No forms found</Title>
            <Text type="secondary">All forms have been processed or no forms match your search.</Text>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filteredForms.map(form => renderFormCard(form))}
          </div>
        )}
      </Card>
    </div>
  );

  // ================= DUES REGISTRY CONTENT =================
  const DuesRegistryContent = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>Dormitory Dues Registry</span>
            <Tag color="red">Total: ETB {dueStudents.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="Search by ID"
              value={dueSearchId}
              onChange={(e) => setDueSearchId(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Input
              placeholder="Search by name"
              value={dueSearchName}
              onChange={(e) => setDueSearchName(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingDue(null);
                form.resetFields();
                resetChecklist();
                setRegisterDueModal(true);
              }}
            >
              New Due
            </Button>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Table
          columns={dueStudentsColumns}
          dataSource={searchDueStudents()}
          loading={loadingDues}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // ================= PAYMENTS CONTENT =================
  const PaymentsContent = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <DollarCircleOutlined />
            <span>Payment Verification</span>
            <Badge count={pendingPayments.length} style={{ background: '#faad14' }} />
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Alert
          message="Payment Verification Process"
          description={
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li><strong>Student submits payment for dormitory dues</strong></li>
              <li><strong>Click "Verify" to approve payment</strong> → Form automatically proceeds to Registrar</li>
              <li><strong>Click "Reject"</strong> if payment is invalid → Student must resubmit</li>
            </ol>
          }
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />

        <Tabs defaultActiveKey="pending">
          <TabPane 
            tab={
              <Space>
                <ClockCircleOutlined />
                Pending Verification
                {pendingPayments.length > 0 && (
                  <Badge count={pendingPayments.length} style={{ marginLeft: 8 }} />
                )}
              </Space>
            } 
            key="pending"
          >
            <Table
              columns={pendingPaymentsColumns}
              dataSource={pendingPayments}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{
                emptyText: (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <DollarCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                    <p>No pending payments for verification</p>
                  </div>
                )
              }}
            />
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <HistoryOutlined />
                Verification History
              </Space>
            } 
            key="verified"
          >
            <Table
              columns={[
                { title: 'Student ID', dataIndex: 'student_id', key: 'student_id' },
                { 
                  title: 'Student Name', 
                  dataIndex: 'student_name', 
                  key: 'student_name' 
                },
                { 
                  title: 'Amount', 
                  dataIndex: 'amount', 
                  key: 'amount',
                  render: (amount) => (
                    <Text strong type="success">ETB {parseFloat(amount || 0).toFixed(2)}</Text>
                  )
                },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'verified' ? 'green' : 'red'}>
                      {status?.toUpperCase()}
                    </Tag>
                  )
                },
              ]}
              dataSource={dueStudents.filter(d => d.payment_status === 'paid')}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );

  // ================= CHAT CONTENT =================
  const ChatContent = () => (
    <div style={{ padding: '24px', height: 'calc(100vh - 200px)' }}>
      <Card
        title={
          <Space>
            <MessageOutlined />
            <span>Live Chat Support</span>
            <Badge count={chatStudents.filter(s => s.unreadCount > 0).length} />
          </Space>
        }
        style={{ borderRadius: 12, height: '100%' }}
        bodyStyle={{ padding: 0, height: '100%' }}
      >
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Chat list sidebar */}
          <div style={{ 
            width: 320, 
            borderRight: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: 20 }}>
              <Input
                placeholder="Search students..."
                prefix={<SearchOutlined />}
                allowClear
              />
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
              {chatStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <MessageOutlined style={{ fontSize: 48, marginBottom: 10 }} />
                  <p>No active chats</p>
                </div>
              ) : (
                chatStudents.map(student => (
                  <div
                    key={student.id}
                    onClick={() => openChat(student)}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 8,
                      background: selectedChatStudent?.id === student.id ? '#e6f7ff' : 'white',
                      border: selectedChatStudent?.id === student.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar 
                          size="small"
                          src={student.avatar}
                          style={{ 
                            backgroundColor: selectedChatStudent?.id === student.id ? '#1890ff' : '#722ed1',
                            color: 'white'
                          }}
                        >
                          {student.name?.charAt(0) || 'S'}
                        </Avatar>
                        <div>
                          <Text strong style={{ fontSize: '14px' }}>{student.name}</Text>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            ID: {student.studentId}
                          </div>
                        </div>
                      </div>
                      {student.unreadCount > 0 && (
                        <Badge count={student.unreadCount} style={{ background: '#ff4d4f' }} />
                      )}
                    </div>
                    {student.lastMessage && (
                      <div style={{ 
                        marginTop: 8,
                        fontSize: '12px',
                        color: '#999',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {student.lastMessage}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <Divider style={{ margin: 0 }} />
            
            <div style={{ padding: 16 }}>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => {
                  Modal.info({
                    title: 'Start New Chat',
                    content: 'Select a student from the clearance forms to start a chat',
                    okText: 'OK'
                  });
                }}
                block
              >
                Start New Chat
              </Button>
            </div>
          </div>
          
          {/* Main chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedChatStudent ? (
              <>
                <div style={{ 
                  padding: 20, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Avatar 
                        src={selectedChatStudent.avatar}
                        size="large"
                      />
                      <div>
                        <Text strong style={{ color: 'white', fontSize: '16px' }}>
                          {selectedChatStudent.name}
                        </Text>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                          ID: {selectedChatStudent.studentId}
                        </div>
                      </div>
                    </Space>
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      style={{ color: 'white' }}
                      onClick={() => setSelectedChatStudent(null)}
                    />
                  </Space>
                </div>
                
                <div style={{ 
                  flex: 1, 
                  padding: 20,
                  overflowY: 'auto',
                  background: '#fafafa'
                }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      <WechatOutlined style={{ fontSize: 48, marginBottom: 10 }} />
                      <p>No messages yet</p>
                      <p>Start the conversation!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: msg.is_own ? 'flex-end' : 'flex-start',
                            marginBottom: 8
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '70%',
                              padding: '10px 15px',
                              borderRadius: '18px',
                              background: msg.is_own 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : '#e4e6eb',
                              color: msg.is_own ? 'white' : '#333',
                              borderBottomRightRadius: msg.is_own ? 4 : 18,
                              borderBottomLeftRadius: msg.is_own ? 18 : 4,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div style={{ fontSize: '14px', lineHeight: 1.4 }}>
                              {msg.content}
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              textAlign: 'right',
                              marginTop: 4,
                              opacity: 0.7
                            }}>
                              {dayjs(msg.created_at).format('HH:mm')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div style={{ padding: 20, borderTop: '1px solid #f0f0f0' }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input.TextArea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      onPressEnter={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderColor: '#667eea'
                      }}
                    >
                      Send
                    </Button>
                  </Space.Compact>
                </div>
              </>
            ) : (
              <div style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#999'
              }}>
                <WechatOutlined style={{ fontSize: 64, marginBottom: 20 }} />
                <Title level={4} style={{ color: '#666' }}>
                  Welcome to Dormitory Chat
                </Title>
                <Text type="secondary" style={{ maxWidth: 400, marginBottom: 30, textAlign: 'center' }}>
                  Select a student from the chat list to start a conversation about dormitory clearance, damages, payments, or other concerns.
                </Text>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  // ================= REPORTS CONTENT =================
  const ReportsContent = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>Reports & Analytics</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Tabs defaultActiveKey="overview">
          <TabPane tab="Overview" key="overview">
            <Row gutter={[24, 24]}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Revenue"
                    value={reportsData.revenueStats.total}
                    prefix="ETB "
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Progress 
                    percent={Math.round((reportsData.revenueStats.collected / reportsData.revenueStats.total) * 100)} 
                    status="active" 
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Pending Collection"
                    value={reportsData.revenueStats.pending}
                    prefix="ETB "
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Collected"
                    value={reportsData.revenueStats.collected}
                    prefix="ETB "
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Card title="Monthly Statistics" style={{ marginTop: 24 }}>
              <Timeline>
                {reportsData.monthlyStats.map((stat, index) => (
                  <Timeline.Item key={index} color={stat.payments > 40000 ? 'green' : 'blue'}>
                    <Space>
                      <Text strong>{stat.month}</Text>
                      <Text>Forms: {stat.forms}</Text>
                      <Text type="success">Revenue: ETB {stat.payments}</Text>
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </TabPane>
          
          <TabPane tab="Damage Analysis" key="damage">
            <List
              header={<Text strong>Top Damages</Text>}
              dataSource={reportsData.topDamages}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ background: ['#ff4d4f', '#faad14', '#52c41a', '#1890ff', '#722ed1'][index % 5] }}>
                        {index + 1}
                      </Avatar>
                    }
                    title={item.name}
                    description={`${item.count} cases • ETB ${item.amount}`}
                  />
                  <Progress 
                    percent={Math.round((item.amount / reportsData.topDamages[0].amount) * 100)} 
                    style={{ width: 200 }}
                  />
                </List.Item>
              )}
            />
          </TabPane>
          
          <TabPane tab="Export" key="export">
            <div style={{ textAlign: 'center', padding: 40 }}>
              <FileDoneOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 20 }} />
              <Title level={4}>Export Reports</Title>
              <Text type="secondary" style={{ marginBottom: 30, display: 'block' }}>
                Generate and export detailed reports in various formats
              </Text>
              <Space>
                <Button icon={<DownloadOutlined />}>PDF Report</Button>
                <Button icon={<DownloadOutlined />}>Excel Report</Button>
                <Button icon={<DownloadOutlined />}>CSV Export</Button>
              </Space>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );

  // ================= MAIN RENDER =================
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        width={280}
        style={{
          background: 'linear-gradient(180deg, #1a1f36 0%, #0f1322 100%)',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        {/* Logo */}
        <div style={{ 
          padding: collapsed ? '20px 10px' : '20px 24px', 
          textAlign: collapsed ? 'center' : 'left',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? (
            <div style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: 'white',
              margin: '0 auto'
            }}>
              <HomeOutlined />
            </div>
          ) : (
            <Space>
              <div style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: 'white'
              }}>
                <HomeOutlined />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>DormClear</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Management System</div>
              </div>
            </Space>
          )}
        </div>

        {/* User Profile */}
        <div style={{ 
          padding: collapsed ? '20px 10px' : '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Space align="center" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Avatar 
              size={collapsed ? 40 : 48}
              style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                fontSize: collapsed ? 16 : 20
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'D'}
            </Avatar>
            {!collapsed && (
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{user?.username || 'Officer'}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Dormitory Manager</div>
              </div>
            )}
          </Space>
        </div>

        {/* Menu Items */}
        <div style={{ padding: '16px 0' }}>
          {menuItems.map(item => (
            <div
              key={item.key}
              onClick={() => setSelectedMenu(item.key)}
              style={{
                padding: collapsed ? '16px 24px' : '16px 24px',
                margin: '4px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: selectedMenu === item.key ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                border: selectedMenu === item.key ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid transparent',
                color: selectedMenu === item.key ? '#667eea' : 'rgba(255,255,255,0.8)',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: 18 }}>
                {item.icon}
              </div>
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge > 0 && (
                    <Badge count={item.badge} style={{ 
                      background: '#ff4d4f',
                      fontSize: 10
                    }} />
                  )}
                </>
              )}
              {collapsed && item.badge > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  background: '#ff4d4f',
                  borderRadius: '50%'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div style={{ 
          padding: '20px',
          position: 'absolute',
          bottom: 0,
          width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Button
            type="text"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{ 
              color: 'rgba(255,255,255,0.8)', 
              width: '100%',
              textAlign: collapsed ? 'center' : 'left'
            }}
          >
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </Sider>

      {/* Main Content */}
      <Layout style={{ marginLeft: collapsed ? 80 : 280, transition: 'all 0.2s' }}>
        {/* Header */}
        <Header style={{ 
          background: 'white', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <Breadcrumb
              items={[
                { title: 'Dormitory' },
                { title: selectedMenu.charAt(0).toUpperCase() + selectedMenu.slice(1) }
              ]}
            />
          </Space>

          <Space size="middle">
            <Badge count={chatStudents.filter(s => s.unreadCount > 0).length} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                shape="circle"
                style={{ fontSize: 18 }}
                onClick={() => setSelectedMenu('chat')}
              />
            </Badge>
            
            {/* Payment Verification Dropdown */}
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
          </Space>
        </Header>

        {/* Page Content */}
        <Content style={{ 
          margin: '24px 16px', 
          padding: 0,
          minHeight: 280,
          overflow: 'auto',
          background: '#f0f2f5'
        }}>
          {renderContent()}
        </Content>
      </Layout>

      {/* ================= MODALS ================= */}
      
      {/* View Form Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Clearance Form Details</span>
            {selectedForm && renderStatus(selectedForm.status, selectedForm.dormitory_note)}
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
              {selectedForm.cafeteria_note && (
                <Descriptions.Item label="Cafeteria Action" span={2}>
                  <Alert
                    message="Cafeteria Note"
                    description={selectedForm.cafeteria_note}
                    type="info"
                    showIcon
                  />
                </Descriptions.Item>
              )}
              {selectedForm.dormitory_note && (
                <Descriptions.Item label="Dormitory Action" span={2}>
                  <Alert
                    message={selectedForm.status === "approved_dormitory" ? "Approval Note" : 
                            selectedForm.status === "requires_dormitory_payment" ? "Payment Required Note" : "Rejection Note"}
                    description={selectedForm.dormitory_note}
                    type={selectedForm.status === "approved_dormitory" ? "success" : 
                          selectedForm.status === "requires_dormitory_payment" ? "warning" : "error"}
                    showIcon
                  />
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
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
          description="This action is based on your verification of dormitory dues/damages status."
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
                placeholder="Payment Amount (ETB)"
                prefix="ETB"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <Input.TextArea
                placeholder="Payment Reason (e.g., 'Unpaid dormitory damages for room inspection')"
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
                ? "Explain why payment is required (e.g., 'Student has unpaid dormitory damages that need to be settled')"
                : "Enter rejection reason based on verification (e.g., 'Student has unpaid dormitory dues', 'Room damages found', etc.)"
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

      {/* Dormitory Dues Modal */}
      <Modal
        title={
          <Space>
            <HomeOutlined />
            <span>Dormitory Dues Registry Check</span>
            {dormDues.student_info && (
              <Tag color="blue">
                {dormDues.student_info.student_name || dormDues.student_info.id_number}
              </Tag>
            )}
          </Space>
        }
        open={dormDuesModal}
        onCancel={() => setDormDuesModal(false)}
        footer={[
          <Button key="close" onClick={() => setDormDuesModal(false)}>
            Close
          </Button>,
          <Button 
            key="approve" 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Confirm Verification',
                content: 'Have you verified this student has no dormitory dues/damages?',
                onOk: () => {
                  const note = "Approved by Dormitory after manual dues/damages verification";
                  setForms(prev => prev.map(f => 
                    f.id === dormDues.form_id ? { 
                      ...f, 
                      status: "approved_dormitory",
                      dormitory_note: note
                    } : f
                  ));
                  message.success("Form approved and sent to Registrar!");
                  setDormDuesModal(false);
                }
              });
            }}
            disabled={!dormDues.form_id}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Approve (Verified)
          </Button>
        ]}
        width={800}
      >
        {dormDues.student_info && (
          <Alert
            message="Registry Check Only"
            description="This is from the manual registry. You must verify."
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}
        
        <div style={{ marginBottom: 20 }}>
          <Alert
            message={dormDues.has_dorm_dues ? "REGISTERED DORMITORY DUES/DAMAGES" : "NO REGISTERED DUES/DAMAGES"}
            description={
              dormDues.has_dorm_dues 
                ? `Student has ${dormDues.dues.length} registered dormitory due(s) in registry.`
                : "No dormitory dues/damages found in manual registry. Still requires verification."
            }
            type={dormDues.has_dorm_dues ? "warning" : "info"}
            showIcon
            icon={
              dormDues.has_dorm_dues ? <WarningOutlined /> : <InfoCircleOutlined />
            }
          />
        </div>
        
        {dormDues.dues.length > 0 ? (
          <>
            <Table 
              columns={duesColumns} 
              dataSource={dormDues.dues} 
              pagination={false}
              rowKey="id"
              style={{ marginBottom: 20 }}
              title={() => (
                <Text type="secondary">
                  Registry Records • Last checked: {dormDues.checked_at}
                </Text>
              )}
            />
            
            <Card 
              title={<><DollarOutlined /> Registered Dues Summary</>}
              size="small"
              style={{ 
                background: dormDues.has_dorm_dues ? '#fff2f0' : '#f6ffed',
                border: dormDues.has_dorm_dues ? '1px solid #ffccc7' : '1px solid #b7eb8f'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Registered Dues"
                    value={dormDues.total_amount || 0}
                    prefix="ETB "
                    valueStyle={{ color: dormDues.has_dorm_dues ? '#ff4d4f' : '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Number of Dues"
                    value={dormDues.dues.length}
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
              This student has no dormitory due/damage records in the manual registry.
              <br />
              You must still verify.
            </Text>
          </div>
        )}
      </Modal>

      {/* Register Due Modal */}
      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            <span>{editingDue ? 'Edit Dormitory Due Record' : 'Register New Dormitory Due'}</span>
          </Space>
        }
        open={registerDueModal}
        onCancel={() => {
          setRegisterDueModal(false);
          setEditingDue(null);
          form.resetFields();
          resetChecklist();
        }}
        footer={null}
        width={700}
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
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="room_number"
                label="Room Number"
              >
                <Input 
                  placeholder="Enter room number" 
                  prefix={<HomeOutlined />}
                />
              </Form.Item>
            </Col>
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
          </Row>
          
          <Form.Item
            name="description"
            label="Due Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea 
              placeholder="Enter description (e.g., 'Broken door and window damage', 'Room damages', etc.)" 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item
            label="Damaged Items (Check all that apply)"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {damageChecklist.map(item => (
                <Card
                  key={item.id}
                  hoverable
                  onClick={() => toggleChecklistItem(item.key)}
                  style={{
                    border: item.selected ? '2px solid #1890ff' : '1px solid #f0f0f0',
                    background: item.selected ? '#e6f7ff' : 'white',
                    cursor: 'pointer',
                    padding: '12px',
                    transition: 'all 0.3s'
                  }}
                >
                  <Space>
                    <Checkbox checked={item.selected} />
                    {item.icon}
                    <Text>{item.name}</Text>
                    <Tag color="blue">ETB {item.price}</Tag>
                  </Space>
                </Card>
              ))}
            </div>
          </Form.Item>
          
          <Form.Item
            name="amount"
            label="Total Amount (ETB)"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter total amount"
              prefix={<DollarOutlined />}
              min={0}
              step={0.01}
              precision={2}
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setRegisterDueModal(false);
                setEditingDue(null);
                form.resetFields();
                resetChecklist();
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

      {/* Chat Modal */}
      <Modal
        title={
          <Space>
            <MessageOutlined />
            <span>Live Chat</span>
            {selectedChatStudent && (
              <Tag color="blue">{selectedChatStudent.name}</Tag>
            )}
          </Space>
        }
        open={chatModal}
        onCancel={() => {
          setChatModal(false);
          setSelectedChatStudent(null);
          setChatMessages([]);
        }}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {/* Chat content is handled in ChatContent component */}
      </Modal>

      {/* Payment Verification Modal */}
      <Modal
        title={
          <Space>
            <CheckSquareOutlined />
            <span>Payment Verification</span>
            {selectedPayment && (
              <Tag color="blue">Transaction: {selectedPayment.transaction_id}</Tag>
            )}
          </Space>
        }
        open={paymentVerificationModal}
        onCancel={() => {
          setPaymentVerificationModal(false);
          setSelectedPayment(null);
        }}
        footer={[
          <Button key="close" onClick={() => setPaymentVerificationModal(false)}>
            Close
          </Button>,
          <Button 
            key="reject" 
            danger 
            icon={<CloseOutlined />}
            onClick={() => {
              verifyPayment(selectedPayment?.id, 'reject');
              setPaymentVerificationModal(false);
            }}
          >
            Reject Payment
          </Button>,
          <Button 
            key="approve" 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={() => {
              verifyPayment(selectedPayment?.id, 'verify');
              setPaymentVerificationModal(false);
            }}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Verify Payment
          </Button>
        ]}
        width={600}
      >
        {selectedPayment && (
          <div>
            <Alert
              message="Payment Details"
              description="Review the payment details before verification."
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
            
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Student Name">
                {selectedPayment.student_name}
              </Descriptions.Item>
              <Descriptions.Item label="Student ID">
                {selectedPayment.student_id}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong type="success">ETB {parseFloat(selectedPayment.amount).toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Date">
                {dayjs(selectedPayment.payment_date).format('MMMM D, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Transaction ID">
                {selectedPayment.transaction_id}
              </Descriptions.Item>
            </Descriptions>
            
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Image
                src="https://via.placeholder.com/400x200/007bff/ffffff?text=Payment+Receipt+Image"
                alt="Payment Receipt"
                style={{ maxWidth: '100%', borderRadius: 8 }}
                preview={false}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 10 }}>
                Payment receipt/screenshot
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
