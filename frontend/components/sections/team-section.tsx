"use client";

import Image from "next/image";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/ui/section";
import { teamMembers, teamSection, type TeamMember } from "@/data/team";
import { cn } from "@/lib/utils";

function getInitials(name: string, index: number): string {
  const cleaned = name.trim();
  if (!cleaned || /^(nama )?anggota tim/i.test(cleaned)) {
    return `0${index + 1}`;
  }
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function TeamMemberCard({
  member,
  index,
}: {
  member: TeamMember;
  index: number;
}) {
  const [imageError, setImageError] = useState(false);

  const hasValidPhoto = Boolean(member.photo?.trim()) && !imageError;
  const initials = getInitials(member.name, index);
  const altText =
    member.alt?.trim() || `Potret ${member.name}, ${member.role} di LUMORA`;

  return (
    <article className="group flex h-full flex-col rounded-[22px] border border-line/65 bg-surface/90 p-3.5 transition-all duration-300 hover:border-forest/25 hover:bg-surface hover:shadow-[0_14px_34px_rgba(18,63,50,0.06)]">
      {/* 1. Foto Anggota (Rasio 4:5 konsisten, bebas layout shift) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[16px] bg-[#edeae0] ring-1 ring-forest/6">
        {hasValidPhoto ? (
          <Image
            src={member.photo}
            alt={altText}
            fill
            unoptimized
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, (min-width: 460px) 50vw, 100vw"
            style={{ objectPosition: member.objectPosition || "center top" }}
            onError={() => setImageError(true)}
            className="relative z-10 object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#f3f0e6] to-[#e7eadf] p-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-forest/12 bg-surface/80 transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]">
              <span className="font-display text-lg font-medium tracking-tight text-forest/75">
                {initials}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Jabatan / posisi dalam teks kecil */}
      <div className="flex flex-1 flex-col px-1 pt-3.5 pb-1">
        <p className="text-[11px] font-semibold tracking-[0.11em] text-accent uppercase">
          {member.role}
        </p>

        {/* 3. Nama lengkap sebagai elemen utama */}
        <h3 className="mt-1 font-display text-base font-semibold tracking-[-0.015em] text-forest sm:text-[1.0625rem]">
          {member.name}
        </h3>

        {/* 4. Deskripsi singkat mengenai kontribusi atau tanggung jawab */}
        <p className="mt-1.5 text-[13px] leading-[1.68] text-muted">
          {member.bio}
        </p>
      </div>
    </article>
  );
}

export function TeamSection({
  members = teamMembers,
}: {
  members?: TeamMember[];
}) {
  if (!members.length) {
    return null;
  }

  const count = members.length;

  return (
    <section
      id="tim-lumora"
      aria-labelledby="home-team-title"
      className="home-section border-t border-line/70"
    >
      <Container>
        <Reveal distance={16}>
          <div className="mx-auto max-w-2xl text-center">
            <p className="home-eyebrow text-accent">{teamSection.eyebrow}</p>
            <h2 id="home-team-title" className="home-heading mt-3.5">
              {teamSection.heading}
            </h2>
            <p className="home-copy mx-auto mt-4 max-w-xl">
              {teamSection.subtitle}
            </p>
          </div>
        </Reveal>

        <StaggerContainer
          stagger={0.06}
          className={cn(
            "mt-12 grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 sm:mt-14 sm:gap-5",
            count === 3 && "md:grid-cols-3 lg:grid-cols-3",
            count === 4 && "md:grid-cols-2 lg:grid-cols-4",
            count === 5 && "md:grid-cols-3 lg:grid-cols-5",
            count >= 6 && "md:grid-cols-3 lg:grid-cols-6",
            count < 3 && "md:grid-cols-2"
          )}
        >
          {members.map((member, index) => (
            <StaggerItem key={member.id} className="h-full">
              <TeamMemberCard member={member} index={index} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </section>
  );
}
