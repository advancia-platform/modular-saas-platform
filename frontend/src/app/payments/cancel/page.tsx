export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-blue-50 p-6 text-center">
      <h1 className="text-3xl font-bold text-rose-600">Payment Cancelled</h1>
      <p className="mt-4 max-w-md text-sm text-slate-600">
        No charges were made. You can restart the checkout process whenever you&apos;re ready.
      </p>
    </div>
  );
}
