/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  BrainCircuit,
  Maximize2,
  Trash2,
  Clipboard,
  CheckCircle,
  HelpCircle,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { getReviewReports, generateReviewReport, deleteReviewReport, getStats } from "../api";
import { ReviewReport } from "../types";

// Static dummy metrics representing the mock multi-channel traffic funnel for display
const FUNNEL_DATA = [
  { name: "1. 渠道流量曝光", value: 12000, percentage: "100%", fill: "#6366f1" },
  { name: "2. 卡片选题点击", value: 4800, percentage: "40%", fill: "#818cf8" },
  { name: "3. 私域咨询登记", value: 1800, percentage: "15%", fill: "#a5b4fc" },
  { name: "4. 高热意向跟进", value: 600, percentage: "5%", fill: "#c7d2fe" },
  { name: "5. 最终裂变付费", value: 120, percentage: "1%", fill: "#e0e7ff" }
];

const WEEKLY_LEADS_DATA = [
  { day: "周一", "自媒体引流": 45, "私域转化": 8 },
  { day: "周二", "自媒体引流": 52, "私域转化": 10 },
  { day: "周三", "自媒体引流": 49, "私域转化": 12 },
  { day: "周四", "自媒体引流": 68, "私域转化": 15 },
  { day: "周五", "自媒体引流": 85, "私域转化": 21 },
  { day: "周六", "自媒体引流": 110, "私域转化": 32 },
  { day: "周日", "自媒体引流": 95, "私域转化": 25 }
];

export default function AnalyticsSection() {
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const repoList = await getReviewReports();
      setReports(repoList);
      if (repoList.length > 0) {
        setSelectedReport(repoList[0]);
      }
    } catch (err: any) {
      setError("同步商业复盘库档案失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateReport = async (reviewType: string) => {
    try {
      setGenerating(true);
      setError("");
      const created = await generateReviewReport(reviewType);
      await loadData();
      setSelectedReport(created);
    } catch (err: any) {
      setError("启动核心 AI 诊断主脑失败: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("核实废除该份复盘诊断建议吗？")) return;
    try {
      setError("");
      await deleteReviewReport(id);
      setSelectedReport(null);
      await loadData();
    } catch (err: any) {
      setError("删除历史复盘失败: " + err.message);
    }
  };

  return (
    <div className="space-y-6" id="analytics-review-view">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            四域流量转化与大模型复盘 📊
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            监测营销获客、私域沉淀全过程，用数据说话。一键诱导 AI 复盘，反哺修改 SOP 与 Prompt 指令。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={generating}
            onClick={() => handleGenerateReport("funnel_and_marketing")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow-sm transition cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 shrink-0" />
            {generating ? "AI 精研转化漏斗中..." : "启动 AI 多维全自动复盘"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Recharts funnel and curves */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-charts-grid">
        
        {/* Weekly Curve Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold font-sans">
            <span className="text-slate-800 text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              自媒体流量引流及私域咨询登记走势
            </span>
            <span className="text-slate-400">时间: 本周 (24H回传数据)</span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_LEADS_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line type="monotone" dataKey="自媒体引流" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="私域转化" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel visual indicators */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="text-xs font-semibold font-sans text-slate-800 text-sm flex items-center gap-1">
            <Layers className="w-4 h-4 text-indigo-500" />
            四域营销转化漏斗 (Funnel Percent)
          </div>

          {/* Funnel custom display bars */}
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {FUNNEL_DATA.map((fl) => (
              <div key={fl.name} className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-600 text-[11px]">
                  <span className="font-semibold">{fl.name}</span>
                  <span className="font-mono text-slate-400 font-bold">{fl.value}人 ({fl.percentage})</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: fl.percentage, backgroundColor: fl.fill }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded border border-slate-100">
            * 转化策略关键指标：通过选题优化点击(点到2)、对话高密提问促进转私域(3到4)。
          </div>
        </div>

      </div>

      {/* AI REVIEW HISTORY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Left Side: history list of reports */}
        <div className="lg:col-span-1 space-y-3" id="reports-left-list">
          <span className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider block">
            大模型智能复盘诊断库 ({reports.length})
          </span>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {reports.map((rp) => {
              const isActive = rp.review_id === selectedReport?.review_id;
              const title = rp.review_type === "daily" 
                ? "核心日度全自动运营复盘" 
                : rp.review_type === "weekly" 
                ? "核心周度多端深度转化复盘" 
                : "核心月度战略全景运营复盘";
              return (
                <div
                  key={rp.review_id}
                  onClick={() => setSelectedReport(rp)}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer relative ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50/10 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800 line-clamp-1 pr-6 flex items-center gap-1.5">
                    🧠 {title}
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(rp.create_time).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-indigo-600">阅读反哺建议</span>
                  </div>
                </div>
              );
            })}

            {reports.length === 0 && (
              <div className="p-8 text-center text-slate-400 border border-slate-200 bg-white rounded-xl text-xs">
                尚未留存复盘诊断包。请点击右上角按钮由 AI 进行漏斗深度复盘。
              </div>
            )}
          </div>
        </div>

        {/* Right Side: report content markdown */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5" id="report-detail-panel">
              <div className="flex items-start justify-between flex-wrap gap-2 pb-4 border-b border-slate-100 shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    🎯 {selectedReport.review_type === "daily" ? "核心日度全自动运营复盘" : selectedReport.review_type === "weekly" ? "核心周度多端深度转化复盘" : "核心月度战略全景运营复盘"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    诊断产出时间: {new Date(selectedReport.create_time).toLocaleString()} • 执行官: AI核心复盘官
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteReport(selectedReport.review_id)}
                  className="px-2.5 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded transition font-semibold cursor-pointer"
                >
                  丢弃该诊断存档
                </button>
              </div>

              {/* REPORT MD EMBED */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 max-h-[380px] overflow-y-auto shadow-inner leading-relaxed text-xs text-slate-700">
                
                {/* Visual funnels report blocks */}
                <div className="space-y-3 font-sans">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1 text-sm border-b pb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    多渠道转化深度行研建议说明
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed bg-white border border-slate-100 p-2.5 rounded text-indigo-700">
                    📊 指标总揽: {selectedReport.data_summary}
                  </p>
                  <div className="whitespace-pre-line leading-relaxed font-mono text-[11px]">
                    {selectedReport.optimize_suggest}
                  </div>
                </div>

                {/* Counter feedback */}
                {selectedReport.problem_analysis && (
                  <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2">
                    <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                      <BrainCircuit className="w-4 h-4 text-indigo-600" />
                      SOP 及 Prompt 反哺修正指引 (AI Instruction Refractor)
                    </div>
                    <p className="text-indigo-800 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                      {selectedReport.problem_analysis}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-50/50 p-2.5 rounded border border-slate-100">
                💡 <span className="font-semibold">如何反哺</span>：以上建议主要暴露了指令中的细小死角。主脑（您）可以直接前往【AI员工团队】或【SOP流程引擎】双向打磨微调您的 Prompt 工作流以实现质变级跃迁。
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border border-slate-200 bg-white rounded-xl">
              请从左侧选择一份商业复盘报告，载入大模型多维诊断建议与流程反哺对策。
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
