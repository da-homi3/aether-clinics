import { PageHeader } from "@/components/ui";
import { PerformanceTable } from "../page";

export default function PerformancePage() {
  return (
    <div>
      <PageHeader title="Clinic performance" />
      <PerformanceTable />
    </div>
  );
}
