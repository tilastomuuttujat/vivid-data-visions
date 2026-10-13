export const storaSnapshots = [
  { year: 1998, finland: 15601, total: 40679, basis: 'Vuoden keskimääräinen henkilöstö', page: 'Painettu s. 47, PDF-sivu 49', source: 'https://web.lib.aalto.fi/fi/old/yrityspalvelin/pdf/1998/estrorae.pdf' },
  { year: 2018, finland: 6470, total: 25880, basis: 'Vuoden lopun headcount, rajattu vastuullisuusraportointi', page: 'Sustainability s. 21, koko PDF:n sivu 70', source: 'https://www.storaenso.com/-/media/documents/download-center/documents/annual-reports/2018/storaenso_annual_report_2018.pdf' },
];
export function snapshotShare(s: typeof storaSnapshots[number]) { return s.finland / s.total * 100; }
