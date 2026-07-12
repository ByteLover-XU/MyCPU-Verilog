"use client";

import { useEffect, useMemo, useState } from "react";
import hdlbitsTitles from "./hdlbits-titles.json";

type Phase = {
  id: number;
  weeks: string;
  title: string;
  subtitle: string;
  goal: string;
  topics: string[];
  output: string;
};

const phases: Phase[] = [
  {
    id: 1,
    weeks: "第 1–2 周",
    title: "Verilog 语法起步",
    subtitle: "Getting Started · Verilog Language",
    goal: "熟悉 HDLBits 提交流程，能读懂模块端口并写出基础组合逻辑。",
    topics: ["Getting Started", "Basics", "Vectors", "简单门电路"],
    output: "能独立完成 wire、assign、向量和基础逻辑题",
  },
  {
    id: 2,
    weeks: "第 3–5 周",
    title: "组合逻辑与模块化",
    subtitle: "Modules · Procedures · Combinational Logic",
    goal: "掌握层次化连接、always 组合块、case 与常见组合逻辑模块。",
    topics: ["Modules: Hierarchy", "Procedures", "Multiplexers", "Arithmetic Circuits", "K-map"],
    output: "完成 MUX、加法器、译码思路，并避免组合逻辑锁存器",
  },
  {
    id: 3,
    weeks: "第 6–8 周",
    title: "时序逻辑基础",
    subtitle: "Sequential Logic",
    goal: "理解时钟、复位、非阻塞赋值，建立真正的时序电路思维。",
    topics: ["Latches and Flip-Flops", "Counters", "Shift Registers", "边沿检测"],
    output: "能独立设计寄存器、计数器和移位寄存器",
  },
  {
    id: 4,
    weeks: "第 9–10 周",
    title: "状态机与综合电路",
    subtitle: "Finite State Machines · Larger Circuits",
    goal: "从状态转移、输出逻辑和数据通路三个角度理解控制器。",
    topics: ["Moore / Mealy FSM", "状态编码", "串行接收", "Building Larger Circuits"],
    output: "完成多个 FSM，并能解释状态、转移条件与输出",
  },
  {
    id: 5,
    weeks: "第 11–12 周",
    title: "验证能力与 CPU 准备",
    subtitle: "Reading Simulations · Writing Testbenches",
    goal: "通过波形和 testbench 验证设计，为后续 16 位简易 CPU 组件开发做准备。",
    topics: ["Finding bugs", "Reading waveforms", "Writing Testbenches", "综合复盘"],
    output: "能根据波形定位错误，并为小模块编写 testbench",
  },
];

const STORAGE_KEY = "mycpu-hdlbits-plan-v1";

type HdlbitsTitle = {
  title: string;
  url: string;
  category: string;
  section: string;
  subsection: string;
};

function belongsToPhase(problem: HdlbitsTitle, phaseId: number) {
  if (phaseId === 1) {
    return problem.category === "Getting Started" ||
      (problem.category === "Verilog Language" && ["Basics", "Vectors"].includes(problem.section));
  }
  if (phaseId === 2) {
    return (problem.category === "Verilog Language" && !["Basics", "Vectors"].includes(problem.section)) ||
      (problem.category === "Circuits" && problem.section === "Combinational Logic");
  }
  if (phaseId === 3) {
    return problem.category === "Circuits" && problem.section === "Sequential Logic" && problem.subsection !== "Finite State Machines";
  }
  if (phaseId === 4) {
    return problem.category === "Circuits" &&
      (problem.subsection === "Finite State Machines" || problem.section === "Building Larger Circuits");
  }
  return problem.category.startsWith("Verification:");
}

export function StudyPlanner() {
  const [selected, setSelected] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { completed?: number[]; note?: string };
      setCompleted(data.completed ?? []);
      setNote(data.note ?? "");
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const active = phases.find((phase) => phase.id === selected) ?? phases[0];
  const percent = Math.round((completed.length / phases.length) * 100);
  const currentPhase = useMemo(
    () => phases.find((phase) => !completed.includes(phase.id)) ?? phases[phases.length - 1],
    [completed],
  );
  const phaseTitles = useMemo(() => {
    const search = titleSearch.trim().toLowerCase();
    return (hdlbitsTitles as HdlbitsTitle[])
      .filter((problem) => belongsToPhase(problem, active.id))
      .filter((problem) => !search || problem.title.toLowerCase().includes(search));
  }, [active.id, titleSearch]);
  const phaseTitleCount = useMemo(
    () => (hdlbitsTitles as HdlbitsTitle[]).filter((problem) => belongsToPhase(problem, active.id)).length,
    [active.id],
  );

  function togglePhase(id: number) {
    setCompleted((items) => {
      const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: next, note }));
      return next;
    });
  }

  function saveNote() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed, note }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <main className="planner-shell">
      <header className="topbar">
        <div className="brand">MyCPU <span>· HDLBits 学习计划</span></div>
        <div className="top-status"><i /> 正在学习 · Phase {currentPhase.id}</div>
        <a className="goal-link" href="https://github.com/ByteLover-XU/MyCPU-Verilog" target="_blank" rel="noreferrer">
          最终目标 · 16 位简易 CPU
        </a>
      </header>

      <section className="dashboard-grid">
        <aside className="phase-rail" aria-label="学习阶段">
          <p className="eyebrow">12 周学习路线</p>
          <nav>
            {phases.map((phase) => {
              const done = completed.includes(phase.id);
              return (
                <button
                  className={`rail-item ${selected === phase.id ? "active" : ""} ${done ? "done" : ""}`}
                  key={phase.id}
                  onClick={() => setSelected(phase.id)}
                  aria-pressed={selected === phase.id}
                >
                  <span className="phase-number">{done ? "✓" : phase.id}</span>
                  <span><strong>{phase.title}</strong><small>{phase.weeks}</small></span>
                </button>
              );
            })}
          </nav>
          <div className="overall-progress">
            <div><span>总体进度</span><strong>{percent}%</strong></div>
            <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
            <small>{completed.length} / {phases.length} 个阶段完成</small>
          </div>
        </aside>

        <section className="main-workspace">
          <div className="phase-heading">
            <div>
              <p className="eyebrow">{active.weeks} · Phase {active.id}</p>
              <h1>{active.title}</h1>
              <p className="subtitle">{active.subtitle}</p>
            </div>
            <label className="complete-control">
              <input type="checkbox" checked={completed.includes(active.id)} onChange={() => togglePhase(active.id)} />
              <span>{completed.includes(active.id) ? "阶段已完成" : "标记阶段完成"}</span>
            </label>
          </div>

          <div className="goal-panel">
            <span className="panel-index">学习目标</span>
            <p>{active.goal}</p>
          </div>

          <section className="topics-section">
            <div className="section-title"><span>HDLBits 练习专题</span><small>只列专题，不复制题目内容</small></div>
            <div className="topic-list">
              {active.topics.map((topic, index) => (
                <div className="topic-row" key={topic}>
                  <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{topic}</strong>
                  <span className="topic-state">按顺序练习</span>
                </div>
              ))}
            </div>
          </section>

          <details className="title-browser">
            <summary>
              <span>查看本阶段题目标题</span>
              <strong>{phaseTitleCount} 题</strong>
            </summary>
            <div className="title-browser-body">
              <label className="title-search">
                <span>搜索标题</span>
                <input
                  type="search"
                  value={titleSearch}
                  onChange={(event) => setTitleSearch(event.target.value)}
                  placeholder="例如：adder、FSM、counter"
                />
              </label>
              <div className="title-list" aria-live="polite">
                {phaseTitles.map((problem, index) => (
                  <a href={problem.url} target="_blank" rel="noreferrer" key={problem.url}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{problem.title}</strong>
                    <small>{problem.subsection || problem.section}</small>
                  </a>
                ))}
                {phaseTitles.length === 0 && <p className="empty-titles">没有匹配的题目标题。</p>}
              </div>
              <p className="titles-note">仅同步 HDLBits 官方题目标题与链接，不包含题目正文、提示或答案。</p>
            </div>
          </details>

          <div className="workflow">
            {[
              ["1", "阅读题目", "先判断组合还是时序"],
              ["2", "独立作答", "先写思路再写 Verilog"],
              ["3", "提交验证", "根据报错或波形排查"],
              ["4", "记录错因", "沉淀语法与硬件易错点"],
            ].map(([num, title, text]) => (
              <div key={num}><b>{num}</b><span><strong>{title}</strong><small>{text}</small></span></div>
            ))}
          </div>

          <div className="phase-output">
            <span>本阶段完成标准</span>
            <strong>{active.output}</strong>
          </div>
        </section>

        <aside className="right-panel">
          <section className="today-card">
            <p className="eyebrow">当前建议</p>
            <h2>从 Phase {currentPhase.id} 开始</h2>
            <p>{currentPhase.title}</p>
            <div className="catalog-count"><strong>178</strong><span>个官方题目标题<br />已按阶段整理</span></div>
            <a href="https://hdlbits.01xz.net/wiki/Problem_sets" target="_blank" rel="noreferrer">打开 HDLBits 题目目录</a>
          </section>

          <section className="note-card">
            <div className="section-title"><span>学习记录</span><small>保存在本机浏览器</small></div>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录今天练了哪些专题、遇到什么错误、理解了什么……" maxLength={500} />
            <div className="note-footer"><span>{note.length} / 500</span><button onClick={saveNote}>{saved ? "已保存" : "保存记录"}</button></div>
          </section>

          <section className="principle-card">
            <p className="eyebrow">项目原则</p>
            <blockquote>不要为了刷题而背答案。每一道题都要能解释它描述了什么硬件。</blockquote>
          </section>
        </aside>
      </section>
    </main>
  );
}
