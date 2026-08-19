"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Snapshot = {
  unread: number;
  latestNotificationId: string | null;
  paymentsToday: number;
  at: string;
};

export function useRealtimeSnapshot(initialUnread: number) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [live, setLive] = useState(false);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    const es = new EventSource("/api/realtime/stream");
    es.addEventListener("connected", () => setLive(true));
    es.addEventListener("snapshot", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as Snapshot;
        setUnread(data.unread);
        if (lastId.current && data.latestNotificationId && lastId.current !== data.latestNotificationId) {
          router.refresh();
        }
        lastId.current = data.latestNotificationId;
      } catch {
        /* ignore malformed */
      }
    });
    es.onerror = () => setLive(false);
    return () => es.close();
  }, [router]);

  return { unread, live };
}
