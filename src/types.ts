/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum StaffStatus {
  IDLE = "idle",
  BUSY = "busy",
  OFFLINE = "offline"
}

export enum SopType {
  CONTENT = "content",
  CUSTOMER = "customer",
  REVIEW = "review"
}

export enum PlatformType {
  WECHAT = "wechat",
  XIAOHONGSHU = "xiaohongshu",
  VIDEO = "video",
  MOMENTS = "moments",
  COMMUNITY = "community"
}

export enum PublishStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  PUBLISHED = "published",
  FAILED = "failed"
}

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  AUDIT = "audit",
  COMPLETED = "completed",
  TERMINATED = "terminated",
  FAILED = "failed"
}

export enum MaterialType {
  CASE = "case",
  VIEWPOINT = "viewpoint",
  GOLD_SENTENCE = "gold_sentence",
  DATA = "data"
}

export enum SpeechType {
  ATTRACTION = "attraction",
  FAQ = "faq",
  CONVERSION = "conversion",
  RETENTION = "retention"
}

export enum IntentLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low"
}

export enum ReviewType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly"
}

export interface User {
  user_id: string;
  username: string;
  avatar: string;
  create_time: string;
  update_time: string;
}

export interface AIStaff {
  staff_id: string;
  staff_name: string;
  staff_desc: string;
  staff_status: StaffStatus;
  sop_id: string; // bound SOP ID
  is_custom: boolean; // false = default, true = custom
  staff_prompt: string;
  staff_ability: string[]; // e.g. ["选题", "清洗", "多平台改编", "自动话术", "智能复盘"]
  sort_num: number;
}

export interface SopStep {
  step_id: string;
  step_name: string;
  execute_staff_id: string; // assigned virtual employee
  input_requirements: string;
  output_standards: string;
  custom_prompt: string;
  require_audit: boolean;
  timeout_seconds?: number;
}

export interface SopTemplate {
  sop_id: string;
  sop_name: string;
  sop_type: SopType;
  sop_content: SopStep[]; // structured step array
  bind_staff_id: string; // default executive employee
  status: boolean; // active/inactive
  create_time: string;
}

export interface TaskLog {
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
}

export interface Task {
  task_id: string;
  task_name: string;
  sop_id: string;
  staff_id: string;
  task_status: TaskStatus;
  current_step_index: number;
  task_result: string; // text report summary
  logs: TaskLog[];
  create_time: string;
  finish_time?: string;
}

export interface ContentCreative {
  content_id: string;
  task_id: string;
  title: string;
  content_text: string;
  platform_type: PlatformType;
  publish_status: PublishStatus;
  publish_time?: string;
  view_data: {
    views: number;
    likes: number;
    collects: number;
    comments: number;
    shares: number;
  };
  create_time: string;
}

export interface MaterialAsset {
  material_id: string;
  task_id: string;
  title: string;
  content: string;
  material_type: MaterialType;
  source_url?: string;
  create_time: string;
}

export interface SpeechTemplate {
  speech_id: string;
  speech_type: SpeechType;
  keyword: string;
  speech_content: string;
  status: boolean; // active/disabled
}

export interface CustomerLead {
  customer_id: string;
  nickname: string;
  intent_level: IntentLevel;
  chat_record: {
    sender: "client" | "ai" | "user";
    text: string;
    timestamp: string;
  }[];
  create_time: string;
  remarks?: string;
}

export interface ReviewReport {
  review_id: string;
  review_type: ReviewType;
  data_summary: string; // JSON or markdown
  problem_analysis: string;
  optimize_suggest: string;
  create_time: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  category: "api" | "ai" | "task" | "system";
  message: string;
  details?: string;
}
