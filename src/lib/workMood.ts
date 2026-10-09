import { useEffect, useState } from 'react';

// 「幕后」卡片的工作状态动图：四个动图分别对应一天四个时段（本地时间）。
// 素材来自仓库根目录 deepseek-gif/working/（该目录未跟踪），已用 ASCII 名发布到 public/muhou/，
// 再由 ffmpeg 转成 320 宽动图 WebP（原来 4 个 GIF 合计 5.8MB，转完约 1MB）：
//   work-normal.webp ← deepseek娘_工作(普通)_2026-09-28-22-35-09.gif
//   work-tired.webp  ← deepseek娘_工作(疲倦)_2026-09-28-22-35-17.gif
//   work-angry.webp  ← deepseek娘_工作(生气)_2026-09-28-22-34-51.gif
//   work-nap.webp    ← deepseek娘_工作(小睡)_2026-09-28-22-35-04.gif

export type WorkMoodKey = 'normal' | 'tired' | 'angry' | 'nap';

export interface WorkMood {
  key: WorkMoodKey;
  file: string;
  period: string;
  label: string;
}

const moods: Record<WorkMoodKey, WorkMood> = {
  normal: { key: 'normal', file: 'work-normal.webp', period: '上午', label: '上午 · 精神饱满地干活' },
  tired: { key: 'tired', file: 'work-tired.webp', period: '下午', label: '下午 · 已经有点累了' },
  angry: { key: 'angry', file: 'work-angry.webp', period: '晚上', label: '晚上 · 暴躁地改 bug' },
  nap: { key: 'nap', file: 'work-nap.webp', period: '深夜', label: '深夜 · 偷偷小睡一会儿' },
};

// 四个时段覆盖 0-23 点且互不重叠：06-11 上午 / 12-17 下午 / 18-22 晚上 / 23-05 深夜。
export const workMoodAt = (hour: number): WorkMood => {
  const h = ((Math.trunc(hour) % 24) + 24) % 24;
  if (h >= 6 && h < 12) return moods.normal;
  if (h >= 12 && h < 18) return moods.tired;
  if (h >= 18 && h < 23) return moods.angry;
  return moods.nap;
};

export const currentWorkMood = (now: Date = new Date()) => workMoodAt(now.getHours());

export const workMoodImage = (mood: WorkMood) => `${import.meta.env.BASE_URL}muhou/${mood.file}`;

// 页面停留在跨时段的那一刻也能自动换图：每分钟核对一次，只有跨时段才触发重渲染。
export const useWorkMood = (): WorkMood => {
  const [key, setKey] = useState<WorkMoodKey>(() => currentWorkMood().key);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = currentWorkMood().key;
      setKey((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return moods[key];
};
