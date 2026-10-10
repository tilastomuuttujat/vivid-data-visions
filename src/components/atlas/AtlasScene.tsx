import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Environment, Lightformer, Html } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { connections, layoutNodes, type AtlasData } from '@/lib/atlas-data';

interface Props { data: AtlasData; selected: number; visible: Set<number>; onSelect: (id: number) => void; zoom: number; showLinks: boolean; reset: number }
function CameraReset({ reset, zoom }: { reset: number; zoom: number }) {
  const { camera } = useThree();
  useEffect(()=>{ camera.position.set(0,13/zoom,17/zoom); camera.lookAt(0,0,0); camera.updateProjectionMatrix(); },[camera,reset,zoom]);
  return null;
}
function Nodes({ data, selected, visible, onSelect, showLinks, palette }: Props & { palette: string[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const nodes = useMemo(()=>layoutNodes(data).filter(n=>visible.has(n.theme.id)).map(n=>({...n,p: new THREE.Vector3((n.x-530)/38,n.group*.65+.35,(n.y-350)/38)})),[data,visible]);
  const edges = useMemo(()=>connections(data),[data]);
  const dummy = useMemo(()=>new THREE.Object3D(),[]);
  useEffect(()=>{
    if(!mesh.current)return;
    nodes.forEach((n,i)=>{dummy.position.copy(n.p); dummy.scale.setScalar(n.theme.id===selected?.24:.13); dummy.updateMatrix(); mesh.current?.setMatrixAt(i,dummy.matrix);mesh.current?.setColorAt(i,new THREE.Color(palette[n.group]));});
    mesh.current.instanceMatrix.needsUpdate=true;
    if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;
  },[nodes,selected,palette,dummy]);
  return <>
    <instancedMesh ref={mesh} args={[undefined,undefined,nodes.length]} onClick={e=>{e.stopPropagation(); const n=nodes[e.instanceId??-1];if(n)onSelect(n.theme.id)}}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial roughness={.28} metalness={.2}/></instancedMesh>
    {showLinks&&edges.map(([a,b])=>{
      const from=nodes.find(n=>n.theme.id===a),to=nodes.find(n=>n.theme.id===b);if(!from||!to)return null;
      const active=a===selected||b===selected;
      const mid=from.p.clone().lerp(to.p,.5);mid.y+=active?2.5:1.2;
      const points=new THREE.QuadraticBezierCurve3(from.p,mid,to.p).getPoints(25);
      return <Line key={`${a}-${b}`} points={points} color={palette[active?from.group:4]} lineWidth={active?2:1} transparent opacity={active?.85:.22}/>;
    })}
    {nodes.map(n=><Html key={n.theme.id} position={[n.p.x,n.p.y+.4,n.p.z]} center zIndexRange={[3,0]}><button className={`scene-label theme-color-${n.group} ${selected===n.theme.id?'selected':''}`} onClick={()=>onSelect(n.theme.id)}>{n.theme.name.split(',')[0].slice(0,29)}</button></Html>)}
    {[[270,235],[680,215],[425,490],[795,470]].map(([x,z],i)=><group key={i} position={[(x-530)/38,i*.65-.05,(z-350)/38]}><mesh rotation-x={-Math.PI/2}><ringGeometry args={[2.8,2.82,80]}/><meshBasicMaterial color={palette[i]} transparent opacity={.24} side={THREE.DoubleSide}/></mesh><Html center position={[0,.05,0]} zIndexRange={[1,0]}><span className={`scene-cluster theme-color-${i}`}>0{i+1}</span></Html></group>)}
  </>;
}
export function AtlasScene(props: Props) {
  const [palette,setPalette]=useState<string[]|null>(null);
  useEffect(()=>{
    const s=getComputedStyle(document.documentElement), canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    setPalette(['--family-0','--family-1','--family-2','--family-3','--muted-foreground','--map-background'].map(p=>{ctx.fillStyle=s.getPropertyValue(p).trim();ctx.fillRect(0,0,1,1);const [r,g,b]=ctx.getImageData(0,0,1,1).data;return `rgb(${r},${g},${b})`;}));
  },[]);
  if(!palette)return <div className="scene-loading">Atlas avautuu…</div>;
  return <Canvas dpr={[1,1.5]} camera={{position:[0,13,17],fov:48}} gl={{antialias:true}}>
    <color attach="background" args={[palette[5]]}/><ambientLight intensity={.8}/><directionalLight position={[3,14,8]} intensity={2}/>
    <Environment resolution={64}><Lightformer intensity={2} position={[0,8,0]} rotation-x={Math.PI/2} scale={[20,20,1]}/></Environment>
    <gridHelper args={[32,32,palette[4],palette[4]]} position-y={-.3} material-transparent material-opacity={.1}/>
    <Nodes {...props} palette={palette}/><CameraReset reset={props.reset} zoom={props.zoom}/>
    <OrbitControls makeDefault enableDamping dampingFactor={.1} minDistance={8} maxDistance={40} maxPolarAngle={Math.PI/2.1} target={[0,1,0]}/>
  </Canvas>;
}