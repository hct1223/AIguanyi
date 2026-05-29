/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AIStaff,
  SopTemplate,
  Task,
  ContentCreative,
  MaterialAsset,
  SpeechTemplate,
  CustomerLead,
  ReviewReport,
  SystemLog
} from "./types";

export async function getStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("获取服务统计指标失败");
  return res.json();
}

export async function getStaffList(): Promise<AIStaff[]> {
  const res = await fetch("/api/staff");
  if (!res.ok) throw new Error("获取虚拟员工名册失败");
  return res.json();
}

export async function createStaff(staff: Partial<AIStaff>): Promise<AIStaff> {
  const res = await fetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staff)
  });
  if (!res.ok) throw new Error("扩招AI虚构员工失败");
  return res.json();
}

export async function updateStaff(id: string, staff: Partial<AIStaff>): Promise<AIStaff> {
  const res = await fetch(`/api/staff/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staff)
  });
  if (!res.ok) throw new Error("调校智能员工参数失败");
  return res.json();
}

export async function deleteStaff(id: string): Promise<boolean> {
  const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("解雇或裁撤岗位失败");
  return true;
}

export async function getSops(): Promise<SopTemplate[]> {
  const res = await fetch("/api/sop");
  if (!res.ok) throw new Error("拉取SOP规章库错误");
  return res.json();
}

export async function createSop(sop: Partial<SopTemplate>): Promise<SopTemplate> {
  const res = await fetch("/api/sop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sop)
  });
  if (!res.ok) throw new Error("起草SOP规章模板失败");
  return res.json();
}

export async function updateSop(id: string, sop: Partial<SopTemplate>): Promise<SopTemplate> {
  const res = await fetch(`/api/sop/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sop)
  });
  if (!res.ok) throw new Error("修订SOP规章步骤失败");
  return res.json();
}

export async function deleteSop(id: string): Promise<boolean> {
  const res = await fetch(`/api/sop/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("废止SOP规章模板异常");
  return true;
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("同步流水作业线失败");
  return res.json();
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error("下达自动化分工计划失败");
  return res.json();
}

export async function executeTaskStep(id: string, inputData: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input_data: inputData })
  });
  if (!res.ok) throw new Error("驱动步骤自动化运行出错");
  return res.json();
}

export async function auditTaskStep(id: string, approved: boolean): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved })
  });
  if (!res.ok) throw new Error("上传审批签章失败");
  return res.json();
}

export async function stopTask(id: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/stop`, { method: "POST" });
  if (!res.ok) throw new Error("紧急拉闸终止任务失败");
  return res.json();
}

export async function deleteTask(id: string): Promise<boolean> {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("撤销项目记录失败");
  return true;
}

export async function getContentList(): Promise<ContentCreative[]> {
  const res = await fetch("/api/content");
  if (!res.ok) throw new Error("同步待审草稿资产出错");
  return res.json();
}

export async function createContentDraft(title: string, contentText: string, platformType: string): Promise<ContentCreative> {
  const res = await fetch("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content_text: contentText, platform_type: platformType })
  });
  if (!res.ok) throw new Error("手动生产分发稿错误");
  return res.json();
}

export async function updateContentDraft(id: string, payload: Partial<ContentCreative>): Promise<ContentCreative> {
  const res = await fetch(`/api/content/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("批改文摘稿件内容错误");
  return res.json();
}

export async function publishContent(id: string): Promise<ContentCreative> {
  const res = await fetch(`/api/content/${id}/publish`, { method: "POST" });
  if (!res.ok) throw new Error("推送宣发失败");
  return res.json();
}

export async function deleteContent(id: string): Promise<boolean> {
  const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("删除宣发资产档案异常");
  return true;
}

export async function getMaterials(): Promise<MaterialAsset[]> {
  const res = await fetch("/api/materials");
  if (!res.ok) throw new Error("载入素材包错误");
  return res.json();
}

export async function createMaterial(payload: Partial<MaterialAsset>): Promise<MaterialAsset> {
  const res = await fetch("/api/materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("储藏原始干货失败");
  return res.json();
}

export async function deleteMaterial(id: string): Promise<boolean> {
  const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("丢弃原始干货素材异常");
  return true;
}

export async function getSpeechList(): Promise<SpeechTemplate[]> {
  const res = await fetch("/api/speech");
  if (!res.ok) throw new Error("载入脚本剧本模板失败");
  return res.json();
}

export async function createSpeech(payload: Partial<SpeechTemplate>): Promise<SpeechTemplate> {
  const res = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("录入金牌销售台本失败");
  return res.json();
}

export async function updateSpeech(id: string, payload: Partial<SpeechTemplate>): Promise<SpeechTemplate> {
  const res = await fetch(`/api/speech/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("校正话术条目内容失败");
  return res.json();
}

export async function deleteSpeech(id: string): Promise<boolean> {
  const res = await fetch(`/api/speech/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("废除销售话术台本失败");
  return true;
}

export async function getCustomers(): Promise<CustomerLead[]> {
  const res = await fetch("/api/customers");
  if (!res.ok) throw new Error("同步CRM雷达档案失败");
  return res.json();
}

export async function createCustomer(payload: Partial<CustomerLead>): Promise<CustomerLead> {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("建档访客失败");
  return res.json();
}

export async function updateCustomer(id: string, payload: Partial<CustomerLead>): Promise<CustomerLead> {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("修改客群标签标签异常");
  return res.json();
}

export async function chatWithCustomer(id: string, text: string): Promise<CustomerLead> {
  const res = await fetch(`/api/customers/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error("向用户发送信道失败");
  return res.json();
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("清理客群档案异常");
  return true;
}

export async function getReviewReports(): Promise<ReviewReport[]> {
  const res = await fetch("/api/reviews");
  if (!res.ok) throw new Error("调用数据历史复盘失败");
  return res.json();
}

export async function generateReviewReport(reviewType: string): Promise<ReviewReport> {
  const res = await fetch("/api/reviews/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review_type: reviewType })
  });
  if (!res.ok) throw new Error("生成AI多渠道报告失败");
  return res.json();
}

export async function deleteReviewReport(id: string): Promise<boolean> {
  const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("删除复盘存档异常");
  return true;
}

export async function getSystemLogs(): Promise<SystemLog[]> {
  const res = await fetch("/api/logs");
  if (!res.ok) throw new Error("载入系统实时运作日志失败");
  return res.json();
}

export async function triggerSystemReset(): Promise<boolean> {
  const res = await fetch("/api/system/reset", { method: "POST" });
  if (!res.ok) throw new Error("重组工作主脑失败");
  return true;
}
