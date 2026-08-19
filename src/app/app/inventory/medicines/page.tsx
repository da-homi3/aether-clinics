import InventoryPage from "../page";
export default function Medicines() {
  return InventoryPage({ searchParams: Promise.resolve({ type: "medicine" }) });
}
