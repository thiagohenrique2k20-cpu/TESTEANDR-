import { useState } from "react";
import { Plus, Edit2, Trash2, LayoutGrid } from "lucide-react";
import { useSectors, useCreateSector, useUpdateSector, useDeleteSector } from "@/hooks/use-sectors";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Sector } from "@shared/schema";

export default function Sectors() {
  const { data: sectors, isLoading } = useSectors();
  
  const createMutation = useCreateSector();
  const updateMutation = useUpdateSector();
  const deleteMutation = useDeleteSector();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [name, setName] = useState("");

  const handleOpenNew = () => {
    setEditingSector(null);
    setName("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sector: Sector) => {
    setEditingSector(sector);
    setName(sector.name);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingSector) {
      updateMutation.mutate(
        { id: editingSector.id, name },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    } else {
      createMutation.mutate(
        { name },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="Setores" 
        description="Gerencie os departamentos e setores."
        action={
          <Button onClick={handleOpenNew} className="rounded-xl h-11 px-6 shadow-md shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Novo Setor
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sectors?.map(sector => (
            <Card key={sector.id} className="rounded-2xl transition-all duration-300 hover:shadow-md border-border/50 group">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground">{sector.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg" onClick={() => handleOpenEdit(sector)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir setor?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o setor <b>{sector.name}</b>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(sector.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {sectors?.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-2xl">
              <p className="text-muted-foreground">Nenhum setor cadastrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              {editingSector ? "Editar Setor" : "Novo Setor"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Setor</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="h-11 rounded-xl"
                placeholder="Ex: Treinamento Técnico"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending || !name.trim()}
              className="rounded-xl shadow-md"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar Setor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
