import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminTags = () => {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: async () => {
      const { data } = await supabase.from("tags").select("name, description").order("name");
      return data || [];
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("tags").insert({ name: name.trim().toLowerCase(), description });
    if (error) return toast.error("Erreur (tag déjà existant ?)");
    toast.success("Tag créé");
    setName(""); setDescription("");
    qc.invalidateQueries({ queryKey: ["admin", "tags"] });
    qc.invalidateQueries({ queryKey: ["tags"] });
  };

  const remove = async (n: string) => {
    if (!confirm(`Supprimer le tag "${n}" ?`)) return;
    const { error } = await supabase.from("tags").delete().eq("name", n);
    if (error) return toast.error("Erreur");
    toast.success("Tag supprimé");
    qc.invalidateQueries({ queryKey: ["admin", "tags"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-mono text-2xl font-bold text-foreground">Tags</h1>

        <form onSubmit={create} className="rounded-md border border-border bg-card p-4 space-y-3">
          <h2 className="font-mono text-sm font-bold uppercase text-muted-foreground">Nouveau tag</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="nom (ex: react)" className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm focus:border-primary focus:outline-none" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte" className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm focus:border-primary focus:outline-none" />
          <button type="submit" className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Créer
          </button>
        </form>

        {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : (
          <div className="rounded-md border border-border bg-card divide-y divide-border">
            {tags.map((t: any) => (
              <div key={t.name} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-sm text-primary">{t.name}</span>
                  {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
                </div>
                <button onClick={() => remove(t.name)} className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {tags.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Aucun tag.</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTags;
