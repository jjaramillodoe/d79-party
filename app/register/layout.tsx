import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — District 79 Week Mixer",
  description:
    "Register for the District 79 Week Mixer: Borough Hall Bash at Brooklyn Borough Hall.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
