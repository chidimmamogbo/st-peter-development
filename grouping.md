# St. Peter's Result Portal — Presenter Grouping & Codebase Ownership Guide (`grouping.md`)

> **Team Presentation Division**: 4 Presenters  
> **Group Members**: Amara, Ifeanyi, Chidimma, Nnamdi  
> **Goal**: Each presenter owns a specific domain of the codebase, understands its architectural decisions, and can defend it confidently during the presentation and Q&A.

---

## Quick Reference Summary Table

| Presenter | Domain Area | Assigned Files | Core Focus |
| :--- | :--- | :--- | :--- |
| **Amara** | **System Architecture, Database & Security Foundation** | • `st_peters_portal/main.py`<br>• `st_peters_portal/database.py`<br>• `st_peters_portal/security.py`<br>• `st_peters_portal/dependencies.py` | Server entrypoint, Lifespan, custom Timing Middleware, SQLite connection, JWT tokens, and RBAC gatekeeper dependencies. |
| **Ifeanyi** | **Data Modeling, Schemas & Authentication API** | • `st_peters_portal/models.py`<br>• `st_peters_portal/schemas.py`<br>• `st_peters_portal/routers/auth.py`<br>• `st_peters_portal/seed.py` | Relational tables, Pydantic doorway validators, score bounds (0-100), term lowercase normalizer, login/register endpoints, and demo data seed. |
| **Chidinma** | **Curriculum Management, Student Profiles & Result Privacy** | • `st_peters_portal/routers/subjects.py`<br>• `st_peters_portal/routers/students.py` | Subject offerings, teacher assignment, student enrollment, student profile creation, anti-ID guessing protection, and pre-publication result freeze. |
| **Nnamdi** | **Grading Engine, Asynchronous Publishing & Academic Audits** | • `st_peters_portal/routers/scores.py`<br>• `st_peters_portal/routers/results.py`<br>• `st_peters_portal/background.py` | Score entry with auto-grading (A-F), teacher departmental checks, subject stats, async result publication, background notification worker, and failure audits. |

---

## Detailed Presenter Breakdown & Study Guide

---

### 1. Amara — System Architecture, Infrastructure & Security Foundation

> **Your Presentation Role**: You introduce how the backend application is structured, how it boots up, how it manages database sessions per request, and how it verifies caller authenticity.

#### Assigned Files:
1. `st_peters_portal/main.py`
   - **What it does**: The FastAPI application entrypoint.
   - **Key Code Sections**:
     - `@asynccontextmanager lifespan(app)`: Initializes database tables automatically on server startup.
     - `ProcessTimeMiddleware`: Custom middleware that measures exact execution time with `time.perf_counter()` and adds the `X-Process-Time` header to every HTTP response.
     - `app.add_middleware(CORSMiddleware)`: Configures Cross-Origin Resource Sharing for frontend compatibility.
     - `app.include_router(...)`: Mounts the 5 feature routers (`auth`, `students`, `subjects`, `scores`, `results`).
     - `GET /`: Lightweight health check probe returning service status.

2. `st_peters_portal/database.py`
   - **What it does**: Manages SQLite engine and database sessions.
   - **Key Code Sections**:
     - `create_engine(DATABASE_URL)`: Configures SQLite connection with `check_same_thread=False`.
     - `create_db_and_tables()`: Calls `SQLModel.metadata.create_all(engine)`.
     - `get_session()`: Generator dependency providing a database `Session` to endpoint handlers, closing cleanly when the request finishes.

3. `st_peters_portal/security.py`
   - **What it does**: Cryptographic hashing and token management.
   - **Key Code Sections**:
     - `CryptContext(schemes=["argon2", "bcrypt"])`: Secure password hashing engine.
     - `hash_password(password)`: Hashes plaintext passwords before storing in database.
     - `verify_password(plain, hashed)`: Compares raw login password against stored hash.
     - `create_access_token(data, expires_delta)`: Creates signed HMAC-SHA256 JWT tokens containing `sub` (username), `user_id`, and `role`.
     - `decode_access_token(token)`: Validates JWT signature and expiry.
     - `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")`: Tells Swagger UI where to request tokens.

4. `st_peters_portal/dependencies.py`
   - **What it does**: FastAPI dependency functions that protect routes.
   - **Key Code Sections**:
     - `get_current_user`: Injects the Bearer token, decodes the username, fetches the `User` from the database, or raises `401 Unauthorized`.
     - `require_role(*allowed_roles)`: Dependency factory for Role-Based Access Control. If a teacher or student attempts an exams-officer endpoint, it raises `403 Forbidden`.
     - `get_current_student`: Helper dependency to fetch the academic `Student` profile of a logged-in student user.

#### Questions Amara Should Be Ready To Answer:
* **"How does the timing middleware work?"**
  * *Answer*: *"It wraps every HTTP request in our `ProcessTimeMiddleware`. It records `start_time = time.perf_counter()`, awaits the route execution, computes the elapsed duration, and sets `response.headers['X-Process-Time']`."*
* **"What happens if someone sends a fake or expired JWT token?"**
  * *Answer*: *"In `dependencies.py`, `decode_access_token` catches `InvalidTokenError` and immediately raises an `HTTP 401 Unauthorized` with a `WWW-Authenticate: Bearer` header."*

---

### 2. Ifeanyi — Data Modeling, Schemas & Identity Management

> **Your Presentation Role**: You explain how data is structured in our database, how Pydantic protects the application from invalid input at the doorway, how users log in, and how initial demo data is seeded.

#### Assigned Files:
1. `st_peters_portal/models.py`
   - **What it does**: SQLModel database tables and relations.
   - **Key Code Sections**:
     - `Role(str, Enum)`: Enums for `EXAMS_OFFICER`, `TEACHER`, `STUDENT`.
     - `User`: Primary identity table (`username`, `hashed_password`, `role`, `full_name`).
     - `Student`: Academic profile table with foreign key `user_id`, unique `admission_no`, and `class_level`.
     - `Subject`: Curriculum entity with unique `code` and foreign key `teacher_id`.
     - `SubjectEnrollment`: Association table linking `subject_id` and `student_id`.
     - `Score`: Academic marks with foreign keys to student and subject, `term`, and `score` (0–100).
     - `ResultPublication`: Records when an exams officer officially ratifies and publishes a term.
     - `NotificationLog`: Audit records created by the background notification worker.

2. `st_peters_portal/schemas.py`
   - **What it does**: Pydantic validation schemas and data-transfer objects (DTOs).
   - **Key Code Sections**:
     - `compute_grade(score)`: Helper determining letter grade: $\ge 70 \rightarrow \text{A}$, $\ge 60 \rightarrow \text{B}$, $\ge 50 \rightarrow \text{C}$, $\ge 40 \rightarrow \text{D}$, $< 40 \rightarrow \text{F}$.
     - `ScoreCreate`: Enforces doorway validation `score: int = Field(..., ge=0, le=100)`. Invalid scores (e.g., 150 or -10) trigger `422 Unprocessable Entity`.
     - `@field_validator("term")`: Automatically applies `.strip().lower()` to incoming terms so `2026-Term1` is normalized to `2026-term1`.
     - `UserRead`, `StudentRead`, `ScoreRead`: Response schemas with `model_config = ConfigDict(from_attributes=True)` ensuring sensitive columns like `hashed_password` never leave the server.

3. `st_peters_portal/routers/auth.py`
   - **What it does**: User authentication and account creation endpoints.
   - **Key Code Sections**:
     - `POST /auth/register`: Creates new users with hashed passwords. Only exams officers can register accounts (with bootstrap allowance if the database is brand new). Duplicate usernames return `409 Conflict`.
     - `POST /auth/token`: OAuth2 password flow. Validates credentials and returns signed JWT access token.
     - `GET /auth/me`: Allows any authenticated caller to inspect their own profile without leaking passwords.

4. `st_peters_portal/seed.py`
   - **What it does**: Demo database seeder script.
   - **Key Code Sections**:
     - Seeds standard demo users with default password `Secret123!`:
       - Exams Officer: `officer1`
       - Teachers: `teacher_math` (Math & Physics), `teacher_eng` (English)
       - Students: `student_ada` (ID: 1), `student_obi` (ID: 2), `student_chi` (ID: 3)
     - Seeds subjects, enrollments, and initial term scores for `2026-term1`.

#### Questions Ifeanyi Should Be Ready To Answer:
* **"Why did you separate `User` from `Student` into two tables?"**
  * *Answer*: *"Separation of Concerns. The `User` table handles authentication, login credentials, and global system roles. The `Student` table handles academic profiles like admission numbers. If the school introduces a Parent portal in the future, parents can be Users linked to Students without re-architecting authentication."*
* **"How do you ensure passwords are never leaked in responses?"**
  * *Answer*: *"We implement the Extra Models pattern. Our route handlers return Pydantic `UserRead` models which explicitly omit `hashed_password`. FastAPI serializes only the fields defined in `UserRead`."*

---

### 3. Chidinma — Curriculum Management, Student Profiles & Result Privacy

> **Your Presentation Role**: You present curriculum management, teacher-to-subject assignments, student course enrollments, and how the system rigorously enforces privacy against student ID guessing attacks.

#### Assigned Files:
1. `st_peters_portal/routers/subjects.py`
   - **What it does**: Handles curriculum subjects, teacher assignments, and student enrollments.
   - **Key Code Sections**:
     - `POST /subjects`: Creates a new subject (e.g., Chemistry `CHM101`). Restricted to Exams Officer (`201 Created`). Duplicate subject codes return `409 Conflict`.
     - `GET /subjects`: Lists all subjects. If a teacher supplies `?mine=true`, the query filters `where(Subject.teacher_id == current_user.id)` to return only their assigned classes.
     - `PATCH /subjects/{subject_id}/teacher`: Exams Officer assigns an instructor to a subject offering.
     - `POST /subjects/{subject_id}/students/{student_id}`: Enrolls a student into a subject. Enforces that only the assigned teacher or exams officer can enroll students (`403 Forbidden` if another teacher tries). Duplicate enrollments return `409 Conflict`.
     - `GET /subjects/{subject_id}/students`: Lists all students enrolled in a particular subject.

2. `st_peters_portal/routers/students.py`
   - **What it does**: Student academic records and report cards.
   - **Key Code Sections**:
     - `POST /students`: Creates an academic profile linking a student user to an admission number and class level. Exams Officer only.
     - `GET /students`: Lists all registered students across the institution. Exams Officer only.
     - `GET /students/{student_id}`: Retrieves profile details of a specific student.
     - `GET /students/{student_id}/results`: **The Flagship Student Endpoint**.
       - **Anti-ID Guessing Enforcement**: If a student requests a `student_id` that is not their own, the system raises `403 Forbidden` (*"Access forbidden: you are not authorized to view results for another student"*). It intentionally returns `403` instead of `404` to prevent user enumeration attacks.
       - **Pre-Publication Freeze**: If caller is a student and the term has not yet been published by the Exams Officer, it raises `403 Forbidden` (*"Results have not been officially published yet"*).
       - **Teacher Block**: Teachers trying to view whole-student multi-subject report cards receive `403 Forbidden` (Principle of Least Privilege).
       - **GPA Calculation**: Dynamically derives letter grades and computes overall average score (`round(total / count, 2)`).

#### Questions Chidinma Should Be Ready To Answer:
* **"Why return 403 instead of 404 when a student guesses another student's ID?"**
  * *Answer*: *"If we returned 404 for non-existent IDs and 200/403 for existing IDs, an attacker could enumerate which student IDs exist. Returning 403 Forbidden unconditionally whenever a student tries to access an ID they don't own closes the enumeration vector."*
* **"Can a teacher view a student's full report card?"**
  * *Answer*: *"No. In `students.py`, line 185 blocks teachers with a 403 Forbidden. Teachers only have permission to view performance statistics for the subjects they personally teach."*

---

### 4. Nnamdi — Grading Engine, Asynchronous Publishing & Academic Audits

> **Your Presentation Role**: You explain how teachers enter and correct marks, how the Exams Officer publishes terms asynchronously using background workers, and how diagnostic academic failure reports are generated.

#### Assigned Files:
1. `st_peters_portal/routers/scores.py`
   - **What it does**: Score entry, score corrections, and class statistics.
   - **Key Code Sections**:
     - `POST /scores`: Assigned teachers record a student's score in a subject for a term.
       - **Departmental Isolation**: Checks `if subject.teacher_id != current_user.id` and raises `403 Forbidden` if a Math teacher tries to grade English.
       - **Duplicate Prevention**: Queries `(student_id, subject_id, term)` and raises `409 Conflict` if a score already exists.
       - **Auto-Grading**: Computes grade letter automatically (`ScoreRead.grade = compute_grade(score)`).
     - `GET /scores` **[BONUS FEATURE 1]**: Lists and filters scores with `?term=`, `?subject_id=`, and `?student_id=`, enforcing teacher subject isolation.
     - `PATCH /scores/{score_id}`: Allows the assigned teacher to correct an existing mark (`200 OK`).
     - `GET /scores/subject/{subject_id}/stats`: Calculates highest mark, lowest mark, average score, and total student count for a subject in a term. Accessible only to the assigned teacher or exams officer.

2. `st_peters_portal/routers/results.py`
   - **What it does**: Official term publication, class rankings, and institutional failure diagnostics.
   - **Key Code Sections**:
     - `POST /results/publish/{term}`: **Official Publication Endpoint**.
       - Checks if term is already published; if yes, raises `409 Conflict`.
       - Sets `published_at` timestamp and records `published_by = current_user.id`.
       - Dispatches background job via `background_tasks.add_task(notify_students_on_publication, term)`.
       - Returns `200 OK` immediately in under 10 milliseconds.
     - `GET /results/rankings` **[BONUS FEATURE 2]**: **Class Ranking Endpoint**.
       - Computes average and total scores across all subjects taken by each student in the term.
       - Sorts descending by average score (breaking ties with total score).
       - Assigns official class ranks (1st, 2nd, 3rd...).
       - Enforces pre-publication freeze for students (`403 Forbidden` if unpublished).
     - `GET /results/below`: Diagnostic report for Exams Officer. Identifies all students scoring below a threshold (default 40, letter grade `F`), with optional `subject_id` filter.
     - `GET /results/notifications`: Allows the Exams Officer to inspect the notification logs generated by the background task.

3. `st_peters_portal/background.py`
   - **What it does**: Non-blocking background worker implementation.
   - **Key Code Sections**:
     - `notify_students_on_publication(term)`:
       - Runs asynchronously in a background thread without blocking the HTTP response.
       - Opens a database session using `Session(db.engine)`.
       - Queries all distinct students who have scores for that term.
       - Inserts notification records into `NotificationLog` table.
       - Appends audit entries to the filesystem log `notifications.log` with UTC timestamps.

#### Questions Nnamdi Should Be Ready To Answer:
* **"Why use `BackgroundTasks` instead of running notification logic inside the endpoint?"**
  * *Answer*: *"In a school with hundreds of students, writing notifications and disk logs synchronously would cause the Exams Officer's HTTP request to hang or time out. `BackgroundTasks` returns HTTP 200 immediately, letting the server handle notification generation in the background."*
* **"How does the class ranking endpoint calculate positions?"**
  * *Answer*: *"In `results.py`, `get_class_rankings` aggregates all scores for the specified term, computes each student's average and cumulative total marks, sorts descending by average score, and assigns ranks (1st, 2nd, 3rd), respecting pre-publication privacy for students."*
* **"How does the system ensure term queries are case-insensitive?"**
  * *Answer*: *"In all our query filters in `scores.py`, `results.py`, and `background.py`, we execute `func.lower(Column.term) == term.strip().lower()`. This ensures `2026-Term1` and `2026-term1` seamlessly match the exact same database records."*

---

## Group Presentation Running Order & Transition Script

To sound like a unified, professional engineering team during your oral defense, use these smooth transitions:

```text
[Amara starts the presentation]
"Good day. I will begin by introducing the architectural foundation of St. Peter's Result Portal,
how our FastAPI application initializes, our database connection pooling, our custom timing
middleware, and our cryptographic JWT authentication dependencies...
...Now I will hand over to Ifeanyi, who will walk you through our domain models, schema validations,
and identity provisioning."

[Ifeanyi speaks]
"Thank you Amara. I will now explain our SQLModel database design, why we decoupled Users from
Students, how our Pydantic schemas enforce doorway validation to reject out-of-range marks,
and how authentication endpoints and seed data work...
...Now I will hand over to Chidinma, who will explain curriculum management, student profiles,
and our anti-tampering privacy controls."

[Chidinma speaks]
"Thank you Ifeanyi. I will now walk through how subjects are created and assigned to teachers,
how student enrollments are managed, and how our student results router enforces an institutional
pre-publication freeze while actively blocking student ID-guessing attacks...
...Now I will hand over to Nnamdi, who will present our scoring engine, class statistics,
asynchronous publication background workers, and failure audit reports."

[Nnamdi speaks]
"Thank you Chidinma. I will demonstrate how teachers record and correct scores with departmental
isolation, how the Exams Officer ratifies and publishes terms using asynchronous background workers,
and how our system generates institutional audit reports for students scoring below the passing threshold.
Finally, we will demonstrate our live test suite in Swagger UI."
```
