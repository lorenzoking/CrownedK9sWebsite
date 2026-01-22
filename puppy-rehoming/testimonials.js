/**
 * Testimonials Data for Premium Puppy Placement Program
 * 
 * HOW TO EDIT:
 * - Add new testimonials to the array below
 * - Each testimonial has: name, quote, pupName, breed (optional)
 * - The HTML page references these by puppy name for display
 * 
 * To use dynamically in the future, import this file and render testimonials
 * programmatically instead of hardcoding them in the HTML.
 */

const REHOMING_TESTIMONIALS = [
  {
    pupName: "Rocko",
    breed: "French Bulldog",
    quote: "Rocko was ready from day one. Slept through the night, knew his commands, and fit right in. Worth every penny.",
    author: "Rocko's Family"
  },
  {
    pupName: "Kai",
    breed: "Olde English Bulldogge",
    quote: "We were nervous about getting a puppy, but Kai made it easy. The training foundation was incredible.",
    author: "Kai's Family"
  },
  {
    pupName: "Charlie",
    breed: "Olde English Bulldogge",
    quote: "Charlie's recall is so reliable. Our friends can't believe how well-trained he is for his age.",
    author: "Charlie's Family"
  },
  // Add more testimonials here as you collect them:
  // {
  //   pupName: "Pup Name",
  //   breed: "Breed Name",
  //   quote: "What the family said about their experience...",
  //   author: "Family Name or 'Anonymous'"
  // },
];

/**
 * VALUE TABLE ITEMS
 * Edit these to update the value breakdown chart on the page.
 */
const VALUE_TABLE_ITEMS = [
  {
    name: "2–3 Week Board & Train Equivalent",
    value: "$2,000 – $3,000",
    included: true
  },
  {
    name: "2 Follow-Up Private Sessions",
    value: "$300",
    included: true
  },
  {
    name: "Go-Home Gear (collar, harness, leash, toys, food)",
    value: "Varies (~$75–$150)",
    included: true
  },
  {
    name: "Vaccinations & Vet Visits (up to date)",
    value: "Varies",
    included: true
  },
  {
    name: "Lifetime Support / Direct Line to Trainer",
    value: "Priceless",
    included: true
  },
  {
    name: "University Elite Pricing / Lifetime Trained-Dog Perks",
    value: "$10 per month and $160 per month",
    included: true
  },
  {
    name: "Free Entry to Puppy Group Class",
    value: "$80",
    included: true
  }
];

/**
 * FEE RANGE
 * Update this when pricing changes
 */
const REHOMING_FEE_RANGE = {
  min: 2500,
  max: 3500,
  display: "$2,500 – $3,500"
};

/**
 * CURRENT & PAST PUPS
 * Structured data for puppy cards
 */
const CURRENT_PUPS = [
  {
    name: "Izzy",
    breed: "Olde English Bulldogge",
    gender: "Female",
    birthDate: "November 25, 2025",
    status: "available", // "available" | "coming" | "reserved" | "rehomed"
    arrivalDate: "January 18, 2026",
    description: "Beautiful brindle Olde English Bulldogge puppy with a sweet, calm temperament. Training for service dog potential.",
    mainImage: "/pictures/PRP/Izzie/IMG_8420.jpeg",
    images: [
      "/pictures/PRP/Izzie/IMG_8421.jpeg"
    ],
    videos: [
      "/pictures/PRP/Izzie/IMG_6061.MOV"
    ],
    parents: {
      mom: "/pictures/PRP/Izzie/IMG_8238.JPG",
      dad: "/pictures/PRP/Izzie/IMG_8239.JPG"
    }
  }
];

const PAST_PUPS = [
  { name: "Rocko", breed: "French Bulldog", image: "../pictures/PRP/rocko.jpg" },
  { name: "Kai", breed: "Olde English Bulldogge", image: "../pictures/PRP/Kai.jpeg" },
  { name: "Charlie", breed: "Olde English Bulldogge", image: "../pictures/PRP/Charlie.jpeg" },
  { name: "Brutus", breed: "Amstaff", image: "../pictures/PRP/brutus.jpg" },
  { name: "Mozzie", breed: "Mini Australian Shepherd", image: "../pictures/PRP/mozzie.jpeg" },
  { name: "Maple", breed: "Amstaff", image: "../pictures/PRP/maple.jpeg" },
  { name: "Gwen", breed: "Olde English Bulldogge", image: "../pictures/PRP/gwen.jpg" },
  { name: "Pawly", breed: "Olde English Bulldogge", image: "../pictures/PRP/pawly.jpeg" },
  { name: "Puma", breed: "Olde English Bulldogge", image: "../pictures/PRP/puma.jpg" },
  { name: "Wynter", breed: "Olde English Bulldogge", image: "../pictures/PRP/wynter.jpg" }
];

// Export for use in other modules (if using a build system)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    REHOMING_TESTIMONIALS,
    VALUE_TABLE_ITEMS,
    REHOMING_FEE_RANGE,
    CURRENT_PUPS,
    PAST_PUPS
  };
}
