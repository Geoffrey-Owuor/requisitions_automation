import hotpoint_logo from "./hotpoint_icon.png";
import form_image from "./form_image.png";
import hotpoint_background from "./hotpoint_logo.png";
import hotpoint_black_logo from "./hotpoint_black_logo.png";
import it_form_image from "./it_form_image.png";
import access_key_image from "./access_key_image.png";
import advance_form_image from "./advance_form_image.png";

export const assets = {
  access_key_image,
  advance_form_image,
  hotpoint_logo,
  form_image,
  hotpoint_background,
  hotpoint_black_logo,
  it_form_image,
};

// Date formatter
export function dateFormatter(dateString: string) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  const dateResult = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return dateResult;
}

export const TRAVEL_CATEGORIES = ["International", "Local"];
export const TRAVEL_MODES = ["Road", "Air"];
export const BUDGET_STATUS = ["Yes", "No"];

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const initialsHelper = (userName: string) => {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials;
};

export function getDailyGreeting(date: Date = new Date()): string {
  const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)

  const greetings: Record<number, string[]> = {
    0: ["Easy like Sunday morning! ☀️", "Happy Sunday! Time to recharge 🔋"],
    1: [
      "May your coffee be strong and your Monday be short! ☕",
      "Happy Monday! Let's crush this week 🚀",
    ],
    2: [
      "Terrific Tuesday! You're already crushing it 💪",
      "Happy Tuesday! Keep up the great momentum ✨",
    ],
    3: [
      "Happy Hump Day! We're officially halfway there 🐪",
      "Wonderful Wednesday! Keep shining 🌟",
    ],
    4: [
      "Thrilling Thursday! The weekend is officially in sight 👀",
      "Happy Thursday! Let's finish strong 🏁",
    ],
    5: [
      "Fri-nally! Time to wrap up and celebrate 🥳",
      "TGIF! Have a fantastic Friday 🎉",
    ],
    6: [
      "Super Saturday! Time to relax and unwind 🌴",
      "Happy Saturday! Enjoy those weekend vibes 🛋️",
    ],
  };

  // Get the array of greetings for the current day
  const dailyGreetings = greetings[dayOfWeek];

  // Pick a random greeting from the available options
  const randomIndex = Math.floor(Math.random() * dailyGreetings.length);

  return dailyGreetings[randomIndex];
}
