import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Meeting } from "@shared/schema";

export function useMeetings() {
  return useQuery({
    queryKey: [api.meetings.list.path],
    queryFn: async () => {
      const res = await fetch(api.meetings.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return (await res.json()) as Meeting[];
    },
  });
}
