"use client";

import { LogOut } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface SidebarProps {
  activeCategory?: string;
  handleCategoryClick?: (cat: string) => void;
}

export function Sidebar({ 
  activeCategory, 
  handleCategoryClick, 
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isContactPage = pathname === "/contact";

  const onCategoryClick = (cat: string) => {
    if (handleCategoryClick) {
      handleCategoryClick(cat);
    } else {
      router.push("/");
    }
  };

  return (
    <aside className="hidden md:block md:w-64 shrink-0 md:relative z-30 bg-[var(--color-brand-bg)] px-6">
      <div className="md:sticky md:top-32 flex flex-col gap-8 overflow-x-visible pb-0 scrollbar-hide whitespace-nowrap">
        {CATEGORIES.map((cat, idx) => (
          <div
            key={cat}
            className={`flex items-center justify-start md:justify-between shrink-0 w-auto md:w-full group/prem ${
                cat === "Films" ? "md:mt-4 md:border-t md:border-current/10 md:pt-8" : ""
            } ${
                cat === "Featured Work" ? "md:mb-4 md:border-b md:border-current/10 md:pb-8" : ""
            }`}
          >
            <button
              onClick={() => onCategoryClick(cat)}
              className={`text-left text-xs md:text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                activeCategory === cat
                  ? "text-black font-normal"
                  : "text-gray-500 font-normal hover:text-black"
              }`}
            >
              {cat}
            </button>
          </div>
        ))}
        
        <div className="md:mt-4 md:border-t md:border-current/10 md:pt-8">
          <Link 
            href="/contact"
            className={`text-left text-xs md:text-sm uppercase tracking-[0.2em] transition-all duration-500 font-normal hover:text-black ${
                isContactPage ? "text-black" : "text-gray-500"
            }`}
          >
            Contact
          </Link>
        </div>
      </div>
    </aside>
  );
}
