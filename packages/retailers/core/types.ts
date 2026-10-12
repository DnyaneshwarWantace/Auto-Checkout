// @aco/retailers — Core types

export interface CartItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  url: string;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  retailer: string;
  totalPrice?: number;
  error?: string;
  timestamp: Date;
}
