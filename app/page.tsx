"use client";

import { useState, useEffect } from "react";
// 3D盤面コンポーネントをインポート
import { GardenScene } from "@/components/canvas/GardenScene";

// --- 設定・定数 ---
const ROWS = 5;
const COLS = 5;
const MAX_ACTIONS = 3;
const INITIAL_STOCK = 10;

const PIECE_TYPES = [
  { id: "red", color: "bg-red-400", name: "Red (Gloss)" },
  { id: "yellow", color: "bg-yellow-300", name: "Yellow (Lines)" },
  { id: "purple", color: "bg-purple-400", name: "Purple (Ishime)" },
  { id: "white", color: "bg-stone-50", name: "White (Matte)" },
];

const BLUEPRINT_TEMPLATES = [
  { name: "ペア（縦横）", shape: [[0,0], [0,1]], points: 5, difficulty: "Very Easy" },
  { name: "ペア（斜め）", shape: [[0,0], [1,1]], points: 5, difficulty: "Very Easy" },
  { name: "直線", shape: [[0,0], [0,1], [0,2]], points: 10, difficulty: "Easy" },
  { name: "L字型", shape: [[0,0], [1,0], [1,1]], points: 15, difficulty: "Easy" },
  { name: "斜め配置", shape: [[0,0], [1,1], [2,2]], points: 20, difficulty: "Medium" },
  { name: "ひし形", shape: [[0,1], [1,0], [1,2], [2,1]], points: 25, difficulty: "Medium" },
  { name: "十字路", shape: [[0,1], [1,0], [1,1], [1,2], [2,1]], points: 35, difficulty: "Hard" },
  { name: "パッチワーク", shape: [[0,0], [0,2], [1,1], [2,0], [2,2]], points: 40, difficulty: "Hard" },
];

export default function GardenMeisterFullApp() {
  const [view, setView] = useState<"home" | "rules" | "game">("home");
  const [mounted, setMounted] = useState(false);

  // ゲームステート
  const [board, setBoard] = useState<Record<string, string | null>>({});
  const [actions, setActions] = useState(MAX_ACTIONS);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [deck, setDeck] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>("bg-red-400");

  useEffect(() => {
    setMounted(true);
    resetGame();
  }, []);

  const resetGame = () => {
    setBoard({});
    setActions(MAX_ACTIONS);
    setCurrentPlayer(1);
    setScores({ 1: 0, 2: 0 });
    const colors = PIECE_TYPES.map(p => p.color);
    const newDeck: any[] = [];
    const counts = { "Very Easy": 6, "Easy": 8, "Medium": 6, "Hard": 4 };
    Object.entries(counts).forEach(([diff, count]) => {
      const templates = BLUEPRINT_TEMPLATES.filter(t => t.difficulty === diff);
      for (let i = 0; i < count; i++) {
        const t = templates[Math.floor(Math.random() * templates.length)];
        newDeck.push({
          id: Math.random(),
          ...t,
          pattern: (t.shape || []).map(() => colors[Math.floor(Math.random() * colors.length)])
        });
      }
    });
    setDeck(newDeck.sort(() => Math.random() - 0.5));
  };

  const isBoardFull = mounted && Object.keys(board).length >= ROWS * COLS;
  const isDeckEmpty = mounted && deck.length === 0;
  const isGameOver = isBoardFull || isDeckEmpty;
  const winner = scores[1] > scores[2] ? 1 : scores[1] < scores[2] ? 2 : 0;
  const faceUpCards = deck.slice(0, 3);
  const stocks = (() => {
    const used: any = { "bg-red-400": 0, "bg-yellow-300": 0, "bg-purple-400": 0, "bg-stone-50": 0 };
    Object.values(board).forEach(c => { if (c) used[c]++; });
    return used;
  })();

  // 判定ロジック（マッチング計算）
  useEffect(() => {
    if (!mounted || view !== "game" || isGameOver || faceUpCards.length === 0) return;
    for (let cardIdx = 0; cardIdx < faceUpCards.length; cardIdx++) {
      const card = faceUpCards[cardIdx];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const match = () => {
            let shape = card.shape;
            for (let rot = 0; rot < 4; rot++) {
              shape = shape.map(([row, col]: number[]) => [col, -row]);
              const variants = [shape, shape.map(([row, col]: number[]) => [row, -col])];
              for (const s of variants) {
                const minR = Math.min(...s.map((p: number[]) => p[0]));
                const minC = Math.min(...s.map((p: number[]) => p[1]));
                const norm = s.map(([row, col]: number[]) => [row - minR, col - minC]);
                const check = (p: string[]) => norm.every((off: number[], i: number) => board[`${r + off[0]}-${c + off[1]}`] === p[i]);
                if (check(card.pattern) || check([...card.pattern].reverse())) return true;
              }
            }
            return false;
          };
          if (match()) {
            setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + card.points }));
            setDeck(prev => { const d = [...prev]; d.splice(cardIdx, 1); return d; });
            return;
          }
        }
      }
    }
  }, [board, faceUpCards, mounted, isGameOver, currentPlayer, view]);

  if (!mounted) return null;

  // --- 1. ホーム画面 ---
  if (view === "home") {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
        <div className="text-center mb-16">
          <p className="text-amber-600 font-black tracking-[0.4em] mb-2 uppercase text-xs">Abstract Strategy Game</p>
          <h1 className="text-7xl md:text-8xl font-black text-stone-900 italic tracking-tighter leading-tight">GARDEN<br />MEISTER</h1>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={() => setView("game")} className="bg-stone-900 text-white py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-stone-800 transition-all border-b-4 border-stone-950 active:translate-y-1">PLAY GAME</button>
          <button onClick={() => setView("rules")} className="bg-white text-stone-900 py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-stone-50 transition-all border-b-4 border-stone-200 active:translate-y-1">HOW TO PLAY</button>
        </div>
      </div>
    );
  }

  // --- 2. ルール説明画面 ---
  if (view === "rules") {
    return (
      <div className="min-h-screen bg-stone-100 p-8 flex flex-col items-center justify-center animate-in slide-in-from-right duration-500">
        <h2 className="text-4xl font-black text-stone-900 mb-12 italic">RULES</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mb-16">
          {[
            { n: "01", t: "植える", d: "1ターン3アクション。4色の駒を盤面に配置します。各色10個ずつの在庫を管理しましょう。" },
            { n: "02", t: "揃える", d: "公開された「設計図」と同じ配置を作ると得点。回転・反転も有効です。" },
            { n: "03", t: "替える", d: "1アクションを消費して設計図を引き直せます（カードをクリック）。" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-md border-b-4 border-stone-200 text-stone-800">
              <span className="text-amber-600 font-black text-4xl mb-4 block">{item.n}</span>
              <h3 className="text-xl font-black mb-4">{item.t}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setView("game")} className="bg-amber-600 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-amber-700">START GAME</button>
      </div>
    );
  }

  // --- 3. プレイ画面 ---
  return (
    <div className="animate-in fade-in duration-1000 min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 md:p-8">
      <main className="flex flex-col md:flex-row items-center md:items-start gap-8">
        
        {/* 左側: 3D盤面 & リザルト */}
        <div className={`relative w-full max-w-[500px] aspect-square rounded-[3rem] shadow-2xl border-[10px] md:border-[16px] transition-all duration-500 overflow-hidden bg-white ${isGameOver ? 'border-stone-400' : currentPlayer === 1 ? 'border-[#8b4513]' : 'border-[#556b2f]'}`}>
          <GardenScene board={board} onTileClick={(r, c) => {
            if (actions <= 0 || isGameOver || board[`${r}-${c}`]) return;
            if (selectedColor && INITIAL_STOCK - stocks[selectedColor] > 0) {
              setBoard({ ...board, [`${r}-${c}`]: selectedColor });
              setActions(a => a - 1);
            }
          }} />

          {isGameOver && (
            <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-8 z-50 animate-in zoom-in">
              <h2 className="text-5xl font-black mb-10 italic">{winner === 0 ? "DRAW" : `P${winner} WIN!`}</h2>
              <button onClick={() => { resetGame(); setView("home"); }} className="bg-white text-stone-900 px-10 py-4 rounded-2xl font-black hover:bg-amber-500 hover:text-white transition-all">BACK TO TITLE</button>
            </div>
          )}
        </div>

        {/* 右側: UIパネル */}
        <div className="w-80 flex flex-col gap-4">
          
          {/* システム操作ボタン（ホームに戻る） */}
          <button 
            onClick={() => { if(confirm("タイトル画面に戻りますか？")) setView("home"); }} 
            className="group flex items-center justify-between bg-stone-200 hover:bg-stone-300 text-stone-600 px-6 py-4 rounded-2xl border-b-4 border-stone-400 transition-all active:translate-y-1 active:border-b-0"
          >
            <span className="text-[12px] font-black tracking-widest flex items-center gap-2">
              <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
              HOME MENU
            </span>
            <span className="text-[9px] font-bold opacity-40 uppercase italic">Quit Game</span>
          </button>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-b-8 border-stone-300">
            {/* プレイヤー情報 */}
            <div className="flex gap-2 mb-6">
              {[1, 2].map(p => (
                <div key={p} className={`flex-1 p-2 rounded-2xl border-2 ${currentPlayer === p ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-stone-50 opacity-40 text-stone-400'}`}>
                  <p className="text-[10px] font-black uppercase text-center">P{p}</p>
                  <p className="text-2xl font-black text-center">{scores[p as 1|2]}</p>
                </div>
              ))}
            </div>

            {/* 設計図（山札） */}
            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Plans ({deck.length})</p>
              {faceUpCards.map((card, idx) => (
                <div key={card.id} onClick={() => {
                  if (actions < 1 || isGameOver) return;
                  setDeck(prev => { const d = [...prev]; const [c] = d.splice(idx, 1); d.push(c); return d; });
                  setActions(a => a - 1);
                }} className="bg-stone-800 p-4 rounded-2xl flex items-center justify-between border-b-4 border-stone-950 cursor-pointer hover:brightness-125 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-600/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase">Refresh Plan (-1)</div>
                  <div className="relative w-10 h-10 bg-white/5 rounded">
                    {card.shape.map((pos: number[], i: number) => (
                      <div key={i} className={`absolute w-2 h-2 ${card.pattern[i]} rounded-full shadow-sm`} style={{ left: `${pos[1]*8 + 5}px`, top: `${pos[0]*8 + 5}px` }} />
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm bg-stone-600 text-white uppercase">{card.difficulty}</span>
                    <p className="text-amber-500 font-black text-sm">{card.points} VP</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 駒の在庫選択 */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {PIECE_TYPES.map(p => (
                <button key={p.id} onClick={() => setSelectedColor(p.color)} className={`p-2 rounded-2xl border-2 transition-all ${selectedColor === p.color ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-transparent bg-stone-50'}`}>
                  <div className={`w-5 h-5 mx-auto ${p.color} rounded-full border border-black/5 shadow-inner`} />
                  <span className="text-[10px] font-bold text-stone-500 mt-1 block text-center">{INITIAL_STOCK - stocks[p.color]}</span>
                </button>
              ))}
            </div>

            {/* アクション制御 */}
            <div className="mb-4 text-center">
              <div className="flex justify-center gap-1.5 mb-2">
                {[...Array(MAX_ACTIONS)].map((_, i) => (
                  <div key={i} className={`h-1.5 w-7 rounded-full transition-colors ${i < actions ? 'bg-green-500 shadow-sm' : 'bg-stone-200'}`} />
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => { setActions(MAX_ACTIONS); setCurrentPlayer(currentPlayer === 1 ? 2 : 1); }} 
              disabled={actions > 0 || isGameOver} 
              className={`w-full py-4 rounded-2xl font-black text-sm border-b-4 transition-all ${actions === 0 ? 'bg-amber-600 text-white border-amber-800 active:translate-y-1 active:border-b-0' : 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'}`}
            >
              {isGameOver ? "GAME OVER" : "FINISH TURN"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}