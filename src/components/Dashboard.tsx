/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  Compass,
  MessageSquare,
  BarChart2,
  CheckCircle,
  Play,
  RotateCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  XCircle,
  Clock
} from "lucide-react";
import { getStats, getTasks, getStaffList, auditTaskStep, getSops } from "../api";
import { Task, AIStaff, SopTemplate } from "../types";

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onCreateTaskQuick?: () => void;
}

export default function Dashboard({ onNavigate, onCreateTaskQuick }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<AIStaff[]>([]);
  const [sops, setSops] = useState<SopTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auditingId, setAuditingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sRes, tRes, stRes, sopRes] = await Promise.all([
        getStats(),
        getTasks(),
        getStaffList(),
        getSops()
      ]);
      setStats(sRes);
      setTasks(tRes);
      setStaff(stRes);
      setSops(sopRes);
    } catch (err: any) {
      setError("从工作台数据中心同步运营状态失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAudit = async (taskId: string, approved: boolean) => {
    try {
      setAuditingId(taskId);
      await auditTaskStep(taskId, approved);
      // reload
      await loadData();
    } catch (err: any) {
      alert("审核提交失败: " + err.message);
    } finally {
      setAuditingId(null);
    }
  };

  // Extract pending auditing tasks
  const auditTasks = tasks.filter((t) => t.task_status === "audit");
  // Extract active running tasks
  const runningTasks = tasks.filter((t) => t.task_status === "running" || t.task_status === "pending");

  return (
    <div className="space-y-6" id="dashboard-main-view">
      {/* Upper header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-sans">
            AI 智能团队工作台 🪐
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            您好，主脑！您共有 {staff.length} 位虚拟员工正在 7x24 小时执行 SOP 流程化工作。
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
          id="btn-refresh-dashboard"
        >
          <RotateCw className="w-3.5 h-3.5" />
          手动同步
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Grid Stats Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="id-stats-counters">
        <div key="c-topics" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">选题池积累</span>
            <Compass className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-slate-800">
              {stats?.topic_count || 5} <span className="text-xs font-normal text-slate-400">核定</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">已沉淀知识文档</span>
          </div>
        </div>

        <div key="c-contents" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">宣发成果文</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-slate-800">
              {stats?.content_count || 2} <span className="text-xs font-normal text-slate-400">篇</span>
            </div>
            <span className="text-[10px] text-blue-600 font-medium">分适应自媒体平台</span>
          </div>
        </div>

        <div key="c-leads" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">私域咨询跟进</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-slate-800">
              {stats?.customer_count || 3} <span className="text-xs font-normal text-slate-400">个</span>
            </div>
            <span className="text-[10px] text-indigo-600 font-medium">AI助理建档追踪</span>
          </div>
        </div>

        <div key="c-reviews" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">复盘诊断包</span>
            <BarChart2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-slate-800">
              {stats?.review_count || 1} <span className="text-xs font-normal text-slate-400">份</span>
            </div>
            <span className="text-[10px] text-purple-600 font-medium">指导下一轮策略</span>
          </div>
        </div>

        <div key="c-completion" className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-500 to-violet-600 p-4 rounded-xl shadow-md text-white flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-80">
            <span className="text-xs font-medium text-white">SOP 准点完成率</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-bold tracking-tight">
              {stats?.task_completion_rate || 85}%
            </div>
            <span className="text-[10px] opacity-90 block">全自动化流转指标</span>
          </div>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Virtual Employees Monitor Grid */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="p-1 bg-slate-100 rounded text-sky-500">🧑‍💻</span>
                AI 员工在岗状态监视槽
              </h2>
              <button
                onClick={() => onNavigate("staff")}
                className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-0.5"
              >
                团队扩招 / 自定义岗位 <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3" id="employee-status-grid">
              {staff.map((s) => {
                const isIdle = s.staff_status === "idle";
                const isBusy = s.staff_status === "busy";
                
                return (
                  <div
                    key={s.staff_id}
                    onClick={() => onNavigate("staff")}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer text-center relative group overflow-hidden"
                  >
                    <div className="absolute top-2 right-2 flex h-2 w-2">
                      {isBusy ? (
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                      ) : null}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isIdle ? "bg-emerald-500" : isBusy ? "bg-amber-500" : "bg-slate-300"}`}></span>
                    </div>

                    <div className="text-lg mb-1">{s.staff_name.split(" ").pop()}</div>
                    <div className="text-xs font-semibold text-slate-700 truncate">{s.staff_name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {s.is_custom ? (
                        <span className="px-1 py-0.5 bg-indigo-50 text-indigo-500 rounded font-bold">自定义</span>
                      ) : (
                        <span className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded">系统岗位</span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1.5 font-medium">
                      {isBusy ? "SOP 研判执行中" : isIdle ? "待岗在岗" : "下线归档"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Audits card - User control panel */}
          <div className="bg-amber-50/30 border border-amber-200/60 p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
              <span className="p-1 bg-amber-100 rounded text-amber-600">👤</span>
              主脑质检审核区 ({auditTasks.length} 个待办)
            </h3>

            {auditTasks.length === 0 ? (
              <div className="p-8 bg-white border border-slate-100 rounded-lg text-center text-xs text-slate-400">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                所有 AI 生产成果均合规。当前没有正在挂起的审核事项
              </div>
            ) : (
              <div className="space-y-3" id="pending-audits-list">
                {auditTasks.map((t) => (
                  <div key={t.task_id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                        {t.task_name}
                      </div>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">
                        第 {t.current_step_index + 1} 步
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded text-xs talk-result-container text-slate-600 max-h-40 overflow-y-auto whitespace-pre-line font-mono border border-slate-100">
                      {t.task_result}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">
                        * 请仔细复核其文笔或论点，批准后一键流转
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={auditingId === t.task_id}
                          onClick={() => handleAudit(t.task_id, false)}
                          className="px-2.5 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium transition cursor-pointer"
                        >
                          驳回修改
                        </button>
                        <button
                          disabled={auditingId === t.task_id}
                          onClick={() => handleAudit(t.task_id, true)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-md font-medium shadow transition cursor-pointer"
                        >
                          批准通过 <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Running Tasks and Workflows */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="p-1 bg-slate-100 rounded text-sky-500">⚙️</span>
                正在执行的任务流水线 ({runningTasks.length} 个活跃)
              </h2>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-0.5"
              >
                新建运营流水线 <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {runningTasks.length === 0 ? (
              <div className="p-8 bg-slate-50/50 rounded-lg text-center text-xs text-slate-400 border border-dashed border-slate-200">
                <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                当前没有运行中的 SOP 任务。点击右侧“新建”开启智能自动化流程吧！
              </div>
            ) : (
              <div className="space-y-3" id="running-pipelines-list">
                {runningTasks.map((t) => {
                  const correlatedSop = sops.find((s) => s.sop_id === t.sop_id);
                  const totalSteps = correlatedSop?.sop_content.length || 3;
                  const currentStepName = correlatedSop?.sop_content[t.current_step_index]?.step_name || "结束";
                  const percent = Math.min(100, Math.round((t.current_step_index / totalSteps) * 100));

                  return (
                    <div
                      key={t.task_id}
                      onClick={() => onNavigate("tasks")}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-100 transition cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 py-0.5 flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-700 truncate flex items-center gap-1.5">
                          {t.task_status === "running" ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                          )}
                          {t.task_name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>进程: {percent}%</span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium truncate">当前节点: {currentStepName} ({t.current_step_index + 1}/{totalSteps})</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-1 px-0">
                          <div className="bg-indigo-600 h-1" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200/60 px-2 py-1 rounded">
                        <span>点击查看</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Quick actions and team philosophy */}
        <div className="space-y-6 lg:col-span-1">
          {/* Quick task action widget */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-5 rounded-xl text-white shadow-lg space-y-4">
            <div>
              <h3 className="font-semibold text-white tracking-tight">
                主脑极速作业舱 🎛️
              </h3>
              <p className="text-[11px] text-indigo-200/80 mt-1">
                零代码下达自动化协作指派。一键生成选题或裂变稿件：
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={onCreateTaskQuick || (() => onNavigate("tasks"))}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg text-xs font-medium text-white transition flex items-center justify-between shadow-md cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  新建爆款内容生产流
                </span>
                <span className="text-[9px] bg-indigo-800 px-1.5 py-0.5 rounded">SOP</span>
              </button>

              <button
                onClick={() => onNavigate("customers")}
                className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium text-indigo-100 transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  进入 AI 私域销售接待
                </span>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded">24H</span>
              </button>

              <button
                onClick={() => onNavigate("assets")}
                className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium text-indigo-100 transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  查阅 AI 智能知识中心
                </span>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded">知识库</span>
              </button>
            </div>

            <div className="p-3 bg-indigo-950/50 rounded-lg border border-indigo-800/30 text-[10px] text-indigo-300">
              💡 <span className="font-semibold">核心业务理念</span>：不再零散使用AI工具，把大模型装进固定“虚拟员工岗位”里，让流程驱动自动运营。
            </div>
          </div>

          {/* SOP Engine Status info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              团队 SOP 规章一览
            </h3>

            <div className="space-y-3 text-xs">
              {sops.slice(0, 4).map((s) => (
                <div key={s.sop_id} className="flex justify-between items-start gap-2 border-b border-slate-50 pb-2">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-700 truncate max-w-[160px]">{s.sop_name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")}</div>
                    <div className="text-[10px] text-slate-400">
                      步骤数: {s.sop_content.length} | 类型: {s.sop_type === "content" ? "自媒体创作" : s.sop_type === "customer" ? "私域销售" : "深度自检"}
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-medium">已激活</span>
                </div>
              ))}
              
              <button
                onClick={() => onNavigate("sop")}
                className="w-full py-1.5 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 text-center rounded-lg text-[11px] font-medium transition cursor-pointer"
              >
                设计配置 SOP 规则
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
