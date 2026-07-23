"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import readingData from "../data/reading.json";
import type {
  MarkId,
  ReadingDocument,
  ReadingItem,
} from "../data/types";

const reading = readingData as ReadingDocument;

const marks: Array<{
  id: MarkId;
  symbol: string;
  label: string;
  short: string;
}> = [
  { id: "struck", symbol: "✦", label: "被击中", short: "击中" },
  { id: "resonate", symbol: "●", label: "认同", short: "认同" },
  { id: "partial", symbol: "◐", label: "部分认同", short: "部分" },
  { id: "hold", symbol: "○", label: "保留判断", short: "保留" },
  { id: "challenge", symbol: "×", label: "不同意", short: "反对" },
];

type MarkState = Record<string, MarkId | undefined>;
type NoteState = Record<string, string>;
type Filter = "all" | "unmarked" | MarkId;

const storageKey = `reading-trace:${reading.id}`;
const noteStorageKey = `${storageKey}:notes`;

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function notePlaceholder(mark?: MarkId) {
  if (mark === "partial") return "哪一部分你还不能完全接受？";
  if (mark === "hold") return "你在等待什么证据或经验？";
  if (mark === "challenge") return "问题出在前提、推理，还是经验？";
  return "这句话与你的什么经验发生了连接？";
}

function roleLabel(role: ReadingItem["role"]) {
  return reading.roleLabels[role];
}

export default function Home() {
  const flatItems = useMemo(
    () => reading.groups.flatMap((group) => group.items),
    [],
  );
  const [state, setState] = useState<MarkState>({});
  const [notes, setNotes] = useState<NoteState>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(readStored<MarkState>(storageKey, {}));
      setNotes(readStored<NoteState>(noteStorageKey, {}));
      hydrated.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(noteStorageKey, JSON.stringify(notes));
  }, [notes]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(marks.map((mark) => [mark.id, 0])) as Record<
      MarkId,
      number
    >;
    flatItems.forEach((item) => {
      const mark = state[item.id];
      if (mark) result[mark] += 1;
    });
    return result;
  }, [flatItems, state]);

  const done = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const progress = flatItems.length ? (done / flatItems.length) * 100 : 0;

  const visibleIds = useMemo(
    () =>
      flatItems
        .filter((item) => {
          if (filter === "all") return true;
          if (filter === "unmarked") return !state[item.id];
          return state[item.id] === filter;
        })
        .map((item) => item.id),
    [filter, flatItems, state],
  );

  function chooseMark(itemId: string, mark: MarkId) {
    setFocusedId(itemId);
    setState((current) => {
      const nextMark = current[itemId] === mark ? undefined : mark;
      const next = { ...current, [itemId]: nextMark };
      if (!nextMark) delete next[itemId];
      if (nextMark && ["partial", "hold", "challenge"].includes(nextMark)) {
        setEditingId(itemId);
      } else {
        setEditingId(null);
      }
      return next;
    });
  }

  function moveFocus(direction: 1 | -1) {
    if (!visibleIds.length) return;
    const currentIndex = focusedId ? visibleIds.indexOf(focusedId) : -1;
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + visibleIds.length) % visibleIds.length;
    const nextId = visibleIds[nextIndex];
    setFocusedId(nextId);
    document
      .getElementById(`trace-${nextId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(1);
      } else if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(-1);
      } else if (/^[1-5]$/.test(event.key)) {
        const itemId = focusedId ?? visibleIds[0];
        if (!itemId) return;
        event.preventDefault();
        chooseMark(itemId, marks[Number(event.key) - 1].id);
      } else if (event.key === "Escape") {
        setEditingId(null);
        setDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function exportTrace() {
    const lines = [
      `# ${reading.title} · 阅读轨迹`,
      "",
      `来源：${reading.source.label}`,
      `完成：${done}/${flatItems.length}`,
      "",
    ];
    reading.groups.forEach((group) => {
      lines.push(`## ${group.title}`, "");
      group.items.forEach((item) => {
        const mark = marks.find((candidate) => candidate.id === state[item.id]);
        if (!mark) return;
        lines.push(
          `### ${item.id} · ${mark.label}`,
          "",
          `> ${item.quote}`,
          "",
        );
        if (notes[item.id]) lines.push(notes[item.id], "");
      });
    });
    const text = lines.join("\n");
    await navigator.clipboard.writeText(text);
    setToast("阅读轨迹已复制");
    window.setTimeout(() => setToast(""), 1800);
  }

  function resetTrace() {
    setState({});
    setNotes({});
    setFilter("all");
    setFocusedId(null);
    setEditingId(null);
  }

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="paper-grain" />

      <button
        className={`menu-button ${drawerOpen ? "is-open" : ""}`}
        aria-label={drawerOpen ? "关闭目录" : "打开目录"}
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`drawer-backdrop ${drawerOpen ? "is-open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`drawer ${drawerOpen ? "is-open" : ""}`}>
        <p className="drawer-brand">Reading Trace</p>
        <p className="drawer-caption">把理解留下来</p>
        <nav aria-label="章节目录">
          {reading.groups.map((group) => {
            const groupDone = group.items.filter((item) => state[item.id]).length;
            return (
              <a
                href={`#group-${group.id}`}
                key={group.id}
                onClick={() => setDrawerOpen(false)}
              >
                <span className="drawer-index">{group.index}</span>
                <span>{group.shortTitle}</span>
                <small>
                  {groupDone}/{group.items.length}
                </small>
              </a>
            );
          })}
        </nav>
        <div className="drawer-foot">
          <span>1—5 标注</span>
          <span>J / K 移动</span>
          <span>Esc 收起</span>
        </div>
      </aside>

      <main>
        <section className="progress-panel" aria-label="阅读进度">
          <div className="progress-row">
            <div className="progress-number">
              <strong>{done}</strong>
              <span>/ {flatItems.length}</span>
            </div>
            <div className="stat-row">
              {marks.map((mark) => (
                <button
                  key={mark.id}
                  className={`mini-stat mark-${mark.id}`}
                  title={mark.label}
                  onClick={() => setFilter(mark.id)}
                >
                  <i />
                  {counts[mark.id]}
                </button>
              ))}
            </div>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>

        <header className="hero">
          <p className="eyebrow">阅迹 · Reading Trace / Public domain demo</p>
          <h1>
            Where I Lived,
            <br />
            <em>and What I Lived For</em>
          </h1>
          <p className="hero-cn">《瓦尔登湖》第二章 · 我生活的地方；我为何生活</p>
          <div className="source-meta">
            <span>Henry David Thoreau</span>
            <span>1854</span>
            <a href={reading.source.url} target="_blank" rel="noreferrer">
              {reading.source.label} ↗
            </a>
          </div>
        </header>

        <section className="thesis">
          <p>{reading.summary}</p>
          <strong>{reading.thesis}</strong>
          <small>{reading.invitation}</small>
        </section>

        <div className="filters" aria-label="筛选阅读标注">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            全部
          </button>
          <button
            className={filter === "unmarked" ? "active" : ""}
            onClick={() => setFilter("unmarked")}
          >
            未标
          </button>
          {marks.map((mark) => (
            <button
              key={mark.id}
              className={`${filter === mark.id ? "active" : ""} mark-filter-${mark.id}`}
              onClick={() => setFilter(mark.id)}
            >
              {mark.symbol} {mark.short}
            </button>
          ))}
        </div>

        {done === 0 && (
          <p className="first-hint">
            不急着判断作者。先标记：哪句话真的碰到了你？
          </p>
        )}

        <div className="reading-groups">
          {reading.groups.map((group) => {
            const items = group.items.filter((item) => visibleIds.includes(item.id));
            if (!items.length) return null;
            return (
              <section
                className="reading-group"
                id={`group-${group.id}`}
                key={group.id}
              >
                <div className="group-heading">
                  <span>{group.index}</span>
                  <div>
                    <p>{group.kicker}</p>
                    <h2>{group.title}</h2>
                    <small>{group.description}</small>
                  </div>
                </div>

                <div className="cards">
                  {items.map((item) => {
                    const mark = state[item.id];
                    const isEditing = editingId === item.id;
                    return (
                      <article
                        className={`trace-card ${
                          mark ? `has-mark mark-${mark}` : ""
                        } ${focusedId === item.id ? "is-focused" : ""}`}
                        id={`trace-${item.id}`}
                        key={item.id}
                        tabIndex={0}
                        onFocus={() => setFocusedId(item.id)}
                        onClick={() => setFocusedId(item.id)}
                      >
                        <div className="card-wash" />
                        <div className="card-body">
                          <div className="card-meta">
                            <span className={`role role-${item.role}`}>
                              {roleLabel(item.role)}
                            </span>
                            <span>{item.id}</span>
                          </div>
                          <blockquote lang="en">{item.quote}</blockquote>
                          <p className="context">{item.context}</p>
                          <p className="prompt">{item.prompt}</p>
                          <div className="mark-controls" aria-label={`标注 ${item.id}`}>
                            {marks.map((candidate) => (
                              <button
                                key={candidate.id}
                                className={`mark-button mark-${candidate.id} ${
                                  mark === candidate.id ? "selected" : ""
                                }`}
                                aria-label={candidate.label}
                                aria-pressed={mark === candidate.id}
                                title={`${candidate.label} · ${marks.indexOf(candidate) + 1}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  chooseMark(item.id, candidate.id);
                                }}
                              >
                                {candidate.symbol}
                              </button>
                            ))}
                          </div>
                          {(isEditing || notes[item.id]) && (
                            <div className={`note-area ${isEditing ? "is-open" : ""}`}>
                              {isEditing ? (
                                <textarea
                                  autoFocus
                                  value={notes[item.id] ?? ""}
                                  placeholder={notePlaceholder(mark)}
                                  onChange={(event) =>
                                    setNotes((current) => ({
                                      ...current,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                  onBlur={() => setEditingId(null)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                      event.preventDefault();
                                      setEditingId(null);
                                    }
                                  }}
                                />
                              ) : (
                                <button
                                  className="note-preview"
                                  onClick={() => setEditingId(item.id)}
                                >
                                  ↳ {notes[item.id]}
                                </button>
                              )}
                            </div>
                          )}
                          {mark && !isEditing && !notes[item.id] && (
                            <button
                              className="add-note"
                              onClick={() => setEditingId(item.id)}
                            >
                              + 写下为什么
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <section className="closing-note">
          <p>一遍读完，不是为了同意作者。</p>
          <h2>是为了知道，自己在哪里停了一下。</h2>
          <div>
            <button className="primary-action" onClick={exportTrace} disabled={!done}>
              导出阅读轨迹
            </button>
            <button className="quiet-action" onClick={resetTrace}>
              清空重读
            </button>
          </div>
        </section>

        <footer>
          <span>阅迹 Reading Trace · v0.1</span>
          <span>界面、数据结构与渲染流程为独立实现</span>
        </footer>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
