/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  HelpCircle,
  Save,
  Check,
  X,
  Compass,
  AlertCircle
} from "lucide-react";
import { getStaffList, createStaff, updateStaff, deleteStaff, getSops } from "../api";
import { AIStaff, SopTemplate, StaffStatus } from "../types";

// Standard competency tags users can select to assign custom capabilities
const PRESET_ABILITIES = [
  "行业热点自动抓取",
  "爆款内容结构拆解",
  "受众核心爆点挖掘",
  "资料降噪与过滤清洗",
  "案例实操步骤精炼",
  "多平台内容一键分身",
  "爆热标题与钩子打磨",
  "私域关键词话术匹配",
  "CRM顾问级自动建档档案",
  "转化漏斗死角诊断",
  "SOP与Prompt修改优化"
];

export default function StaffSection() {
  const [staff, setStaff] = useState<AIStaff[]>([]);
  const [sops, setSops] = useState<SopTemplate[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<AIStaff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Custom Create/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Editing state variables
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formSopId, setFormSopId] = useState("");
  const [formAbilities, setFormAbilities] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<StaffStatus>(StaffStatus.IDLE);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sList, sopList] = await Promise.all([getStaffList(), getSops()]);
      setStaff(sList);
      setSops(sopList);
      if (sList.length > 0) {
        // default select first
        setSelectedStaff(sList[0]);
      }
    } catch (err: any) {
      setError("同步在职AI员工库失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setFormName("");
    setFormDesc("");
    setFormPrompt("你是一个专业的内容/销售AI助理。你的核心工作指令是：\n\n请忠实、严谨地为用户进行标准化输出。");
    setFormSopId("");
    setFormAbilities(["行业热点自动抓取"]);
    setFormStatus(StaffStatus.IDLE);
    setShowModal(true);
  };

  const openEditModal = (s: AIStaff) => {
    setIsEditing(true);
    setFormName(s.staff_name);
    setFormDesc(s.staff_desc);
    setFormPrompt(s.staff_prompt);
    setFormSopId(s.sop_id);
    setFormAbilities(s.staff_ability || []);
    setFormStatus(s.staff_status);
    setShowModal(true);
  };

  const handleClone = async (s: AIStaff) => {
    try {
      setError("");
      const cloned = {
        staff_name: `${s.staff_name.split(" ")[0]} 复制版`,
        staff_desc: `此岗位复制自 [${s.staff_name}]，职责描述：${s.staff_desc}`,
        staff_prompt: s.staff_prompt,
        sop_id: s.sop_id,
        staff_ability: [...s.staff_ability],
        sort_num: staff.length + 1
      };
      await createStaff(cloned);
      await loadData();
    } catch (err: any) {
      setError("复制岗位失败: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDesc.trim() || !formPrompt.trim()) {
      alert("请填写完备的岗位名称、岗位职责和固定 Prompt 指令。");
      return;
    }

    try {
      setError("");
      const payload: Partial<AIStaff> = {
        staff_name: formName,
        staff_desc: formDesc,
        staff_prompt: formPrompt,
        sop_id: formSopId,
        staff_ability: formAbilities,
        staff_status: formStatus
      };

      if (isEditing && selectedStaff) {
        const result = await updateStaff(selectedStaff.staff_id, payload);
        setSelectedStaff(result);
      } else {
        await createStaff(payload);
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError("保存员工设置失败: " + err.message);
    }
  };

  const handleDelete = async (s: AIStaff) => {
    if (!s.is_custom) {
      alert("系统基础原生5大标准岗位为核心基建，暂不支持裁撤。");
      return;
    }
    if (!window.confirm(`确认要把自定义岗位 [${s.staff_name}] 裁撤解雇吗？该岗位执行的所有往期日志资料将被隐去。`)) {
      return;
    }

    try {
      setError("");
      await deleteStaff(s.staff_id);
      await loadData();
    } catch (err: any) {
      setError("解聘 AI 员工岗位失败: " + err.message);
    }
  };

  const toggleAbility = (ab: string) => {
    if (formAbilities.includes(ab)) {
      setFormAbilities(formAbilities.filter((a) => a !== ab));
    } else {
      setFormAbilities([...formAbilities, ab]);
    }
  };

  return (
    <div className="space-y-6" id="staff-section-container">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            AI 虚拟运营员工名册 🧑‍管
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            零代码自主配置你的专属AI主力副手，定义独立指令与SOP，让虚拟公司高质轮班。
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition shrink-0 cursor-pointer"
          id="btn-create-staff"
        >
          <Plus className="w-4 h-4" />
          招募自定义AI员工
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main split: Left list, Right detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Staff cards */}
        <div className="lg:col-span-1 space-y-3" id="staff-left-list">
          <div className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
            虚拟大军团队在岗名单 ({staff.length})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {staff.map((s) => {
              const isActive = selectedStaff?.staff_id === s.staff_id;
              return (
                <div
                  key={s.staff_id}
                  onClick={() => setSelectedStaff(s)}
                  className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50/10 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className={`inline-block w-2 bg-emerald-500 h-2 rounded-full ${s.staff_status === "idle" ? "bg-emerald-500" : s.staff_status === "busy" ? "bg-amber-400 pulse" : "bg-slate-300"}`} />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.staff_status === "idle" ? "在线" : s.staff_status === "busy" ? "任务中" : "离线"}
                    </span>
                  </div>

                  <div className="text-base font-semibold text-slate-900 flex items-center gap-1">
                    {s.staff_name}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {s.staff_desc}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                    <span>
                      {s.is_custom ? (
                        <span className="text-indigo-600 font-extrabold px-1 bg-indigo-50 rounded">自定义</span>
                      ) : (
                        <span className="text-slate-500 font-medium px-1 bg-slate-100 rounded">核心系统岗</span>
                      )}
                    </span>
                    <span className="font-medium text-slate-600">{s.staff_ability?.length || 0} 项专业能力</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed configuration Panel */}
        <div className="lg:col-span-2">
          {selectedStaff ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6" id="staff-detail-panel">
              {/* Top Summary */}
              <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800">
                    ● 在岗中 (100% 顺畅运转)
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                    {selectedStaff.staff_name}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xl">
                    {selectedStaff.staff_desc}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-center">
                  <button
                    onClick={() => handleClone(selectedStaff)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    title="复刻此岗位"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    复刻岗位
                  </button>

                  <button
                    onClick={() => openEditModal(selectedStaff)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-slate-800 hover:bg-slate-700 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    调整 Prompt 职责
                  </button>

                  {selectedStaff.is_custom && (
                    <button
                      onClick={() => handleDelete(selectedStaff)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      裁撤解聘
                    </button>
                  )}
                </div>
              </div>

              {/* Competencies */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  已核准专业业务能力模块
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedStaff.staff_ability || []).map((ab) => (
                    <span key={ab} className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200/50 rounded-lg font-medium">
                      ✓ {ab}
                    </span>
                  ))}
                  {(!selectedStaff.staff_ability || selectedStaff.staff_ability.length === 0) && (
                    <span className="text-xs text-slate-400 italic">暂无专门能力声明</span>
                  )}
                </div>
              </div>

              {/* SOP bind state */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  绑定的 SOP 自动化工作流
                </div>
                {selectedStaff.sop_id ? (
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>
                      📜 {sops.find((s) => s.sop_id === selectedStaff.sop_id)?.sop_name || selectedStaff.sop_id}
                    </span>
                    <span className="text-[10px] text-emerald-600 p-1 bg-emerald-50 rounded">已贯通</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    暂未绑定特定 SOP 工作流，该员工将在全链路流水线启动时按步骤响应
                  </div>
                )}
              </div>

              {/* Preset system Instruction System Prompt (Disabled view, can edit via adjust Prompt modal) */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>专属 LLM 大模型工作提示词 (Prompt 指令守护)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    模型: gemini-3.5-flash
                  </span>
                </div>
                <div className="p-4 bg-slate-900 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                  {selectedStaff.staff_prompt}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border border-slate-200 bg-white rounded-xl">
              请从左侧选择一个 AI 虚拟在岗员工进行职责与 Prompt 调控。
            </div>
          )}
        </div>
      </div>

      {/* CREATE & EDIT MODAL COVERS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">
                {isEditing ? `调整员工参数 - [${formName}]` : "面向你的细分赛道，定制招募全新 AI 虚拟副手岗位"}
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  岗位名称 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：AI 剪辑师 / AI 英文辅导官 / 私域黑增长官"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  岗位核心职责描述 (1-2句话) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="简述其工作目标，如：专门负责洗净和分析英语长句，输出适合自媒体卡片的干货短段落。"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Ability selection checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  授权配属的通用 AI 能力标鉴 (组合拼装专属能力)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1.5">
                  {PRESET_ABILITIES.map((ab) => {
                    const selected = formAbilities.includes(ab);
                    return (
                      <button
                        type="button"
                        key={ab}
                        onClick={() => toggleAbility(ab)}
                        className={`text-[11px] p-2 rounded-lg text-left border transition cursor-pointer ${
                          selected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                            : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {selected ? "✓ " : "+ Icon "} {ab}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bind to standard SOP */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  配属的默认 SOP 流程规则
                </label>
                <select
                  value={formSopId}
                  onChange={(e) => setFormSopId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- 先不绑定特定的 SOP 自动化流，供流水线动态调用 --</option>
                  {sops.map((sp) => (
                    <option key={sp.sop_id} value={sp.sop_id}>
                      {sp.sop_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  专属大模型 System Instruction (爆款心法/金牌话术 Prompt 命令约束体系) *
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="你可以定义详细的受众痛点分析方法。如：你是小红书种草选题官，分析留学生的痛点。请遵守：不要带空话、用中文语气词、首尾必包含互动反思句。"
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full font-mono text-[11px] bg-slate-900 text-emerald-400 border border-slate-300 rounded-lg p-3 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * 极其重要：系统会在触发该步骤时，把这段指令加载为您配属的大模型系统前缀。编写水平直接决定 AI 生成质量与流转规范。
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg font-semibold shadow-sm transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存并上岗部署
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
