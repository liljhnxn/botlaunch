import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Rocket, Github, ExternalLink, Shield } from "lucide-react";
import { BOTCHAIN_EXPLORER_URL, BOTCHAIN_CHAIN_ID, BOTCHAIN_RPC_URL } from "@/contracts/addresses";

export const metadata: Metadata = {
  title: "BOTLAUNCH — Decentralized Token Launchpad",
  description:
    "A decentralized token launchpad for launching and participating in token sales on Botchain Mainnet.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#06090e] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-primary selection:text-black">
        <Providers>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 bg-[#04060a] py-12 mt-20 text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand Info */}
                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-black font-bold">
                      <Rocket className="w-4 h-4 text-black transform -rotate-45" />
                    </div>
                    <span className="font-bold text-base text-white">BOTLAUNCH</span>
                  </div>
                  <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
                    The premier decentralized token launchpad built natively for the Botchain ecosystem.
                    Empowering innovators to launch, fund, and build decentralized protocols.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>Non-custodial escrow & Reentrancy Protected</span>
                  </div>
                </div>

                {/* Ecosystem Links */}
                <div>
                  <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">
                    Ecosystem
                  </h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="https://botchain.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span>Botchain Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      <a
                        href={BOTCHAIN_EXPLORER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span>BotChain Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      <a
                        href={BOTCHAIN_RPC_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span>Public RPC Endpoint</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Network Specs */}
                <div>
                  <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">
                    Network Specs
                  </h4>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span className="text-slate-500">Chain ID:</span>
                      <span className="text-primary font-bold">{BOTCHAIN_CHAIN_ID}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span className="text-slate-500">Native Token:</span>
                      <span className="text-slate-200">BOT</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span className="text-slate-500">Total Supply:</span>
                      <span className="text-emerald-400 font-semibold">150 Million BOT</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span className="text-slate-500">Decimals:</span>
                      <span className="text-slate-200">18</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-emerald-400 font-semibold">Mainnet Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
                <p>© {new Date().getFullYear()} BotLaunchpad Protocol. Built for Botchain Mainnet.</p>
                <p>Decentralized Token Launchpad Protocol on Botchain Mainnet.</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
