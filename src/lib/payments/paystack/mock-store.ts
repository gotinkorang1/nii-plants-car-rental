import "server-only";

export type MockPaystackTransaction = {
  reference: string;
  amount: number;
  currency: string;
  email: string;
  status: "pending" | "success" | "failed";
  transactionId: string;
  channel: string;
  paidAt: string | null;
  metadata?: Record<string, unknown>;
};

const store = new Map<string, MockPaystackTransaction>();

export function mockPaystackStore() {
  return store;
}

export function resetMockPaystackStore() {
  store.clear();
}

export function getMockPaystackTransaction(reference: string) {
  return store.get(reference) ?? null;
}

export function setMockPaystackTransaction(transaction: MockPaystackTransaction) {
  store.set(transaction.reference, transaction);
}

export function markMockPaystackSuccess(reference: string) {
  const existing = store.get(reference);
  if (!existing) {
    return null;
  }
  const updated: MockPaystackTransaction = {
    ...existing,
    status: "success",
    paidAt: new Date().toISOString(),
  };
  store.set(reference, updated);
  return updated;
}
