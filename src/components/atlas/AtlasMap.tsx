import { useMemo } from 'react';
import { connections, layoutNodes, type AtlasData } from '@/lib/atlas-data';

interface Props { data: AtlasData; selected: number; visible: Set<number>; onSelect: (id: number) => void; zoom: number; showLinks: boolean }
export function AtlasMap({ data, selected, visible, onSelect, zoom, showLinks }: Props) {
  const nodes = useMemo(()=>layoutNodes(data),[data]);
  const edges = useMemo(()=>connections(data),[data]);
  const selectedNode = nodes.find(n=>n.theme.id===selected);
  return <svg className="atlas-map" viewBox="0 0 1060 700" role="img" aria-label="Rakennemuutosten kaksiulotteinen teemakartta">
    <defs><pattern id="map-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" className="map-grid-dot"/></pattern></defs>
    <rect width="1060" height="700" fill="url(#map-dots)"/>
    <g transform={`translate(${530*(1-zoom)} ${350*(1-zoom)}) scale(${zoom})`}>
      <g className="group-contours">{([[270,235,195,140],[680,215,165,140],[425,490,195,145],[795,470,155,125]] as [number,number,number,number][]).map(([x,y,rx,ry],i)=><g key={i} className={`theme-color-${i}`}><ellipse cx={x} cy={y} rx={rx} ry={ry} className="contour"/><ellipse cx={x} cy={y} rx={rx+19} ry={ry+18} className="contour outer"/></g>)}</g>
      {showLinks && edges.map(([a,b])=>{
        const from=nodes.find(n=>n.theme.id===a),to=nodes.find(n=>n.theme.id===b);
        if(!from||!to||!visible.has(a)||!visible.has(b))return null;
        const active=a===selected||b===selected;
        return <path key={`${a}-${b}`} d={`M ${from.x} ${from.y} Q ${(from.x+to.x)/2+35} ${(from.y+to.y)/2-65} ${to.x} ${to.y}`} className={`network-edge ${active?'active':''} theme-color-${selectedNode?.group??0}`}/>;
      })}
      {[[270,225,'ARKI & HYVINVOINTI'],[680,205,'TALOUS & TYÖ'],[425,480,'VALTA & OSALLISUUS'],[795,460,'YMPÄRISTÖ & TURVALLISUUS']].map(([x,y,title],i)=><g key={i} className={`theme-color-${i}`}><text x={x} y={y} textAnchor="middle" className="cluster-number">0{i+1}</text><text x={x} y={Number(y)+23} textAnchor="middle" className="cluster-label">{title}</text></g>)}
      {nodes.map(n=>{
        if(!visible.has(n.theme.id)) return null;
        const active=n.theme.id===selected;
        const name=n.theme.name.split(',')[0] ?? n.theme.name;
        return <g key={n.theme.id} className={`map-node theme-color-${n.group} ${active?'selected':''}`} transform={`translate(${n.x},${n.y})`} role="button" tabIndex={0} aria-label={n.theme.name} aria-pressed={active} onClick={()=>onSelect(n.theme.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(n.theme.id)}}}>
          <title>{n.theme.name}</title>{active&&<circle r="20" className="node-halo"/>}<circle r={active?8:5.5} className="node-body"/>{active&&<circle r="3" className="node-core"/>}
          <text y={active?-28:18} textAnchor="middle" className={`node-label ${active?'active':''}`}>{name.length>29?name.slice(0,27)+'…':name}</text>
        </g>;
      })}
    </g>
  </svg>;
}