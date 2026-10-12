// @aco/retailers — Abstract RetailerAdapter

import type { CartItem, CheckoutResult } from "./types.js";

export abstract class RetailerAdapter {
  abstract readonly name: string;
  abstract readonly baseUrl: string;

  abstract addToCart(item: CartItem): Promise<void>;
  abstract fillShipping(): Promise<void>;
  abstract fillPayment(): Promise<void>;
  abstract submitOrder(): Promise<CheckoutResult>;
}
