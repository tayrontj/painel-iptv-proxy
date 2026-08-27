import { useState } from "react";
import { KeyRound, MonitorSmartphone, MoreHorizontal, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { PanelAlertDialog, PanelConfirmDialog, PanelFormDialog } from "@/components/PanelActionDialog";
import { trpc } from "@/lib/trpc";
import { CustomerDevicesDialog } from "@/components/CustomerDevicesDialog";

type CustomerActionsProps = {
  customer: { id: number; label: string; email: string | null; phone: string | null; status: "active" | "attention" | "expired"; screenLimit: number; usedScreens: number };
  onChangeStatus: () => void;
};

export function CustomerActions({ customer, onChangeStatus }: CustomerActionsProps) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [confirmRotation, setConfirmRotation] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const updateProfile = trpc.customers.updateProfile.useMutation({ onSuccess: async () => { setEditing(false); await utils.customers.list.invalidate(); toast.success("Perfil atualizado."); }, onError: error => toast.error(error.message) });
  const rotate = trpc.customers.rotateXtreamPassword.useMutation({ onSuccess: async result => { setConfirmRotation(false); setNewPassword(result.password); await utils.customers.list.invalidate(); }, onError: error => toast.error(error.message) });

  return <><div className="flex items-center justify-end gap-1"><button type="button" onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-white" title="Editar cliente"><PencilLine className="h-4 w-4" /></button><button type="button" onClick={() => setDevicesOpen(true)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-[#9df6df]" title="Gerenciar telas ativas"><MonitorSmartphone className="h-4 w-4" /></button><button type="button" onClick={() => setConfirmRotation(true)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-[#9df6df]" title="Gerar nova senha Xtream"><KeyRound className="h-4 w-4" /></button><button type="button" onClick={onChangeStatus} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-white" title="Alterar estado da assinatura"><MoreHorizontal className="h-4 w-4" /></button></div><CustomerDevicesDialog open={devicesOpen} onOpenChange={setDevicesOpen} customer={customer} /><PanelFormDialog key={`${customer.id}-${editing ? "edit" : "closed"}`} open={editing} onOpenChange={setEditing} title={`Editar ${customer.label}`} description="Atualize os dados de perfil do cliente. A senha Xtream é gerenciada em uma ação separada." fields={[{ name: "label", label: "Nome completo", defaultValue: customer.label, wide: true }, { name: "email", label: "E-mail", type: "email", defaultValue: customer.email ?? "" }, { name: "phone", label: "Telefone", defaultValue: customer.phone ?? "" }]} submitLabel="Salvar perfil" submitting={updateProfile.isPending} onSubmit={values => updateProfile.mutate({ id: customer.id, label: values.label.trim(), email: values.email.trim() || null, phone: values.phone.trim() || null })} /><PanelConfirmDialog open={confirmRotation} onOpenChange={setConfirmRotation} title="Gerar nova senha Xtream" description={`A senha atual de ${customer.label} deixará de funcionar imediatamente em todos os acessos do aplicativo e Xtream.`} confirmLabel="Gerar nova senha" submitting={rotate.isPending} onConfirm={() => rotate.mutate({ id: customer.id })} /><PanelAlertDialog open={Boolean(newPassword)} onOpenChange={open => { if (!open) setNewPassword(null); }} title="Nova senha Xtream" description="Copie e entregue esta senha ao cliente agora. Ela não será exibida novamente no painel." secret={newPassword} onCopy={async () => { if (newPassword) { await navigator.clipboard.writeText(newPassword); toast.success("Senha Xtream copiada."); } }} /></>;
}
