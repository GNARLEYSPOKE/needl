export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}

export interface BillingService {
  getOrCreateCustomer(
    email: string,
    name: string,
  ): Promise<{ data: { customerId: string } | null; error: string | null }>;
  createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<{ data: { subscriptionId: string } | null; error: string | null }>;
  cancelSubscription(subscriptionId: string): Promise<{ data: null; error: string | null }>;
}
