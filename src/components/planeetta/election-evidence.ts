export const electionEvidence = {
  year: 2023,
  income: [
    { label: 'Pienituloisin viidennes', turnout: 58.4 },
    { label: 'Suurituloisin viidennes', turnout: 85.1 },
  ],
  educationGap: 35.9,
  coverage: 49.1,
  source: 'https://stat.fi/fi/julkaisu/cl8mvt1xt143o0cvzel1m7esx',
  historicalSource: 'https://www.doria.fi/bitstream/handle/10024/176232/xtut_178_dig.pdf?isAllowed=y&sequence=1',
};
export function participationGap() {
  return Math.round((electionEvidence.income[1]!.turnout - electionEvidence.income[0]!.turnout) * 10) / 10;
}
