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
  Radio,
} from "antd";
import { 
  LogoutOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  BookOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  HistoryOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  HomeOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Option } = Select;
const API_BASE = "http://127.0.0.1:8000/api/";

export default function LibrarianPage() {
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
  const [bookModal, setBookModal] = useState(false);
  const [bookDetails, setBookDetails] = useState({
    has_borrowed_books: false,
    has_due_books: false,
    books: [],
    total_fines: 0,
    can_approve: true,
    student_info: null
  });
  const [checkingBooks, setCheckingBooks] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  
  // ================= DUE REGISTRATION SYSTEM =================
  const [dueRegistrationModal, setDueRegistrationModal] = useState(false);
  const [dueStudents, setDueStudents] = useState([]);
  const [dueSearchId, setDueSearchId] = useState("");
  const [dueSearchName, setDueSearchName] = useState("");
  const [loadingDues, setLoadingDues] = useState(false);
  const [registerDueModal, setRegisterDueModal] = useState(false);
  const [editingDue, setEditingDue] = useState(null);

  // ================= AUTH =================
  useEffect(() => {
    const stored = sessionStorage.getItem("ucs_current");
    if (!stored) {
      message.error("Please login first");
      navigate("/login");
      return;
    }
    
    const parsed = JSON.parse(stored);
    if (parsed.role !== "librarian") {
      message.error("Access denied. Librarian only.");
      navigate("/login");
      return;
    }
    
    setUser(parsed);
    setToken(parsed.token);
    loadForms(parsed.token);
    loadDueStudents();
  }, [navigate]);

  // ================= LOAD FORMS =================
  const loadForms = async (authToken) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}librarian/forms/`, {
        headers: { 
          Authorization: `Token ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data && Array.isArray(res.data)) {
        // Add requires_payment flag based on status
        const formsWithFlags = res.data.map(form => {
          const requiresPayment = form.status.includes('requires_') && 
                                 (form.status.includes('library') || 
                                  form.status.includes('cafeteria') || 
                                  form.status.includes('dormitory'));
          
          return {
            ...form,
            requires_payment: requiresPayment,
            payment_amount: form.note?.match(/Payment required: ([\d.]+)/)?.[1] || '',
            payment_reason: form.note?.match(/Reason: (.+?)(?:\n|$)/)?.[1] || ''
          };
        });
        
        setForms(formsWithFlags);
        calculateStats(formsWithFlags);
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
    }
  };

  // ================= LOAD DUE STUDENTS =================
  const loadDueStudents = async () => {
    try {
      setLoadingDues(true);
      const savedDues = localStorage.getItem("library_due_students");
      if (savedDues) {
        setDueStudents(JSON.parse(savedDues));
      } else {
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
    localStorage.setItem("library_due_students", JSON.stringify(dues));
    setDueStudents(dues);
  };

  // ================= REGISTER NEW DUE =================
  const registerNewDue = async (values) => {
    try {
      const newDue = {
        id: Date.now(),
        student_id: values.student_id,
        student_name: values.student_name,
        book_title: values.book_title,
        book_id: values.book_id,
        borrow_date: values.borrow_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
        fine_amount: values.fine_amount || 0,
        status: dayjs(values.due_date).isBefore(dayjs()) ? 'overdue' : 'due_soon',
        registered_date: dayjs().format('YYYY-MM-DD'),
        registered_by: user?.username || 'librarian'
      };

      const updatedDues = [...dueStudents, newDue];
      saveDueStudents(updatedDues);
      
      message.success("Due registered successfully!");
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
        book_title: values.book_title,
        book_id: values.book_id,
        borrow_date: values.borrow_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
        fine_amount: values.fine_amount || 0,
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

  // ================= MANUAL BOOK STATUS CHECK =================
  const checkBookStatus = async (studentId, formId) => {
    try {
      setCheckingBooks(true);
      setSelectedStudentId(studentId);
      setSelectedFormId(formId);
      
      // Check manual due registry first
      const studentDues = dueStudents.filter(due => due.student_id === studentId);
      const hasDueInRegistry = studentDues.some(due => 
        due.status === 'overdue' || due.status === 'due_soon'
      );
      const totalFines = studentDues.reduce((total, due) => total + due.fine_amount, 0);
      
      // Prepare book data from manual registry
      let bookData = {
        has_borrowed_books: studentDues.length > 0,
        has_due_books: hasDueInRegistry,
        books: studentDues.map(due => ({
          id: due.id,
          title: due.book_title,
          book_id: due.book_id,
          borrow_date: due.borrow_date,
          due_date: due.due_date,
          status: due.status,
          fine: due.fine_amount,
          registered_by: due.registered_by,
          registered_date: due.registered_date
        })),
        total_fines: totalFines,
        can_approve: !hasDueInRegistry,
        student_info: {
          student_name: forms.find(f => f.id_number === studentId)?.full_name || studentId,
          id_number: studentId,
          email: forms.find(f => f.id_number === studentId)?.student_email || 'N/A'
        },
        check_source: "Due-registry",
        checked_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        checked_by: user?.username,
        form_id: formId
      };
      
      setBookDetails(bookData);
      setBookModal(true);
      
      // Determine message based on manual registry
      let notificationMessage = "";
      let notificationType = "info";
      
      if (!bookData.has_borrowed_books) {
        notificationMessage = 'No books found. Verify.';
        notificationType = "info";
      } else if (bookData.has_borrowed_books && !bookData.has_due_books) {
        notificationMessage = 'Books found in registry but no dues. Can APPROVE if verified.';
        notificationType = "success";
      } else if (bookData.has_due_books) {
        notificationMessage = 'Due books found in  registry. Must check and possibly REJECT.';
        notificationType = "warning";
      }
      
      notification[notificationType]({
        message: 'Book Check',
        description: notificationMessage,
        duration: 5,
      });
      
      return bookData;
      
    } catch (err) {
      console.error("Check book status error:", err);
      message.error("Could not check book status from registry.");
      return null;
    } finally {
      setCheckingBooks(false);
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
      
      // Step 1: Check if student has dues in manual registry
      const studentDues = dueStudents.filter(due => due.student_id === studentId);
      const hasDueInRegistry = studentDues.some(due => 
        due.status === 'overdue' || due.status === 'due_soon'
      );
      
      // Step 2: Ask librarian to confirm if they've manually checked
      Modal.confirm({
        title: 'Confirm  Book Check',
        content: (
          <div>
            <p>Have you  checked this student's book status?</p>
            <Alert
              message="Important:"
              description="As the librarian, you must verify if the student has any borrowed or due books."
              type="warning"
              showIcon
              style={{ marginTop: 10 }}
            />
            {hasDueInRegistry && (
              <Alert
                message="Warning: Student has dues in registry"
                description="This student has registered due books. Please verify before approving."
                type="error"
                showIcon
                style={{ marginTop: 10 }}
              />
            )}
          </div>
        ),
        okText: 'Yes, I have checked - Approve',
        cancelText: 'No, Check First',
        onOk: async () => {
          try {
            const note = "Approved by Librarian";
            const res = await axios.patch(
              `${API_BASE}librarian/action/${formId}/`,
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
                status: "approved_library",
                library_note: res.data.note
              } : f
            ));
            
            message.success("Form approved!");
            
            // Show success notification
            notification.success({
              message: 'Clearance Approved',
              description: 'Form has been verification.',
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
          // Suggest to check book status first
          message.info("Please check book status first using the 'Check Book Status' button.");
        }
      });
      
    } catch (err) {
      console.error("Approve error:", err);
      message.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(prev => ({ ...prev, [formId]: false }));
    }
  };

  // ================= OPEN REJECT MODAL =================
  const openRejectModal = (formId, studentId) => {
    setSelectedFormId(formId);
    setSelectedStudentId(studentId);
    setRejectNote("");
    setRejectAction('reject_only');
    setPaymentAmount("");
    setPaymentReason("");
    setRejectModal(true);
  };

  // ================= HANDLE REJECT FORM =================
  const handleRejectForm = async () => {
    try {
      // Validation
      if (!rejectNote.trim()) {
        message.error("Please provide a rejection reason");
        return;
      }
      
      if (rejectAction === 'require_payment') {
        if (!paymentAmount || paymentAmount <= 0) {
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
      
      if (rejectAction === 'require_payment') {
        payload.requires_payment = true;
        payload.payment_amount = parseFloat(paymentAmount);
        payload.payment_reason = paymentReason.trim();
      }
      
      const res = await axios.patch(
        `${API_BASE}librarian/action/${selectedFormId}/`,
        payload,
        { 
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      message.success(res.data.message);
      
      // Update local state
      setForms(prev => prev.map(f => {
        if (f.id === selectedFormId) {
          const updatedForm = { 
            ...f, 
            status: res.data.status,
            library_note: res.data.note
          };
          
          // Add requires_payment flag for UI
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
          description: 'Form has been rejected.',
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

  // ================= QUICK APPROVE AFTER BOOK CHECK =================
  const quickApproveAfterBookCheck = async (note) => {
    if (!bookDetails.form_id || !selectedStudentId) return;
    
    try {
      Modal.confirm({
        title: 'Confirm Approval',
        content: `Are you sure you want to approve this form with note: "${note}"?`,
        onOk: async () => {
          const res = await axios.patch(
            `${API_BASE}librarian/action/${bookDetails.form_id}/`,
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
            f.id === bookDetails.form_id ? { 
              ...f, 
              status: "approved_library",
              library_note: res.data.note
            } : f
          ));
          
          message.success("Form approved and sent to Cafeteria!");
          setBookModal(false);
          
          notification.success({
            message: 'Sent to Cafeteria',
            description: 'Clearance form has been forwarded to Cafeteria department.',
            icon: <ShopOutlined />,
            duration: 4,
          });
          
          // Reload stats
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
      pending: formsList.filter(f => f.status === "approved_department").length,
      approved: formsList.filter(f => f.status === "approved_library").length,
      rejected: formsList.filter(f => f.status === "rejected" && f.library_note).length
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

  // ================= CHECK IF STUDENT HAS DUE (MANUAL REGISTRY ONLY) =================
  const checkIfStudentHasDue = (studentId) => {
    return dueStudents.some(due => 
      due.student_id === studentId && 
      (due.status === 'overdue' || due.status === 'due_soon')
    );
  };

  // ================= RENDER STATUS =================
  const renderStatus = (status, libraryNote) => {
    switch(status) {
      case "approved_library":
        return (
          <Badge 
            status="success" 
            text={
              <Space>
                <CheckCircleOutlined />
                <span style={{ fontWeight: 'bold' }}>APPROVED</span>
                <Tag color="green">Sent to Cafeteria</Tag>
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
                {libraryNote && (
                  <Tooltip title={libraryNote}>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                  </Tooltip>
                )}
              </Space>
            }
          />
        );
      case "approved_department":
        return (
          <Badge 
            status="processing" 
            text={
              <Space>
                <ClockCircleOutlined />
                <span style={{ fontWeight: 'bold' }}>PENDING</span>
                <Tag color="blue"> Check Required</Tag>
              </Space>
            }
          />
        );
      case "requires_library_payment":
        return (
          <Badge 
            status="warning" 
            text={
              <Space>
                <DollarOutlined />
                <span style={{ fontWeight: 'bold' }}>PAYMENT REQUIRED</span>
                <Tag color="orange">Library Fines</Tag>
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
    let currentStep = 0;
    let steps = [];
    
    if (form.status === "approved_department") {
      currentStep = 1;
      steps = [
        { title: "Dept. Head", status: "finish", icon: <CheckCircleOutlined /> },
        { title: "Library", status: "process", icon: <ClockCircleOutlined /> },
        { title: "Cafeteria", status: "wait", icon: <ShopOutlined /> },
        { title: "Dormitory", status: "wait", icon: <HomeOutlined /> },
        { title: "Completed", status: "wait", icon: <CheckCircleOutlined /> }
      ];
    } else if (form.status === "approved_library") {
      currentStep = 2;
      steps = [
        { title: "Dept. Head", status: "finish", icon: <CheckCircleOutlined /> },
        { title: "Library", status: "finish", icon: <CheckCircleOutlined /> },
        { title: "Cafeteria", status: "process", icon: <ClockCircleOutlined /> },
        { title: "Dormitory", status: "wait", icon: <HomeOutlined /> },
        { title: "Completed", status: "wait", icon: <CheckCircleOutlined /> }
      ];
    } else if (form.status === "rejected") {
      currentStep = 1;
      steps = [
        { title: "Dept. Head", status: "finish", icon: <CheckCircleOutlined /> },
        { title: "Library", status: "error", icon: <CloseCircleOutlined /> },
        { title: "Cafeteria", status: "wait", icon: <ShopOutlined /> },
        { title: "Dormitory", status: "wait", icon: <HomeOutlined /> },
        { title: "Completed", status: "wait", icon: <CheckCircleOutlined /> }
      ];
    } else if (form.status === "requires_library_payment") {
      currentStep = 1;
      steps = [
        { title: "Dept. Head", status: "finish", icon: <CheckCircleOutlined /> },
        { title: "Library", status: "process", icon: <DollarOutlined /> },
        { title: "Cafeteria", status: "wait", icon: <ShopOutlined /> },
        { title: "Dormitory", status: "wait", icon: <HomeOutlined /> },
        { title: "Completed", status: "wait", icon: <CheckCircleOutlined /> }
      ];
    }
    
    return (
      <Steps size="small" current={currentStep} style={{ marginTop: 20 }}>
        {steps.map((step, index) => (
          <Step 
            key={index}
            title={step.title}
            icon={step.icon}
            status={step.status}
          />
        ))}
      </Steps>
    );
  };

  // ================= BOOKS TABLE COLUMNS =================
  const bookColumns = [
    {
      title: 'Book Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.book_id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>
            <CalendarOutlined /> Borrow: {record.borrow_date}
          </Text>
          <Text>
            <CalendarOutlined /> Due: {record.due_date}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Reg: {record.registered_date}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          color={
            status === 'overdue' ? 'red' : 
            status === 'due_soon' ? 'orange' : 'green'
          }
          icon={
            status === 'overdue' ? <WarningOutlined /> : 
            status === 'due_soon' ? <ClockCircleOutlined /> : <CheckCircleOutlined />
          }
        >
          {status === 'overdue' ? 'OVERDUE' : 
           status === 'due_soon' ? 'DUE SOON' : 'CLEAR'}
        </Tag>
      ),
    },
    {
      title: 'Fine',
      dataIndex: 'fine',
      key: 'fine',
      render: (fine) => (
        <Text strong type={fine > 0 ? "danger" : "success"}>
          <DollarOutlined /> {fine > 0 ? `$${fine.toFixed(2)}` : 'No fine'}
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
  const dueColumns = [
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
      title: 'Book Title',
      dataIndex: 'book_title',
      key: 'book_title',
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary">Due: {record.due_date}</Text>
          <Text type="secondary">Borrow: {record.borrow_date}</Text>
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
      title: 'Fine',
      dataIndex: 'fine_amount',
      key: 'fine',
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
                  book_title: record.book_title,
                  book_id: record.book_id,
                  borrow_date: dayjs(record.borrow_date),
                  due_date: dayjs(record.due_date),
                  fine_amount: record.fine_amount
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
    if (!bookModal) return null;
    
    let title = " VERIFICATION REQUIRED";
    let description = "Librarian must  verify book status.";
    let action = "Action: Check records before deciding";
    let bgColor = "#fff7e6";
    let icon = <WarningOutlined style={{ color: '#fa8c16' }} />;
    
    if (bookDetails.has_due_books) {
      title = "CHECK DUE BOOKS";
      description = "Student has registered due books. Verify if cleared.";
      action = "Action:  verify if dues are paid";
      bgColor = "#fff2f0";
      icon = <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    } else if (!bookDetails.has_borrowed_books) {
      title = "NO REGISTERED BOOKS";
      description = "No books found in registry. Still need  check.";
      action = "Action: Verify student hasn't borrowed any books";
      bgColor = "#f6ffed";
      icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    
    return (
      <Card 
        title={<Space><WarningOutlined /> Verification Guide</Space>}
        size="small"
        style={{ 
          marginTop: 20,
          background: bgColor
        }}
      >
        <Space direction="vertical" size="small">
          <Text strong style={{ color: icon.props.style.color }}>
            {icon} {title}
          </Text>
          <Text type="secondary">{description}</Text>
          <Text type="secondary">{action}</Text>
          <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
            Source:  Registry • Checked by: {bookDetails.checked_by} • {bookDetails.checked_at}
          </Text>
        </Space>
      </Card>
    );
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

  // ================= RENDER FORM CARD =================
  const renderFormCard = (form) => {
    const isPending = form.status === "approved_department";
    const isApproved = form.status === "approved_library";
    const isRejected = form.status === "rejected";
    const requiresPayment = form.status === "requires_library_payment" || form.requires_payment;
    
    // Check if student has due in MANUAL registry only
    const hasDue = checkIfStudentHasDue(form.id_number);
    
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
            requiresPayment ? "#faad14" :
            hasDue ? "#ff4d4f" : "#1890ff"
          }`,
          transition: 'all 0.3s',
          cursor: 'pointer',
        }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <UserOutlined />
              <Text strong style={{ fontSize: '16px' }}>{form.full_name}</Text>
              {hasDue && (
                <Tooltip title="Student has due books in  registry">
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                </Tooltip>
              )}
            </Space>
            {renderStatus(form.status, form.library_note)}
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
            message="Due Books in Registry"
            description="Student has due books in the manual registry. Please verify physically."
            type="warning"
            showIcon
            style={{ marginTop: 10 }}
          />
        )}
        
        {requiresPayment && (
          <Alert
            message="Payment Required"
            description={
              <div>
                <p><strong>Amount:</strong> ETB {form.payment_amount || 'N/A'}</p>
                <p><strong>Reason:</strong> {form.payment_reason || form.note}</p>
                <Button 
                  type="link" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    message.info("Student needs to make payment to continue");
                  }}
                >
                  Check Payments
                </Button>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginTop: 10 }}
          />
        )}
        
        {renderClearanceFlow(form)}
        
        {form.reason && (
          <Alert
            message="Clearance Reason"
            description={form.reason}
            type="info"
            showIcon
            style={{ marginTop: 15 }}
          />
        )}
        
        {isPending && (
          <Space style={{ marginTop: 15, width: '100%', justifyContent: 'center' }}>
            <Tooltip title="Check Manual Book Registry">
              <Button
                type="primary"
                icon={<BookOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  checkBookStatus(form.student_id || form.id_number, form.id);
                }}
                loading={checkingBooks && selectedStudentId === (form.student_id || form.id_number)}
                style={{ background: "#1890ff", borderColor: "#1890ff" }}
              >
                Check Book Registry
              </Button>
            </Tooltip>
            
            <Popconfirm
              title="Manual Book Verification Required"
              description="Have you  verified this student's book status?"
              onConfirm={(e) => {
                e?.stopPropagation();
                approveForm(form.id, form.student_id || form.id_number);
              }}
              okText="Yes, I've checked - Approve"
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
                {hasDue ? "Verify Dues First" : "Approve"}
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
        
        {form.library_note && (
          <Alert
            message="Librarian Action"
            description={form.library_note}
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
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          color: 'white',
          boxShadow: '0 8px 25px rgba(24, 144, 255, 0.3)'
        }}
        bodyStyle={{ padding: '20px 30px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                <BookOutlined /> Library Clearance System
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
                Welcome, {user?.username || 'Librarian'} - Library Manager
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
              <Button 
                icon={<DollarOutlined />}
                onClick={() => navigate("/librarian/payments")}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
                Payment Verification
              </Button>
              <Button 
                icon={<DatabaseOutlined />}
                onClick={() => setDueRegistrationModal(true)}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
              >
                Due Registry
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  loadForms(token);
                  loadDueStudents();
                }}
                loading={loading}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
              >
                Refresh
              </Button>
              <Button 
                danger 
                icon={<LogoutOutlined />} 
                onClick={logout}
                style={{ background: 'rgba(255,77,79,0.9)', color: 'white', border: 'none' }}
              >
                Logout
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
              border: '2px solid #1890ff',
              background: 'white'
            }}
            onClick={() => setSearchTerm('')}
          >
            <Statistic 
              title="Total Forms" 
              value={stats.total} 
              valueStyle={{ color: '#1890ff', fontSize: '32px' }}
              prefix={<FileTextOutlined />}
            />
            <Text type="secondary">From all departments</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            style={{ 
              textAlign: 'center', 
              borderRadius: 10,
              border: '2px solid #faad14',
              background: 'white'
            }}
          >
            <Statistic 
              title="Pending Check" 
              value={stats.pending} 
              valueStyle={{ color: '#faad14', fontSize: '32px' }}
              prefix={<ClockCircleOutlined />}
            />
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
              title=" Approved" 
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
            <Text type="secondary">Books/Dues issues found</Text>
          </Card>
        </Col>
      </Row>

      {/* ================= TABS ================= */}
      <Tabs 
        defaultActiveKey="forms"
        style={{ marginBottom: 20 }}
      >
        <TabPane tab={<span><BookOutlined /> Clearance Forms</span>} key="forms">
          {/* ================= MANUAL VERIFICATION ALERT ================= */}
          <Alert
            message="BOOK VERIFICATION REQUIRED"
            description={
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li><strong>No automatic checking - Librarian must  verify</strong></li>
                <li>Check the  due registry for reference</li>
                <li> verify if student has borrowed books</li>
                <li>Check if any books are overdue or have fines</li>
                <li>Update the  registry if needed</li>
              </ol>
            }
            type="warning"
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
                onClick={() => loadForms(token)}
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
                Loading clearance forms from departments...
              </p>
            </div>
          ) : filteredForms.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 60, borderRadius: 10, background: 'white' }}>
              <div style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: 20 }}>
                <FileTextOutlined />
              </div>
              <Title level={4} type="secondary">
                {searchTerm ? `No results for "${searchTerm}"` : "No forms awaiting library clearance"}
              </Title>
              <Text type="secondary">
                All department-approved forms have been processed
              </Text>
            </Card>
          ) : (
            filteredForms.map(renderFormCard)
          )}
        </TabPane>
        
        <TabPane tab={<span><DatabaseOutlined /> Manual Due Registry</span>} key="dues">
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
            columns={dueColumns}
            dataSource={searchDueStudents()}
            rowKey="id"
            loading={loadingDues}
            pagination={{ pageSize: 10 }}
            style={{ background: 'white', borderRadius: 10 }}
            title={() => (
              <Space>
                <DatabaseOutlined />
                <Text strong> Due Registry</Text>
                <Tag color="red">Total: {searchDueStudents().length} records</Tag>
                <Tag color="orange">
                  Total Fines: ${searchDueStudents().reduce((sum, due) => sum + due.fine_amount, 0).toFixed(2)}
                </Tag>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This is a  registry. Not connected to automatic systems.
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
            {selectedForm && renderStatus(selectedForm.status, selectedForm.library_note)}
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
                    message={selectedForm.status === "approved_library" ? " Approval Note" : "Rejection Note"}
                    description={selectedForm.library_note}
                    type={selectedForm.status === "approved_library" ? "success" : "error"}
                    showIcon
                  />
                </Descriptions.Item>
              )}
            </Descriptions>
            {selectedForm.status === "approved_department" && (
              <div style={{ marginTop: 20, padding: '20px', background: '#f6f8fa', borderRadius: 8 }}>
                <Title level={5} style={{ marginBottom: 15 }}>
                  <BookOutlined /> Book Verification Required
                </Title>
                <Alert
                  message="No Automatic Checking"
                  description="You must  verify the student's book borrowing status. Check the  registry for reference."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 15 }}
                />
                <Space size="large">
                  <Button
                    type="primary"
                    icon={<BookOutlined />}
                    onClick={() => checkBookStatus(selectedForm.student_id || selectedForm.id_number, selectedForm.id)}
                    loading={checkingBooks}
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

      {/* ================= BOOK DETAILS MODAL ================= */}
      <Modal
        title={
          <Space>
            <BookOutlined />
            <span> Book Registry Check</span>
            {bookDetails.student_info && (
              <Tag color="blue">
                {bookDetails.student_info.student_name || bookDetails.student_info.id_number}
              </Tag>
            )}
          </Space>
        }
        open={bookModal}
        onCancel={() => setBookModal(false)}
        footer={[
          <Button key="close" onClick={() => setBookModal(false)}>
            Close
          </Button>,
          <Button 
            key="approve" 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Confirm  Verification',
                content: 'Have you  verified this student has no book issues?',
                onOk: () => quickApproveAfterBookCheck("Approved after  book verification")
              });
            }}
            disabled={!bookDetails.form_id}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Approve ( Verified)
          </Button>
        ]}
        width={900}
      >
        {bookDetails.student_info && (
          <Alert
            message=" Registry Check Only"
            description="This is from the  registry. You must  verify."
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}
        
        <div style={{ marginBottom: 20 }}>
          <Alert
            message={bookDetails.has_due_books ? "DUE BOOKS IN REGISTRY" : "NO DUE BOOKS IN REGISTRY"}
            description={
              bookDetails.has_due_books 
                ? `Student has ${bookDetails.books.filter(b => b.status === 'overdue' || b.status === 'due_soon').length} book(s) marked as due in  registry.`
                : "No due books found in  registry. Still requires  verification."
            }
            type={bookDetails.has_due_books ? "warning" : "info"}
            showIcon
            icon={
              bookDetails.has_due_books ? <WarningOutlined /> : <InfoCircleOutlined />
            }
          />
        </div>
        
        {bookDetails.books.length > 0 ? (
          <>
            <Table 
              columns={bookColumns} 
              dataSource={bookDetails.books} 
              pagination={false}
              rowKey="id"
              style={{ marginBottom: 20 }}
              title={() => (
                <Text type="secondary">
                  Manual Registry Records • Last checked: {bookDetails.checked_at}
                </Text>
              )}
            />
            
            {bookDetails.has_due_books && (
              <Card 
                title={<><DollarOutlined /> Registered Fines</>}
                size="small"
                style={{ background: '#fff2f0' }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Registered Fines"
                      value={bookDetails.total_fines || 0}
                      prefix="$"
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Books with Issues"
                      value={bookDetails.books.filter(b => b.status === 'overdue' || b.status === 'due_soon').length}
                      suffix={`/ ${bookDetails.books.length}`}
                    />
                  </Col>
                </Row>
              </Card>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: 16 }}>
              <DatabaseOutlined />
            </div>
            <Title level={4} type="secondary">
              No Records in  Registry
            </Title>
            <Text type="secondary">
              This student has no book records in the  registry.
              <br />
              You must verify.
            </Text>
          </div>
        )}
        
        {/* Manual Verification Guide */}
        {renderDecisionGuide()}
      </Modal>

      {/* ================= REJECT MODAL ================= */}
      {rejectModal && (
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
          okText={rejectAction === 'require_payment' ? "Reject & Require Payment" : "Reject"}
          okButtonProps={{ 
            danger: true,
            icon: <CloseOutlined />,
            disabled: !rejectNote.trim() || (rejectAction === 'require_payment' && (!paymentAmount || paymentAmount <= 0))
          }}
          cancelText="Cancel"
          width={600}
        >
          <Alert
            message="Rejection Action"
            description="Choose whether to reject permanently or require payment."
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />
          
          <div style={{ marginBottom: 20 }}>
            <Radio.Group 
              value={rejectAction} 
              onChange={(e) => setRejectAction(e.target.value)}
              style={{ width: '100%' }}
            >
              <Radio value="reject_only" style={{ display: 'block', marginBottom: 8 }}>
                <Space>
                  <CloseCircleOutlined />
                  <span>Reject Permanently (Form cannot continue)</span>
                </Space>
              </Radio>
              <Radio value="require_payment" style={{ display: 'block' }}>
                <Space>
                  <DollarOutlined />
                  <span>Reject but Allow Payment to Continue</span>
                </Space>
              </Radio>
            </Radio.Group>
          </div>
          
          {rejectAction === 'require_payment' && (
            <div style={{ marginBottom: 20, padding: 16, background: '#f6ffed', borderRadius: 6 }}>
              <Form layout="vertical">
                <Form.Item 
                  label="Required Payment Amount (ETB)"
                  validateStatus={paymentAmount && paymentAmount > 0 ? "success" : "error"}
                  help={paymentAmount && paymentAmount > 0 ? "" : "Enter a valid amount"}
                  required
                >
                  <InputNumber
                    value={paymentAmount}
                    onChange={setPaymentAmount}
                    placeholder="Enter amount"
                    min={1}
                    step={0.01}
                    style={{ width: '100%' }}
                    prefix="ETB"
                  />
                </Form.Item>
                <Form.Item 
                  label="Payment Reason"
                  required
                >
                  <Input.TextArea
                    value={paymentReason}
                    onChange={(e) => setPaymentReason(e.target.value)}
                    placeholder="Why is payment required? (e.g., Library fines, Dormitory damages, etc.)"
                    rows={2}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
              </Form>
            </div>
          )}
          
          <Form.Item
            label="Rejection Reason"
            required
            validateStatus={rejectNote.trim() ? "success" : "error"}
            help={rejectNote.trim() ? "" : "Please provide a reason"}
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter detailed reason for rejection..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              maxLength={500}
              showCount
              autoFocus
            />
          </Form.Item>
          
          <Alert
            message="Note for Student"
            description={
              rejectAction === 'require_payment' 
                ? "Student will be asked to make payment to continue. They'll receive a payment link."
                : "Form will be permanently rejected. Student must resubmit if needed."
            }
            type="info"
            showIcon
          />
        </Modal>
      )}

      {/* ================= DUE REGISTRATION MODAL ================= */}
      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            <span>{editingDue ? 'Edit Due Record' : 'Register New Due'}</span>
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
          message="Registry Only"
          description="This registry is  record keeping. Not connected to automatic systems."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={editingDue ? updateDue : registerNewDue}
          initialValues={{
            fine_amount: 0
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
                name="book_title"
                label="Book Title"
                rules={[{ required: true, message: 'Please enter book title' }]}
              >
                <Input 
                  placeholder="Enter book title" 
                  prefix={<BookOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="book_id"
                label="Book ID"
                rules={[{ required: true, message: 'Please enter book ID' }]}
              >
                <Input 
                  placeholder="Enter book ID" 
                  prefix={<FileTextOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="borrow_date"
                label="Borrow Date"
                rules={[{ required: true, message: 'Please select borrow date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Select borrow date"
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
            name="fine_amount"
            label="Fine Amount"
            rules={[{ required: true, message: 'Please enter fine amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter fine amount"
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
          Library Clearance System •  Verification Only • {new Date().getFullYear()} • 
          <span style={{ marginLeft: 8, color: '#1890ff' }}>
            Total Forms: {stats.total} •  Records: {dueStudents.length}
          </span>
        </Text>
        <div style={{ marginTop: 10 }}>
          <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
            Note: This system requires  verification by librarian. No automatic checking.
          </Text>
        </div>
      </div>
    </div>
  );
} 
