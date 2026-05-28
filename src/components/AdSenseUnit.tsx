import React from "react";

interface AdSenseUnitProps {
  type: "leaderboard" | "rectangle" | "responsiveSquare" | "nativeBanner";
  slotId?: string;
}

export default function AdSenseUnit({ type, slotId = "49821360" }: AdSenseUnitProps) {
  // Mock sponsor information for high conversion visual designs
  const sponsorAds = [
    { title: "HostGator Unlimited VPS Node", desc: "Supercharge your Cloud server with NVMe SSD Storage. Instant Deploy.", url: "hostgator.com" },
    { title: "Tauri Studio Build Engine", desc: "Compile Rust wrappers to portable native executable widgets instantly.", url: "tauri.studio" },
    { title: "Telegram Premium Yearly Pass", desc: "Unlock double file upload ceilings up to 4.0 GB and custom speed boosters.", url: "telegram.org" }
  ];

  const randomSponsor = sponsorAds[Math.floor(Math.random() * sponsorAds.length)];

  if (type === "leaderboard") {
    return (
      <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 text-center rounded-2xl my-6" id="google-adsense-leaderboard">
        <div className="mx-auto w-full md:max-w-3xl min-h-[48px] bg-slate-150 dark:bg-slate-850 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-2.5 text-center md:text-left gap-3 text-slate-650 dark:text-slate-300">
          <div className="w-full md:w-auto">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block uppercase tracking-wider font-bold">Google Adsense - Leaderboard</span>
            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 font-sans text-xs hover:text-[#24A1DE] cursor-pointer transition-colors mt-0.5">{randomSponsor.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-sans mt-0.5">{randomSponsor.desc}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end">
            <span className="text-[9px] text-slate-400 dark:text-slate-550 font-mono italic">{randomSponsor.url}</span>
            <button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-250 text-white dark:text-slate-950 text-[10px] uppercase font-black tracking-wider font-sans px-3 py-1.5 rounded-full transition-all">
              Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "rectangle") {
    return (
      <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl my-6" id="google-adsense-rectangle">
        <div className="w-full min-h-[160px] bg-slate-150 dark:bg-slate-850 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col justify-between p-4 text-left">
          <div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block uppercase tracking-wider font-bold mb-1">GOOGLE ADSENSE - RECTANGLE</span>
            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm hover:text-[#24A1DE] cursor-pointer transition-colors">{randomSponsor.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mt-1">{randomSponsor.desc}</p>
          </div>
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono mt-3">
            <span className="text-[#24A1DE] font-semibold hover:underline cursor-pointer">{randomSponsor.url} &rarr;</span>
            <span className="text-slate-400 dark:text-slate-550">SlotID: {slotId}</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "nativeBanner") {
    return (
      <div className="w-full my-6 p-4 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center font-sans text-xs relative overflow-hidden" id="google-adsense-native">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 py-1 px-2">
          <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-[#24A1DE] dark:text-sky-400 border border-[#24A1DE]/20 rounded-full font-bold font-mono text-[9px] uppercase tracking-wider">
              Hot Deal
            </span>
            <p className="text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
              Need high performance MTProto proxies? Get customized SOCKS5 channels for T-Drive with zero packet loss.
            </p>
          </div>
          <a href="#pricings" className="bg-[#24A1DE] hover:bg-sky-500 text-white px-4 py-2.5 rounded-full text-[11px] font-bold shrink-0 transition-all shadow-md shadow-blue-200/35 w-full sm:w-auto text-center">
            Boost Speed
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl my-6 text-center text-xs relative" id="google-adsense-square">
      <div className="w-full min-h-[120px] bg-slate-150 dark:bg-slate-850 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col justify-center items-center p-4">
        <span className="text-[9px] text-slate-400 dark:text-slate-550 tracking-widest font-mono uppercase font-bold mb-1">
          Advertisement by Google
        </span>
        <p className="text-slate-800 dark:text-slate-200 font-bold font-sans text-xs">bKash Commercial Premium Gateway</p>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Verify payments instantly. Enjoy premium limits activation. ({slotId})</p>
      </div>
    </div>
  );
}
