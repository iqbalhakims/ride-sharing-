import { randomUUID } from 'crypto';

export async function processPayment(
  amount: number,
  _method: string,
): Promise<{ success: boolean; transactionId: string }> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 200));

  const success = Math.random() < 0.95;
  return {
    success,
    transactionId: success ? `txn_${randomUUID()}` : '',
  };
}
