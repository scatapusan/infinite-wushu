import Dashboard from "@/components/Dashboard";
import { DEMO_MODULES } from "@/lib/demo-data";

export default function DemoPage() {
  return (
    <Dashboard
      modules={DEMO_MODULES}
      userEmail=""
      basePath="/demo/learn"
      isDemo
    />
  );
}
