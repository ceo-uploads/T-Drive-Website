import { ref, set, get, child, update, remove } from "firebase/database";
import { dbA, dbB, dbC } from "./firebase";
import { type UserDetails, type PaymentDetails, type CustomLicense } from "./types";

// ==========================================
// PROJECT A DATABASE OPERATIONS (Users & Licenses)
// ==========================================

// Save or merge user details (excluding uid and photoURL from RTDB storage)
export async function dbSaveUser(uid: string, user: UserDetails): Promise<void> {
  const userRef = ref(dbA, `users/${uid}`);
  const { uid: _, photoURL: __, ...cleanedUser } = user;
  await set(userRef, cleanedUser);
}

// Get single user details (reconstructing uid dynamically)
export async function dbGetUser(uid: string): Promise<UserDetails | null> {
  try {
    const userSnap = await get(ref(dbA, `users/${uid}`));
    if (userSnap.exists()) {
      const data = userSnap.val();
      return { ...data, uid } as UserDetails;
    }
  } catch (error) {
    console.error("Error reading user details path from Project A database:", error);
  }
  return null;
}

// Get all users (reconstructing uid dynamically from path keys)
export async function dbGetAllUsers(): Promise<UserDetails[]> {
  try {
    const usersSnap = await get(ref(dbA, "users"));
    if (usersSnap.exists()) {
      const data = usersSnap.val();
      return Object.entries(data).map(([key, val]) => {
        return { ...(val as any), uid: key } as UserDetails;
      });
    }
  } catch (error) {
    console.error("Error fetching all users from Project A Database:", error);
  }
  return [];
}

// Update partial fields for user (ensuring uid and photoURL cannot be stored and are omitted)
export async function dbUpdateUser(uid: string, fields: Partial<UserDetails>): Promise<void> {
  const userRef = ref(dbA, `users/${uid}`);
  const { uid: _, photoURL: __, ...cleanedFields } = fields as any;
  await update(userRef, cleanedFields);
}

// Delete user from Project A Database
export async function dbDeleteUser(uid: string): Promise<void> {
  const userRef = ref(dbA, `users/${uid}`);
  await remove(userRef);
}


// ==========================================
// PROJECT B DATABASE OPERATIONS (Payments)
// ==========================================

// Save payment invoice
export async function dbSavePayment(payment: PaymentDetails): Promise<void> {
  const payRef = ref(dbB, `payments/${payment.paymentId}`);
  await set(payRef, payment);
}

// Get payments for a specific user
export async function dbGetUserPayments(uid: string): Promise<PaymentDetails[]> {
  try {
    const paySnap = await get(ref(dbB, "payments"));
    if (paySnap.exists()) {
      const allPayments = Object.values(paySnap.val()) as PaymentDetails[];
      return allPayments.filter((p) => p.uid === uid);
    }
  } catch (error) {
    console.error("Error loading user payments from Project B:", error);
  }
  return [];
}

// Get all payment invoice records
export async function dbGetAllPayments(): Promise<PaymentDetails[]> {
  try {
    const paySnap = await get(ref(dbB, "payments"));
    if (paySnap.exists()) {
      return Object.values(paySnap.val()) as PaymentDetails[];
    }
  } catch (error) {
    console.error("Error loading all payments from Project B database:", error);
  }
  return [];
}

// Update payment status (e.g. Approved, Pending, Declined)
export async function dbUpdatePaymentStatus(paymentId: string, status: "Pending" | "Approved" | "Declined"): Promise<void> {
  const payRef = ref(dbB, `payments/${paymentId}`);
  await update(payRef, { status });
}

// Delete payment
export async function dbDeletePayment(paymentId: string): Promise<void> {
  const payRef = ref(dbB, `payments/${paymentId}`);
  await remove(payRef);
}


// ==========================================
// PROJECT C DATABASE OPERATIONS (Custom Licenses & Other)
// ==========================================

// Save or create a custom license
export async function dbSaveCustomLicense(license: CustomLicense): Promise<void> {
  const licRef = ref(dbC, `custom_licenses/${license.licenseId}`);
  await set(licRef, license);
}

// Retrieve all customer preconfigured licenses
export async function dbGetAllCustomLicenses(): Promise<CustomLicense[]> {
  try {
    const licSnap = await get(ref(dbC, "custom_licenses"));
    if (licSnap.exists()) {
      return Object.values(licSnap.val()) as CustomLicense[];
    }
  } catch (error) {
    console.error("Error reading custom licenses from Project C database:", error);
  }
  return [];
}

// Update custom license details
export async function dbUpdateCustomLicense(licenseId: string, fields: Partial<CustomLicense>): Promise<void> {
  const licRef = ref(dbC, `custom_licenses/${licenseId}`);
  await update(licRef, fields);
}

// Delete custom license config
export async function dbDeleteCustomLicense(licenseId: string): Promise<void> {
  const licRef = ref(dbC, `custom_licenses/${licenseId}`);
  await remove(licRef);
}
