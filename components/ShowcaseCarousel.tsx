"use client";

import React, { useEffect, useState } from "react";
import { getAppsScriptJson } from "@/lib/appsScriptClient";

interface ShowcaseItem {
  id: number;
  title: string;
  author: string;
  image: string;
  type: string;
}

export default function ShowcaseCarousel() {
  const [projects, setProjects] = useState<ShowcaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadShowcaseData() {
      try {
        const result = await getAppsScriptJson<any>(new URLSearchParams({ action: "getAllMbtiData" }));
        if (result.status === "success" && result.data) {
          const showcaseData = result.data.showcase_links || result.data.ShowcaseLinks || [];
          const users = result.data.users || {};

          const formatted = showcaseData.map((item: any, idx: number) => {
            const author = item.Author || item.author || "익명";
            const userData = users[author];
            const avatar = typeof userData === 'string' ? userData : userData?.avatar;

            return {
              id: idx,
              title: item.Title || item.title || "무제 프로젝트",
              author,
              image: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${author}&backgroundColor=b6e3f4`,
              type: item.Type || item.type || "APP"
            };
          });

          // 무한 루프를 위해 데이터를 복제 (최소 10개 이상 확보)
          const list = [...formatted];
          while (list.length < 10 && list.length > 0) {
            list.push(...formatted);
          }
          setProjects(list.slice(0, 15)); // 최신 15개 정도만 노출
        }
      } catch (err) {
        console.error("Failed to fetch showcase for carousel", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadShowcaseData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden py-4 opacity-50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[140px] h-20 rounded-2xl bg-slate-100 animate-pulse border-2 border-slate-200" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-4 group pointer-events-none sm:pointer-events-auto">
      {/* Gradient Mask for smooth fade */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10" />

      <div className="flex gap-4 animate-marquee hover:pause-animation">
        {/* 두 번 반복하여 끊김 없는 루프 구현 */}
        {[...projects, ...projects].map((project, idx) => (
          <div
            key={`${project.id}-${idx}`}
            className="min-w-[160px] md:min-w-[200px] p-3 pt-6 rounded-2xl bg-white border-2 border-[#2F3D4A] shadow-[4px_4px_0px_0px_#2F3D4A] transition-all hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_#2F3D4A] flex flex-col items-center gap-3 shrink-0"
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#2F3D4A] bg-amber-50 flex items-center justify-center text-3xl overflow-hidden">
                {project.image.startsWith('http') ? (
                    <img src={project.image} alt={project.author} className="w-full h-full object-cover" />
                ) : (
                    project.image
                )}
            </div>
            <div className="text-center w-full">
              <h4 className="text-[11px] font-black tracking-tight text-[#2F3D4A] truncate px-1">
                {project.title}
              </h4>
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">
                by {project.author}
              </p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .hover\:pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
