import { Product, Manufacturer, Review, StatsData, User } from '../types.js';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('foodlens_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    return data;
  },

  async register(name: string, email: string, password: string, role: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Not authenticated');
    return data;
  },

  // Products
  async getProducts(filters?: { category?: string; brand?: string; complianceStatus?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.complianceStatus) params.append('complianceStatus', filters.complianceStatus);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());

    const url = `${API_BASE}/products${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProductById(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  async getProductByBarcode(barcode: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/barcode/${barcode}`);
    if (!res.ok) throw new Error('Product not found for barcode ' + barcode);
    return res.json();
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add product');
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product');
    return data;
  },

  // Scanning
  async scanBarcode(barcode: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/scan/barcode`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ barcode })
    });
    if (!res.ok) throw new Error('Barcode scan failed');
    return res.json();
  },

  async scanUpload(images: { slot: string; dataUrl?: string }[], fallbackHint?: string): Promise<{ product: Product; analysis: unknown }> {
    const res = await fetch(`${API_BASE}/scan/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ images, fallbackHint })
    });
    if (!res.ok) throw new Error('Image scan failed');
    return res.json();
  },

  // Manufacturers
  async getManufacturers(): Promise<Manufacturer[]> {
    const res = await fetch(`${API_BASE}/manufacturers`);
    if (!res.ok) throw new Error('Failed to fetch manufacturers');
    return res.json();
  },

  async getManufacturerById(id: string): Promise<Manufacturer> {
    const res = await fetch(`${API_BASE}/manufacturers/${id}`);
    if (!res.ok) throw new Error('Manufacturer not found');
    return res.json();
  },

  // Reviews
  async getReviews(productId: string): Promise<Review[]> {
    const res = await fetch(`${API_BASE}/reviews?productId=${productId}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  async postReview(productId: string, rating: number, text: string, pros: string, cons: string, authorName?: string): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, rating, text, pros, cons, authorName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit review');
    return data;
  },

  // Seller Pre-Listing Verification
  async verifySellerListing(payload: { slots: Record<string, boolean>; productName?: string; brand?: string; mrp?: string; netQty?: string }): Promise<{
    verdict: 'PASS' | 'WARNING' | 'FAIL';
    title: string;
    sub: string;
    checks: { label: string; status: string }[];
  }> {
    const res = await fetch(`${API_BASE}/seller/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Verification failed');
    return res.json();
  },

  // Stats
  async getStats(): Promise<StatsData> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Real-time updates subscription via SSE
  subscribeToUpdates(onUpdate: (event: string, data: unknown) => void): () => void {
    if (typeof EventSource === 'undefined') return () => {};

    const eventSource = new EventSource(`${API_BASE}/realtime/updates`);

    const handler = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        onUpdate(e.type || 'message', payload);
      } catch (err) {
        console.error('Error parsing SSE payload:', err);
      }
    };

    eventSource.addEventListener('product:added', handler);
    eventSource.addEventListener('product:updated', handler);
    eventSource.addEventListener('review:added', handler);
    eventSource.addEventListener('scan:logged', handler);

    eventSource.onerror = () => {
      // SSE error handled silently or reconnects automatically
    };

    return () => {
      eventSource.close();
    };
  }
};
