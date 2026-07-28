export const PAYSTACK_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAYSTACK_KEY || "pk_test_e58c19239890c021e8d0f7b6ded1cc22d4fa7982";

export function loadPaystackScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).PaystackPop) {
      resolve(true);
      return;
    }
    const existing = document.getElementById("paystack-inline-js");
    if (existing) {
      if ((window as any).PaystackPop) {
        resolve(true);
      } else {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => resolve(false));
      }
      return;
    }
    const script = document.createElement("script");
    script.id = "paystack-inline-js";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface PaystackTransactionOptions {
  email: string;
  amount: number; // Amount in pesewas (e.g., 2000 = GH₵ 20.00)
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export async function openPaystackPopup(options: PaystackTransactionOptions): Promise<boolean> {
  const loaded = await loadPaystackScript();
  if (!loaded) {
    console.error("Failed to load Paystack inline JS SDK");
    return false;
  }

  const PaystackPop = (window as any).PaystackPop;
  if (!PaystackPop) {
    console.error("PaystackPop is undefined on window object");
    return false;
  }

  const ref = "NSS_" + Math.floor(Math.random() * 1000000000 + 1);

  try {
    if (typeof PaystackPop.setup === "function") {
      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: options.email,
        amount: options.amount,
        currency: "GHS",
        ref,
        callback: (response: any) => {
          options.onSuccess(response.reference || response.trxref || ref);
        },
        onClose: () => {
          options.onClose();
        },
      });
      handler.openIframe();
      return true;
    } else {
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: options.email,
        amount: options.amount,
        currency: "GHS",
        ref,
        onSuccess: (transaction: any) => {
          options.onSuccess(transaction.reference || ref);
        },
        onCancel: () => {
          options.onClose();
        },
      });
      return true;
    }
  } catch (err) {
    console.error("Paystack Popup initialization error:", err);
    return false;
  }
}
