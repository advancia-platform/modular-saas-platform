import PaymentButton from "@/components/PaymentButton";

interface PaymentExampleProps {
  feature: string;
  amount: number;
  currency: string;
  orderId: string;
}

export default function PaymentExample({
  feature,
  amount,
  currency,
  orderId,
}: PaymentExampleProps) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-center">
        {feature} - ${amount} {currency.toUpperCase()}
      </h3>

      <div className="mb-4 text-sm text-gray-600 text-center">
        Order ID:{" "}
        <code className="bg-gray-100 px-2 py-1 rounded">{orderId}</code>
      </div>

      <PaymentButton
        orderId={orderId}
        amount={amount}
        currency={currency}
        description={`${feature} purchase`}
        onSuccess={() => {
          console.log("Payment initiated successfully");
        }}
        onError={(error) => {
          console.error("Payment error:", error);
        }}
      />

      <div className="mt-4 text-xs text-gray-500 text-center">
        Choose your preferred payment method above
      </div>
    </div>
  );
}

// Example usage in different features:

// 1. Subscription upgrade
// <PaymentExample feature="Premium Subscription" amount={29.99} currency="usd" orderId="sub_12345" />

// 2. Token purchase
// <PaymentExample feature="Token Pack (1000 ADVP)" amount={9.99} currency="usd" orderId="token_67890" />

// 3. Crypto top-up
// <PaymentExample feature="USDT Top-up" amount={50.00} currency="usdt" orderId="crypto_11111" />

// 4. Service purchase
// <PaymentExample feature="Consultation Session" amount={99.00} currency="usd" orderId="service_22222" />
