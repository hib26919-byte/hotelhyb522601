// client/src/hooks/usePayU.js
// Drop-in replacement for useRazorpay.js.
// BookingModal calls `pay(options)` — same interface, just different internals.

import { useState } from "react";
import { initiatePayment } from "../utils/payu";

const usePayU = () => {
  const [processing, setProcessing] = useState(false);

  const pay = async (options) => {
    setProcessing(true);
    try {
      await initiatePayment(options);
      // Note: after initiatePayment the page navigates away to PayU.
      // setProcessing(false) will never run in the success path,
      // but we keep it in finally so the button re-enables if the
      // server call itself fails before the redirect.
    } finally {
      setProcessing(false);
    }
  };

  return { pay, processing };
};

export default usePayU;