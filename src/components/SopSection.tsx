/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ChevronUp,
  ChevronDown,
  Save,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Zap,
  CheckCircle,
  X,
  AlertCircle
} from "lucide-react";
import { getSops, createSop, updateSop, deleteSop, getStaffList } from "../api";
import { SopTemplate, SopStep, AIStaff, SopType } from "../types";

export default function SopSection() {
  const [sops, setSops] = useState<SopTemplate[]>([]);
  const [staff, setStaff] = useState<AIStaff[]>([]);
  const [selectedSop, setSelectedSop] = useState<SopTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SOP Edit form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formSopName, setFormSopName] = useState("");
  const [formSopType, setFormSopType] = useState<SopType>(SopType.CONTENT);
  const [formBindStaffId, setFormBindStaffId] = useState("");
  const [formSteps, setFormSteps] = useState<SopStep[]>([]);

  // Individual step editing states (inside the main design split)
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sopList, stList] = await Promise.all([getSops(), getStaffList()]);
      setSops(sopList);
      setStaff(stList);
      if (sopList.length > 0) {
        setSelectedSop(sopList[0]);
      }
    } catch (err: any) {
      setError("同步SOP引擎图纸库出错: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setFormSopName("");
    setFormSopType(SopType.CONTENT);
    setFormBindStaffId(staff[0]?.staff_id || "");
    setFormSteps([
      {
        step_id: "step-" + Date.now() + "-1",
        step_name: "步骤一：选题素材深度搜刮",
        execute_staff_id: staff[0]?.staff_id || "",
        input_requirements: "输入所定行业细分方向。",
        output_standards: "输出5款高燃标题与爆点佐料。",
        custom_prompt: "请针对此赛道写出3个极低认知门槛、可点击的爆款标题。",
        require_audit: true
      }
    ]);
    setShowFormModal(true);
  };

  const openEditModal = (sp: SopTemplate) => {
    setIsEditing(true);
    setFormSopName(sp.sop_name);
    setFormSopType(sp.sop_type);
    setFormBindStaffId(sp.bind_staff_id);
    setFormSteps(JSON.parse(JSON.stringify(sp.sop_content))); // deep clone
    setShowFormModal(true);
  };

  const handleCloneSop = async (sp: SopTemplate) => {
    try {
      setError("");
      const cloned = {
        sop_name: `${sp.sop_name.replace(/复制版|🚀|⚡|💬|📊/g, "")} 复制版 ⚡`,
        sop_type: sp.sop_type,
        sop_content: JSON.parse(JSON.stringify(sp.sop_content)),
        bind_staff_id: sp.bind_staff_id,
        status: true
      };
      await createSop(cloned);
      await loadData();
    } catch (err: any) {
      setError("克隆SOP流程失效: " + err.message);
    }
  };

  const handleSaveSopTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSopName.trim() || formSteps.length === 0) {
      alert("请输入合法的 SOP 名称、且包含至少一个业务原子执行步骤。");
      return;
    }

    try {
      setError("");
      const payload: Partial<SopTemplate> = {
        sop_name: formSopName,
        sop_type: formSopType,
        sop_content: formSteps,
        bind_staff_id: formBindStaffId,
        status: true
      };

      if (isEditing && selectedSop) {
        const result = await updateSop(selectedSop.sop_id, payload);
        setSelectedSop(result);
      } else {
        await createSop(payload);
      }

      setShowFormModal(false);
      await loadData();
    } catch (err: any) {
      setError("保存SOP工作流蓝图失败: " + err.message);
    }
  };

  const handleDeleteSop = async (sp: SopTemplate) => {
    if (!window.confirm(`绝对确认要废止该自动化工作流蓝图 [${sp.sop_name}] 吗？依赖此 SOP 的所有任务计划将会同步失效。`)) {
      return;
    }

    try {
      setError("");
      await deleteSop(sp.sop_id);
      await loadData();
    } catch (err: any) {
      setError("停用废弃SOP出错: " + err.message);
    }
  };

  // Step ordering modifications
  const handleAddNewStepSpec = () => {
    const newStep: SopStep = {
      step_id: "step-" + Date.now() + "-" + Math.floor(Math.random() * 100),
      step_name: `新步骤 ${formSteps.length + 1}`,
      execute_staff_id: staff[0]?.staff_id || "",
      input_requirements: "输入该步骤的原始素材或上个步骤的AI输出。",
      output_standards: "输出该步骤标准的结构化干货文本。",
      custom_prompt: "请基于前置数据，做出高信息密度的专业提炼。",
      require_audit: false
    };
    setFormSteps([...formSteps, newStep]);
  };

  const handleRemoveStepSpec = (index: number) => {
    if (formSteps.length <= 1) {
      alert("每个自动化经营流必须有至少一个具体动作。");
      return;
    }
    setFormSteps(formSteps.filter((_, i) => i !== index));
    if (activeStepIndex === index) {
      setActiveStepIndex(null);
    }
  };

  const handleStepMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...formSteps];
    const target = items[index];
    items[index] = items[index - 1];
    items[index - 1] = target;
    setFormSteps(items);
  };

  const handleStepMoveDown = (index: number) => {
    if (index === formSteps.length - 1) return;
    const items = [...formSteps];
    const target = items[index];
    items[index] = items[index + 1];
    items[index + 1] = target;
    setFormSteps(items);
  };

  // Modify individual parameters of step inside modal
  const handleStepParamChange = (index: number, key: keyof SopStep, value: any) => {
    const items = [...formSteps];
    items[index] = {
      ...items[index],
      [key]: value
    };
    setFormSteps(items);
  };

  return (
    <div className="space-y-6" id="sop-engine-view">
      {/* Upper header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            SOP 自动化流程制造机 ⚙️
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            定义确定性，祛除随机性！把高潜力内容引流、私域成交和数据复盘打包成“标准业务引擎”，由您的 AI 员工执行。
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition shrink-0 cursor-pointer"
          id="btn-create-sop"
        >
          <Plus className="w-4 h-4" />
          设计新流程 SOP
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main split: Left list, Right visual design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Standard default templates and user sops */}
        <div className="lg:col-span-1 space-y-3" id="sop-left-list">
          <div className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
            已有业务标准工作流蓝图 ({sops.length})
          </div>

          <div className="space-y-2">
            {sops.map((sp) => {
              const isActive = selectedSop?.sop_id === sp.sop_id;
              return (
                <div
                  key={sp.sop_id}
                  onClick={() => {
                    setSelectedSop(sp);
                  }}
                  className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50/10 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 line-clamp-1 flex-1">
                      {sp.sop_name}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded shrink-0 font-medium ml-2">
                      {sp.sop_type === "content" ? "内容创作" : sp.sop_type === "customer" ? "私域承接" : "自检复盘"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    原子任务总数: <span className="font-bold text-slate-700">{sp.sop_content?.length || 0}</span> 个阶段
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-3 mt-3 border-t border-slate-100 text-slate-400">
                    <span>标准团队规章规制</span>
                    <span className="text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-0.5">
                      查看图纸流程
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Step-by-step interactive flows */}
        <div className="lg:col-span-2">
          {selectedSop ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6" id="sop-detail-panel">
              <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    {selectedSop.sop_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    主责任AI员工: {staff.find((st) => st.staff_id === selectedSop.bind_staff_id)?.staff_name || "待岗响应级"}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-center">
                  <button
                    onClick={() => handleCloneSop(selectedSop)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer font-medium"
                    title="复制一套微调"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    复制蓝图
                  </button>

                  <button
                    onClick={() => openEditModal(selectedSop)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-slate-800 hover:bg-slate-700 rounded-lg shadow-sm transition cursor-pointer font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    增改业务步骤
                  </button>

                  <button
                    onClick={() => handleDeleteSop(selectedSop)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    彻底废除
                  </button>
                </div>
              </div>

              {/* Step Flow List */}
              <div className="space-y-4" id="sop-interactive-stepper">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  业务规范执行逐段流转模型
                </div>

                <div className="relative border-l-2 border-dashed border-indigo-100/80 ml-3.5 pl-6 space-y-6">
                  {(selectedSop.sop_content || []).map((step, idx) => {
                    const executor = staff.find((s) => s.staff_id === step.execute_staff_id);
                    return (
                      <div key={step.step_id} className="relative group">
                        {/* Circle Bullet Badge */}
                        <div className="absolute -left-10 top-0.5 bg-indigo-50 border-2 border-indigo-500 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 font-mono shadow-sm">
                          {idx + 1}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                            <span className="font-bold text-slate-800 text-sm">
                              {step.step_name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-semibold">
                                负责岗: {executor?.staff_name || "待指定"}
                              </span>
                              {step.require_audit && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-semibold flex items-center gap-0.5">
                                  <UserCheck className="w-3 h-3" /> 人工审核
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">输入规范期望 (Input Req)</span>
                              <p className="text-slate-600 bg-white border border-slate-200/50 p-2 rounded-lg font-mono leading-relaxed" style={{ contentVisibility: 'auto' }}>
                                {step.input_requirements}
                              </p>
                            </div>
                            <div className="space-y-1 text-xs">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">输出合格尺度 (Output Std)</span>
                              <p className="text-slate-600 bg-white border border-slate-200/50 p-2 rounded-lg font-mono leading-relaxed" style={{ contentVisibility: 'auto' }}>
                                {step.output_standards}
                              </p>
                            </div>
                          </div>

                          {/* Embedded prompts */}
                          <div className="text-xs space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">原子额外微调 Prompt 段 (Addon Instruction)</span>
                            <div className="text-slate-500 bg-slate-900 text-slate-300 p-2 rounded-lg font-mono text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-24">
                              {step.custom_prompt || "(无原子级特别Prompt约束)"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border border-slate-200 bg-white rounded-xl">
              请从左侧选择一条 SOP 自动化流程模板配置原子步骤规范。
            </div>
          )}
        </div>
      </div>

      {/* DESIGN / EDIT SOP FLOW MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">
                {isEditing ? `修订规范工作蓝图 - [${formSopName}]` : "起草全链路自动化流转 SOP 图纸"}
              </h4>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSopTemplate} className="p-5 space-y-5 flex-1 select-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    流程名称 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如：小红书AI爆款副业种草自动化SOP"
                    value={formSopName}
                    onChange={(e) => setFormSopName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    业务流程类型分类 *
                  </label>
                  <select
                    value={formSopType}
                    onChange={(e) => setFormSopType(e.target.value as SopType)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={SopType.CONTENT}>内容创作流适配</option>
                    <option value={SopType.CUSTOMER}>访客私域转化</option>
                    <option value={SopType.REVIEW}>商业数据盘口复盘</option>
                  </select>
                </div>
              </div>

              {/* Steps visual configurator */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    原子级步骤编辑清单步骤 ({formSteps.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNewStepSpec}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md py-1 px-2 font-bold cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> 追加入口步骤
                  </button>
                </div>

                {/* Steps mapping inside modal */}
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                  {formSteps.map((step, idx) => (
                    <div key={step.step_id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 relative space-y-3">
                      {/* Step index & Move Controls */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60">
                        <span className="text-xs font-bold text-slate-700">
                          原子步骤 #{idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleStepMoveUp(idx)}
                            className="p-1 hover:bg-slate-200 disabled:opacity-40 rounded cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formSteps.length - 1}
                            onClick={() => handleStepMoveDown(idx)}
                            className="p-1 hover:bg-slate-200 disabled:opacity-40 rounded cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStepSpec(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded ml-2 cursor-pointer"
                            title="删除此步骤"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inputs Row 1: Name and Executor */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">步骤名称 *</label>
                          <input
                            type="text"
                            required
                            value={step.step_name}
                            onChange={(e) => handleStepParamChange(idx, "step_name", e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none"
                            placeholder="如：爆款选题提案生成"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">执行AI员工 *</label>
                            <select
                              value={step.execute_staff_id}
                              onChange={(e) => handleStepParamChange(idx, "execute_staff_id", e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded p-1.5"
                            >
                              {staff.map((st) => (
                                <option key={st.staff_id} value={st.staff_id}>
                                  {st.staff_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">人机协作 *</label>
                            <select
                              value={step.require_audit ? "1" : "0"}
                              onChange={(e) => handleStepParamChange(idx, "require_audit", e.target.value === "1")}
                              className="w-full text-xs border border-slate-300 rounded p-1.5"
                            >
                              <option value="0">自动流转下一关</option>
                              <option value="1">人工挂起物料质检</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Inputs Row 2: Expectations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">输入规范要求 (向用户要什么)</label>
                          <input
                            type="text"
                            value={step.input_requirements}
                            onChange={(e) => handleStepParamChange(idx, "input_requirements", e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5"
                            placeholder="如：输入该赛道的核心痛点问题..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">合格输出检验尺度 (AI产出什么才算合格)</label>
                          <input
                            type="text"
                            value={step.output_standards}
                            onChange={(e) => handleStepParamChange(idx, "output_standards", e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5"
                            placeholder="如：输出带emoji的适合小红书的高吸引选题..."
                          />
                        </div>
                      </div>

                      {/* Inputs Row 3: Custom step prompt additions */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">专属局部工作附加特训 Prompt 脚本段 (对大模型有额外约束时引入)</label>
                        <textarea
                          rows={2}
                          value={step.custom_prompt}
                          onChange={(e) => handleStepParamChange(idx, "custom_prompt", e.target.value)}
                          className="w-full font-mono text-[10px] border border-slate-300 rounded p-2 focus:outline-none"
                          placeholder="请输入特定的格式排版约束，如：段尾必须打上 #自媒体副业 标签，不要带任何前言废话。"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg font-semibold shadow-sm transition cursor-pointer animate-pulse-once"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存并校验蓝图
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
