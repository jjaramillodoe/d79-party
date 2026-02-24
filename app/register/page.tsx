"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegistrationFormData } from "@/lib/validation";
import { BOROS, DISTRICT_79_PROGRAMS } from "@/types/registration";
import type { RegistrationStatus } from "@/types/registration";

const inputClasses =
  "mt-1 block w-full rounded-xl border border-[#cbd5e0] bg-white px-4 py-3 text-[#1a365d] shadow-sm transition placeholder:text-[#718096] focus:border-[#0066b3] focus:outline-none focus:ring-2 focus:ring-[#0066b3]/20";
const labelClasses = "block text-sm font-medium text-[#1a365d]";

const WAITING_LIST_MESSAGE = "Thank you for your interest! The capacity for your selected borough has been reached. You have been added to the waiting list. You will receive a waiting list email shortly.";

const POSTPONEMENT_MESSAGE =
  "Thank you for your interest in this event. Due to the weather circumstances, we are going to postpone this to a future date. As soon as we confirm the space for Brooklyn Borough Hall we will send out another invitation.";

interface RegistrationStatusResponse {
  open: boolean;
  opensAt: string | null;
  postponed?: boolean;
}

function RegistrationCountdown({
  opensAt,
  onDone,
}: {
  opensAt: string;
  onDone: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const target = new Date(opensAt).getTime();

  useEffect(() => {
    if (target <= now) {
      onDone();
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target, now, onDone]);

  if (target <= now) {
    return (
      <div className="mb-6 rounded-xl border border-[#84cc16] bg-[#dcfce7] px-4 py-3 text-sm text-[#166534]">
        Registration is now open. Enabling form…
      </div>
    );
  }

  const diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const units = [
    { value: days, label: "days" },
    { value: hours, label: "hours" },
    { value: minutes, label: "min" },
    { value: seconds, label: "sec" },
  ];

  return (
    <div className="mb-6 rounded-xl border border-[#0066b3] bg-[#eff6ff] px-4 py-5 text-center">
      <p className="mb-4 text-sm font-medium text-[#1a365d]">
        Registration opens in
      </p>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {units.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="min-w-[3rem] rounded-lg bg-white px-3 py-2 text-xl font-bold tabular-nums text-[#0066b3] shadow-sm">
              {String(value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-xs font-medium text-[#64748b]">
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#64748b]">
        {new Date(opensAt).toLocaleDateString("en-US", {
          dateStyle: "long",
          timeZone: "America/New_York",
        })}{" "}
        at{" "}
        {new Date(opensAt).toLocaleTimeString("en-US", {
          timeStyle: "short",
          timeZone: "America/New_York",
        })}{" "}
        ET
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const [submitStatus, setSubmitStatus] = useState<RegistrationStatus | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleStatus, setScheduleStatus] =
    useState<RegistrationStatusResponse | null>(null);

  useEffect(() => {
    fetch("/api/register/status")
      .then((res) => res.json())
      .then((data: RegistrationStatusResponse) => setScheduleStatus(data))
      .catch(() => setScheduleStatus({ open: true, opensAt: null }));
  }, []);

  const refreshScheduleStatus = useCallback(() => {
    fetch("/api/register/status")
      .then((res) => res.json())
      .then((data: RegistrationStatusResponse) => setScheduleStatus(data));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      program: "",
      boro: "",
      title: "",
      email: "",
    },
  });

  async function onSubmit(data: RegistrationFormData) {
    setSubmitError(null);
    setSubmitStatus(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Registration failed. Please try again.");
        return;
      }
      setSubmitStatus(json.status);
    } catch {
      setSubmitError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitStatus) {
    return (
      <div className="min-h-screen bg-[#faf8f0]">
        <header className="relative overflow-hidden bg-gradient-to-br from-[#0066b3] via-[#0077c8] to-[#004d8c] text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
          <div className="relative mx-auto max-w-2xl px-4 py-10 text-center sm:px-6 sm:py-12">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              <Image
                src="/images/d79-logo.png"
                alt="District 79"
                width={120}
                height={48}
                className="h-12 w-auto object-contain sm:h-14"
              />
              <div className="h-8 w-px shrink-0 bg-white/30" aria-hidden />
              <Image
                src="/images/nycpublicshools.png"
                alt="NYC Public Schools"
                width={140}
                height={48}
                className="h-12 w-auto object-contain sm:h-14"
              />
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
              Registration received
            </h1>
            <p className="mt-2 text-white/90">
              {submitStatus === "confirmed" ? "You’re confirmed for Borough Hall Bash." : "You’re on the waiting list."}
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
          <div
            className={`rounded-2xl p-6 shadow-md sm:p-8 ${
              submitStatus === "confirmed"
                ? "border border-[#fcd34d] bg-gradient-to-b from-[#fefce8] to-[#fef9c3]"
                : "border border-[#fcd34d] bg-gradient-to-b from-[#fffbeb] to-[#fef3c7]"
            }`}
            role="alert"
          >
            <div className="flex gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  submitStatus === "confirmed"
                    ? "bg-[#ca8a04] text-white"
                    : "bg-[#f59e0b] text-white"
                }`}
              >
                {submitStatus === "confirmed" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                )}
              </div>
              <div className="flex-1 space-y-4">
                {submitStatus === "confirmed" ? (
                  <>
                    <h2 className="text-lg font-semibold text-[#713f12]">
                      Thank you for registering!
                    </h2>
                    <div className="space-y-3 text-[#78350f]">
                      <p className="leading-relaxed">
                        Please note that this is an initial sign-up and does not yet confirm your seat. To ensure equitable attendance across the district, selected participants will be notified via email by February 23rd.
                      </p>
                      <p className="leading-relaxed">
                        We appreciate your patience and understanding.
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#fcd34d] bg-amber-50/80 px-4 py-3">
                      <p className="text-sm font-medium text-[#78350f]">
                        📧 Watch for an email by February 23rd
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-[#92400e]">
                      You&apos;re on the waiting list
                    </h2>
                    <p className="leading-relaxed text-[#b45309]">
                      {WAITING_LIST_MESSAGE}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-center text-sm text-[#4a5568]">
            <Link
              href="/register"
              className="font-medium text-[#0066b3] underline hover:no-underline"
            >
              Submit another registration
            </Link>
            <Link
              href="/"
              className="font-medium text-[#0066b3] underline hover:no-underline"
            >
              Back to event
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f0]">
      {/* Hero — same blue band + logos as homepage */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#0066b3] via-[#0077c8] to-[#004d8c] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="relative mx-auto max-w-2xl px-4 py-10 text-center sm:px-6 sm:py-12">
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
            Register for Borough Hall Bash
          </h1>
          <p className="mt-4 text-lg text-white/95">
            Thursday, February 26 — 2:00 PM to 4:00 PM · Brooklyn Borough Hall
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

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="rounded-2xl border border-[#e2e8e8] bg-white p-6 shadow-md sm:p-8">
          {scheduleStatus?.postponed ? (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center"
              role="alert"
            >
              <h2 className="text-lg font-semibold text-amber-800">
                Event postponed
              </h2>
              <p className="mt-3 leading-relaxed text-amber-900">
                {POSTPONEMENT_MESSAGE}
              </p>
              <p className="mt-6">
                <Link
                  href="/"
                  className="font-medium text-[#0066b3] underline hover:no-underline"
                >
                  ← Back to event
                </Link>
              </p>
            </div>
          ) : (
            <>
          {scheduleStatus && !scheduleStatus.open && scheduleStatus.opensAt && (
            <RegistrationCountdown
              opensAt={scheduleStatus.opensAt}
              onDone={refreshScheduleStatus}
            />
          )}
          <p className="leading-relaxed text-[#2d3748]">
            We are pleased to invite you to the District 79 Week Mixer: Borough
            Hall Bash. The event takes place on Thursday, Feb 26 from 2 PM to 4
            PM at Brooklyn Borough Hall. Please bring a valid ID to enter
            Borough Hall.
          </p>
          <p className="mt-4 rounded-xl border border-[#e8dcc4] bg-[#fffbf0] px-4 py-3 text-sm text-[#744210]">
            <strong>Staff only.</strong> You must register with your
            @schools.nyc.gov email address.
          </p>

          {scheduleStatus && !scheduleStatus.open ? (
            <p className="mt-6 text-center text-sm text-[#4a5568]">
              The registration form will appear here when the countdown reaches zero.
            </p>
          ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-6"
            noValidate
          >
            {submitError && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                role="alert"
              >
                {submitError}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClasses}>
                  First Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className={inputClasses}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className={labelClasses}>
                  Last Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className={inputClasses}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="program" className={labelClasses}>
                Program <span className="text-red-600">*</span>
              </label>
              <select
                id="program"
                className={inputClasses}
                {...register("program")}
              >
                <option value="">Select program</option>
                {[...DISTRICT_79_PROGRAMS].sort((a: string, b: string) => a.localeCompare(b)).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.program && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.program.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="boro" className={labelClasses}>
                Borough <span className="text-red-600">*</span>
              </label>
              <select
                id="boro"
                className={inputClasses}
                {...register("boro")}
              >
                <option value="">Select borough</option>
                {BOROS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {errors.boro && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.boro.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="title" className={labelClasses}>
                Title <span className="text-red-600">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={inputClasses}
                {...register("title")}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={labelClasses}>
                Email <span className="text-red-600">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[#718096]">
                Use your @schools.nyc.gov address (staff only).
              </p>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={inputClasses}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#0066b3] px-5 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#004d8c] focus:outline-none focus:ring-2 focus:ring-[#0066b3] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting…" : "Submit registration"}
              </button>
              <p className="text-center text-sm text-[#4a5568]">
                <Link
                  href="/"
                  className="font-medium text-[#0066b3] underline hover:no-underline"
                >
                  ← Back to event
                </Link>
              </p>
            </div>
          </form>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
