import { useState } from "react";
import { Plus, Edit2, Trash2, ShieldCheck, Mail } from "lucide-react";
import { useInstructors, useCreateInstructor, useUpdateInstructor, useDeleteInstructor } from "@/hooks/use-instructors";
import { useSectors } from "@/hooks/use-sectors";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { InstructorWithSectors } from "@shared/schema";

export default function Instructors() {
  const { data: instructors, isLoading } = useInstructors();
  const { data: sectors } = useSectors();
  
  const createMutation = useCreateInstructor();
  const updateMutation = useUpdateInstructor();
  const deleteMutation = useDeleteInstructor();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<InstructorWithSectors | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [selectedSectors, setSelectedSectors] = useState<number[]>([]);

  const filteredInstructors = instructors?.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleOpenNew = () => {
    setEditingInst(null);
    setName("");
    setActive(true);
    setSelectedSectors([]);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (inst: InstructorWithSectors) => {
    setEditingInst(inst);
    setName(inst.name);
    setActive(inst.active);
    setSelectedSectors(inst.sectors.map(s => s.sector.id));
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingInst) {
      updateMutation.mutate(
        { id: editingInst.id, name, active, sectorIds: selectedSectors },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    } else {
      createMutation.mutate(
        { name, active, sectorIds: selectedSectors },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Gestão de Instrutores" 
        description="Adicione, edite e gerencie os instrutores do sistema."
        action={
          <Button onClick={handleOpenNew} className="rounded-xl h-11 px-6 shadow-md shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Novo Instrutor
          </Button>
        }
      />

      <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex gap-4">
        <Input 
          placeholder="Buscar instrutor por nome..." 
          className="max-w-md h-11 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map(inst => (
            <Card key={inst.id} className={`rounded-2xl transition-all duration-300 hover:shadow-lg border-border/50 ${!inst.active ? 'opacity-70 grayscale-[30%]' : ''}`}>
              <CardContent className="p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg shadow-inner">
                    {inst.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg" onClick={() => handleOpenEdit(inst)}>
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
                          <AlertDialogTitle>Excluir instrutor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir <b>{inst.name}</b>? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(inst.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg text-foreground leading-tight mb-1">{inst.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={inst.active ? "default" : "secondary"} className="text-[10px] uppercase font-bold tracking-wider rounded-md">
                    {inst.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Setores</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inst.sectors.length > 0 ? inst.sectors.map(s => (
                      <Badge key={s.sector.id} variant="outline" className="bg-background text-xs rounded-md">
                        {s.sector.name}
                      </Badge>
                    )) : (
                      <span className="text-xs text-muted-foreground italic">Sem setores vinculados</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              {editingInst ? "Editar Instrutor" : "Novo Instrutor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="h-11 rounded-xl"
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Vínculo de Setores</Label>
              <div className="bg-muted/30 border border-border/50 p-4 rounded-xl space-y-3 max-h-[200px] overflow-y-auto">
                {sectors?.map(sector => (
                  <div key={sector.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`sec-${sector.id}`} 
                      checked={selectedSectors.includes(sector.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSectors([...selectedSectors, sector.id]);
                        } else {
                          setSelectedSectors(selectedSectors.filter(id => id !== sector.id));
                        }
                      }}
                      className="rounded-md"
                    />
                    <Label htmlFor={`sec-${sector.id}`} className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {sector.name}
                    </Label>
                  </div>
                ))}
                {sectors?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhum setor cadastrado ainda.</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 border p-4 rounded-xl bg-card">
              <Checkbox 
                id="active" 
                checked={active} 
                onCheckedChange={(c) => setActive(!!c)} 
                className="rounded-md"
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="active" className="text-sm font-medium cursor-pointer">
                  Instrutor Ativo
                </Label>
                <p className="text-xs text-muted-foreground">Instrutores inativos não aparecem na lista de check-in.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending || !name.trim()}
              className="rounded-xl shadow-md"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar Instrutor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
