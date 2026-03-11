import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, CheckCircle2, Search, Filter, AlertCircle, Info, Edit2, Plus } from "lucide-react";
import { useInstructors } from "@/hooks/use-instructors";
import { useMeetings, useUpdateMeeting } from "@/hooks/use-meetings";
import { useAttendances, useBulkUpdateAttendances } from "@/hooks/use-attendances";
import { useSectors } from "@/hooks/use-sectors";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type AttendanceState = {
  status: "present" | "absent" | "justified" | "na";
  observation?: string | null;
};

export default function CheckIn() {
  const { data: instructors, isLoading: loadInst } = useInstructors();
  const { data: meetings, isLoading: loadMeet } = useMeetings();
  const { data: attendances, isLoading: loadAtt } = useAttendances();
  const { data: sectors, isLoading: loadSec } = useSectors();

  const [selectedMeetingId, setSelectedMeetingId] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [sectorFilters, setSectorFilters] = useState<string[]>([]);
  const [meetingSectorFilter, setMeetingSectorFilter] = useState<string>("all");
  const [draft, setDraft] = useState<Record<number, AttendanceState>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [editMeetingName, setEditMeetingName] = useState("");
  const [editMeetingSectorId, setEditMeetingSectorId] = useState<number | null>(null);

  const updateMeetingMutation = useUpdateMeeting();

  // Sync initial meeting selection
  useEffect(() => {
    if (meetings && meetings.length > 0 && selectedMeetingId === "") {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todayMeeting = meetings.find(m => m.date === todayStr);
      if (todayMeeting) {
        setSelectedMeetingId(todayMeeting.id);
      } else {
        // Find closest meeting to today (past or future)
        const sorted = [...meetings].sort((a, b) => {
          const distA = Math.abs(new Date(a.date).getTime() - new Date().getTime());
          const distB = Math.abs(new Date(b.date).getTime() - new Date().getTime());
          return distA - distB;
        });
        setSelectedMeetingId(sorted[0].id);
      }
    }
  }, [meetings, selectedMeetingId]);

  const selectedMeeting = meetings?.find(m => m.id === selectedMeetingId);

  useEffect(() => {
    if (selectedMeeting) {
      setEditMeetingName(selectedMeeting.name || "");
      setEditMeetingSectorId(selectedMeeting.sectorId || null);
    }
  }, [selectedMeeting]);

  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];
    if (meetingSectorFilter === "all") return meetings;
    return meetings.filter(m => m.sectorId?.toString() === meetingSectorFilter);
  }, [meetings, meetingSectorFilter]);

  const handleUpdateMeeting = () => {
    if (selectedMeetingId === "") return;
    updateMeetingMutation.mutate({
      id: Number(selectedMeetingId),
      name: editMeetingName,
      sectorId: editMeetingSectorId
    }, {
      onSuccess: () => setIsEditingMeeting(false)
    });
  };

  // Sync draft state from backend attendances when meeting changes
  useEffect(() => {
    if (selectedMeetingId !== "" && attendances) {
      const meetingAtts = attendances.filter(a => a.meetingId === selectedMeetingId);
      const newDraft: Record<number, AttendanceState> = {};
      meetingAtts.forEach(a => {
        newDraft[a.instructorId] = {
          status: a.status as any,
          observation: a.observation
        };
      });
      setDraft(newDraft);
      setHasChanges(false);
    }
  }, [selectedMeetingId, attendances]);

  const updateMutation = useBulkUpdateAttendances(selectedMeetingId as number);

  const isLocked = false; // Always allow editing as requested

  const filteredInstructors = useMemo(() => {
    if (!instructors) return [];
    let list = instructors.filter(i => i.active);
    if (search) {
      list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (sectorFilters.length > 0) {
      list = list.filter(i => i.sectors.some(s => sectorFilters.includes(s.sector.id.toString())));
    }
    return list;
  }, [instructors, search, sectorFilters]);

  const toggleSectorFilter = (id: string) => {
    setSectorFilters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };


  const handleStatusChange = (instructorId: number, status: AttendanceState['status']) => {
    if (isLocked) return;
    setDraft(prev => ({
      ...prev,
      [instructorId]: { ...prev[instructorId], status }
    }));
    setHasChanges(true);
  };

  const handleObservationChange = (instructorId: number, obs: string) => {
    if (isLocked) return;
    setDraft(prev => ({
      ...prev,
      [instructorId]: { ...prev[instructorId], observation: obs }
    }));
    setHasChanges(true);
  };

  const handleMarkAllPresent = () => {
    if (isLocked) return;
    const newDraft = { ...draft };
    filteredInstructors.forEach(inst => {
      // Only update if not already marked as justified or absent explicitly? 
      // Requirement says "Marcar todos como Presente", so we override.
      newDraft[inst.id] = { status: "present", observation: "" };
    });
    setDraft(newDraft);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (isLocked || selectedMeetingId === "") return;
    const payload = {
      attendances: Object.entries(draft).map(([instId, state]) => ({
        instructorId: Number(instId),
        status: state.status,
        observation: state.observation,
      }))
    };
    updateMutation.mutate(payload, {
      onSuccess: () => setHasChanges(false)
    });
  };

  if (loadInst || loadMeet || loadAtt || loadSec) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto relative pb-24">
      <PageHeader 
        title="Check-in de Instrutores" 
        description="Registre as presenças e ausências da reunião selecionada."
      />

      <div className="grid gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-muted-foreground ml-1">Setor da Reunião</Label>
                <Select value={meetingSectorFilter} onValueChange={setMeetingSectorFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-background shadow-sm">
                    <SelectValue placeholder="Filtrar Reuniões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Reuniões</SelectItem>
                    {sectors?.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <Label className="text-xs font-semibold text-muted-foreground ml-1">Data/Nome da Reunião</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select 
                      value={selectedMeetingId.toString()} 
                      onValueChange={(val) => setSelectedMeetingId(Number(val))}
                    >
                      <SelectTrigger className="pl-9 h-11 rounded-xl bg-background border-border shadow-sm">
                        <SelectValue placeholder="Selecione uma reunião" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredMeetings.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.name ? `${m.name} (${format(new Date(m.date + 'T12:00:00'), "dd/MM/yyyy")})` : format(new Date(m.date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-11 w-11 rounded-xl"
                    onClick={() => setIsEditingMeeting(true)}
                    disabled={selectedMeetingId === ""}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto self-end">
              <Button 
                onClick={handleMarkAllPresent}
                disabled={isLocked || filteredInstructors.length === 0}
                variant="outline" 
                className="w-full xl:w-auto h-11 rounded-xl font-semibold border-primary/20 text-primary hover:bg-primary hover:text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Marcar visíveis como Presente
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar instrutor..." 
                className="pl-9 h-11 rounded-xl bg-background shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Filtrar Instrutores:</span>
              {sectors?.map(s => (
                <Button
                  key={s.id}
                  variant={sectorFilters.includes(s.id.toString()) ? "default" : "outline"}
                  size="sm"
                  className="rounded-full h-8 px-3 text-xs"
                  onClick={() => toggleSectorFilter(s.id.toString())}
                >
                  {s.name}
                </Button>
              ))}
              {sectorFilters.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={() => setSectorFilters([])}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Lock Warning Removed - Editing Always Enabled */}

        {/* Instructors List */}
        <div className="grid gap-3">
          {filteredInstructors.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
              <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">Nenhum instrutor encontrado.</p>
            </div>
          ) : (
            filteredInstructors.map(inst => {
              const currentStatus = draft[inst.id]?.status;
              const isJustified = currentStatus === 'justified';
              
              return (
                <Card key={inst.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">{inst.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {inst.sectors.map(s => (
                            <Badge key={s.sector.id} variant="secondary" className="bg-secondary/50 text-xs font-medium rounded-md">
                              {s.sector.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full lg:w-auto">
                        <div className="grid grid-cols-4 sm:flex gap-2">
                          <Button 
                            disabled={isLocked}
                            onClick={() => handleStatusChange(inst.id, 'present')}
                            className={`status-btn flex-1 sm:w-28 h-12 rounded-xl border-2 ${
                              currentStatus === 'present' 
                              ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20' 
                              : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100 hover:border-green-200'
                            }`}
                          >
                            <span className="hidden sm:inline">Presente</span>
                            <span className="sm:hidden">P</span>
                          </Button>
                          <Button 
                            disabled={isLocked}
                            onClick={() => handleStatusChange(inst.id, 'absent')}
                            className={`status-btn flex-1 sm:w-28 h-12 rounded-xl border-2 ${
                              currentStatus === 'absent' 
                              ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20' 
                              : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100 hover:border-red-200'
                            }`}
                          >
                            <span className="hidden sm:inline">Ausente</span>
                            <span className="sm:hidden">A</span>
                          </Button>
                          <Button 
                            disabled={isLocked}
                            onClick={() => handleStatusChange(inst.id, 'justified')}
                            className={`status-btn flex-1 sm:w-28 h-12 rounded-xl border-2 ${
                              currentStatus === 'justified' 
                              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' 
                              : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 hover:border-amber-200'
                            }`}
                          >
                            <span className="hidden sm:inline">Justificou</span>
                            <span className="sm:hidden">J</span>
                          </Button>
                          <Button 
                            disabled={isLocked}
                            onClick={() => handleStatusChange(inst.id, 'na')}
                            className={`status-btn flex-1 sm:w-20 h-12 rounded-xl border-2 ${
                              currentStatus === 'na' 
                              ? 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20' 
                              : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <span className="hidden sm:inline text-xs">Não Obrigatório</span>
                            <span className="sm:hidden">N/O</span>
                          </Button>
                        </div>
                        
                        {isJustified && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <Input
                              placeholder="Motivo da justificativa..."
                              className="rounded-xl border-amber-200 focus-visible:ring-amber-500"
                              value={draft[inst.id]?.observation || ""}
                              onChange={(e) => handleObservationChange(inst.id, e.target.value)}
                              disabled={isLocked}
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Meeting Dialog */}
      <Dialog open={isEditingMeeting} onOpenChange={setIsEditingMeeting}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar Reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Reunião (Opcional)</Label>
              <Input 
                placeholder="Ex: Treinamento Ginástica Geral" 
                value={editMeetingName}
                onChange={(e) => setEditMeetingName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Setor Responsável</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-primary"
                  onClick={() => {
                    const name = prompt("Nome do novo setor:");
                    if (name) {
                      // We don't have a direct sector mutation hook here, but we can use the one from sectors page if needed
                      // For simplicity in Fast Mode, let's assume the user can add via the sectors page or we provide a quick link
                      window.location.href = "/sectors";
                    }
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Novo Setor
                </Button>
              </div>
              <Select 
                value={editMeetingSectorId?.toString() || "none"} 
                onValueChange={(val) => setEditMeetingSectorId(val === "none" ? null : Number(val))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {sectors?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingMeeting(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateMeeting} 
              className="rounded-xl"
              disabled={updateMeetingMutation.isPending}
            >
              {updateMeetingMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Bar */}
      {hasChanges && !isLocked && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <div className="glass-panel px-6 py-4 rounded-full flex items-center gap-6">
            <span className="text-sm font-medium text-foreground">Existem alterações não salvas</span>
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending}
              className="rounded-full shadow-lg hover:shadow-xl transition-all px-8 bg-primary hover:bg-primary/90 text-white"
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
