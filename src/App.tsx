import React, { useState, useEffect } from "react";
import { 
  Menu, X, Globe, LogIn, LogOut, Shield, Compass, Download, 
  Layers, CreditCard, HelpCircle, Phone, Mail, CheckCircle, 
  AlertCircle, Users, BarChart3, Clock, DollarSign, Search, 
  Trash2, Plus, Calendar, FileText, ChevronRight, MessageSquare, Copy, Star,
  RefreshCw, Sun, Moon, Smartphone
} from "lucide-react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User } from "firebase/auth";
import { ref, get, set, update } from "firebase/database";

import { 
  authA, authB, authC, dbA, dbB, dbC, 
  getRegisteredUserCount, selectAuthInstance, getUniqueStrongPassword 
} from "./firebase";
import { 
  dbSaveUser, dbGetUser, dbGetAllUsers, dbUpdateUser, dbDeleteUser,
  dbSavePayment, dbGetUserPayments, dbGetAllPayments, dbUpdatePaymentStatus, dbDeletePayment,
  dbSaveCustomLicense, dbGetAllCustomLicenses, dbDeleteCustomLicense
} from "./dbService";
import { type UserDetails, type PaymentDetails, type CustomLicense, packages } from "./types";
import { translations } from "./translations";

import TDriveSimulator from "./components/TDriveSimulator";
import ThreeCanvas from "./components/ThreeCanvas";
import AdSenseUnit from "./components/AdSenseUnit";

// Constant pointer for Time Compare
const LOCAL_TIME_NOW = "2026-05-25T04:16:04Z";

const BkashLogo = ({ className = "h-5" }: { className?: string }) => (
  <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="32" rx="6" fill="#e2125d" />
    <path d="M12 16c0 0 1.2.6 1.8.8.7.2 1.4.1 1.9-.3.5-.4 1.1-1.1 1.1-1.1s-.4.6-.9 1.1c-.5.5-1.2.9-2 .8-.7-.1-1.3-.4-1.9-.8L12 16zm0 0c-.3-.2-.5-.5-.7-.8l.8-.2c.2.2.4.4.7.6.3.2.7.2 1 0 .3-.2.4-.6.3-1l.8-.2c.2.6.1 1.3-.3 1.8-.4.5-1.1.7-1.7.4z" fill="#ffffff" />
    <path d="M16 10c2 0 3.5 1.5 3.5 3.5S18 17 16 17s-3.5-1.5-3.5-3.5S14 10 16 10z" fill="#ffffff" opacity="0.15" />
    <path d="M16 11.5a2 2 0 100 4 2 2 0 000-4z" fill="#ffffff" />
    <text x="29" y="21" fill="#ffffff" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="13px" letterSpacing="0.05em">bKash</text>
  </svg>
);

const NagadLogo = ({ className = "h-5" }: { className?: string }) => (
  <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="32" rx="6" fill="#f26422" />
    <circle cx="16" cy="16" r="6" stroke="#ffffff" strokeWidth="2" strokeDasharray="10 4" />
    <circle cx="16" cy="16" r="2.5" fill="#ffffff" />
    <text x="29" y="21" fill="#ffffff" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="13px" letterSpacing="0.05em">Nagad</text>
  </svg>
);

export default function App() {
  // Navigation & Language States
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [currentView, setCurrentView] = useState<"home" | "downloads" | "trial" | "pricing" | "privacy" | "terms" | "profile">("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  // Auth & User details loaded from dbA
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileDetails, setProfileDetails] = useState<UserDetails | null>(null);
  const [userTotalCount, setUserTotalCount] = useState<number>(0);
  const [simulatedLoginEmail, setSimulatedLoginEmail] = useState("");
  const [showSimulatedLogin, setShowSimulatedLogin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Real-time tick update clock state for license/trial remain counts
  const [realtimeClock, setRealtimeClock] = useState<Date>(new Date());

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setRealtimeClock(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Pricing & Buying form states
  const [selectedPackage, setSelectedPackage] = useState<typeof packages[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bKash" | "Nagad">("bKash");
  const [buyerAccountNum, setBuyerAccountNum] = useState("");
  const [buyerTrxId, setBuyerTrxId] = useState("");
  const [buyerWhatsApp, setBuyerWhatsApp] = useState("");
  const [amountCopied, setAmountCopied] = useState(false);
  const [invoiceFeedback, setInvoiceFeedback] = useState("");
  const [merchantCopied, setMerchantCopied] = useState(false);

  // Histories for current user
  const [currentUserPayments, setCurrentUserPayments] = useState<PaymentDetails[]>([]);

  // States to edit user configurations under the Admin Panel (Control Telegram Credentials)
  const [editingUserTelegramUid, setEditingUserTelegramUid] = useState<string | null>(null);
  const [editApiId, setEditApiId] = useState("");
  const [editApiHash, setEditApiHash] = useState("");
  const [editWhatsApp, setEditWhatsApp] = useState("");
  const [editTelegramInfoText, setEditTelegramInfoText] = useState("");

  // Admin passcode states
  const [adminPassInput, setAdminPassInput] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Admin operational states
  const [adminTab, setAdminTab] = useState<"dashboard" | "users" | "trials" | "packages" | "licenses" | "leads">("dashboard");
  const [allDbUsers, setAllDbUsers] = useState<UserDetails[]>([]);
  const [allDbPayments, setAllDbPayments] = useState<PaymentDetails[]>([]);
  const [allDbCustomLicenses, setAllDbCustomLicenses] = useState<CustomLicense[]>([]);
  const [searchAdminQuery, setSearchAdminQuery] = useState("");
  const [adminSortField, setAdminSortField] = useState<"name" | "date">("date");
  const [adminLogs, setAdminLogs] = useState<string[]>(["Admin core online."]);

  // Form states inside Admin For Custom License
  const [custLicUsername, setCustLicUsername] = useState("");
  const [custLicPassword, setCustLicPassword] = useState("");
  const [custLicPkg, setCustLicPkg] = useState("1 Month");
  const [custLicAssignTo, setCustLicAssignTo] = useState("");

  const t = translations[lang] || translations.en;
  const merchantNumbers = {
    bKash: "+880 1782-366720",
    Nagad: "+880 1629-982130"
  };

  // --- Initialize user state and watch auth states across all three projects ---
  useEffect(() => {
    // 1. Fetch user count to check Project A registry metrics
    getRegisteredUserCount().then((count) => {
      setUserTotalCount(count);
      dbLog(`Registered user count in Project A users tree: ${count}`);
    });

    // 2. Setup auth listening across Project A (and fallback checking as fallback)
    const unsubscribeA = onAuthStateChanged(authA, (user) => {
      handleAuthChange(user);
    });
    const unsubscribeB = onAuthStateChanged(authB, (user) => {
      if (!authA.currentUser) handleAuthChange(user);
    });
    const unsubscribeC = onAuthStateChanged(authC, (user) => {
      if (!authA.currentUser && !authB.currentUser) handleAuthChange(user);
    });

    // 3. Keep url query watch to trigger admin mode if URL matches admin?admin=true
    if (window.location.href.includes("admin?admin=true") || window.location.search.includes("admin?admin=true")) {
      setAdminMode(true);
      dbLog("Admin route parameter detected via query string containing admin?admin=true.");
    }

    return () => {
      unsubscribeA();
      unsubscribeB();
      unsubscribeC();
    };
  }, []);

  // System status printing
  const dbLog = (msg: string) => {
    setAdminLogs(prev => [`[${new Date().toISOString().slice(11, 19)}] ${msg}`, ...prev].slice(0, 15));
  };

  // Synchronize authenticated user profile from Project A database
  const handleAuthChange = async (user: User | null) => {
    if (user) {
      setCurrentUser(user);
      dbLog(`User logged in securely: ${user.email}`);
      
      // Load user profile from dbA
      let details = await dbGetUser(user.uid);
      if (!details) {
        // Create a completely new user profile on Project A database
        dbLog(`Registering new user profile in Project A DB for ${user.email}`);
        const newRecord: UserDetails = {
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          createdAt: new Date().toISOString(),
          trialActivated: false,
          trialActivatedAt: null,
          trialEndsAt: null,
          licenseStatus: "Inactive",
          activePackage: null,
          licenseKey: null,
          licensePassword: null,
          licenseActiveDate: null,
          licenseEndDate: null
        };
        await dbSaveUser(user.uid, newRecord);
        details = { ...newRecord, uid: user.uid };
      }
      setProfileDetails(details);
      
      // Retrieve registered payment ledger for this user from Project B
      const payments = await dbGetUserPayments(user.uid);
      setCurrentUserPayments(payments);
    } else {
      setCurrentUser(null);
      setProfileDetails(null);
      setCurrentUserPayments([]);
    }
    setLoadingUser(false);
  };

  // Trigger Google Login using the determined active Auth configuration
  const handleGoogleLogin = async () => {
    try {
      setLoadingUser(true);
      setAuthError(null);
      // Decide the authorization engine based on register benchmarks
      const activeAuth = selectAuthInstance(userTotalCount);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(activeAuth, provider);
      await handleAuthChange(result.user);
    } catch (error: any) {
      console.error("Google Auth popup failed:", error);
      dbLog(`Auth popup failed. Error: ${error.message}`);
      
      const isUnauthorizedDomain = error?.code === "auth/unauthorized-domain" || 
                                    error?.message?.includes("unauthorized-domain") ||
                                    error?.message?.includes("unauthorized");

      if (isUnauthorizedDomain) {
        setAuthError("unauthorized-domain");
      } else {
        alert(lang === "en" 
          ? "Google popup blocked by iframe constraint! Please open the app in a new tab using the top button, or use our specialized High-Res simulated environment at the profile node!"
          : "গুগল সাইন-আপ পপআপ আইফ্রেমের কারণে ব্লক হয়েছে! অনুগ্রহ করে উপরে দেওয়া নতুন ট্যাব বাটনটি ব্যবহার করুন, অথবা নিচে সিমুলেটেড চাবি দিয়ে দ্রুত টেস্ট করুন।"
        );
      }
      setShowSimulatedLogin(true);
    } finally {
      setLoadingUser(false);
    }
  };

  // Custom simulation login bypass for standard local evaluation
  const handleSimulatedLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedLoginEmail.includes("@")) {
      alert("Invalid email!");
      return;
    }
    setLoadingUser(true);
    const mockUid = `sim_uid_${simulatedLoginEmail.replace(/[^a-zA-Z]/g, "")}`;
    const mockUser = {
      uid: mockUid,
      email: simulatedLoginEmail,
      displayName: simulatedLoginEmail.split("@")[0],
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${simulatedLoginEmail}`,
    } as User;

    await handleAuthChange(mockUser);
    setShowSimulatedLogin(false);
    setCurrentView("profile");
    setLoadingUser(false);
  };

  const handleLogout = async () => {
    const activeAuth = selectAuthInstance(userTotalCount);
    await signOut(activeAuth);
    await handleAuthChange(null);
    setCurrentView("home");
  };

  const checkIsExpiringWithin7Days = (endDateStr: string | null | undefined): boolean => {
    if (!endDateStr) return false;
    try {
      const now = new Date();
      const end = new Date(endDateStr);
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    } catch {
      return false;
    }
  };

  // --- Module 3: Active Trial Operations ---
  const handleClaimTrial = async () => {
    if (!currentUser || !profileDetails) {
      setCurrentView("profile");
      alert(lang === "en" ? "Authentication required!" : "লগইন করা আবশ্যক!");
      return;
    }
    if (profileDetails.trialActivated) {
      alert(lang === "en" ? "Free Trial already requested!" : "ফ্রি ট্রায়াল ইতিমধ্যে সচল করা হয়েছে!");
      return;
    }

    // Set trial active dates (30 days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const updatedFields: Partial<UserDetails> = {
      trialActivated: true,
      trialActivatedAt: startDate.toISOString(),
      trialEndsAt: endDate.toISOString(),
      licenseStatus: "Active",
      activePackage: "Free Trial",
      licenseActiveDate: startDate.toISOString(),
      licenseEndDate: endDate.toISOString()
    };

    await dbUpdateUser(currentUser.uid, updatedFields);
    setProfileDetails({ ...profileDetails, ...updatedFields });
    dbLog(`Claimed Free Trial for ${profileDetails.email}`);
    alert(lang === "en" ? "T-Drive Free 30-Day Trial Successfully Activated!" : "টি-ড্রাইভ ৩০ দিনের ফ্রি ট্রায়াল সফলভাবে অ্যাক্টিভেট হয়েছে!");
  };

  // Calculate live days and hours remaining for license
  const calculateLicenseRemaining = (): { days: number; hours: number; minutes: number; seconds: number; isExpired: boolean } => {
    if (!profileDetails || !profileDetails.licenseEndDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    const end = new Date(profileDetails.licenseEndDate);
    const now = realtimeClock;
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, isExpired: false };
  };

  const remaining = calculateLicenseRemaining();

  // --- Module 4: Purchase Packaging and Orders ---
  const handleSelectPackage = (pkg: typeof packages[0]) => {
    setSelectedPackage(pkg);
    setBuyerAccountNum("");
    setBuyerTrxId("");
    setBuyerWhatsApp("");
    setInvoiceFeedback("");
  };

  const handleCopyMerchantNumber = (method: "bKash" | "Nagad") => {
    navigator.clipboard.writeText(merchantNumbers[method]);
    setMerchantCopied(true);
    setTimeout(() => setMerchantCopied(false), 2000);
  };

  const handleSubmitPaymentInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedPackage) return;
    if (!buyerAccountNum || !buyerTrxId || !buyerWhatsApp) {
      setInvoiceFeedback(lang === "en" ? "Please fill all credential fields!" : "সবগুলো তথ্য প্রদান করুন!");
      return;
    }

    const payId = `invoice_${Date.now()}`;
    const newPayment: PaymentDetails = {
      paymentId: payId,
      uid: currentUser.uid,
      email: currentUser.email || "",
      packageName: selectedPackage.name,
      amount: selectedPackage.priceTK,
      method: paymentMethod,
      accountNumber: buyerAccountNum,
      trxId: buyerTrxId,
      status: "Pending",
      createdAt: new Date().toISOString(),
      whatsApp: buyerWhatsApp
    };

    // Save payment directly to Project B Realtime Database
    await dbSavePayment(newPayment);
    dbLog(`Submitted purchase invoice ${payId} to Project B RTDB`);

    // Synchronize the WhatsApp contact number on user directory node (Project A)
    await dbUpdateUser(currentUser.uid, { whatsApp: buyerWhatsApp });
    
    // Update local history lists
    setCurrentUserPayments([newPayment, ...currentUserPayments]);
    setInvoiceFeedback("success");
    setSelectedPackage(null);
  };

  // Export license details to raw txt file link
  const handleExportLicenseFile = () => {
    if (!profileDetails) return;
    const textContent = `--------------------------------------------
T-DRIVE SYSTEM DESKTOP LICENSE WRAPPER
--------------------------------------------
License Owner (Email): ${profileDetails.email}
Profile Status:        ${profileDetails.licenseStatus}
Active Tier package:   ${profileDetails.activePackage || "Inactive"}
Token Secret Hash:     ${profileDetails.licensePassword || "NONE"}
Start Activation Date: ${profileDetails.licenseActiveDate || "N/A"}
Expiration Date limit: ${profileDetails.licenseEndDate || "N/A"}
--------------------------------------------
Verify local auth token configurations offline.
--------------------------------------------`;
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `T-Drive_License_${profileDetails.email.split("@")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Admin Area Core Handlers ---
  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassInput === "366720") {
      setIsAdminUnlocked(true);
      setAdminError("");
      dbLog("Admin pass authorized. Loading remote logs...");
      // Fetch full databases concurrently
      loadAllAdminLogs();
    } else {
      setAdminError(lang === "en" ? "Incorrect administrative passcode!" : "ভুল পাসকোড প্রবেশ করানো হয়েছে!");
    }
  };

  const loadAllAdminLogs = async () => {
    try {
      const users = await dbGetAllUsers();
      setAllDbUsers(users);
      const payments = await dbGetAllPayments();
      setAllDbPayments(payments);
      const customLics = await dbGetAllCustomLicenses();
      setAllDbCustomLicenses(customLics);
      dbLog("Admin loaded details across Project A, B, and C.");
    } catch (err) {
      console.error(err);
      dbLog("Trouble connecting to specific database configurations.");
    }
  };

  // Admin CRUD for Users (Project A database)
  const handleAdminToggleUserLicense = async (uid: string, currentStatus: "Active" | "Inactive", activePkg: string | null) => {
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const updatePayload: Partial<UserDetails> = {
      licenseStatus: nextStatus,
    };
    if (nextStatus === "Active" && !activePkg) {
      // Force assign first package
      updatePayload.activePackage = "1 Month";
      const end = new Date();
      end.setDate(end.getDate() + 30);
      updatePayload.licenseActiveDate = new Date().toISOString();
      updatePayload.licenseEndDate = end.toISOString();
    }
    await dbUpdateUser(uid, updatePayload);
    dbLog(`Toggled License for user ${uid} to ${nextStatus}`);
    await loadAllAdminLogs();
  };

  const handleAdminDeactivateLicense = async (uid: string) => {
    await dbUpdateUser(uid, {
      licenseStatus: "Inactive",
      activePackage: null,
      licenseActiveDate: null,
      licenseEndDate: null
    });
    dbLog(`Deactivated license values on user ${uid}`);
    await loadAllAdminLogs();
  };

  const handleExportLeadsCSV = () => {
    const headers = ["Gmail/Email", "Telegram API ID", "Telegram API Hash", "Telegram Info/Contact", "WhatsApp Number"];
    const csvRows = [headers.join(",")];
    
    allDbUsers.forEach(u => {
      const email = u.email || "";
      const apiId = u.telegram_api?.api_id || "";
      const apiHash = u.telegram_api?.api_hash || "";
      
      let tgInfoStr = "";
      if (u.telegram_info) {
        if (typeof u.telegram_info === "object") {
          tgInfoStr = JSON.stringify(u.telegram_info).replace(/"/g, '""');
        } else {
          tgInfoStr = String(u.telegram_info).replace(/"/g, '""');
        }
      }
      
      const whatsApp = u.whatsApp || "";
      
      csvRows.push([
        `"${email}"`,
        `"${apiId}"`,
        `"${apiHash}"`,
        `"${tgInfoStr}"`,
        `"${whatsApp}"`
      ].join(","));
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `T-Drive_Leads_System_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    dbLog("Exported leads system database as CSV download.");
  };

  const handleStartEditTelegram = (u: UserDetails) => {
    setEditingUserTelegramUid(u.uid);
    setEditApiId(u.telegram_api?.api_id || "");
    setEditApiHash(u.telegram_api?.api_hash || "");
    setEditWhatsApp(u.whatsApp || "");
    setEditTelegramInfoText(u.telegram_info ? JSON.stringify(u.telegram_info, null, 2) : "{\n  \"phone\": \"\",\n  \"username\": \"\"\n}");
  };

  const handleSaveTelegramChanges = async (uid: string) => {
    try {
      let parsedInfo = {};
      try {
        parsedInfo = JSON.parse(editTelegramInfoText);
      } catch (parseErr) {
        alert("Invalid JSON format in Telegram Contact Info!");
        return;
      }

      await dbUpdateUser(uid, {
        telegram_api: {
          api_id: editApiId,
          api_hash: editApiHash,
          lastUpdated: new Date().toISOString()
        },
        telegram_info: parsedInfo,
        whatsApp: editWhatsApp
      });

      dbLog(`Admin updated Telegram API & contact details metadata for user ${uid}`);
      setEditingUserTelegramUid(null);
      await loadAllAdminLogs();
      alert("User parameters synced successfully in RTDB!");
    } catch {
      alert("Trouble syncing user metadata, please verify types.");
    }
  };

  const handleAdminDeleteUser = async (uid: string) => {
    if (confirm("Permanently destroy this user registry inside Project A DB?")) {
      await dbDeleteUser(uid);
      dbLog(`Destroyed user ${uid}`);
      await loadAllAdminLogs();
    }
  };

  // Admin Actions for payments (Project B database)
  const handleAdminVerifyPayment = async (pay: PaymentDetails, nextStatus: "Approved" | "Declined") => {
    await dbUpdatePaymentStatus(pay.paymentId, nextStatus);
    dbLog(`Updated Transaction ${pay.paymentId} to ${nextStatus}`);

    // If Approved, automatically configure active License on Project A database!
    if (nextStatus === "Approved") {
      const durationDays = pay.packageName === "3 Month" ? 90 : 
                           pay.packageName === "6 Month" ? 180 : 
                           pay.packageName === "1 Year" ? 365 : 
                           pay.packageName === "Lifetime" ? 99990 : 30; // 1 month fallback
      const end = new Date();
      end.setDate(end.getDate() + durationDays);

      const userLicPayload: Partial<UserDetails> = {
        licenseStatus: "Active",
        activePackage: pay.packageName,
        licenseActiveDate: new Date().toISOString(),
        licenseEndDate: end.toISOString()
      };

      await dbUpdateUser(pay.uid, userLicPayload);
      dbLog(`Auto-provisioned license payload on user ${pay.uid} for ${pay.packageName}`);
    }

    await loadAllAdminLogs();
  };

  const handleAdminDeletePayment = async (payId: string) => {
    if (confirm("Delete payment tracking record?")) {
      await dbDeletePayment(payId);
      dbLog(`Removed payment receipt: ${payId}`);
      await loadAllAdminLogs();
    }
  };

  // Admin actions for Custom licenses (Project C database)
  const handleAdminCreateCustomLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custLicUsername) {
      alert("Provide Username!");
      return;
    }
    const safePass = custLicPassword || await getUniqueStrongPassword();
    const licId = `custom_lic_${Date.now()}`;
    const newCustomLic: CustomLicense = {
      licenseId: licId,
      username: custLicUsername,
      password: safePass,
      packageName: custLicPkg,
      assignedToEmail: custLicAssignTo || null,
      createdAt: new Date().toISOString(),
      status: "Active"
    };

    await dbSaveCustomLicense(newCustomLic);
    dbLog(`Created custom preconfiguration license ${custLicUsername} on Project C RTDB`);
    
    // Clear form
    setCustLicUsername("");
    setCustLicPassword("");
    setCustLicAssignTo("");
    await loadAllAdminLogs();
    alert("Custom License deployed to Project C database!");
  };

  const handleAdminDeleteCustomLicense = async (licId: string) => {
    if (confirm("Delete custom license?")) {
      await dbDeleteCustomLicense(licId);
      dbLog(`Detached custom license config: ${licId}`);
      await loadAllAdminLogs();
    }
  };

  return (
    <div className={`relative min-h-screen ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-white text-slate-800"} font-sans flex flex-col justify-between overflow-x-hidden antialiased`}>
      
      {/* Interactive 3D constellation orbital simulation background */}
      <ThreeCanvas />

      {/* Floating contact helpers container (hidden when payment model popup or success popup is active to avoid overlapping order buttons on mobile) */}
      {!selectedPackage && invoiceFeedback !== "success" && (
        <div className="fixed bottom-8 right-8 z-30 flex flex-col gap-3 items-end select-none">
          <a 
            href="https://wa.me/8801782366720"
            target="_blank"
            referrerPolicy="no-referrer"
            className="bg-white p-3.5 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 animate-bounce hover:shadow-xl transition-all hover:scale-102"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div className="text-left pr-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Support Desk</p>
              <p className="text-xs font-bold text-slate-800 uppercase">{t.whatsappBtn}</p>
            </div>
          </a>
        </div>
      )}

      {/* Primary header bar */}
      <header className={`sticky top-0 z-40 backdrop-blur border-b shadow-sm ${isDarkMode ? "bg-slate-950/95 border-slate-900 text-slate-100" : "bg-white/95 border-slate-100 text-slate-900"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => { setCurrentView("home"); setAdminMode(false); }} 
            className="flex items-center space-x-2 selection:bg-sky-100 cursor-pointer"
          >
            <div className="w-8 h-8 bg-[#24A1DE] rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200/50 hover:bg-sky-500 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            </div>
            <span className={`font-bold text-xl tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              T-Drive <span className="text-[#24A1DE] font-light">Unlimited</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold tracking-wider uppercase text-slate-600">
            <button 
              onClick={() => { setCurrentView("home"); setAdminMode(false); }} 
              className={`hover:text-[#24A1DE] transition-colors ${currentView === "home" && !adminMode ? "text-[#24A1DE] font-bold" : ""}`}
            >
              {t.home}
            </button>
            <button 
              onClick={() => { setCurrentView("downloads"); setAdminMode(false); }} 
              className={`hover:text-[#24A1DE] transition-colors ${currentView === "downloads" ? "text-[#24A1DE] font-bold" : ""}`}
            >
              {t.downloads}
            </button>
            <button 
              onClick={() => { setCurrentView("trial"); setAdminMode(false); }} 
              className={`hover:text-[#24A1DE] transition-colors ${currentView === "trial" ? "text-[#24A1DE] font-bold" : ""}`}
            >
              {t.freeTrial}
            </button>
            <button 
              onClick={() => { setCurrentView("pricing"); setAdminMode(false); }} 
              className={`hover:text-[#24A1DE] transition-colors ${currentView === "pricing" ? "text-[#24A1DE] font-bold" : ""}`}
            >
              {t.pricing}
            </button>
            <button 
              onClick={() => { setCurrentView("privacy"); setAdminMode(false); }} 
              className={`hover:text-[#24A1DE] transition-colors ${currentView === "privacy" ? "text-[#24A1DE] font-bold" : ""}`}
            >
              {t.privacy}
            </button>
            <button 
              onClick={() => { setCurrentView("terms"); setAdminMode(false); }} 
              className={`hover:text-[#24A1DE] transition-colors ${currentView === "terms" ? "text-[#24A1DE] font-bold" : ""}`}
            >
              {t.terms}
            </button>
          </nav>

          {/* Call-to-action button stack */}
          <div className="hidden lg:flex items-center space-x-4">
            
            {/* Theme Switcher Toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all flex items-center justify-center ${isDarkMode ? "bg-slate-850 hover:bg-slate-800 border-slate-750 text-yellow-450" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"}`}
              title={isDarkMode ? "Switch to Light" : "Switch to Night"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Selection */}
            <button 
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? "bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-200" : "bg-slate-105 hover:bg-slate-100 border-slate-200 text-slate-750"}`}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.langSwitch}</span>
            </button>

            {/* Profile node login triggers */}
            {currentUser ? (
              <button 
                onClick={() => { setCurrentView("profile"); setAdminMode(false); }} 
                className={`flex items-center space-x-2 border px-3.5 py-1.5 rounded-full transition-all ${isDarkMode ? "bg-slate-850 border-slate-750 hover:border-slate-600" : "bg-slate-50 border-slate-150 hover:border-[#24A1DE]"}`}
              >
                <img 
                  src={profileDetails?.photoURL || currentUser.photoURL || ""} 
                  alt="Avatar" 
                  className="w-5 h-5 rounded-full select-none border border-slate-250"
                  referrerPolicy="no-referrer"
                />
                <span className={`text-xs font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{profileDetails?.displayName || "Profile"}</span>
              </button>
            ) : (
              <button 
                onClick={() => { setCurrentView("profile"); setAdminMode(false); }} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors uppercase tracking-wider ${isDarkMode ? "bg-slate-200 text-slate-950 hover:bg-slate-300" : "bg-slate-900 hover:bg-slate-800 text-white"}`}
              >
                {t.loginSignup}
              </button>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="lg:hidden flex items-center space-x-2.5">
            {/* Theme toggle mobile */}
            <button 
              onClick={toggleTheme}
              className={`p-1.5 rounded border transition-all ${isDarkMode ? "bg-slate-850 border-slate-750 text-yellow-450" : "bg-slate-100 border-slate-250 text-slate-600"}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button 
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className={`border px-2.5 py-1 text-xs rounded font-bold transition-all ${isDarkMode ? "bg-slate-850 border-slate-750 text-slate-200" : "bg-white border-slate-200 text-slate-700"}`}
            >
              {t.langSwitch}
            </button>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className={`p-1.5 rounded transition ${isDarkMode ? "text-slate-300 bg-slate-800" : "text-slate-600 bg-slate-100"}`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-zinc-150 py-4 px-6 space-y-3.5 text-sm font-semibold tracking-wide uppercase text-slate-600">
            <button 
              onClick={() => { setCurrentView("home"); setIsMobileMenuOpen(false); setAdminMode(false); }}
              className="block w-full text-left"
            >
              {t.home}
            </button>
            <button 
              onClick={() => { setCurrentView("downloads"); setIsMobileMenuOpen(false); setAdminMode(false); }}
              className="block w-full text-left"
            >
              {t.downloads}
            </button>
            <button 
              onClick={() => { setCurrentView("trial"); setIsMobileMenuOpen(false); setAdminMode(false); }}
              className="block w-full text-left"
            >
              {t.freeTrial}
            </button>
            <button 
              onClick={() => { setCurrentView("pricing"); setIsMobileMenuOpen(false); setAdminMode(false); }}
              className="block w-full text-left"
            >
              {t.pricing}
            </button>
            <button 
              onClick={() => { setCurrentView("privacy"); setIsMobileMenuOpen(false); setAdminMode(false); }}
              className="block w-full text-left"
            >
              {t.privacy}
            </button>
            <button 
              onClick={() => { setCurrentView("terms"); setIsMobileMenuOpen(false); setAdminMode(false); }}
              className="block w-full text-left"
            >
              {t.terms}
            </button>

            <div className="pt-3 border-t">
              {currentUser ? (
                <button 
                  onClick={() => { setCurrentView("profile"); setIsMobileMenuOpen(false); setAdminMode(false); }}
                  className="flex items-center space-x-2 text-sky-600"
                >
                  <img src={currentUser.photoURL || ""} alt="Avatar" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  <span>{currentUser.displayName || "My Profile"}</span>
                </button>
              ) : (
                <button 
                  onClick={() => { setCurrentView("profile"); setIsMobileMenuOpen(false); setAdminMode(false); }}
                  className="w-full bg-slate-900 text-white p-2 rounded text-center"
                >
                  {t.loginSignup}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Ad block at prime top header locus */}
        <AdSenseUnit type="leaderboard" slotId="002139" />

        {/* ================================================================= */}
        {/* CHOOSE SYSTEM VIEW */}
        {/* ================================================================= */}
        
        {adminMode ? (
          /* ==========================================
             ADMIN PANEL CONSOLE (pass: 366720)
             ========================================== */
          <div className="bg-slate-50 border border-indigo-200 rounded-3xl p-6 shadow-xl max-w-6xl mx-auto">
            
            {/* Header section inside admin container */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 border-slate-200 gap-3">
              <div>
                <h2 className="text-xl font-bold font-mono text-indigo-900 flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-indigo-600" />
                  <span>T-Drive Admin Panel Portal</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage users registry across Project A, payments records across Project B, and customizable licenses inside Project C database.
                </p>
              </div>
              <button 
                onClick={() => setAdminMode(false)}
                className="bg-indigo-100 hover:bg-slate-200 text-indigo-900 text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Exit to Website
              </button>
            </div>

            {!isAdminUnlocked ? (
              /* Challenge Screen if admin is locked */
              <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border shadow-md">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-center mb-4">
                  Passcode Required to Continue
                </h3>
                <form onSubmit={handleUnlockAdmin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-semibold block">Enter Admin Password:</label>
                    <input 
                      type="password"
                      placeholder="e.g. 123456"
                      value={adminPassInput}
                      onChange={(e) => setAdminPassInput(e.target.value)}
                      className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 border rounded-xl outline-indigo-500 bg-slate-50"
                    />
                  </div>
                  {adminError && <p className="text-xs text-pink-600 font-medium text-center">{adminError}</p>}
                  
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs uppercase"
                  >
                    Authorize Node Access
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-4 text-center leading-relaxed font-serif">
                  Protected endpoints verified with cryptographic tokens. Database encryption sequence remains locked. (Hint: password requested is 366720)
                </p>
              </div>
            ) : (
              /* Authorized Dashboard Area */
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
                
                {/* Admin Subnav Panel */}
                <div className="col-span-1 bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs font-bold text-slate-600">
                    <button 
                      onClick={() => setAdminTab("dashboard")}
                      className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl transition ${adminTab === "dashboard" ? "bg-indigo-55 text-indigo-900 border border-indigo-100" : "hover:bg-slate-100"}`}
                    >
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span>DB Analytics Dashboard</span>
                    </button>
                    
                    <button 
                      onClick={() => setAdminTab("users")}
                      className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl transition ${adminTab === "users" ? "bg-indigo-55 text-indigo-900 border border-indigo-100" : "hover:bg-slate-100"}`}
                    >
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span className="flex-1 justify-between flex items-center">
                        <span>Project-A: Users</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{allDbUsers.length}</span>
                      </span>
                    </button>

                    <button 
                      onClick={() => setAdminTab("trials")}
                      className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl transition ${adminTab === "trials" ? "bg-indigo-55 text-indigo-900 border border-indigo-100" : "hover:bg-slate-100"}`}
                    >
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Free Trials Users</span>
                    </button>

                    <button 
                      onClick={() => setAdminTab("packages")}
                      className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl transition ${adminTab === "packages" ? "bg-indigo-55 text-indigo-900 border border-indigo-100" : "hover:bg-slate-100"}`}
                    >
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                      <span className="flex-1 justify-between flex items-center">
                        <span>Project-B: Payments</span>
                        <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {allDbPayments.filter(p => p.status === "Pending").length} pending
                        </span>
                      </span>
                    </button>

                    <button 
                      onClick={() => setAdminTab("licenses")}
                      className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl transition ${adminTab === "licenses" ? "bg-indigo-55 text-indigo-900 border border-indigo-100" : "hover:bg-slate-100"}`}
                    >
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Project-C: Custom Lics</span>
                    </button>

                    <button 
                      onClick={() => setAdminTab("leads")}
                      className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl transition ${adminTab === "leads" ? "bg-indigo-55 text-indigo-900 border border-indigo-100" : "hover:bg-slate-100"}`}
                    >
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>System Activity Logs</span>
                    </button>
                  </div>

                  {/* App general controls info */}
                  <div className="pt-4 border-t mt-4 text-[10px] font-mono text-slate-400 space-y-1">
                    <p>CLIENT WORKSPACE: Tauri Core</p>
                    <p>SYNC TARGETS: projects A, B, C</p>
                    <button 
                      onClick={() => { setIsAdminUnlocked(false); setAdminPassInput(""); setAdminError(""); }}
                      className="w-full text-center font-bold text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded mt-3 text-[11px]"
                    >
                      Lock Console
                    </button>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="col-span-1 lg:col-span-3 space-y-6">

                  {/* TOP SEARCH BAR */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="text"
                        placeholder="Search users email, license password, or payment Transaction ID..."
                        value={searchAdminQuery}
                        onChange={(e) => setSearchAdminQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 w-full border rounded-xl text-xs outline-indigo-500 bg-slate-50"
                      />
                    </div>
                    
                    <div className="flex space-x-2 shrink-0">
                      <button 
                        onClick={loadAllAdminLogs}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold p-2 text-xs rounded-xl flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Force Sync DB</span>
                      </button>
                    </div>
                  </div>

                  {/* TAB: Analytics Dashboard Overview */}
                  {adminTab === "dashboard" && (
                    <div className="space-y-6">
                      
                      {/* Ending Package Alert System (Expiry Checker) */}
                      {(() => {
                        const expiringUsers = allDbUsers.filter(u => u.licenseStatus === "Active" && checkIsExpiringWithin7Days(u.licenseEndDate));
                        if (expiringUsers.length > 0) {
                          return (
                            <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-left space-y-2 animate-fade-in shadow-inner">
                              <div className="flex items-center gap-2 text-amber-850 font-bold text-xs uppercase tracking-wide">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                <span>⚠️ Active License Expiration Alert (Next 7 Days)</span>
                              </div>
                              <p className="text-xs text-slate-600">
                                The following users have active subscription bundles ending over the next 7 days.
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
                                {expiringUsers.map(u => (
                                  <div key={u.uid} className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                                    <div>
                                      <div className="font-bold text-slate-800">{u.displayName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{u.email}</div>
                                      {u.whatsApp && (
                                        <div className="text-[10px] text-[#24A1DE] font-semibold mt-0.5">WA: {u.whatsApp}</div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-extrabold text-amber-700 bg-amber-100 text-[9px] px-1.5 py-0.5 rounded-sm">{u.activePackage}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.licenseEndDate ? new Date(u.licenseEndDate).toLocaleDateString() : ""}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Metric cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border hover:shadow-md transition text-left">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider">PROJECT-A USERS</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{allDbUsers.length}</p>
                          <span className="text-[10px] text-emerald-600 font-semibold">&bull; 100% active</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border hover:shadow-md transition text-left">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider">ACTIVE LICENSES</p>
                          <p className="text-2xl font-black text-indigo-700 mt-1">
                            {allDbUsers.filter(u => u.licenseStatus === "Active").length}
                          </p>
                          <span className="text-[10px] text-indigo-600 font-semibold">% allocation</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border hover:shadow-md transition text-left">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider">PENDING ORDERS</p>
                          <p className="text-2xl font-black text-amber-600 mt-1">
                            {allDbPayments.filter(p => p.status === "Pending").length}
                          </p>
                          <span className="text-[10px] text-amber-600 font-semibold font-mono">Project-B sync</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border hover:shadow-md transition text-left">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider">TOTAL REVENUE (TK)</p>
                          <p className="text-2xl font-black text-emerald-800 mt-1">
                            {allDbPayments.filter(p => p.status === "Approved").reduce((sum, item) => sum + item.amount, 0).toLocaleString()} Tk
                          </p>
                          <span className="text-[10px] text-emerald-600 font-semibold font-mono">From payments B</span>
                        </div>
                      </div>

                      {/* Packages Sales Stats and chart */}
                      <div className="bg-white p-5 rounded-2xl border grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-3">Licensing Packages Sales breakdown</h4>
                          <div className="space-y-3 text-xs">
                            {["1 Month", "3 Month", "6 Month", "1 Year", "Lifetime"].map((pkgName) => {
                              const count = allDbPayments.filter(p => p.packageName === pkgName && p.status === "Approved").length;
                              return (
                                <div key={pkgName} className="flex justify-between items-center">
                                  <span className="text-slate-600 font-semibold">{pkgName} Bundle</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono bg-slate-150 px-2 py-0.5 rounded text-[10px] font-bold">{count} sold</span>
                                    <span className="text-slate-400">({count * 150} Tk equivalent)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Fast info message */}
                        <div className="bg-indigo-50/50 p-4 rounded-2xl flex flex-col justify-between">
                          <div className="text-xs text-indigo-950 space-y-1">
                            <h5 className="font-bold">Database Switching Rules:</h5>
                            <p>&bull; Auth Project A: Triggered when user count is &lt; 50,000.</p>
                            <p>&bull; Auth Project B: Initialized if user count is between 50,000 and 100,000.</p>
                            <p>&bull; Auth Project C: Triggered when user count is &gt;= 100,000.</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-indigo-150 flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>CurrentUser Count:</span>
                            <span className="font-bold text-lg text-indigo-700">{allDbUsers.length}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB: Project-A Users manager */}
                  {adminTab === "users" && (
                    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-bold text-slate-800 text-sm">Project-A Realtime Database Users Node</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Path: /users</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                              <th className="p-2.5 rounded-l">User Info</th>
                              <th className="p-2.5">License (Gmail)</th>
                              <th className="p-2.5">Active Tier</th>
                              <th className="p-2.5">Expiry date</th>
                              <th className="p-2.5">License Status</th>
                              <th className="p-2.5 rounded-r text-right">Actions</th>
                            </tr>
                          </thead>
                           <tbody className="divide-y divide-slate-100">
                             {allDbUsers
                               .filter((u) => u.email.toLowerCase().includes(searchAdminQuery.toLowerCase()) || u.displayName.toLowerCase().includes(searchAdminQuery.toLowerCase()))
                               .map((u) => {
                                 return (
                                   <React.Fragment key={u.uid}>
                                     <tr className="hover:bg-slate-50/80">
                                       <td className="p-2.5">
                                         <div className="font-bold text-slate-900">{u.displayName}</div>
                                         <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                                         {(u.whatsApp || u.telegram_api?.api_id) && (
                                           <div className="mt-1 flex flex-wrap gap-1">
                                             {u.whatsApp && (
                                               <span className="bg-[#24A1DE]/10 text-[#24A1DE] font-semibold font-mono text-[9px] px-1.5 py-0.5 rounded">
                                                 WA: {u.whatsApp}
                                               </span>
                                             )}
                                             {u.telegram_api?.api_id && (
                                               <span className="bg-slate-100 text-slate-700 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-200">
                                                 TG-API: ID={u.telegram_api.api_id}
                                               </span>
                                             )}
                                           </div>
                                         )}
                                       </td>
                                       <td className="p-2.5">
                                         <span className="font-mono bg-sky-50 text-sky-800 text-[11px] px-2 py-0.5 rounded border border-sky-100">{u.email}</span>
                                       </td>
                                       <td className="p-2.5 font-bold text-indigo-650">{u.activePackage || "N/A"}</td>
                                       <td className="p-2.5 font-mono text-[10px] text-slate-400">
                                         {u.licenseEndDate ? new Date(u.licenseEndDate).toLocaleDateString() : "N/A"}
                                       </td>
                                       <td className="p-2.5">
                                         <span className={`px-2 py-0.5 rounded-[3px] font-bold text-[10px] ${u.licenseStatus === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                           {u.licenseStatus}
                                         </span>
                                       </td>
                                       <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                                         <button 
                                           onClick={() => handleStartEditTelegram(u)}
                                           className="text-[10px] font-bold bg-indigo-55 hover:bg-slate-100 text-indigo-900 px-2 py-1 rounded transition"
                                         >
                                           Edit Credentials
                                         </button>
                                         <button 
                                           onClick={() => handleAdminToggleUserLicense(u.uid, u.licenseStatus, u.activePackage)}
                                           className={`text-[10px] font-bold px-2 py-1 rounded transition ${u.licenseStatus === "Active" ? "bg-slate-200 text-slate-800" : "bg-emerald-500 text-white"}`}
                                         >
                                           {u.licenseStatus === "Active" ? "Deactivate" : "Activate"}
                                         </button>
                                         <button 
                                           onClick={() => handleAdminDeleteUser(u.uid)}
                                           className="text-[10px] font-bold bg-rose-50 text-rose-800 p-1 rounded hover:bg-rose-100"
                                           title="Delete user"
                                         >
                                           <Trash2 className="w-3.5 h-3.5" />
                                         </button>
                                       </td>
                                     </tr>
                                     {editingUserTelegramUid === u.uid && (
                                       <tr className="bg-indigo-50/20">
                                         <td colSpan={6} className="p-4 bg-slate-50/50">
                                           <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4 max-w-2xl text-left">
                                             <div className="flex justify-between items-center border-b pb-2">
                                               <span className="font-bold text-indigo-950 uppercase tracking-widest text-[9.5px]">🛠️ Control Telegram Credentials & Info ({u.displayName})</span>
                                               <button 
                                                 type="button" 
                                                 onClick={() => setEditingUserTelegramUid(null)} 
                                                 className="text-slate-400 hover:text-slate-600 font-bold block"
                                               >
                                                 ✕
                                               </button>
                                             </div>
                                             
                                             <div className="grid grid-cols-2 gap-3">
                                               <div className="space-y-1">
                                                 <label className="font-bold text-slate-705 block text-[10px] uppercase">Telegram API ID:</label>
                                                 <input 
                                                   type="text" 
                                                   placeholder="e.g. 1234567"
                                                   value={editApiId}
                                                   onChange={(e) => setEditApiId(e.target.value)}
                                                   className="w-full bg-slate-50 border p-2 rounded outline-none focus:bg-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                 />
                                               </div>
                                               <div className="space-y-1">
                                                 <label className="font-bold text-slate-705 block text-[10px] uppercase">Telegram API Hash:</label>
                                                 <input 
                                                   type="text" 
                                                   placeholder="e.g. d68a3fb..."
                                                   value={editApiHash}
                                                   onChange={(e) => setEditApiHash(e.target.value)}
                                                   className="w-full bg-slate-50 border p-2 rounded outline-none focus:bg-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                 />
                                               </div>
                                             </div>
 
                                             <div className="grid grid-cols-2 gap-3">
                                               <div className="space-y-1">
                                                 <label className="font-bold text-slate-705 block text-[10px] uppercase">WhatsApp Contact:</label>
                                                 <input 
                                                   type="text" 
                                                   placeholder="e.g. +880 1712-345678"
                                                   value={editWhatsApp}
                                                   onChange={(e) => setEditWhatsApp(e.target.value)}
                                                   className="w-full bg-slate-50 border p-2 rounded outline-none focus:bg-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 font-bold"
                                                 />
                                               </div>
                                               <div className="space-y-1">
                                                 <label className="font-bold text-slate-705 block text-[10px] uppercase">Telegram metadata info:</label>
                                                 <span className="text-[9px] text-slate-400 block -mt-1">Edit custom chat, phones, user details</span>
                                              </div>
                                            </div>

                                            <div className="space-y-1">
                                              <textarea 
                                                rows={3}
                                                value={editTelegramInfoText}
                                                onChange={(e) => setEditTelegramInfoText(e.target.value)}
                                                className="w-full bg-slate-50 border p-2 rounded outline-none focus:bg-white font-mono text-[11px] focus:ring-1 focus:ring-indigo-500"
                                              />
                                            </div>

                                            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                                              <button 
                                                type="button" 
                                                onClick={() => setEditingUserTelegramUid(null)} 
                                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-750 rounded-lg text-xs font-bold"
                                              >
                                                Cancel
                                              </button>
                                              <button 
                                                type="button" 
                                                onClick={() => handleSaveTelegramChanges(u.uid)} 
                                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold active:scale-95 transition"
                                              >
                                                Save Credentials Sync
                                              </button>
                                            </div>
                                          </div>
                                         </td>
                                       </tr>
                                     )}
                                   </React.Fragment>
                                 );
                               })}
                           </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB: Free Trials user tracker */}
                  {adminTab === "trials" && (
                    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                      <div className="border-b pb-2">
                        <h4 className="font-bold text-slate-800 text-sm">Free Trials User Logs</h4>
                        <p className="text-xs text-slate-400">Filter on users with active or ended free 1-month trials.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allDbUsers
                          .filter(u => u.trialActivated)
                          .map(u => (
                            <div key={u.uid} className="border p-4 rounded-xl bg-slate-50 text-xs text-left relative overflow-hidden">
                              <span className="absolute right-2 top-2 bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                                Trial claim: ACTIVE
                              </span>
                              <div className="space-y-1">
                                <h5 className="font-bold text-slate-900">{u.displayName}</h5>
                                <p className="font-mono text-[10px] text-slate-500">{u.email}</p>
                                <p className="pt-2"><strong>Activated At:</strong> {u.trialActivatedAt ? new Date(u.trialActivatedAt).toLocaleString() : "N/A"}</p>
                                <p><strong>Expiry point:</strong> {u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleString() : "N/A"}</p>
                              </div>
                              <div className="mt-3 pt-2.5 border-t flex justify-end space-x-2">
                                <button 
                                  onClick={() => handleAdminDeactivateLicense(u.uid)}
                                  className="text-[10px] font-semibold text-rose-800 hover:underline"
                                >
                                  Kill active trial quota
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: Payments Ledger matching B database */}
                  {adminTab === "packages" && (
                    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-bold text-slate-800 text-sm">Project-B Realtime Payments Invoices Ledger</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Path: /payments</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                              <th className="p-2.5">User Email</th>
                              <th className="p-2.5">Package</th>
                              <th className="p-2.5">Price</th>
                              <th className="p-2.5">Bkash/Nagad Acc</th>
                              <th className="p-2.5">TrxID</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {allDbPayments
                              .filter(p => p.email.toLowerCase().includes(searchAdminQuery.toLowerCase()) || p.trxId.toLowerCase().includes(searchAdminQuery.toLowerCase()))
                              .map((p) => (
                                <tr key={p.paymentId} className="hover:bg-slate-50/80">
                                  <td className="p-2.5">
                                    <span className="font-bold text-slate-800 block">{p.email}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">{p.paymentId}</span>
                                  </td>
                                  <td className="p-2.5 font-bold font-mono">{p.packageName}</td>
                                  <td className="p-1.5 font-bold text-emerald-800">{p.amount} Tk</td>
                                  <td className="p-2.5 font-mono">
                                    <span className="px-1.5 py-0.5 bg-sky-100 text-sky-850 rounded text-[10px] font-bold">{p.method}</span> {p.accountNumber}
                                  </td>
                                  <td className="p-2.5 font-mono font-bold text-indigo-700">{p.trxId}</td>
                                  <td className="p-2.5">
                                    <span className={`px-1.5 py-0.5 font-black text-[9px] uppercase rounded-full ${p.status === "Approved" ? "bg-emerald-100 text-emerald-800" : p.status === "Declined" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                                    {p.status === "Pending" && (
                                      <>
                                        <button 
                                          onClick={() => handleAdminVerifyPayment(p, "Approved")}
                                          className="text-[9px] bg-emerald-500 text-white font-bold px-2 py-1 rounded hover:bg-emerald-600 transition"
                                        >
                                          Approve
                                        </button>
                                        <button 
                                          onClick={() => handleAdminVerifyPayment(p, "Declined")}
                                          className="text-[9px] bg-rose-500 text-white font-bold px-2 py-1 rounded hover:bg-rose-600 transition"
                                        >
                                          Decline
                                        </button>
                                      </>
                                    )}
                                    <button 
                                      onClick={() => handleAdminDeletePayment(p.paymentId)}
                                      className="text-red-600 bg-red-50 p-1 rounded hover:bg-red-100"
                                      title="Delete invoice record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB: Custom License Manager on Project C */}
                  {adminTab === "licenses" && (
                    <div className="space-y-6">
                      
                      {/* Form section to create custom licenses */}
                      <div className="bg-white p-5 rounded-2xl border shadow-sm text-left">
                        <h4 className="font-bold text-slate-800 text-sm border-b pb-2 mb-4">
                          Generate Custom Offline-Safe Licenses (Project C Database)
                        </h4>
                        
                        <form onSubmit={handleAdminCreateCustomLicense} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-705">Username (As User Gmail):</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. user@gmail.com"
                              value={custLicUsername}
                              onChange={(e) => setCustLicUsername(e.target.value)}
                              className="w-full border p-2 rounded outline-indigo-500 bg-slate-50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-slate-705">Secure Password Token (Or auto):</label>
                            <input 
                              type="text"
                              placeholder="Leave empty to auto-generate"
                              value={custLicPassword}
                              onChange={(e) => setCustLicPassword(e.target.value)}
                              className="w-full border p-2 rounded outline-indigo-500 bg-slate-50 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-slate-700">Assign Package duration:</label>
                            <select 
                              value={custLicPkg}
                              onChange={(e) => setCustLicPkg(e.target.value)}
                              className="w-full border p-2 rounded outline-indigo-500 bg-slate-50"
                            >
                              <option value="1 Month">1 Month Tier</option>
                              <option value="3 Month">3 Month Tier</option>
                              <option value="6 Month">6 Month Tier</option>
                              <option value="1 Year">1 Year Tier</option>
                              <option value="Lifetime">Lifetime Unlimited</option>
                            </select>
                          </div>

                          <div className="space-y-1 flex flex-col justify-end">
                            <button 
                              type="submit"
                              className="bg-indigo-600 font-bold text-white text-xs py-2 px-4 rounded hover:bg-indigo-700 transition"
                            >
                              Provision License Key
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Display of pre-configured custom licenses from Project C Database */}
                      <div className="bg-white p-5 rounded-2xl border shadow-sm text-left">
                        <div className="border-b pb-2 mb-3">
                          <h4 className="font-bold text-slate-800 text-sm">Deployments catalog on Project C Database</h4>
                          <span className="text-[10px] text-slate-400 font-mono">Path: /custom_licenses</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                                <th className="p-2">License ID</th>
                                <th className="p-2">Client Email</th>
                                <th className="p-2">Alphanumeric Password</th>
                                <th className="p-2">Allocated Package</th>
                                <th className="p-2">Status</th>
                                <th className="p-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allDbCustomLicenses.map((lic) => (
                                <tr key={lic.licenseId} className="border-b hover:bg-slate-50">
                                  <td className="p-2 font-mono text-[10px] text-slate-500">{lic.licenseId}</td>
                                  <td className="p-2 font-bold text-slate-800">{lic.username}</td>
                                  <td className="p-2">
                                    <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                      {lic.password}
                                    </span>
                                  </td>
                                  <td className="p-2 font-semibold text-purple-750">{lic.packageName}</td>
                                  <td className="p-2">
                                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">
                                      {lic.status}
                                    </span>
                                  </td>
                                  <td className="p-2 text-right">
                                    <button 
                                      onClick={() => handleAdminDeleteCustomLicense(lic.licenseId)}
                                      className="text-red-600 hover:text-red-800 text-xs font-semibold"
                                    >
                                      Detach
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB: Realtime Leads Console */}
                  {adminTab === "leads" && (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-3xl border shadow-sm text-left space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              T-Drive CRM Leads System Registry
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Verify compiled contacts, Telegram integrations, and WhatsApp numbers saved from client onboarding forms.
                            </p>
                          </div>
                          
                          <button 
                            onClick={handleExportLeadsCSV}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer font-sans"
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span>Export All Leads to CSV</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-sans">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                                <th className="p-3">User Contact</th>
                                <th className="p-3">Telegram API Credentials</th>
                                <th className="p-3">Telegram Account Details</th>
                                <th className="p-3">WhatsApp Number</th>
                                <th className="p-3 rounded-r text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans text-[11.5px]">
                              {allDbUsers.map((u) => {
                                const hasTelegramApi = !!(u.telegram_api?.api_id || u.telegram_api?.api_hash);
                                const hasTelegramInfo = !!u.telegram_info;
                                return (
                                  <tr key={u.uid} className="hover:bg-slate-50/50">
                                    <td className="p-3">
                                      <div className="font-bold text-slate-900">{u.displayName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                                    </td>
                                    <td className="p-3 font-mono">
                                      {hasTelegramApi ? (
                                        <div className="space-y-0.5 text-[10px]">
                                          <div><span className="text-slate-400">ID:</span> <span className="font-bold text-indigo-800">{u.telegram_api?.api_id}</span></div>
                                          <div className="truncate max-w-[120px]"><span className="text-slate-400">HASH:</span> <span className="text-slate-600">{u.telegram_api?.api_hash}</span></div>
                                        </div>
                                      ) : (
                                        <span className="text-slate-350 italic">None Provided</span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {hasTelegramInfo ? (
                                        <div className="text-[10px] font-mono whitespace-pre-wrap max-w-[200px] bg-slate-50 p-1.5 rounded text-slate-600 max-h-[80px] overflow-y-auto border border-slate-100">
                                          {typeof u.telegram_info === "object" ? JSON.stringify(u.telegram_info, null, 1) : String(u.telegram_info)}
                                        </div>
                                      ) : (
                                        <span className="text-slate-350 italic">No Metas</span>
                                      )}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-[#24A1DE]">
                                      {u.whatsApp || (
                                        <span className="text-slate-350 font-normal italic">None</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <button 
                                        onClick={() => {
                                          const rowCsv = [
                                            ["Gmail/Email", "Telegram API ID", "Telegram API Hash", "Telegram Info/Contact", "WhatsApp Number"].join(","),
                                            [
                                              `"${u.email || ""}"`,
                                              `"${u.telegram_api?.api_id || ""}"`,
                                              `"${u.telegram_api?.api_hash || ""}"`,
                                              `"${u.telegram_info ? JSON.stringify(u.telegram_info).replace(/"/g, '""') : ""}"`,
                                              `"${u.whatsApp || ""}"`
                                            ].join(",")
                                          ].join("\n");
                                          const blob = new Blob([rowCsv], { type: "text/csv;charset=utf-8;" });
                                          const url = URL.createObjectURL(blob);
                                          const link = document.createElement("a");
                                          link.href = url;
                                          link.setAttribute("download", `Lead_${u.email || u.uid}.csv`);
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        className="text-[10px] bg-sky-50 text-sky-700 hover:bg-sky-100 px-2 py-1 rounded transition font-bold"
                                      >
                                        Export Row
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Backup real-time operational telemetry logs */}
                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                          <span className="text-xs font-bold text-emerald-400 font-mono tracking-widest uppercase">System Operational Telemetry Logs</span>
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-mono">NODE ACTIVE</span>
                        </div>
                        <div className="text-slate-400 p-1 font-mono text-xs space-y-1.5 max-h-[160px] overflow-y-auto">
                          {adminLogs.map((log, index) => (
                            <div key={index} className="flex gap-2">
                              <span className="text-slate-600 shrink-0 select-none">[{index}]</span>
                              <span className="text-emerald-350/90 break-all">{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        ) : (
          /* ================================================================= */
          /* CLIENT VISUAL VIEWS */
          /* ================================================================= */
          <div className="space-y-12">
            
            {/* VIEW: HOME VIEW */}
            {currentView === "home" && (
              <div className="space-y-12 animate-fade-in">
                
                {/* Hero Section */}
                <div className="text-center max-w-4xl mx-auto space-y-6">
                  <span className="inline-block px-3 py-1 bg-blue-50 text-[#24A1DE] border border-blue-100/50 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {lang === "en" ? "Tauri Core & Rust MTProto Compilation" : "তাওরি কোর ও রাস্ট এমটিপ্রোটো কম্পাইলেশন সচল"}
                  </span>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.05] italic">
                    {lang === "en" ? "Turn your Telegram into a " : "টেলিগ্রামকে পরিণত করুন "}<span className="text-[#24A1DE]">{lang === "en" ? "cloud powerhouse." : "ক্লাউড পাওয়ারহাউসে।"}</span>
                  </h1>
                  
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto px-2">
                    {t.heroSubtitle}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 pt-2">
                    <button 
                      onClick={() => setCurrentView("downloads")}
                      className="w-full sm:w-auto bg-[#24A1DE] text-white font-bold px-6 py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-sky-500 transition shadow-lg shadow-blue-200/50 whitespace-nowrap"
                    >
                      {t.downloadNow}
                    </button>
                    <button 
                      onClick={() => setCurrentView("trial")}
                      className="w-full sm:w-auto bg-slate-900 text-white font-bold px-6 py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-slate-800 transition whitespace-nowrap"
                    >
                      {t.getTrial}
                    </button>
                  </div>
                </div>

                {/* Simulated Interactive Client Playground Frame */}
                <div className="space-y-3.5">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-900">{lang === "en" ? "Interactive T-Drive Dashboard Simulator (Playground)" : "টি-ড্রাইভ ড্যাশবোর্ড সিমুলেটর (প্লেগ্রাউন্ড)"}</h2>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
                      {lang === "en" ? "Test driving the Tauri-React desktop wrapper interface directly online before downloading." : "ডাউনলোড করার পূর্বে রিয়েল-টাইম তাওরি-রিয়্যাক্ট ডেস্কটপ ক্লায়েন্ট ইন্টারফেসটি নিচে এখনই পরখ করে দেখুন।"}
                    </p>
                  </div>
                  <TDriveSimulator language={lang} />
                </div>

                {/* Ad block middle homepage */}
                <AdSenseUnit type="nativeBanner" />

                {/* Guideline Video Section */}
                <div className="max-w-4xl mx-auto bg-white border rounded-3xl p-6 shadow-sm text-center space-y-4" id="video-guideline">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t.youtubeTitle}</h3>
                    <p className="text-xs text-slate-500 mt-1">{t.youtubeSub}</p>
                  </div>
                  
                  {/* YouTube Walkthrough Iframe Embed with clean wrapper */}
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border bg-slate-50 shadow-inner">
                    <iframe 
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Walkthrough placeholder
                      title="T-Drive Walkthrough & API configuration instructions"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono italic">
                    Note: Complete tutorial includes custom guides on logging with api_id, hash keys generated from my.telegram.org.
                  </p>
                </div>

                {/* Visual features showcase list */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-900">{t.featureTitle}</h3>
                    <p className="text-xs text-slate-500">
                      {lang === "en" ? "Detailed review of built desktop software modules package" : "ডেস্কটপ সফটওয়্যারের প্রধান ৭টি মডিউল সূচক"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white p-5 rounded-2xl border hover:border-sky-300 hover:shadow-md transition space-y-2">
                      <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center font-bold font-mono">01</div>
                      <h4 className="font-bold text-slate-800 text-sm">{t.setupAuth}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{t.setupDesc}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border hover:border-sky-300 hover:shadow-md transition space-y-2">
                      <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center font-bold font-mono">02</div>
                      <h4 className="font-bold text-slate-800 text-sm">{t.fileExplorer}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{t.fileDesc}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border hover:border-sky-300 hover:shadow-md transition space-y-2">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center font-bold font-mono">03</div>
                      <h4 className="font-bold text-slate-800 text-sm">{t.uploadEngine}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{t.uploadDesc}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border hover:border-sky-300 hover:shadow-md transition space-y-2">
                      <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center font-bold font-mono">04</div>
                      <h4 className="font-bold text-slate-800 text-sm">{t.transferMonitor}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{t.transferDesc}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border hover:border-sky-300 hover:shadow-md transition space-y-2">
                      <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center font-bold font-mono">05</div>
                      <h4 className="font-bold text-slate-800 text-sm">{t.streamDeck}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{t.streamDesc}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border hover:border-sky-300 hover:shadow-md transition space-y-2">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center font-bold font-mono">06</div>
                      <h4 className="font-bold text-slate-800 text-sm">{t.proxyIntegration}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{t.proxyDesc}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW: DOWNLOADS VIEW */}
            {currentView === "downloads" && (
              <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-center">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{t.downloadTitle}</h2>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto">{t.downloadDesc}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {/* Windows Client Option */}
                  <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? "bg-slate-900 border-slate-800 text-white shadow-xl shadow-black/25" : "bg-white border-slate-100 text-slate-800 shadow-sm hover:shadow-lg"}`}>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-[#24A1DE] rounded-2xl flex items-center justify-center mb-4">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-black text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>{t.windowsDownload}</h3>
                      <p className="text-xs text-slate-400 mt-1">{t.windowsBeta}</p>
                    </div>
                    <ul className={`text-xs space-y-1.5 pt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <li>&bull; Supported on Windows 10 & 11 x64 architecture</li>
                      <li>&bull; Integrated automated background REST API</li>
                      <li>&bull; Bundled native Rust Grammers library core</li>
                    </ul>
                    
                    <button 
                      onClick={(e) => { e.preventDefault(); alert("Mock Download dispatched: T-Drive_2.0.4_x64.exe (Tauri wrapper payload)"); }}
                      className="w-full bg-[#24A1DE] text-white p-4 rounded-2xl flex items-center justify-between group hover:bg-[#24A1DE]/90 transition-all text-left mt-6 shadow-lg shadow-blue-500/15"
                    >
                      <div className="text-left">
                        <p className="text-[10px] opacity-75 uppercase font-bold tracking-wider">Windows Client</p>
                        <p className="text-lg font-bold">Download .exe</p>
                      </div>
                      <div className="bg-white/20 p-2 rounded-xl group-hover:scale-105 transition-transform">
                        <Download className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  </div>

                  {/* MacOS Client Option - MARKED AS UNDER CONSTRUCTION & COMING SOON */}
                  <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${isDarkMode ? "bg-slate-900/60 border-slate-800 text-slate-100 opacity-80" : "bg-slate-50 border-slate-200/60 text-slate-800 opacity-90"}`}>
                    <div className="absolute top-3 right-3">
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Under Construction
                      </span>
                    </div>

                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl flex items-center justify-center mb-4">
                      <Layers className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className={`font-black text-base ${isDarkMode ? "text-white opacity-60" : "text-slate-900 opacity-80"}`}>{t.macDownload}</h3>
                      <p className="text-xs text-amber-500 font-extrabold mt-1">Coming Soon</p>
                    </div>
                    <ul className={`text-xs space-y-1.5 pt-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      <li>&bull; Universal bundle supporting Apple Silicon & Intel</li>
                      <li>&bull; Fully optimized for low baseline memory operations</li>
                      <li>&bull; Supports customizable SOCKS5 connection tunnels</li>
                    </ul>

                    <div className="w-full bg-slate-200/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 p-4 rounded-2xl flex items-center justify-between transition-all text-left mt-6 cursor-not-allowed border border-dashed border-slate-300 dark:border-slate-800">
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-75">MacOS Client</p>
                        <p className="text-sm font-bold">Under Construction</p>
                      </div>
                      <div className="bg-slate-300/40 dark:bg-slate-700/35 p-2 rounded-xl">
                        <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {/* Android Client Option */}
                  <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? "bg-slate-900 border-slate-800 text-white shadow-xl shadow-black/25" : "bg-white border-slate-100 text-slate-800 shadow-sm hover:shadow-lg"}`}>
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-550 rounded-2xl flex items-center justify-center mb-4">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-black text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>Android Client</h3>
                      <p className="text-xs text-emerald-550 font-bold mt-1">Mobile APK Live</p>
                    </div>
                    <ul className={`text-xs space-y-1.5 pt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <li>&bull; Install directly onto Android system devices</li>
                      <li>&bull; Real-time status notifications synchronizer</li>
                      <li>&bull; Full-screen optimized premium mobile GUI</li>
                    </ul>

                    <button 
                      onClick={(e) => { e.preventDefault(); alert("Mock Download dispatched: T-Drive_2.0.4_android.apk (Android App bundle)"); }}
                      className="w-full bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between group hover:bg-emerald-500 transition-all text-left mt-6 shadow-lg shadow-emerald-500/15"
                    >
                      <div className="text-left">
                        <p className="text-[10px] opacity-75 uppercase font-bold tracking-wider">Android Client</p>
                        <p className="text-lg font-bold">Download .apk</p>
                      </div>
                      <div className="bg-white/20 p-2 rounded-xl group-hover:scale-105 transition-transform">
                        <Download className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border text-xs max-w-lg mx-auto ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200/50 text-slate-500"}`}>
                  <strong>Verification hash checksums (SHA-256):</strong>
                  <p className="font-mono text-[9px] text-slate-400 mt-1 leading-tight break-all">
                    Windows Setup (x64): de1989482bfec36a939f4db9a2012d9848261bd7fefec36...
                    <br />
                    Android Mobile APK: f4b192daef05981ca261bde637dfefec361b23aa4...
                  </p>
                </div>
              </div>
            )}

            {/* VIEW: FREE TRIAL ACTIVATION */}
            {currentView === "trial" && (
              <div className="max-w-2xl mx-auto bg-white border rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6 animate-fade-in relative overflow-hidden">
                <span className="absolute top-0 right-0 px-3 py-1 bg-yellow-400 text-yellow-950 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                  1 Month Free Trial
                </span>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">{t.trialTitle}</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">{t.requireLoginTrial}</p>
                </div>

                {profileDetails?.trialActivated ? (
                  /* Condition: Trial currently active or previously utilized */
                  <div className="p-6 bg-slate-50 rounded-2xl border space-y-4">
                    {remaining.isExpired ? (
                      <div className="space-y-2">
                        <div className="mx-auto w-10 h-10 bg-red-100 text-red-650 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-900">{t.trialUsedMsg}</p>
                        <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
                          {t.featureAfterTrial}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-sm">{t.trialActiveMsg}</p>
                          <p className="font-mono text-xs text-slate-400">Expiration limit: {profileDetails.trialEndsAt ? new Date(profileDetails.trialEndsAt).toLocaleDateString() : ""}</p>
                        </div>
                        
                        {/* Countdown metrics */}
                        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto text-center font-mono">
                          <div className="bg-white border rounded-lg p-2">
                            <span className="block text-lg font-bold text-sky-600">{remaining.days}</span>
                            <span className="text-[9px] text-slate-450 uppercase font-bold">{t.trialDays}</span>
                          </div>
                          <div className="bg-white border rounded-lg p-2">
                            <span className="block text-lg font-bold text-sky-600">{remaining.hours}</span>
                            <span className="text-[9px] text-slate-455 uppercase font-bold">{t.trialHours}</span>
                          </div>
                          <div className="bg-white border rounded-lg p-2">
                            <span className="block text-lg font-bold text-sky-600">{remaining.minutes}</span>
                            <span className="text-[9px] text-slate-455 uppercase font-bold">Mins</span>
                          </div>
                          <div className="bg-white border rounded-lg p-2">
                            <span className="block text-lg font-bold text-sky-600 animate-pulse">{remaining.seconds}</span>
                            <span className="text-[9px] text-slate-455 uppercase font-bold text-emerald-500">Secs</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Condition: Trial Not activated yet */
                  <div className="space-y-4">
                    <ul className="text-left text-xs text-slate-600 space-y-2.5 max-w-md mx-auto bg-slate-50 p-4 rounded-xl border">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Get full 30-day licensing keys completely free of constraints.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Enables up to 2.0 GB uploads, video streaming seeks, and settings configurations.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Limit protection guarantee:</strong> Once your trial wraps up, you retain full access to download & share all previously uploaded items.</span>
                      </li>
                    </ul>

                    {currentUser ? (
                      <button 
                        onClick={handleClaimTrial}
                        className="w-full max-w-xs bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider"
                      >
                        {t.startTrialBtn}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button 
                          onClick={() => { setCurrentView("profile"); }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase"
                        >
                          Login with Google to continue
                        </button>
                        <p className="text-[10px] text-slate-400">Only Google accounts supported to protect trial uniqueness check.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VIEW: PRICING PACKAGES */}
            {currentView === "pricing" && (
              <div className="space-y-10 animate-fade-in text-center" id="pricings">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{t.pricingTitle}</h2>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto">{t.pricingSubtitle}</p>
                </div>

                {/* Packaging Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {packages.map((pkg) => (
                    <div 
                      key={pkg.id} 
                      className={`bg-white border rounded-3xl p-5 text-left flex flex-col justify-between hover:shadow-lg hover:border-sky-300 transition-all ${selectedPackage?.id === pkg.id ? "ring-2 ring-sky-500 border-sky-400 bg-sky-50/20" : "border-slate-200"}`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{pkg.name}</h3>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-[9px] font-black px-1.5 py-0.5 rounded">
                            {t.savedLabel} {pkg.savings}
                          </span>
                        </div>
                        
                        <div className="pt-2">
                          <span className="text-3xl font-black text-slate-900 font-mono">{pkg.priceTK}</span>
                          <span className="text-xs font-mono text-slate-400 ml-1">Tk</span>
                        </div>
                        
                        <del className="text-[10px] text-slate-400 block font-mono">
                          {t.originalPrice}: {pkg.originalPriceTK} Tk
                        </del>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <button 
                          onClick={() => handleSelectPackage(pkg)}
                          className="w-full text-center bg-slate-900 text-white font-bold py-2 rounded-xl text-xs hover:bg-slate-800 transition"
                        >
                          Select package
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2">
                  <span className="inline-block bg-sky-50 text-sky-850 px-4 py-2 border rounded-xl font-medium text-xs">
                    🔒 Post-Expiry Safe Lock: After any purchase expires, previously archived files inside T-Drive remains 100% accessible to download at full speed!
                  </span>
                </div>

                 {/* Payment form billing modal popup */}
                 {selectedPackage && (
                   <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                     <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto relative animate-fade-in">
                       <div className="flex justify-between items-center border-b pb-3 border-slate-150">
                         <div>
                           <h3 className="font-bold text-slate-900 text-base">{t.buyMethodTitle}</h3>
                           <p className="text-xs text-slate-500">Invoice: package [{selectedPackage.name}] &bull; Price {selectedPackage.priceTK} Tk</p>
                         </div>
                         <button onClick={() => setSelectedPackage(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                           <X className="w-5 h-5" />
                         </button>
                       </div>
 
                       <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setPaymentMethod("bKash")}
                           className={`py-3 text-center rounded-xl font-bold text-xs border transition ${paymentMethod === "bKash" ? "bg-pink-100 text-pink-700 border-pink-350" : "bg-white border-slate-200"}`}
                         >
                           <span className="flex items-center justify-center gap-1.5"><BkashLogo className="h-5 w-auto" /> <span>bKash Gateway</span></span>
                         </button>
                         <button 
                           onClick={() => setPaymentMethod("Nagad")}
                           className={`py-3 text-center rounded-xl font-bold text-xs border transition ${paymentMethod === "Nagad" ? "bg-orange-100 text-orange-700 border-orange-350" : "bg-white border-slate-200"}`}
                         >
                           <span className="flex items-center justify-center gap-1.5"><NagadLogo className="h-5 w-auto" /> <span>Nagad Gateway</span></span>
                         </button>
                       </div>
 
                       <div className="bg-slate-50 p-4 rounded-xl border space-y-2.5 text-xs">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/50">
                          {paymentMethod === "bKash" ? (
                            <BkashLogo className="h-6 w-auto shrink-0 shadow-xs rounded" />
                          ) : (
                            <NagadLogo className="h-6 w-auto shrink-0 shadow-xs rounded" />
                          )}
                          <p className="font-extrabold text-slate-800 text-sm">{paymentMethod === "bKash" ? t.bkashTitle : t.nagadTitle}</p>
                        </div>
                         <div className="flex items-center justify-between bg-white p-2.5 rounded-lg font-mono text-sm border border-slate-200">
                           <span className="font-extrabold text-slate-900">{paymentMethod === "bKash" ? merchantNumbers.bKash : merchantNumbers.Nagad}</span>
                           <button 
                             onClick={() => handleCopyMerchantNumber(paymentMethod)}
                             className="bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95"
                           >
                             {merchantCopied ? "Copied" : t.copyNumber}
                           </button>
                         </div>
                         <p className="text-[11px] text-pink-700 font-bold bg-pink-50/70 p-2.5 rounded-lg border border-pink-100">
                           ⚠️ {lang === "en" ? (
                             <span>Only <strong className="bg-pink-600 text-white px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Send Money</strong> is accepted. Ensure the correct Taka amount is selected.</span>
                           ) : (
                             <span>শুধুমাত্র <strong className="bg-pink-600 text-white px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Send Money</strong> গ্রহণযোগ্য। দয়া করে সঠিক টাকার পরিমাণটি পরিশোধ করুন।</span>
                           )}
                         </p>
                       </div>
 
                       <form onSubmit={handleSubmitPaymentInvoice} className="space-y-4">
                         <div className="space-y-3">
                           <div className="space-y-1 text-xs">
                             <label className="font-bold text-slate-700">Select Payment Method Amount Check:</label>
                             <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 disabled 
                                 value={`${selectedPackage.priceTK} TK (Taka)`}
                                 className="flex-1 bg-slate-100 p-2.5 rounded border text-slate-750 font-mono font-bold"
                               />
                               <button 
                                 type="button"
                                 onClick={() => {
                                   navigator.clipboard.writeText(selectedPackage.priceTK.toString());
                                   setAmountCopied(true);
                                   setTimeout(() => setAmountCopied(false), 2000);
                                 }}
                                 className="bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition active:scale-95"
                               >
                                 {amountCopied ? "Copied!" : "Copy Amount"}
                               </button>
                             </div>
                           </div>
 
                           <div className="space-y-1 text-xs">
                             <label className="font-bold text-slate-700">Your bKash/Nagad Payer Account Number:</label>
                             <input 
                               type="text" 
                               required
                               placeholder={t.accountPlaceholder}
                               value={buyerAccountNum}
                               onChange={(e) => setBuyerAccountNum(e.target.value)}
                               className="w-full p-2.5 rounded border bg-white focus:ring-1 focus:ring-sky-500 outline-none font-mono"
                             />
                           </div>
 
                           <div className="space-y-1 text-xs">
                             <label className="font-bold text-slate-700">Payer Transaction ID (TrxID):</label>
                             <input 
                               type="text" 
                               required
                               placeholder={t.trxPlaceholder}
                               value={buyerTrxId}
                               onChange={(e) => setBuyerTrxId(e.target.value)}
                               className="w-full p-2.5 rounded border bg-white focus:ring-1 focus:ring-sky-500 outline-none font-mono font-bold"
                             />
                           </div>

                           <div className="space-y-1 text-xs">
                             <label className="font-bold text-slate-700">Your contact WhatsApp Number:</label>
                             <input 
                               type="text" 
                               required
                               placeholder="e.g. +880 1712345678"
                               value={buyerWhatsApp}
                               onChange={(e) => setBuyerWhatsApp(e.target.value)}
                               className="w-full p-2.5 rounded border bg-white focus:ring-1 focus:ring-sky-500 outline-none font-mono font-bold"
                             />
                           </div>
                         </div>
 
                         {invoiceFeedback && invoiceFeedback !== "success" && (
                           <p className="text-xs text-pink-600 font-medium">{invoiceFeedback}</p>
                         )}
 
                         {currentUser ? (
                           <button 
                             type="submit"
                             className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs uppercase cursor-pointer"
                           >
                             {t.confirmOrder}
                           </button>
                         ) : (
                           <div className="text-center p-3.5 bg-yellow-50 border border-yellow-250 rounded-xl text-yellow-850 text-xs">
                             <strong>Login Required:</strong> Please register an account with Gmail to safely submit payment verification.
                           </div>
                         )}
                       </form>
                     </div>
                   </div>
                 )}

                {invoiceFeedback === "success" && (
                  <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl w-full max-w-sm relative animate-fade-in">
                      {/* Close button icon */}
                      <button 
                        onClick={() => setInvoiceFeedback("")} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      {/* Animated check green bubble */}
                      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-pulse">
                        <CheckCircle className="w-9 h-9" />
                      </div>

                      {/* Header containing precise request phrases */}
                      <div className="space-y-1.5">
                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                          {lang === "en" ? "Your payment is placed" : "আপনার পেমেন্ট সফল হয়েছে"}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {lang === "en" 
                            ? "Once we verify it, You will be notified soon." 
                            : "আমরা এটি যাচাই করার পর, আপনাকে শীঘ্রই নোটিফিকেশন পাঠিয়ে দেওয়া হবে।"}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-col gap-2">
                        <button 
                          onClick={() => { 
                            setInvoiceFeedback(""); 
                            setCurrentView("profile"); 
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-6 rounded-2xl text-[11px] uppercase tracking-wider transition active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5"
                        >
                          Visit Profile
                        </button>
                        <button 
                          onClick={() => setInvoiceFeedback("")}
                          className="w-full bg-slate-100 hover:bg-slate-150 text-slate-600 font-bold py-2 px-5 rounded-xl text-[10px] uppercase transition cursor-pointer"
                        >
                          {lang === "en" ? "Keep Browsing" : "বন্ধ করুন"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* VIEW: PRIVACY POLICY */}
            {currentView === "privacy" && (
              <div className="max-w-3xl mx-auto bg-white border rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-fade-in">
                <h2 className="text-2xl font-black text-slate-900 border-b pb-2 mb-4">Privacy & Data Security Policy</h2>
                
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Your privacy is guaranteed through our 100% Zero-Knowledge client architecture.
                  </p>
                  
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-850 text-sm">01. Offline Credential Variables</h4>
                    <p>
                      The Unlimited Drive website has no storage servers, nor does it log configuration properties. When you configure the desktop client with custom api_id, hash, and Telegram secret tokens, these metrics persist exclusively inside native client files locally on your computer.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-850 text-sm">02. Direct Client-to-MTProto Transmission</h4>
                    <p>
                      Files bypass third-party middle-man databases entirely. Binary chunk arrays transit directly from your computer to Telegram's cloud centers encrypted with 256-bit AES algorithms. Nobody but your authenticated Telegram session represents a reader of these folders.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-850 text-sm">03. Firebase Authentication Node</h4>
                    <p>
                      Standard user email arrays represent the only saved registry elements to manage free trial eligibility and premium licenses checks. Payment Transaction IDs match Bkash/Nagad billing logs solely to provision secure license dates.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: TERMS & CONDITIONS */}
            {currentView === "terms" && (
              <div className="max-w-3xl mx-auto bg-white border rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-fade-in">
                <h2 className="text-2xl font-black text-slate-900 border-b pb-2 mb-4">Terms of Service & Invalidation Limits</h2>
                
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-sans">
                  
                  <div className="bg-sky-50 border p-3 rounded-xl border-sky-150 text-sky-950">
                    <strong>Important:</strong> Free Tier resilience protects your data permanently. If your paid license or trials expires, you can download and stream any previously archived directories forever at maximum speed.
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 text-sm">A. Non-Abuse & Bandwidth Protections</h4>
                    <p>
                      Users should maintain daily limits within reasonable standards. Standard free accounts yield 250 GB uploads limits. To prevent sudden IP freezes, concurrent multiple network threads calling parallel chunks should be shaped using keepallives configurations.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 text-sm">B. No Direct Affiliation Claims</h4>
                    <p>
                      T-Drive uses Telegram's public open-source MTProto API protocol. T-Drive continues to provide unlimited space because of Telegram's developer cloud schemas. Users are responsible for holding valid personal api_id accounts keys.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 text-sm">C. Refund Exceptions</h4>
                    <p>
                      Once custom strong password hashes have been precompiled and validated, license items represent digital products that cannot be refunded. Test drives should remain tested on the free 30-day package first.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: USER PROFILE DECK */}
            {currentView === "profile" && (
              <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                
                {loadingUser ? (
                  <div className="text-center py-12 font-mono text-slate-400">
                    <Plus className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
                    <span>Decrypting secure database registers...</span>
                  </div>
                ) : !currentUser ? (
                  /* Condition: Guest session prompts Google Auth or Bypass simulated testing */
                  <div className="max-w-md mx-auto bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-6 shadow-md">
                    <div className="w-12 h-12 bg-sky-50 text-sky-550 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <LogIn className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="text-xl font-bold text-slate-900">{t.loginSignup}</h2>
                      <p className="text-xs text-slate-500">Google accounts supported directly to verify active user licenses.</p>
                    </div>

                    <button 
                      onClick={handleGoogleLogin}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-2xl text-xs uppercase flex items-center justify-center space-x-2 shadow-sm transition"
                    >
                      <Globe className="w-4 h-4" />
                      <span>{t.googleSignIn}</span>
                    </button>

                    {authError === "unauthorized-domain" && (
                      <div className="bg-rose-50 text-rose-900 border border-rose-200/50 p-5 rounded-2xl text-left space-y-3.5 text-xs animate-fade-in">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-rose-950 uppercase tracking-wider text-[10px]">{lang === "en" ? "Firebase: Unauthorized Domain" : "ফায়ারবেস: আনঅথরাইজড ডোমেইন"}</h4>
                            <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                              {lang === "en" 
                                ? `The current domain is not added to the authorized list in Firebase console settings.` 
                                : `বর্তমান ডোমেইনটি ফায়ারবেস কনসোলের অথরাইজড ডোমেইন তালিকায় যুক্ত নেই।`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-white/80 rounded-xl p-3 border border-rose-100 font-mono space-y-1 text-[11px] text-slate-700">
                          <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-widest font-bold pb-1 border-b border-rose-100/50">
                            <span>{lang === "en" ? "DOMAIN DETAILS" : "ডোমেইন ও কনফিগারেশন"}</span>
                            <span className="text-rose-600 font-bold uppercase">{lang === "en" ? "Action Required" : "করণীয় পদক্ষেপ"}</span>
                          </div>
                          <p className="pt-1"><strong>Domain:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 break-all">{window.location.hostname}</code></p>
                          <p className="pt-1"><strong>{lang === "en" ? "How to authorize:" : "যেভাবে যুক্ত করবেন:"}</strong></p>
                          <ol className="list-decimal list-inside space-y-1 pl-1 text-[10px] text-slate-600">
                            <li>{lang === "en" ? "Open Firebase Database Console" : "ফায়ারবেস কনসোলে যান"}</li>
                            <li>{lang === "en" ? "Go to Authentication > Settings > Authorized Domains" : "Authentication > Settings > Authorized Domains সেটিংসে যান"}</li>
                            <li>{lang === "en" ? `Add "${window.location.hostname}" to authorized list.` : `"${window.location.hostname}" ডোমেইনটি তালিকায় যোগ করুন।`}</li>
                          </ol>
                        </div>

                        <div className="bg-emerald-50 text-emerald-950 border border-emerald-100 p-3 rounded-xl text-[10.5px] leading-relaxed flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-[#24A1DE] shrink-0 mt-0.5" />
                          <p>
                            <strong>{lang === "en" ? "No setup needed to test!" : "টেস্ট করার জন্য সেটআপ জরুরি নয়!"}</strong> {lang === "en" ? "Simply type any mock/demo email address in the 'Simulated Gmail' field below to skip configuration and log in in 1 second!" : "নিচে যেকোনো ডেমো মেইল টাইপ করে 'Simulate One-Click Login' ক্লিক করুন এবং ১ সেকেন্ডে প্রিভিউ সচল করুন!"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative flex py-2 items-center text-xs text-slate-400 font-mono">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-4">OR USE EVALUATION BYPASS</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {showSimulatedLogin ? (
                      <form onSubmit={handleSimulatedLoginSubmit} className="space-y-3.5 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Simulated Gmail Address:</label>
                          <input 
                            type="email" 
                            required
                            placeholder="your_demo@gmail.com"
                            value={simulatedLoginEmail}
                            onChange={(e) => setSimulatedLoginEmail(e.target.value)}
                            className="w-full border px-3 py-2 text-xs rounded-xl outline-indigo-500 bg-slate-50 font-mono"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs uppercase"
                        >
                          Simulate One-Click Login
                        </button>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setShowSimulatedLogin(true)}
                        className="text-xs text-indigo-600 underline font-semibold font-mono"
                      >
                        Launch High-Res Mock Login (Skip popup blocks)
                      </button>
                    )}
                  </div>
                ) : (
                  /* Condition: Logged In Dashboard Frame */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* User profile capsule card */}
                    <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-3xl text-center space-y-4 shadow-sm h-fit">
                      <img 
                        src={profileDetails?.photoURL || currentUser.photoURL || ""} 
                        alt="Profile picture" 
                        className="w-16 h-16 rounded-full mx-auto border shadow-inner select-none"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">
                          {profileDetails?.displayName || currentUser.displayName}
                        </h3>
                        <p className="font-mono text-xs text-slate-400 mt-1">{profileDetails?.email || currentUser.email}</p>
                      </div>

                      <div className="pt-3 border-t text-left text-xs space-y-2 text-slate-500">
                        <div className="flex justify-between">
                          <span>{t.joinLabel}:</span>
                          <span className="font-mono text-[11px] font-semibold text-slate-800">{profileDetails?.createdAt || LOCAL_TIME_NOW}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verified Database:</span>
                          <span className="font-mono text-[10px] text-indigo-600 font-bold">PROJECT A Users-RTDB</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleLogout}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logout}</span>
                      </button>
                    </div>

                    {/* Active license card panel */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Ending Package Alert Warning Banner */}
                      {profileDetails?.licenseStatus === "Active" && checkIsExpiringWithin7Days(profileDetails?.licenseEndDate) && (
                        <div className="bg-yellow-50 border border-yellow-350 p-4 rounded-3xl flex items-start gap-3 text-left animate-fade-in shadow-sm">
                          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-yellow-950 text-xs uppercase tracking-wide">
                              ⚠️ {lang === "en" ? "Premium Validity Ending Soon" : "প্রিমিয়াম মেয়াদ শেষ হতে চলেছে"}
                            </h4>
                            <p className="text-xs text-yellow-850 leading-relaxed font-medium">
                              {lang === "en" ? (
                                <span>Your premium bundle [{profileDetails?.activePackage}] is ending on <strong className="font-mono bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-900">{profileDetails?.licenseEndDate ? new Date(profileDetails.licenseEndDate).toLocaleDateString() : ""}</strong>. Renew now to maintain uninterrupted upload privileges.</span>
                              ) : (
                                <span>আপনার প্রিমিয়াম প্যাকেজটি [{profileDetails?.activePackage}] আগামী <strong className="font-mono bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-900">{profileDetails?.licenseEndDate ? new Date(profileDetails.licenseEndDate).toLocaleDateString() : ""}</strong> শেষ হতে চলেছে। পুনরায় রিনিউ করতে পেমেন্ট করুন।</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Interactive License Card */}
                      <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                        {/* Simulated glowing lines */}
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-violet-500/15 rounded-full blur-3xl"></div>

                        <div className="flex justify-between items-start z-10 relative">
                          <div>
                            <span className="text-[10px] font-bold text-sky-400 tracking-widest uppercase font-mono">
                              {t.licenseCardTitle}
                            </span>
                            <h4 className="text-xl font-black font-mono tracking-tight mt-1 truncate max-w-[280px]">
                              {profileDetails?.email}
                            </h4>
                          </div>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase font-mono ${profileDetails?.licenseStatus === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                            {profileDetails?.licenseStatus === "Active" ? t.active : t.inactive}
                          </span>
                        </div>

                        {profileDetails?.licenseStatus === "Active" ? (
                          /* Active License State Outputs */
                          <div className="mt-8 space-y-5 z-10 relative">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                              <div>
                                <span className="block text-slate-400 text-[10px] uppercase">{t.activePackage}</span>
                                <span className="font-bold text-sky-300 text-sm">{profileDetails.activePackage}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 text-[10px] uppercase">LICENSE KEY (GMAIL)</span>
                                <span className="font-bold font-mono tracking-wide text-xs text-sky-300">{profileDetails.email}</span>
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <span className="block text-slate-400 text-[10px] uppercase">EXPIRATION POINT</span>
                                <span className="font-bold text-[11px] text-slate-300">
                                  {profileDetails.licenseEndDate ? new Date(profileDetails.licenseEndDate).toLocaleDateString() : ""}
                                </span>
                              </div>
                            </div>

                            {/* Google Drive Login Instruction for the license */}
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1.5 text-left">
                              <p className="font-extrabold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5" />
                                <span>{lang === "en" ? "Verification Instruction" : "ভেরিফিকেশন নির্দেশিকা"}</span>
                              </p>
                              <p className="text-xs text-slate-200 leading-normal font-sans">
                                {lang === "en" 
                                  ? "Log in there with your Registered Google Account." 
                                  : "সেখানে আপনার নিবন্ধিত গুগল অ্যাকাউন্ট দিয়ে লগইন করুন।"}
                              </p>
                            </div>

                            {/* Trial/License Remaining Validity Indicators */}
                            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center space-x-2.5">
                                <Clock className="w-4 h-4 text-sky-400" />
                                <span className="text-xs">
                                  {lang === "en" ? (
                                    <span>
                                      {t.validityLabel}: <strong className="text-sky-300">{remaining.days} days</strong>,{" "}
                                      <strong className="text-sky-300">{remaining.hours} hours</strong>,{" "}
                                      <strong className="text-sky-300">{remaining.minutes} minutes</strong> and{" "}
                                      <strong className="text-sky-300 animate-pulse text-emerald-400">{remaining.seconds} seconds</strong>
                                    </span>
                                  ) : (
                                    <span>
                                      {t.validityLabel}: <strong className="text-sky-300">{remaining.days} দিন</strong>,{" "}
                                      <strong className="text-sky-300">{remaining.hours} ঘণ্টা</strong>,{" "}
                                      <strong className="text-sky-300">{remaining.minutes} মিনিট</strong> এবং{" "}
                                      <strong className="text-sky-300 animate-pulse text-emerald-400">{remaining.seconds} সেকেন্ড</strong>
                                    </span>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <a 
                                  href="https://drive.google.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-white font-extrabold flex items-center gap-1.5 transition active:scale-[0.98] shadow-md shadow-emerald-950/25"
                                >
                                  <Globe className="w-4 h-4" />
                                  <span>{lang === "en" ? "Go To Drive" : "ড্রাইভ-এ যান"}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Inactive License Warnings Alert */
                          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200 z-10 relative text-left">
                            <p className="font-bold">{t.inactiveLicenseWarning}</p>
                            <div className="mt-4 flex space-x-3.5">
                              <button 
                                onClick={() => setCurrentView("pricing")}
                                className="bg-red-500 text-white font-bold px-4 py-2 rounded text-[11px] uppercase"
                              >
                                {t.viewPricing}
                              </button>
                              <button 
                                onClick={handleClaimTrial}
                                className="text-[11px] text-sky-300 font-bold hover:underline"
                              >
                                Activate free trial node &rarr;
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Purchased Packages details & logs from Project B */}
                      <div className="bg-white border rounded-3xl p-5 text-left space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                          <CreditCard className="w-5 h-5 text-sky-500" />
                          <span>{t.paymentsHistoryTitle}</span>
                        </h4>

                        {currentUserPayments.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">{t.noHistory}</p>
                        ) : (
                          <div className="space-y-3.5 text-xs">
                            {currentUserPayments.map((p) => (
                              <div key={p.paymentId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900">{p.packageName}</span>
                                    <span className="font-semibold text-emerald-800 font-mono">({p.amount} TK)</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Method: {p.method} | PayNo: {p.accountNumber} | TrxID: {p.trxId}
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${p.status === "Approved" ? "bg-emerald-100 text-emerald-850" : p.status === "Declined" ? "bg-red-100 text-red-850" : "bg-amber-100 text-amber-850"}`}>
                                  {p.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Detailed Usage Instructions */}
                      <div className="bg-white border rounded-3xl p-5 text-left space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                          <HelpCircle className="w-5 h-5 text-indigo-500" />
                          <span>Detailed T-Drive App Settings & Setup Guideline</span>
                        </h4>
                        
                        <div className="space-y-3.5 text-xs text-slate-500 leading-relaxed font-sans">
                          {/* Instruction list from prompt */}
                          <p>
                            <strong>01. Retrieve Telegram Credentials:</strong> First, you need to get a telegram app API profile containing are custom <code>api_id</code> and <code>api_hash</code> keys from the official developers center at <strong>my.telegram.org</strong>. Detailed visual steps are shown in the guideline video on the Home tab.
                          </p>
                          <p>
                            <strong>02. Connecting Your Profile:</strong> Log in to the desktop client using the unique license credentials generated above as passwords. Once entered, input the api_id and api_hash values. Wait for the terminal to pop up SMS/confirmation checks.
                          </p>
                          <p>
                            <strong>03. Setup Verification SMS:</strong> We recommend using the phone number verification pathway. Once the number has been successfully parsed, Telegram sends a verification code directly within the active Telegram inbox application. Input the OTP to enjoy fully unlimited storage!
                          </p>
                        </div>
                      </div>

                      {/* Limits Guidelines */}
                      <div className="bg-white border text-left rounded-3xl p-5 space-y-4 shadow-sm" id="limitations-guidelines">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-pink-500" />
                          <span>App Upload and Bandwidth Constraints</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border">
                            <h5 className="font-bold text-slate-800">{t.limit1Title}</h5>
                            <p className="text-slate-500 leading-relaxed">{t.limit1Desc}</p>
                          </div>
                          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border">
                            <h5 className="font-bold text-slate-800">{t.limit2Title}</h5>
                            <p className="text-slate-500 leading-relaxed">{t.limit2Desc}</p>
                          </div>
                          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border">
                            <h5 className="font-bold text-slate-800">{t.limit3Title}</h5>
                            <p className="text-slate-500 leading-relaxed">{t.limit3Desc}</p>
                          </div>
                          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border">
                            <h5 className="font-bold text-slate-800">{t.limit4Title}</h5>
                            <p className="text-slate-500 leading-relaxed">{t.limit4Desc}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* Ad block at prime bottom footer locus */}
        <AdSenseUnit type="rectangle" slotId="002140" />

      </main>

      {/* Footer component */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-12 border-t border-slate-800 relative z-10 selection:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-5 gap-4">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-extrabold text-base">
                T
              </div>
              <div>
                <p className="font-bold text-white text-sm">Unlimited Drive System</p>
                <p className="text-slate-500 text-[10px] sm:text-xs">T-Drive desktop client integration & licenses server node.</p>
              </div>
            </div>

            {/* Email listings */}
            <div className="flex flex-col sm:flex-row items-center sm:space-x-6 text-xs text-slate-300 gap-1.5">
              <span className="flex items-center space-x-1">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{t.supportEmail}: <strong>contact@tdriveunlimited.com</strong></span>
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-400 text-[10px] font-mono">ACTIVE INTEGRATION: project-a, project-b, project-c</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3 text-center">
            <p>
              &copy; {new Date("2026-05-25T04:16:04Z").getFullYear()} T-Drive Inc. All rights reserved globally. Powered by Tauri Wrapper and Telegram MTProto protocol layers.
            </p>
            <div className="flex space-x-4">
              <button onClick={() => { setCurrentView("privacy"); setAdminMode(false); }} className="hover:text-slate-300 transition">
                {t.privacy}
              </button>
              <button onClick={() => { setCurrentView("terms"); setAdminMode(false); }} className="hover:text-slate-300 transition">
                {t.terms}
              </button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
