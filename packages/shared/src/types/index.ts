export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'INVENTORY_OPERATOR' | 'PRODUCTION_OPERATOR' | 'VIEWER';

export interface IUser {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
}

export type MaterialCode = 'PP' | 'LL' | 'FILLER';

export interface IMaterial {
  _id: string;
  code: MaterialCode;
  name: string;
  unit: string;
  bagWeightKg: number;
  currentStockKg: number;
}

export interface PurchaseLineItem {
  materialCode: MaterialCode;
  weightKg: number;
  qtyBags: number;
  pricePerKg: number;
  amount: number;
}

export interface IPurchase {
  _id: string;
  billNo: number;
  billDate: string; // YYYY-MM-DD or DD-MM-YYYY
  uniqueId: string; // e.g. 10062001
  items: PurchaseLineItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface IInventoryBalance {
  _id?: string;
  itemCode: 'PP' | 'LL' | 'FILLER' | 'TOTAL_SCRAP' | 'SCRAP_IN_WIP' | 'REMAINING_MIXTURE';
  currentStock: number;
  unit: string;
  updatedAt: string;
}

export type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'MIXTURE_CONSUMPTION'
  | 'SCRAP_ALLOCATED'
  | 'SCRAP_GENERATED'
  | 'MIXTURE_PRODUCED'
  | 'MIXTURE_USED_IN_FG'
  | 'WIP_OUT_CLOSING'
  | 'REMAINING_CARRY_FORWARD';

export interface IStockMovement {
  _id: string;
  movementType: MovementType;
  itemCode: string;
  quantity: number;
  unit: string;
  referenceId?: string;
  referenceType?: string;
  date: string;
  user?: string;
  notes?: string;
  createdAt: string;
}

export interface IWipBatch {
  _id: string;
  batchNo: number; // S_no
  batchDate: string;
  ppUsedKg: number;
  llUsedKg: number;
  fillerUsedKg: number;
  newMixtureKg: number; // PP + LL + FILLER
  openingStockKg: number; // Carried from previous WIP_OUT
  scrapAddedKg: number; // Allocated from Scrap in WIP
  totalMixtureKg: number; // newMixture + openingStock + scrapAdded
  status: 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

export interface IScrapTransaction {
  _id: string;
  transactionDate: string;
  type: 'ALLOCATED_TO_WIP' | 'GENERATED_FROM_WIP_OUT';
  quantityKg: number;
  batchNo?: number;
  notes?: string;
  createdAt: string;
}

export interface IProduct {
  _id: string;
  name: string;
  weightGrams: number;
  category?: string;
  isActive: boolean;
}

export interface IFinishedGoodsEntry {
  _id: string;
  serialNo: number; // S_no
  fgDate: string;
  batchNo: number;
  totalMixturePrepKg: number;
  productName: string;
  itemWeightGrams: number;
  piecesProduced: number;
  totalMixtureUsedKg: number; // (pieces * itemWeight) / 1000
  createdAt: string;
}

export interface IWipOutEntry {
  _id: string;
  serialNo: number; // S_no
  wipOutDate: string;
  batchNo: number;
  totalMixturePrepKg: number;
  totalMixtureUsedKg: number;
  scrapLeftKg: number;
  wastageKg: number;
  remainingMixtureKg: number; // totalMixturePrep - totalMixtureUsed
  carriedForward: boolean;
  createdAt: string;
}

// Dashboards
export interface HomeOverviewKPIs {
  totalScrapKg: number;
  totalWastageKg: number;
  remainingMixtureKg: number;
  totalFinishGoodsPieces: number;
}

export interface RawMaterialDashboardData {
  kpis: {
    totalMixturePrepared: number;
    totalMixtureUsedToday: number;
    remainingMixtureToday: number;
    openingStock: number;
    closingStock: number;
  };
  currentStock: {
    PP: number;
    LL: number;
    FILLER: number;
  };
  cumulativeUsage: {
    PP: number;
    LL: number;
    FILLER: number;
  };
  rawMaterialReport: {
    sNo: number;
    mixtureDate: string;
    ppKg: number;
    llKg: number;
    fillerKg: number;
    mixtureKg: number;
    openingStockKg: number;
    totalMixtureKg: number;
  }[];
}

export interface WipProgressDashboardData {
  kpis: {
    todayTotalMixturePrepared: number;
    openingStock: number;
    wastage: number;
    todayScrapUsed: number;
    scrapLeftToday: number;
    totalMixtureUsedToday: number;
    remainingMixtureToday: number;
  };
  last7DaysMixture: {
    date: string;
    mixturePrepared: number;
    mixtureUsed: number;
  }[];
  mixtureBreakdown: {
    ppPercent: number;
    llPercent: number;
    fillerPercent: number;
    ppKg: number;
    llKg: number;
    fillerKg: number;
  };
  wipInReport: {
    sNo: number;
    mixtureDate: string;
    ppKg: number;
    llKg: number;
    fillerKg: number;
    mixtureKg: number;
    openingStockKg: number;
    totalMixtureKg: number;
  }[];
  wipOutReport: {
    sNo: number;
    wipOutDate: string;
    totalMixturePrepKg: number;
    totalMixtureUsedKg: number;
    scrapLeftKg: number;
    wastageKg: number;
    remainingMixtureKg: number;
  }[];
}

export interface FinishedGoodsDashboardData {
  kpis: {
    totalFinishGoods: number;
    todayScrap: number;
    todayFinishGoods: number;
    avgMixPerPieceGrams: number;
  };
  typeVsQuantity: {
    productName: string;
    pieces: number;
  }[];
  mixtureUsagePercentByItem: {
    productName: string;
    mixtureUsedKg: number;
    percentage: number;
  }[];
  overviewTable: {
    sNo: number;
    fgDate: string;
    totalMixtureKg: number;
    productName: string;
    itemWeightGrams: number;
    piecesProduced: number;
    totalMixtureUsedKg: number;
  }[];
}
