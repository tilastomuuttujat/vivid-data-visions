export const ssabSources = {
 ssab2013: 'https://mb.cision.com/Main/980/9555836/223475.pdf',
 ruukki2013: 'https://www.ssab.com/-/media/855C6C68E599462F912FA957DE612028.ashx',
 ssab2024: 'https://www.ssab.com/-/media/files/company/investors/annual-reports/2024/ssab_annual_report_2024.pdf?m=20250320120634',
 transfer: 'https://www.solidium.fi/tiedotteet/solidium-oy-n-osakkeenomistajan-paatos-paaoman-palautuksesta/',
 investment: 'https://www.ssab.com/en/news/2024/04/ssab-continues-the-transformation-with-a-fossilfree-minimill-in-lule-sweden',
};
// Year-end observations. SSAB's 111 Finland employees in 2013 are an annual
// working-hours-based average and must not be added to Ruukki's year-end figure.
export const ssabComparison = {
 baseline: {year:2013, ssabTotal:8712, ruukkiTotal:8600, ruukkiFinland:5218, ssabFinland:null},
 later: {year:2024, total:15263, finland:4777, stateShares:6.5, stateVotes:8.3},
};
export const combinedBaselineTotal = ssabComparison.baseline.ssabTotal + ssabComparison.baseline.ruukkiTotal;
