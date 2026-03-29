# 🛠️ How to Enable Paystack Webhooks on Localhost

Since Paystack's servers cannot talk to `localhost:3000` directly, you need a "tunnel" to expose your local server to the internet. We recommend using **ngrok**.

## 1. Install & Run ngrok
If you don't have ngrok, [link](https://ngrok.com/download) or use Homebrew:
```bash
brew install ngrok/ngrok/ngrok
```

Then, start a tunnel for your Next.js project (while `npm run dev` is running):
```bash
ngrok http 3000
```

## 2. Get your Public URL
Once started, ngrok will show a "Forwarding" URL that looks like this:
`https://7x9k-123-45.ngrok-free.app`

## 3. Update Paystack Dashboard
1.  Log in to your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer).
2.  Go to **Settings** > **API Keys & Webhooks**.
3.  Set your **Test Webhook URL** to:
    `https://YOUR_NGROK_URL.ngrok-free.app/api/payments/webhook`
4.  Click **Save**.

## 4. Update Your `.env.local`
Finally, update your local environment variable so the redirect works correctly:
```bash
# Change this to your ngrok URL
NEXT_PUBLIC_APP_URL=https://YOUR_NGROK_URL.ngrok-free.app
```
*Note: You will need to stop and restart `npm run dev` after changing the .env file.*

---
### 🎉 What this enables:
-   **Automated Emails**: Receipts and alerts will now trigger instantly.
-   **Wallet Updates**: Your "Goal Progress" and "Wallet Balance" will update as soon as a payment is made.
-   **Success Feedback**: Donors will be correctly redirected to the new Thank You page.
