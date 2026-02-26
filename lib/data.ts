export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  videoUrl?: string;
  publishedAt: string;
  slug: string;
}

const STORAGE_KEY = "retire_townwise_blogs";

export function getBlogs(): BlogPost[] {
  if (typeof window === "undefined") return getSampleBlogs();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return getSampleBlogs();
}

export function saveBlog(post: BlogPost): void {
  if (typeof window === "undefined") return;
  const blogs = getBlogs();
  const existing = blogs.findIndex((b) => b.id === post.id);
  if (existing >= 0) {
    blogs[existing] = post;
  } else {
    blogs.unshift(post);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
}

export function deleteBlog(id: string): void {
  if (typeof window === "undefined") return;
  const blogs = getBlogs().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
}

export function getBlogById(id: string): BlogPost | null {
  return getBlogs().find((b) => b.id === id) ?? null;
}

export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getSampleBlogs(): BlogPost[] {
  return [
    {
      id: "rt7x2k1",
      slug: "rt7x2k1",
      title: "Top 5 Affordable Retirement Towns in the American South",
      summary:
        "From charming small towns in Mississippi to hidden gems in Arkansas, we break down the most budget-friendly yet livable retirement destinations in the South.",
      content: `<h2>Why the South Offers the Best Value for Retirees</h2><p>The American South has long been a destination for retirees seeking warm weather, low taxes, and an affordable cost of living. But not all Southern towns are created equal. In this guide, we highlight five towns that genuinely balance cost and quality of life.</p><h2>1. Oxford, Mississippi</h2><p>Home to Ole Miss University, Oxford combines small-town charm with cultural richness. Average rent for a one-bedroom sits around $850/month, and groceries run about 12% below the national average.</p><h3>Pros</h3><ul><li>Vibrant arts and food scene</li><li>Strong hospital network</li><li>Low property taxes</li></ul><h3>Cons</h3><ul><li>Hot, humid summers</li><li>Limited public transportation</li></ul><h2>2. Hot Springs, Arkansas</h2><p>Known for its national park and thermal baths, Hot Springs is a hidden gem. Monthly expenses for a retired couple can be as low as $2,800 including rent, food, and healthcare.</p><blockquote>A dollar genuinely goes further here than almost anywhere in the continental US.</blockquote><h2>Conclusion</h2><p>Each of these towns offers a unique balance of affordability and livability. The key is matching your lifestyle priorities with the right community.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      publishedAt: "2025-01-15",
    },
    {
      id: "mn3p8w4",
      slug: "mn3p8w4",
      title: "How to Plan Your Retirement Move on a $2,500/Month Budget",
      summary:
        "A practical step-by-step guide to planning a retirement relocation anywhere in the USA, covering housing costs, healthcare, and unexpected expenses.",
      content: `<h2>Setting a Realistic Budget</h2><p>Planning a retirement move requires careful financial planning. A $2,500/month budget is achievable in dozens of American cities and towns if you know where to look.</p><h2>Breaking Down the Numbers</h2><p>Here's a realistic monthly breakdown for a single retiree:</p><ul><li>Housing (rent + utilities): $1,100</li><li>Food and groceries: $400</li><li>Healthcare/insurance: $450</li><li>Transportation: $200</li><li>Entertainment and misc: $350</li></ul><h2>The Best States for Your Budget</h2><p>States like Mississippi, Arkansas, Oklahoma, and West Virginia consistently offer the lowest overall cost of living for retirees. Property taxes are low, healthcare networks are accessible, and the pace of life suits retirement well.</p><h2>What to Do Before You Move</h2><p>Visit at least twice across different seasons. Spend a week living as a local — go to the grocery store, visit the hospital, take the commute. This due diligence will save you from costly surprises.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80",
      videoUrl: "",
      publishedAt: "2025-02-03",
    },
    {
      id: "qz9v5r2",
      slug: "qz9v5r2",
      title: "The Honest Truth About Retiring in Small-Town America",
      summary:
        "We explore the real trade-offs of small-town retirement life — the good, the bad, and what the YouTube videos don't tell you.",
      content: `<h2>The Appeal Is Real — But So Are the Challenges</h2><p>Small-town America looks incredible in YouTube videos. Wide open spaces, friendly neighbors, homes for $150,000. But there's a flip side that deserves honest coverage.</p><h2>What Nobody Tells You</h2><p>Healthcare accessibility is the number one issue retirees face in small towns. A town of 8,000 people may have only one clinic, and the nearest hospital could be 40 miles away. For active, healthy retirees this is manageable. For those with chronic conditions, it's a serious consideration.</p><h2>The Social Fabric</h2><p>Social isolation is a genuine risk. If you don't make an effort to join clubs, attend community events, or get involved in local life, small-town life can feel lonely quickly — especially in the first year.</p><h2>Our Recommendation</h2><p>Target towns between 15,000 and 60,000 residents. This sweet spot gives you affordability, healthcare infrastructure, some cultural variety, and a real community feel without big-city costs.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      publishedAt: "2025-02-20",
    },
  ];
}
