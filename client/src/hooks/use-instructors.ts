import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InstructorWithSectors, CreateInstructorRequest, UpdateInstructorRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useInstructors() {
  return useQuery({
    queryKey: [api.instructors.list.path],
    queryFn: async () => {
      const res = await fetch(api.instructors.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch instructors");
      return (await res.json()) as InstructorWithSectors[];
    },
  });
}

export function useCreateInstructor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: CreateInstructorRequest) => {
      const res = await fetch(api.instructors.create.path, {
        method: api.instructors.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create instructor");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.instructors.list.path] });
      toast({ title: "Sucesso", description: "Instrutor criado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateInstructor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateInstructorRequest) => {
      const url = buildUrl(api.instructors.update.path, { id });
      const res = await fetch(url, {
        method: api.instructors.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update instructor");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.instructors.list.path] });
      toast({ title: "Sucesso", description: "Instrutor atualizado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteInstructor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.instructors.delete.path, { id });
      const res = await fetch(url, {
        method: api.instructors.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete instructor");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.instructors.list.path] });
      toast({ title: "Sucesso", description: "Instrutor removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}
