"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import Tulip from "./TulipModel"; // 先ほど解決したインポート形式に合わせる

interface GardenSceneProps {
  board: Record<string, string | null>;
  onTileClick: (r: number, c: number) => void;
}

// ↓ ここで「GardenScene」を名前付きでエクスポートしているか確認！
export function GardenScene({ board, onTileClick }: GardenSceneProps) {
  return (
    <Canvas camera={{ position: [0, 5, 8], fov: 40}}>
      <ambientLight intensity={0.5} />
      <Environment preset="park" />
      
      {/* 5x5の盤面をループで描画 */}
      {Array.from({ length: 5 }).map((_, r) =>
        Array.from({ length: 5 }).map((_, c) => {
          const colorClass = board[`${r}-${c}`];
          return (
            <group key={`${r}-${c}`} position={[r - 2, 0, c - 2]}>
              {/* マス目（クリック判定用の透明な床） */}
              <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                onClick={(e) => {
                  e.stopPropagation(); // 重なりによる多重クリック防止
                  onTileClick(r, c);
                }}
              >
                <planeGeometry args={[0.9, 0.9]} />
                <meshStandardMaterial 
                  color={colorClass ? "#3a4d39" : "#5d4037"} 
                  transparent 
                  opacity={colorClass ? 1 : 0.3} 
                />
              </mesh>

              {/* チューリップ（色がついている場合のみ表示） */}
              {colorClass && (
                <Tulip 
                    scale={0.3}          // 元のサイズに戻す
                    position={[0, 0.4, 0]} // ← ここを 0.4 くらいに浮かせてみる
                    color={getColorHex(colorClass)} 
                />
            )}
            </group>
          );
        })
      )}

      <ContactShadows position={[0, 10, 0]} opacity={0.4} scale={10} blur={2} />
      <OrbitControls 
        makeDefault 
        // --- ズームを禁止する設定 ---
        enableZoom={false}       // これだけでホイールやピンチでの拡大縮小が止まります
        
        // --- 回転の設定 ---
        enableRotate={true}      // 回転は許可
        rotateSpeed={0.8}        // 回転の速さ（お好みで調整）

        // --- その他の制限（使い勝手を良くする） ---
        enablePan={false}        // 右クリックでの平行移動を禁止（盤面がズレないように）
        
        // 上下の回転範囲を制限（地面の下に潜り込まないように）
        minPolarAngle={Math.PI / 4}   // 45度
        maxPolarAngle={Math.PI / 2.2} // 地面スレスレ
        />
    </Canvas>
  );
}

// 色の変換ヘルパー（Tailwindのクラス名を3Dの色に変換）
function getColorHex(className: string) {
  if (className.includes("red")) return "#f87171";
  if (className.includes("yellow")) return "#fde047";
  if (className.includes("purple")) return "#c084fc";
  if (className.includes("stone")) return "#fafaf9";
  return "#ffffff";
}