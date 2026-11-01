import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Table,
  Tag,
  Modal,
  Image,
  message,
  Alert,
  Descriptions,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Input,
  Tabs,
  Spin,
  Form,
  Input as AntInput,
  DatePicker,
  Select,
  Timeline,
  Popconfirm,
  Badge,
  Divider
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FileImageOutlined,
  HistoryOutlined,
  DollarOutlined,
  SearchOutlined,
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  BankOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = AntInput;
const { Option } = Select;
const API_BASE = "http://127.0.0.1:8000/api/";

export default function StaffPaymentVerification() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [verifiedPayments, setVerifiedPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [logsModal, setLogsModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("ucs_current");
    if (!stored) {
      message.error("Please login first");
      navigate("/login");
      return;
    }
    
    const parsed = JSON.parse(stored);
    const allowedRoles = ['librarian', 'cafeteria', 'dormitory'];
    if (!allowedRoles.includes(parsed.role)) {
      message.error("Access denied. Payment verification staff only.");
      navigate("/login");
      return;
    }
    
    setUser(parsed);
    setToken(parsed.token);
    loadData();
    loadStats();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPendingPayments(),
        loadVerifiedPayments(),
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPayments = async () => {
    try {
      const res = await axios.get(`${API_BASE}payment/pending/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setPendingPayments(res.data);
    } catch (err) {
      console.error("Error loading pending payments:", err);
    }
  };

  const loadVerifiedPayments = async () => {
    try {
      const res = await axios.get(`${API_BASE}payment/verified/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setVerifiedPayments(res.data);
    } catch (err) {
      console.error("Error loading verified payments:", err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}payment/statistics/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadVerificationLogs = async (paymentId) => {
    try {
      const res = await axios.get(`${API_BASE}payment/${paymentId}/logs/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setVerificationLogs(res.data);
      setLogsModal(true);
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setViewModal(true);
  };

  const openVerifyModal = (payment, action) => {
    setSelectedPayment(payment);
    form.setFieldsValue({
      action: action,
      note: action === 'reject' ? '' : 'Payment verified successfully.'
    });
    setVerifyModal(true);
  };

  const handleVerify = async (values) => {
    if (!selectedPayment) return;
    
    try {
      setVerifying(true);
      
      const res = await axios.post(
        `${API_BASE}payment/${selectedPayment.id}/verify/`,
        values,
        {
          headers: { Authorization: `Token ${token}` }
        }
      );
      
      message.success(res.data.message);
      
      // Update local state
      if (values.action === 'verify') {
        setPendingPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
        setVerifiedPayments(prev => [res.data, ...prev]);
      } else {
        setPendingPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
        setVerifiedPayments(prev => [{
          ...selectedPayment,
          status: 'rejected',
          rejection_reason: values.note,
          verified_by: user.username,
          verified_at: new Date().toISOString()
        }, ...prev]);
      }
      
      // Reload stats
      loadStats();
      
      // Close modals
      setVerifyModal(false);
      setViewModal(false);
      
    } catch (err) {
      console.error("Verification error:", err);
      message.error(err.response?.data?.error || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

const viewReceipt = async (payment) => {
    try {
        const response = await axios.get(`${API_BASE}payment/${payment.id}/receipt/`, {
            headers: { Authorization: `Token ${token}` },
            responseType: 'blob'
        });
        
        // Create blob URL for the image
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        
        setReceiptImage(url);
        setReceiptModal(true);
    } catch (err) {
        console.error("Error loading receipt:", err);
        message.error("Failed to load receipt");
    }
};

const downloadReceipt = async (payment) => {
    try {
        const response = await axios.get(`${API_BASE}payment/${payment.id}/receipt/`, {
            headers: { Authorization: `Token ${token}` },
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt_${payment.transaction_id}.${payment.receipt_url?.split('.').pop() || 'jpg'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error downloading receipt:", err);
        message.error("Failed to download receipt");
    }
};

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'orange';
      case 'verified': return 'green';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const getDepartmentColor = (dept) => {
    switch(dept) {
      case 'library': return 'blue';
      case 'cafeteria': return 'green';
      case 'dormitory': return 'purple';
      default: return 'default';
    }
  };

  const getFilteredPayments = () => {
    let payments = activeTab === 'pending' ? pendingPayments : verifiedPayments;
    
    // Apply status filter
    if (filterStatus !== 'all') {
      payments = payments.filter(p => p.status === filterStatus);
    }
    
    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      payments = payments.filter(p => {
        const paymentDate = dayjs(p.created_at);
        return paymentDate.isAfter(start) && paymentDate.isBefore(end);
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      payments = payments.filter(p =>
        p.transaction_id.toLowerCase().includes(term) ||
        p.student_name.toLowerCase().includes(term) ||
        p.student_id.toLowerCase().includes(term) ||
        p.phone_number?.toLowerCase().includes(term)
      );
    }
    
    return payments;
  };

  const pendingColumns = [
    {
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      render: (text) => <Text strong>{text}</Text>,
      sorter: (a, b) => a.transaction_id.localeCompare(b.transaction_id),
    },
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.student_name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <IdcardOutlined /> {record.student_id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'payment_method_name',
      key: 'method',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong type="success">ETB {parseFloat(amount).toFixed(2)}</Text>
      ),
      sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      key: 'submitted',
      render: (date) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(date).format('MMM D')}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(date).format('HH:mm')}
          </Text>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewPaymentDetails(record)}
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<FileImageOutlined />}
            onClick={() => viewReceipt(record)}
            size="small"
          >
            Receipt
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => openVerifyModal(record, 'verify')}
            size="small"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Verify
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => openVerifyModal(record, 'reject')}
            size="small"
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const verifiedColumns = [
    {
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.student_name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.student_id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Verified', value: 'verified' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
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
      title: 'Verified By',
      dataIndex: 'verified_by_name',
      key: 'verified_by',
      render: (name) => name || <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Verified At',
      dataIndex: 'verified_at',
      key: 'verified_at',
      render: (date) => date ? dayjs(date).format('MMM D, YYYY HH:mm') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewPaymentDetails(record)}
            size="small"
          >
            Details
          </Button>
          <Button
            type="link"
            icon={<FileImageOutlined />}
            onClick={() => viewReceipt(record)}
            size="small"
          >
            Receipt
          </Button>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => loadVerificationLogs(record.id)}
            size="small"
          >
            Logs
          </Button>
        </Space>
      ),
    },
  ];

  const renderStatsCards = () => {
    if (!stats) return null;
    
    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Pending"
              value={stats.pending || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
            {stats.today_pending > 0 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {stats.today_pending} new today
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Verified"
              value={stats.verified || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Rejected"
              value={stats.rejected || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.total_amount || 0}
              prefix="ETB"
              valueStyle={{ color: '#1890ff' }}
              precision={2}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {stats.total_payments || 0} payments
            </Text>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderPaymentDetails = () => {
    if (!selectedPayment) return null;
    
    return (
      <div style={{ maxHeight: '70vh', overflow: 'auto', padding: '0 10px' }}>
        <Descriptions 
          column={2} 
          bordered 
          size="small"
          labelStyle={{ fontWeight: 'bold', background: '#fafafa' }}
        >
          <Descriptions.Item label="Transaction ID" span={2}>
            <Text strong style={{ fontSize: '16px' }}>
              {selectedPayment.transaction_id}
            </Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Student">
            <Space direction="vertical" size={0}>
              <Text strong>{selectedPayment.student_name}</Text>
              <Text type="secondary">ID: {selectedPayment.student_id}</Text>
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Department">
            <Tag color={getDepartmentColor(selectedPayment.department_type)}>
              {selectedPayment.department_type.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Payment Method">
            <Tag color="blue">{selectedPayment.payment_method_name}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Amount">
            <Text strong type="success" style={{ fontSize: '18px' }}>
              ETB {parseFloat(selectedPayment.amount).toFixed(2)}
            </Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Payment Date">
            {dayjs(selectedPayment.payment_date).format('MMMM D, YYYY')}
          </Descriptions.Item>
          
          <Descriptions.Item label="Submitted">
            {dayjs(selectedPayment.created_at).format('MMM D, YYYY HH:mm:ss')}
          </Descriptions.Item>
          
          {selectedPayment.phone_number && (
            <Descriptions.Item label="Phone Number">
              <Space>
                <PhoneOutlined />
                {selectedPayment.phone_number}
              </Space>
            </Descriptions.Item>
          )}
          
          {selectedPayment.account_last_digits && (
            <Descriptions.Item label="Account Last Digits">
              <Space>
                <BankOutlined />
                ****{selectedPayment.account_last_digits}
              </Space>
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Status" span={2}>
            <Badge
              status={selectedPayment.status === 'verified' ? 'success' : 
                     selectedPayment.status === 'rejected' ? 'error' : 'processing'}
              text={
                <Tag color={getStatusColor(selectedPayment.status)} style={{ fontSize: '14px' }}>
                  {selectedPayment.status.toUpperCase()}
                </Tag>
              }
            />
          </Descriptions.Item>
          
          {selectedPayment.rejection_reason && (
            <Descriptions.Item label="Rejection Reason" span={2}>
              <Alert
                message={selectedPayment.rejection_reason}
                type="error"
                showIcon
              />
            </Descriptions.Item>
          )}
          
          {selectedPayment.verified_by_name && (
            <Descriptions.Item label="Verified By">
              {selectedPayment.verified_by_name}
            </Descriptions.Item>
          )}
          
          {selectedPayment.verified_at && (
            <Descriptions.Item label="Verified At">
              {dayjs(selectedPayment.verified_at).format('MMM D, YYYY HH:mm')}
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Receipt" span={2}>
            <Space>
              <Button
                type="primary"
                icon={<FileImageOutlined />}
                onClick={() => {
                  setViewModal(false);
                  viewReceipt(selectedPayment);
                }}
              >
                View Receipt
              </Button>
              <Button
                onClick={() => downloadReceipt(selectedPayment)}
              >
                Download Receipt
              </Button>
            </Space>
          </Descriptions.Item>
        </Descriptions>
        
        <Divider orientation="left">Verification Guidelines</Divider>
        
        <Alert
          message="Check These Items Before Verification"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Verify transaction ID matches the receipt</li>
              <li>Check amount matches required department fees</li>
              <li>Verify receipt shows university account details</li>
              <li>Ensure receipt is clear and readable</li>
              <li>Check payment date is valid</li>
              <li>Verify student ID is mentioned in reference</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
        
        {selectedPayment.status === 'pending' && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => openVerifyModal(selectedPayment, 'verify')}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Verify Payment
              </Button>
              <Button
                danger
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={() => openVerifyModal(selectedPayment, 'reject')}
              >
                Reject Payment
              </Button>
            </Space>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>Payment Verification System</span>
            <Tag color="blue" style={{ textTransform: 'capitalize' }}>
              {user?.role}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button onClick={() => navigate(`/${user?.role}`)}>
              Back to Dashboard
            </Button>
          </Space>
        }
      >
        {renderStatsCards()}
        
        <Alert
          message="Payment Verification Instructions"
          description="Verify each payment by checking the receipt against university account details. 
          Ensure the transaction is valid before approving."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Card
          style={{ marginBottom: 24 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Input
                placeholder="Search by Transaction ID, Student Name, or Phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                size="large"
              />
            </Col>
            <Col span={8}>
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={setDateRange}
                size="large"
              />
            </Col>
            <Col span={8}>
              <Select
                style={{ width: '100%' }}
                value={filterStatus}
                onChange={setFilterStatus}
                size="large"
              >
                <Option value="all">All Status</Option>
                <Option value="pending">Pending</Option>
                <Option value="verified">Verified</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </Col>
          </Row>
        </Card>
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 24 }}
        >
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined />
                Pending Verification
                {pendingPayments.length > 0 && (
                  <Badge
                    count={pendingPayments.length}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </span>
            }
            key="pending"
          >
            <Table
              columns={pendingColumns}
              dataSource={getFilteredPayments()}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                Verification History
              </span>
            }
            key="verified"
          >
            <Table
              columns={verifiedColumns}
              dataSource={getFilteredPayments()}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Payment Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>Payment Details</span>
            {selectedPayment && (
              <Tag color={getStatusColor(selectedPayment.status)}>
                {selectedPayment.status.toUpperCase()}
              </Tag>
            )}
          </Space>
        }
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {renderPaymentDetails()}
      </Modal>

      {/* Verification Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined />
            <span>Verify Payment</span>
            {selectedPayment && (
              <Tag color="orange">ID: {selectedPayment.transaction_id}</Tag>
            )}
          </Space>
        }
        open={verifyModal}
        onCancel={() => setVerifyModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleVerify}
        >
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please select action' }]}
          >
            <Select placeholder="Select verification action">
              <Option value="verify">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>Verify Payment</span>
                </Space>
              </Option>
              <Option value="reject">
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  <span>Reject Payment</span>
                </Space>
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.action !== currentValues.action
            }
          >
            {({ getFieldValue }) => 
              getFieldValue('action') === 'reject' ? (
                <Form.Item
                  name="note"
                  label="Rejection Reason"
                  rules={[{ required: true, message: 'Please enter rejection reason' }]}
                  extra="This will be shown to the student"
                >
                  <TextArea
                    rows={4}
                    placeholder="Enter detailed reason for rejection..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  name="note"
                  label="Verification Note (Optional)"
                >
                  <TextArea
                    rows={3}
                    placeholder="Add any verification notes..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              )
            }
          </Form.Item>
          
          <Alert
            message="Important"
            description="Once verified/rejected, this action cannot be undone. Please double-check the receipt before confirming."
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setVerifyModal(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={verifying}
                icon={<CheckCircleOutlined />}
              >
                Confirm
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        title="Payment Receipt"
        open={receiptModal}
        onCancel={() => setReceiptModal(false)}
        footer={null}
        width={800}
      >
        {receiptImage ? (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={receiptImage}
              alt="Payment Receipt"
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                onClick={() => window.open(receiptImage, '_blank')}
              >
                Open in New Tab
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <FileImageOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <p>Receipt not available</p>
          </div>
        )}
      </Modal>

      {/* Verification Logs Modal */}
      <Modal
        title="Verification Logs"
        open={logsModal}
        onCancel={() => setLogsModal(false)}
        footer={null}
        width={600}
      >
        <Timeline>
          {verificationLogs.map((log, index) => (
            <Timeline.Item
              key={index}
              color={log.action === 'verify' ? 'green' : 'red'}
              dot={log.action === 'verify' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            >
              <Space direction="vertical" size={0}>
                <Text strong>{log.verified_by_name}</Text>
                <Text type="secondary">
                  {dayjs(log.created_at).format('MMM D, YYYY HH:mm')}
                </Text>
                <Text>{log.note}</Text>
                <Tag color={log.action === 'verify' ? 'green' : 'red'}>
                  {log.action.toUpperCase()}
                </Tag>
              </Space>
            </Timeline.Item>
          ))}
        </Timeline>
      </Modal>
    </div>
  );
}