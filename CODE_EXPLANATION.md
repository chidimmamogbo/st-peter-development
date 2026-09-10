# St. Peter's Result Portal — Simple Code & Syntax Guide
## *Explained in Plain English for Anyone (Even a 12-Year-Old!)*

Welcome! If you have never programmed before, or if Python terms sound like alien language, this guide is for you. 

When your team stands in front of the judges, anyone on the team might be asked: **"What does this line do?"** or **"Why did you write it this way?"** 

After reading this guide, you will be able to answer with 100% confidence.

---

# Table of Contents
1. [The Big Picture: The School Building Analogy](#the-big-picture-the-school-building-analogy)
2. [5 Key Terms You Must Know](#5-key-terms-you-must-know)
3. [File 1: database.py (The Filing Cabinet & The Keys)](#file-1-databasepy)
4. [File 2: models.py (The Blank Forms in the Cabinet)](#file-2-modelspy)
5. [File 3: schemas.py (The Envelopes: What Goes In vs What Comes Out)](#file-3-schemaspy)
6. [File 4: security.py (The Locksmith & The Wristband Maker)](#file-4-securitypy)
7. [File 5: dependencies.py (The Security Guards at the Hallways)](#file-5-dependenciespy)
8. [File 6: background.py (The Student Mail Delivery Boy)](#file-6-backgroundpy)
9. [File 7: main.py (The Front Gate & Reception Desk)](#file-7-mainpy)
10. [File 8: routers/auth.py (The Sign-In & Registration Window)](#file-8-routersauthpy)
11. [File 9: routers/students.py (The Student Results Desk)](#file-9-routersstudentspy)
12. [File 10: routers/subjects.py (The Classroom Assignment Office)](#file-10-routerssubjectspy)
13. [File 11: routers/scores.py (The Teacher's Grading Room)](#file-11-routersscorespy)
14. [File 12: routers/results.py (The Exams Officer's Master Control)](#file-12-routersresultspy)
15. [File 13: seed.py (The Starter Pack: Sample Teachers & Students)](#file-13-seedpy)
16. [Cheat Sheet: How to Answer Any Judge Question](#cheat-sheet-how-to-answer-any-judge-question)

---

# The Big Picture: The School Building Analogy

Imagine **St. Peter's Result Portal** is a brand new, high-tech school building:

1. **The Building Entrance (`main.py`)**: Has a stopwatch at the door (`ProcessTimeMiddleware`) measuring how fast people enter and leave.
2. **The Front Desk (`routers/auth.py`)**: Where you show your username and password to get a digital VIP wristband (**JWT Token**).
3. **The Security Guards (`dependencies.py`)**: Stand in front of every hallway. If you don't have a wristband, they shout: *"401 Unauthorized!"* If a student tries to sneak into the Teacher's grading lounge, they say: *"403 Forbidden!"*
4. **The Locksmith (`security.py`)**: Never saves your real password on paper. He runs it through a shredder-blender (**bcrypt hashing**) so nobody can steal it.
5. **The Filing Cabinet (`database.py` & `models.py`)**: A neat drawer where folders for Users, Students, Subjects, and Scores live safely.
6. **The Privacy Envelopes (`schemas.py`)**: When handing out results, the school puts them in an envelope that never reveals secret stuff like passwords.
7. **The Postman (`background.py`)**: When the Exams Officer presses "Publish All Results", he doesn't wait around for 1,200 letters to be stamped. He hands them to the postman, goes on with his day, and the postman delivers them in the background.

---

# 5 Key Terms You Must Know

### 1. What is an API?
**API** stands for *Application Programming Interface*. Think of it like a waiter at a restaurant. You (the client/browser) look at the menu, tell the waiter what you want, the waiter goes to the kitchen (our Python backend), gets the food (data), and brings it back to your table.

### 2. What is a Database?
It is a structured digital spreadsheet on disk where information stays saved even when you turn off the computer. We use **SQLite** (a single file called `st_peters.db`) and **SQLModel** (which lets us talk to the database using clean Python code instead of raw SQL commands).

### 3. What is a JWT Token?
**JWT** stands for *JSON Web Token*. Think of it as a waterproof, stamped wristband at an amusement park. Once the ticket booth checks your identity, they give you this stamped wristband. Every ride attendant just glances at your wristband to know who you are and what rides you are allowed to enter—without calling the ticket booth every single time!

### 4. What is Hashing (bcrypt)?
Turning a word into scrambled gibberish that can **never** be unscrambled.
* Plain password: `Secret123!`
* Bcrypt Hash: `$2b$12$e8x...random982347982347`
* Why? If a thief steals the database, they cannot read anyone's real password!

### 5. What are the HTTP Status Codes?
These are standard numbers the server shouts back to the client:
* **200 OK**: "Here you go, everything worked perfectly!"
* **201 Created**: "Awesome! A new subject, score, or user was successfully created!"
* **401 Unauthorized**: "Who are you? You have no wristband (token) or it is invalid!"
* **403 Forbidden**: "I know who you are, but you are NOT allowed in this room! (e.g. A student trying to enter grades)."
* **404 Not Found**: "We looked everywhere, but that student or subject ID doesn't exist."
* **409 Conflict**: "Stop! You already entered this exact score or this username already exists!"
* **422 Unprocessable Entity**: "Your data is shaped wrong! (e.g. You gave a score of 150, but scores must be 0 to 100)."

---

# File 1: `database.py`

**The Job of this file:** Sets up the SQLite database file and hands out the "keys" (called sessions) whenever a route needs to look inside.

### Code breakdown line by line:

```python
from sqlmodel import Session, SQLModel, create_engine
```
* `from sqlmodel import Session, SQLModel, create_engine`: 
  * `create_engine`: The tool that opens the file connection to SQLite.
  * `Session`: Think of a session like a single shopping cart. You put items into the cart (new scores or users), and then you "commit" (check out at the cash register) to save them into the database.
  * `SQLModel`: The mother class that knows how to create database tables.

```python
DATABASE_URL = "sqlite:///./st_peters.db"
```
* Tells the program where our database lives. `sqlite:///./st_peters.db` means: *"Create a file called `st_peters.db` right here in our project folder."*

```python
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)
```
* `create_engine(...)`: Starts the database engine.
* `echo=False`: Keeps our terminal clean (doesn't print every tiny SQL command to the screen).
* `connect_args={"check_same_thread": False}`: **(Judges love this question!)** SQLite by default is shy—it only wants one worker thread talking to it. But FastAPI has many workers handling requests at the exact same time. This setting tells SQLite: *"It is safe, allow multiple requests to talk to you."*

```python
def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
```
* When the app wakes up, this function checks: *"Do the tables exist yet? If not, build them now!"*

```python
def get_session():
    with Session(engine) as session:
        yield session
```
* **The Bar Item 2 requirement:** *"The session must come from a dependency, never a global."*
* Every time someone calls an endpoint, FastAPI opens a fresh shopping cart (`with Session(engine)`), hands it to the route (`yield session`), waits for the route to finish, and then **automatically closes the cart** so the database never gets clogged or corrupted.

---

# File 2: `models.py`

**The Job of this file:** Defines the exact layout of the 6 tables in our database. Think of each class as a blank paper form with specific boxes you must fill in.

### Code breakdown line by line:

```python
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel
```
* `datetime, timezone`: For recording the exact time (hour, minute, second in UTC) when an action occurred.
* `Enum`: A dropdown menu of choices.
* `UniqueConstraint`: A strict rule saying *"No duplicates allowed for this combination!"*
* `Field, Relationship`: Tools from SQLModel to configure columns (like primary keys, limits, and links between tables).

```python
class Role(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    EXAMS_OFFICER = "exams_officer"
```
* Defines the only 3 legal roles in our school. Nobody can be `"superman"` or `"hacker"`. You must be one of these three.

```python
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    role: Role = Field(default=Role.STUDENT)
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```
* `table=True`: Tells SQLModel: *"Make this an actual table in the SQLite database!"*
* `id`: The unique badge number for the user. `primary_key=True` means every single user gets their own distinct number (1, 2, 3...).
* `username`: Must be unique (`unique=True`). Two people cannot have the same username.
* `hashed_password`: Notice it is called **hashed** password, never plaintext password!
* `created_at`: Automatically stamps the exact time the account was created.

```python
class Student(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(unique=True, foreign_key="user.id")
    admission_no: str = Field(unique=True, index=True)
    class_level: str
```
* Links to the User table via `foreign_key="user.id"`. This means each student profile is permanently attached to exactly one user login.
* `admission_no`: The official student registration number (e.g., `STP/2026/001`).

```python
class Subject(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: str = Field(unique=True, index=True)
    teacher_id: Optional[int] = Field(default=None, foreign_key="user.id")
```
* Represents a school course (like Mathematics, `MTH101`).
* `teacher_id`: Stores the ID of the teacher assigned to teach this subject.

```python
class SubjectEnrollment(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("subject_id", "student_id", name="uq_subject_student"),)
    id: Optional[int] = Field(default=None, primary_key=True)
    subject_id: int = Field(foreign_key="subject.id")
    student_id: int = Field(foreign_key="student.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```
* The bridge that connects a Student to a Subject.
* The `UniqueConstraint("subject_id", "student_id")` ensures a student cannot be enrolled in Mathematics twice!

```python
class Score(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("student_id", "subject_id", "term", name="uq_student_subject_term"),)
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id")
    subject_id: int = Field(foreign_key="subject.id")
    term: str = Field(index=True)
    score: int = Field(ge=0, le=100)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```
* Stores the actual mark a student earned in a subject during a term (like `2026-Term1`).
* `score: int = Field(ge=0, le=100)`: `ge=0` means *greater than or equal to 0*. `le=100` means *less than or equal to 100*. Scores cannot be -5 or 120!
* The `UniqueConstraint("student_id", "subject_id", "term")` guarantees that entering a score twice for the same student in the same subject and term is strictly forbidden.

```python
class ResultPublication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    term: str = Field(unique=True, index=True)
    published_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_by: Optional[int] = Field(default=None, foreign_key="user.id")
```
* Tracks if a term has been officially approved and published by an Exams Officer. Students cannot peek at their results until this row has a date!

```python
class NotificationLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    term: str = Field(index=True)
    student_id: int = Field(foreign_key="student.id")
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```
* The digital record book where our background task writes down each notification sent to a student.

---

# File 3: `schemas.py`

**The Job of this file:** Implements the **Extra Models Pattern** (The Bar Item 3). It defines what information people are allowed to send into the API (**Input Models**), and what the API shows back to them (**Output Models**).

### The Secret Password Rule:
When someone creates an account, they send their password (`UserCreate`). But when the API returns the user information (`UserRead`), **the password field does not even exist in the schema**. It is physically impossible for the API to leak passwords!

### Code breakdown line by line:

```python
def compute_grade(score: int) -> str:
    if score >= 70:
        return "A"
    if score >= 60:
        return "B"
    if score >= 50:
        return "C"
    if score >= 40:
        return "D"
    return "F"
```
* Simple, clean grading rule:
  * 70 to 100 = **A** (Excellent)
  * 60 to 69 = **B** (Very Good)
  * 50 to 59 = **C** (Good)
  * 40 to 49 = **D** (Pass)
  * Below 40 = **F** (Fail)
* Grades are computed dynamically when viewing scores. We don't store redundant letters in the database; the numeric score is the single source of truth.

```python
class UserCreate(BaseModel):
    username: str = Field(..., examples=["mr_okafor"])
    password: str = Field(..., min_length=6, examples=["TeacherPass123!"])
    role: Role = Field(default=Role.STUDENT, examples=["teacher"])
    full_name: str = Field(..., examples=["Mr. Chidi Okafor"])
```
* Used when creating a user. Notice `password` is required here.
* `examples=[...]`: Pre-fills the Swagger `/docs` testing page with realistic examples so you can test endpoints with one click.

```python
class UserRead(BaseModel):
    id: int
    username: str
    role: Role
    full_name: str
    created_at: datetime
```
* What gets sent back to the user. Notice **there is NO password or hashed_password here!** Total security.

```python
class ScoreCreate(BaseModel):
    student_id: int = Field(..., examples=[1])
    subject_id: int = Field(..., examples=[1])
    term: str = Field(..., examples=["2026-Term1"])
    score: int = Field(..., ge=0, le=100, examples=[85])
```
* When a teacher submits a score, `ge=0, le=100` acts as a bouncer at the doorway. If the score is 105, FastAPI stops the request immediately with an HTTP `422 Unprocessable Entity` before it ever touches our database!

---

# File 4: `security.py`

**The Job of this file:** The cryptographic powerhouse. Handles password scrambling (hashing) and digital wristbands (JWT tokens).

### Code breakdown line by line:

```python
import bcrypt
import jwt
from fastapi.security import OAuth2PasswordBearer
```
* `bcrypt`: The industry gold standard for password hashing.
* `jwt`: PyJWT library that packages user info into signed tokens.
* `OAuth2PasswordBearer`: Tells FastAPI that users must present a Bearer token in the `Authorization` header. This automatically activates the **Authorize** lock button in `/docs`!

```python
SECRET_KEY = "st-peters-college-secret-key-for-hackathon-demo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 180
```
* `SECRET_KEY`: A private stamp only our server knows. If an attacker tries to make a fake token, the signature won't match our secret key.
* `ALGORITHM = "HS256"`: The cryptographic math formula used to sign the token.
* `ACCESS_TOKEN_EXPIRE_MINUTES = 180`: The wristband expires after 3 hours.

```python
def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")
```
* `password.encode("utf-8")`: Converts text characters to raw bytes of computer memory.
* `bcrypt.gensalt()`: Generates random salt (extra random characters) so that even if two users have the same password, their hashes look totally different!
* `bcrypt.hashpw(...)`: Blends the password and salt together into a scrambled hash string.

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )
```
* Checks if the password typed at login matches the scrambled hash in the database. Returns `True` or `False`.

```python
def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```
* Takes the user's ID, username, and role, stamps an expiration date on it, signs it with our `SECRET_KEY`, and turns it into a compact JWT token string.

---

# File 5: `dependencies.py`

**The Job of this file:** The security guards of our application. Verifies tokens and checks user roles before letting anyone visit a route.

### Code breakdown line by line:

```python
def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> User:
```
* This function runs before any protected route.
* It grabs the token from the user's request.
* If the token is missing, expired, or forged, it immediately raises:
  ```python
  raise HTTPException(status_code=401, detail="Could not validate credentials...")
  ```
* If valid, it finds the matching `User` in the database and hands it over to the route!

```python
def require_role(*allowed_roles: Role):
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker
```
* **(Crucial Presentation Point!)** This is a **Dependency Factory** (a function that builds another function).
* It takes a list of allowed roles (e.g. `Role.EXAMS_OFFICER`).
* It checks the user's role. If a student tries to visit an exams officer endpoint, it raises **`403 Forbidden`**!
* Because we built this once, we reuse it everywhere: `Depends(require_role(Role.TEACHER))` without copy-pasting code!

---

# File 6: `background.py`

**The Job of this file:** Does heavy work in the background so the user's screen doesn't freeze.

### Code breakdown line by line:

```python
def notify_students_on_publication(term: str) -> None:
    with Session(db.engine) as session:
        student_ids = session.exec(
            select(Score.student_id).where(Score.term == term).distinct()
        ).all()
```
* When an Exams Officer clicks "Publish", this function runs **after** the response is already sent back to the officer.
* It looks up all unique students who received scores this term.

```python
        for student_id in student_ids:
            msg = f"Results for term '{term}' have been officially published..."
            notif = NotificationLog(term=term, student_id=student_id, message=msg)
            notifications.append(notif)
            log_lines.append(f"[{timestamp}] NOTIFY student ...\n")
```
* For each student, it prepares a notification message.
* Saves them into the `NotificationLog` table in the database and appends to `notifications.log` on disk.
* **Why this matters to the judges:** The exams officer receives an immediate `200 OK` in less than 5 milliseconds! They never sit staring at a spinning browser wheel while 1,200 notifications are processed.

---

# File 7: `main.py`

**The Job of this file:** The front door of the entire system. It builds the FastAPI app, adds timing and security middleware, and plugs in all the room routers.

### Code breakdown line by line:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
```
* Modern FastAPI **lifespan context manager** (replaces old, deprecated startup events).
* The second the app turns on, it runs `create_db_and_tables()` to make sure the database is ready.

```python
class ProcessTimeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.6f}s"
        return response
```
* **The Bar Item 6 Requirement:**
* Every single request passes through this stopwatch.
* `time.perf_counter()` records the exact start time.
* `call_next(request)` lets the route do its work.
* It calculates the difference and adds the header: `X-Process-Time: 0.003412s`. You can see this header on every response in `/docs`!

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
* **CORS** stands for *Cross-Origin Resource Sharing*. It tells web browsers: *"Allow mobile apps and frontend websites from other domains to connect to this API."*

```python
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(subjects.router)
app.include_router(scores.router)
app.include_router(results.router)
```
* Plugs in our separate router files. `main.py` stays tiny and clean—it never contains messy route logic!

---

# File 8: `routers/auth.py`

**The Job of this file:** Handles account registration and user login.

* `POST /auth/register`:
  * Creates a user account.
  * Checks if the username is already taken $\rightarrow$ if so, returns **`409 Conflict`**.
  * Encrypts the password with `hash_password()` before saving to SQLite.
  * Only exams officers can create accounts (except for the very first account, which allows initial bootstrapping).
* `POST /auth/token`:
  * The login endpoint.
  * Takes `username` and `password`.
  * Verifies the password using `verify_password()`.
  * If wrong $\rightarrow$ returns **`401 Unauthorized`**.
  * If correct $\rightarrow$ returns the signed JWT access token!

---

# File 9: `routers/students.py`

**The Job of this file:** Lets exams officers manage student profiles, and lets students check their academic report cards.

### The Deliberate 403 Security Check:
Look at this code in `GET /students/{student_id}/results`:

```python
if current_user.role == Role.STUDENT:
    own_student = session.exec(select(Student).where(Student.user_id == current_user.id)).first()
    if not own_student or own_student.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you are not authorized to view results for another student.",
        )
```
* **Client Brief Requirement:** *"Attempting another student's results is a 403, not a 404 — be deliberate about which and say why in the demo."*
* **Why 403 and NOT 404?** If we returned 404 ("Not Found"), a student could guess numbers (1, 2, 3...) to discover which student IDs actually exist in the school! Returning **403 Forbidden** firmly states: *"The server knows who you are, and you are strictly forbidden from peeking at another student's private records."*

---

# File 10: `routers/subjects.py`

**The Job of this file:** Curriculum management and classroom enrollment.

* `POST /subjects`: Exams officer creates new subjects (e.g. `Mathematics`, code `MTH101`). Returns `201 Created`.
* `PATCH /subjects/{id}/teacher`: Exams officer assigns an instructor to teach the subject.
* `POST /subjects/{id}/students/{student_id}`: **(Fulfills the brief: "Teacher: Register students into their subject")**. Only the assigned teacher of that subject (or an exams officer) can enroll students. If another teacher tries, it returns **`403 Forbidden`**!

---

# File 11: `routers/scores.py`

**The Job of this file:** The grading engine where teachers enter and correct marks.

### 1. The Teacher Subject Check:
```python
if subject.teacher_id != current_user.id:
    raise HTTPException(status_code=403, detail="Access forbidden: you can only enter scores for subjects assigned to you.")
```
* A Math teacher cannot enter scores for English!

### 2. The Duplicate Prevention (409 Conflict):
```python
existing = session.exec(select(Score).where(...)).first()
if existing:
    raise HTTPException(status_code=409, detail="Score already recorded for student...")
```
* If a teacher accidentally enters Ada's Math score twice, the system refuses with **`409 Conflict`** instead of corrupting the database or crashing.

### 3. Class Statistics (`GET /scores/subject/{id}/stats`):
* Calculates:
  * `highest`: The best score in class (e.g. 92)
  * `lowest`: The lowest score in class (e.g. 34)
  * `average`: The class average (e.g. 68.5)

---

# File 12: `routers/results.py`

**The Job of this file:** The Exams Officer's master control room.

* `POST /results/publish/{term}`:
  * Publishes results for a whole term (e.g. `2026-Term1`).
  * If already published $\rightarrow$ returns **`409 Conflict`**.
  * Queues the background task `notify_students_on_publication` to alert all students.
* `GET /results/below?term=...&threshold=40`:
  * Generates the failing students report. Instantly lists any student with a score below 40 (Grade F), such as Obi Daniel (English: 34) and Chidinma Kalu (Physics: 38).
* `GET /results/notifications?term=...`:
  * Lets judges inspect the background notifications right on `/docs`!

---

# File 13: `seed.py`

**The Job of this file:** Pre-populates the database so you don't have to manually type data during your 10-minute demo.

### Seeded Demo Accounts (Password: `Secret123!`):
1. **`officer1`** (Exams Officer): The administrator.
2. **`teacher_math`** (Teacher): Teaches Math (`MTH101`) and Physics (`PHY101`).
3. **`teacher_eng`** (Teacher): Teaches English (`ENG101`).
4. **`student_ada`** (Student): All A's!
5. **`student_obi`** (Student): Scored 34 in English (triggers failing report!).
6. **`student_chi`** (Student): Scored 38 in Physics (triggers failing report!).

---

# Cheat Sheet: How to Answer Any Judge Question

| If the Judge asks you... | You look them in the eye and say: |
| :--- | :--- |
| **"Why did you choose JWT tokens over cookies or sessions?"** | *"Our teachers use mobile phones in classrooms while officers use web portals in the office. JWT tokens are completely stateless and platform-agnostic. They work identically on iOS, Android, and Web browsers without needing shared Redis servers or browser-tied session cookies."* |
| **"Why does attempting another student's results return 403 instead of 404?"** | *"Returning 404 would leak information about whether a target student ID exists or not through ID guessing. Returning a deliberate 403 clearly reinforces our security boundary: the caller is recognized, but strictly forbidden from accessing someone else's grades."* |
| **"How do you prevent crashes when entering duplicate scores?"** | *"Instead of letting SQLite crash with an unhandled 500 error, our score route explicitly pre-checks the student, subject, and term composite key and returns a clean HTTP 409 Conflict, fulfilling Bar Item 9."* |
| **"How is score doorway validation enforced?"** | *"At the doorway using Pydantic's `Field(ge=0, le=100)` on our input schema. Any score outside 0–100 is rejected immediately with an HTTP 422 Unprocessable Entity before touching our business logic or database."* |
| **"Where does the database session come from?"** | *"It is injected via FastAPI's dependency system using `Depends(get_session)`. It uses a generator with a `yield` inside a context manager, ensuring every request gets its own isolated session that is automatically closed after the response."* |
| **"How does the background task protect user experience?"** | *"Publishing 1,200 student results requires creating 1,200 notifications. Doing that synchronously would cause the officer's browser to spin and timeout. We return an immediate 200 OK, and dispatch `notify_students_on_publication` in the background."* |
