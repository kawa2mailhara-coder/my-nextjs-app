// TulipModel.tsx
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

export default function Tulip({ scale, position, color, ...props }: any) {
  const { scene } = useGLTF("/models/tulip.glb");

  // メモリ効率とバグ防止のため、モデルを複製して色を塗る
  const copiedScene = useMemo(() => {
    const clone = scene.clone();
    
    // モデルの中から「花びら」などのメッシュを探して色を塗る
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // 特定の名前を探さず、見つかったメッシュすべてに色を適用する
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color), // propsで渡された色
          roughness: 0.9,               // マットな質感
          metalness: 0.0
        });
      }
    });
    return clone;
  }, [scene, color]);

  return (
    <primitive 
      object={copiedScene} 
      scale={scale} 
      position={position} 
      {...props} 
    />
  );
}