import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OC } from 'three-stdlib';
import { PLATES, TENSIONS, pathPoints, toLatLon, type Sel } from './planet-model';

const R = 2;
const vec = (x: number, y: number, r = R) => {
  const { lat, lon } = toLatLon(x, y); const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
};
const levelOf = (d: number) => (d > 5.2 ? 0 : d > 3.5 ? 1 : d > 2.7 ? 2 : 3);

function PlateDust() {
  const geo = useMemo(() => {
    const pos: number[] = [], col: number[] = []; const c = new THREE.Color();
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    PLATES.forEach(p => {
      const hue: Record<string, string> = { aine: '#f0a060', vaesto: '#6fe0dc', sopimus: '#86d6a0', paaoma: '#b48cf0' };
      c.set(hue[p.id]);
      for (let i = 0; i < 1400; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.pow(rnd(), 0.6) * p.r * 1.05;
        const v = vec(p.x + Math.cos(a) * rr * 1.0, p.y + Math.sin(a) * rr * 0.85, R + 0.005);
        pos.push(v.x, v.y, v.z); const f = 0.35 + rnd() * 0.65; col.push(c.r * f, c.g * f, c.b * f);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, []);
  return <points geometry={geo}><pointsMaterial size={0.022} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} /></points>;
}

const HUE: Record<string, string> = { aine: '#f0a060', vaesto: '#6fe0dc', sopimus: '#86d6a0', paaoma: '#b48cf0' };

function Rig({ target, ctl, onLevel }: { target: React.MutableRefObject<THREE.Vector3 | null>; ctl: React.RefObject<OC | null>; onLevel: (l: number) => void }) {
  const { camera } = useThree(); const last = useRef(-1);
  useFrame((_, dt) => {
    const t = target.current;
    if (t) { camera.position.lerp(t, 1 - Math.exp(-3 * Math.min(dt, 0.05))); if (camera.position.distanceTo(t) < 0.02) target.current = null; ctl.current?.update(); }
    const l = levelOf(camera.position.length()); if (l !== last.current) { last.current = l; onLevel(l); }
  });
  return null;
}

function Scene({ sel, onSel, level, onLevel }: { sel: Sel; onSel: (s: Sel) => void; level: number; onLevel: (l: number) => void }) {
  const target = useRef<THREE.Vector3 | null>(null); const ctl = useRef<OC>(null);
  const fly = (x: number, y: number, dist: number) => { target.current = vec(x, y).normalize().multiplyScalar(dist); };
  const selA = sel && (sel.kind === 'path' || sel.kind === 'step') ? sel.a.id : null;
  return (
    <>
      <color attach="background" args={['#0b1020']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#ffe8cc" />
      <pointLight position={[-6, -2, -4]} intensity={8} color="#5a7cff" />
      <mesh>
        <sphereGeometry args={[R, 96, 96]} />
        <meshStandardMaterial color="#1f3050" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshBasicMaterial color="#4fa8ff" transparent opacity={0.07} side={THREE.BackSide} />
      </mesh>
      <PlateDust />
      {PLATES.map(p => (
        <group key={p.id}>
          <mesh position={vec(p.x, p.y, R + 0.01)} onClick={e => { e.stopPropagation(); onSel({ kind: 'plate', plate: p }); fly(p.x, p.y, 4.2); }}>
            <sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color={HUE[p.id]} />
          </mesh>
          {level <= 1 && <Html position={vec(p.x, p.y - p.r * 0.75, R + 0.05)} center className="pl-gl-label plate" occlude={false}>{p.name}</Html>}
          {level >= 1 && p.clusters.map(c => (
            <group key={c.id}>
              <mesh position={vec(c.x, c.y, R + 0.015)} onClick={e => { e.stopPropagation(); onSel({ kind: 'cluster', c }); fly(c.x, c.y, 3); }}>
                <sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#fff6e0" />
              </mesh>
              {level <= 2 && <Html position={vec(c.x, c.y - 66, R + 0.04)} center className="pl-gl-label">{c.name}</Html>}
              {level >= 2 && c.anchors.map((a, ai) => {
                const pts = pathPoints(c, ai).map(q => vec(q.x, q.y, R + 0.012));
                return (
                  <group key={a.id}>
                    <Line points={pts} color={HUE[p.id]} lineWidth={selA === a.id ? 3.5 : 1.6} transparent opacity={selA && selA !== a.id ? 0.35 : 1}
                      onClick={e => { e.stopPropagation(); onSel({ kind: 'path', c, a }); }} />
                    {pts.map((v, si) => (
                      <mesh key={si} position={v} onClick={e => { e.stopPropagation(); onSel({ kind: 'step', c, a, s: a.steps[si] }); target.current = v.clone().normalize().multiplyScalar(2.35); }}>
                        <sphereGeometry args={[0.012, 8, 8]} /><meshBasicMaterial color={si === pts.length - 1 ? '#ff9a50' : '#ffffff'} />
                      </mesh>
                    ))}
                    {level >= 3 && pts.map((v, si) => <Html key={'l' + si} position={v} className="pl-gl-step">{a.steps[si].years?.[0]} · {a.steps[si].short_title}</Html>)}
                  </group>
                );
              })}
            </group>
          ))}
        </group>
      ))}
      {level === 0 && TENSIONS.map(t => {
        const a = PLATES.find(p => p.id === t.a)!, b = PLATES.find(p => p.id === t.b)!;
        const pts = Array.from({ length: 24 }, (_, i) => { const f = i / 23; return vec(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, R + 0.02 + Math.sin(f * Math.PI) * 0.12); });
        return (
          <group key={t.id}>
            <Line points={pts} color="#ff9a50" lineWidth={1.4} dashed dashSize={0.05} gapSize={0.05} onClick={e => { e.stopPropagation(); onSel({ kind: 'tension', t }); }} />
            <Html position={pts[12]} center className="pl-gl-label tension">{t.name}</Html>
          </group>
        );
      })}
      <OrbitControls ref={ctl} enablePan={false} minDistance={2.25} maxDistance={8} rotateSpeed={0.5} zoomSpeed={0.7} autoRotate={level === 0 && !sel} autoRotateSpeed={0.4} />
      <Rig target={target} ctl={ctl} onLevel={onLevel} />
    </>
  );
}

export default function PlanetGlobe(props: { sel: Sel; onSel: (s: Sel) => void; level: number; onLevel: (l: number) => void }) {
  return (
    <div className="pl-map">
      <Canvas camera={{ position: [0, 1.2, 6.5], fov: 45 }} dpr={[1, 2]}>
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
