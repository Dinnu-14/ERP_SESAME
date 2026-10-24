const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('sesame_erp_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('sesame_erp_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('sesame_erp_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      // Clone response before reading to prevent 'body stream already read' error
      const responseClone = response.clone();
      try {
        const errorData = await responseClone.json();
        if (errorData && typeof errorData === 'object') {
          errorDetail = errorData.detail || JSON.stringify(errorData);
        } else if (typeof errorData === 'string') {
          errorDetail = errorData;
        }
      } catch {
        // If JSON parsing fails (e.g., HTML error page or raw text), read the unconsumed original stream as text
        const textData = await response.text();
        if (textData && textData.trim()) {
          errorDetail = textData;
        }
      }
    } catch {
      errorDetail = `Request failed with status ${response.status} (${response.statusText || 'Error'})`;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Locations
  getOrganizations: () => request<any[]>('/locations/organizations'),
  getLocations: () => request<any[]>('/locations'),
  createLocation: (data: any) => request<any>('/locations', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory
  getCategories: () => request<any[]>('/inventory/categories'),
  createCategory: (data: any) => request<any>('/inventory/categories', { method: 'POST', body: JSON.stringify(data) }),
  getProducts: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/inventory/products${q}`);
  },
  createProduct: (data: any) => request<any>('/inventory/products', { method: 'POST', body: JSON.stringify(data) }),
  getBatches: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/inventory/batches${q}`);
  },
  createBatch: (data: any) => request<any>('/inventory/batches', { method: 'POST', body: JSON.stringify(data) }),
  getBalances: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/inventory/balances${q}`);
  },
  getMovements: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/inventory/movements${q}`);
  },
  createAdjustment: (data: any) => request<any>('/inventory/adjustments', { method: 'POST', body: JSON.stringify(data) }),

  // Transfers
  getTransfers: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/transfers${q}`);
  },
  getTransfer: (id: number) => request<any>(`/transfers/${id}`),
  createTransfer: (data: any) => request<any>('/transfers', { method: 'POST', body: JSON.stringify(data) }),
  approveTransfer: (id: number) => request<any>(`/transfers/${id}/approve`, { method: 'POST' }),
  dispatchTransfer: (id: number, data: any) => request<any>(`/transfers/${id}/dispatch`, { method: 'POST', body: JSON.stringify(data) }),
  receiveTransfer: (id: number, data: any) => request<any>(`/transfers/${id}/receive`, { method: 'POST', body: JSON.stringify(data) }),

  // Production
  getProductionBatches: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/production/batches${q}`);
  },
  startProduction: (data: any) => request<any>('/production/batches', { method: 'POST', body: JSON.stringify(data) }),
  completeProduction: (id: number, data: any) => request<any>(`/production/batches/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),

  // Procurement
  getSuppliers: () => request<any[]>('/procurement/suppliers'),
  createSupplier: (data: any) => request<any>('/procurement/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  getPurchaseOrders: () => request<any[]>('/procurement/purchase-orders'),
  createPurchaseOrder: (data: any) => request<any>('/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  getGoodsReceipts: () => request<any[]>('/procurement/goods-receipts'),
  createGoodsReceipt: (data: any) => request<any>('/procurement/goods-receipts', { method: 'POST', body: JSON.stringify(data) }),

  // Franchise
  getFranchiseExtractions: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/franchise/extractions${q}`);
  },
  createFranchiseExtraction: (data: any) => request<any>('/franchise/extractions', { method: 'POST', body: JSON.stringify(data) }),
  getFranchiseSales: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/franchise/sales${q}`);
  },
  createFranchiseSale: (data: any) => request<any>('/franchise/sales', { method: 'POST', body: JSON.stringify(data) }),
  getReplenishments: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/franchise/replenishments${q}`);
  },
  createReplenishment: (data: any) => request<any>('/franchise/replenishments', { method: 'POST', body: JSON.stringify(data) }),

  // B2B
  getB2BCustomers: () => request<any[]>('/b2b/customers'),
  createB2BCustomer: (data: any) => request<any>('/b2b/customers', { method: 'POST', body: JSON.stringify(data) }),
  getB2BOrders: () => request<any[]>('/b2b/orders'),
  createB2BOrder: (data: any) => request<any>('/b2b/orders', { method: 'POST', body: JSON.stringify(data) }),
  dispatchB2BOrder: (id: number) => request<any>(`/b2b/orders/${id}/dispatch`, { method: 'POST' }),
  getB2BInvoices: () => request<any[]>('/b2b/invoices'),
  recordB2BPayment: (invoiceId: number, data: any) => request<any>(`/b2b/invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(data) }),

  // Wastage
  getWastage: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/wastage${q}`);
  },
  createWastage: (data: any) => request<any>('/wastage', { method: 'POST', body: JSON.stringify(data) }),
  approveWastage: (id: number) => request<any>(`/wastage/${id}/approve`, { method: 'POST' }),

  // Employees
  getEmployees: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/employees${q}`);
  },
  createEmployee: (data: any) => request<any>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  recordAttendance: (data: any) => request<any>('/employees/attendance', { method: 'POST', body: JSON.stringify(data) }),

  // SOPs
  getSOPs: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/sops${q}`);
  },
  createSOP: (data: any) => request<any>('/sops', { method: 'POST', body: JSON.stringify(data) }),
  acknowledgeSOP: (sopId: number, data: any) => request<any>(`/sops/${sopId}/acknowledge`, { method: 'POST', body: JSON.stringify(data) }),

  // Reports & Dashboard
  getDashboardData: () => request<any>('/reports/dashboard'),

  // Audit & Notifications
  getAuditLogs: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/audit/logs${q}`);
  },
  getNotifications: () => request<any[]>('/audit/notifications'),
  markNotificationRead: (id: number) => request<any>(`/audit/notifications/${id}/read`, { method: 'POST' }),
};
