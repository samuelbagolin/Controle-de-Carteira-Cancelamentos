export interface Product {
  id: string;
  name: string;
  description?: string;
  createdAt: any;
}

export interface MonthlyRecord {
  id: string;
  productId: string;
  date: string; // YYYY-MM
  activeClientsPrevious: number;
  newContracts: number;
  cancellationRequests: number;
  cancelledInMonth: number;
  autoCancellations: number;
  inactivationsInMonth: number;
  totalMRR: number;
  lostMRRCancel: number;
  lostMRRInact: number;
}

export interface DashboardMetrics {
  activeClients: number;
  newContracts: number;
  cancelledInMonth: number;
  autoCancellations: number;
  inactivationsInMonth: number;
  totalMRR: number;
  lostMRRCancel: number;
  lostMRRInact: number;
  churnRate: number;
}
