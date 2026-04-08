"use client";

import { useState, useEffect } from "react";
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

// --- メインコンポーネント ---
export default function GardenMeisterApp() {
  const [view, setView] = useState<"title" | "rules" | "game">("title");
  const [mounted, setMounted] = useState(false);
  const [board, setBoard] = useState<Record<string, string | null>>({});
  const [actions, setActions] = useState(MAX_ACTIONS);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [deck, setDeck] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>("bg-red-400");

  useEffect(() => {
    const colors = PIECE_TYPES.map(p => p.color);
    const generateBalancedDeck = () => {
      const counts = { "Very Easy": 6, "Easy": 8, "Medium": 6, "Hard": 4 };
      const newDeck: any[] = [];
      Object.entries(counts).forEach(([difficulty, count]) => {
        const templates = BLUEPRINT_TEMPLATES.filter(t => t.difficulty === difficulty);
        for (let i = 0; i < count; i++) {
          const template = templates[Math.floor(Math.random() * templates.length)];
          newDeck.push({
            id: Math.random(),
            ...template,
            pattern: (template.shape || []).map(() => colors[Math.floor(Math.random() * colors.length)])
          });
        }
      });
      return newDeck.sort(() => Math.random() - 0.5);
    };
    setDeck(generateBalancedDeck());
    setMounted(true);
  }, []);

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

  // 得点判定ロジック
  useEffect(() => {
    if (!mounted || view !== "game" || isGameOver || faceUpCards.length === 0) return;
    for (let cardIdx = 0; cardIdx < faceUpCards.length; cardIdx++) {
      const card = faceUpCards[cardIdx];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const checkMatch = () => {
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
          if (checkMatch()) {
            setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + card.points }));
            setDeck(prev => { const d = [...prev]; d.splice(cardIdx, 1); return d; });
            return;
          }
        }
      }
    }
  }, [board, faceUpCards, mounted, isGameOver, currentPlayer, view]);

  if (!mounted) return null;

  // --- タイトル画面 ---
  if (view === "title") {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12 animate-in slide-in-from-bottom duration-700">
          <p className="text-amber-600 font-black tracking-[0.4em] mb-2 uppercase text-xs">Abstract Strategy Game</p>
          <h1 className="text-7xl md:text-8xl font-black text-stone-900 italic tracking-tighter leading-tight">GARDEN<br />MEISTER</h1>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={() => setView("game")} className="bg-stone-900 text-white py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-stone-800 transition-all border-b-4 border-stone-950">PLAY GAME</button>
          <button onClick={() => setView("rules")} className="bg-white text-stone-900 py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-stone-50 transition-all border-b-4 border-stone-200">RULES</button>
        </div>
      </div>
    );
  }

  // --- ルール説明画面 ---
  if (view === "rules") {
    return (
      <div className="min-h-screen bg-stone-100 p-8 flex flex-col items-center overflow-y-auto">
        <h2 className="text-3xl font-black text-stone-800 mb-8 italic">HOW TO PLAY</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mb-12">
          {[
            { t: "1. 植える", d: "1ターン3アクション。好きな場所に駒を配置。各色10個ずつの在庫に注意！" },
            { t: "2. 揃える", d: "公開された設計図の形を作ると得点。回転・反転・逆順でも達成になります。" },
            { t: "3. 替える", d: "配置が難しい時は、1アクションでカードを1枚引き直し（山札の最後へ移動）できます。" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-md border-2 border-stone-200">
              <h3 className="font-black text-amber-600 mb-3">{item.t}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setView("game")} className="bg-amber-600 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-amber-700 transition-all">START GARDENING</button>
      </div>
    );
  }

  // --- ゲーム本編 ---
  return (
    <main className="flex min-h-screen flex-col md:flex-row items-center md:items-start justify-center p-4 md:p-8 font-sans gap-8 bg-stone-100 text-stone-800 overflow-visible">
      {/* 3D盤面 & リザルト */}
      <div className={`relative w-full max-w-[500px] aspect-square rounded-3xl shadow-2xl border-[8px] md:border-[16px] sticky top-0 md:top-8 transition-all duration-500 overflow-hidden bg-white ${isGameOver ? 'border-stone-400' : currentPlayer === 1 ? 'border-[#8b4513]' : 'border-[#556b2f]'}`}>
        <GardenScene board={board} onTileClick={(r, c) => {
          if (actions <= 0 || isGameOver || board[`${r}-${c}`]) return;
          if (selectedColor && INITIAL_STOCK - stocks[selectedColor] > 0) {
            setBoard({ ...board, [`${r}-${c}`]: selectedColor });
            setActions(a => a - 1);
          }
        }} />

        {isGameOver && (
          <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-8 z-50 animate-in fade-in zoom-in">
            <p className="text-amber-500 font-black text-sm mb-2 tracking-widest uppercase">
              {isBoardFull ? "Garden Completed!" : "Designs Finished!"}
            </p>
            <h2 className="text-5xl font-black mb-10 italic">{winner === 0 ? "DRAW" : `P${winner} VICTORIOUS!`}</h2>
            <div className="flex gap-12 mb-10 text-center">
              <div className={winner === 1 ? 'scale-125 transition-transform' : 'opacity-40'}>
                <p className="text-[10px] font-bold">P1</p><p className="text-4xl font-black">{scores[1]}</p>
              </div>
              <div className="w-px h-12 bg-white/20 self-center" />
              <div className={winner === 2 ? 'scale-125 transition-transform' : 'opacity-40'}>
                <p className="text-[10px] font-bold">P2</p><p className="text-4xl font-black">{scores[2]}</p>
              </div>
            </div>
            <button onClick={() => window.location.reload()} className="bg-white text-stone-900 px-10 py-4 rounded-2xl font-black shadow-2xl hover:bg-amber-500 hover:text-white transition-all">REPLAY</button>
          </div>
        )}
      </div>

      {/* UIパネル */}
      <div className="md:ml-8 w-80 space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl border-b-8 border-stone-300">
          <div className="flex gap-2 mb-6 text-center font-black">
            {[1, 2].map(p => (
              <div key={p} className={`flex-1 p-2 rounded-xl border-2 transition-all ${currentPlayer === p ? 'border-amber-600 bg-amber-50' : 'border-stone-50 opacity-40'}`}>
                <p className="text-[10px]">PLAYER {p}</p>
                <p className="text-2xl">{scores[p as 1|2]}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Plans ({deck.length})</p>
            {faceUpCards.map((card, idx) => (
              <div key={card.id} onClick={() => handleCardRefresh(idx)} className="bg-stone-800 p-4 rounded-2xl flex items-center justify-between shadow-lg border-b-4 border-stone-950 cursor-pointer hover:brightness-125 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-600/90 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-black">SWAP (-1)</div>
                <div className="relative w-10 h-10 bg-white/5 rounded">
                  {card.shape.map((pos: number[], i: number) => (
                    <div key={i} className={`absolute w-2 h-2 ${card.pattern[i]} rounded-full`} style={{ left: `${pos[1]*8 + 5}px`, top: `${pos[0]*8 + 5}px` }} />
                  ))}
                </div>
                <div className="text-right">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm ${card.difficulty === 'Hard' ? 'bg-red-500' : 'bg-green-500'} text-white`}>{card.difficulty}</span>
                  <p className="text-white text-[10px] font-bold">{card.name}</p>
                  <p className="text-amber-500 font-black">{card.points} VP</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {PIECE_TYPES.map(p => (
              <button key={p.id} onClick={() => setSelectedColor(p.color)} className={`p-2 rounded-xl border-2 transition-all ${selectedColor === p.color ? 'border-amber-500 bg-amber-50' : 'border-transparent bg-stone-50'}`}>
                <div className={`w-5 h-5 mx-auto ${p.color} rounded-full shadow-inner border border-black/5`} />
                <span className="text-[10px] font-bold text-stone-500 mt-1 block">{INITIAL_STOCK - (stocks[p.color] || 0)}</span>
              </button>
            ))}
          </div>

          <div className="mb-4 text-center">
             <div className="flex justify-center gap-1 mb-2">
               {[...Array(MAX_ACTIONS)].map((_, i) => (
                 <div key={i} className={`h-1.5 w-6 rounded-full ${i < actions ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-stone-200'}`} />
               ))}
             </div>
          </div>
          <button onClick={() => { setActions(MAX_ACTIONS); setCurrentPlayer(currentPlayer === 1 ? 2 : 1); }} disabled={actions > 0 || isGameOver} className={`w-full py-4 rounded-2xl font-black text-sm border-b-4 transition-all ${actions === 0 ? 'bg-amber-600 text-white border-amber-800' : 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'}`}>
            {isGameOver ? "GAME OVER" : "FINISH TURN"}
          </button>
        </div>
      </div>
    </main>
  );

  function handleCardRefresh(index: number) {
    if (actions < 1 || isGameOver) return;
    setDeck(prev => {
      const d = [...prev];
      const [card] = d.splice(index, 1);
      d.push(card);
      return d;
    });
    setActions(a => a - 1);
  }
}