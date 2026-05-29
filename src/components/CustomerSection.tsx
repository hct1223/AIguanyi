/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Users,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Clipboard,
  ShieldAlert,
  Save,
  CheckCircle,
  HelpCircle,
  X,
  Sliders,
  Play,
  RotateCw
} from "lucide-react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  chatWithCustomer,
  deleteCustomer,
  getSpeechList,
  createSpeech,
  updateSpeech,
  deleteSpeech
} from "../api";
import { CustomerLead, SpeechTemplate } from "../types";

export default function CustomerSection() {
  const [subTab, setSubTab] = useState<"leads" | "scripts">("leads");

  // State variables for Leads
  const [customers, setCustomers] = useState<CustomerLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<CustomerLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [inputText, setInputText] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

  // New Lead Modal
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadRemark, setLeadRemark] = useState("");
  const [leadIntent, setLeadIntent] = useState<"high" | "medium" | "low">("medium");

  // Edit Lead Modal
  const [editingLead, setEditingLead] = useState<CustomerLead | null>(null);
  const [editIntent, setEditIntent] = useState<"high" | "medium" | "low">("medium");
  const [editRemark, setEditRemark] = useState("");

  // Golden sales scripts
  const [speeches, setSpeeches] = useState<SpeechTemplate[]>([]);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [speechTitle, setSpeechTitle] = useState("");
  const [speechTrigger, setSpeechTrigger] = useState("");
  const [speechContent, setSpeechContent] = useState("");
  const [editingSpeech, setEditingSpeech] = useState<SpeechTemplate | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [cusList, spList] = await Promise.all([getCustomers(), getSpeechList()]);
      setCustomers(cusList);
      setSpeeches(spList);
      if (cusList.length > 0) {
        const matched = cusList.find((c) => c.customer_id === selectedLead?.customer_id);
        setSelectedLead(matched || cusList[0]);
      }
    } catch (err: any) {
      setError("从CRM雷达中拉取客群档案发生异常: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sends message into Simulated chatbot
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedLead) return;

    try {
      setSendingId(selectedLead.customer_id);
      setError("");
      const textToSend = inputText;
      setInputText("");
      
      const userMsg = { sender: "user" as const, text: textToSend, timestamp: new Date().toISOString() };
      const updatedLeadOptimistic = {
        ...selectedLead,
        chat_record: [...(selectedLead.chat_record || []), userMsg]
      };
      setSelectedLead(updatedLeadOptimistic);

      const result = await chatWithCustomer(selectedLead.customer_id, textToSend);
      setSelectedLead(result);
      await loadData();
    } catch (err: any) {
      setError("向模拟访客抛接信息出错: " + err.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadContact) return;

    try {
      setError("");
      const payload = {
        nickname: leadName,
        contact: leadContact,
        remarks: leadRemark || "对产品表示了一定的好奇兴趣",
        intent_level: leadIntent as any,
        chat_record: [
          { sender: "client" as const, text: "你好！我最近在研究AI副业社群，你们这具体有些什么服务呀？", timestamp: new Date().toISOString() }
        ]
      };
      const result = await createCustomer(payload);
      setShowLeadModal(false);
      setLeadName("");
      setLeadContact("");
      setLeadRemark("");
      await loadData();
      setSelectedLead(result);
    } catch (err: any) {
      setError("创设私域访客雷达锚点失败: " + err.message);
    }
  };

  const handleUpdateLeadProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      setError("");
      await updateCustomer(editingLead.customer_id, {
        remarks: editRemark,
        intent_level: editIntent as any
      });
      setEditingLead(null);
      await loadData();
    } catch (err: any) {
      setError("修改客群档案标识失败: " + err.message);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("核实解约并移出该名访客的跟踪信托吗？")) return;
    try {
      setError("");
      await deleteCustomer(id);
      setSelectedLead(null);
      await loadData();
    } catch (err: any) {
      setError("移出客户异常: " + err.message);
    }
  };

  // Speech scripts actions
  const handleSaveSpeech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speechContent) return;

    try {
      setError("");
      const payload = {
        speech_type: "faq" as any,
        keyword: speechTrigger || "通用",
        speech_content: speechContent,
        status: true
      };

      if (editingSpeech) {
        await updateSpeech(editingSpeech.speech_id, payload);
      } else {
        await createSpeech(payload);
      }

      setShowSpeechModal(false);
      setSpeechTitle("");
      setSpeechTrigger("");
      setSpeechContent("");
      setEditingSpeech(null);
      await loadData();
    } catch (err: any) {
      setError("保存销售标准话术失败: " + err.message);
    }
  };

  const handleDeleteSpeech = async (id: string) => {
    if (!window.confirm("核查删除此金牌标准回复剧本吗？")) return;
    try {
      setError("");
      await deleteSpeech(id);
      await loadData();
    } catch (err: any) {
      setError("移除脚本故障: " + err.message);
    }
  };

  const editSpeechTrigger = (s: SpeechTemplate) => {
    setEditingSpeech(s);
    setSpeechTitle(s.keyword + " 专用回复话术");
    setSpeechTrigger(s.keyword);
    setSpeechContent(s.speech_content);
    setShowSpeechModal(true);
  };

  const getIntentStyle = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "bg-rose-50 border border-rose-200 text-rose-700 font-bold";
      case "medium":
        return "bg-amber-50 border border-amber-200 text-amber-700 font-semibold";
      case "low":
        return "bg-slate-100 border border-slate-200 text-slate-600";
    }
  };

  const getIntentLabel = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "🔥 强劲意向转化";
      case "medium":
        return "⚡ 中温热度追踪";
      case "low":
        return "◌ 低热度冰冻期";
    }
  };

  return (
    <div className="space-y-6" id="crm-integration-dashboard">
      {/* Upper header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            私域咨询转化雷达 🛰️
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            24H 模拟引流访客跟进。搭载智能AI销售副手，利用话术自动诱发客户画像和核心痛点记录。
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setSubTab("leads")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              subTab === "leads" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            💬 模拟线上接待雷达
          </button>
          <button
            onClick={() => setSubTab("scripts")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              subTab === "scripts" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📕 金牌销售话术规章
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* RENDER ACTIVE CRM COMPONENT */}
      {subTab === "leads" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="crm-leads-subview">
          
          {/* Left panel: list of leads */}
          <div className="lg:col-span-1 space-y-3" id="crm-leads-list">
            <div className="flex items-center justify-between font-sans px-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                在孵私域访客库 ({customers.length})
              </span>
              <button
                onClick={() => setShowLeadModal(true)}
                className="inline-flex items-center gap-0.5 text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> 登记新引流访客
              </button>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {customers.map((c) => {
                const isActive = selectedLead?.customer_id === c.customer_id;
                return (
                  <div
                    key={c.customer_id}
                    onClick={() => setSelectedLead(c)}
                    className={`p-4 rounded-xl border text-left transition select-none cursor-pointer ${
                      isActive
                        ? "border-indigo-600 bg-indigo-50/10 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {c.nickname}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 uppercase tracking-wider ${getIntentStyle(c.intent_level)}`}>
                        {c.intent_level === "high" ? "高意向" : c.intent_level === "medium" ? "跟进中" : "低潜"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 truncate font-mono">
                      联系: {c.contact}
                    </p>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-1 italic font-sans" style={{ contentVisibility: 'auto' }}>
                      🖋️ 备注: {c.remarks}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 cols: Chat Screen */}
          <div className="lg:col-span-2 space-y-4">
            {selectedLead ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[550px]" id="crm-chat-console">
                {/* Chat Top header info */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900">
                      与 【{selectedLead.nickname}】 模拟咨询信托链
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>建档日期: {new Date(selectedLead.create_time).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>联系方式: <span className="font-mono">{selectedLead.contact}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold">
                    <button
                      onClick={() => {
                        setEditingLead(selectedLead);
                        setEditIntent(selectedLead.intent_level);
                        setEditRemark(selectedLead.remarks || "");
                      }}
                      className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition"
                    >
                      修改备注标记
                    </button>
                    <button
                      onClick={() => handleDeleteLead(selectedLead.customer_id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                      title="废除访客"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lead Brief summary metadata banner */}
                <div className="bg-slate-50/50 p-3 px-4 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
                  <span className="text-slate-600 font-sans truncate pr-16" style={{ contentVisibility: 'auto' }}>
                    📚 <span className="font-semibold text-slate-900">系统行销标注备注</span>：{selectedLead.remarks}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${getIntentStyle(selectedLead.intent_level)}`}>
                    {getIntentLabel(selectedLead.intent_level)}
                  </span>
                </div>

                {/* Dialog Messages content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 mr-1" id="chat-messages-container">
                  {(selectedLead.chat_record || []).map((msg, mIdx) => {
                    const isUser = msg.sender === "ai" || msg.sender === "user";
                    const isCustomer = msg.sender === "client";
                    
                    return (
                      <div
                        key={mIdx}
                        className={`flex flex-col max-w-[75%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <div className="text-[9px] text-slate-400 mb-0.5 font-mono">
                          {isUser ? "AI 销售（我司助理）" : selectedLead.nickname} • {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>

                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed font-sans shadow-2xs break-all ${
                            isUser
                              ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                              : isCustomer
                              ? "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}

                  {sendingId === selectedLead.customer_id && (
                    <div className="flex items-center gap-2 mr-auto max-w-[70%] text-xs">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold animate-pulse">
                        💡 [AI销售官] 正在根据金牌话术脚本与模型拟定话锋回答中...
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Input typing */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    required
                    placeholder="在此输入话术跟进（比如“我们可以为您提供专门的社群裂变爆款方案，要不先注册体验？”）"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={sendingId === selectedLead.customer_id}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg transition shrink-0 cursor-pointer shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 border border-slate-200 bg-white rounded-xl">
                请从左侧选择一个引流访客，解锁 24H 智能客服智能交互训练场。
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SPEECH SCRIPTS VIEW */
        <div className="space-y-4" id="speech-scripts-subview">
          <div className="flex items-center justify-between font-sans px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              金牌销售话套台本规规章 ({speeches.length})
            </span>
            <button
              onClick={() => {
                setEditingSpeech(null);
                setSpeechTitle("");
                setSpeechTrigger("");
                setSpeechContent("");
                setShowSpeechModal(true);
              }}
              className="inline-flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-md py-1 px-2.5 font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> 录入金牌销售话术
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="speeches-cards-grid">
            {speeches.map((sp) => (
              <div key={sp.speech_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-x-1.5 text-xs">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[9px] border border-indigo-100">
                      金牌台本
                    </span>
                    {sp.keyword && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-mono text-[9px] border border-rose-100">
                        关键词检索: {sp.keyword}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 underline">
                    {sp.keyword} 专用回复话术
                  </h4>

                  <p className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-xs leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap font-sans">
                    {sp.speech_content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleDeleteSpeech(sp.speech_id)}
                    className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    移除话术
                  </button>

                  <button
                    onClick={() => editSpeechTrigger(sp)}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    修订细节
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE LEAD MODAL */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">登记录入私域新访客</h4>
              <button onClick={() => setShowLeadModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">访客昵称 *</label>
                <input
                  type="text"
                  required
                  placeholder="如：杭州程序员 小明"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">联系信息/手机/微信 *</label>
                <input
                  type="text"
                  required
                  placeholder="如：wx_xiaoming888"
                  value={leadContact}
                  onChange={(e) => setLeadContact(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">初步意向标签等级 *</label>
                <select
                  value={leadIntent}
                  onChange={(e) => setLeadIntent(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none"
                >
                  <option value="high">🔥 极其强烈 (付费用户对标意向)</option>
                  <option value="medium">⚡ 中温热度 (在读观望辅导模式)</option>
                  <option value="low">◌ 低迷度 (初步登记)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">经营备注摘要</label>
                <textarea
                  rows={2}
                  placeholder="如：核心意向在于想跟同频人打卡，但预算有限，需要突破其价格防御。"
                  value={leadRemark}
                  onChange={(e) => setLeadRemark(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg hover:shadow cursor-pointer"
                >
                  快速登记
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">重新标注访客画像</h4>
              <button onClick={() => setEditingLead(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLeadProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">修改客户转化意向 *</label>
                <select
                  value={editIntent}
                  onChange={(e) => setEditIntent(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none"
                >
                  <option value="high">🔥 强劲心智已确立付费倾向</option>
                  <option value="medium">⚡ 常规咨询跟进阶段</option>
                  <option value="low">◌ 边缘挂起长期观望</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">修缮备注备注信息 *</label>
                <textarea
                  rows={3}
                  required
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow rounded-lg cursor-pointer animate-pulse-once"
                >
                  保存新画像
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SPEECH SCRIPTS MODAL */}
      {showSpeechModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">
                {editingSpeech ? "修改金牌销售规范台本" : "录入金牌标准销售规章话术"}
              </h4>
              <button onClick={() => setShowSpeechModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpeech} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">首选特定匹配检索触发词 (Keyword Trigger) *</label>
                <input
                  type="text"
                  required
                  placeholder="如：太贵 / 价格 / 费用 / 付费"
                  value={speechTrigger}
                  onChange={(e) => setSpeechTrigger(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * 触发逻辑：当访客模拟提出带此触点词的问题时，系统将通过后端进行关键词精确和模糊重合检索。
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">金牌销售标准回复正文 *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="如：小主，咱们是一对一全方位的社群陪跑。一个月内会带你从0到1生产5个副业模型。平均每天只需一杯奶茶钱，少喝点无益饮料，就给自己的大脑做一次升值投资..."
                  value={speechContent}
                  onChange={(e) => setSpeechContent(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none leading-relaxed font-sans font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSpeechModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  {editingSpeech ? "修改保存 " : "录入归档"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
