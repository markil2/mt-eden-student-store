import type { Category, OptionGroup, Product, ProductImage } from "@/lib/types";

/**
 * Menu source of truth for Phase 1, transcribed from public/menu-reference.png.
 * Prices are integer cents and match the printed Day Menu exactly.
 * Rules that were not explicit on the menu are listed in lib/data/open-questions.md.
 */

export const categories: Category[] = [
  { id: "breakfast", name: "Breakfast", blurb: "Made to order every morning." },
  { id: "snacks", name: "Snacks", blurb: "Something to get you to lunch." },
  { id: "beverages", name: "Beverages", blurb: "Cold, fresh, and a little sweet." },
  { id: "coffee", name: "Iced & Hot Coffee", blurb: "Your first-period fuel." },
];

const unsplash = (id: string, alt: string): ProductImage => ({
  src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=75`,
  alt,
  isPlaceholder: true,
});

export const sampleImages = {
  hero: unsplash("1565299507177-b0ac66763828", "Egg and cheese breakfast sandwich on a wooden board"),
  cafe: unsplash("1453614512568-c4024d13c247", "A warm cafe counter with espresso machine and shelves"),
  breakfast: unsplash("1533089860892-a7c6f0a88666", "Fried egg on toast with bacon"),
  coffee: unsplash("1495474472287-4d71bcdd2085", "Hands holding three cups of latte"),
  snacks: unsplash("1621447504864-d8686e12698c", "An open bag of potato chips"),
  parfait: unsplash("1488477181946-6428a0291777", "Yogurt cups topped with strawberries"),
};

/* ── Shared option groups ───────────────────────────────────────── */

const sandwichBread: OptionGroup = {
  id: "bread",
  label: "Bread",
  required: true,
  max: 1,
  // Confirmed: three bagel types or a croissant. No biscuit.
  options: [
    { id: "bagel-plain", label: "Plain bagel", priceDeltaCents: 0 },
    { id: "bagel-everything", label: "Everything bagel", priceDeltaCents: 0 },
    { id: "bagel-cheese", label: "Cheese bagel", priceDeltaCents: 0 },
    { id: "croissant", label: "Croissant", priceDeltaCents: 0 },
  ],
};

/** Confirmed: cheese is optional. */
const cheese: OptionGroup = {
  id: "cheese",
  label: "Cheese",
  required: false,
  max: 1,
  options: [
    { id: "cheddar", label: "Cheddar", priceDeltaCents: 0 },
    { id: "provolone", label: "Provolone", priceDeltaCents: 0 },
  ],
};

/** Confirmed: pick 1–3 proteins; the first is included, each extra is +$1. */
const protein: OptionGroup = {
  id: "protein",
  label: "Protein",
  hint: "First protein included · +$1 each extra",
  required: true,
  max: 3,
  includedCount: 1,
  extraEachCents: 100,
  options: [
    { id: "turkey", label: "Turkey", priceDeltaCents: 0 },
    { id: "chicken-sausage", label: "Chicken sausage", priceDeltaCents: 0 },
    { id: "bacon", label: "Bacon", priceDeltaCents: 0 },
  ],
};

/** "+ OJ / Coffee / Drink" — confirmed: any drink priced $3 or less (now incl. hot chocolate). */
const comboDrink: OptionGroup = {
  id: "drink",
  label: "Drink",
  hint: "Included with the combo",
  required: true,
  max: 1,
  options: [
    { id: "orange-juice", label: "Orange juice", priceDeltaCents: 0, productId: "orange-juice" },
    { id: "hot-coffee", label: "Hot coffee", priceDeltaCents: 0, productId: "hot-coffee" },
    { id: "tea", label: "Tea", priceDeltaCents: 0, productId: "tea" },
    { id: "water", label: "Water", priceDeltaCents: 0, productId: "water" },
    { id: "lemonade", label: "Lemonade", priceDeltaCents: 0, productId: "lemonade" },
    { id: "energy-drink", label: "Energy drink", priceDeltaCents: 0, productId: "energy-drink" },
    { id: "gatorade", label: "Gatorade", priceDeltaCents: 0, productId: "gatorade" },
    { id: "hot-chocolate", label: "Hot chocolate", priceDeltaCents: 0, productId: "hot-chocolate" },
  ],
};

/* ── Products ──────────────────────────────────────────────────── */

export const products: Product[] = [
  // Breakfast
  {
    id: "sandwich-combo",
    name: "Breakfast Sandwich Combo",
    categoryId: "breakfast",
    priceCents: 1000,
    description: "Egg with turkey, chicken sausage or bacon, plus OJ, coffee or a drink.",
    image: sampleImages.hero,
    optionGroups: [sandwichBread, protein, cheese, comboDrink],
    popular: true,
  },
  {
    id: "sandwich-protein",
    name: "Breakfast Sandwich + Protein",
    categoryId: "breakfast",
    priceCents: 800,
    description: "Egg with turkey, chicken sausage or bacon. Extra proteins $1 each.",
    image: unsplash("1533089860892-a7c6f0a88666", "Fried egg with bacon on toasted bread"),
    optionGroups: [sandwichBread, protein, cheese],
    popular: true,
  },
  {
    id: "sandwich-egg-cheese",
    name: "Breakfast Sandwich",
    categoryId: "breakfast",
    priceCents: 600,
    description: "Egg on a bagel or croissant, with cheese if you like.",
    image: unsplash("1608039829572-78524f79c4c7", "Egg on a toasted English muffin"),
    optionGroups: [sandwichBread, cheese],
  },
  {
    id: "yogurt-parfait",
    name: "Yogurt Parfait",
    categoryId: "breakfast",
    priceCents: 700,
    description: "Yogurt layered with berries, granola and honey.",
    image: sampleImages.parfait,
    optionGroups: [],
    popular: true,
  },
  {
    id: "bagel",
    // Confirmed: $3 bagel with cream cheese; choose plain, everything or cheese.
    name: "Bagel with Cream Cheese",
    categoryId: "breakfast",
    priceCents: 300,
    description: "Plain, everything or cheese bagel with cream cheese.",
    image: unsplash("1585445490387-f47934b73b54", "Bagels on a cooling rack"),
    optionGroups: [
      {
        id: "bagel",
        label: "Bagel",
        required: true,
        max: 1,
        options: [
          { id: "plain", label: "Plain", priceDeltaCents: 0 },
          { id: "everything", label: "Everything", priceDeltaCents: 0 },
          { id: "cheese", label: "Cheese", priceDeltaCents: 0 },
        ],
      },
    ],
  },
  {
    id: "muffin",
    name: "Muffin",
    categoryId: "breakfast",
    priceCents: 300,
    image: unsplash("1607958996333-41aef7caefaa", "Blueberry muffins on a plate"),
    optionGroups: [],
  },

  // Snacks
  {
    id: "chips",
    name: "Chips",
    categoryId: "snacks",
    priceCents: 200,
    description: "Cheetos Puffs, Sour Cream & Onion, Ruffles or Doritos.",
    image: sampleImages.snacks,
    optionGroups: [
      {
        id: "flavor",
        label: "Flavor",
        required: true,
        max: 1,
        options: [
          { id: "cheetos-puffs", label: "Cheetos Puffs", priceDeltaCents: 0 },
          { id: "sour-cream-onion", label: "Sour Cream & Onion", priceDeltaCents: 0 },
          { id: "ruffles", label: "Ruffles", priceDeltaCents: 0 },
          { id: "doritos", label: "Doritos", priceDeltaCents: 0 },
        ],
      },
    ],
  },
  {
    id: "popcorn",
    name: "Popcorn",
    categoryId: "snacks",
    priceCents: 200,
    image: unsplash("1505686994434-e3cc5abf1330", "A glass bowl of popcorn"),
    optionGroups: [],
  },
  { id: "pretzels", name: "Pretzels", categoryId: "snacks", priceCents: 100, image: null, optionGroups: [] },
  { id: "protein-bar", name: "Protein Bar", categoryId: "snacks", priceCents: 300, image: null, optionGroups: [] },
  {
    id: "fruit-snacks",
    name: "Fruit Snacks",
    categoryId: "snacks",
    priceCents: 100,
    description: "Two bags.",
    image: unsplash("1582058091505-f87a2e55a40f", "Colorful gummy bears"),
    optionGroups: [],
  },

  // Beverages
  {
    id: "water",
    name: "Water",
    categoryId: "beverages",
    priceCents: 100,
    image: unsplash("1513558161293-cdaf765ed2fd", "A glass of water with lime and mint"),
    optionGroups: [],
  },
  {
    id: "lemonade",
    name: "Lemonade",
    categoryId: "beverages",
    priceCents: 300,
    image: unsplash("1621263764928-df1444c5e859", "Lemonade with lemon slices and mint"),
    optionGroups: [],
  },
  {
    id: "orange-juice",
    name: "Orange Juice",
    categoryId: "beverages",
    priceCents: 300,
    image: unsplash("1600271886742-f049cd451bba", "A tall glass of orange juice"),
    optionGroups: [],
    popular: true,
  },
  {
    id: "smoothie",
    name: "Smoothie",
    categoryId: "beverages",
    priceCents: 600,
    image: unsplash("1600718374662-0483d2b9da44", "A berry smoothie with falling berries"),
    optionGroups: [],
  },
  {
    id: "chai-latte",
    name: "Chai Latte",
    categoryId: "beverages",
    // Listed as "OOS" on the printed menu — no price shown. Flagged for confirmation.
    priceCents: 0,
    image: unsplash("1517487881594-2787fef5ebf7", "A chai latte on a white tray"),
    optionGroups: [],
  },
  {
    id: "hot-chocolate",
    name: "Hot Chocolate",
    categoryId: "beverages",
    priceCents: 300,
    image: unsplash("1517578239113-b03992dcdd25", "A cup of hot chocolate on a saucer"),
    optionGroups: [],
  },
  {
    id: "energy-drink",
    name: "Energy Drink",
    categoryId: "beverages",
    priceCents: 300,
    image: unsplash("1625740822008-e45abf4e01d5", "A drinks fridge stocked with cans"),
    optionGroups: [],
  },
  {
    id: "italian-soda",
    name: "Italian Soda",
    categoryId: "beverages",
    priceCents: 500,
    image: unsplash("1497534446932-c925b458314e", "Bright sodas with strawberries and lime"),
    optionGroups: [
      {
        id: "add",
        label: "Add",
        required: false,
        max: 1,
        options: [{ id: "whipped-cream", label: "Whipped cream", priceDeltaCents: 0 }],
      },
    ],
  },
  { id: "gatorade", name: "Gatorade", categoryId: "beverages", priceCents: 300, image: null, optionGroups: [] },

  // Iced & Hot Coffee
  {
    id: "cold-brew",
    name: "Cold Brew",
    categoryId: "coffee",
    priceCents: 400,
    image: unsplash("1461023058943-07fcbe16d735", "Iced cold brew with cream swirling in"),
    optionGroups: [],
    popular: true,
  },
  {
    id: "hot-coffee",
    name: "Hot Coffee",
    categoryId: "coffee",
    priceCents: 300,
    image: unsplash("1509042239860-f550ce710b93", "Two cups of coffee on a wooden table"),
    optionGroups: [],
  },
  {
    id: "tea",
    name: "Tea",
    categoryId: "coffee",
    priceCents: 300,
    image: unsplash("1544787219-7f47ccb76574", "A cup of tea with cookies"),
    optionGroups: [],
  },
];

export const productsById: Record<string, Product> = Object.fromEntries(products.map((p) => [p.id, p]));

export function getProduct(id: string): Product | undefined {
  return productsById[id];
}
