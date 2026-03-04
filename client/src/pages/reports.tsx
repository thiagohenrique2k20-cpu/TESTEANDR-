import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from "recharts";
import { AlertTriangle, TrendingUp, Trophy, Activity, User, ChevronRight } from "lucide-react";
import { useInstructors } from "@/hooks/use-instructors";
import { useAttendances } from "@/hooks/use-attendances";
import { useMeetings } from "@/hooks/use-meetings";
import { useSettings } from "@/hooks/use-settings";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useSectors } from "@/hooks/use-sectors";

export default function Reports() {
  const { data: instructors, isLoading: loadInst } = useInstructors();
  const { data: attendances, isLoading: loadAtt } = useAttendances();
  const { data: meetings, isLoading: loadMeet } = useMeetings();
  const { data: settings, isLoading: loadSet } = useSettings();
  const { data: sectors, isLoading: loadSec } = useSectors();

  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [meetingSectorFilter, setMeetingSectorFilter] = useState<string>("all");

  const minAttendance = settings?.minimumAttendance || 80;

  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];
    if (meetingSectorFilter === "all") return meetings;
    return meetings.filter(m => m.sectorId?.toString() === meetingSectorFilter);
  }, [meetings, meetingSectorFilter]);

  const filteredAttendances = useMemo(() => {
    if (!attendances || !filteredMeetings) return [];
    const meetingIds = new Set(filteredMeetings.map(m => m.id));
    return attendances.filter(a => meetingIds.has(a.meetingId));
  }, [attendances, filteredMeetings]);

  const stats = useMemo(() => {
    if (!instructors || !filteredAttendances) return [];

    return instructors.map(inst => {
      const instAtts = filteredAttendances.filter(a => a.instructorId === inst.id);
      const present = instAtts.filter(a => a.status === 'present').length;
      const absent = instAtts.filter(a => a.status === 'absent').length;
      const justified = instAtts.filter(a => a.status === 'justified').length;
      const na = instAtts.filter(a => a.status === 'na').length;
      
      const validForCalc = present + absent; 
      const percentage = validForCalc > 0 ? Math.round((present / validForCalc) * 100) : 100;
      const totalApplicable = present + absent + justified;

      return {
        id: inst.id,
        name: inst.name,
        sectors: inst.sectors.map(s => s.sector.name).join(", "),
        present,
        absent,
        justified,
        na,
        totalApplicable,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage || b.present - a.present);
  }, [instructors, filteredAttendances]);

  const selectedInstructorStats = useMemo(() => {
    if (!selectedInstructorId || !stats || !filteredAttendances || !filteredMeetings) return null;
    const instructor = instructors?.find(i => i.id === selectedInstructorId);
    const instStats = stats.find(s => s.id === selectedInstructorId);
    if (!instructor || !instStats) return null;

    const instAtts = filteredAttendances.filter(a => a.instructorId === selectedInstructorId);
    const history = instAtts.map(a => {
      const meeting = filteredMeetings.find(m => m.id === a.meetingId);
      return {
        date: meeting?.date || "",
        status: a.status,
        observation: a.observation
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pieData = [
      { name: 'Presente', value: instStats.present, fill: '#16a34a' },
      { name: 'Ausente', value: instStats.absent, fill: '#dc2626' },
      { name: 'Justificado', value: instStats.justified, fill: '#f59e0b' },
      { name: 'Não Obrigatório', value: instStats.na, fill: '#64748b' },
    ].filter(d => d.value > 0);

    return { instructor, instStats, history, pieData };
  }, [selectedInstructorId, stats, filteredAttendances, filteredMeetings, instructors]);

  // Aggregate by Month for Trend Chart
  const monthlyData = useMemo(() => {
    if (!filteredMeetings || !filteredAttendances) return [];
    
    const groups: Record<string, { present: number, total: number }> = {};
    
    filteredMeetings.forEach(m => {
      const month = format(parseISO(m.date), "MMM/yyyy", { locale: ptBR });
      if (!groups[month]) groups[month] = { present: 0, total: 0 };
      
      const mAtts = filteredAttendances.filter(a => a.meetingId === m.id && (a.status === 'present' || a.status === 'absent'));
      groups[month].present += mAtts.filter(a => a.status === 'present').length;
      groups[month].total += mAtts.length;
    });

    return Object.entries(groups).map(([name, data]) => ({
      name,
      presenca: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
    }));
  }, [filteredMeetings, filteredAttendances]);

  if (loadInst || loadAtt || loadMeet || loadSet || loadSec) {
    return <div className="p-8 space-y-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  const overallAvg = stats.length > 0 
    ? Math.round(stats.reduce((acc, curr) => acc + curr.percentage, 0) / stats.length)
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <PageHeader 
          title="Painel de Relatórios" 
          description="Acompanhe os indicadores de engajamento e assiduidade global."
        />
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Select 
              value={meetingSectorFilter} 
              onValueChange={setMeetingSectorFilter}
            >
              <SelectTrigger className="rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo de Reunião" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Reuniões</SelectItem>
                {sectors?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-64">
            <Select 
              value={selectedInstructorId?.toString() || "all"} 
              onValueChange={(val) => setSelectedInstructorId(val === "all" ? null : Number(val))}
            >
              <SelectTrigger className="rounded-xl">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Relatório Individual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visão Geral</SelectItem>
                {instructors?.map(i => (
                  <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!selectedInstructorId ? (
        <>
          {/* Top Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Existing metric cards... */}
            <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary"><Activity className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assiduidade Geral</p>
                    <h3 className="text-3xl font-display font-bold text-foreground">{overallAvg}%</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-xl text-green-600"><Trophy className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Meta Configuradada</p>
                    <h3 className="text-3xl font-display font-bold text-foreground">{minAttendance}%</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600"><AlertTriangle className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Abaixo da Meta</p>
                    <h3 className="text-3xl font-display font-bold text-foreground">
                      {stats.filter(s => s.percentage < minAttendance).length}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600"><TrendingUp className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Reuniões</p>
                    <h3 className="text-3xl font-display font-bold text-foreground">{meetings?.length || 0}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* ... trend chart and ranking table ... */}

          {/* Trend Chart */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Tendência Mensal de Presença (%)</CardTitle>
                <CardDescription>Evolução da assiduidade ao longo dos meses.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [`${val}%`, 'Presença']}
                    />
                    <Line type="monotone" dataKey="presenca" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: "white" }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-sm flex flex-col">
              <CardHeader>
                <CardTitle>Atenção Necessária</CardTitle>
                <CardDescription>Instrutores abaixo da meta ({minAttendance}%).</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {stats.filter(s => s.percentage < minAttendance).length === 0 ? (
                    <div className="text-center py-8 opacity-70">
                      <Trophy className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">Todos acima da meta!</p>
                    </div>
                  ) : (
                    stats.filter(s => s.percentage < minAttendance).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{s.sectors}</p>
                        </div>
                        <Badge variant="destructive" className="font-bold text-xs rounded-md px-2 py-0.5">
                          {s.percentage}%
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ranking Global</CardTitle>
                <CardDescription>Clique no instrutor para ver o relatório individual.</CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold">Instrutor</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Setores</TableHead>
                    <TableHead className="text-center font-semibold">Taxa (%)</TableHead>
                    <TableHead className="text-center font-semibold">Presente</TableHead>
                    <TableHead className="text-center font-semibold">Ausente</TableHead>
                    <TableHead className="text-center font-semibold hidden sm:table-cell">Justificou</TableHead>
                    <TableHead className="text-center font-semibold">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map(row => {
                    const isBelow = row.percentage < minAttendance;
                    return (
                      <TableRow key={row.id} className="border-border/50 hover:bg-muted/20">
                        <TableCell className="font-medium text-foreground py-4">
                          <div className="flex items-center gap-2">
                            {isBelow && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                            {row.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden md:table-cell">{row.sectors || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isBelow ? "destructive" : "default"} className={`rounded-md font-bold ${!isBelow && 'bg-green-100 text-green-800'}`}>
                            {row.percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium text-green-600">{row.present}</TableCell>
                        <TableCell className="text-center font-medium text-red-600">{row.absent}</TableCell>
                        <TableCell className="text-center font-medium text-amber-600 hidden sm:table-cell">{row.justified}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedInstructorId(row.id)}>
                            Ver <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : selectedInstructorStats && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedInstructorId(null)}>
              Voltar para Visão Geral
            </Button>
            <h2 className="text-2xl font-bold">{selectedInstructorStats.instructor.name}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="rounded-2xl shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Resumo de Presença</CardTitle>
                <CardDescription>Distribuição total de status.</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedInstructorStats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {selectedInstructorStats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {selectedInstructorStats.pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs font-medium">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 rounded-2xl shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Histórico Recente</CardTitle>
                <CardDescription>Últimas participações em reuniões.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInstructorStats.history.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell>{format(new Date(h.date + 'T12:00:00'), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={
                            h.status === 'present' ? 'default' :
                            h.status === 'absent' ? 'destructive' :
                            'secondary'
                          }>
                            {h.status === 'present' ? 'Presente' :
                             h.status === 'absent' ? 'Ausente' :
                             h.status === 'justified' ? 'Justificou' : 'Não Obrigatório'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{h.observation || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
