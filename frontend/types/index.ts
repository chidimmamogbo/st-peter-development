export type Role = "student" | "teacher" | "exams_officer";

export interface User {
  id: number;
  username: string;
  role: Role;
  full_name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  username: string;
  admission_no: string;
  class_level: string;
  full_name: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  teacher_id: number | null;
  teacher_name: string | null;
}

export interface Enrollment {
  id: number;
  subject_id: number;
  student_id: number;
  student_name: string;
  admission_no: string;
  created_at: string;
}

export interface Score {
  id: number;
  student_id: number;
  subject_id: number;
  subject_name: string;
  term: string;
  score: number;
  grade: string;
  created_at: string;
}

export interface ScoreCreatePayload {
  student_id: number;
  subject_id: number;
  term: string;
  score: number;
}

export interface SubjectResultItem {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  score: number;
  grade: string;
  teacher_name: string | null;
}

export interface StudentTermSummary {
  student_id: number;
  admission_no: string;
  class_level: string;
  full_name: string;
  term: string;
  results: SubjectResultItem[];
  average_score: number;
}

export interface SubjectStats {
  subject_id: number;
  subject_name: string;
  term: string;
  highest: number;
  lowest: number;
  average: number;
  total_students: number;
}

export interface StudentBelowThreshold {
  student_id: number;
  student_name: string;
  admission_no: string;
  subject_id: number;
  subject_name: string;
  term: string;
  score: number;
  grade: string;
}

export interface PublicationResponse {
  id: number;
  term: string;
  published_at: string | null;
  published_by: number | null;
  failing_students: StudentBelowThreshold[];
}

export interface NotificationLog {
  id: number;
  term: string;
  student_id: number;
  message: string;
  created_at: string;
}

export interface StudentRankItem {
  rank: number;
  student_id: number;
  student_name: string;
  admission_no: string;
  class_level: string;
  total_score: number;
  subjects_count: number;
  average_score: number;
  grade: string;
}

export interface ClassRankingResponse {
  term: string;
  class_level: string | null;
  total_students: number;
  rankings: StudentRankItem[];
}
