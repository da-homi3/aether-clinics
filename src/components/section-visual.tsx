import Image from "next/image";
import { cn } from "@/lib/cn";
import { images, type ImageKey } from "@/lib/images";

export function SectionBanner({
  image,
  title,
  subtitle,
  className,
  height = "md",
}: Readonly<{
  image: ImageKey;
  title: string;
  subtitle?: string;
  className?: string;
  height?: "sm" | "md" | "lg";
}>) {
  const h = height === "sm" ? "h-28" : height === "lg" ? "h-48" : "h-36";
  return (
    <div className={cn("relative mb-6 overflow-hidden rounded-2xl border", h, className)}>
      <Image
        src={images[image]}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 900px"
        className="object-cover"
        priority={false}
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/15" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
        <p className="text-lg font-semibold tracking-tight">{title}</p>
        {subtitle ? <p className="mt-1 max-w-xl text-sm text-white/80">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function SoftPhotoCard({
  src,
  alt,
  title,
  body,
  className,
}: Readonly<{
  src: string;
  alt: string;
  title: string;
  body?: string;
  className?: string;
}>) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-surface shadow-card", className)}>
      <div className="relative h-40 w-full">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
      </div>
      <div className="p-5">
        <h3 className="font-semibold">{title}</h3>
        {body ? <p className="mt-2 text-sm text-muted">{body}</p> : null}
      </div>
    </div>
  );
}

export function ClinicPhoto({
  src,
  alt,
  name,
  address,
  phone,
}: Readonly<{
  src: string;
  alt: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}>) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-surface shadow-card">
      <div className="relative h-36 w-full">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
      </div>
      <div className="p-5">
        <h3 className="font-semibold">{name}</h3>
        {address ? <p className="mt-1 text-sm text-muted">{address}</p> : null}
        {phone ? <p className="mt-2 text-sm">{phone}</p> : null}
      </div>
    </div>
  );
}
