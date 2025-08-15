# 📚 Mô tả các Models trong Hệ thống Korea-DB

Tài liệu này mô tả chi tiết tất cả các models (schema) được sử dụng trong hệ thống quản lý học tập tiếng Hàn Korea-DB.

## 📖 Mục lục

1. [User Model](#user-model) - Quản lý người dùng
2. [Course Model](#course-model) - Quản lý khóa học
3. [Class Model](#class-model) - Quản lý lớp học
4. [Lesson Model](#lesson-model) - Quản lý bài học
5. [Assignment Model](#assignment-model) - Quản lý bài tập
6. [Submission Model](#submission-model) - Quản lý bài nộp
7. [ChatMessage Model](#chatmessage-model) - Tin nhắn chat AI
8. [FlashcardDeck Model](#flashcarddeck-model) - Bộ thẻ từ vựng
9. [ThematicVocabulary Model](#thematicvocabulary-model) - Từ vựng theo chủ đề
10. [Các Models Khác](#các-models-khác)

---

## 👤 User Model

**File:** `src/models/User.js`

### Mục đích
Quản lý thông tin người dùng trong hệ thống, bao gồm học viên, giáo viên và quản trị viên.

### Cấu trúc Schema

#### Thông tin cơ bản
```javascript
{
  email: String (required, unique, lowercase),
  password: String (required),
  fullName: String (required),
  profileImage: String,
  role: ["student", "teacher", "admin"] (default: "student"),
  level: ["beginner", "intermediate", "advanced"] (default: "beginner")
}
```

#### Thông tin cá nhân
```javascript
{
  gender: ["male", "female", "other", ""],
  dateOfBirth: Date,
  phone: String,
  address: String,
  emergencyContact: String
}
```

#### Thông tin học tập
```javascript
{
  koreanLevel: ["", "TOPIK 1", "TOPIK 2", "TOPIK 3", "TOPIK 4", "TOPIK 5", "TOPIK 6"],
  learningGoal: String,
  interests: [String],
  progress: {
    completedLessons: [ObjectId],
    completedCourses: [ObjectId],
    totalPoints: Number
  }
}
```

#### Subscription & Settings
```javascript
{
  subscription: {
    type: ["free", "basic", "premium"],
    expiryDate: Date
  },
  notifications: {
    email: Boolean,
    push: Boolean
  },
  socialMedia: {
    facebook: String,
    instagram: String
  }
}
```

#### Quản lý tài khoản
```javascript
{
  isActive: Boolean,
  blockReason: String,
  blockDate: Date,
  blockedBy: ObjectId,
  lastActive: Date,
  emailVerified: Boolean,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

### Virtual Fields
- `age`: Tính tuổi từ ngày sinh
- `genderDisplay`: Hiển thị giới tính bằng tiếng Việt

### Features
- Middleware tự động cập nhật `lastActive` khi save
- Validation email format và unique
- Hash password với bcrypt
- Support cho OAuth và email verification

---

## 🎓 Course Model

**File:** `src/models/Course.js`

### Mục đích
Quản lý thông tin các khóa học tiếng Hàn trong hệ thống.

### Cấu trúc Schema

```javascript
{
  title: String (required),
  description: String (required),
  level: ["beginner", "intermediate", "advanced"],
  category: ["Ngữ pháp", "Từ vựng", "Nghe nói", "Viết"],
  duration: String (required),
  price: Number (required, min: 0),
  imageUrl: String (default: "/images/default-course.jpg"),
  instructor: ObjectId (ref: "User", required),
  status: ["active", "inactive"],
  enrolledCount: Number (default: 0),
  lessons: [ObjectId] (ref: "Lesson"),
  createdAt: Date,
  updatedAt: Date
}
```

### Features
- Validation giá không âm
- Reference đến User (instructor)
- Auto-increment enrolledCount
- Support multiple categories
- Status management cho course lifecycle

---

## 🏫 Class Model

**File:** `src/models/class.js`

### Mục đích
Quản lý các lớp học cụ thể, nhóm học viên theo khóa học.

### Cấu trúc Schema

```javascript
{
  name: String (required),
  course: ObjectId (ref: "Course", required),
  description: String (required),
  teacher: ObjectId (ref: "User", required),
  students: [ObjectId] (ref: "User"),
  pendingRequests: [ObjectId] (ref: "User"),
  startDate: Date (required),
  endDate: Date (required),
  schedule: {
    days: [String],
    time: String
  },
  status: ["active", "completed", "cancelled"],
  maxStudents: Number (required),
  classImage: String,
  assignments: [ObjectId] (ref: "Assignment")
}
```

### Methods
- `canCreateAssignment()`: Kiểm tra có thể tạo assignment không
- `calculateProgress()`: Tính tiến độ học tập của lớp

### Features
- Quản lý pending requests (yêu cầu tham gia)
- Schedule management với days và time
- Capacity control với maxStudents
- Assignment tracking
- Status lifecycle management

---

## 📖 Lesson Model

**File:** `src/models/lesson.js`

### Mục đích
Quản lý nội dung bài học trong từng khóa học.

### Cấu trúc Schema

```javascript
{
  title: String (required),
  description: String (required),
  courseId: ObjectId (ref: "Course"),
  content: {
    text: String,
    videoUrl: String,
    attachments: [String]
  },
  order: Number (default: 0),
  duration: Number (default: 0),
  exercises: [ObjectId] (ref: "Exercise"),
  createdAt: Date,
  updatedAt: Date
}
```

### Features
- Multi-media content support (text, video, files)
- Ordering system cho sequence
- Duration tracking
- Linked exercises
- Rich content structure

---

## 📝 Assignment Model

**File:** `src/models/Assignment.js`

### Mục đích
Quản lý bài tập được giao cho học viên trong lớp học.

### Cấu trúc Schema

```javascript
{
  title: String (required),
  description: String,
  dueDate: Date (required),
  class: ObjectId (ref: "Class", required),
  createdBy: ObjectId (ref: "User", required),
  maxScore: Number (default: 10),
  status: ["active", "expired"],
  submissionStats: {
    total: Number,
    submitted: Number,
    graded: Number
  },
  attachmentFile: String,
  instructions: String,
  allowLateSubmission: Boolean
}
```

### Features
- Due date management
- Score tracking (maxScore)
- Submission statistics
- File attachments support
- Late submission control
- Auto status management (active/expired)

---

## 📤 Submission Model

**File:** `src/models/submission.js`

### Mục đích
Quản lý bài nộp của học viên cho các assignment.

### Cấu trúc Schema

```javascript
{
  assignment: ObjectId (ref: "Assignment", required),
  student: ObjectId (ref: "User", required),
  fileName: String (required),
  fileType: String (required),
  submittedAt: Date (default: Date.now),
  status: ["pending", "graded", "late"],
  grade: {
    score: Number,
    maxScore: Number,
    feedback: String,
    gradedBy: ObjectId (ref: "User"),
    gradedAt: Date
  },
  filePath: String,
  fileSize: Number,
  isLate: Boolean
}
```

### Methods
- `calculateGradePercentage()`: Tính phần trăm điểm
- `isOverdue()`: Kiểm tra quá hạn

### Features
- File management (path, size, type)
- Grade tracking với feedback
- Late submission detection
- Status lifecycle
- Teacher grading support

---

## 💬 ChatMessage Model

**File:** `src/models/ChatMessage.js`

### Mục đích
Lưu trữ cuộc hội thoại giữa người dùng và AI chatbot.

### Cấu trúc Schema

```javascript
{
  userId: ObjectId (ref: "User", required),
  message: String (required),
  response: String (required),
  context: {
    courseId: ObjectId (ref: "Course"),
    level: String
  },
  timestamp: Date (default: Date.now)
}
```

### Features
- User-AI conversation tracking
- Context awareness (course, level)
- Timestamp cho conversation history
- Support cho personalized responses

---

## 🃏 FlashcardDeck Model

**File:** `src/models/flashcardDeck.js`

### Mục đích
Quản lý bộ thẻ từ vựng cho việc ôn tập và học thuộc lòng.

### Cấu trúc Schema

```javascript
{
  title: String (required),
  description: String,
  level: ["beginner", "intermediate", "advanced"],
  category: ["daily", "food", "business"],
  createdBy: ObjectId (ref: "User"),
  isPublic: Boolean (default: true),
  cards: [{
    front: String (required),
    back: String (required),
    example: String,
    audioUrl: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Features
- Public/private deck management
- Multi-category support
- Card structure với example và audio
- Level-based organization
- User-created content

---

## 📚 ThematicVocabulary Model

**File:** `src/models/ThematicVocabulary.js`

### Mục đích
Quản lý từ vựng theo chủ đề cụ thể cho việc học có hệ thống.

### Cấu trúc Schema

```javascript
{
  theme: String (required),
  level: ["basic", "intermediate", "advanced"] (required),
  imageUrl: String,
  words: [{
    korean: String (required),
    meaning: String (required),
    pronunciation: String (required),
    imageUrl: String
  }],
  createdBy: ObjectId (ref: "User", required),
  createdAt: Date,
  updatedAt: Date
}
```

### Features
- Theme-based vocabulary organization
- Level progression support
- Rich word data (korean, meaning, pronunciation)
- Image support cho visual learning
- Teacher-created content

---

## 📋 Các Models Khác

### 📊 Attendance Model
**File:** `src/models/Attendance.js`
- Quản lý điểm danh học viên
- Tracking presence/absence
- Date và time management

### 🗨️ Discussion Model
**File:** `src/models/discussion.js`
- Forum discussions
- Thread management
- Reply system

### 📄 Document Model
**File:** `src/models/document.js`
- Document storage và management
- File metadata
- Access control

### 🏃 Exercise Model
**File:** `src/models/exercise.js`
- Interactive exercises
- Question types management
- Answer validation

### 📮 Forum Model
**File:** `src/models/forum.js`
- Forum structure
- Category management
- Post organization

### 💰 Invoice Model
**File:** `src/models/Invoice.js`
- Payment tracking
- Course enrollment billing
- Transaction records

### 📄 Material Model
**File:** `src/models/material.js`
- Learning materials
- Resource management
- File organization

### 💌 Message Model
**File:** `src/models/Message.js`
- Direct messaging
- User-to-user communication
- Message threading

### 🔔 Notification Model
**File:** `src/models/notification.js`
- System notifications
- User alerts
- Read/unread status

### 🔑 PasswordReset Model
**File:** `src/models/PasswordReset.js`
- Password reset tokens
- Security management
- Expiration handling

### 📈 ProgressTracking Model
**File:** `src/models/progressTracking.js`
- Learning progress analytics
- Achievement tracking
- Performance metrics

### 📚 Resource Model
**File:** `src/models/resource.js`
- Educational resources
- Content library
- Resource categorization

### 📅 StudyPlan Model
**File:** `src/models/studyPlan.js`
- Personalized study plans
- Goal setting
- Progress scheduling

### 🧪 ClassTest Model
**File:** `src/models/ClassTest.js`
- Online testing system
- Question management
- Result tracking

---

## 🔗 Relationships Overview

### User Relationships
- **User** ↔ **Course** (Many-to-Many via enrollment)
- **User** ↔ **Class** (Many-to-Many as students)
- **User** → **Assignment** (One-to-Many as creator)
- **User** → **Submission** (One-to-Many as student)

### Course Structure
- **Course** → **Lesson** (One-to-Many)
- **Course** → **Class** (One-to-Many)
- **Class** → **Assignment** (One-to-Many)
- **Assignment** → **Submission** (One-to-Many)

### Content Organization
- **FlashcardDeck** → **Cards** (Embedded documents)
- **ThematicVocabulary** → **Words** (Embedded documents)
- **Lesson** → **Exercise** (One-to-Many)

---

## 🛠️ Technical Notes

### Database Technology
- **MongoDB** với **Mongoose ODM**
- Schema validation và middleware support
- Automatic timestamps (`createdAt`, `updatedAt`)

### Common Patterns
1. **Reference Pattern**: Sử dụng ObjectId references cho relationships
2. **Embedded Pattern**: Sử dụng subdocuments cho tightly coupled data
3. **Validation**: Field-level validation với custom messages
4. **Indexing**: Unique constraints và performance optimization
5. **Middleware**: Pre/post hooks cho business logic

### Best Practices
- Consistent naming conventions (camelCase)
- Required field validation
- Default values cho optional fields
- Enum constraints cho controlled values
- Reference integrity với proper refs
- Timestamp tracking cho audit trails

---

## 📝 Notes for Developers

1. **Model Import**: Một số models có duplicate prevention để tránh re-compilation
2. **Validation**: Tất cả models đều có comprehensive validation
3. **Relationships**: Sử dụng populate() để load related data
4. **Performance**: Consider indexing cho frequently queried fields
5. **Security**: Sensitive data (passwords) được hash before storage
6. **Extensibility**: Schema design cho phép easy extension

---

*Tài liệu này được tạo cho Korea-DB Learning Management System - Cập nhật: July 2025*
