"use client";

import { useState, useEffect } from "react";
// 3Dコンポーネントのインポート（パスは自分の環境に合わせて調整してください）
import { GardenScene } from "@/components/canvas/GardenScene";

const ROWS = 5;
const COLS = 5;
const MAX_ACTIONS = 3;
const INITIAL_STOCK = 10;

const PIECE_TYPES = [
  { id: "red", color: "bg-red-400" },
  { id: "yellow", color: "bg-yellow-300" },
  { id: "purple", color: "bg-purple-400" },
  { id: "white", color: "bg-stone-50" },
];

const BLUEPRINT_TEMPLATES = [
  { name: "直線", shape: [[0,0], [0,1], [0,2]], points: 10, difficulty: "Easy" },
  { name: "L字型", shape: [[0,0], [1,0], [1,1]], points: 15, difficulty: "Easy" },
  { name: "斜め配置", shape: [[0,0], [1,1], [2,2]], points: 20, difficulty: "Medium" },
  { name: "飛び石", shape: [[0,0], [0,2], [0,4]], points: 20, difficulty: "Medium" },
  { name: "ひし形", shape: [[0,1], [1,0], [1,2], [2,1]], points: 25, difficulty: "Medium" },
  { name: "ゲート", shape: [[0,0], [0,1], [0,2], [1,0], [1,2]], points: 25, difficulty: "Medium" },
  { name: "十字路", shape: [[0,1], [1,0], [1,1], [1,2], [2,1]], points: 35, difficulty: "Hard" },
  { name: "パッチワーク", shape: [[0,0], [0,2], [1,1], [2,0], [2,2]], points: 40, difficulty: "Hard" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [board, setBoard] = useState<Record<string, string | null>>({});
  const [actions, setActions] = useState(MAX_ACTIONS);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [deck, setDeck] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>("bg-red-400");

  useEffect(() => {
    const colors = PIECE_TYPES.map(p => p.color);
    const newDeck = Array.from({ length: 24 }).map(() => {
      const template = BLUEPRINT_TEMPLATES[Math.floor(Math.random() * BLUEPRINT_TEMPLATES.length)];
      return {
        id: Math.random(),
        ...template,
        pattern: (template.shape || []).map(() => colors[Math.floor(Math.random() * 4)])
      };
    });
    setDeck(newDeck);
    setMounted(true);
  }, []);

  const stocks = (() => {
    const used: any = { "bg-red-400": 0, "bg-yellow-300": 0, "bg-purple-400": 0, "bg-stone-50": 0 };
    Object.values(board).forEach(c => { if (c) used[c]++; });
    return used;
  })();

  const faceUpCards = deck.slice(0, 3);
  const isGameOver = mounted && deck.length === 0;

  // 得点判定ロジック（そのまま維持）
  useEffect(() => {
    if (!mounted || isGameOver || faceUpCards.length === 0) return;

    for (let cardIdx = 0; cardIdx < faceUpCards.length; cardIdx++) {
      const card = faceUpCards[cardIdx];
      if (!card?.shape) continue;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const isMatch = () => {
            let currentShape = card.shape;
            for (let rot = 0; rot < 4; rot++) {
              currentShape = currentShape.map(([row, col]: number[]) => [col, -row]);
              const variants = [currentShape, currentShape.map(([row, col]: number[]) => [row, -col])];
              for (const s of variants) {
                const minR = Math.min(...s.map((p: number[]) => p[0]));
                const minC = Math.min(...s.map((p: number[]) => p[0]));
                const norm = s.map(([row, col]: number[]) => [row - minR, col - minC]);
                const check = (p: string[]) => norm.every((off: number[], i: number) => board[`${r + off[0]}-${c + off[1]}`] === p[i]);
                if (check(card.pattern) || check([...card.pattern].reverse())) return true;
              }
            }
            return false;
          };
          if (isMatch()) {
            setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + card.points }));
            setDeck(prev => { const d = [...prev]; d.splice(cardIdx, 1); return d; });
            return;
          }
        }
      }
    }
  }, [board, faceUpCards, mounted, isGameOver, currentPlayer]);

  const handleClickTile = (r: number, c: number) => {
    if (actions <= 0 || isGameOver || board[`${r}-${c}`]) return;
    if (selectedColor && INITIAL_STOCK - stocks[selectedColor] > 0) {
      setBoard({ ...board, [`${r}-${c}`]: selectedColor });
      setActions(a => a - 1);
    }
  };

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen bg-stone-100 items-start justify-center p-8 font-sans">
      
      {/* --- 左側：3D盤面エリア --- */}
      <div 
        className={`w-[650px] h-[650px] rounded-3xl shadow-2xl border-[16px] sticky top-8 transition-all duration-500 overflow-hidden bg-white
        ${isGameOver ? 'border-stone-400' : currentPlayer === 1 ? 'border-[#8b4513]' : 'border-[#556b2f]'}`}
      >
        {/* 3Dシーンを呼び出し。boardデータとクリック関数を渡す */}
        <GardenScene 
          board={board} 
          onTileClick={handleClickTile} 
        />
      </div>

      {/* --- 右側：UIパネル（スコア、手札、アクション） --- */}
      <div className="ml-8 w-80 space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl border-b-8 border-stone-300 text-stone-800">
          
          {/* スコア表示 */}
          <div className="flex gap-2 mb-6 text-center">
            {[1, 2].map(p => (
              <div key={p} className={`flex-1 p-2 rounded-xl border-2 transition-all ${currentPlayer === p ? 'border-amber-600 bg-amber-50' : 'border-stone-50'}`}>
                <p className="text-[10px] font-bold opacity-40 uppercase">P{p}</p>
                <p className="text-xl font-black">{(scores as any)[p]}</p>
              </div>
            ))}
          </div>

          {/* 公開されているデザインカード */}
          <div className="space-y-3 mb-6">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Plans ({deck.length})</p>
            {faceUpCards.length > 0 ? faceUpCards.map((card) => (
              <div key={card.id} className={`bg-stone-800 p-4 rounded-2xl flex items-center justify-between border-b-4 shadow-lg border-stone-950`}>
                <div className="relative w-12 h-12 bg-white/5 rounded overflow-hidden">
                  {card?.shape?.map((pos: number[], i: number) => (
                    <div key={i} className={`absolute w-2 h-2 ${card?.pattern?.[i] || 'bg-stone-500'} rounded-full`} style={{ left: `${pos[1]*8 + 6}px`, top: `${pos[0]*8 + 6}px` }} />
                  ))}
                </div>
                <div className="text-right">
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm mb-1 inline-block ${card.difficulty === 'Hard' ? 'bg-red-500 text-white' : card.difficulty === 'Medium' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>{card.difficulty}</span>
                  <span className="text-white text-[10px] font-bold block opacity-90">{card.name}</span>
                  <span className="text-amber-500 font-black text-sm">{card.points} VP</span>
                </div>
              </div>
            )) : <div className="py-8 text-center text-[10px] text-stone-400 italic">Preparing blueprints...</div>}
          </div>

          {/* カラー選択（在庫表示） */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {PIECE_TYPES.map(p => (
              <button key={p.id} onClick={() => setSelectedColor(p.color)} className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedColor === p.color ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-100 shadow-sm' : 'border-transparent bg-stone-50'}`}>
                <div className={`w-5 h-5 ${p.color} rounded-full shadow-sm border border-black/5`} />
                <span className="text-[10px] font-bold text-stone-500">{INITIAL_STOCK - (stocks[p.color] || 0)}</span>
              </button>
            ))}
          </div>

          {/* ターン終了ボタン */}
          <div className="mb-2 text-center">
            <span className="text-[10px] font-bold text-amber-600">ACTIONS LEFT: {actions}</span>
          </div>
          <button 
            onClick={() => { setActions(MAX_ACTIONS); setCurrentPlayer(currentPlayer === 1 ? 2 : 1); }} 
            disabled={actions > 0 || isGameOver} 
            className={`w-full py-4 rounded-2xl font-black text-sm border-b-4 transition-all ${actions === 0 ? 'bg-amber-600 text-white border-amber-800 shadow-lg active:translate-y-1 active:border-b-0' : 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'}`}
          >
            FINISH TURN
          </button>
        </div>
      </div>
    </main>
  );
}