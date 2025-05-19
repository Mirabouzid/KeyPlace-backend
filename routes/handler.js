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
        const { listingId, price, transactionType, metadata } = req.body;

        if (!listingId || !price) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const productName = transactionType === "location"
            ? `Location de propriété à ${metadata.address}`
            : `Achat de propriété à ${metadata.address}`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "usd", //"eur"
                    product_data: {
                        name: productName,   //`Property at ${metadata.address}`,
                        description: metadata.address,
                        images: metadata.images.slice(0, 4),
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}&type=${transactionType}`,
            cancel_url: `${process.env.CLIENT_URL}/listing/${listingId}`,
            metadata: {
                listingId: listingId,
                transactionType: transactionType,
                type: "property_transaction"
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

// // Nouvelle route pour vérifier le statut de la session après paiement
router.get("/checkout-session/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        res.json({
            status: session.payment_status,
            customer: session.customer_details,
            transactionType: session.metadata.transactionType
        });
    } catch (error) {
        console.error("Error retrieving session:", error);
        res.status(500).json({
            error: "Failed to retrieve session information",
            details: error.message
        });
    }
});

module.exports = router;