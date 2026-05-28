import React, { useState, useEffect, useRef } from "react";
import { 
  Folder, File, Upload, Settings, RefreshCw, Layers, Shield, 
  Tv, Compass, Globe, Info, Play, Pause, ChevronRight, X, AlertCircle, 
  CheckCircle, Plus, Search, Trash2, ArrowRight, Download, Sliders, Smartphone
} from "lucide-react";
import { type Language } from "../types";

interface TDriveSimulatorProps {
  language: Language;
}

interface MockFile {
  id: string;
  name: string;
  type: "video" | "document" | "image" | "zip";
  sizeBytes: number;
  createdAt: string;
}

export default function TDriveSimulator({ language }: TDriveSimulatorProps) {
  // Navigation State inside the client simulator
  const [activeTab, setActiveTab] = useState<"auth" | "explorer" | "upload" | "transfers" | "viewer" | "proxy" | "settings">("explorer");
  
  // Translation for Simulator Content
  const simText = {
    en: {
      clientTitle: "T-Drive Desktop Client (Tauri v2)",
      notConnected: "Telegram session not configured. Please initialize login token.",
      connectApp: "Connect Telegram Session",
      explorerTitle: "Cloud File Explorer",
      uploadTitle: "Enqueue Upload Pipeline",
      transfersTitle: "Network Queues Monitor",
      viewerTitle: "Inline Document & Media Deck",
      proxyTitle: "Transit Proxies Control",
      settingsTitle: "Client Config Engine",
      mockSpeed: "Speed Cap: Active Shaper"
    },
    bn: {
      clientTitle: "টি-ড্রাইভ ডেস্কটপ ক্লায়েন্ট (তাওরি ২)",
      notConnected: "টেলিগ্রাম অ্যাকাউন্টের সাথে সংযোগ নেই। সেটআপ লিংক ব্যবহার করুন।",
      connectApp: "টেলিগ্রাম একাউন্ট সংযুক্ত করুন",
      explorerTitle: "ফাইল এক্সপ্লোরার গ্রিড",
      uploadTitle: "আপলোড পাইপলাইন কনসোল",
      transfersTitle: "ট্রান্সফার গতি মনিটর",
      viewerTitle: "মিডিয়া স্লাইডার ও ডকুমেন্ট ভিউয়ার",
      proxyTitle: "নেটওয়ার্ক ট্রানজিট ও প্রক্সি",
      settingsTitle: "টিউনিং ও কনফিগ হাব",
      mockSpeed: "ব্যান্ডউইথ ক্যাপ শাপার"
    }
  };

  const t = simText[language] || simText.en;

  // --- Module 1: Auth Session States ---
  const [apiId, setApiId] = useState("542918");
  const [apiHash, setApiHash] = useState("fc368d90cae25471be87fd");
  const [phone, setPhone] = useState("+880 1782-366720");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [twoFactor, setTwoFactor] = useState("");
  const [twoFactorVisible, setTwoFactorVisible] = useState(false);
  const [isFullyLoggedIn, setIsFullyLoggedIn] = useState(true); // Default simulator authenticated
  const [authStatus, setAuthStatus] = useState<string>("");

  // --- Module 2: File List and Folder Tree State ---
  const [currentPath, setCurrentPath] = useState<string[]>(["Root", "Movies"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFileInfo, setShowFileInfo] = useState<MockFile | null>(null);
  
  const initialFiles: MockFile[] = [
    { id: "msg_01", name: "Stranger.Things.S04E01.1080p.HEVC.zip", type: "zip", sizeBytes: 2013265920, createdAt: "2026-05-24 18:22" },
    { id: "msg_02", name: "Inception.2010.BluRay.Dual.Audio.mp4", type: "video", sizeBytes: 1548201948, createdAt: "2026-05-23 11:40" },
    { id: "msg_03", name: "Quarterly_Tax_Statement_2026.pdf", type: "document", sizeBytes: 5410110, createdAt: "2026-05-20 09:15" },
    { id: "msg_04", name: "Software_Deployment_Architecture.png", type: "image", sizeBytes: 1248010, createdAt: "2026-05-25 04:00" },
    { id: "msg_05", name: "Local_Backup_Compressed_F22.zip", type: "zip", sizeBytes: 4294967296, createdAt: "2026-05-18 23:55" }, // 4.0GB file
  ];
  const [filesList, setFilesList] = useState<MockFile[]>(initialFiles);

  // --- Module 3 & 4: Upload pipeline and Transfers Queue ---
  const [isPremiumSession, setIsPremiumSession] = useState(false);
  const [zipFolders, setZipFolders] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(68.5);
  const [isTransferPaused, setIsTransferPaused] = useState(false);
  
  // Custom Transfer Stats metrics
  const [speedMB, setSpeedMB] = useState(14.8);
  const [etaSec, setEtaSec] = useState(124);
  const [processedBytes, setProcessedBytes] = useState(1073741824);
  const totalTargetBytes = 2013265920; // Match msg_01 size

  useEffect(() => {
    let interval: any = null;
    if (!isTransferPaused && activeTab === "transfers") {
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) return 0;
          return parseFloat((prev + 0.4).toFixed(1));
        });
        setProcessedBytes((prev) => {
          if (prev >= totalTargetBytes) return 100000;
          return prev + 8000000;
        });
        setSpeedMB((prev) => {
          const delta = (Math.random() - 0.5) * 1.5;
          return parseFloat(Math.min(45, Math.max(5, prev + delta)).toFixed(1));
        });
        setEtaSec((prev) => (prev > 1 ? prev - 1 : 160));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTransferPaused, activeTab]);

  // --- Module 5: Media Seeking Deck ---
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoTimeline, setVideoTimeline] = useState(38); // 38%
  const [bufferedSegments, setBufferedSegments] = useState([
    { start: 0, end: 15 },
    { start: 30, end: 55 },
    { start: 70, end: 95 }
  ]);

  // --- Module 6: Proxy Toggles ---
  const [selectedProxyMode, setSelectedProxyMode] = useState<"DirectConnection" | "SOCKS5_Proxy" | "MTProto_Proxy">("DirectConnection");
  const [proxyHost, setProxyHost] = useState("127.0.0.1");
  const [proxyPort, setProxyPort] = useState("9050");
  const [proxyUser, setProxyUser] = useState("");
  const [proxySecret, setProxySecret] = useState("");
  const [bandwidthCapMB, setBandwidthCapMB] = useState(50); // 50 MBps speed lock
  const [chunkSize, setChunkSize] = useState<"128 KB" | "256 KB" | "512 KB">("512 KB");

  // --- Module 7: Core System Hub ---
  const [vpnOpActive, setVpnOpActive] = useState(false);
  const [keepAliveSec, setKeepAliveSec] = useState(60);
  const [localSysLogs, setLocalSysLogs] = useState<string[]>([
    "System Initialized successfully on port 3000.",
    "Connected locally with API database profile.",
    "Tauri v2 container loaded successfully.",
  ]);

  const handleTriggerOTP = () => {
    if (!phone) {
      setAuthStatus(language === "en" ? "Enter phone number!" : "ফোন নম্বর দিন!");
      return;
    }
    setOtpSent(true);
    setAuthStatus(language === "en" ? "Verification code dispatched to your active Telegram application!" : "কোডটি আপনার সচল টেলিগ্রাম অ্যাকাউন্টে পাঠানো হয়েছে!");
  };

  const handleVerifyOTP = () => {
    if (otpCode.length < 4) {
      setAuthStatus(language === "en" ? "Invalid SMS confirmation length." : "সঠিক কোড দিন!");
      return;
    }
    setIsFullyLoggedIn(true);
    setAuthStatus(language === "en" ? "Connection Established! Session String StringSession initiated." : "টেলিগ্রাম সেশন সফলভাবে যুক্ত হয়েছে!");
    setLocalSysLogs(prev => [...prev, "Authorized new Telegram MTProto session."]);
  };

  const handleResetSession = () => {
    setIsFullyLoggedIn(false);
    setOtpSent(false);
    setOtpCode("");
    setAuthStatus("");
    setLocalSysLogs(prev => [...prev, "Session flushed. Login requested."]);
  };

  // Helper file icon renderer
  const getFileIcon = (type: string) => {
    switch (type) {
      case "video": return <Tv className="w-9 h-9 text-purple-500" />;
      case "image": return <Layers className="w-9 h-9 text-emerald-500" />;
      case "zip": return <Folder className="w-9 h-9 text-amber-500" />;
      default: return <File className="w-9 h-9 text-slate-400" />;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const maxLimit = isPremiumSession ? 4294967296 : 2147483648;
      
      if (file.size > maxLimit) {
        alert(language === "en" 
          ? `File size exceeds limits! Max limit: ${isPremiumSession ? "4.0 GB (Premium)" : "2.0 GB (Standard Account)"}`
          : `ফাইলের সাইজ অনেক বড়! সর্বোচ্চ অনুমোদন: ${isPremiumSession ? "৪.০ জিবি (প্রিমিয়াম)" : "২.০ জিবি (ফ্রি ব্যবহারকারী)"}`
        );
        return;
      }

      const newMockFile: MockFile = {
        id: `msg_${Date.now()}`,
        name: file.name,
        type: file.type.includes("video") ? "video" : file.type.includes("image") ? "image" : file.name.endsWith(".zip") ? "zip" : "document",
        sizeBytes: file.size,
        createdAt: "Just now"
      };

      setFilesList([newMockFile, ...filesList]);
      alert(language === "en" ? "File queued. Pipe launched." : "ফাইলটি আপলোডের জন্য যুক্ত করা হয়েছে!");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-5xl mx-auto my-8">
      
      {/* Simulator Top Branding Frame Bar mimicking native MacOS frame/Tauri */}
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          {/* Mock Buttons */}
          <div className="flex space-x-1.5 mr-2">
            <span className="w-3 h-3 bg-rose-500 rounded-full block"></span>
            <span className="w-3 h-3 bg-amber-500 rounded-full block"></span>
            <span className="w-3 h-3 bg-emerald-500 rounded-full block"></span>
          </div>
          <span className="font-mono text-xs text-sky-400 select-none tracking-wider uppercase font-semibold">
            {t.clientTitle}
          </span>
        </div>
        
        {/* Core Session Mode Indicator badge */}
        <div className="flex items-center space-x-3 text-xs">
          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full font-semibold ${isFullyLoggedIn ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
            <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
            <span>{isFullyLoggedIn ? "Connected mtproto" : "Session Offline"}</span>
          </span>
          <span className="text-slate-400">Ver 2.0.4 rtdb</span>
        </div>
      </div>

      {/* Simulator Workspace Grid layout of Tauri desktop */}
      <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
        
        {/* Sidebar Navigation */}
        <div className="col-span-1 bg-slate-50 border-r border-slate-200 p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-2">
              {language === "en" ? "Core Modules" : "অ্যাপ মডিউল সমূহ"}
            </p>
            
            <button 
              onClick={() => setActiveTab("explorer")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === "explorer" ? "bg-sky-500 text-white font-medium shadow-md shadow-sky-500/15" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Folder className="w-4 h-4" />
              <span>{language === "en" ? "02. File Explorer" : "০২. ফাইল এক্সপ্লোরার"}</span>
            </button>

            <button 
              onClick={() => setActiveTab("upload")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === "upload" ? "bg-sky-500 text-white font-medium shadow-md shadow-sky-500/15" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Upload className="w-4 h-4" />
              <span>{language === "en" ? "03. Ingress Upload" : "০৩. আপলোড ইঞ্জিন"}</span>
            </button>

            <button 
              onClick={() => setActiveTab("transfers")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === "transfers" ? "bg-sky-500 text-white font-medium shadow-md shadow-sky-500/15" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="flex-1 justify-between flex items-center">
                <span>{language === "en" ? "04. Transfer Progress" : "০৪. স্পীড মনিটর"}</span>
                {!isTransferPaused && (
                  <span className="w-1.5 h-1.5 bg-rose-500 animate-ping rounded-full"></span>
                )}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab("viewer")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === "viewer" ? "bg-sky-500 text-white font-medium shadow-md shadow-sky-500/15" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Tv className="w-4 h-4" />
              <span>{language === "en" ? "05. In-App Stream" : "০৫. স্ট্রিম ডেক"}</span>
            </button>

            <button 
              onClick={() => setActiveTab("proxy")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === "proxy" ? "bg-sky-500 text-white font-medium shadow-md shadow-sky-500/15" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Globe className="w-4 h-4" />
              <span>{language === "en" ? "06. Proxy Tunnel" : "০৬. প্রক্সি বিন্যাস"}</span>
            </button>

            <div className="pt-4 mt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-2">
                {language === "en" ? "System Core" : "সিস্টেম কোড ও সেশন"}
              </p>
              
              <button 
                onClick={() => setActiveTab("auth")}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === "auth" ? "bg-sky-500 text-white font-medium shadow-md shadow-sky-500/15" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Shield className="w-4 h-4" />
                <span>{language === "en" ? "01. Auth Credentials" : "০১. টেলিগ্রাম এপিআই"}</span>
              </button>

              <button 
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === "settings" ? "bg-sky-500 text-white font-medium shadow-md shadow-sky-500/15" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Settings className="w-4 h-4" />
                <span>{language === "en" ? "07. Configuration" : "০৭. সেটিংস হাব"}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats at bottom of inside app bar */}
          <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">DAILY LIMIT:</span>
              <span className="text-sky-300 font-bold">250 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">USED:</span>
              <span>18.4 GB</span>
            </div>
            <div className="w-full bg-slate-750 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full w-[7.3%]"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="col-span-1 md:col-span-3 p-6 flex flex-col justify-between bg-slate-50/50">
          
          {/* Top Address Breadcrumb Bar */}
          <div className="bg-white px-4 py-2 border border-slate-200 rounded-lg flex items-center justify-between text-xs mb-4">
            <div className="flex items-center space-x-1.5 font-mono text-slate-500">
              <Compass className="w-4 h-4 text-sky-500" />
              <span>Channelfs://</span>
              {currentPath.map((folder, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className={i === currentPath.length - 1 ? "text-slate-800 font-semibold" : ""}>{folder}</span>
                </React.Fragment>
              ))}
            </div>
            <div className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded uppercase">
              {isPremiumSession ? "PREMIUM CAP 4GB" : "FREE CAP 2GB"}
            </div>
          </div>

          <div className="flex-1 bg-white border border-slate-150 rounded-xl p-5 shadow-sm min-h-[340px]">
            
            {/* View: Setup & Auth Module */}
            {activeTab === "auth" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-semibold text-slate-800 text-base flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-sky-500" />
                    <span>01. Setup & Telegram Auth Engine (Zero-Knowledge)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure your credentials safely. All values are stored strictly inside your local machine variables offline.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">api_id (Telegram Developer Credentials):</label>
                    <input 
                      type="text" 
                      value={apiId}
                      onChange={(e) => setApiId(e.target.value)}
                      placeholder="e.g. 547454"
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">api_hash:</label>
                    <input 
                      type="text" 
                      value={apiHash}
                      onChange={(e) => setApiHash(e.target.value)}
                      placeholder="e.g. fc367f51bccca92"
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Phone Number (International Code First):</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +8801782366720"
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <button 
                      onClick={handleTriggerOTP}
                      className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded hover:bg-sky-600 transition flex items-center justify-center space-x-1.5"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{otpSent ? "Code Sent (Request Again)" : "Request One-Time Password (OTP)"}</span>
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 space-y-3">
                    <p className="text-xs text-sky-800 font-medium">
                      Enter the 5-digit verification code sent to your Telegram application inbox:
                    </p>
                    <div className="flex space-x-3 items-center">
                      <input 
                        type="text"
                        maxLength={5}
                        placeholder="e.g. 84201"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="px-3 py-1.5 max-w-[120px] text-center text-lg tracking-widest font-mono border border-slate-300 rounded outline-none"
                      />
                      <button 
                        onClick={handleVerifyOTP}
                        className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-bold hover:bg-slate-800 transition"
                      >
                        Confirm Code Keys
                      </button>
                    </div>
                  </div>
                )}

                {/* 2FA Section */}
                <div className="pt-2">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setTwoFactorVisible(!twoFactorVisible)}
                      className="text-xs text-slate-500 underline"
                    >
                      {twoFactorVisible ? "Hide 2FA Password input" : "Have 2nd-Factor Telegram Password?"}
                    </button>
                  </div>
                  {twoFactorVisible && (
                    <input 
                      type="password"
                      placeholder="Enter 2FA Password string"
                      value={twoFactor}
                      onChange={(e) => setTwoFactor(e.target.value)}
                      className="mt-2 px-3 py-1.5 w-full max-w-[280px] border border-slate-300 text-xs rounded"
                    />
                  )}
                </div>

                {authStatus && (
                  <div className="bg-slate-100 p-3 rounded text-xs text-slate-700 font-mono">
                    <strong>SYSTEM FEEDBACK:</strong> {authStatus}
                  </div>
                )}

                {isFullyLoggedIn && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-emerald-800">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-bold">Telegram Session Authenticated</p>
                        <p className="font-mono text-[10px] text-emerald-600">session_string_id: Str_MTProto:982A81D</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleResetSession}
                      className="text-xs bg-rose-100 text-rose-800 font-bold px-3 py-1.5 rounded hover:bg-rose-200"
                    >
                      Reset Session Config
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* View: File Explorer directory grid */}
            {activeTab === "explorer" && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-150 pb-2.5 gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">02. Virtual Scrolling File Directory</h3>
                    <p className="text-xs text-slate-500">
                      Telegram Storage Channels parsed directly to client visual nodes files. Shows previews & context nodes.
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input 
                      type="text"
                      placeholder="Search this channel..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-sky-500 w-[180px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[220px] pr-1">
                  {filesList
                    .filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((file) => (
                      <div 
                        key={file.id}
                        onClick={() => setShowFileInfo(file)}
                        className={`border p-3 rounded-lg flex flex-col justify-between text-left cursor-pointer transition ${showFileInfo?.id === file.id ? "border-sky-500 bg-sky-50/40 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <div className="flex items-start justify-between">
                          {getFileIcon(file.type)}
                          <span className="font-mono text-[10px] bg-slate-100 border text-slate-500 px-1.5 py-0.5 rounded uppercase">
                            .{file.type}
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <p className="text-xs font-medium text-slate-800 line-clamp-1" title={file.name}>
                            {file.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                            {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB | {file.createdAt}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                {showFileInfo && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center animate-fade-in">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">{showFileInfo.name}</p>
                      <p className="font-mono text-[11px] text-slate-500">
                        File ID: {showFileInfo.id} | Size: {(showFileInfo.sizeBytes / 1024 / 1024).toFixed(2)} MB ({showFileInfo.sizeBytes.toLocaleString()} bytes)
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Ready to Stream / Direct download configured</span>
                      </p>
                    </div>
                    <div className="flex space-x-2 shrink-0">
                      <button 
                        onClick={() => alert(`Initiating direct payload downloader stream for msg_id: ${showFileInfo.id}`)}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold p-1.5 rounded"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setFilesList(filesList.filter(f => f.id !== showFileInfo.id));
                          setShowFileInfo(null);
                        }}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-800 p-1.5 rounded"
                        title="Destroy reference message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowFileInfo(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View: Asset Upload Engine */}
            {activeTab === "upload" && (
              <div className="space-y-3.5">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-semibold text-slate-800 text-base">03. High-Performance Asset Upload Ingress</h3>
                  <p className="text-xs text-slate-500">
                    Upload directly or turn directories to single zip layers automatically. Exceed limits based on account level.
                  </p>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${dragActive ? "border-sky-500 bg-sky-50" : "border-slate-300 hover:border-slate-400 bg-slate-50/50"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { 
                    e.preventDefault(); 
                    setDragActive(false); 
                    alert(language === "en" ? "Files intercepted! Processing pre-flight check..." : "ফাইল ইন্টারসেপ্ট করা হয়েছে! প্রাক-আপলোড চেকিং হচ্ছে..."); 
                  }}
                  onClick={() => document.getElementById("sim-file-input")?.click()}
                >
                  <input 
                    type="file" 
                    id="sim-file-input" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                  <Upload className="w-10 h-10 text-sky-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {language === "en" ? "Drag & Drop Files Here or click to browser folders" : "ফাইল টেনে এনে এখানে ছাড়ুন অথবা ক্লিক করে আপলোড দিন"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Standard Core Limit: 2.0 GB per action. Premium account cap: 4.0 GB maximum limit.
                  </p>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg text-xs">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="zipFolders"
                      checked={zipFolders}
                      onChange={(e) => setZipFolders(e.target.checked)}
                      className="rounded border-slate-300 text-sky-500 outline-none"
                    />
                    <label htmlFor="zipFolders" className="font-medium text-slate-700 select-none">
                      Zip folders into structured archives (.zip index) before pipe launch
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-600">Telegram state:</span>
                    <button 
                      onClick={() => setIsPremiumSession(!isPremiumSession)}
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] transition ${isPremiumSession ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600"}`}
                    >
                      {isPremiumSession ? "PREMIUM ACCOUNT (4GB CAP)" : "STANDARD ACCOUNT (2GB CAP)"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View: Asset Transfer Queue Progress */}
            {activeTab === "transfers" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-semibold text-slate-800 text-base flex items-center justify-between">
                    <span>04. Real-time Asset Transfer Core Monitor</span>
                    <span className="text-xs font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                      {isTransferPaused ? "PAUSED" : "ACTIVE TRANSMISSION"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated speed and estimated remaining cycles evaluated using Rust pipeline thread blocks.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-150 text-xs">
                    <div className="flex justify-between font-mono mb-1 text-[11px]">
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                        Stranger.Things.S04E01.1080p.HEVC.zip
                      </span>
                      <span className="text-sky-600 font-bold">{uploadProgress}%</span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2.5 border">
                      <div 
                        className="bg-sky-500 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>

                    {/* Transfer dynamic speeds */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[10px] font-mono text-slate-500">
                      <div>
                        <span className="block text-slate-400">SPEED (W-CORES):</span>
                        <span className="text-slate-800 font-bold text-xs">{speedMB} MB/s</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">ETA TIMELINE:</span>
                        <span className="text-slate-800 font-bold text-xs">{etaSec} seconds</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">PROCESSED PIECES:</span>
                        <span className="text-slate-800 font-bold text-xs">{(processedBytes / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">TARGET LIMIT:</span>
                        <span className="text-slate-800 font-bold text-xs">{(totalTargetBytes / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <button 
                        onClick={() => setIsTransferPaused(!isTransferPaused)}
                        className={`text-[10px] font-mono font-bold px-3 py-1 rounded-md transition ${isTransferPaused ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"}`}
                      >
                        {isTransferPaused ? "Resume transfer" : "Pause transfer"}
                      </button>
                      <button 
                        onClick={() => {
                          setUploadProgress(0);
                          setProcessedBytes(1000);
                          setIsTransferPaused(true);
                          alert(language === "en" ? "Upload socket connection discarded." : "আপলোড কানেকশন বাতিল করা হয়েছে।");
                        }}
                        className="text-[10px] font-mono font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md"
                      >
                        Cancel transfer
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                    <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg">
                      Completed Pipeline: 14 items
                    </div>
                    <div className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg">
                      Active: 1 item running
                    </div>
                    <div className="p-2 bg-rose-50 text-rose-800 border border-rose-150 rounded-lg">
                      Failed / Blocked: 0 refs
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Media Stream deck & Document viewer */}
            {activeTab === "viewer" && (
              <div className="space-y-3.5">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-semibold text-slate-800 text-base">05. Inline Document Viewer & Byte-Range Video Player</h3>
                  <p className="text-xs text-slate-500">
                    Provides continuous buffering directly via local HTTP ranges bypassing memory buffer constraints. Handles seek request parameters smoothly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Video seek mockup */}
                  <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-center z-10">
                      <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-mono font-bold">
                        STREAMS CLIENT: ACTIVE
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">Accept-Ranges: bytes</span>
                    </div>

                    <div className="text-center py-6 z-10 flex flex-col items-center justify-center">
                      <button 
                        onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/20 shadow-md backdrop-blur-sm"
                      >
                        {isPlayingVideo ? <Pause className="w-5 h-5 text-sky-400 fill-current" /> : <Play className="w-5 h-5 text-white fill-current ml-0.5" />}
                      </button>
                      <p className="text-xs font-medium mt-3 font-mono">Inception.2010.BluRay.mp4</p>
                    </div>

                    <div className="space-y-1.5 z-10">
                      {/* Timeline buffering tracks */}
                      <div className="relative h-2 bg-white/15 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = Math.floor(((e.clientX - rect.left) / rect.width) * 100);
                        setVideoTimeline(percent);
                      }}>
                        {/* Buffered segments indicator as requested */}
                        {bufferedSegments.map((segment, idx) => (
                          <div 
                            key={idx}
                            className="absolute bg-white/30 h-full"
                            style={{ left: `${segment.start}%`, width: `${segment.end - segment.start}%` }}
                          ></div>
                        ))}
                        {/* Playhead progress */}
                        <div 
                          className="absolute bg-sky-400 h-full left-0 pointer-events-none"
                          style={{ width: `${videoTimeline}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>01:14:26</span>
                        <span>02:28:11 (Seeking buffered chunk stream)</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 pointer-events-none"></div>
                  </div>

                  {/* PDF scroll mockup */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between max-h-[180px] overflow-hidden">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pb-2 border-b">
                      <span>DOCPARSE_V2 // Quarterly_Tax_Statement.pdf</span>
                      <span>Page 3 of 12</span>
                    </div>

                    <div className="flex-1 py-3 text-center space-y-1 overflow-y-auto font-serif text-[10px] text-slate-600 bg-white shadow-inner p-2 my-2 rounded">
                      <p className="font-bold underline text-slate-800 text-xs">ANNUAL STATEMENT PORTFOLIO</p>
                      <p className="italic text-[8px] text-slate-400">Secure Audit ledger mapped on Private channel #491295</p>
                      <p className="text-left mt-2 leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ut nisl in ex tempor tristique. Vivamus rhoncus mi metus, id pharetra ex tristique ac.
                      </p>
                      <p className="text-left leading-relaxed">
                        Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris eget nibh sed nunc vestibulum varius.
                      </p>
                    </div>

                    <div className="text-[9px] text-slate-400 text-center font-mono italic">
                      Infinite scroll loaded dynamically through backend stream chunks.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Proxy setup and transport parameters */}
            {activeTab === "proxy" && (
              <div className="space-y-3.5">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-semibold text-slate-800 text-base">06. Proxy Tunnel & Bandwidth Chunks Shaper</h3>
                  <p className="text-xs text-slate-500">
                    Bypass geographical network throttling easily. Adapt chunks packaging blocks for faster transport queues.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Protocol Selector Mode:</label>
                      <select 
                        value={selectedProxyMode}
                        onChange={(e: any) => setSelectedProxyMode(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded outline-sky-500"
                      >
                        <option value="DirectConnection">Direct connection (Socks off)</option>
                        <option value="SOCKS5_Proxy">SOCKS5 Proxy (Encrypted TCP)</option>
                        <option value="MTProto_Proxy">MTProto Native Telegram Proxy</option>
                      </select>
                    </div>

                    {selectedProxyMode !== "DirectConnection" && (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="space-y-0.5">
                          <label className="text-slate-500">Host IP/DNS:</label>
                          <input 
                            type="text" 
                            value={proxyHost} 
                            onChange={(e) => setProxyHost(e.target.value)} 
                            className="w-full border p-1 rounded font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-slate-500">Socket Port:</label>
                          <input 
                            type="text" 
                            value={proxyPort} 
                            onChange={(e) => setProxyPort(e.target.value)} 
                            className="w-full border p-1 rounded font-mono"
                          />
                        </div>
                        <div className="space-y-0.5 col-span-2">
                          <label className="text-slate-500">Secret Token/Key (if applicable):</label>
                          <input 
                            type="password" 
                            value={proxySecret} 
                            onChange={(e) => setProxySecret(e.target.value)} 
                            placeholder="Optional authentication"
                            className="w-full border p-1 rounded font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-slate-700">
                        <label className="font-semibold">Upload Speed Throttle Limiter:</label>
                        <span className="font-bold text-sky-600 outline-none font-mono text-[11px]">{bandwidthCapMB} MB/s</span>
                      </div>
                      <input 
                        type="range"
                        min={5}
                        max={100}
                        value={bandwidthCapMB}
                        onChange={(e) => setBandwidthCapMB(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                      <span className="text-[10px] text-slate-400 italic block">
                        Keeps application background processes from consuming full residential network lines.
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Data Transport Packet block size:</label>
                      <select 
                        value={chunkSize}
                        onChange={(e: any) => setChunkSize(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                      >
                        <option value="128 KB">128 KB standard packet (Low loss rate)</option>
                        <option value="256 KB">256 KB intermediate packet</option>
                        <option value="512 KB">512 KB priority packet (High speed lines)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Settings Management Hub */}
            {activeTab === "settings" && (
              <div className="space-y-3.5 text-xs">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-semibold text-slate-800 text-base">07. Core Application Settings & Management Hub</h3>
                  <p className="text-xs text-slate-500">
                    Configure Keep-Alives constraints, clear cached login profiles, and trigger desktop updates from online repositories.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border">
                      <div>
                        <p className="font-bold text-slate-700">VPN Optimization Mode</p>
                        <p className="text-[10px] text-slate-400 leading-tight">Enforces lower concurrent handshake connections when active.</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={vpnOpActive}
                        onChange={(e) => setVpnOpActive(e.target.checked)}
                        className="rounded border-slate-300 text-sky-500 cursor-pointer h-4 w-4"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Adaptive Keep-Alive Pings Socket (Secs):</label>
                      <input 
                        type="number"
                        value={keepAliveSec}
                        onChange={(e) => setKeepAliveSec(parseInt(e.target.value) || 30)}
                        className="w-full border p-1 rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-slate-50 p-2.5 rounded-lg border space-y-1.5 font-mono text-[9px] text-slate-400">
                      <p className="font-semibold text-slate-500 border-b pb-0.5">LOCAL EMBEDDED SYSTEM LOGS:</p>
                      <div className="max-h-[60px] overflow-y-auto space-y-0.5 text-left text-sky-700">
                        {localSysLogs.map((log, i) => (
                          <div key={i}>&gt; {log}</div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2.5">
                      <button 
                        onClick={() => {
                          if (confirm("Are you sure you want to flush all local token session cache? Your client will require a fresh login key.")) {
                            handleResetSession();
                            alert("Storage session string and directory caches discarded successfully.");
                          }
                        }}
                        className="bg-slate-900 text-white font-bold p-2 rounded flex-1 hover:bg-slate-800 transition"
                      >
                        Flush Local Database Cache
                      </button>

                      <button 
                        onClick={() => {
                          alert("All repository catalogs matched. T-Drive client is running on the latest build structure.");
                        }}
                        className="bg-sky-100 text-sky-800 hover:bg-sky-200 py-2 px-3 rounded font-semibold text-center"
                      >
                        Check Version
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Lowermost Navigation Action Controls bar as requested */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center text-xs gap-2">
            <span className="text-slate-400 text-[11px] font-mono select-none">
              TAURI ENGINE (CORE v2) // rust-backend client loop active
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setActiveTab("upload");
                  document.getElementById("sim-file-input")?.click();
                }}
                className="bg-slate-100 hover:bg-slate-250 text-slate-700 px-3.5 py-1.5 rounded font-bold border flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Single File</span>
              </button>
              <button 
                onClick={() => {
                  alert(language === "en" 
                    ? "Directory scanner initialized! Please drop or select target folders." 
                    : "ডিরেক্টরি স্ক্যানার সচল! ফোল্ডার টেনে এনে ফেলুন।"
                  );
                }}
                className="bg-sky-500 hover:bg-sky-600 text-white px-3.5 py-1.5 rounded font-bold flex items-center space-x-1.5 shadow-md shadow-sky-500/15"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Entire Folder</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
