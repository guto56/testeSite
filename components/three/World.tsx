'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { LAYOUT } from '@/lib/layout';

/** Direção do sol (entardecer, baixo, a oeste e um pouco ao fundo). */
export const SUN_DIR = new THREE.Vector3(-0.82, 0.2, -0.53).normalize();

const SKY = {
  top: '#1c2442',
  mid: '#4b4b78',
  horizon: '#d99a7e',
  sun: '#ffc48a',
  fog: '#55557a',
};

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // sempre no fundo
  }
`;
const skyFragment = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uFog; uniform vec3 uSunDir;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float s = max(dot(d, uSunDir), 0.0);
    vec3 horizon = mix(uFog, uHorizon, pow(s, 1.6));
    vec3 col = mix(horizon, uMid, smoothstep(0.0, 0.28, h));
    col = mix(col, uTop, smoothstep(0.22, 0.8, h));
    col += uSun * pow(s, 18.0) * 0.55 * (1.0 - smoothstep(0.0, 0.35, h));
    col += uSun * pow(s, 900.0) * 3.0;
    col = mix(col, uFog, smoothstep(0.02, -0.08, h));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTop: { value: new THREE.Color(SKY.top) },
          uMid: { value: new THREE.Color(SKY.mid) },
          uHorizon: { value: new THREE.Color(SKY.horizon) },
          uSun: { value: new THREE.Color(SKY.sun) },
          uFog: { value: new THREE.Color(SKY.fog) },
          uSunDir: { value: SUN_DIR },
        },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-1} raycast={() => null} frustumCulled={false}>
      <sphereGeometry args={[900, 32, 16]} />
    </mesh>
  );
}

const rand = (seed: number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, matrices: THREE.Matrix4[], colors?: THREE.Color[]) {
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((mx, i) => m.setMatrixAt(i, mx));
    colors?.forEach((c, i) => m.setColorAt(i, c));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [ref, matrices, colors]);
}

const q = new THREE.Quaternion();
const m4 = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rotY = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    rotY ? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY) : q,
    new THREE.Vector3(sx, sy, sz),
  );

/** Entorno discreto: chão, praça, jardim de jacarandás, postes, piscina e quadras vizinhas na névoa. */
function Surroundings() {
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const crownGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const lampGeo = useMemo(() => new THREE.SphereGeometry(1, 12, 8), []);

  const trees = useMemo(() => {
    const r = rand(42);
    const crowns: THREE.Matrix4[] = [];
    const trunks: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const palette = ['#9a83cf', '#8c76c2', '#a892d6', '#3e5446', '#465c4b'];
    const spots: [number, number][] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.15;
      const rad = 22 + r() * 9;
      spots.push([Math.cos(a) * rad, Math.sin(a) * rad]);
    }
    spots.forEach(([x, z], i) => {
      const s = 1.5 + r() * 0.9;
      const h = 2.6 + r() * 1.4;
      trunks.push(m4(x, h / 2, z, 0.3, h, 0.3));
      crowns.push(m4(x, h + s * 0.6, z, s * 1.15, s * 0.85, s * 1.15, r() * 3));
      colors.push(new THREE.Color(palette[i % 3 === 0 ? 3 + (i % 2) : i % 3]));
    });
    return { crowns, trunks, colors };
  }, []);

  const lamps = useMemo(() => {
    const poles: THREE.Matrix4[] = [];
    const bulbs: THREE.Matrix4[] = [];
    const e = 33;
    for (let i = -3; i <= 3; i++) {
      for (const [x, z] of [
        [i * 10, e],
        [i * 10, -e],
        [e, i * 10],
        [-e, i * 10],
      ]) {
        poles.push(m4(x, 1.8, z, 0.12, 3.6, 0.12));
        bulbs.push(m4(x, 3.75, z, 0.28, 0.28, 0.28));
      }
    }
    return { poles, bulbs };
  }, []);

  const city = useMemo(() => {
    const r = rand(7);
    const list: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    for (let i = 0; i < 90; i++) {
      const a = r() * Math.PI * 2;
      const far = i > 40;
      const d = far ? 190 + r() * 260 : 48 + r() * 60;
      const w = far ? 14 + r() * 24 : 7 + r() * 10;
      const dd = far ? 14 + r() * 24 : 7 + r() * 10;
      const h = far ? 10 + r() * 45 : 3 + r() * 5; // perto: casas baixas, nunca tampam a torre
      list.push(m4(Math.cos(a) * d, h / 2, Math.sin(a) * d, w, h, dd, r() * Math.PI));
      colors.push(new THREE.Color('#2a2e40').lerp(new THREE.Color('#3b3a52'), r()));
    }
    return { list, colors };
  }, []);

  const crownRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);
  const cityRef = useRef<THREE.InstancedMesh>(null);
  useInstances(crownRef, trees.crowns, trees.colors);
  useInstances(trunkRef, trees.trunks);
  useInstances(poleRef, lamps.poles);
  useInstances(bulbRef, lamps.bulbs);
  useInstances(cityRef, city.list, city.colors);

  return (
    <group>
      {/* chão */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow raycast={() => null}>
        <circleGeometry args={[900, 48]} />
        <meshStandardMaterial color="#2a2b38" roughness={1} />
      </mesh>
      {/* praça em pedra clara */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow raycast={() => null}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#6d6870" roughness={0.9} />
      </mesh>
      {/* espelho d'água / piscina */}
      <mesh rotation-x={-Math.PI / 2} position={[-25, 0.06, 4]} raycast={() => null}>
        <planeGeometry args={[7, 25]} />
        <meshStandardMaterial color="#163c4a" emissive="#3ba3b3" emissiveIntensity={0.55} roughness={0.08} metalness={0.2} />
      </mesh>
      <instancedMesh ref={trunkRef} args={[box, undefined, trees.trunks.length]} castShadow raycast={() => null}>
        <meshStandardMaterial color="#3a2f2c" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[crownGeo, undefined, trees.crowns.length]} castShadow receiveShadow raycast={() => null}>
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={poleRef} args={[box, undefined, lamps.poles.length]} raycast={() => null}>
        <meshStandardMaterial color="#1d1f28" roughness={0.6} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[lampGeo, undefined, lamps.bulbs.length]} raycast={() => null}>
        <meshStandardMaterial color="#000" emissive="#ffcf8f" emissiveIntensity={6} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={cityRef} args={[box, undefined, city.list.length]} receiveShadow raycast={() => null}>
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
    </group>
  );
}

export function World({ mobile }: { mobile: boolean }) {
  const scene = useThree((s) => s.scene);
  const sunRef = useRef<THREE.DirectionalLight>(null);

  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(SKY.fog, 110, 560);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useLayoutEffect(() => {
    const sun = sunRef.current;
    if (!sun) return;
    sun.target.position.set(0, LAYOUT.roofY * 0.35, 0);
    sun.target.updateMatrixWorld();
  }, []);

  const sunPos = SUN_DIR.clone().multiplyScalar(140);

  return (
    <>
      <SkyDome />
      <hemisphereLight args={['#8d96d0', '#3a2f38', 1.1]} />
      <directionalLight
        ref={sunRef}
        position={sunPos}
        color="#ffb985"
        intensity={2.6}
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={20}
        shadow-camera-far={320}
      />
      {/* luz de preenchimento fria vinda do lado oposto ao sol */}
      <directionalLight position={[60, 40, 80]} color="#9fb0e8" intensity={0.55} />
      <Environment resolution={128} frames={1} background={false}>
        <Lightformer form="rect" intensity={2.2} color="#ffb98a" position={SUN_DIR.clone().multiplyScalar(20).toArray()} scale={[30, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#7e86c4" position={[0, 20, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#c9a7d8" position={[20, 4, 20]} scale={[20, 6, 1]} target={[0, 0, 0]} />
      </Environment>
      <Surroundings />
    </>
  );
}
