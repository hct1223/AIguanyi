/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clipboard,
  Trash2,
  CheckCircle,
  Compass,
  FileText,
  Bookmark,
  ExternalLink,
  Edit,
  Save,
  Clock,
  Sparkles,
  RefreshCw,
  Eye,
  Heart,
  Share2,
  FolderLock,
  Plus
} from "lucide-react";
import { getContentList, updateContentDraft, publishContent, deleteContent, getMaterials, createMaterial, deleteMaterial, getTasks } from "../api";
import { ContentCreative, MaterialAsset, PlatformType, PublishStatus, MaterialType } from "../types";

export default function AssetsSection() {
  const [tab, setTab] = useState<"topics" | "materials" | "creatives">("topics");
  
  const [creatives, setCreatives] = useState<ContentCreative[]>([]);
  const [materials, setMaterials] = useState<MaterialAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editor modal state for content edits
  const [editingCreative, setEditingCreative] = useState<ContentCreative | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editPlatform, setEditPlatform] = useState<PlatformType>(PlatformType.XIAOHONGSHU);
  
  // Custom manual material creator state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMatTitle, setNewMatTitle] = useState("");
  const [newMatContent, setNewMatContent] = useState("");
  const [newMatType, setNewMatType] = useState<MaterialType>(MaterialType.VIEWPOINT);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [cList, mList] = await Promise.all([getContentList(), getMaterials()]);
      setCreatives(cList);
      setMaterials(mList);
    } catch (err: any) {
      setError("同步自媒体已成物资库失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("正文内容已成功保存至您的系统剪贴板！可以直接粘贴到任意平台。");
  };

  // Content actions
  const handleSimulatePublish = async (id: string) => {
    try {
      setError("");
      await publishContent(id);
      await loadData();
    } catch (err: any) {
      setError("一键多渠道渠道投射故障: " + err.message);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!window.confirm("确认要废弃并删除该文案发表档案吗？")) {
      return;
    }
    try {
      setError("");
      await deleteContent(id);
      await loadData();
    } catch (err: any) {
      setError("废止文摘失败: " + err.message);
    }
  };

  const handleOpenEdit = (c: ContentCreative) => {
    setEditingCreative(c);
    setEditTitle(c.title);
    setEditText(c.content_text);
    setEditPlatform(c.platform_type);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreative) return;

    try {
      setError("");
      await updateContentDraft(editingCreative.content_id, {
        title: editTitle,
        content_text: editText,
        platform_type: editPlatform
      });
      setEditingCreative(null);
      await loadData();
    } catch (err: any) {
      setError("修改文案草稿失败: " + err.message);
    }
  };

  // Material actions
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatTitle || !newMatContent) return;

    try {
      setError("");
      await createMaterial({
        title: newMatTitle,
        content: newMatContent,
        material_type: newMatType
      });
      setShowMaterialModal(false);
      setNewMatTitle("");
      setNewMatContent("");
      await loadData();
    } catch (err: any) {
      setError("录入知识包失败: " + err.message);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm("核实丢弃该知识素材吗？")) return;
    try {
      setError("");
      await deleteMaterial(id);
      await loadData();
    } catch (err: any) {
      setError("废止知识包故障: " + err.message);
    }
  };

  // Filter materials representing custom Topic list (Since topic proposals are saved dynamically as "viewpoint" materials during task execution)
  const isTopicMaterial = (m: MaterialAsset) => m.title.includes("选题") || m.content.includes("选题名称") || m.content.includes("选题吸引点");
  
  const topics = materials.filter(isTopicMaterial);
  const factMaterials = materials.filter((m) => !isTopicMaterial(m));

  return (
    <div className="space-y-6" id="assets-management-view">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            自媒体资产数据库 📂
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            流水线产出的爆款选题、行研素材干货与改编多端文案的一站式资产归属管培槽。
          </p>
        </div>

        {tab === "materials" && (
          <button
            onClick={() => setShowMaterialModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            手动存入原始行研素材
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200" id="tabs-assets-container">
        <button
          onClick={() => setTab("topics")}
          className={`px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition cursor-pointer ${
            tab === "topics"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          🎯 爆款选题沉淀库 ({topics.length})
        </button>

        <button
          onClick={() => setTab("materials")}
          className={`px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition cursor-pointer ${
            tab === "materials"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          🔬 研究员素材清洗包 ({factMaterials.length})
        </button>

        <button
          onClick={() => setTab("creatives")}
          className={`px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition cursor-pointer ${
            tab === "creatives"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          ✍️ 已成成稿宣发案本 ({creatives.length})
        </button>
      </div>

      {/* RENDER DYNAMIC TAB CONTENT */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">正在与资产主脑库进行云同步中...</div>
      ) : (
        <div className="space-y-4">
          
          {/* TAB 1: TOPIC POOL */}
          {tab === "topics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="asset-topics-list">
              {topics.map((t) => (
                <div key={t.material_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold text-[10px] border border-amber-100">
                        选题官产出
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        产出日期: {new Date(t.create_time).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {t.title}
                    </h4>

                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {t.content}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleDeleteMaterial(t.material_id)}
                      className="text-red-500 hover:text-red-700 transition flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 舍弃
                    </button>
                    
                    <button
                      onClick={() => handleCopy(t.content)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      <Clipboard className="w-3.5 h-3.5" /> 复制推荐策划案
                    </button>
                  </div>
                </div>
              ))}

              {topics.length === 0 && (
                <div className="col-span-2 text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  当前尚未沉淀选题资产。您可在【任务流水线】启动一个 [选题官] SOP 方案计划，让 AI 深入爆破当前赛道。
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESEARCH MATERIAL KNOWLEDGE PACKS */}
          {tab === "materials" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="asset-materials-list">
              {factMaterials.map((m) => (
                <div key={m.material_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md font-bold text-[10px] border border-sky-100">
                        {m.material_type === "case" ? "🔬 行研案例库" : "💡 逻辑论点包"}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        同步日期: {new Date(m.create_time).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {m.title}
                    </h4>

                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-xs leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">
                      {m.content}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => deleteMaterial(m.material_id)}
                      className="text-slate-400 hover:text-red-500 transition flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 移除
                    </button>
                    
                    <button
                      onClick={() => handleCopy(m.content)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      <Clipboard className="w-3.5 h-3.5" /> 复制到写作母本
                    </button>
                  </div>
                </div>
              ))}

              {factMaterials.length === 0 && (
                <div className="col-span-2 text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <FolderLock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  当前未曾存入原始科研素材。可以点击右上角“存入原始行业素材”，或运行[AI研究员]SOP。
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WRITTEN COPIES CREATIVES & SIMULATED CHANNELS */}
          {tab === "creatives" && (
            <div className="space-y-4" id="asset-creatives-list">
              {creatives.map((c) => {
                const isPublished = c.publish_status === "published";
                return (
                  <div key={c.content_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left 2 col: content editor/preview */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                            {c.platform_type === "xiaohongshu" ? "📱 小红书笔记风格" : "📜 公众号深度长文"}
                          </span>

                          {isPublished ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded flex items-center gap-0.5">
                              ✓ 分销投射成功
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                              草稿未发布
                            </span>
                          )}
                        </div>

                        <span className="text-slate-400 font-mono text-[10px]">
                          写就时间: {new Date(c.create_time).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {c.title}
                      </h3>

                      <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-xl font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto">
                        {c.content_text}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="text-slate-500 hover:text-indigo-600 font-medium transition flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> 批改草稿
                          </button>
                          <button
                            onClick={() => handleDeleteContent(c.content_id)}
                            className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                          >
                            删除此稿
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(c.content_text)}
                            className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200/80 rounded hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 text-xs"
                          >
                            <Clipboard className="w-3.5 h-3.5" /> 复制全文
                          </button>

                          {!isPublished && (
                            <button
                              onClick={() => handleSimulatePublish(c.content_id)}
                              className="px-3 py-1 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition cursor-pointer text-xs"
                            >
                              一键多平台发布
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right col: simulated analytics metrics */}
                    <div className="md:col-span-1 bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-4 self-stretch flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          多渠道发布及宣发流量池数据
                        </div>

                        {isPublished ? (
                          <div className="space-y-4 pt-1">
                            {/* Live metrics */}
                            <div className="grid grid-cols-2 gap-3 text-xs" id="simulated-metrics-grid">
                              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                                <span className="text-slate-400 font-medium block">浏览曝光度</span>
                                <span className="text-base font-extrabold text-slate-900 mt-0.5 block flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  {c.view_data?.views || 105}
                                </span>
                              </div>
                              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                                <span className="text-slate-400 font-medium block">喜爱/赞击数</span>
                                <span className="text-base font-extrabold text-slate-900 mt-0.5 block flex items-center gap-1">
                                  <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
                                  {c.view_data?.likes || 12}
                                </span>
                              </div>
                              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                                <span className="text-slate-400 font-medium block">保存收藏包</span>
                                <span className="text-base font-extrabold text-slate-900 mt-0.5 block flex items-center gap-1">
                                  <Bookmark className="w-3.5 h-3.5 text-indigo-400 fill-current" />
                                  {c.view_data?.collects || 10}
                                </span>
                              </div>
                              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                                <span className="text-slate-400 font-medium block">社群转发度</span>
                                <span className="text-base font-extrabold text-slate-900 mt-0.5 block flex items-center gap-1">
                                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                                  {c.view_data?.shares || 3}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-600 block bg-emerald-50 text-center py-1 rounded">
                              ✓ 模拟渠道数据实时回传稳定。
                            </span>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-400 italic">
                            本草稿还未向多端分销。数据信道目前关闭。点击左侧【发布】解锁大联盟流量反馈！
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] text-indigo-700 leading-relaxed">
                        🤖 <span className="font-semibold">一次创作·多渠道裂变</span>：由[内容官]适配的宣发，格式满足公众号完读性或小红书标签规则。
                      </div>
                    </div>

                  </div>
                );
              })}

              {creatives.length === 0 && (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  当前尚未有已就位发表的文章文案草稿。
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* DIALOG 1: EDITOR MODAL FOR CREATIVES */}
      {editingCreative && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">批改宣发草稿方案</h4>
              <button onClick={() => setEditingCreative(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">大案标题 *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  自媒体调性形式适配类型 *
                </label>
                <select
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value as PlatformType)}
                  className="w-full text-xs border border-slate-300 rounded p-2 focus:outline-none"
                >
                  <option value={PlatformType.WECHAT}>微信公众号（长篇，起承转合论点）</option>
                  <option value={PlatformType.XIAOHONGSHU}>小红书笔记（含 Emoji 排版标签）</option>
                  <option value={PlatformType.VIDEO}>短视频急切口播稿（前3秒黄金钩子）</option>
                  <option value={PlatformType.MOMENTS}>微信朋友圈（深刻有温度走心文）</option>
                  <option value={PlatformType.COMMUNITY}>引流社群话题语（高反思引导互动）</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">正文编辑 *</label>
                <textarea
                  rows={10}
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full font-mono text-xs border border-slate-300 rounded-lg p-3 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCreative(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> 保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: MATERLAL CREATION MODAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">存入原始行研素材知识包</h4>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">干货标题 *</label>
                <input
                  type="text"
                  required
                  placeholder="如：关于英语单词速记的理论依据"
                  value={newMatTitle}
                  onChange={(e) => setNewMatTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">素材分门别类 *</label>
                <select
                  value={newMatType}
                  onChange={(e) => setNewMatType(e.target.value as MaterialType)}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none"
                >
                  <option value={MaterialType.VIEWPOINT}>核心逻辑/论点主张</option>
                  <option value={MaterialType.CASE}>案例解析/事实引证</option>
                  <option value={MaterialType.GOLD_SENTENCE}>精妙金句/呼唤对策</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">正文内容 *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="在此写入、黏贴论文选段、行业采访或对标金句段落。"
                  value={newMatContent}
                  onChange={(e) => setNewMatContent(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow rounded-lg transition cursor-pointer"
                >
                  归档入素材主脑包
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
