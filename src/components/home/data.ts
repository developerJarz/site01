/** Static homepage content. Live numbers (listing counts, makes, cities) come from the page loader. */

export const BRANDS = [
  { name: "Toyota", logo: "/brands/toyota.svg" },
  { name: "Honda", logo: "/brands/honda.svg" },
  { name: "BMW", logo: "/brands/bmw.svg" },
  { name: "Mercedes-Benz", label: "Mercedes", logo: "/brands/mercedes.svg" },
  { name: "Nissan", logo: "/brands/nissan.svg" },
  { name: "Audi", logo: "/brands/audi.svg" },
  { name: "Hyundai", logo: "/brands/hyundai.svg" },
  { name: "Mitsubishi", logo: "/brands/mitsubishi.svg" },
];

/** Extra makes offered in the search form beyond the showcased brands. */
export const MORE_MAKES = ["Kia", "Lexus", "Mazda", "Suzuki", "Volkswagen", "Land Rover", "Porsche", "Tesla"];

/** `key` matches the `category` filter understood by /api/listings/search. */
export const CATEGORIES = [
  { key: "suv", label: "SUV", image: "/images/home/cat-suv.jpg" },
  { key: "sedan", label: "Sedan", image: "/images/home/cat-sedan.jpg" },
  { key: "hatchback", label: "Hatchback", image: "/images/home/cat-hatchback.jpg" },
  { key: "mpv", label: "MPV", image: "/images/home/cat-mpv.jpg" },
  { key: "pickup", label: "Pickup", image: "/images/home/cat-pickup.jpg" },
  { key: "luxury", label: "Luxury", image: "/images/home/cat-luxury.jpg" },
  { key: "hybrid", label: "Hybrid", image: "/images/home/cat-hybrid.jpg" },
  { key: "electric", label: "Electric", image: "/images/home/cat-electric.jpg" },
] as const;

// Budgets as buyers here say them: in lakh and crore.
export const BUDGETS = [
  { value: "0-1000000", label: "Under 10 lakh" },
  { value: "1000000-2000000", label: "10 – 20 lakh" },
  { value: "2000000-4000000", label: "20 – 40 lakh" },
  { value: "4000000-10000000", label: "40 lakh – 1 crore" },
  { value: "10000000-", label: "Above 1 crore" },
];

export const FUELS = [
  { value: "petrol", label: "Petrol" },
  { value: "octane", label: "Octane" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
  { value: "cng", label: "CNG" },
];

export const CONDITIONS = [
  { value: "used", label: "Used" },
  { value: "reconditioned", label: "Reconditioned" },
  { value: "new", label: "New" },
];

export const TRANSMISSIONS = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
  { value: "semi-automatic", label: "Semi-automatic" },
];

/**
 * Marketing figures shown in the trust band. Keep these in line with the business's real
 * numbers: they are claims made to buyers.
 */
export const STATS = [
  { value: 5000, suffix: "+", label: "Verified Cars", icon: "car" },
  { value: 100000, suffix: "+", label: "Happy Customers", icon: "smile" },
  { value: 300, suffix: "+", label: "Trusted Dealers", icon: "store" },
  { value: 64, suffix: "", label: "District Coverage", icon: "map" },
] as const;

export const PAPERS = [
  { name: "Registration certificate", detail: "Smart card matches the chassis and engine number" },
  { name: "Tax token", detail: "Paid up and in date" },
  { name: "Fitness certificate", detail: "Valid on the day we check" },
  { name: "Route permit or ownership slip", detail: "Seller is the owner, or has the right to sell" },
];

export const FEATURES = [
  { title: "Verified Listings", body: "Papers are checked by our team before a listing earns the Paper Verified badge.", icon: "shield" },
  { title: "Professional Inspection", body: "Book a pre-purchase check so you know the engine, body and history before you pay.", icon: "search" },
  { title: "Transparent Pricing", body: "Prices in lakh, as you'd say them, with Hot Deal flags when a car sits below its market.", icon: "tag" },
  { title: "Nationwide Support", body: "From Dhaka to Chattogram and Sylhet, our team helps with calls, visits and BRTA transfer.", icon: "headset" },
] as const;

export const STEPS = [
  { title: "Search Cars", body: "Filter by budget, brand, fuel and city. Save the cars worth a second look." },
  { title: "Compare Options", body: "Put up to three cars side by side: price, mileage, papers and seller." },
  { title: "Book Inspection", body: "See the car in daylight, take a test drive and hold the original papers." },
  { title: "Buy Safely", body: "Complete the BRTA name transfer before the full payment changes hands." },
];

export const TESTIMONIALS = [
  {
    name: "Rahim Ahmed",
    role: "Bought a Corolla Cross",
    rating: 5,
    content: "Found my Corolla Cross within three days. The Paper Verified badge meant I wasn't chasing the seller for documents.",
  },
  {
    name: "Fatima Khan",
    role: "Sold a Honda Civic",
    rating: 5,
    content: "Listed on a Friday, sold by Sunday. I had several serious calls and no time-wasters.",
  },
  {
    name: "Kamal Hossain",
    role: "Dealer, Tejgaon",
    rating: 5,
    content: "Our reconditioned stock gets far more enquiries here than anywhere else we list.",
  },
];

export const AI_DEFAULT = {
  prompt: "I need SUV under 40 lakh",
  picks: [
    { make: "Toyota", model: "Harrier", note: "Refined hybrid, strong resale" },
    { make: "Honda", model: "Vezel", note: "Compact, frugal, easy to park" },
    { make: "Mazda", model: "CX-5", note: "Sharp handling, premium cabin" },
  ],
};
