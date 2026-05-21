// server/routes/webhook.js
// PayU posts payment results to the surl (success) and furl (failure) URLs
// you configure in /api/payment/initiate.  If you point both surl and furl
// to your own server endpoints instead of directly to the client, handle
// them here.  If surl/furl point straight to the client (the default in
// payment.js above), you don't need these routes — the client handles the
// redirect and calls POST /api/payment/verify itself.
//
// These routes are provided in case you want a server-side callback.

const crypto = require("crypto");
const express = require("express");

const router = express.Router();

function verifyPayuHash(body, salt) {
  const {
    status, key, txnid, amount,
    productinfo, firstname, email, hash,
  } = body;

  const reverseString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const expected = crypto.createHash("sha512").update(reverseString).digest("hex");
  return expected === hash;
}

// POST /api/webhook/payu
router.post("/payu", (request, response) => {
  try {
    const salt = process.env.PAYU_MERCHANT_SALT;

    if (!verifyPayuHash(request.body, salt)) {
      return response.status(400).json({ message: "Invalid PayU webhook signature." });
    }

    // Add your server-side post-payment logic here if needed
    // (e.g. update Firestore via Admin SDK, send email, etc.)

    return response.json({ received: true });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Webhook processing failed." });
  }
});

module.exports = router;