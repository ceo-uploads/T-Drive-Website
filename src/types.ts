export type Language = "en" | "bn";

export interface UserDetails {
  uid?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  trialActivated: boolean;
  trialActivatedAt: string | null;
  trialEndsAt: string | null;
  licenseStatus: "Active" | "Inactive";
  activePackage: string | null; // "1 Month", "3 Month", "6 Month", "1 Year", "Lifetime", "Free Trial"
  licenseKey: string | null; // Generated 10 digit password or unique key
  licensePassword: string | null; // Generated Strong 10-digit password
  licenseActiveDate: string | null;
  licenseEndDate: string | null;
  whatsApp?: string;
  telegram_api?: {
    api_id?: string;
    api_hash?: string;
    lastUpdated?: string;
  };
  telegram_info?: any;
}

export interface PaymentDetails {
  paymentId: string;
  uid: string;
  email: string;
  packageName: string;
  amount: number;
  method: "bKash" | "Nagad";
  accountNumber: string;
  trxId: string;
  status: "Pending" | "Approved" | "Declined";
  createdAt: string;
  whatsApp?: string;
}

export interface CustomLicense {
  licenseId: string;
  username: string; // AS Email
  password: string; // Unique 10-character strong password
  packageName: string;
  assignedToEmail: string | null;
  createdAt: string;
  status: "Active" | "Inactive";
}

export interface Package {
  id: string;
  name: string;
  priceTK: number;
  originalPriceTK: number;
  savings: string;
}

export const packages: Package[] = [
  { id: "pkg_1", name: "1 Month", priceTK: 150, originalPriceTK: 200, savings: "25%" },
  { id: "pkg_3", name: "3 Month", priceTK: 350, originalPriceTK: 600, savings: "41.6%" },
  { id: "pkg_6", name: "6 Month", priceTK: 700, originalPriceTK: 1200, savings: "41.6%" },
  { id: "pkg_12", name: "1 Year", priceTK: 1200, originalPriceTK: 2400, savings: "50%" },
  { id: "pkg_lifetime", name: "Lifetime", priceTK: 6000, originalPriceTK: 10000, savings: "40%" },
];
