# Requirements Document

## Introduction

Backr is a creator-first crowdfunding and engagement platform targeting musicians, filmmakers, visual artists, writers, podcasters, and community creators — primarily in Africa and emerging markets. The platform enables creators to raise funds directly from fans with full financial transparency, engage their audience through built-in communication tools, and gain visibility through paid promotion features. Each campaign has its own wallet, expense tracker, and supporter dashboard. The MVP covers creator profiles, project wallets, spending logs, campaign dashboards, Backr Boost, email marketing, project updates, and social sharing tools.

---

## Glossary

- **Creator**: A verified user who creates and manages fundraising campaigns on the platform
- **Backer**: A user who contributes funds to a campaign
- **Campaign**: A fundraising project created by a Creator with a defined goal and timeline
- **Project_Wallet**: An isolated wallet associated with a single Campaign that holds received funds
- **Spending_Log**: A publicly visible record of expenses logged by a Creator against a Campaign
- **Campaign_Dashboard**: The real-time interface showing a Campaign's funding progress and contributor list
- **Backr_Boost**: A paid promotion feature that elevates a Campaign's visibility in platform listings
- **Email_Tool**: The built-in email marketing feature available to Premium subscribers
- **KYC_Service**: The identity verification service used to verify Creator accounts
- **Payment_Gateway**: The third-party payment processor (Flutterwave or Paystack) handling transactions
- **Platform**: The Backr web application as a whole
- **Auth_Service**: The authentication and session management service
- **Notification_Service**: The service responsible for sending email and in-app notifications to users
- **Analytics_Service**: The service that collects and surfaces campaign performance metrics

---

## Requirements

### Requirement 1: Creator Account Registration and Verification

**User Story:** As a creator, I want to register and verify my identity, so that backers can trust my campaigns and I can receive payouts.

#### Acceptance Criteria

1. WHEN a user submits a registration form with a valid email, password, and display name, THE Auth_Service SHALL create a new Creator account and send a verification email within 60 seconds.
2. WHEN a user clicks the verification link in the email, THE Auth_Service SHALL activate the Creator account and redirect the user to the onboarding flow.
3. IF a user submits a registration form with an email address already associated with an existing account, THEN THE Auth_Service SHALL return an error message indicating the email is already in use.
4. WHEN a Creator submits KYC documents (government-issued ID and a selfie), THE KYC_Service SHALL process the submission and return a verification status within 48 hours.
5. IF THE KYC_Service rejects a submission, THEN THE Platform SHALL notify the Creator with the reason for rejection and allow resubmission.
6. WHILE a Creator's KYC status is unverified, THE Platform SHALL restrict the Creator from withdrawing funds from any Project_Wallet.
7. THE Auth_Service SHALL enforce a minimum password length of 8 characters containing at least one uppercase letter, one lowercase letter, and one number.

---

### Requirement 2: Creator Profile

**User Story:** As a creator, I want a public profile page, so that potential backers can learn about me and discover my campaigns.

#### Acceptance Criteria

1. THE Platform SHALL provide each Creator with a unique public profile URL in the format `/creators/{username}`.
2. WHEN a Creator updates their profile (bio, avatar, social links, or category), THE Platform SHALL persist the changes and reflect them on the public profile within 5 seconds.
3. THE Platform SHALL display on a Creator's public profile: display name, bio, avatar, social media links, creator category, and a list of the Creator's active and completed Campaigns.
4. IF a Creator attempts to set a username that is already taken, THEN THE Platform SHALL return an error and prompt the Creator to choose a different username.
5. WHERE a Creator has linked social media accounts, THE Platform SHALL display verified social link badges on the Creator's public profile.

---

### Requirement 3: Campaign Creation and Management

**User Story:** As a creator, I want to create and manage fundraising campaigns, so that I can raise money for my projects.

#### Acceptance Criteria

1. WHEN a verified Creator submits a new campaign with a title, description, funding goal (in a supported currency), category, and end date, THE Platform SHALL create the Campaign and provision a dedicated Project_Wallet for it.
2. THE Platform SHALL support campaign funding goals denominated in NGN, KES, GHS, ZAR, and USD.
3. WHEN a Creator publishes a Campaign, THE Platform SHALL make the Campaign publicly visible on the platform listings page.
4. WHILE a Campaign is active, THE Creator SHALL be able to edit the campaign description, cover image, and updates without altering the funding goal or end date.
5. IF a Creator attempts to create a Campaign without completing KYC verification, THEN THE Platform SHALL block campaign creation and display a prompt directing the Creator to complete KYC.
6. WHEN a Campaign reaches its end date, THE Platform SHALL automatically change the Campaign status to "Closed" and stop accepting new contributions.
7. THE Platform SHALL allow a Creator to cancel a Campaign before any funds have been received, resulting in the Campaign being removed from public listings.
8. IF a Creator attempts to cancel a Campaign that has received funds, THEN THE Platform SHALL require the Creator to issue refunds to all Backers before the Campaign can be closed.

---

### Requirement 4: Project Wallet and Transparent Transactions

**User Story:** As a backer, I want to see exactly where my money goes, so that I can trust the creator and feel confident contributing.

#### Acceptance Criteria

1. THE Platform SHALL associate exactly one Project_Wallet with each Campaign, and THE Project_Wallet SHALL only receive funds contributed to that Campaign.
2. WHEN a Backer's contribution is confirmed by the Payment_Gateway, THE Platform SHALL credit the contribution amount (minus the platform fee) to the corresponding Project_Wallet within 60 seconds.
3. THE Platform SHALL deduct a platform fee of between 3% and 5% from each confirmed contribution before crediting the Project_Wallet.
4. THE Platform SHALL display the current Project_Wallet balance, total contributions received, and total withdrawals made on the Campaign's public page.
5. WHEN a Creator initiates a withdrawal from a Project_Wallet, THE Platform SHALL require two-step verification (a one-time code sent to the Creator's registered email or phone) before processing the withdrawal.
6. IF the two-step verification code is not confirmed within 10 minutes, THEN THE Platform SHALL expire the code and require the Creator to initiate a new withdrawal request.
7. THE Platform SHALL process withdrawals via the Payment_Gateway to the Creator's registered payout account within 2 business days.
8. WHILE a Creator's KYC status is unverified, THE Platform SHALL reject withdrawal requests and display a message directing the Creator to complete KYC.

---

### Requirement 5: Spending Log

**User Story:** As a creator, I want to publicly log how I'm spending campaign funds, so that my backers can see exactly how their money is being used.

#### Acceptance Criteria

1. WHEN a Creator submits a spending entry with a description, amount, date, and optional receipt attachment, THE Platform SHALL append the entry to the Campaign's Spending_Log and make it publicly visible within 5 seconds.
2. THE Platform SHALL display the Spending_Log on the Campaign's public page, showing each entry's description, amount, date, and receipt link (if provided).
3. THE Platform SHALL display a running total of logged expenses on the Campaign's public page.
4. IF a Creator submits a spending entry with an amount that exceeds the current Project_Wallet balance, THEN THE Platform SHALL reject the entry and return an error indicating insufficient wallet balance.
5. WHEN a Creator deletes a spending entry, THE Platform SHALL remove it from the public Spending_Log and recalculate the running total.
6. THE Platform SHALL retain all spending entries (including deleted entries) in an immutable audit log accessible to platform administrators.

---

### Requirement 6: Campaign Dashboard

**User Story:** As a creator and backer, I want a real-time campaign dashboard, so that I can track funding progress and contributor activity at a glance.

#### Acceptance Criteria

1. THE Campaign_Dashboard SHALL display a progress bar showing the percentage of the funding goal reached, updated within 30 seconds of each new confirmed contribution.
2. THE Campaign_Dashboard SHALL display the total amount raised, the funding goal, the number of unique Backers, and the number of days remaining.
3. WHEN a new contribution is confirmed, THE Campaign_Dashboard SHALL update all displayed metrics without requiring a full page reload.
4. THE Campaign_Dashboard SHALL display a list of recent contributors showing display name (or "Anonymous" if the Backer chose to contribute anonymously) and contribution amount.
5. WHERE a Backer opts to contribute anonymously, THE Platform SHALL display "Anonymous" in place of the Backer's name on all public-facing views.
6. THE Platform SHALL allow a Creator to view a private breakdown of all individual contributions including Backer identity, amount, date, and payment method on the Creator's private dashboard.

---

### Requirement 7: Backer Contribution Flow

**User Story:** As a backer, I want to contribute to a campaign easily and securely, so that I can support creators I believe in.

#### Acceptance Criteria

1. WHEN a Backer selects a contribution amount and clicks "Back This Project", THE Platform SHALL redirect the Backer to the Payment_Gateway's secure checkout flow.
2. THE Platform SHALL support contribution payments in NGN, KES, GHS, ZAR, and USD via the Payment_Gateway.
3. WHEN the Payment_Gateway confirms a successful payment, THE Platform SHALL send a contribution receipt to the Backer's registered email within 60 seconds.
4. IF the Payment_Gateway returns a failed payment status, THEN THE Platform SHALL display an error message to the Backer and not credit the Project_Wallet.
5. THE Platform SHALL allow Backers to contribute without creating an account, requiring only an email address for receipt delivery.
6. WHEN a registered Backer completes a contribution, THE Platform SHALL record the contribution in the Backer's contribution history.
7. THE Platform SHALL enforce a minimum contribution amount of ₦500 (or equivalent in other supported currencies).

---

### Requirement 8: Backr Boost (Paid Promotion)

**User Story:** As a creator, I want to pay to promote my campaign, so that it appears at the top of platform listings and reaches more potential backers.

#### Acceptance Criteria

1. WHEN a Creator purchases a Backr_Boost tier, THE Platform SHALL elevate the Creator's Campaign to a designated "Boosted" section at the top of the platform listings page for the duration of the purchased tier.
2. THE Platform SHALL offer Backr_Boost tiers at ₦1,500, ₦3,000, and ₦6,000, each corresponding to a different promotion duration.
3. WHEN a Backr_Boost purchase is confirmed by the Payment_Gateway, THE Platform SHALL activate the boost within 5 minutes.
4. WHEN a Backr_Boost period expires, THE Platform SHALL automatically remove the Campaign from the "Boosted" section and return it to standard listing order.
5. THE Platform SHALL display a "Boosted" label on promoted Campaigns in all listing views.
6. IF a Creator attempts to purchase a Backr_Boost for a Campaign that is not in "Active" status, THEN THE Platform SHALL reject the purchase and display an explanatory error message.
7. THE Platform SHALL allow a Creator to purchase multiple consecutive Backr_Boost periods for the same Campaign.

---

### Requirement 9: Email Marketing Tool (Premium Feature)

**User Story:** As a premium creator, I want to send emails to my backers and imported contacts, so that I can keep my community engaged and drive more contributions.

#### Acceptance Criteria

1. WHERE a Creator holds an active Premium subscription, THE Email_Tool SHALL allow the Creator to compose and send email campaigns to all Backers of a selected Campaign.
2. WHERE a Creator holds an active Premium subscription, THE Email_Tool SHALL allow the Creator to import a contact list via CSV file upload.
3. WHEN a Creator sends an email campaign, THE Email_Tool SHALL deliver the emails via the configured email service provider (SendGrid or Mailchimp) within 10 minutes of submission.
4. THE Email_Tool SHALL include an unsubscribe link in every outbound email, and WHEN a recipient clicks unsubscribe, THE Platform SHALL remove that recipient from all future email sends within 24 hours.
5. IF a Creator without an active Premium subscription attempts to access the Email_Tool, THEN THE Platform SHALL display an upgrade prompt and block access to the tool.
6. THE Email_Tool SHALL display delivery statistics (sent count, open rate, click rate) for each sent email campaign within 24 hours of delivery.
7. THE Platform SHALL enforce a daily send limit of 10,000 emails per Creator to prevent abuse.

---

### Requirement 10: Project Updates and Announcements

**User Story:** As a creator, I want to post updates and milestones to my campaign, so that backers stay informed and engaged throughout the project lifecycle.

#### Acceptance Criteria

1. WHEN a Creator publishes an update with a title, body text, and optional media attachment (image or video URL), THE Platform SHALL display the update on the Campaign's public page within 5 seconds.
2. WHEN a Creator publishes an update, THE Notification_Service SHALL send an email notification to all Backers of that Campaign within 30 minutes.
3. THE Platform SHALL display updates in reverse chronological order on the Campaign's public page.
4. WHILE a Campaign is active or closed, THE Creator SHALL be able to post updates.
5. IF a Creator submits an update with a body text exceeding 10,000 characters, THEN THE Platform SHALL reject the submission and display a character limit error.
6. WHEN a Creator deletes an update, THE Platform SHALL remove it from the public Campaign page within 5 seconds.

---

### Requirement 11: Social Sharing Tools

**User Story:** As a creator, I want shareable links optimised for social media, so that I can spread my campaign across X, Instagram, and WhatsApp easily.

#### Acceptance Criteria

1. THE Platform SHALL generate a unique, shareable campaign URL for each Campaign in the format `/campaigns/{campaign-slug}`.
2. THE Platform SHALL generate Open Graph meta tags (title, description, image) for each Campaign page so that shared links render rich previews on X, Instagram, WhatsApp, and Facebook.
3. WHEN a Creator clicks the "Share" button on their Campaign dashboard, THE Platform SHALL present pre-formatted share links for X, WhatsApp, and a copy-to-clipboard option.
4. THE Platform SHALL generate a campaign-specific image card (minimum 1200×630px) suitable for sharing on social media platforms.
5. WHEN a user visits a campaign URL shared on social media, THE Platform SHALL load the Campaign page with the correct Open Graph metadata within 3 seconds on a standard broadband connection.

---

### Requirement 12: Premium Subscription

**User Story:** As a creator, I want to subscribe to a premium plan, so that I can unlock advanced tools like email marketing and custom branding.

#### Acceptance Criteria

1. THE Platform SHALL offer Premium subscriptions on monthly and yearly billing cycles, processed via the Payment_Gateway.
2. WHEN a Creator's Premium subscription payment is confirmed, THE Platform SHALL activate Premium features for that Creator's account within 5 minutes.
3. WHEN a Creator's Premium subscription expires or is cancelled, THE Platform SHALL revoke access to Premium-only features and notify the Creator via email.
4. THE Platform SHALL display the current subscription status, renewal date, and billing history on the Creator's account settings page.
5. IF a Premium subscription payment fails, THEN THE Platform SHALL notify the Creator via email and provide a 7-day grace period before revoking Premium access.

---

### Requirement 13: Platform Security

**User Story:** As a user, I want the platform to protect my personal and financial data, so that I can use Backr with confidence.

#### Acceptance Criteria

1. THE Platform SHALL transmit all data between the client and server over TLS 1.2 or higher (SSL encryption).
2. THE Auth_Service SHALL support two-factor authentication (2FA) for Creator accounts using a time-based one-time password (TOTP) or SMS code.
3. THE Platform SHALL store all passwords using a cryptographic hashing algorithm (bcrypt with a minimum cost factor of 12).
4. WHEN a Creator requests a withdrawal, THE Platform SHALL require two-step verification as defined in Requirement 4, Acceptance Criterion 5.
5. THE Platform SHALL log all authentication events (login, logout, failed login attempts) with timestamps and IP addresses in a secure audit log.
6. IF a Creator account experiences 5 consecutive failed login attempts, THEN THE Auth_Service SHALL temporarily lock the account for 15 minutes and notify the Creator via email.
7. THE KYC_Service SHALL store identity documents in encrypted storage and restrict access to authorised platform administrators only.

---

### Requirement 14: Platform Listings and Discovery

**User Story:** As a backer, I want to browse and discover campaigns, so that I can find projects worth supporting.

#### Acceptance Criteria

1. THE Platform SHALL display a public listings page showing all active Campaigns, ordered by recency by default.
2. THE Platform SHALL allow Backers to filter Campaigns by category (e.g. Music, Film, Visual Art, Writing, Podcast, Community).
3. THE Platform SHALL allow Backers to search Campaigns by keyword, matching against campaign title and description.
4. WHEN a search query is submitted, THE Platform SHALL return matching results within 2 seconds.
5. THE Platform SHALL display Boosted Campaigns in a dedicated section above the standard listings, as defined in Requirement 8.
6. THE Platform SHALL display on each Campaign card in the listings: campaign title, creator name, cover image, funding progress percentage, and days remaining.
