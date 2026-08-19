import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, ROLE_DEFAULTS } from "../src/lib/rbac";

const prisma = new PrismaClient();

function d(days: number, hours = 9) {
  const x = new Date();
  x.setDate(x.getDate() + days);
  x.setHours(hours, 0, 0, 0);
  return x;
}

function demoBarcode(slug: string, n: number) {
  return `890${slug.length}${n}${String((n * 17 + slug.length) % 1000).padStart(3, "0")}`;
}

function invoicePaidAmount(index: number, total: number) {
  if (index % 4 === 0) return 0;
  if (index % 3 === 0) return Math.floor(total / 2);
  return total;
}

function invoiceStatus(paid: number, total: number) {
  if (paid === 0) return "overdue";
  if (paid < total) return "partially_paid";
  return "paid";
}

function installmentStatus(number: number, paid: number) {
  if (number !== 1) return "pending";
  if (paid > 0) return "paid";
  return "overdue";
}

function medicineExpiry(type: string, n: number) {
  if (type !== "medicine") return null;
  return d(n % 5 === 0 ? 12 : 200);
}

async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.paymentPlan.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.vital.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.treatmentSession.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.appointmentStatusHistory.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patientNote.deleteMany();
  await prisma.document.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.stockTransferItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.staffSchedule.deleteMany();
  await prisma.loginActivity.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.service.deleteMany();
  await prisma.department.deleteMany();
  await prisma.clinicSetting.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.platformSetting.deleteMany();
}

async function seedRoles() {
  await prisma.platformSetting.create({
    data: { id: "platform", name: "Aether Clinics" },
  });
  const perms = await Promise.all(PERMISSIONS.map((key) => prisma.permission.create({ data: { key } })));
  const permMap = Object.fromEntries(perms.map((p) => [p.key, p.id]));
  const roles: Record<string, string> = {};
  for (const [name, keys] of Object.entries(ROLE_DEFAULTS)) {
    const role = await prisma.role.create({
      data: {
        name,
        isSystem: true,
        description: name,
        permissions: { create: keys.map((k) => ({ permissionId: permMap[k] })) },
      },
    });
    roles[name] = role.id;
  }
  return roles;
}

async function seedClinics() {
  return Promise.all(
    [
      {
        slug: "westlands",
        name: "Aether Westlands",
        address: "Waiyaki Way, Westlands, Nairobi",
        phone: "+254711000101",
        email: "westlands@aetherclinics.ke",
        operatingHours: "Mon–Sat 07:30–19:00",
      },
      {
        slug: "karen",
        name: "Aether Karen",
        address: "Ngong Road, Karen, Nairobi",
        phone: "+254711000102",
        email: "karen@aetherclinics.ke",
        operatingHours: "Mon–Sat 08:00–18:00",
      },
      {
        slug: "mombasa",
        name: "Aether Nyali",
        address: "Links Road, Nyali, Mombasa",
        phone: "+254711000103",
        email: "nyali@aetherclinics.ke",
        operatingHours: "Mon–Fri 08:00–17:30",
      },
    ].map((c) => prisma.clinic.create({ data: c })),
  );
}

async function seedStaff(roles: Record<string, string>, clinics: { id: string }[], hash: string) {
  await prisma.user.create({
    data: {
      staffId: "STF-0001",
      email: "owner@aetherclinics.ke",
      passwordHash: hash,
      name: "Amina Otieno",
      phone: "+254700111001",
      isOwner: true,
      roleId: roles["Super Admin"],
    },
  });

  const staffSpecs = [
    { name: "David Mwangi", email: "manager.westlands@aetherclinics.ke", role: "Clinic Manager", clinic: 0, dept: "Operations" },
    { name: "Grace Wanjiku", email: "manager.karen@aetherclinics.ke", role: "Clinic Manager", clinic: 1, dept: "Operations" },
    { name: "Dr. Brian Kiptoo", email: "doctor.westlands@aetherclinics.ke", role: "Doctor", clinic: 0, dept: "General Practice" },
    { name: "Dr. Laila Hassan", email: "doctor.karen@aetherclinics.ke", role: "Doctor", clinic: 1, dept: "Physiotherapy" },
    { name: "Dr. Samuel Odhiambo", email: "doctor.nyali@aetherclinics.ke", role: "Doctor", clinic: 2, dept: "Dental" },
    { name: "Mercy Achieng", email: "reception.westlands@aetherclinics.ke", role: "Receptionist", clinic: 0, dept: "Front Desk" },
    { name: "Peter Njoroge", email: "reception.karen@aetherclinics.ke", role: "Receptionist", clinic: 1, dept: "Front Desk" },
    { name: "Fatma Ali", email: "pharmacy.westlands@aetherclinics.ke", role: "Pharmacist", clinic: 0, dept: "Pharmacy" },
    { name: "Joyce Mutua", email: "finance@aetherclinics.ke", role: "Accountant", clinic: 0, dept: "Finance" },
    { name: "Kevin Cheruiyot", email: "reception.nyali@aetherclinics.ke", role: "Receptionist", clinic: 2, dept: "Front Desk" },
  ];

  const staff = [];
  for (let i = 0; i < staffSpecs.length; i++) {
    const s = staffSpecs[i];
    staff.push(
      await prisma.user.create({
        data: {
          staffId: `STF-${String(i + 2).padStart(4, "0")}`,
          email: s.email,
          passwordHash: hash,
          name: s.name,
          department: s.dept,
          roleId: roles[s.role],
          clinicId: clinics[s.clinic].id,
        },
      }),
    );
  }
  return staff.filter((_, i) => staffSpecs[i].role === "Doctor");
}

async function seedServices(clinics: { id: string; name: string }[]) {
  for (const clinic of clinics) {
    for (const name of ["General Practice", "Physiotherapy", "Dental", "Laboratory", "Pharmacy"]) {
      await prisma.department.create({ data: { clinicId: clinic.id, name } });
    }
  }
  const serviceTemplates = [
    { name: "General Consultation", category: "consultation", price: 200000, duration: 30, sessions: 1 },
    { name: "Follow-up Visit", category: "consultation", price: 120000, duration: 20, sessions: 1 },
    { name: "Physiotherapy Package", category: "physiotherapy", price: 2000000, duration: 45, sessions: 10 },
    { name: "Dental Cleaning", category: "dental", price: 450000, duration: 40, sessions: 1 },
    { name: "Laboratory Panel", category: "laboratory", price: 350000, duration: 15, sessions: 1 },
  ];
  const services = [];
  for (const clinic of clinics) {
    for (const s of serviceTemplates) {
      services.push(
        await prisma.service.create({
          data: {
            clinicId: clinic.id,
            name: s.name,
            category: s.category,
            priceCents: s.price,
            durationMin: s.duration,
            sessions: s.sessions,
            description: `${s.name} at ${clinic.name}`,
          },
        }),
      );
    }
  }
  return services;
}

async function seedPatients(clinics: { id: string }[]) {
  const firstNames = ["John", "Mary", "James", "Faith", "Daniel", "Naomi", "Paul", "Esther", "Joseph", "Lucy", "Kevin", "Aisha", "Brian", "Wanjiru", "Samuel", "Halima", "Peter", "Ann", "Eric", "Mercy"];
  const lastNames = ["Kamau", "Otieno", "Wanjiku", "Omondi", "Kariuki", "Hassan", "Mutiso", "Cheruiyot", "Achieng", "Njoroge"];
  const patients = [];
  for (let i = 0; i < 54; i++) {
    patients.push(
      await prisma.patient.create({
        data: {
          patientNumber: `PT-${String(i + 1).padStart(5, "0")}`,
          fullName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
          phone: `+2547${String(10000000 + i).slice(0, 8)}`,
          email: `patient${i + 1}@mail.demo`,
          gender: i % 2 ? "female" : "male",
          dateOfBirth: new Date(1980 + (i % 30), i % 12, (i % 27) + 1),
          address: "Nairobi, Kenya",
          allergies: i % 7 === 0 ? "Penicillin" : null,
          medicalHistory: i % 5 === 0 ? "Hypertension" : null,
          clinicId: clinics[i % 3].id,
        },
      }),
    );
  }
  return patients;
}

async function seedAppointments(
  clinics: { id: string }[],
  patients: { id: string }[],
  doctors: { id: string }[],
  services: { id: string; clinicId: string }[],
) {
  const statuses = ["pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"];
  for (let i = 0; i < 120; i++) {
    const clinic = clinics[i % 3];
    const startAt = d((i % 14) - 4, 8 + (i % 8));
    const service = services.find((s) => s.clinicId === clinic.id)!;
    await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: patients[i % patients.length].id,
        doctorId: doctors[i % doctors.length].id,
        serviceId: service.id,
        type: "consultation",
        startAt,
        endAt: new Date(startAt.getTime() + 30 * 60000),
        durationMin: 30,
        status: statuses[i % statuses.length],
      },
    });
  }
}

async function seedInventory(clinics: { id: string; slug: string }[]) {
  const productDefs = [
    { name: "Paracetamol 500mg", cat: "medicine", type: "medicine", buy: 200, sell: 500, min: 50 },
    { name: "Amoxicillin 250mg", cat: "medicine", type: "medicine", buy: 800, sell: 1500, min: 30 },
    { name: "Ibuprofen 400mg", cat: "medicine", type: "medicine", buy: 300, sell: 700, min: 40 },
    { name: "ORS Sachets", cat: "medicine", type: "medicine", buy: 150, sell: 400, min: 80 },
    { name: "Vitamin D3", cat: "medicine", type: "medicine", buy: 600, sell: 1200, min: 20 },
    { name: "Surgical Gloves", cat: "consumable", type: "consumable", buy: 50, sell: 150, min: 200 },
    { name: "Face Masks", cat: "consumable", type: "consumable", buy: 20, sell: 50, min: 300 },
    { name: "Digital Thermometer", cat: "equipment", type: "equipment", buy: 80000, sell: 120000, min: 5 },
    { name: "BP Monitor", cat: "equipment", type: "equipment", buy: 450000, sell: 650000, min: 2 },
    { name: "Pulse Oximeter", cat: "equipment", type: "equipment", buy: 150000, sell: 220000, min: 4 },
    { name: "Gauze Pack", cat: "consumable", type: "consumable", buy: 100, sell: 250, min: 100 },
    { name: "Antiseptic Solution", cat: "medicine", type: "medicine", buy: 250, sell: 600, min: 25 },
    { name: "Insulin Syringes", cat: "consumable", type: "consumable", buy: 80, sell: 200, min: 60 },
    { name: "Cough Syrup", cat: "medicine", type: "medicine", buy: 400, sell: 900, min: 25 },
    { name: "Multivitamin", cat: "medicine", type: "medicine", buy: 350, sell: 800, min: 30 },
    { name: "Wheelchair", cat: "clinic_equipment", type: "equipment", buy: 1800000, sell: 2500000, min: 1 },
    { name: "Nebulizer Kit", cat: "equipment", type: "equipment", buy: 350000, sell: 490000, min: 3 },
    { name: "Saline 500ml", cat: "medicine", type: "medicine", buy: 180, sell: 450, min: 40 },
  ];

  for (const clinic of clinics) {
    let n = 1;
    for (const p of productDefs) {
      const product = await prisma.product.create({
        data: {
          clinicId: clinic.id,
          sku: `${clinic.slug.slice(0, 3).toUpperCase()}-${String(n).padStart(3, "0")}`,
          barcode: demoBarcode(clinic.slug, n),
          name: p.name,
          category: p.cat,
          type: p.type,
          purchaseCents: p.buy,
          sellingCents: p.sell,
          minQty: p.min,
          reorderLevel: p.min + 10,
          location: "Main store",
        },
      });
      const qty = p.min + (n % 5 === 0 ? 5 : 80);
      await prisma.inventoryBatch.create({
        data: {
          clinicId: clinic.id,
          productId: product.id,
          batchNumber: `B${n}2026`,
          quantity: qty,
          expiryDate: medicineExpiry(p.type, n),
        },
      });
      n++;
    }
  }
}

async function seedSuppliersAndInvoices(
  clinics: { id: string }[],
  patients: { id: string; clinicId: string }[],
  services: { id: string; clinicId: string; name: string; priceCents: number }[],
) {
  for (const clinic of clinics) {
    await prisma.supplier.create({
      data: {
        clinicId: clinic.id,
        name: "MediSupply East Africa",
        contactPerson: "Hannah Kimani",
        phone: "+254722334455",
        email: "orders@medisupply.ke",
        address: "Industrial Area, Nairobi",
      },
    });
    await prisma.supplier.create({
      data: {
        clinicId: clinic.id,
        name: "Coast Pharma Distributors",
        contactPerson: "Omar Juma",
        phone: "+254733221100",
        email: "sales@coastpharma.ke",
      },
    });
  }

  for (let i = 0; i < 36; i++) {
    const patient = patients[i];
    const clinicId = patient.clinicId;
    const svc = services.find((s) => s.clinicId === clinicId)!;
    const total = svc.priceCents;
    const paid = invoicePaidAmount(i, total);
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(i + 1).padStart(5, "0")}`,
        clinicId,
        patientId: patient.id,
        status: invoiceStatus(paid, total),
        subtotalCents: total,
        totalCents: total,
        paidCents: paid,
        dueDate: d(i % 4 === 0 ? -3 : 10),
        items: { create: { serviceId: svc.id, description: svc.name, quantity: 1, unitCents: total, totalCents: total } },
      },
    });
    if (paid > 0) {
      await prisma.payment.create({
        data: {
          clinicId,
          patientId: patient.id,
          invoiceId: invoice.id,
          amountCents: paid,
          method: ["mpesa", "cash", "card", "bank"][i % 4],
          staffName: "Mercy Achieng",
          status: "completed",
          createdAt: d(-i % 20),
        },
      });
    }
    if (i < 6) {
      await prisma.paymentPlan.create({
        data: {
          invoiceId: invoice.id,
          installmentsCount: 3,
          installments: {
            create: [1, 2, 3].map((n) => ({
              number: n,
              amountCents: Math.floor(total / 3),
              dueDate: d(n * 14 - 20),
              status: installmentStatus(n, paid),
              paidAt: n === 1 && paid > 0 ? new Date() : null,
            })),
          },
        },
      });
    }
  }
}

async function seedPlansSalesAndOps(
  clinics: { id: string; slug: string }[],
  patients: { id: string; fullName: string }[],
  services: { id: string; clinicId: string; name: string; priceCents: number }[],
) {
  const westPhysio = services.find((s) => s.name.includes("Physiotherapy") && s.clinicId === clinics[0].id)!;
  const john = patients.find((p) => p.fullName.startsWith("John Kamau")) || patients[0];
  await prisma.treatmentPlan.create({
    data: {
      clinicId: clinics[0].id,
      patientId: john.id,
      serviceId: westPhysio.id,
      name: "Physiotherapy",
      totalSessions: 10,
      priceCents: westPhysio.priceCents,
      sessions: {
        create: Array.from({ length: 10 }, (_, i) => ({
          sessionNumber: i + 1,
          status: i === 0 ? "completed" : "pending",
          completedAt: i === 0 ? new Date() : null,
        })),
      },
    },
  });

  const products = await prisma.product.findMany({ take: 20 });
  for (let i = 0; i < 18; i++) {
    const p = products[i % products.length];
    await prisma.sale.create({
      data: {
        receiptNumber: `RCT-${String(i + 1).padStart(5, "0")}`,
        clinicId: p.clinicId,
        patientId: patients[i].id,
        staffName: "Fatma Ali",
        subtotalCents: p.sellingCents * 2,
        totalCents: p.sellingCents * 2,
        method: "cash",
        items: { create: { productId: p.id, quantity: 2, unitCents: p.sellingCents, totalCents: p.sellingCents * 2 } },
      },
    });
  }

  for (const clinic of clinics) {
    await prisma.expense.create({
      data: { clinicId: clinic.id, category: "utilities", description: "Electricity", amountCents: 8500000 },
    });
    await prisma.equipment.create({
      data: {
        clinicId: clinic.id,
        name: "Ultrasound Unit",
        assetNumber: `EQ-${clinic.slug}-001`,
        serialNumber: `US-${clinic.slug}-9921`,
        purchaseCents: 125000000,
        status: "active",
        department: "Imaging",
        condition: "Good",
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      { type: "low_stock", title: "Low stock", body: "Paracetamol is below minimum at Westlands.", relatedUrl: "/app/inventory/low-stock", clinicId: clinics[0].id },
      { type: "invoice_overdue", title: "Payment overdue", body: "An invoice is past due. Review outstanding balances.", relatedUrl: "/app/billing/outstanding", clinicId: clinics[0].id },
      { type: "appointment_new", title: "New appointment", body: "A new appointment was booked for today.", relatedUrl: "/app/appointments" },
    ],
  });
}

async function main() {
  await resetDatabase();
  const roles = await seedRoles();
  const clinics = await seedClinics();
  const hash = await bcrypt.hash("Demo1234!", 10);
  const doctors = await seedStaff(roles, clinics, hash);
  const services = await seedServices(clinics);
  const patients = await seedPatients(clinics);
  await seedAppointments(clinics, patients, doctors, services);
  await seedInventory(clinics);
  await seedSuppliersAndInvoices(clinics, patients, services);
  await seedPlansSalesAndOps(clinics, patients, services);
  console.log("Seed complete.");
  console.log("Login: owner@aetherclinics.ke / Demo1234!");
  console.log("John Kamau patient + 10-session physio plan seeded at Westlands.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
