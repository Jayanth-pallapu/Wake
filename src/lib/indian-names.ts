// 200+ authentic Indian names from Hindi, Tamil, Telugu, Bengali, Marathi, Punjabi, Gujarati
export const INDIAN_FIRST_NAMES = [
  // Hindi / North Indian
  "Aarav", "Arjun", "Vikram", "Rahul", "Rohit", "Amit", "Sanjay", "Deepak",
  "Manish", "Rajesh", "Suresh", "Dinesh", "Mahesh", "Ramesh", "Naresh",
  "Vikas", "Gaurav", "Pankaj", "Ajay", "Vijay", "Anil", "Kapil", "Ravi",
  "Nikhil", "Varun", "Karan", "Ishaan", "Rohan", "Aditya", "Siddharth",
  "Yash", "Kunal", "Harish", "Manoj", "Prakash", "Girish", "Umesh",
  "Priya", "Divya", "Ananya", "Meera", "Pooja", "Neha", "Swati", "Sapna",
  "Rekha", "Geeta", "Sunita", "Preeti", "Shweta", "Komal", "Pallavi",
  "Kavya", "Nisha", "Shreya", "Tanvi", "Rhea", "Anjali", "Simran", "Riya",
  // Tamil / South Indian
  "Aryan", "Karthik", "Surya", "Vignesh", "Murugan", "Selvam", "Kumaran",
  "Senthil", "Balachandran", "Subramaniam", "Venkatesh", "Anand", "Praveen",
  "Ramkumar", "Saravanan", "Dhinesh", "Yuvaraj", "Balaji", "Gopal", "Hariharan",
  "Lakshmi", "Kavitha", "Suganya", "Malathi", "Revathi", "Geetha", "Vimala",
  "Padmavathi", "Saranya", "Nithya", "Prathiba", "Bhavani", "Dharini",
  // Telugu
  "Charan", "Pavan", "Teja", "Ravi", "Krishna", "Satish", "Prasad",
  "Nagarjuna", "Srinivas", "Venkat", "Sudheer", "Kishore", "Raghav",
  "Supriya", "Madhuri", "Sravanthi", "Mounika", "Bhargavi", "Swapna", "Deepthi",
  // Bengali
  "Sourav", "Subham", "Arnab", "Rishav", "Debraj", "Soumik", "Anirban",
  "Dipankar", "Sudipta", "Sandip", "Biswajit", "Partha", "Sayantan",
  "Debasmita", "Susmita", "Tanushree", "Moumita", "Chandrima", "Sanchari",
  // Marathi
  "Omkar", "Akshay", "Tejas", "Prathamesh", "Rushikesh", "Atharva", "Saurabh",
  "Nilesh", "Amol", "Sachin", "Kedar", "Prasanna", "Abhijit", "Mahendra",
  "Supriya", "Ashwini", "Manasi", "Gauri", "Mugdha", "Sayali", "Rutuja",
  // Punjabi / Sikh
  "Gurpreet", "Harpreet", "Jaspreet", "Manpreet", "Navdeep", "Baldev",
  "Amarjit", "Gurinder", "Kuldeep", "Paramjit", "Sukhdev", "Tejinder",
  "Parminder", "Ravinder", "Satinder", "Davinder", "Harminder", "Jaswinder",
  "Simranjit", "Gurjot", "Navneet", "Dilpreet", "Amandeep",
  // Gujarati
  "Chirag", "Harsh", "Jatin", "Neel", "Parth", "Rishi", "Shrey", "Utsav",
  "Vivek", "Dhruv", "Bhavin", "Hitesh", "Jayesh", "Ketan", "Laxman",
  "Foram", "Heena", "Jigna", "Khushbu", "Mittal", "Pooja", "Rutvi", "Urvi",
  // Additional popular names
  "Raj", "Jai", "Dev", "Sam", "Sid", "Raju", "Bunty", "Lucky", "Prince",
  "Sunny", "Pintu", "Sonu", "Monu", "Bablu", "Pappu", "Rocky", "Shankar",
  "Mohan", "Sohan", "Lalit", "Shashi", "Brijesh", "Yogesh", "Lokesh",
];

const SUFFIXES = [
  "Bets", "Wins", "Pro", "King", "Lucky", "99", "2k", "_VIP", "Casino",
  "777", "Ace", "High", "Max", "X", "Boss", "Star", "Gold", "Elite",
  "_IND", "Gaming", "Plays", "Big", "Rich", "Champ",
];

const NON_INDIAN_NAMES = [
  "JohnD", "MikeT", "Chris99", "AlexBets", "MaxWin", "LucasK", "EthanV",
  "NoahP", "LiamX", "OliverG", "JamesW", "BenjaminR", "WilliamS", "HenryM",
  "SamuelB", "DanielT", "MasonL", "LoganC", "Elijah99", "JacksonH",
  "CryptoKing", "WhaleHunter", "DiamondHands", "MoonShot", "BullRun",
  "SatoshiB", "HODLer", "DeFiDave", "GreenCandle", "BearSlayer",
  "TechWiz", "NightOwl", "DarkHorse", "FastCash", "QuickBet",
  "Maria_L", "AnnaK", "SophieW", "EmmaR", "OliviaM", "IsabellaT",
  "MiaV", "CharlotteB", "AmeliaP", "HarperG", "EveryK", "AbigailL",
];

let _nameCounter = 0;

/** Returns a random Indian-style username like "Arjun_Wins99" */
export function randomIndianUsername(): string {
  const name = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const num = Math.floor(Math.random() * 99);
  return `${name}${suffix}${num > 9 ? num : ''}`;
}

/** Returns a username ensuring ≥55% are Indian across a list */
export function getContestUsername(index: number, totalCount: number): string {
  // Every other one through index 60% is Indian
  const useIndian = (index % 10) < 6; // 60% Indian
  if (useIndian) {
    const name = INDIAN_FIRST_NAMES[index % INDIAN_FIRST_NAMES.length];
    const suffix = SUFFIXES[(index * 3) % SUFFIXES.length];
    return `${name}${suffix}`;
  } else {
    return NON_INDIAN_NAMES[(index * 7) % NON_INDIAN_NAMES.length] + (index % 99 || '');
  }
}

/** Deterministic username from a seed index (for stable bot lists) */
export function seededUsername(seed: number): string {
  const useIndian = (seed % 10) < 6;
  if (useIndian) {
    const name = INDIAN_FIRST_NAMES[seed % INDIAN_FIRST_NAMES.length];
    const suffix = SUFFIXES[(seed * 7) % SUFFIXES.length];
    const num = seed % 100;
    return `${name}${suffix}${num > 0 ? num : ''}`;
  }
  return NON_INDIAN_NAMES[seed % NON_INDIAN_NAMES.length];
}
