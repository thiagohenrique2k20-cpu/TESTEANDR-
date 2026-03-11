import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { MeetingType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useMeetingTypes() {
  return useQuery({
    queryKey: [api.meetingTypes.list.path],
    queryFn: async () => {
      const res = await fetch(api.meetingTypes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meeting types");
      return (await res.json()) as MeetingType[];
    },
  });
}

export function useCreateMeetingType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(api.meetingTypes.create.path, {
        method: api.meetingTypes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create meeting type");
      return (await res.json()) as MeetingType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meetingTypes.list.path] });
      toast({ title: "Sucesso", description: "Tipo de reunião criado." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}
