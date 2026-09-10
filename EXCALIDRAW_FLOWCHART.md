# Excalidraw Flowchart TD Code

Copy the code block below and paste it directly into [excalidraw.com](https://excalidraw.com).

### How to use in Excalidraw:
1. Open [excalidraw.com](https://excalidraw.com) in your browser.
2. In the top toolbar, click the **Three dots / More tools icon (`...`)** (or the `+` icon).
3. Select **Mermaid to Excalidraw**.
4. Paste the code below and click **Insert**.

```mermaid
flowchart TD
    Start(["1. Client Request (Mobile / Web / /docs)"])
    
    subgraph MiddlewareLayer ["Layer 1: Global Middleware"]
        MW1["ProcessTimeMiddleware (Records duration -> Injects X-Process-Time)"]
        MW2["CORSMiddleware (Verifies browser origins & headers)"]
    end

    subgraph AuthLayer ["Layer 2: Auth & Role Gateway"]
        RouteCheck{"Target Route Type"}
        AuthEndpoint["/auth/token or /auth/register (bcrypt verify -> Issues signed JWT)"]
        DepCheck["Dependencies Layer (get_current_user extracts & verifies JWT)"]
        
        Err401["HTTP 401 Unauthorized (Missing, expired, or invalid token)"]
        RoleVerify{"require_role() Check"}
        Err403["HTTP 403 Forbidden (Caller lacks required role)"]
    end

    subgraph DomainLayer ["Layer 3: Role-Based Business Logic"]
        StudentRoute["Student Domain: GET /students/{id}/results"]
        Student403["HTTP 403 Forbidden (Deliberate Refusal on ID Guessing)"]
        StudentSuccess["Calculate Grade Letters (A-F) & Overall Term Average"]
        
        TeacherRoute["Teacher Domain: POST /scores & /stats"]
        Score422["HTTP 422 Unprocessable (Doorway check: score outside 0-100)"]
        Score409["HTTP 409 Conflict (Duplicate score for term)"]
        ScoreSuccess["Save Score (201 Created) & Calculate Subject Statistics"]

        OfficerRoute["Exams Officer Domain: POST /results/publish/{term} & GET /results/below"]
        Below40Report["Filter Scores < 40 (List failing students)"]
        PublishSuccess["Set term published_at in DB (Returns Immediate 200 OK)"]
    end

    subgraph StorageAndAsync ["Layer 4: Storage & Background Worker"]
        DB[("SQLite Database (st_peters.db)")]
        AsyncTrigger["FastAPI BackgroundTasks Queue"]
        Worker["notify_students_on_publication(term)"]
        AuditFile["notifications.log & NotificationLog Table (Audit trail without blocking UI)"]
    end

    Start --> MW1
    MW1 --> MW2
    MW2 --> RouteCheck

    RouteCheck -->|"Public Auth Routes"| AuthEndpoint
    RouteCheck -->|"Protected Routes"| DepCheck

    DepCheck -->|"Token Invalid"| Err401
    DepCheck -->|"Token Valid"| RoleVerify

    RoleVerify -->|"Unauthorized Role"| Err403
    RoleVerify -->|"Role: student"| StudentRoute
    RoleVerify -->|"Role: teacher"| TeacherRoute
    RoleVerify -->|"Role: exams_officer"| OfficerRoute

    StudentRoute -->|"Requests Other Student ID"| Student403
    StudentRoute -->|"Requests Own ID"| StudentSuccess
    StudentSuccess --> DB

    TeacherRoute -->|"Score < 0 or > 100"| Score422
    TeacherRoute -->|"Score Already Exists"| Score409
    TeacherRoute -->|"Valid Score (0-100)"| ScoreSuccess
    ScoreSuccess --> DB

    OfficerRoute -->|"Audit Failing"| Below40Report
    OfficerRoute -->|"Publish Action"| PublishSuccess
    PublishSuccess --> DB
    PublishSuccess --> AsyncTrigger

    AsyncTrigger --> Worker
    Worker --> DB
    Worker --> AuditFile
```
