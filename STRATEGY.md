# Repurpose — revenue path

## Offer

Repurpose turns one article, transcript, or URL into six publication-ready pieces: X thread, LinkedIn post, newsletter, short-video script, SEO package, and actionable takeaways.

## Initial pricing

- Free: 3 generations every 30 days.
- Pro: $12/month.

The free tier is deliberately small: the user can experience the core transformation, then the product asks for payment only when they have demonstrated intent.

## Conversion path

1. User lands on the generator.
2. User completes up to 3 free generations.
3. Backend blocks the 4th generation.
4. UI presents the Pro upgrade CTA.
5. Stripe Checkout starts a subscription.
6. Stripe webhook activates the user's Pro entitlement.
7. Pro removes the generation quota.

## Required production secrets

`STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_WEBHOOK_SECRET`, `APP_ORIGIN`, `CORS_ORIGINS`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `AI_GATEWAY_BASE_URL`, and `AI_GATEWAY_API_KEY`.

## Stripe setup

Create a recurring monthly Price at $12 in Stripe Billing. Point a Stripe webhook at `/api/billing/webhook` and subscribe at minimum to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.

Stripe recommends verifying webhook signatures against the exact raw request body and the `Stripe-Signature` header. This implementation follows that model. See Stripe's official webhook signature guidance: https://docs.stripe.com/webhooks/signature

## Important limitation

The current paid identity is the anonymous browser session token, not a durable account. This is suitable for validating willingness to pay, but before serious scale the next release should add real account authentication and migrate `ownerToken` to `userId` so subscriptions survive browser changes and support billing/customer management.
