import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Coffee,
  Heart,
  HelpCircle,
  Landmark,
  LogIn,
  LogOut,
  MessageCircle,
  Sparkles,
  Star,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import AudioManager from "./components/AudioManager";
import Portrait from "./components/Portrait";
import { PORTRAIT_MOODS, portraitMood } from "./lib/portraits.js";
import {
  CHAPTERS,
  ENDINGS,
  EVENTS,
  advance,
  answer,
  answerEvent,
  createRun,
  mergeRecords,
  prepare,
  recordRun,
  routes,
  validRun,
} from "./lib/game";
import {
  loadRun,
  migrateLegacyRun,
  readStorage,
  writeStorage,
} from "./lib/storage";
import { auth, provider, db } from "./lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const initialRun = loadRun();
const signed = (n) => `${n > 0 ? "+" : ""}${n}`;

function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <div>
          <span className="eyebrow">KOI NO GIJIROKU</span>
          <h2>{title}</h2>
        </div>
        <button
          autoFocus
          className="icon-button"
          aria-label="閉じる"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
      <button className="button secondary modal-close" onClick={onClose}>
        閉じる
      </button>
    </dialog>
  );
}

function Help() {
  return (
    <div className="help-content">
      <p>
        あなたは時を旅する補佐役。５章の会話と２回の突発イベントを通じて、彼との物語をつくります。１周約５分。
      </p>
      <div className="help-steps">
        <section>
          <b>01　会う前の準備</b>
          <p>
            本音を聞くと恋心＋8＆相性ヒント。世間の声を調べると世論＋8。どちらも行動力を１使います。休憩なら行動力が２回復。
          </p>
        </section>
        <section>
          <b>02　あなたの言葉で答える</b>
          <p>
            彼が喜ぶ言葉と、周囲の信頼につながる言葉は、ときに別。恋心と世論の変化を確かめて、自分の結末を目指しましょう。
          </p>
        </section>
        <section>
          <b>03　切り札を使う</b>
          <p>
            「想いを込める」は行動力２で、会話の恋心＋6・世論＋4を上乗せ。好感触が続くと恋心に連続ボーナス（最大＋3）。失敗しても途中でゲームオーバーにはなりません。
          </p>
        </section>
      </div>
      <h3>どの結末を目指す？</h3>
      <div className="ending-guide">
        {Object.entries(ENDINGS).map(([key, e]) => (
          <div key={key}>
            <span>{e.icon}</span>
            <div>
              <b>{e.label}</b>
              <small>
                {e.condition}
                {key === "love" ? "（TRUE ENDを優先）" : ""}
              </small>
            </div>
          </div>
        ))}
      </div>
      <p className="fine-print">
        進行は操作ごとにこのブラウザへ自動保存。タイトルに戻っても「つづきから」で再開できます。人物イラスト・会話・出来事・結末は創作です。選択肢の評価は人物との相性であり、史実や政策の正誤を示しません。
      </p>
    </div>
  );
}

function Meter({ label, value, icon: Icon, type, target }) {
  return (
    <div className={`meter ${type}`}>
      <div className="meter-label">
        <span>
          <Icon size={15} />
          {label}
        </span>
        <strong>
          {value}
          <small>/100</small>
        </strong>
      </div>
      <div
        className="meter-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${value}%` }} />
        <span style={{ left: `${target}%` }} />
      </div>
      <small className="meter-target">TRUE END 目標 {target}</small>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("title");
  const [run, setRun] = useState(initialRun);
  const [records, setRecords] = useState(() => {
    const saved = readStorage("pmRomanceRecordsV2", []);
    return mergeRecords(Array.isArray(saved) ? saved : []);
  });
  const [legacyNames, setLegacyNames] = useState(() => {
    const value = readStorage("pmRomanceRecords", []);
    return Array.isArray(value)
      ? value.filter((n) => typeof n === "string")
      : [];
  });
  const [muted, setMuted] = useState(
    () => readStorage("pmRomanceMuted", true) !== false,
  );
  const [modal, setModal] = useState(null);
  const [era, setEra] = useState("すべて");
  const [selected, setSelected] = useState(1);
  const [artPM, setArtPM] = useState(1);
  const [user, setUser] = useState(null);
  const [syncReady, setSyncReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("この端末に自動保存");
  const [notice, setNotice] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const runRef = useRef(run);
  const recordsRef = useRef(records);
  const saveFailed = useRef(false);
  runRef.current = run;
  recordsRef.current = records;
  const pm = routes.find((p) => p.id === run?.pmId);
  const selectedPM = routes.find((p) => p.id === selected);
  const galleryPM = routes.find((p) => p.id === artPM);
  const mood = portraitMood(run);
  const isPlaying = screen === "playing" && run && pm;
  const completed = new Set(records.map((r) => r.pmId));
  const collected = new Set(records.map((r) => `${r.pmId}:${r.ending}`));
  const trueCount = new Set(
    records.filter((r) => r.ending === "true").map((r) => r.pmId),
  ).size;
  const activeRun = run && run.phase !== "ended";

  useEffect(() => {
    const okay = writeStorage("pmRomanceRunV2", run);
    if (okay && run) writeStorage("pmSuspendedGame", null);
    if (!okay && !saveFailed.current) {
      saveFailed.current = true;
      setNotice(
        "ブラウザの保存領域に書き込めません。今回は画面を閉じずに遊んでください。",
      );
    }
  }, [run]);
  useEffect(() => {
    writeStorage("pmRomanceRecordsV2", records);
  }, [records]);
  useEffect(() => {
    writeStorage("pmRomanceMuted", muted);
  }, [muted]);
  useEffect(() => {
    if (run?.phase === "ended")
      setRecords((previous) => recordRun(previous, run));
  }, [run]);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      const ticket = ++generation;
      setUser(current);
      setSyncReady(false);
      if (!current) {
        setSyncMessage("この端末に自動保存");
        return;
      }
      try {
        const snapshot = await getDoc(doc(db, "users", current.uid));
        if (!active || ticket !== generation) return;
        const data = snapshot.data() ?? {};
        setRecords((previous) =>
          mergeRecords(
            previous,
            Array.isArray(data.romanceRecordsV2) ? data.romanceRecordsV2 : [],
          ),
        );
        if (Array.isArray(data.clearedPMs))
          setLegacyNames((previous) => [
            ...new Set([
              ...previous,
              ...data.clearedPMs.filter((n) => typeof n === "string"),
            ]),
          ]);
        if (!runRef.current) {
          const cloudRun = validRun(data.suspendedGameV2)
            ? data.suspendedGameV2
            : migrateLegacyRun(data.suspendedGame);
          if (cloudRun) setRun(cloudRun);
        }
        setSyncReady(true);
      } catch {
        if (active && ticket === generation) {
          setSyncMessage("端末に保存中・クラウド接続を確認してください");
          setNotice(
            "クラウドに接続できませんでした。ゲームはこの端末のセーブで続けられます。",
          );
        }
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!user || !syncReady) return;
    let active = true;
    setSyncMessage("クラウドへ保存中…");
    const timer = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            romanceRecordsV2: recordsRef.current,
            suspendedGameV2: runRef.current,
          },
          { merge: true },
        );
        if (active) setSyncMessage("クラウド保存済み");
      } catch {
        if (active) setSyncMessage("端末に保存中・クラウド同期は未完了");
      }
    }, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user, syncReady, run, records]);
  useEffect(() => {
    if (
      screen === "playing" &&
      window.innerWidth <= 600 &&
      ["dialogue", "feedback", "event", "eventFeedback"].includes(run?.phase)
    ) {
      document.querySelector(".game-main")?.scrollIntoView({ block: "start" });
    } else window.scrollTo({ top: 0 });
  }, [screen, run?.chapter, run?.phase]);
  useEffect(() => {
    const handler = (e) => {
      if (
        !isPlaying ||
        modal ||
        e.repeat ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName,
        )
      )
        return;
      if (["1", "2", "3"].includes(e.key)) {
        const index = Number(e.key) - 1;
        setRun((previous) =>
          previous.phase === "dialogue"
            ? answer(previous, previous.order[index])
            : previous.phase === "event"
              ? answerEvent(previous, index)
              : previous,
        );
      } else if (
        e.key === "Enter" &&
        document.activeElement?.tagName !== "BUTTON" &&
        ["feedback", "eventFeedback"].includes(run.phase)
      ) {
        e.preventDefault();
        setRun((previous) => advance(previous));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPlaying, modal, run?.phase]);

  const login = async () => {
    setLoginBusy(true);
    try {
      await signInWithPopup(auth, provider);
    } catch {
      setNotice("ログインを完了できませんでした。ログインなしでも遊べます。");
    } finally {
      setLoginBusy(false);
    }
  };
  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      setNotice("ログアウトできませんでした。もう一度お試しください。");
    }
  };
  const start = () => {
    setRun(createRun(selected));
    setScreen("playing");
    setModal(null);
  };
  const chooseRoute = () => (activeRun ? setModal("replace") : start());
  const navigate = (next) => {
    setScreen(next);
    setNotice("");
  };
  const step = isPlaying ? pm.steps[run.chapter] : null;
  const event = isPlaying
    ? EVENTS.find((e) => e.id === run.events[run.chapter === 1 ? 0 : 1])
    : null;
  const feedbackPhase =
    isPlaying && ["feedback", "eventFeedback"].includes(run.phase);
  const eventPhase =
    isPlaying && ["event", "eventFeedback"].includes(run.phase);

  return (
    <div className="app-shell">
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate("title")}
          aria-label="タイトルへ"
        >
          <span className="brand-mark">
            <Landmark size={21} />
          </span>
          <span>
            恋の議事録<small>PRIME MINISTER HEARTTHROB</small>
          </span>
        </button>
        <nav aria-label="メインメニュー">
          <button
            className="nav-link"
            aria-label="思い出手帖"
            onClick={() => setModal("collection")}
          >
            <BookOpen size={17} />
            <span>思い出手帖</span>
            <b>{collected.size}</b>
          </button>
          <button
            className="icon-button"
            aria-label="遊び方"
            onClick={() => setModal("help")}
          >
            <HelpCircle size={19} />
          </button>
          <button
            className="icon-button"
            aria-label={muted ? "音楽を再生" : "音楽を止める"}
            aria-pressed={!muted}
            onClick={() => setMuted((v) => !v)}
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
        </nav>
      </header>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button aria-label="通知を閉じる" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      {screen === "title" && (
        <main className="title-page">
          <div className="hero-copy">
            <div className="edition">
              <span /> 明治・大正 浪漫アドベンチャー
            </div>
            <p className="hero-kicker">歴史の教科書には、載らなかった。</p>
            <h1>
              その一言で、
              <br />
              歴史も<span className="love-word">恋</span>も<br />
              動きだす<span className="period">。</span>
            </h1>
            <p className="hero-description">
              堅い答弁の、その奥にある本音。
              <br />
              時を旅するあなたと、24の内閣をめぐる物語。
              <br />
              恋心と世論のあいだで、あなただけの結末を。
            </p>
            <div className="hero-actions">
              <button
                className="button primary"
                onClick={() => navigate("selection")}
              >
                物語をはじめる <ArrowRight size={19} />
              </button>
              {run && (
                <button
                  className="button secondary"
                  onClick={() => navigate("playing")}
                >
                  {activeRun ? "つづきから" : "前回の結末を読む"}{" "}
                  <span>
                    {activeRun
                      ? `第${run.chapter + 1}章`
                      : ENDINGS[run.ending].tag}
                  </span>
                </button>
              )}
            </div>
            <div className="hero-meta">
              <span>
                <Coffee size={15} /> １周 約５分
              </span>
              <span>
                <Heart size={15} /> ４つの結末
              </span>
              <span>
                <Check size={15} /> ログイン不要
              </span>
            </div>
            <div className="title-progress">
              <span className="progress-seal">✦</span>
              <div>
                <b>
                  {completed.size} <span>/ 24</span> の物語を読了
                </b>
                <small>まだ出会っていない、彼の一面を探しに。</small>
              </div>
              <button
                aria-label="思い出手帖を開く"
                onClick={() => setModal("collection")}
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="vertical-caption">
              拝啓、時代を越えて出会ったあなたへ。
            </span>
            <div className="hero-photo photo-back">
              <Portrait pm={routes[18]} />
              <span>第19代　原 敬</span>
            </div>
            <div className="hero-photo photo-front">
              <Portrait pm={routes[0]} />
              <div className="photo-caption">
                <small>CHAPTER 01 · A NEW ENCOUNTER</small>
                <strong>
                  伊藤 博文<span>から、あなたへ。</span>
                </strong>
              </div>
            </div>
            <div className="floating-note">
              <span>♡</span>「私の隣に、いてくれないか。」
            </div>
            <span className="visual-number">01 — 24</span>
          </div>
          <div className="title-bottom">
            <span>恋をする。迷う。もう一度、会いたくなる。</span>
            <button className="text-button" onClick={() => setModal("help")}>
              はじめての方へ <ChevronRight size={15} />
            </button>
          </div>
        </main>
      )}

      {screen === "selection" && (
        <main className="selection-page page-width">
          <button className="back-link" onClick={() => navigate("title")}>
            <ArrowLeft size={16} /> タイトルへ
          </button>
          <div className="section-heading">
            <div>
              <span className="eyebrow">CHOOSE YOUR STORY</span>
              <h1>誰の隣で、歴史を歩む？</h1>
              <p>
                同じ人物でも、内閣ごとに違う物語。気になる一冊を選んでください。
              </p>
            </div>
            <span className="count-label">全24ルート</span>
          </div>
          <div className="selection-layout">
            <div>
              <div className="filter-tabs" aria-label="時代で絞り込み">
                {["すべて", "明治", "大正"].map((value) => (
                  <button
                    key={value}
                    aria-pressed={era === value}
                    onClick={() => setEra(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="route-grid">
                {routes
                  .filter((p) => era === "すべて" || p.era === era)
                  .map((p) => (
                    <button
                      className={`route-card ${selected === p.id ? "selected" : ""}`}
                      aria-pressed={selected === p.id}
                      key={p.id}
                      onClick={() => {
                        setSelected(p.id);
                        if (window.innerWidth <= 600)
                          document
                            .querySelector(".route-preview")
                            ?.scrollIntoView({ block: "start" });
                      }}
                    >
                      <div className="route-photo">
                        <Portrait pm={p} lazy />
                        {completed.has(p.id) && (
                          <span className="route-cleared">
                            <Check size={12} /> 読了
                          </span>
                        )}
                      </div>
                      <div className="route-info">
                        <span>
                          第{String(p.id).padStart(2, "0")}代 · {p.era}
                        </span>
                        <strong>{p.name}</strong>
                        <div
                          className="route-dots"
                          aria-label={
                            records
                              .filter((r) => r.pmId === p.id)
                              .map((r) => ENDINGS[r.ending].label)
                              .join("、") || "未読"
                          }
                        >
                          {Object.keys(ENDINGS).map((key) => (
                            <i
                              className={
                                collected.has(`${p.id}:${key}`) ? "filled" : ""
                              }
                              key={key}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
            <aside className="route-preview">
              <div className="preview-image">
                <Portrait pm={selectedPM} />
                <span>{selectedPM.era}の物語</span>
              </div>
              <div className="preview-copy">
                <span className="eyebrow">
                  第{selectedPM.id}代 内閣総理大臣
                </span>
                <h2>{selectedPM.name}</h2>
                <p>{selectedPM.personality}</p>
                <div className="preview-quote">
                  {selectedPM.steps[0].scenario}
                </div>
                <button className="button primary" onClick={chooseRoute}>
                  この人の物語へ <ArrowRight size={17} />
                </button>
                <small className="save-caption">
                  {activeRun
                    ? "進行中の物語がある場合は、開始前に確認します"
                    : "全５章 ＋ ２つの突発イベント"}
                </small>
                <button
                  className="text-button preview-art-button"
                  onClick={() => {
                    setArtPM(selected);
                    setModal("art");
                  }}
                >
                  <Sparkles size={14} /> 表情差分を見る
                </button>
              </div>
            </aside>
          </div>
        </main>
      )}

      {isPlaying && run.phase !== "ended" && (
        <main className="game-page page-width">
          <div className="game-topline">
            <button className="back-link" onClick={() => navigate("title")}>
              <ArrowLeft size={15} /> 中断して戻る
            </button>
            <span className="save-state">
              <i />
              {syncMessage}
            </span>
          </div>
          <div
            className="chapter-stepper"
            aria-label={`第${run.chapter + 1}章、全5章`}
          >
            {CHAPTERS.map((name, index) => (
              <div
                className={
                  index === run.chapter
                    ? "current"
                    : index < run.chapter
                      ? "done"
                      : ""
                }
                key={name}
              >
                <span>
                  {index < run.chapter ? <Check size={13} /> : `0${index + 1}`}
                </span>
                <small>{name}</small>
              </div>
            ))}
          </div>
          <div className="game-layout">
            <aside className="character-panel">
              <Portrait pm={pm} className="character-image" mood={mood} />
              <button
                className="expression-view-button"
                onClick={() => {
                  setArtPM(pm.id);
                  setModal("art");
                }}
                aria-label={`${pm.name}の表情差分を見る`}
              >
                <Sparkles size={13} /> 表情を見る
              </button>
              <div className="character-caption">
                <span>
                  第{pm.id}代 · {pm.era}
                </span>
                <h2>{pm.name}</h2>
                <p className="character-mood" key={mood}>
                  {PORTRAIT_MOODS[mood].line}
                </p>
              </div>
              <span className="character-seal">恋</span>
            </aside>
            <div className="game-main">
              <section className="status-panel" aria-label="現在の状態">
                <Meter
                  label="恋心"
                  value={run.heart}
                  icon={Heart}
                  type="heart"
                  target={80}
                />
                <Meter
                  label="世論"
                  value={run.support}
                  icon={Users}
                  type="support"
                  target={65}
                />
                <div className="energy">
                  <span>
                    <Zap size={15} />
                    行動力
                  </span>
                  <div aria-label={`行動力${run.energy}、最大5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <i className={i <= run.energy ? "full" : ""} key={i} />
                    ))}
                  </div>
                  <small>{run.energy} / 5</small>
                </div>
              </section>
              <section
                className={`story-panel ${eventPhase ? "event-panel" : ""}`}
                key={`${run.chapter}-${run.phase}`}
              >
                <div className="story-heading">
                  <span className="eyebrow">
                    {eventPhase
                      ? "EXTRA SCENE · 突発イベント"
                      : `CHAPTER 0${run.chapter + 1}`}
                  </span>
                  {run.combo >= 2 && (
                    <span className="combo">
                      <Sparkles size={13} />
                      {run.combo}回連続 好感触
                    </span>
                  )}
                </div>
                <h1>{eventPhase ? event.title : CHAPTERS[run.chapter]}</h1>
                {run.phase === "prepare" ? (
                  <>
                    <p className="scene-intro">
                      次の面会まで、少し時間がある。
                      <br />
                      どんな準備をして、彼に会いにいこう？
                    </p>
                    <div className="preparation-list">
                      <button
                        disabled={run.energy < 1}
                        onClick={() =>
                          setRun((previous) => prepare(previous, "listen"))
                        }
                      >
                        <span className="action-icon pink">
                          <MessageCircle size={22} />
                        </span>
                        <div>
                          <strong>彼の本音に、耳を澄ます</strong>
                          <small>恋心＋8・相性ヒントを表示</small>
                        </div>
                        <span className="action-cost">行動力 −1</span>
                        <ChevronRight size={16} />
                      </button>
                      <button
                        disabled={run.energy < 1}
                        onClick={() =>
                          setRun((previous) => prepare(previous, "research"))
                        }
                      >
                        <span className="action-icon blue">
                          <BookOpen size={22} />
                        </span>
                        <div>
                          <strong>世間の声を、調べておく</strong>
                          <small>世論＋8</small>
                        </div>
                        <span className="action-cost">行動力 −1</span>
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setRun((previous) => prepare(previous, "rest"))
                        }
                      >
                        <span className="action-icon gold">
                          <Coffee size={22} />
                        </span>
                        <div>
                          <strong>温かいお茶で、ひと休み</strong>
                          <small>行動力＋2（最大5）</small>
                        </div>
                        <span className="action-cost">ひと息つく</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <p className="scene-tip">
                      <Sparkles size={14} />{" "}
                      準備は１章に１回。休むことも、未来の一手に。
                    </p>
                  </>
                ) : (
                  <>
                    <div className="dialogue-speaker">
                      {eventPhase
                        ? "ある日の出来事"
                        : feedbackPhase
                          ? `${pm.name}の返事`
                          : `${pm.name}から、あなたへ`}
                    </div>
                    <p className="dialogue-text" aria-live="polite">
                      {feedbackPhase
                        ? run.feedback.text
                        : eventPhase
                          ? event.scene
                          : step.scenario}
                    </p>
                    {feedbackPhase ? (
                      <>
                        <div className="feedback-receipt">
                          <div>
                            <Check size={14} /> あなたの答え
                            <span>{run.feedback.choice}</span>
                          </div>
                          <div className="delta-row">
                            <span
                              className={
                                run.feedback.heart >= 0
                                  ? "delta-good"
                                  : "delta-bad"
                              }
                            >
                              <Heart size={14} />
                              恋心 {signed(run.feedback.heart)}
                            </span>
                            <span
                              className={
                                run.feedback.support >= 0
                                  ? "delta-good"
                                  : "delta-bad"
                              }
                            >
                              <Users size={14} />
                              世論 {signed(run.feedback.support)}
                            </span>
                            {run.feedback.energy !== 0 && (
                              <span>
                                <Zap size={14} />
                                行動力 {signed(run.feedback.energy)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="button primary next-button"
                          onClick={() =>
                            setRun((previous) => advance(previous))
                          }
                        >
                          {run.chapter === 4
                            ? "ふたりの結末を読む"
                            : run.phase === "feedback" &&
                                [1, 3].includes(run.chapter)
                              ? "その日の帰り道へ"
                              : "次の章へ"}
                          <ArrowRight size={17} />
                        </button>
                      </>
                    ) : (
                      <>
                        {run.phase === "dialogue" && run.hint && (
                          <div className="hint">
                            <Sparkles size={15} />
                            <div>
                              <b>彼の本音</b>
                              <p>
                                いま心に響きそうなのは「
                                {
                                  [...step.choices].sort(
                                    (a, b) => b.point - a.point,
                                  )[0].text
                                }
                                」という言葉。周囲の信頼とのバランスも、忘れずに。
                              </p>
                            </div>
                          </div>
                        )}
                        {run.phase === "dialogue" && (
                          <label
                            className={`focus-toggle ${run.focused ? "enabled" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={run.focused}
                              disabled={run.energy < 2}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setRun((previous) =>
                                  previous.phase === "dialogue"
                                    ? { ...previous, focused: checked }
                                    : previous,
                                );
                              }}
                            />
                            <Zap size={15} />
                            <span>
                              想いを込める
                              <small>恋心＋6・世論＋4を上乗せ</small>
                            </span>
                            <b>行動力 −2</b>
                          </label>
                        )}
                        <div className="choice-list">
                          {(eventPhase
                            ? event.choices
                            : run.order.map((id) =>
                                step.choices.find((c) => c.id === id),
                              )
                          ).map((choice, index) => (
                            <button
                              key={eventPhase ? index : choice.id}
                              disabled={
                                eventPhase && run.energy + choice.energy < 0
                              }
                              onClick={() =>
                                setRun((previous) =>
                                  eventPhase
                                    ? answerEvent(previous, index)
                                    : answer(previous, choice.id),
                                )
                              }
                            >
                              <span className="choice-number">{index + 1}</span>
                              <span>
                                {choice.text}
                                {eventPhase && (
                                  <small className="event-cost">
                                    恋心 {signed(choice.heart)} / 世論{" "}
                                    {signed(choice.support)} / 行動力{" "}
                                    {signed(choice.energy)}
                                  </small>
                                )}
                              </span>
                              <ArrowRight size={16} />
                            </button>
                          ))}
                        </div>
                        <div className="choice-footer">
                          <span>正解よりも、あなたらしい言葉を。</span>
                          <span>
                            <kbd>1</kbd>〜<kbd>3</kbd> で選択
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </section>
              <button
                className="text-button chapter-log"
                onClick={() => setModal("log")}
              >
                <BookOpen size={14} /> ここまでの議事録{" "}
                <span>{run.history.length}</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {isPlaying && run.phase === "ended" && (
        <main className={`ending-page page-width ending-${run.ending}`}>
          <div className="ending-art">
            <Portrait pm={pm} mood={mood} />
            <div>
              <span>
                第{pm.id}代 · {pm.era}
              </span>
              <h2>{pm.name}</h2>
            </div>
          </div>
          <div className="ending-content">
            <span className="ending-emblem">{ENDINGS[run.ending].icon}</span>
            <span className="eyebrow">
              {ENDINGS[run.ending].tag} · 記録を手帖に追加しました
            </span>
            <h1>{ENDINGS[run.ending].label}</h1>
            <p className="ending-description">
              {ENDINGS[run.ending].description}
            </p>
            <div className="ending-stats">
              <div>
                <Heart size={19} />
                <strong>{run.heart}</strong>
                <span>恋心</span>
              </div>
              <div>
                <Users size={19} />
                <strong>{run.support}</strong>
                <span>世論</span>
              </div>
              <div>
                <Sparkles size={19} />
                <strong>{run.maxCombo}</strong>
                <span>最大連続好感触</span>
              </div>
            </div>
            <p className="ending-advice">
              {run.ending === "true"
                ? "ふたりの幸せも、人々の信頼も。最高の１ページが完成しました。"
                : `次は「恋も、未来も。」へ。${run.heart < 80 ? "本音を聞く準備や「想いを込める」で恋心を育てて。" : ""}${run.support < 65 ? "世間の声を調べたり、突発イベントで世論を育てて。" : ""}`}
            </p>
            <div className="ending-actions">
              <button
                className="button primary"
                onClick={() => {
                  setRun(createRun(pm.id));
                  navigate("playing");
                }}
              >
                もう一度、この人と <ArrowRight size={17} />
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setSelected(pm.id);
                  navigate("selection");
                }}
              >
                別の物語を選ぶ
              </button>
              <button className="text-button" onClick={() => setModal("log")}>
                <BookOpen size={15} /> 今回の選択を振り返る
              </button>
              <button className="text-button" onClick={() => navigate("title")}>
                タイトルへ戻る
              </button>
            </div>
          </div>
        </main>
      )}

      <footer className="site-footer">
        <span>
          歴代首相 ♡ 恋の議事録 <span className="footer-divider">/</span>{" "}
          人物・歴史をモチーフにしたフィクション
        </span>
        <div>
          {user ? (
            <>
              <span>
                {user.displayName || "ゲスト"} · {syncMessage}
              </span>
              <button onClick={logout} aria-label="ログアウト">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button disabled={loginBusy} onClick={login}>
              <LogIn size={14} />
              {loginBusy ? "接続中…" : "Googleで記録を同期"}
            </button>
          )}
        </div>
      </footer>
      <AudioManager isPlaying={!muted} volume={0.18} />

      {modal && (
        <Modal
          title={
            modal === "help"
              ? "恋の議事録の遊び方"
              : modal === "collection"
                ? "思い出手帖"
                : modal === "log"
                  ? "ふたりの議事録"
                  : modal === "art"
                    ? `${galleryPM.name}の表情手帖`
                    : "新しい物語をはじめますか？"
          }
          onClose={() => setModal(null)}
        >
          {modal === "help" && <Help />}
          {modal === "art" && (
            <div className="portrait-gallery">
              <p>
                言葉が届くたびに、変わる表情。会話の反応やふたりの結末に合わせて、ゲーム中のイラストも切り替わります。
              </p>
              <div className="portrait-gallery-grid">
                {Object.entries(PORTRAIT_MOODS).map(([key, expression]) => (
                  <figure key={`${galleryPM.id}-${key}`}>
                    <Portrait pm={galleryPM} mood={key} />
                    <figcaption>
                      <span>0{expression.frame + 1}</span>
                      {expression.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="portrait-gallery-navigation">
                <button
                  className="text-button"
                  onClick={() => setArtPM((id) => (id === 1 ? 24 : id - 1))}
                >
                  <ArrowLeft size={14} /> 前の内閣
                </button>
                <span>
                  第{galleryPM.id}代 · {galleryPM.era}
                </span>
                <button
                  className="text-button"
                  onClick={() => setArtPM((id) => (id === 24 ? 1 : id + 1))}
                >
                  次の内閣 <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
          {modal === "replace" && (
            <div className="replace-content">
              <p>
                第{run.chapter + 1}章まで進めた{pm.name}
                との途中データが、新しい物語に置き換わります。読了した結末のコレクションは残ります。
              </p>
              <button className="button primary" onClick={start}>
                新しい物語をはじめる <ArrowRight size={17} />
              </button>
            </div>
          )}
          {modal === "log" && (
            <div className="log-list">
              {run?.history.length ? (
                run.history.map((entry, index) => (
                  <article key={index}>
                    <span className="eyebrow">
                      {entry.event ? "EXTRA SCENE" : "CHAPTER"} · {entry.title}
                    </span>
                    <h3>{entry.choice}</h3>
                    <p>{entry.text}</p>
                    <div className="delta-row">
                      <span>恋心 {signed(entry.heart)}</span>
                      <span>世論 {signed(entry.support)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p>
                  まだ最初のページです。言葉を選ぶと、ここに思い出が残ります。
                </p>
              )}
            </div>
          )}
          {modal === "collection" && (
            <div className="collection">
              <div className="collection-summary">
                <div>
                  <strong>
                    {completed.size}
                    <small>/24</small>
                  </strong>
                  <span>読了した物語</span>
                </div>
                <div>
                  <strong>
                    {collected.size}
                    <small>/96</small>
                  </strong>
                  <span>集めた結末</span>
                </div>
                <div>
                  <strong>{trueCount}</strong>
                  <span>TRUE END</span>
                </div>
              </div>
              <div className="achievement-list">
                {[
                  { label: "最初の１ページ", done: records.length > 0 },
                  { label: "恋も、未来も。", done: trueCount > 0 },
                  {
                    label: "４つの結末",
                    done: new Set(records.map((r) => r.ending)).size === 4,
                  },
                  { label: "５つの物語", done: completed.size >= 5 },
                  { label: "全内閣の証人", done: completed.size === 24 },
                ].map((a) => (
                  <span className={a.done ? "unlocked" : ""} key={a.label}>
                    <Star size={13} fill={a.done ? "currentColor" : "none"} />
                    {a.label}
                  </span>
                ))}
              </div>
              {legacyNames.length > 0 && (
                <p className="legacy-note">
                  以前の版のクリア記録：{legacyNames.join("、")}
                  。新しい４つの結末は今回から収集できます。
                </p>
              )}
              <div className="collection-routes">
                {routes.map((p) => {
                  const routeRecords = records.filter((r) => r.pmId === p.id);
                  return (
                    <article key={p.id}>
                      <div className="collection-route-heading">
                        <span>第{p.id}代</span>
                        <h3>{p.name}</h3>
                        <span>{p.era}</span>
                      </div>
                      <div className="ending-stamps">
                        {Object.entries(ENDINGS).map(([key, e]) => (
                          <div
                            className={
                              collected.has(`${p.id}:${key}`) ? "unlocked" : ""
                            }
                            key={key}
                          >
                            <span>
                              {collected.has(`${p.id}:${key}`) ? e.icon : "·"}
                            </span>
                            <small>{e.tag}</small>
                          </div>
                        ))}
                      </div>
                      <p>
                        {routeRecords.length
                          ? `最高記録：恋心 ${Math.max(...routeRecords.map((r) => r.heart))} / 世論 ${Math.max(...routeRecords.map((r) => r.support))}（各周回の最高値）`
                          : "まだ開いていない物語"}
                      </p>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSelected(p.id);
                          setEra("すべて");
                          setModal(null);
                          navigate("selection");
                        }}
                      >
                        この物語を選ぶ <ArrowRight size={13} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
