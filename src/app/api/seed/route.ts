import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Listing } from "@/lib/models/Listing";

const DEMO_CARS = [
  {
    make: "Toyota",
    model: "Corolla Cross",
    year: 2024,
    price: 4200000,
    mileage: 5000,
    condition: "reconditioned",
    fuelType: "hybrid",
    transmission: "automatic",
    engineSize: 1800,
    color: "Pearl White",
    location: "Gulshan, Dhaka",
    description: "Brand new Toyota Corolla Cross Hybrid Z Package. Push start, panoramic sunroof, 360-degree camera, JBL sound system, wireless charging. Zero accident history, first party papers.",
    images: ["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=1200"],
    views: 342,
    features: ["Push Start", "Panoramic Sunroof", "360 Camera", "JBL Sound", "Lane Assist", "Adaptive Cruise Control"],
  },
  {
    make: "Honda",
    model: "Civic RS Turbo",
    year: 2023,
    price: 3500000,
    mileage: 12000,
    condition: "used",
    fuelType: "petrol",
    transmission: "automatic",
    engineSize: 1500,
    color: "Rallye Red",
    location: "Banani, Dhaka",
    description: "Honda Civic RS Turbo with full VTEC performance. Upgraded exhaust, leather seats, ambient lighting, Honda Sensing suite. Maintained at authorized dealer only.",
    images: ["https://images.unsplash.com/photo-1606611013016-969c19ba27e5?auto=format&fit=crop&q=80&w=1200"],
    views: 518,
    features: ["Honda Sensing", "Leather Seats", "Turbo Engine", "Apple CarPlay", "Android Auto"],
  },
  {
    make: "BMW",
    model: "5 Series 530e",
    year: 2022,
    price: 9800000,
    mileage: 18000,
    condition: "used",
    fuelType: "hybrid",
    transmission: "automatic",
    engineSize: 2000,
    color: "Carbon Black",
    location: "Dhanmondi, Dhaka",
    description: "BMW 530e M Sport Plug-in Hybrid. Executive driven, full service history from Executive Motors. Harman Kardon surround sound, gesture control, wireless charging, heads-up display.",
    images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1200"],
    views: 890,
    features: ["M Sport Package", "Harman Kardon", "Heads-Up Display", "Gesture Control", "Parking Assist Plus"],
  },
  {
    make: "Mercedes-Benz",
    model: "C-Class C200 AMG",
    year: 2021,
    price: 7200000,
    mileage: 28000,
    condition: "used",
    fuelType: "petrol",
    transmission: "automatic",
    engineSize: 1500,
    color: "Selenite Grey",
    location: "Baridhara, Dhaka",
    description: "Mercedes C200 AMG Line fully loaded. Burmester audio, panoramic roof, 64-color ambient lighting, digital instrument cluster, MBUX infotainment. Impeccable condition.",
    images: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=1200"],
    views: 675,
    features: ["AMG Line", "Burmester Audio", "Panoramic Roof", "64-Color Ambient Light", "MBUX System"],
  },
  {
    make: "Hyundai",
    model: "Tucson N-Line",
    year: 2024,
    price: 5200000,
    mileage: 3000,
    condition: "new",
    fuelType: "petrol",
    transmission: "automatic",
    engineSize: 2000,
    color: "Phantom Black",
    location: "Uttara, Dhaka",
    description: "Almost brand new Hyundai Tucson N-Line with sport-tuned suspension. Bose premium audio, ventilated seats, blind spot collision avoidance, remote smart parking. Still under full warranty.",
    images: ["https://images.unsplash.com/photo-1644438667516-8d4d90078d76?auto=format&fit=crop&q=80&w=1200"],
    views: 234,
    features: ["N-Line Sport", "Bose Audio", "Ventilated Seats", "Blind Spot Warning", "Remote Parking"],
  },
  {
    make: "Nissan",
    model: "X-Trail e-Power",
    year: 2023,
    price: 3800000,
    mileage: 22000,
    condition: "used",
    fuelType: "hybrid",
    transmission: "automatic",
    engineSize: 1500,
    color: "Diamond Silver",
    location: "Mirpur, Dhaka",
    description: "Nissan X-Trail e-Power 4WD — the perfect family SUV. ProPILOT autonomous driving, leather seats, 360-degree camera, auto tailgate, tri-zone climate control.",
    images: ["https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=1200"],
    views: 312,
    features: ["e-Power Hybrid", "ProPILOT", "360 Camera", "Auto Tailgate", "Tri-Zone Climate"],
  },
  {
    make: "Toyota",
    model: "Land Cruiser Prado",
    year: 2020,
    price: 12500000,
    mileage: 45000,
    condition: "used",
    fuelType: "diesel",
    transmission: "automatic",
    engineSize: 2800,
    color: "Super White",
    location: "Gulshan, Dhaka",
    description: "Toyota Land Cruiser Prado TX-L with Diesel engine. 7-seater, Crawl Control, Multi-Terrain Select, Kinetic Dynamic Suspension, full leather interior, sunroof. Ultimate off-road luxury.",
    images: ["https://images.unsplash.com/photo-1594611020663-4821e532e528?auto=format&fit=crop&q=80&w=1200"],
    views: 1250,
    features: ["7 Seats", "Crawl Control", "Multi-Terrain Select", "Sunroof", "4WD"],
  },
  {
    make: "Audi",
    model: "A4 45 TFSI",
    year: 2022,
    price: 6500000,
    mileage: 15000,
    condition: "used",
    fuelType: "petrol",
    transmission: "automatic",
    engineSize: 2000,
    color: "Mythos Black",
    location: "Banani, Dhaka",
    description: "Audi A4 45 TFSI Quattro S-Line. Virtual cockpit, B&O sound system, matrix LED headlights, adaptive sport suspension. Pristine condition with full Audi service history.",
    images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&q=80&w=1200"],
    views: 445,
    features: ["S-Line", "Quattro AWD", "Virtual Cockpit", "B&O Sound", "Matrix LED"],
  },
  {
    make: "Mitsubishi",
    model: "Pajero Sport",
    year: 2021,
    price: 5800000,
    mileage: 35000,
    condition: "used",
    fuelType: "diesel",
    transmission: "automatic",
    engineSize: 2400,
    color: "Jet Black Mica",
    location: "Chittagong",
    description: "Mitsubishi Pajero Sport GT Premium 4WD. Super Select II 4WD, 8-speed automatic, Rockford Fosgate audio, 8 airbags, 360-degree camera. Perfect for highway and off-road.",
    images: ["https://images.unsplash.com/photo-1625231334168-24ed46e8a9a2?auto=format&fit=crop&q=80&w=1200"],
    views: 389,
    features: ["4WD Super Select II", "Rockford Fosgate Audio", "8 Airbags", "360 Camera", "Paddle Shifters"],
  },
  {
    make: "Suzuki",
    model: "Swift Sport",
    year: 2023,
    price: 1800000,
    mileage: 8000,
    condition: "used",
    fuelType: "petrol",
    transmission: "manual",
    engineSize: 1400,
    color: "Champion Yellow",
    location: "Sylhet",
    description: "Suzuki Swift Sport ZC33S — the ultimate hot hatchback! BoosterJet turbo, sport seats, sport exhaust, lightweight body. Pure driving fun at an affordable price.",
    images: ["https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=1200"],
    views: 567,
    features: ["BoosterJet Turbo", "Sport Seats", "Sport Exhaust", "Lightweight", "6-Speed Manual"],
  },
  {
    make: "Kia",
    model: "Sportage HT-Line",
    year: 2024,
    price: 4800000,
    mileage: 2000,
    condition: "new",
    fuelType: "petrol",
    transmission: "automatic",
    engineSize: 1600,
    color: "Gravity Grey",
    location: "Uttara, Dhaka",
    description: "Brand new Kia Sportage HT-Line with dual curved panoramic display. Meridian premium audio, highway driving assist, remote smart parking, ventilated & heated seats.",
    images: ["https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=1200"],
    views: 198,
    features: ["Meridian Audio", "Highway Driving Assist", "Ventilated Seats", "Smart Parking", "Panoramic Display"],
  },
  {
    make: "Lexus",
    model: "RX 350h F-Sport",
    year: 2023,
    price: 14500000,
    mileage: 8000,
    condition: "used",
    fuelType: "hybrid",
    transmission: "automatic",
    engineSize: 2500,
    color: "Sonic Chrome",
    location: "Gulshan, Dhaka",
    description: "Lexus RX 350h F-Sport — the pinnacle of luxury SUVs. Mark Levinson 21-speaker audio, heads-up display, panoramic roof, air suspension, semi-aniline leather. An absolute masterpiece.",
    images: ["https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&q=80&w=1200"],
    views: 756,
    features: ["F-Sport", "Mark Levinson Audio", "Air Suspension", "HUD", "Semi-Aniline Leather", "Panoramic Roof"],
  },
  {
    make: "Mazda",
    model: "CX-5 Signature",
    year: 2022,
    price: 3200000,
    mileage: 25000,
    condition: "used",
    fuelType: "petrol",
    transmission: "automatic",
    engineSize: 2500,
    color: "Soul Red Crystal",
    location: "Dhanmondi, Dhaka",
    description: "Mazda CX-5 Signature — stunning KODO design with Soul Red Crystal paint. Nappa leather, Bose audio, 360 view monitor, head-up display, G-Vectoring Control Plus.",
    images: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=1200"],
    views: 423,
    features: ["KODO Design", "Nappa Leather", "Bose Audio", "HUD", "i-Activ AWD"],
  },
  {
    make: "Volkswagen",
    model: "Tiguan R-Line",
    year: 2023,
    price: 5500000,
    mileage: 12000,
    condition: "used",
    fuelType: "petrol",
    transmission: "automatic",
    engineSize: 2000,
    color: "Oryx White Pearl",
    location: "Mirpur, Dhaka",
    description: "Volkswagen Tiguan R-Line TSI 4Motion. Progressive steering, DCC adaptive chassis control, digital cockpit pro, Harman Kardon audio, IQ.LIGHT LED matrix headlights.",
    images: ["https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=1200"],
    views: 334,
    features: ["R-Line", "4Motion AWD", "Digital Cockpit Pro", "Harman Kardon", "IQ.LIGHT Matrix LED"],
  },
];

export async function GET() {
  try {
    await connectToDatabase();

    await User.deleteMany({});
    await Listing.deleteMany({});

    const hashedPassword = await bcrypt.hash("password123", 10);

    const dealer1 = await User.create({
      name: "Auto Traders BD",
      email: "dealer@carhat.bd",
      password: hashedPassword,
      role: "dealer",
    });

    const dealer2 = await User.create({
      name: "Premium Motors Dhaka",
      email: "premium@carhat.bd",
      password: hashedPassword,
      role: "dealer",
    });

    const privateSeller = await User.create({
      name: "Rahim Ahmed",
      email: "rahim@carhat.bd",
      password: hashedPassword,
      role: "seller",
    });

    // Admin account
    await User.create({
      name: "Admin",
      email: "admin@carhat.bd",
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });

    const sellers = [dealer1, dealer2, privateSeller];

    const formattedListings = DEMO_CARS.map((car, i) => ({
      ...car,
      title: `${car.year} ${car.make} ${car.model}`,
      slug:
        `${car.year}-${car.make}-${car.model}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-") +
        "-" +
        Math.floor(Math.random() * 10000),
      sellerId: sellers[i % sellers.length]._id,
      status: "active",
    }));

    await Listing.insertMany(formattedListings);

    return NextResponse.json({
      success: true,
      message: `Database seeded with ${DEMO_CARS.length} premium cars and 4 accounts.`,
      testAccounts: [
        { email: "admin@carhat.bd", password: "password123", role: "admin" },
        { email: "dealer@carhat.bd", password: "password123", role: "dealer" },
        { email: "premium@carhat.bd", password: "password123", role: "dealer" },
        { email: "rahim@carhat.bd", password: "password123", role: "seller" },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
