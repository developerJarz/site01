import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/lib/models/Blog";

const DEMO_BLOGS = [
  {
    title: "Top 10 Tips for Buying a Used Car in Bangladesh",
    excerpt: "Buying a used car can be tricky. Follow these expert tips to avoid scams and find the best deal on your next vehicle in Bangladesh.",
    content: `Buying a used car in Bangladesh is one of the smartest financial decisions you can make — if you do it right. With new car prices soaring, the pre-owned market offers excellent value. Here are our top 10 tips to help you navigate the process.

1. Set a Realistic Budget
Before you start browsing, determine how much you can afford. Don't forget to factor in registration transfer costs, insurance, and potential maintenance expenses.

2. Research the Market
Use CarHat.bd to compare prices across different makes, models, and years. Our advanced filters help you find exactly what you're looking for.

3. Check the Vehicle History
Ask for the car's full service history. A well-maintained car with regular servicing is worth more than a neglected one, regardless of mileage.

4. Inspect the Car Thoroughly
Look for signs of accident damage: mismatched paint, uneven panel gaps, and overspray in the engine bay. Check under the car for rust and leaks.

5. Take a Test Drive
Always test drive the car in different conditions. Listen for unusual noises, check the brakes, test the air conditioning, and verify all electronics work.

6. Verify Documents
Ensure the car has valid registration (blue book), fitness certificate, tax token, and insurance. Verify the chassis and engine numbers match the documents.

7. Get a Mechanic's Inspection
Invest in a professional pre-purchase inspection. A trusted mechanic can spot issues that aren't obvious to the untrained eye.

8. Negotiate Wisely
Use your research from CarHat.bd to negotiate. Know the fair market value and don't be afraid to walk away if the price isn't right.

9. Use Secure Payment Methods
Never pay the full amount in cash. Use bank transfers or our secure payment gateway for protection. Meet in a safe, public location.

10. Complete the Ownership Transfer
Visit the BRTA office to complete the transfer. Both buyer and seller need to be present with original documents. The process typically takes 2-3 weeks.

By following these tips, you'll be well-equipped to find a great used car at a fair price. Happy car hunting!`,
    coverImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200",
    author: "CarHat Team",
    tags: ["buying guide", "tips", "used cars"],
    views: 1256,
  },
  {
    title: "Hybrid vs Electric: Which is Better for Bangladesh Roads?",
    excerpt: "With rising fuel costs, many Bangladeshi drivers are considering hybrid and electric vehicles. We break down the pros and cons of each technology.",
    content: `The automotive landscape in Bangladesh is rapidly evolving. With fuel prices continuing to rise and environmental awareness growing, many buyers are turning to alternative powertrains. But which is the better choice for Bangladesh — hybrid or electric?

Understanding Hybrid Vehicles
Hybrid vehicles combine a traditional combustion engine with an electric motor and battery. The Toyota Corolla Cross Hybrid and Honda Civic Hybrid are popular choices in Bangladesh. They offer excellent fuel economy (typically 20-25 km/l) without requiring any charging infrastructure.

Understanding Electric Vehicles
Pure EVs run entirely on battery power. While still relatively new to Bangladesh, models like the Tesla and BYD are gaining attention. They produce zero emissions and have very low running costs — electricity is much cheaper than fuel.

Charging Infrastructure
This is where hybrids have a clear advantage in Bangladesh. The country currently has very limited EV charging stations. Hybrid cars solve this problem entirely — they charge themselves through regenerative braking and never need to be plugged in.

Running Costs Comparison
Hybrid vehicles typically cost 40-50% less to fuel than their pure petrol counterparts. Electric vehicles are even cheaper to run — about 80% less than petrol cars. However, battery replacement costs (after 8-10 years) can be significant.

Maintenance
Both hybrids and EVs generally require less maintenance than traditional cars. EVs have very few moving parts — no oil changes, no transmission fluid, no exhaust system. Hybrids still need some of these services but less frequently.

Our Recommendation
For most Bangladeshi drivers in 2024, hybrid vehicles are the practical choice. They offer significantly better fuel economy than petrol cars without any range anxiety or charging infrastructure concerns. As Bangladesh develops its EV charging network, fully electric vehicles will become more viable.

The future is electric, but the present in Bangladesh is hybrid. Choose accordingly.`,
    coverImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1200",
    author: "CarHat Team",
    tags: ["hybrid", "electric", "comparison"],
    views: 892,
  },
  {
    title: "Understanding BRTA Vehicle Registration in Bangladesh",
    excerpt: "A complete guide to vehicle registration, transfer, and documentation requirements from the Bangladesh Road Transport Authority.",
    content: `Navigating the Bangladesh Road Transport Authority (BRTA) process can be daunting, especially for first-time car owners. This comprehensive guide walks you through everything you need to know.

What is BRTA Registration?
Every vehicle operating on Bangladesh roads must be registered with the BRTA. The registration certificate (commonly known as the "blue book") is the primary document proving ownership.

Documents Required for New Registration
You'll need: Purchase invoice, customs duty receipt (for imported vehicles), insurance certificate, pollution control certificate, National ID/passport, and 2 passport-size photos.

Registration Transfer Process
When buying a used car, you must transfer the registration to your name. Both buyer and seller must visit the BRTA office together. Required documents include the original blue book, tax token, fitness certificate, both parties' NIDs, and a sale agreement.

Costs Involved
Registration transfer fees vary based on the vehicle's engine capacity and age. Typically, expect to pay BDT 5,000-15,000 for the transfer process, plus any outstanding tax tokens.

Fitness Certificate
All vehicles must pass a fitness test annually. The test checks brakes, lights, horn, emissions, and structural integrity. A fitness certificate costs BDT 500-1,000.

Tax Token
The tax token must be renewed annually. It's essentially a road tax that contributes to road maintenance. The amount depends on engine capacity.

Tips for a Smooth Process
Book your appointment online through the BRTA website to avoid long queues. Arrive early with all documents organized. Consider using an agent if you're unfamiliar with the process, but verify their credentials first.

Always verify that all documents are genuine before completing a vehicle purchase. Counterfeit documents are unfortunately common. Use CarHat.bd's verified seller program for added peace of mind.`,
    coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200",
    author: "CarHat Team",
    tags: ["BRTA", "registration", "guide"],
    views: 2341,
  },
  {
    title: "Best Family Cars Under 40 Lakh in Bangladesh 2024",
    excerpt: "Looking for the perfect family car? We've compiled the best options under 40 lakh BDT that offer safety, comfort, and value for money.",
    content: `Finding the right family car is about balancing safety, space, comfort, fuel efficiency, and budget. Here are our top picks for families in Bangladesh, all available under 40 lakh BDT.

1. Toyota Corolla Cross Hybrid (38-42 Lakh)
The Corolla Cross sits right at our budget limit but offers exceptional value. Hybrid efficiency (22+ km/l), Toyota Safety Sense suite, spacious interior, and Toyota's legendary reliability make it our top pick.

2. Honda HR-V (28-35 Lakh)
Honda's compact SUV offers a surprisingly roomy interior thanks to Honda's Magic Seat system. The 1.5L engine provides good performance while maintaining decent fuel economy.

3. Hyundai Creta (22-28 Lakh)
Excellent value for money with a feature-rich interior. The Creta offers ventilated seats, panoramic sunroof, and advanced safety features at a very competitive price point.

4. Nissan Kicks (20-25 Lakh)
A stylish urban SUV with Nissan's e-Power technology in higher trims. Great fuel economy and a comfortable ride make it ideal for city-dwelling families.

5. Suzuki XL7 (18-22 Lakh)
For budget-conscious families needing seven seats, the XL7 delivers. It's not the most feature-rich option, but it's reliable, affordable to maintain, and offers genuine seven-seat capability.

Safety Considerations
When choosing a family car, prioritize models with at least 6 airbags, ABS, stability control, and ideally advanced features like lane departure warning and automatic emergency braking.

Running Cost Comparison
We factored in fuel costs, insurance, and typical maintenance schedules. Hybrid models like the Corolla Cross have the lowest total cost of ownership despite their higher purchase price.

Our Verdict
For most families, the Hyundai Creta offers the best overall value proposition — it's well-equipped, reliable, and priced competitively. If budget allows, the Toyota Corolla Cross Hybrid is the premium choice.`,
    coverImage: "https://images.unsplash.com/photo-1533473359331-2969b6cb02d4?auto=format&fit=crop&q=80&w=1200",
    author: "CarHat Team",
    tags: ["family cars", "buying guide", "2024"],
    views: 1678,
  },
  {
    title: "Car Maintenance Checklist: Keep Your Vehicle Running Smoothly",
    excerpt: "Regular maintenance extends your car's life and prevents costly repairs. Follow our comprehensive checklist to keep your vehicle in top condition.",
    content: `Whether you drive a brand-new Toyota or a 10-year-old Honda, regular maintenance is the key to longevity and reliability. Here's our comprehensive maintenance checklist.

Monthly Checks
- Tire pressure and tread depth
- Engine oil level
- Coolant level
- Brake fluid level
- All lights and indicators
- Windshield washer fluid
- Battery terminals for corrosion

Every 5,000 km / 3 Months
- Engine oil and filter change
- Check air filter
- Inspect brake pads
- Check tire rotation
- Top up all fluids

Every 20,000 km / 12 Months
- Replace air filter
- Change transmission fluid (automatic)
- Inspect suspension components
- Check spark plugs
- Replace cabin air filter
- Comprehensive brake inspection

Every 40,000 km / 2 Years
- Replace brake fluid
- Change coolant
- Inspect timing belt/chain
- Check drive belts
- Wheel alignment and balancing

Bangladesh-Specific Tips
Given our climate and road conditions, pay extra attention to: cooling system (overheating is common in Dhaka traffic), suspension (potholes take their toll), and the air filter (dust levels are high).

Always use genuine or OEM-equivalent parts. While cheaper alternatives save money upfront, they often lead to more expensive repairs down the line.

Keep a maintenance log — it adds value when you eventually sell your car on CarHat.bd. Buyers love seeing a well-documented service history!`,
    coverImage: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1200",
    author: "CarHat Team",
    tags: ["maintenance", "tips", "DIY"],
    views: 945,
  },
];

export async function GET() {
  try {
    await connectToDatabase();
    await Blog.deleteMany({});

    const blogsWithSlugs = DEMO_BLOGS.map((b) => ({
      ...b,
      slug:
        b.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 5),
    }));

    await Blog.insertMany(blogsWithSlugs);

    return NextResponse.json({
      success: true,
      message: `Seeded ${DEMO_BLOGS.length} demo blog posts.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
