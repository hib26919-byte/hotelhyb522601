// C:\Users\velch\Documents\BaelTreeHotels\client\src\utils\siteData.js

export const HOTEL_INFO = {
  name: "Bael Tree Hotels",
  tagline: "Heritage warmth at the city's pulse",
  address: "Ground Floor, Plot No.529, 100 Feet Road, Madhapur, Hyderabad – 500081",
  phone: "+91-9642325555",
  email: "stay@baeltreehotels.com",
  reservations: "reservations@baeltreehotels.com",
  website: "https://www.baeltreehotels.com",
  coordinatesEmbed:
    "https://www.google.com/maps?q=Ground+Floor,Plot+No.529,100+Feet+Road,Madhapur,Hyderabad&output=embed",
  transit: {
    airport: "35 km from Rajiv Gandhi International Airport (~45 min)",
    railway: "15 km from Secunderabad Railway Station (~25 min)",
    metro: "Nearest metro: Hitech City Station (2 km)",
    hitecCity: "2 km from Hitec City",
    hitex: "2.5 km from HITEX Exhibition Centre",
    financialDistrict: "6 km from Financial District",
  },
};

export const ROOM_CATEGORIES = [
  {
    id: 1,
    category: "standard",
    name: "Standard Room",
    tagline: "Comfort refined to its essence",

    description:
      "Our Standard Rooms offer a serene retreat with all essential amenities thoughtfully curated for the discerning traveller. Clean lines, warm textures, and impeccable service define every stay.",

    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop",
    ],

    videoUrl: "/1.mp4",

    singlePrice: 2500,
    doublePrice: 3000,

    totalRooms: 5,

    amenities: [
      "Complimentary Wi-Fi",
      "Smart TV with OTT",
      "Mini bar",
      "Premium toiletries",
      "Work desk",
      "In-room safe",
      "Air conditioning",
      "24/7 room service",
    ],
  },

  {
    id: 2,
    category: "executive",
    name: "Executive Room",
    tagline: "Sophistication redefined",

    description:
      "The Executive Room is a statement of refined business travel — generous proportions, premium finishes, and a dedicated work area crafted for productivity and relaxation in equal measure.",

    images: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
    ],

    videoUrl: "/2.mp4",

    singlePrice: 3500,
    doublePrice: 4000,

    totalRooms: 55,

    amenities: [
      "Luxury bedding",
      "Executive workspace",
      "High-speed Wi-Fi",
      "Premium toiletries",
      "Coffee machine",
      "Mini bar",
      "Smart lighting",
      "Private dining support",
    ],
  },

  {
    id: 3,
    category: "premium",
    name: "Premium Room",
    tagline: "Where luxury meets intention",

    description:
      "Premium Rooms offer a heightened experience with curated décor, a larger footprint, and exclusive touches that transform every detail of your stay into a memory worth keeping.",

    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop",
    ],

    videoUrl: "/3.mp4",

    singlePrice: 4500,
    doublePrice: 5000,

    totalRooms: 10,

    amenities: [
      "Premium interiors",
      "Luxury king-size bed",
      "Rain shower",
      "Mini bar",
      "Smart TV",
      "Coffee maker",
      "Bathrobe & slippers",
      "Dedicated concierge",
    ],
  },

  {
    id: 4,
    category: "suite",
    name: "Suite Room",
    tagline: "The pinnacle of bespoke living",

    description:
      "Designed for guests who expect exceptional luxury, the Suite Room delivers expansive living spaces, elevated comfort, elegant ambience, and highly personalised hospitality.",

    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop",
    ],

    videoUrl: "/4.mp4",

    singlePrice: 6500,
    doublePrice: 7500,

    totalRooms: 15,

    amenities: [
      "Separate living area",
      "Luxury bathtub",
      "Private lounge access",
      "Premium hospitality",
      "Dedicated butler service",
      "Dining area",
      "Exclusive interiors",
      "VIP guest services",
    ],
  },
];
export const DEFAULT_HERO_IMAGES = [
  {
    id: "hero-1",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80",
    alt: "Bael Tree Hotels luxury lobby",
    order: 0,
  },
  {
    id: "hero-2",
    image:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1920&q=80",
    alt: "Bael Tree Hotels pool view",
    order: 1,
  },
  {
    id: "hero-3",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80",
    alt: "Bael Tree Hotels dining",
    order: 2,
  },
];

export const GALLERY_IMAGES = [
  {
    id: "g1",
    url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
    caption: "Standard Room",
    category: "rooms",
  },
  {
    id: "g2",
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    caption: "Hotel Lobby",
    category: "hotel",
  },
  {
    id: "g3",
    url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    caption: "Fine Dining",
    category: "dining",
  },
  {
    id: "g4",
    url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
    caption: "Suite Room",
    category: "rooms",
  },
  {
    id: "g5",
    url: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80",
    caption: "Pool View",
    category: "hotel",
  },
  {
    id: "g6",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    caption: "Executive Room",
    category: "rooms",
  },
];

export const AMENITY_GROUPS = {
  standard: [
    {
      name: "Complimentary Wi-Fi",
      icon: "Wifi",
      description: "High-speed internet throughout the property",
    },
    {
      name: "Smart TV with OTT",
      icon: "Tv",
      description: "Netflix, Prime Video and more",
    },
    {
      name: "Premium Toiletries",
      icon: "Sparkles",
      description: "Curated bath and body products",
    },
    {
      name: "24/7 Room Service",
      icon: "Bell",
      description: "In-room dining around the clock",
    },
    {
      name: "Air Conditioning",
      icon: "Wind",
      description: "Climate-controlled comfort",
    },
    {
      name: "Daily Housekeeping",
      icon: "Star",
      description: "Meticulous daily turndown service",
    },
  ],
  premium: [
    {
      name: "Mini Bar",
      icon: "Coffee",
      description: "Curated beverages and snacks",
    },
    {
      name: "Airport Transfer",
      icon: "Car",
      description: "Private chauffeur service",
    },
    {
      name: "In-Room Safe",
      icon: "Shield",
      description: "Secure personal vault",
    },
    {
      name: "Work Desk",
      icon: "Monitor",
      description: "Ergonomic business setup",
    },
    {
      name: "Travel Desk",
      icon: "MapPin",
      description: "Local tours and ticketing",
    },
    {
      name: "Butler Service",
      icon: "UserCheck",
      description: "Personalised suite attendance",
    },
  ],
};

export const DINING_VENUES = [
  {
    id: "kadali-patra",
    name: "Kadali Patra",
    title: "Vegetarian",
    logoMark: "KP",
    accent: "#7b1a1a",
    description:
      "A serene vegetarian sanctuary inspired by Satvic culinary traditions. Kadali Patra celebrates the art of plant-based cooking with heritage recipes, seasonal produce, and a menu that balances nourishment with indulgence.",
    highlights: [
      "Satvic vegetarian menu",
      "Heritage South Indian recipes",
      "Seasonal fresh produce",
      "Jain-friendly options available",
    ],
    images: [
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
    ],
    timings: {
      breakfast: "7:00 AM – 10:30 AM",
      lunch: "12:30 PM – 3:00 PM",
      dinner: "7:00 PM – 10:30 PM",
    },
  },
  {
    id: "soul-curry",
    name: "The Soul Curry",
    title: "Gourmet Non-Veg",
    logoMark: "SC",
    accent: "#c9a84c",
    description:
      "The Soul Curry is a bold celebration of India's gourmet non-vegetarian legacy — slow-cooked dum biryanis, coastal seafood, and rich Mughlai-inspired preparations presented with modern elegance.",
    highlights: [
      "Dum biryani specialties",
      "Coastal seafood selection",
      "Mughlai and Hyderabadi cuisine",
      "Curated cocktail and mocktail bar",
    ],
    images: [
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1631452180775-498bfab48b8e?auto=format&fit=crop&w=800&q=80",
    ],
    timings: {
      breakfast: "7:00 AM – 10:30 AM",
      lunch: "12:30 PM – 3:00 PM",
      dinner: "7:00 PM – 11:00 PM",
    },
  },
];

export const HOTEL_KNOWLEDGE = {
  dining: {
    breakfast: "7:00 AM – 10:30 AM",
    lunch: "12:30 PM – 3:00 PM",
    dinner: "7:00 PM – 10:30 PM",
    restaurants: ["Kadali Patra", "The Soul Curry"],
  },
  amenities: [
    "Complimentary Wi-Fi",
    "Smart TV with OTT",
    "Mini bar",
    "Premium toiletries",
    "Airport transfer",
    "In-room safe",
    "Work desk",
    "Travel desk",
    "24/7 room service",
    "Daily housekeeping",
    "Concierge service",
    "Laundry service",
  ],
  location: {
    airport: "35 km from Rajiv Gandhi International Airport",
    railway: "15 km from Secunderabad Railway Station",
    hitecCity: "2 km from Hitec City",
  },
  booking:
    "You can book directly on our website by selecting your room, choosing dates, filling in guest details, selecting occupancy, and completing payment securely via Razorpay.",
};

export const INTENTS = {
  greeting: ["hello", "hi", "hey", "good morning", "good evening", "namaste"],
  rooms: ["room", "rooms", "suite", "standard", "executive", "premium", "accommodation"],
  pricing: ["price", "cost", "rate", "tariff", "how much", "charge", "fee"],
  dining: ["food", "dining", "restaurant", "eat", "breakfast", "lunch", "dinner", "menu"],
  amenities: ["amenity", "amenities", "facilities", "wifi", "pool", "gym", "parking"],
  location: ["location", "address", "where", "directions", "map", "reach", "distance"],
  booking: ["book", "reserve", "reservation", "check availability", "availability"],
  contact: ["contact", "phone", "email", "call", "reach"],
  attractions: ["nearby", "places", "visit", "attractions", "sightseeing", "things to do"],
  checkout: ["check out", "checkout", "check-out", "leave", "departure"],
  checkin: ["check in", "checkin", "check-in", "arrival", "arrive"],
  thanks: ["thank", "thanks", "thank you", "grateful"],
  bye: ["bye", "goodbye", "see you", "later", "exit"],
};

export const QUICK_REPLY_OPTIONS = [
  "Room prices",
  "Dining timings",
  "How to reach",
  "Book a room",
  "Amenities",
  "Contact us",
];

export const ATTRACTIONS = [
  {
    id: "a1",
    name: "Golconda Fort",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
    distance: "18 km",
  },
  {
    id: "a2",
    name: "Charminar",
    image:
      "https://images.unsplash.com/photo-1575995872537-3793d29d972c?auto=format&fit=crop&w=600&q=80",
    distance: "20 km",
  },
  {
    id: "a3",
    name: "Hussain Sagar Lake",
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    distance: "10 km",
  },
  {
    id: "a4",
    name: "Ramoji Film City",
    image:
      "https://images.unsplash.com/photo-1598977462093-eb93823e0ef4?auto=format&fit=crop&w=600&q=80",
    distance: "32 km",
  },
  {
    id: "a5",
    name: "Birla Mandir",
    image:
      "https://images.unsplash.com/photo-1609920658906-8223bd289001?auto=format&fit=crop&w=600&q=80",
    distance: "9 km",
  },
  {
    id: "a6",
    name: "Nehru Zoological Park",
    image:
      "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=600&q=80",
    distance: "15 km",
  },
];

export const TESTIMONIALS = [
  {
    id: "t1",
    name: "Arjun Reddy",
    location: "Bengaluru, Karnataka",
    rating: 5,
    text: "Staying at Bael Tree Hotels was like stepping into a beautifully curated world of warmth and quiet luxury. The Executive Room was perfect for my week-long project at Hitec City.",
  },
  {
    id: "t2",
    name: "Priya Sharma",
    location: "Mumbai, Maharashtra",
    rating: 5,
    text: "The Suite Room made our anniversary unforgettable. Every detail — from the welcome flowers to the turndown service — was thoughtfully arranged. Will return again.",
  },
  {
    id: "t3",
    name: "Mohammed Ali",
    location: "Chennai, Tamil Nadu",
    rating: 4,
    text: "Great location, excellent food at The Soul Curry, and a very helpful front desk team. The Standard Room was clean, quiet, and well-equipped for business travel.",
  },
];

export const FOUNDERS = [
  {
    id: "f1",
    name: "Ravi Teja Velcheti",
    role: "Founder & Managing Director",
    bio: "With a background in hospitality management and a passion for heritage architecture, Ravi Teja envisioned Bael Tree Hotels as a bridge between traditional Indian warmth and contemporary luxury.",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    linkedin: "",
  },
  {
    id: "f2",
    name: "Kavitha Nair",
    role: "Co-Founder & Operations Head",
    bio: "Kavitha brings 15 years of luxury hotel operations expertise. Her meticulous attention to guest experience has shaped the service culture that defines every Bael Tree stay.",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b1e6?auto=format&fit=crop&w=600&q=80",
    linkedin: "",
  },
  {
    id: "f3",
    name: "Suresh Kumar",
    role: "Director of Culinary Arts",
    bio: "Chef Suresh has trained across five-star kitchens in India and Southeast Asia. He oversees both restaurant concepts with a philosophy rooted in seasonal, regional ingredients.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    linkedin: "",
  },
];

export const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  festivalMode: false,
  activeBannerId: "",
  hotelInfo: {
    hotelName: "Bael Tree Hotels",
    hotelPhone: "+91-9642325555",
    hotelEmail: "stay@baeltreehotels.com",
    checkInTime: "2:00 PM",
    checkOutTime: "11:00 AM",
    gstPercentage: 12,
    currency: "INR",
  },
};
