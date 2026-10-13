import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SsabComparison } from './SsabComparison';
import { combinedBaselineTotal, ssabComparison } from './ssab-comparison-data';
afterEach(cleanup);
it('uses both pre-merger companies without mixing annual average and year-end Finland figures',()=>{
 expect(combinedBaselineTotal).toBe(17312);
 expect(ssabComparison.baseline.ssabFinland).toBeNull();
 render(<SsabComparison/>);
 expect(screen.getByText(/Sitä ei lisätä Rautaruukin lukuun/)).toBeInTheDocument();
 expect(screen.getByText(/Suomen osuuden muutoksen suuntaa/)).toBeInTheDocument();
 expect(screen.getByText(/ei siis tarkoita julkisen omistuksen loppumista/)).toBeInTheDocument();
 expect(screen.getByRole('img')).toHaveAccessibleName(/Suomen vuoden 2013 yhteisluku puuttuu/);
});
