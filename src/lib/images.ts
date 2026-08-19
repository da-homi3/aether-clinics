/** Curated Unsplash healthcare imagery for Aether Clinics. */

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const images = {
  heroConsultation: u("photo-1638202993928-7267aad84c31", 2000),
  doctorTeam: u("photo-1579684385127-1ef15d508118", 1600),
  clinicInterior: u("photo-1519494026892-80bbd2d6fd0d", 1400),
  receptionist: u("photo-1576091160399-112ba8d25d1d", 1200),
  doctorPatient: u("photo-1666214280557-f1b5022eb634", 1400),
  pharmacy: u("photo-1587854692152-cbe660dbde88", 1200),
  medicalEquipment: u("photo-1530497610245-94d3c16cda28", 1200),
  laboratory: u("photo-1579154204601-01588f351e67", 1200),
  billingDesk: u("photo-1454165804606-c3d57bc86b40", 1200),
  physiotherapy: u("photo-1576091160550-2173dba999ef", 1200),
  nurseCare: u("photo-1559839734-2b71ea197ec2", 1200),
  modernHospital: u("photo-1571772996211-2f02c9727629", 1400),
  stethoscope: u("photo-1505751172876-fa1923c5c528", 1000),
  medicineCloseup: u("photo-1471864190281-a93a3070b6de", 1000),
  emptyAppointments: u("photo-1516549655169-df83a0774514", 800),
  emptyPatients: u("photo-1576091160550-2173dba999ef", 800),
  emptyNotifications: u("photo-1576091160399-112ba8d25d1d", 800),
} as const;

export type ImageKey = keyof typeof images;

export const clinicGallery = [
  images.clinicInterior,
  images.modernHospital,
  images.doctorPatient,
] as const;

export const featureVisuals = [
  {
    title: "Multi-clinic",
    body: "Switch between all branches or a single location without leaking data.",
    src: images.modernHospital,
    alt: "Modern multi-branch clinic building",
  },
  {
    title: "Clinical + financial",
    body: "Patients, sessions, invoices, installments and inventory stay in sync.",
    src: images.doctorPatient,
    alt: "Doctor reviewing patient care with technology",
  },
  {
    title: "Role-aware",
    body: "Reception, doctors, pharmacy and finance each get the right command center.",
    src: images.receptionist,
    alt: "Healthcare receptionist at front desk",
  },
] as const;

export const moduleVisuals = [
  {
    label: "Appointments",
    src: images.receptionist,
    alt: "Scheduling and patient check-in",
  },
  {
    label: "Consultations",
    src: images.doctorPatient,
    alt: "Clinical consultation room",
  },
  {
    label: "Billing & M-Pesa-ready payments",
    src: images.billingDesk,
    alt: "Finance and payment operations desk",
  },
  {
    label: "Inventory & expiry",
    src: images.pharmacy,
    alt: "Pharmacy shelves and medicine inventory",
  },
] as const;
