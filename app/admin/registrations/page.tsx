"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Trash2,
  Loader2,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { BOROS, DISTRICT_79_PROGRAMS } from "@/types/registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface RegistrationRow {
  _id: string;
  firstName: string;
  lastName: string;
  program: string;
  boro: string;
  title: string;
  email: string;
  status: string;
  createdAt: string;
}

interface CountRow {
  boro: string;
  confirmedCount: number;
  waitingListCount: number;
  maxConfirmed: number;
}

interface AdminData {
  registrations: RegistrationRow[];
  byBoro: Record<
    string,
    { confirmed: RegistrationRow[]; waiting_list: RegistrationRow[] }
  >;
  counts: CountRow[];
}

const DEFAULT_SECRET = "";

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function registrationsToCsv(rows: RegistrationRow[]): string {
  const header = [
    "First Name",
    "Last Name",
    "Program",
    "Borough",
    "Title",
    "Email",
    "Status",
    "Created At",
  ];
  const lines = [header.map(escapeCsvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.firstName,
        r.lastName,
        r.program,
        r.boro,
        r.title,
        r.email,
        r.status,
        r.createdAt,
      ].map(escapeCsvCell).join(",")
    );
  }
  return lines.join("\n");
}

const ADMIN_SECRET_KEY = "admin_secret";

export default function AdminRegistrationsPage() {
  const [secret, setSecret] = useState(DEFAULT_SECRET);
  const [submittedSecret, setSubmittedSecret] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_SECRET_KEY) : null
  );
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<boolean> => {
    const s = submittedSecret ?? secret;
    if (!s && process.env.NODE_ENV === "production") return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/registrations?secret=${encodeURIComponent(s)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        if (res.status === 401) setError("Invalid or missing secret.");
        else setError("Failed to load registrations.");
        return false;
      }
      const json = await res.json();
      setData(json);
      return true;
    } catch {
      setError("Failed to load registrations.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [submittedSecret, secret]);

  async function handleRefresh() {
    const ok = await fetchData();
    if (ok) toast.success("Data refreshed");
    else toast.error("Failed to refresh data");
  }

  useEffect(() => {
    if (submittedSecret !== null) fetchData();
  }, [submittedSecret, fetchData]);

  function handleSecretSubmit(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem(ADMIN_SECRET_KEY, secret);
    setSubmittedSecret(secret);
  }

  function handleExportCsv() {
    if (!data?.registrations?.length) return;
    const csv = registrationsToCsv(data.registrations);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `district79-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getAuthParams() {
    const s = submittedSecret ?? secret;
    return s ? `?secret=${encodeURIComponent(s)}` : "";
  }

  async function handleDelete(r: RegistrationRow) {
    if (!confirm(`Delete registration for ${r.firstName} ${r.lastName}?`)) return;
    const res = await fetch(`/api/admin/registrations/${r._id}${getAuthParams()}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("Failed to delete. " + ((await res.json()).error ?? ""));
      return;
    }
    fetchData();
  }

  const [editing, setEditing] = useState<RegistrationRow | null>(null);

  async function handleSaveEdit(updates: Partial<RegistrationRow>) {
    if (!editing) return;
    const res = await fetch(`/api/admin/registrations/${editing._id}${getAuthParams()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const json = await res.json();
      alert("Failed to update. " + (json.error ?? ""));
      return;
    }
    setEditing(null);
    fetchData();
  }

  const [editingCapacity, setEditingCapacity] = useState<string | null>(null);
  const [capacityValue, setCapacityValue] = useState<string>("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleStatus(r: RegistrationRow) {
    const newStatus = r.status === "confirmed" ? "waiting_list" : "confirmed";
    setTogglingId(r._id);
    try {
      const res = await fetch(`/api/admin/registrations/${r._id}${getAuthParams()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const json = await res.json();
        alert("Failed to update. " + (json.error ?? ""));
        return;
      }
      fetchData();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSaveCapacity(boro: string) {
    const val = parseInt(capacityValue, 10);
    if (isNaN(val) || val < 0) {
      alert("Please enter a valid number (0 or greater).");
      return;
    }
    const res = await fetch(`/api/admin/capacity${getAuthParams()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boro, maxCapacity: val }),
    });
    if (!res.ok) {
      const json = await res.json();
      alert("Failed to update capacity. " + (json.error ?? ""));
      return;
    }
    setEditingCapacity(null);
    fetchData();
  }

  if (submittedSecret === null) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the admin secret to view registrations.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecretSubmit} className="space-y-4">
                <div>
                  <Label
                    htmlFor="admin-secret"
                    className="mb-1.5 block"
                  >
                    Secret
                  </Label>
                  <Input
                    id="admin-secret"
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Admin secret"
                    className="w-full"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  View registrations
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6 lg:max-w-[1400px]">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-7xl lg:max-w-[1400px]">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setSubmittedSecret(null)}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const counts = data?.counts ?? [];
  const registrations = data?.registrations ?? [];

  const totalRegistrations = registrations.length;
  const totalConfirmed = counts.reduce((s, c) => s + c.confirmedCount, 0);
  const totalWaiting = counts.reduce((s, c) => s + c.waitingListCount, 0);
  const totalCapacity = counts.reduce((s, c) => s + c.maxConfirmed, 0);
  const spotsRemaining = totalCapacity - totalConfirmed;

  const topBoro = counts.length
    ? counts.reduce((a, b) =>
        a.confirmedCount + a.waitingListCount >=
        b.confirmedCount + b.waitingListCount
          ? a
          : b
      )
    : null;

  const programCounts = registrations.reduce(
    (acc, r) => {
      acc[r.program] = (acc[r.program] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topProgram = Object.entries(programCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6 lg:max-w-[1400px]">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/15 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Total</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-primary">
                {totalRegistrations}
              </p>
              <p className="text-xs text-muted-foreground">registrations</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-600 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-green-500/15 p-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Confirmed</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {totalConfirmed}
              </p>
              <p className="text-xs text-muted-foreground">spots filled</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-600 bg-amber-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-500/15 p-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Waiting list</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {totalWaiting}
              </p>
              <p className="text-xs text-muted-foreground">registrations</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-600 bg-blue-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-500/15 p-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Spots left</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {spotsRemaining}
              </p>
              <p className="text-xs text-muted-foreground">of {totalCapacity} total</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-600 bg-violet-500/5 col-span-2 sm:col-span-1">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-violet-500/15 p-2">
                  <MapPin className="h-4 w-4 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Most by borough</span>
              </div>
              <p className="mt-2 font-semibold text-violet-700">
                {topBoro ? topBoro.boro : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {topBoro
                  ? `${topBoro.confirmedCount + topBoro.waitingListCount} registrations`
                  : "No data"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-600 bg-indigo-500/5 col-span-2 sm:col-span-1">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-500/15 p-2">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Most by program</span>
              </div>
              <p className="mt-2 font-semibold text-indigo-700 line-clamp-2">
                {topProgram ? topProgram[0] : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {topProgram ? `${topProgram[1]} registrations` : "No data"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            Registrations by borough
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Refreshing…
                </>
              ) : (
                "Refresh"
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleExportCsv}
              disabled={!data?.registrations?.length}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="mt-6">
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-full">
              <TableHeader>
              <TableRow>
                <TableHead>Borough</TableHead>
                <TableHead className="text-right">Confirmed</TableHead>
                <TableHead className="text-right">Waiting list</TableHead>
                <TableHead className="text-right">Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counts.map((c) => (
                <TableRow key={c.boro}>
                  <TableCell className="font-medium">{c.boro}</TableCell>
                  <TableCell className="text-right">
                    {c.confirmedCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.waitingListCount}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {editingCapacity === c.boro ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min={c.confirmedCount}
                          value={capacityValue}
                          onChange={(e) => setCapacityValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCapacity(c.boro);
                            if (e.key === "Escape") {
                              setEditingCapacity(null);
                            }
                          }}
                          onBlur={() => handleSaveCapacity(c.boro)}
                          autoFocus
                          className="w-16 rounded border border-input px-2 py-1 text-right text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCapacity(c.boro);
                          setCapacityValue(String(c.maxConfirmed));
                        }}
                        className="rounded px-2 py-1 hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
                        title="Click to edit capacity"
                      >
                        {c.maxConfirmed}
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </CardContent>
        </Card>

        {BOROS.map((boro) => {
          const group = data?.byBoro?.[boro];
          if (!group) return null;
          const confirmed = group.confirmed ?? [];
          const waiting = group.waiting_list ?? [];
          if (confirmed.length === 0 && waiting.length === 0) return null;
          return (
            <Card key={boro} className="mt-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{boro}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto pt-0">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Name</TableHead>
                      <TableHead className="min-w-[180px]">Program</TableHead>
                      <TableHead className="min-w-[100px]">Title</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[110px]">Status</TableHead>
                      <TableHead className="min-w-[140px]">Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...confirmed, ...waiting].map((r) => (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">
                          {r.firstName} {r.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.program}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.email}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(r)}
                            disabled={togglingId === r._id}
                            title={
                              r.status === "confirmed"
                                ? "Click to move to waiting list"
                                : "Click to confirm"
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 ${
                              r.status === "confirmed"
                                ? "bg-[#dcfce7] text-[#166534] hover:bg-[#bbf7d0]"
                                : "bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]"
                            }`}
                          >
                            {togglingId === r._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            {r.status === "confirmed"
                              ? "Confirmed"
                              : "Waiting list"}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleString()
                            : ""}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary/90"
                              onClick={() => setEditing(r)}
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(r)}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/register"
            className="font-medium text-primary underline hover:no-underline"
          >
            Back to registration
          </Link>
        </p>
      </div>

      {editing && (
        <EditRegistrationDialog
          registration={editing}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

function EditRegistrationDialog({
  registration,
  onClose,
  onSave,
}: {
  registration: RegistrationRow;
  onClose: () => void;
  onSave: (updates: Partial<RegistrationRow>) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...registration });
  const [saving, setSaving] = useState(false);

  const programs: string[] = [...DISTRICT_79_PROGRAMS];
  if (!programs.includes(registration.program)) {
    programs.unshift(registration.program);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        firstName: form.firstName,
        lastName: form.lastName,
        program: form.program,
        boro: form.boro,
        title: form.title,
        email: form.email,
        status: form.status,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit registration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-first">First name</Label>
              <Input
                id="edit-first"
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-last">Last name</Label>
              <Input
                id="edit-last"
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Program</Label>
            <Select
              value={form.program}
              onValueChange={(v) => setForm((f) => ({ ...f, program: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Borough</Label>
            <Select
              value={form.boro}
              onValueChange={(v) => setForm((f) => ({ ...f, boro: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOROS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  status: v as "confirmed" | "waiting_list",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="waiting_list">Waiting list</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
