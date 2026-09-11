# St. Peter's Result Portal — Complete Presentation Demo & Testing Guide (`Test.md`)

> **Comprehensive Phase-by-Phase & Step-by-Step Test Scenarios for All Roles**  
> Designed for Live Presentation Demonstrations and Defense in Swagger UI (`/docs`).

---

## Table of Contents
1. [Demo Preparation & Credentials Cheat Sheet](#1-demo-preparation--credentials-cheat-sheet)
2. [How Authentication & Swagger UI Work](#2-how-authentication--swagger-ui-work)
3. [Term Case-Insensitivity Feature Explained](#3-term-case-insensitivity-feature-explained)
4. [Phase 1: Public & Unauthenticated Access (Security Perimeter)](#phase-1-public--unauthenticated-access-security-perimeter)
5. [Phase 2: Administrative Governance (Exams Officer)](#phase-2-administrative-governance-exams-officer)
6. [Phase 3: Academic Workflow & Strict Validation (Teacher Roles)](#phase-3-academic-workflow--strict-validation-teacher-roles)
7. [Phase 4: Student Privacy & Anti-Tampering (Pre-Publication Checks)](#phase-4-student-privacy--anti-tampering-pre-publication-checks)
8. [Phase 5: Official Term Publication & Asynchronous Processing](#phase-5-official-term-publication--asynchronous-processing)
9. [Phase 6: Post-Publication Student Portal & Term Flexibility](#phase-6-post-publication-student-portal--term-flexibility)
10. [Phase 7: Institutional Academic Audits & Failure Reports](#phase-7-institutional-academic-audits--failure-reports)
11. [Summary Matrix of All Test Scenarios & Status Codes](#11-summary-matrix-of-all-test-scenarios--status-codes)

---

## 1. Demo Preparation & Credentials Cheat Sheet

### Running the Server
In your terminal, navigate to the project directory and start the server:
```powershell
uv run uvicorn st_peters_portal.main:app --reload --port 8000
```
Open your browser and navigate to: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

### Resetting to a Clean Demo Database (Optional)
If you wish to reset demo data before your presentation:
```powershell
# Stop server (Ctrl + C), then in PowerShell:
Remove-Item st_peters.db -ErrorAction SilentlyContinue
Remove-Item notifications.log -ErrorAction SilentlyContinue
uv run python -m st_peters_portal.seed
uv run uvicorn st_peters_portal.main:app --reload --port 8000
```

### Pre-Seeded Demo Accounts
Every seeded account shares the standard password: `Secret123!`

| Role | Username | Password | Full Name / Description | Assigned ID & Access |
| :--- | :--- | :--- | :--- | :--- |
| **Exams Officer** | `officer1` | `Secret123!` | Rev. Fr. Benedict | Super-user / School Exam Officer (ID: 1) |
| **Teacher (Math)** | `teacher_math` | `Secret123!` | Mr. Emeka Obi | User ID: 2. Assigned: Mathematics (ID: 1), Physics (ID: 3) |
| **Teacher (English)** | `teacher_eng` | `Secret123!` | Mrs. Ngozi Eze | User ID: 3. Assigned: English Language (ID: 2) |
| **Student (Ada)** | `student_ada` | `Secret123!` | Ada Daniel | User ID: 4, Student ID: 1 (Adm: `STP/2026/001`) |
| **Student (Obi)** | `student_obi` | `Secret123!` | Obi Daniel | User ID: 5, Student ID: 2 (Adm: `STP/2026/002`) |
| **Student (Chidinma)** | `student_chi` | `Secret123!` | Chidinma Kalu | User ID: 6, Student ID: 3 (Adm: `STP/2026/003`) |

---

## 2. How Authentication & Swagger UI Work

FastAPI's interactive documentation (`/docs`) handles security tokens using the green **Authorize** button at the top right of the page:

1. Click the green **Authorize** 🔓 button.
2. In the modal:
   - **`username`**: Enter username (e.g., `officer1`)
   - **`password`**: Enter password (`Secret123!`)
   - Leave `client_id`, `client_secret`, and `scopes` completely **blank** (these are optional OAuth2 fields not needed for password-grant authentication).
3. Click **Authorize**, then click **Close**. The padlock turns locked 🔒.
4. All subsequent requests in Swagger UI automatically attach the HTTP header:
   `Authorization: Bearer <your_jwt_token>`
5. **Switching Roles during the Demo**:
   - Click the green **Authorize** button again.
   - Click **Logout**.
   - Type in the credentials for the new role.
   - Click **Authorize** -> **Close**.

---

## 3. Term Case-Insensitivity Feature Explained

In academic administration, users often type terms in various casings:
- `2026-Term1` (Capitalized)
- `2026-term1` (Lowercase)
- `2026-TERM1` (Uppercase)
- `  2026-term1  ` (Accidental spaces)

**How St. Peter's Result Portal handles this:**
1. **At the Doorway (Pydantic Validator)**: Any incoming term string is automatically trimmed and converted via `.strip().lower()` before reaching database logic.
2. **In the Database Queries**: All SQL queries compare against `func.lower(Column) == term.strip().lower()`.
3. **Demo Benefit**: You can demonstrate to examiners that whether a student or teacher inputs `2026-Term1`, `2026-term1`, or `2026-TERM1`, the system seamlessly locates the same records without duplication or `404 Not Found` errors.

---

## Phase 1: Public & Unauthenticated Access (Security Perimeter)

> **Objective**: Prove that unauthenticated requests cannot leak data or manipulate records, and that health probes operate without credentials.

### Step 1.1: Health Check (Public Root)
* **Endpoint**: `GET /`
* **Auth**: None (Logout if currently authorized)
* **Action**:
  1. Expand `GET /` (under Health tag).
  2. Click **Try it out** -> **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "status": "healthy",
    "service": "St. Peter's Result Portal",
    "documentation": "/docs"
  }
  ```
* **Header Verification**: Notice the custom response header `x-process-time: 0.00xxxxs` (Custom Timing Middleware).
* **Talking Point**: *"Our API includes lightweight timing middleware that audits processing latency for every single request, meeting institutional performance benchmarks."*

### Step 1.2: Protected Route Rejection Without Token
* **Endpoint**: `GET /students`
* **Auth**: None (Locked out)
* **Action**:
  1. Expand `GET /students`.
  2. Click **Try it out** -> **Execute**.
* **Expected Status**: `401 Unauthorized`
* **Response Body**:
  ```json
  {
    "detail": "Not authenticated"
  }
  ```
* **Talking Point**: *"Zero-trust architecture: without a cryptographically signed JWT token, protected institutional data is entirely inaccessible."*

### Step 1.3: Invalid Credentials Rejection
* **Endpoint**: `POST /auth/token`
* **Action**:
  1. Expand `POST /auth/token`.
  2. Click **Try it out**.
  3. Enter `username`: `officer1` and `password`: `WrongPassword999`.
  4. Click **Execute**.
* **Expected Status**: `401 Unauthorized`
* **Response Body**:
  ```json
  {
    "detail": "Incorrect username or password"
  }
  ```
* **Talking Point**: *"Password hashes are verified using Argon2/Bcrypt industry-standard algorithms. Brute force or guessed passwords are immediately rejected."*

---

## Phase 2: Administrative Governance (Exams Officer)

> **Objective**: Show how the Exams Officer (`officer1`) holds administrative authority to manage users, student profiles, subjects, and enrollments.

### Step 2.1: Login as Exams Officer
1. Click **Authorize** 🔓 at the top of Swagger UI.
2. Fill:
   - `username`: `officer1`
   - `password`: `Secret123!`
3. Click **Authorize** -> **Close**.

### Step 2.2: Verify Officer Identity
* **Endpoint**: `GET /auth/me`
* **Action**: Click **Try it out** -> **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "id": 1,
    "username": "officer1",
    "role": "exams_officer",
    "full_name": "Rev. Fr. Benedict (Exams Officer)",
    "created_at": "..."
  }
  ```
* **Talking Point**: *"Notice the response model strictly strips the `hashed_password` field. Credentials never leak through the wire."*

### Step 2.3: Register a New User Account
* **Endpoint**: `POST /auth/register`
* **Action**:
  1. Expand `POST /auth/register`.
  2. Click **Try it out**.
  3. Request Body:
     ```json
     {
       "username": "teacher_chem",
       "password": "Secret123!",
       "role": "teacher",
       "full_name": "Dr. Anthony Mbata (Chemistry)"
     }
     ```
  4. Click **Execute**.
* **Expected Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "id": 7,
    "username": "teacher_chem",
    "role": "teacher",
    "full_name": "Dr. Anthony Mbata (Chemistry)",
    "created_at": "..."
  }
  ```
* **Demonstrate 409 Duplicate Prevention**: Click **Execute** a second time without changing anything.
  - **Status**: `409 Conflict`
  - **Detail**: `"Username 'teacher_chem' is already registered."`

### Step 2.4: Create a New Subject
* **Endpoint**: `POST /subjects`
* **Action**:
  1. Expand `POST /subjects`.
  2. Click **Try it out**.
  3. Request Body:
     ```json
     {
       "name": "Chemistry",
       "code": "CHM101"
     }
     ```
  4. Click **Execute**.
* **Expected Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "id": 4,
    "name": "Chemistry",
    "code": "CHM101",
    "teacher_id": null,
    "teacher_name": null
  }
  ```

### Step 2.5: Assign Teacher to the Subject
* **Endpoint**: `PATCH /subjects/{subject_id}/teacher`
* **Action**:
  1. Expand `PATCH /subjects/{subject_id}/teacher`.
  2. Click **Try it out**.
  3. `subject_id`: `4` (the Chemistry subject we just created).
  4. Request Body:
     ```json
     {
       "teacher_id": 7
     }
     ```
  5. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "id": 4,
    "name": "Chemistry",
    "code": "CHM101",
    "teacher_id": 7,
    "teacher_name": "Dr. Anthony Mbata (Chemistry)"
  }
  ```

### Step 2.6: Enrolling a Student into the Subject
* **Endpoint**: `POST /subjects/{subject_id}/students/{student_id}`
* **Action**:
  1. `subject_id`: `4`
  2. `student_id`: `1` (Ada Daniel)
  3. Click **Execute**.
* **Expected Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "id": 8,
    "subject_id": 4,
    "student_id": 1,
    "student_name": "Ada Daniel",
    "admission_no": "STP/2026/001",
    "created_at": "..."
  }
  ```
* **Duplicate Protection Demo**: Click **Execute** again.
  - **Status**: `409 Conflict`
  - **Detail**: `"Student ID 1 is already enrolled in subject 'Chemistry'."`

---

## Phase 3: Academic Workflow & Strict Validation (Teacher Roles)

> **Objective**: Switch to Teacher persona (`teacher_math` and `teacher_eng`) to demonstrate subject-level RBAC, doorway validation, score updates, and statistics.

### Step 3.1: Switch Login to Math Teacher
1. Click **Authorize** -> **Logout**.
2. Enter:
   - `username`: `teacher_math`
   - `password`: `Secret123!`
3. Click **Authorize** -> **Close**.

### Step 3.2: Teacher Checks Assigned Subjects
* **Endpoint**: `GET /subjects`
* **Action**:
  1. Expand `GET /subjects`.
  2. Set query parameter `mine`: `true`.
  3. Click **Execute**.
* **Expected Status**: `200 OK`
* **Result**: Returns only **Mathematics** (ID: 1) and **Physics** (ID: 3). English is excluded.

### Step 3.3: Attempting Unassigned Subject Score Entry (Negative Test — 403)
* **Endpoint**: `POST /scores`
* **Action**:
  1. Expand `POST /scores`.
  2. Click **Try it out**.
  3. Math teacher attempts to submit score for **English** (`subject_id`: 2):
     ```json
     {
       "student_id": 1,
       "subject_id": 2,
       "term": "2026-Term1",
       "score": 85
     }
     ```
  4. Click **Execute**.
* **Expected Status**: `403 Forbidden`
* **Response Body**:
  ```json
  {
    "detail": "Access forbidden: you can only enter scores for subjects assigned to you."
  }
  ```
* **Talking Point**: *"Teachers are strictly walled within their curriculum department. A Math teacher cannot tamper with English scores."*

### Step 3.4: Doorway Validation Rejecting Out-of-Range Scores (Negative Test — 422)
* **Endpoint**: `POST /scores`
* **Action**:
  1. Set `subject_id`: `1` (Mathematics - authorized)
  2. Set `score`: `150` (or `-10`)
     ```json
     {
       "student_id": 1,
       "subject_id": 1,
       "term": "2026-Term1",
       "score": 150
     }
     ```
  3. Click **Execute**.
* **Expected Status**: `422 Unprocessable Entity`
* **Response Body**:
  ```json
  {
    "detail": [
      {
        "type": "less_than_equal",
        "loc": ["body", "score"],
        "msg": "Input should be less than or equal to 100"
      }
    ]
  }
  ```
* **Talking Point**: *"Validation happens right at the doorway via Pydantic schemas. Corrupt or out-of-range marks (e.g. 150 or negative scores) never touch our database."*

### Step 3.5: Successful Score Entry with Auto-Grading (Positive Test — 201)
* **Scenario**: Let's record a Mathematics score for a new term, e.g. `2026-term2`.
* **Endpoint**: `POST /scores`
* **Action**:
  1. Math teacher records score for Student 1 in Term 2 with mixed casing:
     ```json
     {
       "student_id": 1,
       "subject_id": 1,
       "term": "2026-Term2",
       "score": 95
     }
     ```
  2. Click **Execute**.
* **Expected Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "id": 8,
    "student_id": 1,
    "subject_id": 1,
    "subject_name": "Mathematics",
    "term": "2026-term2",
    "score": 95,
    "grade": "A",
    "created_at": "..."
  }
  ```
* **Observe**:
  - `term` is automatically normalized to `"2026-term2"`!
  - `grade` is automatically computed as `"A"`!

### Step 3.6: Duplicate Score Prevention (Negative Test — 409)
* **Action**: Click **Execute** again with the exact same payload.
* **Expected Status**: `409 Conflict`
* **Response Body**:
  ```json
  {
    "detail": "Score already recorded for student STP/2026/001 in subject 'Mathematics' for term '2026-Term2'."
  }
  ```
* **Talking Point**: *"Academic records are protected against accidental double entries."*

### Step 3.7: Correcting an Existing Score
* **Endpoint**: `PATCH /scores/{score_id}`
* **Action**:
  1. `score_id`: `8` (the score just entered)
  2. Request Body:
     ```json
     {
       "score": 98
     }
     ```
  3. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "id": 8,
    "student_id": 1,
    "subject_id": 1,
    "subject_name": "Mathematics",
    "term": "2026-term2",
    "score": 98,
    "grade": "A",
    "created_at": "..."
  }
  ```

### Step 3.8: Subject Statistics with Case-Insensitive Term Query
* **Endpoint**: `GET /scores/subject/{subject_id}/stats`
* **Action**:
  1. Expand `GET /scores/subject/{subject_id}/stats`.
  2. `subject_id`: `1` (Mathematics)
  3. `term`: `2026-Term1` (Notice uppercase 'T')
  4. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "subject_id": 1,
    "subject_name": "Mathematics",
    "term": "2026-term1",
    "highest": 88,
    "lowest": 54,
    "average": 68.0,
    "total_students": 3
  }
  ```
* **Talking Point**: *"The teacher inputted `2026-Term1` and the system accurately calculated highest (88), lowest (54), and average (68.0) across all enrolled students."*

### Step 3.9: Teacher Attempting to View Full Student Report Card (Negative Test — 403)
* **Endpoint**: `GET /students/{student_id}/results`
* **Action**:
  1. `student_id`: `1`
  2. `term`: `2026-term1`
  3. Click **Execute**.
* **Expected Status**: `403 Forbidden`
* **Response Body**:
  ```json
  {
    "detail": "Teachers cannot view complete student result summaries across all subjects. Check your subject stats instead."
  }
  ```
* **Talking Point**: *"Principle of Least Privilege: Teachers only inspect statistics of their own subjects. They cannot inspect a student's holistic performance across other teachers' subjects."*

---

## Phase 4: Student Privacy & Anti-Tampering (Pre-Publication Checks)

> **Objective**: Switch to Student persona (`student_ada`) and prove that results cannot be viewed before official publication, and students cannot guess other students' IDs.

### Step 4.1: Switch Login to Student (Ada)
1. Click **Authorize** -> **Logout**.
2. Enter:
   - `username`: `student_ada`
   - `password`: `Secret123!`
3. Click **Authorize** -> **Close**.

### Step 4.2: Student Attempts to View Unpublished Term Results (Negative Test — 403)
* **Note**: In our initial seed data, `2026-term1` has NOT been officially published yet.
* **Endpoint**: `GET /students/{student_id}/results`
* **Action**:
  1. Expand `GET /students/{student_id}/results`.
  2. `student_id`: `1` (Ada's own student ID)
  3. `term`: `2026-Term1`
  4. Click **Execute**.
* **Expected Status**: `403 Forbidden`
* **Response Body**:
  ```json
  {
    "detail": "Results for term '2026-term1' have not been officially published yet."
  }
  ```
* **Talking Point**: *"Even though scores are entered by teachers in the database, the portal enforces an institutional freeze until the Exams Officer officially validates and publishes them."*

### Step 4.3: Student ID Guessing Attack (Negative Test — 403)
* **Scenario**: Student Ada (`student_id`: 1) maliciously changes the URL parameter to `2` to spy on classmate Obi Daniel.
* **Endpoint**: `GET /students/{student_id}/results`
* **Action**:
  1. `student_id`: `2` (Belongs to Obi Daniel)
  2. `term`: `2026-Term1`
  3. Click **Execute**.
* **Expected Status**: `403 Forbidden` (NOT 404!)
* **Response Body**:
  ```json
  {
    "detail": "Access forbidden: you are not authorized to view results for another student."
  }
  ```
* **Talking Point**: *"ID-guessing vulnerability prevented! Even if an attacker increments the numeric ID in the URL, the system cross-references the JWT token with the ownership record and immediately blocks the attempt with a 403 Forbidden."*

### Step 4.4: Student Probing Unauthorized Administrative Endpoints (Negative Test — 403)
* **Endpoint**: `POST /subjects` or `POST /auth/register`
* **Action**: Try to create a subject as a student.
* **Expected Status**: `403 Forbidden`
* **Response Body**:
  ```json
  {
    "detail": "Action requires 'exams_officer' role"
  }
  ```

---

## Phase 5: Official Term Publication & Asynchronous Processing

> **Objective**: The Exams Officer publishes results for `2026-Term1`. The response returns immediately (`200 OK`) while a background worker notifies all students asynchronously.

### Step 5.1: Switch Login to Exams Officer
1. Click **Authorize** -> **Logout**.
2. Enter:
   - `username`: `officer1`
   - `password`: `Secret123!`
3. Click **Authorize** -> **Close**.

### Step 5.2: Publish the Term Results
* **Endpoint**: `POST /results/publish/{term}`
* **Action**:
  1. Expand `POST /results/publish/{term}`.
  2. Click **Try it out**.
  3. Type in path parameter `term`: `2026-Term1` (Mixed case).
  4. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "id": 1,
    "term": "2026-term1",
    "published_at": "2026-09-11T...",
    "published_by": 1
  }
  ```
* **Talking Point**: *"The Exams Officer receives an instant HTTP 200 response. Behind the scenes, FastAPI's `BackgroundTasks` executes asynchronously to generate notification entries for all affected students without causing HTTP lag."*

### Step 5.3: Duplicate Publication Prevention (Negative Test — 409)
* **Action**: Click **Execute** again with `2026-Term1` (or `2026-term1`).
* **Expected Status**: `409 Conflict`
* **Response Body**:
  ```json
  {
    "detail": "Results for term '2026-term1' have already been published."
  }
  ```
* **Talking Point**: *"Once published, a term is permanently locked against duplicate publishing operations."*

### Step 5.4: Inspect Live Background Task Output
* **Endpoint**: `GET /results/notifications`
* **Action**:
  1. Expand `GET /results/notifications`.
  2. Click **Try it out**.
  3. `term`: `2026-term1`
  4. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "id": 1,
      "term": "2026-term1",
      "student_id": 1,
      "message": "Results for term '2026-term1' have been officially published. Your grades are now ready for viewing.",
      "created_at": "..."
    },
    {
      "id": 2,
      "term": "2026-term1",
      "student_id": 2,
      "message": "Results for term '2026-term1' have been officially published. Your grades are now ready for viewing.",
      "created_at": "..."
    },
    {
      "id": 3,
      "term": "2026-term1",
      "student_id": 3,
      "message": "Results for term '2026-term1' have been officially published. Your grades are now ready for viewing.",
      "created_at": "..."
    }
  ]
  ```
* **Audit File Verification**: Point out that `notifications.log` on the server filesystem received timestamped audit records matching these notifications!

---

## Phase 6: Post-Publication Student Portal & Term Flexibility

> **Objective**: Log back in as Student Ada and demonstrate successful result retrieval, automatic grade generation, average calculation, and case-insensitivity.

### Step 6.1: Switch Login to Student Ada
1. Click **Authorize** -> **Logout**.
2. Enter:
   - `username`: `student_ada`
   - `password`: `Secret123!`
3. Click **Authorize** -> **Close**.

### Step 6.2: View Report Card with Mixed-Case Term Query (`2026-Term1`)
* **Endpoint**: `GET /students/{student_id}/results`
* **Action**:
  1. Expand `GET /students/{student_id}/results`.
  2. Click **Try it out**.
  3. `student_id`: `1`
  4. `term`: `2026-Term1`
  5. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "student_id": 1,
    "admission_no": "STP/2026/001",
    "class_level": "SS2",
    "full_name": "Ada Daniel",
    "term": "2026-term1",
    "results": [
      {
        "subject_id": 1,
        "subject_name": "Mathematics",
        "subject_code": "MTH101",
        "score": 88,
        "grade": "A"
      },
      {
        "subject_id": 2,
        "subject_name": "English Language",
        "subject_code": "ENG101",
        "score": 79,
        "grade": "B"
      },
      {
        "subject_id": 3,
        "subject_name": "Physics",
        "subject_code": "PHY101",
        "score": 92,
        "grade": "A"
      }
    ],
    "average_score": 86.33
  }
  ```

### Step 6.3: View Report Card with Lowercase Term Query (`2026-term1`)
* **Action**: Change `term` to `2026-term1` and click **Execute**.
* **Expected Status**: `200 OK` (Exact same report card returned).
* **Talking Point**: *"Demonstrate the case-insensitivity requested by our requirements: whether typed `2026-Term1` or `2026-term1`, students effortlessly access their grades."*

---

## Phase 7: Institutional Academic Audits & Failure Reports

> **Objective**: Demonstrate the Exams Officer's institutional oversight features, identifying at-risk students carrying scores below the pass threshold.

### Step 7.1: Switch Login to Exams Officer
1. Click **Authorize** -> **Logout**.
2. Enter:
   - `username`: `officer1`
   - `password`: `Secret123!`
3. Click **Authorize** -> **Close**.

### Step 7.2: Generate Failing Students Report (Score Below 40)
* **Endpoint**: `GET /results/below`
* **Action**:
  1. Expand `GET /results/below`.
  2. Click **Try it out**.
  3. `term`: `2026-Term1`
  4. `threshold`: `40` (Default)
  5. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "student_id": 2,
      "student_name": "Obi Daniel",
      "admission_no": "STP/2026/002",
      "subject_id": 2,
      "subject_name": "English Language",
      "term": "2026-term1",
      "score": 34,
      "grade": "F"
    },
    {
      "student_id": 3,
      "student_name": "Chidinma Kalu",
      "admission_no": "STP/2026/003",
      "subject_id": 3,
      "subject_name": "Physics",
      "term": "2026-term1",
      "score": 38,
      "grade": "F"
    }
  ]
  ```
* **Talking Point**: *"Immediate academic audit: The Exams Officer instantly identifies students scoring below 40 (Obi Daniel with 34 in English, Chidinma Kalu with 38 in Physics) for targeted remedial counseling."*

### Step 7.3: Subject-Specific Threshold Filter
* **Action**:
  1. Set `subject_id`: `2` (English Language only)
  2. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "student_id": 2,
      "student_name": "Obi Daniel",
      "admission_no": "STP/2026/002",
      "subject_id": 2,
      "subject_name": "English Language",
      "term": "2026-term1",
      "score": 34,
      "grade": "F"
    }
  ]
  ```

### Step 7.4 [BONUS FEATURE]: Filter Scores by Term Query (`?term=`)
* **Endpoint**: `GET /scores`
* **Action**:
  1. Expand `GET /scores`.
  2. Click **Try it out**.
  3. `term`: `2026-Term1`
  4. Click **Execute**.
* **Expected Status**: `200 OK`
* **Talking Point**: *"Bonus Feature 1: The `?term=` filter allows administrators and teachers to quickly query all recorded scores for a specific academic session, respecting departmental boundaries."*

### Step 7.5 [BONUS FEATURE]: Class Ranking Endpoint
* **Endpoint**: `GET /results/rankings`
* **Action**:
  1. Expand `GET /results/rankings`.
  2. Click **Try it out**.
  3. `term`: `2026-Term1`
  4. Optional: set `class_level`: `SS2`
  5. Click **Execute**.
* **Expected Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "term": "2026-term1",
    "class_level": "SS2",
    "total_students": 3,
    "rankings": [
      {
        "rank": 1,
        "student_id": 1,
        "student_name": "Ada Daniel",
        "admission_no": "STP/2026/001",
        "class_level": "SS2",
        "total_score": 259,
        "subjects_count": 3,
        "average_score": 86.33,
        "grade": "A"
      },
      {
        "rank": 2,
        "student_id": 3,
        "student_name": "Chidinma Kalu",
        "admission_no": "STP/2026/003",
        "class_level": "SS2",
        "total_score": 100,
        "subjects_count": 2,
        "average_score": 50.0,
        "grade": "C"
      },
      {
        "rank": 3,
        "student_id": 2,
        "student_name": "Obi Daniel",
        "admission_no": "STP/2026/002",
        "class_level": "SS2",
        "total_score": 88,
        "subjects_count": 2,
        "average_score": 44.0,
        "grade": "D"
      }
    ]
  }
  ```
* **Talking Point**: *"Bonus Feature 2: Automated class ranking! The system computes overall GPA averages for every student in the term, breaks ties using cumulative total score, and outputs official 1st, 2nd, and 3rd positions."*

---

## 11. Summary Matrix of All Test Scenarios & Status Codes

| # | Endpoint & Method | Role Under Test | Scenario / Input | Expected Status | Key Security & Business Rule |
| :-: | :--- | :--- | :--- | :-: | :--- |
| **1** | `GET /` | Unauthenticated | Service Health Check | **`200 OK`** | Audits response latency via `X-Process-Time` |
| **2** | `GET /students` | Unauthenticated | Access without Bearer token | **`401 Unauthorized`** | Zero-trust authentication perimeter |
| **3** | `POST /auth/token` | Unauthenticated | Incorrect password | **`401 Unauthorized`** | Argon2/Bcrypt hash verification |
| **4** | `POST /auth/token` | All Roles | Correct credentials | **`200 OK`** | Issues signed JWT token |
| **5** | `GET /auth/me` | Logged in User | Fetch profile | **`200 OK`** | Strips `hashed_password` completely |
| **6** | `POST /auth/register` | Exams Officer | Register new teacher/student | **`201 Created`** | Only `exams_officer` can create users |
| **7** | `POST /auth/register` | Exams Officer | Duplicate username | **`409 Conflict`** | Unique username enforcement |
| **8** | `POST /auth/register` | Student / Teacher | Non-officer registration | **`403 Forbidden`** | Role-Based Access Control |
| **9** | `POST /subjects` | Exams Officer | Create new curriculum subject | **`201 Created`** | Administrative curriculum management |
| **10** | `PATCH /subjects/{id}/teacher` | Exams Officer | Assign teacher to subject | **`200 OK`** | Enforces teacher assignment link |
| **11** | `POST /subjects/{id}/students/{id}` | Assigned Teacher / Officer | Enroll student in subject | **`201 Created`** | Enforces subject enrollment link |
| **12** | `POST /subjects/{id}/students/{id}` | Unassigned Teacher | Attempting enrollment in another subject | **`403 Forbidden`** | Departmental isolation |
| **13** | `POST /scores` | Assigned Teacher | Valid score (0–100) | **`201 Created`** | Computes grade (A-F), normalizes term |
| **14** | `POST /scores` | Assigned Teacher | Invalid score (> 100 or < 0) | **`422 Unprocessable`** | Pydantic doorway boundary validation |
| **15** | `POST /scores` | Assigned Teacher | Duplicate score entry | **`409 Conflict`** | Unique `(student, subject, term)` record |
| **16** | `POST /scores` | Unassigned Teacher | Enter score for another subject | **`403 Forbidden`** | Subject ownership check |
| **17** | `PATCH /scores/{id}` | Assigned Teacher | Correct existing score mark | **`200 OK`** | Re-computes letter grade |
| **18** | `GET /scores/subject/{id}/stats` | Assigned Teacher / Officer | Query subject statistics | **`200 OK`** | Calculates highest, lowest, average |
| **19** | `GET /students/{id}/results` | Student | View before official publication | **`403 Forbidden`** | Academic result freeze enforcement |
| **20** | `GET /students/{id}/results` | Student | Guessing another student's ID | **`403 Forbidden`** | Anti-ID guessing security check |
| **21** | `POST /results/publish/{term}` | Exams Officer | Publish term results | **`200 OK`** | Triggers asynchronous background task |
| **22** | `POST /results/publish/{term}` | Exams Officer | Re-publishing same term | **`409 Conflict`** | Publication immutability |
| **23** | `GET /results/notifications` | Exams Officer | Inspect notification logs | **`200 OK`** | Verifies async background worker |
| **24** | `GET /students/{id}/results` | Student | View published own results | **`200 OK`** | Displays subjects, grades & GPA average |
| **25** | `GET /students/{id}/results` | Student | Query with `2026-Term1` vs `2026-term1` | **`200 OK`** | Case-insensitive term resolution |
| **26** | `GET /results/below` | Exams Officer | Students below threshold (< 40) | **`200 OK`** | Institutional academic diagnostic report |
| **27** | `GET /scores` | Teachers / Officer | Filter scores by `?term=` [BONUS] | **`200 OK`** | Bonus term query filter with teacher isolation |
| **28** | `GET /results/rankings` | Officer / Teachers / Students | Class ranking by term [BONUS] | **`200 OK`** | Bonus class ranking with GPA and tie-breaking |

---

### Presentation Tips for Success
1. **Keep Swagger UI open** in a clean browser window with all tags initially collapsed.
2. **Follow the phases sequentially**: Start from unauthenticated rejection (Phase 1), progress through administrative setup (Phase 2), score entry & validation (Phase 3), security attacks (Phase 4), background publishing (Phase 5), student access (Phase 6), and finish with executive auditing (Phase 7).
3. **Point out the HTTP Status Codes**: Point to the status code bubble (`200`, `201`, `401`, `403`, `409`, `422`) after every step to show the examiners that every possible edge case has been thoughtfully handled.
4. **Highlight the absence of password leakage**: Show that whenever user or score models return data, sensitive attributes like `hashed_password` are never exposed.
