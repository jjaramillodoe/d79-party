"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
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

function AdminHero() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#0066b3] via-[#0077c8] to-[#004d8c] text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
      <div className="relative mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-12">
        <Link href="/" className="inline-block">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            <Image
              src="/images/d79-logo.png"
              alt="District 79"
              width={140}
              height={56}
              className="h-14 w-auto object-contain sm:h-16"
              priority
            />
            <div className="h-10 w-px shrink-0 bg-white/30 sm:h-12" aria-hidden />
            <Image
              src="/images/nycpublicshools.png"
              alt="NYC Public Schools"
              width={180}
              height={56}
              className="h-14 w-auto object-contain sm:h-16"
              priority
            />
          </div>
        </Link>
        <h1 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Admin: Registrations
        </h1>
        <p className="mt-2 text-white/90">
          Borough Hall Bash — view and export registrations
        </p>
        <p className="mt-2">
          <Link
            href="/"
            className="text-sm font-medium text-white/80 underline hover:text-white"
          >
            ← Back to event
          </Link>
        </p>
      </div>
    </header>
  );
}

export default function AdminRegistrationsPage() {
  const [secret, setSecret] = useState(DEFAULT_SECRET);
  const [submittedSecret, setSubmittedSecret] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const s = submittedSecret ?? secret;
    if (!s && process.env.NODE_ENV === "production") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/registrations?secret=${encodeURIComponent(s)}`
      );
      if (!res.ok) {
        if (res.status === 401) setError("Invalid or missing secret.");
        else setError("Failed to load registrations.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  }, [submittedSecret, secret]);

  useEffect(() => {
    if (submittedSecret !== null) fetchData();
  }, [submittedSecret, fetchData]);

  function handleSecretSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <div className="min-h-screen bg-[#faf8f0]">
        <AdminHero />
        <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <p className="text-sm text-[#64748b]">
                Enter the admin secret to view registrations.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecretSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-secret"
                    className="mb-1.5 block text-sm font-medium text-[#1a365d]"
                  >
                    Secret
                  </label>
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
      <div className="min-h-screen bg-[#faf8f0]">
        <AdminHero />
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-[#64748b] sm:px-6 lg:max-w-[1400px]">
          Loading…
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#faf8f0]">
        <AdminHero />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:max-w-[1400px]">
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

  return (
    <div className="min-h-screen bg-[#faf8f0]">
      <AdminHero />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[#1a365d]">
            Registrations by borough
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              Refresh
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
                  <TableCell className="text-right text-[#64748b]">
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
                          className="w-16 rounded border border-[#e2e8e8] px-2 py-1 text-right text-sm focus:border-[#0066b3] focus:outline-none focus:ring-1 focus:ring-[#0066b3]"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCapacity(c.boro);
                          setCapacityValue(String(c.maxConfirmed));
                        }}
                        className="rounded px-2 py-1 hover:bg-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#0066b3]"
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
                        <TableCell className="text-[#475569]">
                          {r.program}
                        </TableCell>
                        <TableCell className="text-[#475569]">
                          {r.title}
                        </TableCell>
                        <TableCell className="text-[#475569]">
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
                        <TableCell className="text-[#64748b]">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleString()
                            : ""}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#0066b3] hover:text-[#004d8c]"
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

        <p className="mt-8 text-center text-sm text-[#64748b]">
          <Link
            href="/register"
            className="font-medium text-[#0066b3] underline hover:no-underline"
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-[#1a365d]">
          Edit registration
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1a365d]">
                First name
              </label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1a365d]">
                Last name
              </label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1a365d]">
              Program
            </label>
            <select
              value={form.program}
              onChange={(e) =>
                setForm((f) => ({ ...f, program: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-[#e2e8e8] bg-white px-4 py-2 text-sm text-[#1a365d] focus:border-[#0066b3] focus:outline-none focus:ring-2 focus:ring-[#0066b3]/20"
            >
              {programs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1a365d]">
              Borough
            </label>
            <select
              value={form.boro}
              onChange={(e) =>
                setForm((f) => ({ ...f, boro: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-[#e2e8e8] bg-white px-4 py-2 text-sm text-[#1a365d] focus:border-[#0066b3] focus:outline-none focus:ring-2 focus:ring-[#0066b3]/20"
            >
              {BOROS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1a365d]">
              Title
            </label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1a365d]">
              Email
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1a365d]">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as "confirmed" | "waiting_list",
                }))
              }
              className="mt-1 block w-full rounded-xl border border-[#e2e8e8] bg-white px-4 py-2 text-sm text-[#1a365d] focus:border-[#0066b3] focus:outline-none focus:ring-2 focus:ring-[#0066b3]/20"
            >
              <option value="confirmed">Confirmed</option>
              <option value="waiting_list">Waiting list</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
