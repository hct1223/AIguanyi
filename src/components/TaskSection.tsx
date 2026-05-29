/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  StopCircle,
  RotateCw,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Terminal,
  UserCheck,
  ChevronRight,
  Info,
  Archive,
  BookOpen
} from "lucide-react";
import { getTasks, getSops, getStaffList, createTask, executeTaskStep, auditTaskStep, stopTask, deleteTask } from "../api";
import { Task, SopTemplate, AIStaff, TaskStatus } from "../types";

export default function TaskSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sops, setSops] = useState<SopTemplate[]>([]);
  const [staff, setStaff] = useState<AIStaff[]>([]);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New task form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newSopId, setNewSopId] = useState("");

  // Stepper input execution states
  const [stepInputText, setStepInputText] = useState("");
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [tList, sopList, stList] = await Promise.all([
        getTasks(),
        getSops(),
        getStaffList()
      ]);
      setTasks(tList);
      setSops(sopList.filter((s) => s.status)); // active Sops
      setStaff(stList);
      if (tList.length > 0) {
        // preserve selection if still exists
        const matched = tList.find((t) => t.task_id === selectedTask?.task_id);
        setSelectedTask(matched || tList[0]);
      }
    } catch (err: any) {
      setError("同步流水线执行大盘出错: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSopId) {
      alert("请选择要绑定的业务标准 SOP 规章。");
      return;
    }

    try {
      setError("");
      const sop = sops.find((s) => s.sop_id === newSopId);
      const payload = {
        task_name: newTaskName.trim() || `「${sop?.sop_name.replace(/🚀|⚡|💬|📊/g, "").slice(0, 10)}」运作协同任务`,
        sop_id: newSopId
      };
      const result = await createTask(payload);
      setShowCreateModal(false);
      setNewTaskName("");
      setNewSopId("");
      await loadData();
      setSelectedTask(result);
    } catch (err: any) {
      setError("立案下达新流水线失败: " + err.message);
    }
  };

  const handleStepRun = async (taskId: string) => {
    if (!stepInputText.trim()) {
      alert("请在操作槽内填写该步骤的基础输入文本（如：细分行业名称、原始文章资料），以便 AI 岗位员工进行精准处理。");
      return;
    }

    try {
      setExecutingTaskId(taskId);
      setError("");
      const updated = await executeTaskStep(taskId, stepInputText);
      setStepInputText("");
      await loadData();
      setSelectedTask(updated);
    } catch (err: any) {
      setError("启动大模型岗位流水出错: " + err.message);
    } finally {
      setExecutingTaskId(null);
    }
  };

  const handleAuditApprove = async (taskId: string, approved: boolean) => {
    try {
      setExecutingTaskId(taskId);
      setError("");
      const updated = await auditTaskStep(taskId, approved);
      await loadData();
      setSelectedTask(updated);
    } catch (err: any) {
      setError("用户主脑质检审批发生故障: " + err.message);
    } finally {
      setExecutingTaskId(null);
    }
  };

  const handleStopTask = async (taskId: string) => {
    try {
      setError("");
      const updated = await stopTask(taskId);
      await loadData();
      setSelectedTask(updated);
    } catch (err: any) {
      setError("终止任务操作失败: " + err.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("确认要从执行历史里废除并清理该协同方案记录吗？该方案产出的所有具体物料正文不受影响。")) {
      return;
    }

    try {
      setError("");
      await deleteTask(taskId);
      setSelectedTask(null);
      await loadData();
    } catch (err: any) {
      setError("清理战役记录出错: " + err.message);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded text-[10px] font-semibold border border-sky-100">待推进</span>;
      case "running":
        return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold border border-indigo-200 animate-pulse">AI 作业中</span>;
      case "audit":
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold border border-amber-200 animate-bounce">主脑质检</span>;
      case "completed":
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-semibold border border-emerald-100">已完结</span>;
      case "terminated":
        return <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-semibold border border-red-100">已中止</span>;
      case "failed":
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold">异动中断</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">未知</span>;
    }
  };

  // Resolve current correlated workflow
  const correlatedSop = sops.find((s) => s.sop_id === selectedTask?.sop_id);
  const totalSteps = correlatedSop?.sop_content.length || 0;
  const currentStep = correlatedSop?.sop_content[selectedTask?.current_step_index || 0];
  const executor = currentStep ? staff.find((s) => s.staff_id === currentStep.execute_staff_id) : null;

  return (
    <div className="space-y-6" id="task-pipeline-view">
      {/* Upper header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-600 fill-indigo-600" />
            自动化全流程任务流水线 🛸
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            一键派发流水线作业行动。实时掌控AI多模块分流、审核判定以及全闭环内容生成。
          </p>
        </div>
        <button
          onClick={() => {
            if (sops.length === 0) {
              alert("当前尚无启用的 SOP 工作法则！请先移步 [SOP流程引擎] 建立标准蓝图。");
              return;
            }
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition shrink-0 cursor-pointer"
          id="btn-create-task"
        >
          <Plus className="w-4 h-4" />
          下达全新自动化业务任务
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main split: Left task list, Right monitor console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Tasks list */}
        <div className="lg:col-span-1 space-y-3" id="task-left-list">
          <div className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
            协同任务方案库 ({tasks.length})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {tasks.map((t) => {
              const isActive = t.task_id === selectedTask?.task_id;
              const sopObj = sops.find((s) => s.sop_id === t.sop_id);
              return (
                <div
                  key={t.task_id}
                  onClick={() => setSelectedTask(t)}
                  className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50/10 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(t.task_status)}
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 tracking-tight pr-14 truncate">
                    {t.task_name}
                  </h3>
                  
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    规则: {sopObj?.sop_name || "待同步规则"}
                  </p>

                  <div className="flex items-center justify-between text-[10px] mt-4 pt-3 border-t border-slate-100 text-slate-400">
                    <span>运行时间: {new Date(t.create_time).toLocaleDateString()}</span>
                    <span className="font-semibold text-slate-600">查看行动控制台</span>
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="p-12 text-center text-slate-400 border border-slate-200 bg-white rounded-xl">
                当前暂无历史任务档案。点击右上角“下达”快速开始一个。
              </div>
            )}
          </div>
        </div>

        {/* Right column: Action Board! */}
        <div className="lg:col-span-2">
          {selectedTask ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6" id="task-monitor-panel">
              
              {/* Header inside Panel */}
              <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedTask.task_status)}
                    <h3 className="text-base font-bold text-slate-950">
                      {selectedTask.task_name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    任务创建时间: {new Date(selectedTask.create_time).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-center">
                  {(selectedTask.task_status === "running" || selectedTask.task_status === "pending" || selectedTask.task_status === "audit") && (
                    <button
                      onClick={() => handleStopTask(selectedTask.task_id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition font-medium cursor-pointer"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      强制终止
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTask(selectedTask.task_id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除记录
                  </button>
                </div>
              </div>

              {/* Progress Stepper representation */}
              {correlatedSop && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    SOP 步骤进度追踪大盘
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {correlatedSop.sop_content.map((step, sIdx) => {
                      const isCompleted = sIdx < selectedTask.current_step_index;
                      const isCurrent = sIdx === selectedTask.current_step_index;
                      const isFuture = sIdx > selectedTask.current_step_index;

                      return (
                        <div
                          key={step.step_id}
                          className={`p-3 rounded-lg border text-left flex flex-col justify-between space-y-1.5 ${
                            isCurrent
                              ? "border-indigo-600 bg-indigo-50/20 shadow-xs"
                              : isCompleted
                              ? "border-emerald-200 bg-emerald-50/10"
                              : "border-slate-100 bg-slate-50/40 opacity-70"
                          }`}
                        >
                          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                            <span>步骤 #{sIdx + 1}</span>
                            {isCompleted && <span className="text-emerald-600 font-bold">✓ 执行完成</span>}
                            {isCurrent && <span className="text-indigo-600 font-bold">● 当前在岗</span>}
                          </div>
                          <div className="text-xs font-bold text-slate-800 line-clamp-1">
                            {step.step_name}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">
                            指派: {staff.find((st) => st.staff_id === step.execute_staff_id)?.staff_name || "无"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACTIVE ACTION BOX */}
              {selectedTask.task_status !== "completed" && selectedTask.task_status !== "terminated" ? (
                <div className="p-4 bg-indigo-50/40 rounded-xl space-y-4 border border-indigo-100/50">
                  {currentStep && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                          极智操作槽: 正在推进原子阶段 ({selectedTask.current_step_index + 1}/{totalSteps})
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-bold text-[10px]">
                          负责员工: {executor?.staff_name || "待配对"}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <span className="text-slate-400 font-semibold block uppercase tracking-wider">本步骤执行质量检验标尺</span>
                        <div className="p-2.5 bg-white border border-slate-200/60 rounded-lg text-slate-600 flex items-start gap-1.5 leading-relaxed font-sans max-h-24 overflow-y-auto">
                          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-800">要求输入：</span>{currentStep.input_requirements} <br/>
                            <span className="font-bold text-slate-800">合格输出：</span>{currentStep.output_standards}
                          </div>
                        </div>
                      </div>

                      {/* Run controls pending input */}
                      {selectedTask.task_status === "pending" || selectedTask.task_status === "running" ? (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-indigo-900">
                            请为主力 AI 输入指令所需资料原始材料 (Prompt Niche Content) *
                          </label>
                          <div className="flex gap-2">
                            <textarea
                              rows={2}
                              required
                              placeholder="例：
1.（选题流）：小红书AI副业、独立黑客、自媒体变现技巧等方向；
2.（研究清洗）：拷贝进一长篇公众号草稿或大纲；
3.（撰写流）：选题为“5个个人独立黑客AI创富SOP”，素材关联等。建议字数200"
                              value={stepInputText}
                              onChange={(e) => setStepInputText(e.target.value)}
                              className="flex-1 text-xs border border-slate-300 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-600 font-mono"
                            />
                            <button
                              disabled={executingTaskId === selectedTask.task_id}
                              onClick={() => handleStepRun(selectedTask.task_id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg flex flex-col justify-center items-center gap-1 text-xs font-bold transition shrink-0 cursor-pointer shadow-md"
                            >
                              <Send className="w-4 h-4" />
                              驱动运行
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Admin manual audit validation panel */}
                      {selectedTask.task_status === "audit" && (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-amber-900">
                          <div>
                            <span className="font-bold flex items-center gap-1.5 text-amber-800">
                              <UserCheck className="w-4 h-4" />
                              触发质检锁定挂起中
                            </span>
                            <p className="text-amber-700 mt-1">
                              AI员工已按照标准产出成品草案。请在下方查阅其战役产物。合格请点准许，否则拒绝驳回重新调校修改。
                            </p>
                          </div>

                          <div className="flex items-center gap-2 font-bold shrink-0">
                            <button
                              disabled={executingTaskId === selectedTask.task_id}
                              onClick={() => handleAuditApprove(selectedTask.task_id, false)}
                              className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-red-50 text-red-600 rounded-md transition cursor-pointer"
                            >
                              驳回微调
                            </button>
                            <button
                              disabled={executingTaskId === selectedTask.task_id}
                              onClick={() => handleAuditApprove(selectedTask.task_id, true)}
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition cursor-pointer"
                            >
                              批准放行
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-100">
                  🏆 该协同方案已在 {selectedTask.finish_time ? new Date(selectedTask.finish_time).toLocaleDateString() : "近期"} 执行结案或手动封存。生成的文稿和素材均打包储存在了【自媒体资产库】。
                </div>
              )}

              {/* STEP OUTPUTS CONTAINER */}
              {selectedTask.task_result && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>当前阶段 AI 生成大物料成果草案</span>
                    <span className="text-[10px] text-slate-400">已自适应转化存储</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                    {selectedTask.task_result}
                  </div>
                </div>
              )}

              {/* TIMELINE LOGS SCREEN */}
              {selectedTask.logs && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>流水线终端操作日志 (AI-Team Console Logs)</span>
                    <span className="text-[10px] text-indigo-500 font-mono">实时信道</span>
                  </div>
                  
                  <div className="p-4 bg-slate-900 border border-slate-950 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1.5 max-h-56 overflow-y-auto leading-relaxed shadow-lg">
                    {selectedTask.logs.map((lg, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-2">
                        <span className="text-slate-500 font-bold shrink-0">{new Date(lg.timestamp).toLocaleTimeString()}</span>
                        <span className="text-slate-400 shrink-0">[{lg.level.toUpperCase()}]</span>
                        <span className={`${lg.level === "error" ? "text-red-400" : lg.level === "warning" ? "text-amber-400" : "text-emerald-400"}`}>
                          {lg.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border border-slate-200 bg-white rounded-xl">
              请从左侧选择一条行动流水线，查看 AI 员工在岗状态和控制台进度日志。
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">
                下达自动化协同任务方案 🚀
              </h4>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  选择并绑定执行的标准 SOP 模板规则
                </label>
                <select
                  required
                  value={newSopId}
                  onChange={(e) => {
                    setNewSopId(e.target.value);
                    const matchedSop = sops.find((s) => s.sop_id === e.target.value);
                    if (matchedSop) {
                      setNewTaskName(`『${matchedSop.sop_name.replace(/🚀|⚡|💬|📊/g, "").slice(0, 10).trim()}』运营战役行动`);
                    }
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- 请选择要执行的业务 SOP --</option>
                  {sops.map((sp) => (
                    <option key={sp.sop_id} value={sp.sop_id}>
                      {sp.sop_name} ({sp.sop_content.length}步)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  行动方案名称 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：自媒体AI爆群运营-第一期战役"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600"
                />
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100/50 text-[10px] text-indigo-700 leading-relaxed">
                ℹ️ 立案通过后，系统将自动分配首阶段的 AI 岗位员工就位。您只需提供基础种子输入参数，即可一键驱动流水线全流程自动化作业。
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 px-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                >
                  立案下达
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
