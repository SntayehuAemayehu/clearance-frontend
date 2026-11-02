import React, { useEffect, useState } from "react";
import { apiRequest } from "../../utils/api";
import "./ClearanceForm.css";

export default function ClearanceForm() {
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    idNumber: "",
    academicYear: "",
    programLevel: "",
    enrollmentType: "",
    college: "",
    department: "",
    section: "",
    lastAttendance: "",
    year: "",
    semester: "",
    reason: "",
  });

  // Get user session
  const getSession = () => {
    const session = sessionStorage.getItem("ucs_current");
    return session ? JSON.parse(session) : null;
  };

  /* ================= LOAD COLLEGES & DEPARTMENTS ================= */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        // Check if user is logged in
        const session = getSession();
        if (!session || !session.token) {
          setError("Please login first");
          setLoading(false);
          return;
        }

        // Load colleges and departments
        const collegesData = await apiRequest.get('colleges/');
        const departmentsData = await apiRequest.get('departments/');
        
        setColleges(collegesData || []);
        setDepartments(departmentsData || []);
        
      } catch (err) {
        console.error("Failed to load data:", err);
        if (err.message.includes("401") || err.message.includes("403")) {
          setError("Session expired. Please login again.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          setError(`Failed to load data: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* ================= FILTER DEPARTMENTS BY COLLEGE ================= */
  useEffect(() => {
    if (!formData.college) {
      setFilteredDepartments([]);
      setFormData(prev => ({ ...prev, department: "" }));
      return;
    }

    const filtered = departments.filter(
      (d) => d.college && String(d.college) === String(formData.college)
    );

    setFilteredDepartments(filtered);
    
    // Reset department if it's not in the filtered list
    if (formData.department && !filtered.some(d => d.name === formData.department)) {
      setFormData(prev => ({ ...prev, department: "" }));
    }
  }, [formData.college, departments, formData.department]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* ================= VALIDATE FORM ================= */
  const validateForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'idNumber', 'academicYear',
      'programLevel', 'enrollmentType', 'college', 'department',
      'section', 'lastAttendance', 'year', 'semester', 'reason'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        return `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
      }
    }

    const idPattern = /^[A-Za-z]{3,4}\d+$/;
    if (!idPattern.test(formData.idNumber)) {
      return "Invalid ID format (Example: CSE1234)";
    }

    // Validate date
    const selectedDate = new Date(formData.lastAttendance);
    const today = new Date();
    if (selectedDate > today) {
      return "Last attendance date cannot be in the future";
    }

    return null;
  };

  /* ================= GET COLLEGE NAME ================= */
  const getCollegeName = (collegeId) => {
    const college = colleges.find(c => String(c.id) === String(collegeId));
    return college ? college.name : "";
  };

  /* ================= SUBMIT FORM ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    // Get college name for display
    const collegeName = getCollegeName(formData.college);

    const payload = {
      full_name: `${formData.firstName.trim()} ${formData.middleName.trim()} ${formData.lastName.trim()}`.replace(/\s+/g, ' '),
      id_number: formData.idNumber.trim(),
      academic_year: formData.academicYear.trim(),
      program_level: formData.programLevel,
      enrollment_type: formData.enrollmentType,
      college: collegeName,  // Send college name
      department_name: formData.department,  // Send department name
      section: formData.section.trim(),
      last_attendance: formData.lastAttendance,
      year: formData.year,
      semester: formData.semester,
      reason: formData.reason.trim(),
    };

    console.log("Submitting form:", payload);

    try {
      const result = await apiRequest.post('forms/submit/', payload);
      
      alert(result.message || "Form submitted successfully! It will be reviewed by your department head.");
      
      // Reset form
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        idNumber: "",
        academicYear: "",
        programLevel: "",
        enrollmentType: "",
        college: "",
        department: "",
        section: "",
        lastAttendance: "",
        year: "",
        semester: "",
        reason: "",
      });
      
      // Redirect to status page after 2 seconds
      setTimeout(() => {
        window.location.href = "/student-dashboard?tab=status";
      }, 2000);
      
    } catch (err) {
      console.error("Submission error:", err);
      setError(`Submission failed: ${err.message}`);
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= RENDER LOADING ================= */
  if (loading) {
    return (
      <div className="form-page">
        <div className="form-container loading-container">
          <div className="spinner"></div>
          <p>Loading colleges and departments...</p>
        </div>
      </div>
    );
  }

  /* ================= RENDER ERROR ================= */
  if (error) {
    return (
      <div className="form-page">
        <div className="form-container error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <div className="button-group">
            <button 
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.href = "/login"}
              className="login-btn"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= RENDER FORM ================= */
  return (
    <div className="form-page">
      <form className="form-container" onSubmit={handleSubmit}>
        <h1 className="form-title">Student Clearance Form</h1>
        <p className="form-subtitle">Fill out all fields. Your form will be sent to your department head for approval.</p>

        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="three-input-row">
            <input 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleChange} 
              placeholder="First Name *" 
              required 
              disabled={submitting}
            />
            <input 
              name="middleName" 
              value={formData.middleName} 
              onChange={handleChange} 
              placeholder="Middle Name *" 
              required 
              disabled={submitting}
            />
            <input 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleChange} 
              placeholder="Last Name *" 
              required 
              disabled={submitting}
            />
          </div>

          <div className="input-with-note">
            <input 
              name="idNumber" 
              value={formData.idNumber} 
              onChange={handleChange} 
              placeholder="ID Number (Example: CSE1234) *" 
              required 
              disabled={submitting}
              className="id-input"
            />
            <small>Format: 3-4 letters followed by numbers (e.g., CSE1234, IT456)</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Academic Information</h3>
          <input 
            name="academicYear" 
            value={formData.academicYear} 
            onChange={handleChange} 
            placeholder="Academic Year (e.g., 2024/2025) *" 
            required 
            disabled={submitting}
          />

          <div className="select-row">
            <select 
              name="programLevel" 
              value={formData.programLevel} 
              onChange={handleChange} 
              required 
              disabled={submitting}
            >
              <option value="">Program Level *</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>

            <select 
              name="enrollmentType" 
              value={formData.enrollmentType} 
              onChange={handleChange} 
              required 
              disabled={submitting}
            >
              <option value="">Enrollment Type *</option>
              <option value="Regular Full Time">Regular Full Time</option>
              <option value="Regular Part Time">Regular Part Time</option>
              <option value="Extension">Extension</option>
              <option value="Summer">Summer</option>
              <option value="Distance Education">Distance Education</option>
            </select>
          </div>

          <div className="select-row">
            <select 
              name="college" 
              value={formData.college} 
              onChange={handleChange} 
              required 
              disabled={submitting || colleges.length === 0}
              className={colleges.length === 0 ? "disabled-select" : ""}
            >
              <option value="">Select College *</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              required 
              disabled={submitting || filteredDepartments.length === 0 || !formData.college}
              className={filteredDepartments.length === 0 ? "disabled-select" : ""}
            >
              <option value="">Select Department *</option>
              {filteredDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {formData.college && (
            <div className="info-bubble">
              <strong>Selected College:</strong> {getCollegeName(formData.college)}
              {formData.department && (
                <><br /><strong>Selected Department:</strong> {formData.department}</>
              )}
            </div>
          )}

          <input 
            name="section" 
            value={formData.section} 
            onChange={handleChange} 
            placeholder="Section (e.g., A, B, C) *" 
            required 
            disabled={submitting}
          />
        </div>

        <div className="form-section">
          <h3>Attendance Information</h3>
          <div className="date-row">
            <label>Last Attendance Date *</label>
            <input 
              type="date" 
              name="lastAttendance" 
              value={formData.lastAttendance} 
              onChange={handleChange} 
              required 
              disabled={submitting}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="select-row">
            <select 
              name="year" 
              value={formData.year} 
              onChange={handleChange} 
              required 
              disabled={submitting}
            >
              <option value="">Class Year *</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
              <option value="VI">VI</option>
              <option value="VII">VII</option>
              <option value="VIII">VIII</option>
            </select>

            <select 
              name="semester" 
              value={formData.semester} 
              onChange={handleChange} 
              required 
              disabled={submitting}
            >
              <option value="">Semester *</option>
              <option value="I">I</option>
              <option value="II">II</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Clearance Reason</h3>
          <div className="input-with-note">
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="5"
              placeholder="Please explain the reason for clearance in detail *"
              required
              disabled={submitting}
              className="reason-textarea"
            />
            <small>Explain why you need clearance (e.g., graduation, transfer, withdrawal, etc.)</small>
          </div>
        </div>

        <div className="form-actions">
          <button 
            className="form-btn" 
            type="submit" 
            disabled={submitting || colleges.length === 0}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span>
                Submitting...
              </>
            ) : (
              "Submit Clearance Form"
            )}
          </button>
          
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => window.location.href = "/student-dashboard"}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>

        {colleges.length === 0 && !loading && (
          <div className="error-message">
            <strong>Warning:</strong> No colleges found. Please contact the administrator.
          </div>
        )}
      </form>
    </div>
  );
}
