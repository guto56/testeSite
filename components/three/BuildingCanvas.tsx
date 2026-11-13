'use client';

import { Suspense, useEffect, useState } from 'react';
import { PCFShadowMap } from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { BUILDING_MODEL_URL } from '@/lib/buildingConfig';
import { useSiteStore } from '@/store/useSiteStore';
import { MOBILE_QUERY } from '@/lib/motion';
import { World } from './World';
import { ProceduralBuilding } from './ProceduralBuilding';
import { GlbBuilding } from './GlbBuilding';
import { UnitEffects } from './UnitEffects';
import { SelectionLight, UnitOutlines } from './Highlights';
import { CameraRig } from './CameraRig';

/** Compila os shaders antes do primeiro quadro visível e avisa a UI que a cena está pronta. */
function ReadySignal() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        invalidate();
        // espera dois quadros reais (sombras + composer) antes de tirar o loader
        raf = requestAnimationFrame(() => {
          invalidate();
          raf = requestAnimationFrame(() => !cancelled && useSiteStore.getState().setSceneReady());
        });
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [gl, scene, camera, invalidate]);
  return null;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}

export default function BuildingCanvas() {
  const mobile = useIsMobile();

  return (
    <Canvas
      className="!absolute inset-0"
      frameloop="demand"
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      shadows={{ type: PCFShadowMap }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 32, near: 1, far: 2000, position: [70, 40, 90] }}
      aria-label="Modelo 3D interativo do edifício. Use o seletor de andares ou a lista de apartamentos para navegar pelo teclado."
    >
      <World mobile={mobile} />
      <Suspense fallback={null}>
        {BUILDING_MODEL_URL ? <GlbBuilding url={BUILDING_MODEL_URL} /> : <ProceduralBuilding />}
        <UnitEffects />
        <UnitOutlines />
        <SelectionLight />
        <ReadySignal />
      </Suspense>
      <CameraRig />
      <EffectComposer multisampling={mobile ? 0 : 4} enableNormalPass={false}>
        <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.82} luminanceSmoothing={0.25} />
        <Vignette offset={0.28} darkness={0.55} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
