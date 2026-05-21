// server/routes/payment.js
// PayU integration — replaces the old Razorpay order/verify routes.
//
// PayU works differently from Razorpay:
//   • There is NO server-side "create order" step.
//   • The server builds a SHA-512 hash from the payment params and
//     sends them back to the client.  The client then POSTs a form
//     directly to PayU's payment page.
//   • After payment, PayU POSTs back to surl (success) or furl (failure).
//     These MUST be server endpoints because PayU sends a POST, not a GET.
//     The server then redirects the browser to the client with ?status=
//
// ENV vars required (add to server/.env):
//   PAYU_MERCHANT_KEY   – your PayU merchant key  (e.g. "gtKFFx")
//   PAYU_MERCHANT_SALT  – your PayU salt           (e.g. "eCwWELxi")
//   PAYU_MODE           – "test" | "production"
//   SERVER_URL          – this server's public URL  (e.g. "http://localhost:5000")
//   CLIENT_URL          – the React app URL         (e.g. "http://localhost:5173")

const crypto  = require("crypto");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

const PAYU_TEST_URL = "https://test.payu.in/_payment";
const PAYU_PROD_URL = "https://secure.payu.in/_payment";

function payuUrl() {
  return process.env.PAYU_MODE === "production" ? PAYU_PROD_URL : PAYU_TEST_URL;
}

// SHA-512 hash as required by PayU.
// Formula: SHA512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
function buildHash({ key, txnid, amount, productinfo, firstname, email, salt }) {
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

// POST /api/payment/initiate
// Body: { amount, bookingId, userName, userEmail, userPhone }
// Returns: { payuUrl, params } — the client uses these to POST a form to PayU.
router.post("/initiate", (request, response) => {
  try {
    const { amount, bookingId, userName, userEmail, userPhone } = request.body;

    if (!amount || !userName || !userEmail) {
      return response.status(400).json({ message: "amount, userName, and userEmail are required." });
    }

    const key         = process.env.PAYU_MERCHANT_KEY;
    const salt        = process.env.PAYU_MERCHANT_SALT;
    const txnid       = bookingId || uuidv4();
    const amountStr   = Number(amount).toFixed(2);
    const productinfo = `Booking #${txnid.slice(0, 8)}`;
    const firstname   = userName.split(" ")[0];

    // surl and furl MUST point to the Express server (POST endpoints).
    // The server will redirect the browser to the React client after handling.
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    const surl = `${serverUrl}/api/payment/success`;
    const furl = `${serverUrl}/api/payment/failure`;

    const hash = buildHash({
      key, txnid, amount: amountStr,
      productinfo, firstname, email: userEmail, salt,
    });

    const params = {
      key,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email: userEmail,
      phone: userPhone || "",
      surl,
      furl,
      hash,
    };

    return response.json({ payuUrl: payuUrl(), params });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to initiate PayU payment." });
  }
});

// POST /api/payment/success
// PayU POSTs here after successful payment.
// We redirect the browser to the React client with ?status=success
router.post("/success", (request, response) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  // Pass txnid so the client can look up the booking
  const { txnid = "", mihpayid = "" } = request.body;
  return response.redirect(
    `${clientUrl}/booking?status=success&txnid=${txnid}&mihpayid=${mihpayid}`
  );
});

// POST /api/payment/failure
// PayU POSTs here after failed/cancelled payment.
router.post("/failure", (request, response) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const { txnid = "" } = request.body;
  return response.redirect(
    `${clientUrl}/booking?status=failure&txnid=${txnid}`
  );
});

// POST /api/payment/verify
// Body: the full PayU callback body (all fields PayU POSTed to surl/furl)
// Returns: { success: true|false }
router.post("/verify", (request, response) => {
  try {
    const {
      status,
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      mihpayid,
      hash: receivedHash,
    } = request.body;

    const salt = process.env.PAYU_MERCHANT_SALT;

    // Reverse hash formula for verification:
    // SHA512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
    const reverseString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const expectedHash  = crypto.createHash("sha512").update(reverseString).digest("hex");

    const success = receivedHash === expectedHash && status === "success";

    return response.json({ success, mihpayid, txnid });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to verify PayU payment." });
  }
});

module.exports = router;