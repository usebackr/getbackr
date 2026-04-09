export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Tutorial' | 'Strategy' | 'Industry' | 'Safety';
  image: string;
  author: string;
  date: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'how-to-launch-campaign-on-backr',
    title: 'How to Launch Your Campaign on Backr: A Step-by-Step Guide',
    excerpt: 'Ready to bring your creative vision to life? Follow our comprehensive guide on how to set up and launch your first project successfully on Backr.',
    category: 'Tutorial',
    image: '/nigerian_entrepreneur_campaign_guide_1775720710834.png',
    author: 'Backr Team',
    date: 'April 9, 2024',
    readTime: '2 min read',
    content: `
# How to Launch Your Campaign on Backr

So you have a bold creative vision and you're ready to share it with the world. Backr was built specifically to help African creators turn their project ideas into reality through transparent, community-driven funding.

Our launch process is designed to be lean, professional, and built on trust. Here is exactly how to go from **Idea** to **Live** in three simple steps.

## Step 1: Define Your Vision
The first step is about clarity. You'll need to provide:
- **A Catchy Title**: Something that immediately communicates what you're building.
- **Category Selection**: Whether it's Film, Music, Art, or Tech, choose the category that fits best.
- **Project Description**: This is where you sell your dream. You must provide at least **100 characters** describing exactly what the funds will be used for. Be specific—transparency starts here.

## Step 2: Set Your Goal & Timeline
Backr projects are goal-oriented. 
- **Funding Goal**: Set a realistic amount in Naira (₦) that vous need to complete the project. Remember, being transparent about your costs makes backers more likely to support you.
- **Project Deadline**: How long will your campaign run? Most successful campaigns run for 30 to 45 days.

## Step 3: Visual Identity
A picture is worth a thousand backers.
- **Cover Image**: Upload a high-quality cover image (Max size: **1MB**) that represents your project. 
- **Impact**: Campaigns with original, clear photography or design usually reach their goals **3x faster** than those without.

## Launching
Once you've filled original details, hit **"Launch Project"**. Your campaign will go live immediately, and you can start sharing your unique link with your audience.

Welcome to the future of African creativity. Let's get backed!
    `,
  },
  {
    id: '2',
    slug: 'transparency-revolution-african-crowdfunding',
    title: 'The Transparency Revolution: Why Accountability is the Key to Success',
    excerpt: 'Trust is the new currency. Discover why radical transparency is changing the landscape of crowdfunding for African creators and backers.',
    category: 'Industry',
    image: '/transparency_trust_african_crowdfunding_1775720737123.png',
    author: 'Backr Team',
    date: 'April 8, 2024',
    readTime: '1 min read',
    content: `
# The Transparency Revolution

In the world of crowdfunding, trust isn't just a buzzword—it's the foundation of everything we build. For too long, the barrier between creators and their supporters has been a lack of transparency. Who is getting the money? How is it being spent? Does the project actually happen?

## Radical Accountability
At Backr, we believe that transparency is a feature, not a burden. By providing tools like **Real-time Spending Logs** and **Impact Updates**, we allow creators to turn their contributions into a story of accountability.

## Why it Matters
When a supporter knows exactly where their Naira is going, they aren't just a donor—they become a stakeholder. They are more likely to support your next project, share your campaign with their network, and stay engaged long after the funding goal is reached.

## The Future is Open
The African creative economy is booming, but to reach its full potential, we need platforms that prioritize trust. By being radicals about transparency, we are building a more sustainable ecosystem for everyone.
    `,
  },
  {
    id: '3',
    slug: 'creators-marketing-toolkit-first-100-backers',
    title: 'The Creator\'s Marketing Toolkit: How to Find Your First 100 Backers',
    excerpt: 'The hardest part of any campaign is getting started. Learn the proven strategies for building momentum and reaching your first major funding milestone.',
    category: 'Strategy',
    image: '/african_creators_marketing_meeting_1775720765531.png',
    author: 'Backr Team',
    date: 'April 7, 2024',
    readTime: '2 min read',
    content: `
# Finding Your First 100 Backers

Every multi-million Naira campaign starts with a single backer. But how do you bridge the gap between **Live** and **Goal**? The secret lies in your inner circle.

## 1. The 30% Rule
Never launch to the public with 0% funding. Before vous go **"Grand Public"**, reach out to your close friends, family, and existing fans. Getting to **30% of your goal** creates "social proof" that makes strangers feel safe to contribute.

## 2. Levering Video
Creators who use a personal video to explain their project raise **50% more** on average. It doesn't need to be Hollywood production—just be authentic, state your goal, and explain the impact.

## 3. Regular Project Updates
Don't wait until the campaign is over to talk to your backers. Use the Backr Update tool to share behind-the-scenes content, teasers, and "thank you" notes. This keeps the momentum alive throughout the 30-day window.
    `,
  },
  {
    id: '4',
    slug: 'safety-first-how-backr-protects-contributions',
    title: 'Safety First: How Backr Protects Your Contributions',
    excerpt: 'Security is our top priority. Learn about our multi-layered approach to protecting funds through Escrow systems and KYC verification.',
    category: 'Safety',
    image: '/nigerian_tech_professional_security_1775720793415.png',
    author: 'Backr Team',
    date: 'April 6, 2024',
    readTime: '1 min read',
    content: `
# How We Keep Your Funds Safe

At Backr, we understand that contributing to a project is an act of faith. That's why we've built a multi-layered security system to ensure that your funds are handled with the highest level of protection.

## Payout Guards
We don't just hand over money to anyone. Every creator on Backr goes through a **KYC (Know Your Customer)** verification process. This ensures that every project is tied to a verified identity.

## Escrow-like Milestones
Funds are held securely and creators are encouraged to set milestones. By logging their spending and providing receipts, they build a track record that justifies the release of funds.

## Secure Payouts
We use world-class payment processors to handle all transactions. This means your financial data never touches our servers directly, and your contributions are protected by industry-standard encryption.
    `,
  },
  {
    id: '5',
    slug: 'designing-impact-visuals-funding',
    title: 'Designing for Impact: Why High-Quality Visuals Lead to 3x More Funding',
    excerpt: 'Your project cover image is your first impression. Discover the simple design principles that make your campaign stand out in a crowded marketplace.',
    category: 'Strategy',
    image: '/nigerian_digital_artist_designing_impact_1775720823018.png',
    author: 'Backr Team',
    date: 'April 5, 2024',
    readTime: '1 min read',
    content: `
# The Power of Visual Design

In a digital marketplace, your project is only as good as it looks. While your idea might be brilliant, if your cover image is blurry or confusing, backers will scroll right past it.

## The "Hero" Image
Your cover image should be the **"Hero"** of your story. It should evoke the emotion of what vous are building. If it's a film, show a cinematic still. If it's a community project, show the people involved.

## Consistency is Key
Good design isn't just about one image. It's about the consistency of your description, your updates, and your brand. Using a clean, professional aesthetic signals to backers that you are serious about your project.

## Simple Tips
- **Avoid Text on Images**: Let the image speak. Use the title field for text.
- **Lighting Matters**: If you're taking a photo, use natural light.
- **Resolution**: Ensure your image is sharp. A blurry photo immediately decreases trust.
    `,
  },
];
