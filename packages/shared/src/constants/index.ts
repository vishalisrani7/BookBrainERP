export const COMPANY_DETAILS = {
  name: 'BookBrain Pvt Ltd',
  address: 'Plot No. 36, 37 Sector-C, Behind Padmini Resort, Hatundi Road, Badgaon, Ajmer 305001',
  mobile: '7014638667',
  appTitle: 'BookBrain Manufacturing WIP & Inventory System',
};

export const RAW_MATERIALS = [
  { code: 'PP', name: 'Polypropylene (PP)', unit: 'kg', bagWeightKg: 25 },
  { code: 'LL', name: 'Linear Low-density Polyethylene (LL)', unit: 'kg', bagWeightKg: 25 },
  { code: 'FILLER', name: 'Filler Compound', unit: 'kg', bagWeightKg: 25 },
] as const;

export const DEFAULT_PRODUCTS = [
  { name: 'NONE', weightGrams: 0, category: 'GENERAL', isActive: false },
  { name: 'ZIGZAG 80 MM ISI', weightGrams: 190, category: 'ISI', isActive: true },
  { name: 'DUMBELL 80 MM ISI', weightGrams: 190, category: 'ISI', isActive: true },
  { name: 'ZIGZAG 60 MM ISI', weightGrams: 150, category: 'ISI', isActive: true },
  { name: 'DUMBELL 60 MM ISI', weightGrams: 150, category: 'ISI', isActive: true },
  { name: 'ZIGZAG 80 MM BIKHRI', weightGrams: 200, category: 'BIKHRI', isActive: true },
  { name: 'DUMBELL 80 MM BIKHRI', weightGrams: 200, category: 'BIKHRI', isActive: true },
  { name: 'ZIGZAG 60 MM BIKHRI', weightGrams: 160, category: 'BIKHRI', isActive: true },
  { name: 'DUMBELL 60 MM BIKHRI', weightGrams: 160, category: 'BIKHRI', isActive: true },
  { name: 'HEXAGON', weightGrams: 190, category: 'PAVER', isActive: true },
  { name: 'HEXAGON BHIKRI', weightGrams: 190, category: 'BIKHRI', isActive: true },
  { name: 'TRISTAR', weightGrams: 190, category: 'PAVER', isActive: true },
  { name: 'TRISTAR BHIKRI', weightGrams: 190, category: 'BIKHRI', isActive: true },
];

export const REPORT_TYPES = [
  { id: 'purchases', title: 'Raw Material Purchase Report', description: 'Log of raw material receipts (PP, LL, Filler), bag counts and invoice amounts' },
  { id: 'purchase-stock-used', title: 'Raw Material Purchase Stock Used Report', description: 'Cumulative tracking of purchased raw materials consumed in mixture batches' },
  { id: 'wip-in', title: 'WIP IN Report', description: 'Batch-wise mixture preparation details including raw materials, opening stock, and scrap' },
  { id: 'scrap', title: 'Scrap Report', description: 'Comprehensive scrap generation, balance and reuse ledger across batches' },
  { id: 'mixture', title: 'Mixture Report', description: 'Detailed preparation vs consumption metrics for all mixture batches' },
  { id: 'closing', title: 'Closing Report', description: 'Closing mixture balances, wastage records and carry-forward opening stocks' },
  { id: 'finished-goods', title: 'Finished Goods Report', description: 'Production volume, piece counts, product item weights and mixture consumption' },
  { id: 'wip-out', title: 'WIP OUT Report', description: 'Batch closing dispatches, scrap left in stock, wastage and remaining mixture' },
] as const;
