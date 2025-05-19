const express = require('express');
const router = express.Router();
require('dotenv').config()
const app = express()


const stripe = require("stripe")(process.env.STRIPE_SECRET);

const admin = require('firebase-admin');

const db = admin.firestore();

const cors = require('cors');

app.use(cors(process.env.CLIENT_URL));


router.post("/create-checkout-session", async (req, res) => {
    try {
        const { listingId, price, metadata } = req.body;

        if (!listingId || !price) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Property at ${metadata.address}`,
                        description: metadata.address,
                        images: metadata.images.slice(0, 4),
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/listings/${listingId}`,
            metadata: {
                listingId: listingId,
                type: "property_purchase"
            }
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("Stripe error:", error);
        res.status(500).json({
            error: "Payment processing failed",
            details: error.message
        });
    }
});

module.exports = router;