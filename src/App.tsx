/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Compass,
  Users,
  Play,
  BookOpen,
  MessageSquare,
  BarChart2,
  Settings2,
  LayoutDashboard,
  BrainCircuit,
  Terminal,
  Activity,
  Heart
} from "lucide-react";

// Import all sub-views/components
import Dashboard from "./components/Dashboard";
import StaffSection from "./components/StaffSection";
import SopSection from "./components/SopSection";
import TaskSection from "./components/TaskSection";
import AssetsSection from "./components/AssetsSection";
import CustomerSection from "./components/CustomerSection";
import AnalyticsSection from "./components/AnalyticsSection";
import SettingsSection from "./components/SettingsSection";

type TabType = "dashboard" | "staff" | "sop" | "tasks" | "assets" | "customers" | "analytics" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Navigates between views from child pages
  const handleNavigate = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  const navItems = [
    { id: "dashboard", label: "🪐 首页工作台", icon: LayoutDashboard },
    { id: "staff", label: "🧑‍管 AI 员工团队", icon: Users },
    { id: "sop", label: "⚙️ SOP 流程引擎", icon: Compass },
    { id: "tasks", label: "🛸 任务流水线", icon: Play },
    { id: "assets", label: "📂 AI 智能知识库", icon: BookOpen },
    { id: "customers", label: "🛰️ 私域咨询转化", icon: MessageSquare },
    { id: "analytics", label: "📊 二极转化复盘", icon: BarChart2 },
    { id: "settings", label: "🔧 系统参数日志", icon: Settings2 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" id="applet-viewport">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0" id="sidebar-panel">
        {/* Brand Header Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider uppercase">
              AI 员工团队工作台
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">
              One-Man Startup Autopilot OS
            </p>
          </div>
        </div>

        {/* Navigation lists */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" id="sidebar-nav-container">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full text-left text-xs font-semibold p-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition cursor-pointer select-none ${
                  isSelected
                    ? "bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer branding */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 text-[10px] text-slate-500 flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 leading-none"></span>
            <span className="font-semibold text-slate-400">大中脑连接已畅通</span>
          </div>
          <p>
            让 AI 承担重复工作。您只管决策。
          </p>
          <p className="text-[9px] mt-1 text-slate-600">
            Powered by Google GenAI
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0" id="main-frame">
        {/* Top Header navbar bar */}
        <header className="bg-white border-b border-slate-200/60 p-4 px-6 flex items-center justify-between gap-4 shrink-0" id="top-navbar">
          <div className="hidden sm:flex items-center gap-2.5">
            <span className="text-xs bg-slate-100 hover:bg-slate-200/80 transition px-2.5 py-1 rounded text-slate-500 font-mono">
              主控终端 Port: 3000
            </span>
            <span className="text-xs bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded text-indigo-600 font-mono leading-none">
              ♊ Mode: Gemini-3.5-flash
            </span>
          </div>

          {/* Quick core state status tags */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>协同矩阵已就绪</span>
            </div>
            
            <a
              href="https://ai.studio/build"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] bg-slate-900 text-white rounded px-2.5 py-1 hover:bg-slate-800 font-sans font-bold"
            >
              一键分发宣发
            </a>
          </div>
        </header>

        {/* Dynamic active screen container */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto" id="screen-container">
          {activeTab === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
          {activeTab === "staff" && <StaffSection />}
          {activeTab === "sop" && <SopSection />}
          {activeTab === "tasks" && <TaskSection />}
          {activeTab === "assets" && <AssetsSection />}
          {activeTab === "customers" && <CustomerSection />}
          {activeTab === "analytics" && <AnalyticsSection />}
          {activeTab === "settings" && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}
