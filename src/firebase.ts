import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User, type Auth } from "firebase/auth";
import { getDatabase, ref, set, get, child, update, remove } from "firebase/database";
import { type UserDetails, type PaymentDetails, type CustomLicense } from "./types";

// Firebase Configurations for Project A, B, and C
export const firebaseConfigA = {
  apiKey: "AIzaSyDTTrMdCgxs5id5NKyJdHGMPJ6vuwtAdRc",
  authDomain: "project-a-f6939.firebaseapp.com",
  projectId: "project-a-f6939",
  storageBucket: "project-a-f6939.firebasestorage.app",
  messagingSenderId: "547454195032",
  appId: "1:547454195032:web:2e6ae939cbe8f4d9a2012d",
  measurementId: "G-32V2YPXH3M",
  databaseURL: "https://project-a-f6939-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

export const firebaseConfigB = {
  apiKey: "AIzaSyCalwuShqXlseI23xj8zCw0RLdsYNVG6TM",
  authDomain: "project-b-aea68.firebaseapp.com",
  projectId: "project-b-aea68",
  storageBucket: "project-b-aea68.firebasestorage.app",
  messagingSenderId: "984826107402",
  appId: "1:984826107402:web:c9dafe7fe7162b988971f3",
  measurementId: "G-8YYJNPQESE",
  databaseURL: "https://project-b-aea68-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

export const firebaseConfigC = {
  apiKey: "AIzaSyCDeg5uC043fLZsNdVsr6UYv_laK-Skn88",
  authDomain: "project-c-4ba21.firebaseapp.com",
  projectId: "project-c-4ba21",
  storageBucket: "project-c-4ba21.firebasestorage.app",
  messagingSenderId: "866346534600",
  appId: "1:866346534600:web:ec367f51bccca9216d87fd",
  measurementId: "G-T0CY7L8YSS",
  databaseURL: "https://project-c-4ba21-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize projects
export const appA = initializeApp(firebaseConfigA, "ProjectA");
export const appB = initializeApp(firebaseConfigB, "ProjectB");
export const appC = initializeApp(firebaseConfigC, "ProjectC");

// Initialize auth instances
export const authA = getAuth(appA);
export const authB = getAuth(appB);
export const authC = getAuth(appC);

// Initialize realtime database instances
export const dbA = getDatabase(appA);
export const dbB = getDatabase(appB);
export const dbC = getDatabase(appC);

// Helper to count registered users in Project A
export async function getRegisteredUserCount(): Promise<number> {
  try {
    const usersSnapshot = await get(ref(dbA, "users"));
    if (usersSnapshot.exists()) {
      return Object.keys(usersSnapshot.val()).length;
    }
  } catch (error) {
    console.error("Error fetching user count form Project A:", error);
  }
  return 0;
}

// Select active Auth instance based on total registered user count
export function selectAuthInstance(userCount: number): Auth {
  if (userCount >= 100000) {
    return authC;
  } else if (userCount >= 50000) {
    return authB;
  }
  return authA;
}

// Generate secure 10-character alphanumeric password
export function generateStrongPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  // Ensure at least 1 uppercase, 1 lowercase, 1 index number, 1 special character
  password += chars[Math.floor(Math.random() * 26)]; // A-Z
  password += chars[Math.floor(Math.random() * 26) + 26]; // a-z
  password += chars[Math.floor(Math.random() * 10) + 52]; // 0-9
  password += chars[Math.floor(Math.random() * 8) + 62]; // special
  
  for (let i = 0; i < 6; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle password characters
  return password.split("").sort(() => 0.5 - Math.random()).join("");
}

// Check for and handle uniqueness of passwords in Project A (users DB) and Project C (custom license DB)
export async function isPasswordUnique(password: string): Promise<boolean> {
  try {
    // 1. Check Project A users
    const usersSnap = await get(ref(dbA, "users"));
    if (usersSnap.exists()) {
      const users = usersSnap.val();
      for (const uid in users) {
        if (users[uid].licensePassword === password) return false;
      }
    }
    // 2. Check Project C custom licenses
    const customSnap = await get(ref(dbC, "custom_licenses"));
    if (customSnap.exists()) {
      const licenses = customSnap.val();
      for (const licId in licenses) {
        if (licenses[licId].password === password) return false;
      }
    }
  } catch (error) {
    console.error("Error checking password uniqueness:", error);
  }
  return true;
}

// Generate a brand new unique 10-digit/char password
export async function getUniqueStrongPassword(): Promise<string> {
  let pw = generateStrongPassword();
  let unique = await isPasswordUnique(pw);
  let attempts = 0;
  while (!unique && attempts < 10) {
    pw = generateStrongPassword();
    unique = await isPasswordUnique(pw);
    attempts++;
  }
  return pw;
}
