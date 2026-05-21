// client/src/utils/payu.js
// Replaces razorpay.js.
//
// PayU does NOT use a JS SDK loaded at runtime.
// The flow is a standard HTML form POST to PayU's payment page.
// Steps:
//   1. Call our backend  POST /api/payment/initiate  to get the signed params.
//   2. Dynamically create a hidden <form> and POST it to PayU's payment URL.
//   3. PayU redirects the user back to surl (success) or furl (failure).
//   4. The landing page reads ?status= from the URL, then calls
//      POST /api/payment/verify  with the PayU response body to confirm the hash.

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

/**
 * Initiates a PayU payment.
 *
 * @param {object} options
 * @param {number}   options.amount      - Total amount in INR (e.g. 3500)
 * @param {string}   options.bookingId   - Firestore booking doc ID
 * @param {string}   options.userName    - Guest's full name
 * @param {string}   options.userEmail   - Guest's email
 * @param {string}   options.userPhone   - Guest's phone
 * @param {Function} options.onFailure   - Called if the server call fails before redirect
 */
export const initiatePayment = async ({
  amount,
  bookingId,
  userName,
  userEmail,
  userPhone,
  onFailure,
}) => {
  let payuUrl, params;

  try {
    const res = await fetch(`${SERVER_URL}/api/payment/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, bookingId, userName, userEmail, userPhone }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Server error while initiating payment.");
    }

    const data = await res.json();
    payuUrl = data.payuUrl;
    params  = data.params;
  } catch (error) {
    onFailure?.(error);
    return;
  }

  // Build a hidden form and submit it — this is the correct way to use PayU.
  const form = document.createElement("form");
  form.method  = "POST";
  form.action  = payuUrl;
  form.style.display = "none";

  Object.entries(params).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type  = "hidden";
    input.name  = name;
    input.value = value ?? "";
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  // Page will navigate away — no further JS runs after this line.
};

/**
 * Verifies a PayU callback on the client side by asking the server to
 * re-compute the hash.  Call this from your /booking page when
 * ?status=success appears in the URL.
 *
 * PayU appends all payment params as POST body fields to your surl/furl.
 * Since a redirect lands as a GET in the browser, you'll need to read the
 * fields from sessionStorage (set by the form-submit flow) or use a server
 * route as surl/furl that then redirects to the client with a token.
 *
 * Simplest approach: point surl/furl at the client URL (as done in payment.js),
 * then call this function with the query params PayU appends.
 *
 * @param {object} payuResponse - The key/value pairs PayU sent to surl/furl
 * @returns {Promise<{ success: boolean, mihpayid: string, txnid: string }>}
 */
export const verifyPayment = async (payuResponse) => {
  const res = await fetch(`${SERVER_URL}/api/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payuResponse),
  });

  if (!res.ok) {
    throw new Error("Payment verification request failed.");
  }

  return res.json(); // { success, mihpayid, txnid }
};