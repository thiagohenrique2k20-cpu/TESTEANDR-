import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Sector, CreateSectorRequest, UpdateSectorRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSectors() {
  return useQuery({
    queryKey: [api.sectors.list.path],
    queryFn: async () => {
      const res = await fetch(api.sectors.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sectors");
      return (await res.json()) as Sector[];
    },
  });
}

export function useCreateSector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSectorRequest) => {
      const res = await fetch(api.sectors.create.path, {
        method: api.sectors.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create sector");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sectors.list.path] });
      toast({ title: "Sucesso", description: "Setor criado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateSector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateSectorRequest) => {
      const url = buildUrl(api.sectors.update.path, { id });
      const res = await fetch(url, {
        method: api.sectors.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update sector");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sectors.list.path] });
      toast({ title: "Sucesso", description: "Setor atualizado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteSector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.sectors.delete.path, { id });
      const res = await fetch(url, {
        method: api.sectors.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete sector");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sectors.list.path] });
      toast({ title: "Sucesso", description: "Setor removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}
