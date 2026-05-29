/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Settings2,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Database,
  Info,
  RotateCcw,
  AlertTriangle,
  Play,
  Heart
} from "lucide-react";
import { getSystemLogs, triggerSystemReset } from "../api";
import { SystemLog } from "../types";

export default function SettingsSection() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getSystemLogs();
      setLogs(result);
    } catch (err: any) {
      setError("读取终端后台日志流失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 10000); // refresh system logs every 10s
    return () => clearInterval(interval);
  }, []);

  const handleResetSystem = async () => {
    if (!window.confirm("🔴 警告：即将重置该系统到原厂洁净状态。这将会清空您自定义的 AI 岗位、起草的 SOP 图纸、执行中的任务线以及所有的成交访客和爆款文稿。此操作不可撤销，确认继续吗？")) {
      return;
    }

    try {
      setResetting(true);
      setError("");
      await triggerSystemReset();
      alert("🪐 系统总脑已顺利重置重组！默认五维智能岗位和官方模版 SOP 重新加载就位。");
      window.location.reload();
    } catch (err: any) {
      setError("重整总脑中枢失败: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-management-view">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600" />
            工作台系统设置与终端日志 ⚙️
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            监控主脑 API 密钥承载状态，监视全链路分布式大模型运算终端的流水，及数据库原厂备份救急。
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* API credentials status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-credentials-grid">
        
        {/* API Credentials */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            工作台主脑 AI 大模型承载状态
          </h3>

          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">大模型驱动引擎:</span>
              <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Google GenAI SDK (Gemini)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">服务侧密匙机制 (Security):</span>
              <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                process.env.GEMINI_API_KEY
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">首选处理大模型 (Model LLM):</span>
              <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                gemini-3.5-flash
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              * 注：为确保 API 密钥的安全，大模型密钥已由云平台隔离在 Express 服务端，浏览器中绝非明文加载。任何与 Gemini 的推理过程均发生于 Port 3000 云端沙箱。
            </p>
          </div>
        </div>

        {/* System Reset Utility */}
        <div className="bg-red-50/20 p-5 rounded-xl border border-red-200/50 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-red-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-red-600" />
              工作台数据恢复与出厂重置
            </h3>

            <p className="text-xs text-red-700 leading-relaxed font-sans mt-1">
              重置将回归洁净的预装默认配置，一键重新为您安装在岗 5 门标准 AI 职业人（包括选题官、内容官、研究员、客服雷达和复盘官）、官方认证 3 大经营 SOP 流模型。
            </p>
          </div>

          <div className="pt-2">
            <button
              disabled={resetting}
              onClick={handleResetSystem}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {resetting ? "重装大中脑中..." : "危险！一键原厂重置系统"}
            </button>
          </div>
        </div>

      </div>

      {/* CORE SERVICE LOGS TERMINAL */}
      <div className="bg-slate-900 rounded-xl border border-slate-950 p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-mono">
            <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
            主脑后端分布式多岗位运行监控（System Live Console logs）
          </h3>

          <button
            onClick={loadLogs}
            className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 py-1 px-2.5 rounded font-mono transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            手动刷屏
          </button>
        </div>

        {/* LOGS SCREEN */}
        <div className="p-4 bg-slate-950 rounded-lg font-mono text-[11px] text-emerald-400 space-y-2.5 max-h-[350px] overflow-y-auto leading-relaxed h-[350px]">
          {logs.map((lg, idx) => (
            <div key={idx} className="flex items-start gap-2 break-all">
              <span className="text-slate-500 font-bold shrink-0">{new Date(lg.timestamp).toLocaleString()}</span>
              <span className="text-cyan-400 shrink-0">[{lg.level?.toUpperCase() || "LOG"}]</span>
              <span className="text-blue-400 shrink-0">{lg.source || "System"}</span>
              <span className={`${lg.level === "error" ? "text-red-400" : lg.level === "warning" ? "text-amber-300" : "text-emerald-300"}`}>
                {lg.message}
              </span>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              当前暂无大脑运作日志被截获。
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
          ℹ️ 全链路事件流：展示了包括 Express 服务端启动、Gemini API 多次成功握手、db.json 读写操作和 SOP 判定触发时，虚拟岗位员工发起的动作。每隔 10s 全自动刷屏。
        </div>
      </div>

    </div>
  );
}
