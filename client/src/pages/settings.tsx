import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const [minAttendance, setMinAttendance] = useState("80");

  useEffect(() => {
    if (settings) {
      setMinAttendance(settings.minimumAttendance.toString());
    }
  }, [settings]);

  const handleSave = () => {
    const val = parseInt(minAttendance, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      updateMutation.mutate({ minimumAttendance: val });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <PageHeader 
        title="Configurações do Sistema" 
        description="Gerencie as regras globais e preferências."
      />

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Regras de Presença</CardTitle>
              <CardDescription>Defina as metas esperadas de assiduidade.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3 max-w-xs">
            <Label htmlFor="minAtt" className="text-sm font-medium">
              Meta Mínima de Presença (%)
            </Label>
            <div className="relative">
              <Input 
                id="minAtt" 
                type="number"
                min="0"
                max="100"
                value={minAttendance} 
                onChange={(e) => setMinAttendance(e.target.value)} 
                className="h-12 rounded-xl text-lg pl-4 pr-10 border-2 focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Instrutores com presença abaixo deste valor serão destacados nos relatórios com alertas de baixo engajamento.
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending || settings?.minimumAttendance.toString() === minAttendance}
            className="rounded-xl h-11 px-8 shadow-md"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
