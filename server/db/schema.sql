-- ======================================================================
-- EduCenter CRM - PostgreSQL Production Schema
-- Designed for High Concurrency, RBAC, Integrity, and Audit Trails
-- ======================================================================

-- 1. Users Table (CRM Staff: Super Admin, Admin, Operator, Teacher)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'TEACHER')),
    phone VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    bio TEXT,
    salary_rate NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    duration_months INT NOT NULL DEFAULT 3,
    monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 4. Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    teacher_id VARCHAR(36) NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    days TEXT[] NOT NULL DEFAULT '{}',
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room VARCHAR(50) NOT NULL,
    max_students INT NOT NULL DEFAULT 16,
    monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(15) NOT NULL UNIQUE, -- 5-7 digit high entropy identifier
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('ERKAK', 'AYOL', 'BOSHQA')),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(30),
    course_id VARCHAR(36) REFERENCES courses(id) ON DELETE SET NULL,
    group_id VARCHAR(36) REFERENCES groups(id) ON DELETE SET NULL,
    teacher_id VARCHAR(36) REFERENCES teachers(id) ON DELETE SET NULL,
    lesson_time VARCHAR(50),
    notes TEXT,
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'LEFT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Index for instant lookup by student_id and phone
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);

-- 6. Student Credentials Table (Future Parent/Student Mobile App Authentication)
CREATE TABLE IF NOT EXISTS student_credentials (
    student_id VARCHAR(15) PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
    login VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    plain_temp_password_shown_once VARCHAR(50) NULL,
    is_password_changed BOOLEAN NOT NULL DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Group Students Association Table (Enables multi-group enrollment if needed)
CREATE TABLE IF NOT EXISTS group_students (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LEFT', 'PAUSED')),
    UNIQUE(group_id, student_id)
);

-- 8. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED')),
    notes VARCHAR(255),
    marked_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, student_id, lesson_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(lesson_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    for_month VARCHAR(20) NOT NULL, -- e.g. '2026-09'
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('CASH', 'CARD', 'BANK', 'OTHER')),
    receipt_number VARCHAR(50),
    notes TEXT,
    recorded_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(for_month);

-- 10. Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id VARCHAR(36) NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL, -- 'Dushanba', 'Seshanba', etc.
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(120) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    action VARCHAR(60) NOT NULL,
    entity VARCHAR(60) NOT NULL,
    entity_id VARCHAR(60),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(30) NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
