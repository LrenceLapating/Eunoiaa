# EUNOIA Backend API

Backend API for the EUNOIA psychological well-being assessment system built with Node.js, Express, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📊 Supabase Database Schema

### Required Tables

Create these tables in your Supabase database:

#### 1. Students Table
```sql
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  section VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  id_number VARCHAR(20) UNIQUE NOT NULL,
  year_level INTEGER CHECK (year_level >= 1 AND year_level <= 6) NOT NULL,
  college VARCHAR(100) NOT NULL,
  semester VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_college ON students(college);
CREATE INDEX idx_students_section ON students(section);
CREATE INDEX idx_students_semester ON students(semester);
CREATE INDEX idx_students_status ON students(status);
```

#### 2. Counselors Table (for future use)
```sql
CREATE TABLE counselors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'counselor' CHECK (role IN ('counselor', 'admin')),
  college VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_counselors_email ON counselors(email);
CREATE INDEX idx_counselors_college ON counselors(college);
```

#### 3. Assessments Table (for future use)
```sql
CREATE TABLE assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assessment_type VARCHAR(50) NOT NULL, -- 'ryff_42', 'ryff_54', 'ryff_84'
  responses JSONB NOT NULL, -- Store all question responses
  scores JSONB NOT NULL, -- Store calculated dimension scores
  overall_score DECIMAL(5,2),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessments_student_id ON assessments(student_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_risk_level ON assessments(risk_level);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);
```

### Row Level Security (RLS)

Enable RLS for security:

```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your auth requirements)
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Counselors can view all students" ON students
  FOR ALL USING (auth.role() = 'counselor');

CREATE POLICY "Students can view own assessments" ON assessments
  FOR SELECT USING (auth.uid()::text = student_id::text);

CREATE POLICY "Counselors can view all assessments" ON assessments
  FOR ALL USING (auth.role() = 'counselor');
```

## 🛠 API Endpoints

### Account Management

- `GET /api/accounts/colleges` - Get all colleges with student counts
- `GET /api/accounts/students` - Get students with filtering and pagination
- `POST /api/accounts/upload-csv` - Upload CSV file with student data
- `PUT /api/accounts/students/:id` - Update student information
- `DELETE /api/accounts/students/:id` - Delete student
- `GET /api/accounts/csv-template` - Download CSV template

### Health Check

- `GET /api/health` - Check API and database health

## 📁 CSV Upload Format

The CSV file should have the following columns:

| Column | Description | Required | Example |
|--------|-------------|----------|----------|
| Name | Student's full name | Yes | John Doe |
| Section | Class section | Yes | BSIT-4A |
| Department | Academic department | Yes | Information Technology |
| ID Number | Student ID | Yes | 2020-12345 |
| Email | Student email | Yes | john.doe@student.edu |
| Year Level | Academic year (1-6) | Yes | 4 |

## 🔧 Development

### Project Structure
```
backend/
├── config/
│   └── database.js          # Supabase configuration
├── routes/
│   └── accounts.js          # Account management routes
├── utils/
│   └── validation.js        # Data validation utilities
├── uploads/                 # Temporary file uploads
├── .env.example            # Environment template
├── server.js               # Main server file
└── package.json            # Dependencies
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:8080) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |

## 🚦 Testing

Test the API endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Get colleges
curl http://localhost:3001/api/accounts/colleges

# Get CSV template
curl http://localhost:3001/api/accounts/csv-template
```

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- File upload restrictions
- SQL injection prevention via Supabase

## 📝 Notes

- File uploads are temporarily stored in `./uploads` and cleaned up after processing
- CSV validation includes email format, year level range, and required fields
- College assignment is automatically determined from department/section data
- All timestamps are stored in UTC with timezone information