import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PoliticalGate } from './PoliticalGate';
import { gateElectionResults } from './political-gate-data';
import { TimelineProvider } from './timeline-context';
import { SharedTimeline } from './SharedTimeline';
afterEach(cleanup);
it('retains election observations and separates support from government participation',()=>{
 expect(gateElectionResults.map(r=>r.kok)).toEqual([21.7,22.1,23.1]);
 render(<PoliticalGate/>);
 expect(screen.getByRole('img')).toHaveAccessibleName(/Hallitusaseman rivi on luokittelu/);
 expect(screen.getByText(/Kannatuksen kasvu ei yksin määrännyt/)).toBeInTheDocument();
});
it('links the selected event year while preserving the 1981 constitutional and causal limits',()=>{
 render(<TimelineProvider initialYear={1980}><PoliticalGate/></TimelineProvider>);
 expect(screen.getByText(/Näytetään havaintovuosi 1979/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox',{name:'Valitse vaihe'}),{target:{value:'1981'}});
 expect(screen.getByRole('heading',{name:/Huhtikuu 1981: Koivisto kieltäytyy/})).toBeInTheDocument();
 expect(screen.getByText(/samana päivänä tehty perustuslain muutos/)).toBeInTheDocument();
 expect(screen.queryByText(/Näytetään havaintovuosi 1979/)).not.toBeInTheDocument();
});
it('adds a power filter and opens political events on the shared timeline',()=>{
 render(<TimelineProvider><SharedTimeline/></TimelineProvider>);
 fireEvent.change(screen.getByRole('combobox',{name:'Tapahtumien päätöspolku'}),{target:{value:'Valta'}});
 expect(screen.queryByRole('button',{name:/Eriytetyn tuloverotuksen esitys/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Huhtikuu 1981: Koivisto kieltäytyy/}));
 expect(screen.getByRole('slider',{name:/Yhteinen vuosi/})).toHaveAttribute('aria-valuetext','1981');
 fireEvent.click(screen.getByRole('button',{name:/30.4.1987: Kokoomus ja SDP hallitukseen/}));
 expect(screen.getByText(/Koivisto vaikutti hallitusratkaisuun/)).toBeInTheDocument();
});
