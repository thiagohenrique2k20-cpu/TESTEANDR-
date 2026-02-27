import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Attendance, BulkUpdateAttendanceRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useAttendances() {
  return useQuery({
    queryKey: [api.attendances.list.path],
    queryFn: async () => {
      const res = await fetch(api.attendances.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendances");
      return (await res.json()) as Attendance[];
    },
  });
}

export function useBulkUpdateAttendances(meetingId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: BulkUpdateAttendanceRequest) => {
      const url = buildUrl(api.attendances.bulkUpdate.path, { meetingId });
      const res = await fetch(url, {
        method: api.attendances.bulkUpdate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save attendances");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attendances.list.path] });
      toast({ title: "Salvo", description: "Presenças atualizadas com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}
