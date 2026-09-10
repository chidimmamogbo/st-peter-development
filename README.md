# St. Peter's Result Portal

A centralized, secure, role-governed academic results backend for **St. Peter's College**, built strictly against **The Hackathon Bar** with **FastAPI**, **SQLModel**, **SQLite**, and **Python 3.14**.

---

## 1. Why JWT Authentication Suits This Client (The Bar: Item 10)

> **Architectural Justification:**  
> St. Peter's College operates in a hybrid operating environment: teachers record scores directly from mobile devices while proctoring in exam halls and classrooms, while exams officers and administrators manage subjects, terms, and publications from desktop web browsers in the central office. JWT (token-based) authentication is ideally suited for this architecture because tokens are **stateless and platform-agnostic**. The single FastAPI backend can issue a standard signed JWT that mobile apps store in secure device storage and web browsers send in standard `Authorization: Bearer <token>` headers—without requiring shared server-side session stores, Redis instances, or browser-tied cookies that would fail on native mobile clients.

---

## 2. Getting Started for Teammates (Clone & Setup)

Follow these steps to clone and run the project locally on your machine.

### Step 1: Install `uv` (Fast Python Package & Environment Manager)
If you don't already have `uv` installed:
* **Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
* **macOS / Linux:**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

### Step 2: Clone the Repository
```bash
git clone <YOUR_TEAM_REPO_URL>
cd "St. Peter's Result Portal"
```

### Step 3: Install Python 3.14 & Sync Project Dependencies
`uv` automatically downloads Python 3.14 if needed, creates an isolated virtual environment (`.venv`), and installs all locked dependencies from `uv.lock`:
```bash
uv python install 3.14
uv sync
```

### Step 4: Seed the Database with Demo Accounts
Initialize the SQLite database and populate the pre-configured demo users, subjects, enrollments, and test scores:
```bash
uv run python -m st_peters_portal.seed
```

### Step 5: Start the FastAPI Development Server
```bash
uv run fastapi dev st_peters_portal/main.py
```
* The API will start running at: `http://127.0.0.1:8000`
* **Interactive Swagger UI (Runs the entire demo):** **`http://127.0.0.1:8000/docs`**

### Step 6: Verify with Automated Tests
Run the 14-test test suite covering all Hackathon Bar requirements:
```bash
uv run pytest tests/ -v
```

---

## 3. Seeded Demo Accounts (The Bar: Item 10)

All accounts are pre-seeded with the password: **`Secret123!`**

| Username | Role | Full Name / Description | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **`officer1`** | `exams_officer` | Rev. Fr. Benedict (Exams Officer) | Create subjects, assign teachers, view any student, publish terms, view failing reports (< 40) |
| **`teacher_math`** | `teacher` | Mr. Emeka Obi (Math & Physics) | Enrolls students, enters/corrects scores for `MTH101` & `PHY101`, views stats |
| **`teacher_eng`** | `teacher` | Mrs. Ngozi Eze (English) | Enrolls students, enters/corrects scores for `ENG101`, views stats |
| **`student_ada`** | `student` | Ada Okafor (`STP/2026/001`) | High achiever (A's across Math, English, Physics); sees own results |
| **`student_obi`** | `student` | Obi Daniel (`STP/2026/002`) | Carries English below 40 (`34`, Grade F); triggers failing report |
| **`student_chi`** | `student` | Chidinma Kalu (`STP/2026/003`) | Carries Physics below 40 (`38`, Grade F); triggers failing report |

---

## 4. The Bar Compliance Checklist

| Item | Requirement | Implementation in St. Peter's Result Portal | Status |
| :--- | :--- | :--- | :---: |
| **1. Structure** | Package with `APIRouter` in separate files; `main.py` only wires app | Modular package `st_peters_portal/` with dedicated router modules in `st_peters_portal/routers/` | Passed |
| **2. Database** | SQLModel + SQLite, $\ge 3$ tables, $\ge 1$ relationship, session via dependency | 6 SQLModel tables (`User`, `Student`, `Subject`, `SubjectEnrollment`, `Score`, `ResultPublication`, `NotificationLog`), session via `Depends(get_session)` | Passed |
| **3. Models** | Separate input & output models (Extra Models pattern); no passwords returned; explicit `status_code` & `response_model` | `UserCreate`/`UserRead`, `ScoreCreate`/`ScoreRead`, etc. Password hashes excluded from all outputs. Explicit status codes (`201` on create) | Passed |
| **4. Auth** | Client-specific auth (JWT), passwords hashed always, $\ge 2$ roles, role-protected routes (`401` vs `403`) | JWT via PyJWT, passwords hashed with `bcrypt`, 3 roles (`student`, `teacher`, `exams_officer`), strict 401 vs 403 handling | Passed |
| **5. Dependencies** | `get_current_user` and role-checking dependency; reused, not copied | `get_current_user` + reusable `require_role(*roles)` dependency factory | Passed |
| **6. Middleware** | Custom `X-Process-Time` header on every response; CORS enabled | Custom `ProcessTimeMiddleware` measuring request time, plus `CORSMiddleware` | Passed |
| **7. Background Task** | Notification / audit line written after response is sent | `notify_students_on_publication` asynchronously logs student notifications upon term publication | Passed |
| **8. Docs** | App metadata, tags, filled-in schema examples, runs entirely on `/docs` | Complete metadata, route tags, JSON schema examples on all input models | Passed |
| **9. Errors** | `HTTPException` everywhere (401, 403, 404, 409, 422); no customer crashes | Doorway validation (`422`), pre-checked duplicate prevention (`409`), 401/403/404 | Passed |
| **10. README** | Run guide, demo accounts, and auth rationale paragraph | Comprehensive README with full instructions and 10-minute demo walkthrough | Passed |

---

## 5. Live Demo Script (10-Minute Walkthrough on `/docs`)

Follow this exact sequence directly in **`http://127.0.0.1:8000/docs`**:

1. **Demonstrate Sign In & Token Generation:**
   * Click `POST /auth/token` $\rightarrow$ **Try it out**.
   * Login as `officer1` / `Secret123!`.
   * Click **Authorize** at the top of `/docs`, paste the token, and authenticate.

2. **Demonstrate 201 Creation & No Private Fields:**
   * Call `POST /subjects` with `{"name": "Biology", "code": "BIO101"}`.
   * Observe `201 Created` response. Confirm `hashed_password` or internal fields are never exposed.

3. **Demonstrate `X-Process-Time` Header:**
   * Look at the Response Headers in `/docs` for any request.
   * Point out the `x-process-time` header (e.g. `0.003412s`).

4. **Demonstrate Role Enforcement (403 Forbidden):**
   * Authorize as `student_ada` / `Secret123!`.
   * Attempt to call `POST /subjects` $\rightarrow$ Receive **`403 Forbidden`**.

5. **Demonstrate Deliberate 403 on ID Guessing (Client Brief Requirement):**
   * While authorized as `student_ada` (Student ID 1), call `GET /students/2/results?term=2026-Term1`.
   * Observe **`403 Forbidden`** (not 404), explaining: *“Students may never inspect another student's record, even by guessing the ID.”*

6. **Demonstrate Doorway Validation (422) & Duplicate Prevention (409):**
   * Authorize as `teacher_math` / `Secret123!`.
   * Call `POST /scores` with `score: 110` $\rightarrow$ Receive **`422 Unprocessable Entity`** (doorway validation).
   * Call `POST /scores` with score for Ada in Math $\rightarrow$ Receive **`409 Conflict`** (duplicate entry refused).

7. **Demonstrate Publication & Background Task:**
   * Authorize as `officer1` / `Secret123!`.
   * Call `POST /results/publish/2026-Term1` $\rightarrow$ Receives immediate **`200 OK`**.
   * Call `GET /results/notifications?term=2026-Term1` $\rightarrow$ Show notification lines generated asynchronously for every student in that term!
   * Call `GET /results/below?term=2026-Term1&threshold=40` $\rightarrow$ Instantly lists Obi Daniel (English: 34) and Chidinma Kalu (Physics: 38).
