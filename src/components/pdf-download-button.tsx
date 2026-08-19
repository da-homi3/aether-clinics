"use client";

import { jsPDF } from "jspdf";
import { Button } from "./ui";

type LineItem = { label: string; amount: string };

export function PdfDownloadButton({
  title,
  subtitle,
  lines,
  footer,
  fileName,
  className,
}: Readonly<{
  title: string;
  subtitle?: string;
  lines: LineItem[];
  footer?: string;
  fileName: string;
  className?: string;
}>) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={className ?? "mt-4 no-print"}
      onClick={() => {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Aether Clinics", 14, 18);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(title, 14, 28);
        if (subtitle) doc.text(subtitle, 14, 36);
        let y = subtitle ? 48 : 40;
        lines.forEach((line) => {
          doc.text(line.label, 14, y);
          doc.text(line.amount, 140, y, { align: "right" });
          y += 8;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        if (footer) {
          y += 8;
          doc.setFontSize(10);
          doc.text(footer, 14, y);
        }
        doc.save(fileName);
      }}
    >
      Download PDF
    </Button>
  );
}
