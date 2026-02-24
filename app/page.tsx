import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Users, Coffee, Award, BadgeCheck, ArrowRight, Mail, CalendarDays, AlertCircle } from "lucide-react";
import { isRegistrationPostponed } from "@/lib/registration-schedule";

const POSTPONEMENT_MESSAGE =
  "Thank you for your interest in this event. Due to the weather circumstances, we are going to postpone this to a future date. As soon as we confirm the space for Brooklyn Borough Hall we will send out another invitation.";

export default function Home() {
  const postponed = isRegistrationPostponed();
  return (
    <div className="min-h-screen bg-[#faf8f0]">
      {/* Hero — NYC blue band */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#0066b3] via-[#0077c8] to-[#004d8c] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
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
          <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:leading-tight">
            Week Mixer: Borough Hall Bash
          </h1>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            <span className="inline-flex items-center gap-2 text-lg text-white/95 sm:text-xl">
              <Calendar className="h-5 w-5 shrink-0 text-white/90" aria-hidden />
              {postponed ? "Postponed — Date TBD" : "Thursday, February 26 — 2:00 PM to 4:00 PM"}
            </span>
            <span className="hidden sm:inline h-6 w-px bg-white/30" aria-hidden />
            <span className="inline-flex items-center gap-2 text-lg font-semibold text-white sm:text-xl">
              <MapPin className="h-5 w-5 shrink-0" aria-hidden />
              Brooklyn Borough Hall
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* About the event */}
        <section className="mb-12">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-[#1a365d] sm:text-2xl">
            <Users className="h-6 w-6 text-[#0066b3]" aria-hidden />
            Join us
          </h2>
          <p className="mt-3 leading-relaxed text-[#2d3748]">
            D79 Week Mixer invites you to the Week Mixer: Borough Hall Bash — a
            chance to connect with colleagues across programs and boroughs,
            celebrate our work, and enjoy refreshments and conversation at
            Brooklyn Borough Hall.
          </p>
          <ul className="mt-4 space-y-3 text-[#2d3748]">
            <li className="flex items-start gap-3">
              <Coffee className="mt-0.5 h-5 w-5 shrink-0 text-[#0066b3]" aria-hidden />
              <span>Networking and light refreshments</span>
            </li>
            <li className="flex items-start gap-3">
              <Award className="mt-0.5 h-5 w-5 shrink-0 text-[#0066b3]" aria-hidden />
              <span>Recognition of District 79 programs and staff</span>
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0066b3]" aria-hidden />
              <span>Please bring a valid ID to enter Borough Hall</span>
            </li>
          </ul>
        </section>

        {/* Postponement notice */}
        {postponed && (
          <section className="mb-12 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
              Event postponed
            </h2>
            <p className="mt-2 leading-relaxed text-amber-900">
              {POSTPONEMENT_MESSAGE}
            </p>
          </section>
        )}

        {/* Staff-only notice — light yellow card */}
        <section className="mb-12 rounded-2xl border border-[#e8dcc4] bg-[#fffbf0] p-6 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#744210]">
            <Mail className="h-5 w-5 shrink-0" aria-hidden />
            NYCPS District 79 staff only
          </h2>
          <p className="mt-2 leading-relaxed text-[#744210]/90">
            Registration is open to <strong>NYCPS District 79 staff only</strong>. You must
            use your <strong>@schools.nyc.gov</strong> email address to register.
            Registrations from other email domains cannot be accepted.
          </p>
        </section>

        {/* Event details card */}
        <section className="mb-12 rounded-2xl border border-[#e2e8e8] bg-white p-6 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1a365d]">
            <CalendarDays className="h-5 w-5 text-[#0066b3]" aria-hidden />
            Event details
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-1">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#0066b3]">
                <Calendar className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <dt className="text-sm font-medium text-[#0066b3]">Date & time</dt>
                <dd className="mt-0.5 text-[#1a365d]">
                {postponed ? "Postponed — Date TBD" : "Thursday, February 26 — 2:00 PM–4:00 PM"}
              </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#0066b3]">
                <MapPin className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <dt className="text-sm font-medium text-[#0066b3]">Location</dt>
                <dd className="mt-0.5 text-[#1a365d]">Brooklyn Borough Hall</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#0066b3]">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <dt className="text-sm font-medium text-[#0066b3]">Capacity</dt>
                <dd className="mt-0.5 text-[#1a365d]">Limited capacity</dd>
              </div>
            </div>
          </dl>
        </section>

        {/* CTAs */}
        <section className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
          {postponed ? (
            <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbd5e0] bg-[#f1f5f9] px-7 py-4 text-base font-medium text-[#64748b]">
              Registration closed — Event postponed
            </div>
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0066b3] px-7 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[#004d8c] focus:outline-none focus:ring-2 focus:ring-[#0066b3] focus:ring-offset-2 focus:ring-offset-[#faf8f0]"
            >
              Register for the event
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          )}
        </section>
      </main>

      <footer className="mt-16 border-t border-[#e8e4dc] bg-[#fffbf0]/50 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Image
            src="/images/d79-logo.png"
            alt="District 79"
            width={100}
            height={40}
            className="h-8 w-auto object-contain opacity-90"
          />
          <Image
            src="/images/nycpublicshools.png"
            alt="NYC Public Schools"
            width={120}
            height={40}
            className="h-8 w-auto object-contain opacity-90"
          />
          <span className="text-center text-sm text-[#4a5568]">
            NYC Public Schools District 79
          </span>
        </div>
      </footer>
    </div>
  );
}
