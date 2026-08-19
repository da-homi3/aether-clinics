"use server";

import { prisma } from "@/lib/db";
import { createSession, destroySession, getSessionUser, hashPassword, requirePermission, requireUser, verifyPassword } from "@/lib/auth";
import { audit, notify } from "@/lib/audit";
import { CLINIC_COOKIE } from "@/lib/scope";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "active") {
    return { error: "Invalid email or password." };
  }
  const ok = await verifyPassword(password, user.passwordHash);
  await prisma.loginActivity.create({
    data: { userId: user.id, success: ok, userAgent: (await headers()).get("user-agent") || undefined },
  });
  if (!ok) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 } } });
    return { error: "Invalid email or password." };
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lastLoginAt: new Date() } });
  if (user.totpEnabled) {
    return { requires2fa: true, userId: user.id };
  }
  await createSession(user.id);
  await audit({ userId: user.id, clinicId: user.clinicId, action: "login", entity: "user", entityId: user.id });
  redirect("/app");
}

export async function logoutAction() {
  const user = await getSessionUser();
  if (user) await audit({ userId: user.id, action: "logout", entity: "user", entityId: user.id });
  await destroySession();
  redirect("/login");
}

export async function setClinicAction(clinicId: string) {
  const user = await requireUser();
  if (!user.isOwner && user.clinicId && clinicId !== user.clinicId && clinicId !== "all") {
    return;
  }
  const jar = await cookies();
  jar.set(CLINIC_COOKIE, clinicId, { path: "/", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/app");
}

export async function createPatientAction(formData: FormData) {
  const user = await requirePermission("patients.create");
  const clinicId = String(formData.get("clinicId") || user.clinicId || "");
  if (!clinicId) return; // "Select a clinic." };
  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!fullName || !phone) return; // "Name and phone are required." };
  const count = await prisma.patient.count();
  const patientNumber = `PT-${String(count + 1).padStart(5, "0")}`;
  const dob = formData.get("dateOfBirth") ? new Date(String(formData.get("dateOfBirth"))) : null;
  const patient = await prisma.patient.create({
    data: {
      patientNumber,
      fullName,
      phone,
      email: String(formData.get("email") || "") || null,
      dateOfBirth: dob,
      gender: String(formData.get("gender") || "") || null,
      address: String(formData.get("address") || "") || null,
      emergencyName: String(formData.get("emergencyName") || "") || null,
      emergencyPhone: String(formData.get("emergencyPhone") || "") || null,
      insuranceInfo: String(formData.get("insuranceInfo") || "") || null,
      allergies: String(formData.get("allergies") || "") || null,
      medicalHistory: String(formData.get("medicalHistory") || "") || null,
      notes: String(formData.get("notes") || "") || null,
      clinicId,
    },
  });
  await audit({ userId: user.id, clinicId, action: "patient.create", entity: "patient", entityId: patient.id });
  revalidatePath("/app/patients");
  redirect(`/app/patients/${patient.id}`);
}

export async function createAppointmentAction(formData: FormData) {
  const user = await requirePermission("appointments.create");
  const clinicId = String(formData.get("clinicId") || user.clinicId || "");
  const patientId = String(formData.get("patientId") || "");
  const doctorId = String(formData.get("doctorId") || "") || null;
  const serviceId = String(formData.get("serviceId") || "") || null;
  const start = new Date(String(formData.get("startAt")));
  const durationMin = Number(formData.get("durationMin") || 30);
  if (!clinicId || !patientId || Number.isNaN(start.getTime())) return; // "Complete required appointment fields." };
  const endAt = new Date(start.getTime() + durationMin * 60000);
  if (doctorId) {
    const clash = await prisma.appointment.findFirst({
      where: {
        doctorId,
        archived: false,
        status: { notIn: ["cancelled", "no_show"] },
        startAt: { lt: endAt },
        endAt: { gt: start },
      },
    });
    if (clash) return; // "This practitioner already has an appointment at this time." };
  }
  const appt = await prisma.appointment.create({
    data: {
      clinicId,
      patientId,
      doctorId,
      serviceId,
      department: String(formData.get("department") || "") || null,
      type: String(formData.get("type") || "consultation"),
      startAt: start,
      endAt,
      durationMin,
      notes: String(formData.get("notes") || "") || null,
      status: "pending",
    },
  });
  await prisma.appointmentStatusHistory.create({ data: { appointmentId: appt.id, status: "pending" } });
  await audit({ userId: user.id, clinicId, action: "appointment.create", entity: "appointment", entityId: appt.id });
  await notify({
    clinicId,
    type: "appointment_new",
    title: "New appointment",
    body: "A new appointment was booked.",
    relatedUrl: "/app/appointments",
  });
  revalidatePath("/app/appointments");
  redirect("/app/appointments");
}

export async function updateAppointmentStatusAction(id: string, status: string) {
  const user = await requirePermission("appointments.edit");
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return; // "Appointment not found." };
  await prisma.appointment.update({ where: { id }, data: { status } });
  await prisma.appointmentStatusHistory.create({ data: { appointmentId: id, status } });
  await audit({ userId: user.id, clinicId: appt.clinicId, action: "appointment.status", entity: "appointment", entityId: id, meta: { status } });
  revalidatePath("/app/appointments");
}

export async function rescheduleAppointmentAction(formData: FormData) {
  const user = await requirePermission("appointments.edit");
  const id = String(formData.get("id"));
  const start = new Date(String(formData.get("startAt")));
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return; // "Not found" };
  const endAt = new Date(start.getTime() + appt.durationMin * 60000);
  if (appt.doctorId) {
    const clash = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId: appt.doctorId,
        archived: false,
        status: { notIn: ["cancelled", "no_show"] },
        startAt: { lt: endAt },
        endAt: { gt: start },
      },
    });
    if (clash) return; // "This practitioner already has an appointment at this time." };
  }
  await prisma.appointment.update({ where: { id }, data: { startAt: start, endAt, status: "rescheduled" } });
  await prisma.appointmentStatusHistory.create({ data: { appointmentId: id, status: "rescheduled" } });
  await audit({ userId: user.id, clinicId: appt.clinicId, action: "appointment.reschedule", entity: "appointment", entityId: id });
  revalidatePath("/app/appointments");
}

export async function createConsultationAction(formData: FormData) {
  const user = await requirePermission("consultations.create");
  const patientId = String(formData.get("patientId"));
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  const clinicId = String(formData.get("clinicId") || user.clinicId || patient?.clinicId || "");
  const appointmentId = String(formData.get("appointmentId") || "") || null;
  if (!clinicId) return; // "Clinic is required." };
  const c = await prisma.consultation.create({
    data: {
      clinicId,
      patientId,
      doctorId: user.id,
      appointmentId,
      chiefComplaint: String(formData.get("chiefComplaint") || "") || null,
      symptoms: String(formData.get("symptoms") || "") || null,
      history: String(formData.get("history") || "") || null,
      allergies: String(formData.get("allergies") || "") || null,
      examination: String(formData.get("examination") || "") || null,
      diagnosis: String(formData.get("diagnosis") || "") || null,
      treatment: String(formData.get("treatment") || "") || null,
      clinicalNotes: String(formData.get("clinicalNotes") || "") || null,
      followUp: String(formData.get("followUp") || "") || null,
      nextAppointment: String(formData.get("nextAppointment") || "") || null,
      status: String(formData.get("status") || "in_progress"),
    },
  });
  const w = Number(formData.get("weightKg") || 0);
  const h = Number(formData.get("heightCm") || 0);
  const bmi = w && h ? Number((w / (h / 100) ** 2).toFixed(1)) : null;
  if (formData.get("pulse") || w || h) {
    await prisma.vital.create({
      data: {
        patientId,
        consultationId: c.id,
        systolic: formData.get("systolic") ? Number(formData.get("systolic")) : null,
        diastolic: formData.get("diastolic") ? Number(formData.get("diastolic")) : null,
        pulse: formData.get("pulse") ? Number(formData.get("pulse")) : null,
        temperatureC: formData.get("temperatureC") ? Number(formData.get("temperatureC")) : null,
        weightKg: w || null,
        heightCm: h || null,
        spo2: formData.get("spo2") ? Number(formData.get("spo2")) : null,
        respiratoryRate: formData.get("respiratoryRate") ? Number(formData.get("respiratoryRate")) : null,
        bmi,
      },
    });
  }
  if (appointmentId) {
    await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "in_consultation" } });
  }
  await audit({ userId: user.id, clinicId, action: "consultation.create", entity: "consultation", entityId: c.id });
  revalidatePath("/app/clinical/consultations");
  redirect(`/app/clinical/consultations/${c.id}`);
}

export async function completeConsultationAction(id: string) {
  const user = await requirePermission("consultations.create");
  const c = await prisma.consultation.update({ where: { id }, data: { status: "completed" } });
  if (c.appointmentId) {
    await prisma.appointment.update({ where: { id: c.appointmentId }, data: { status: "completed" } });
  }
  await audit({ userId: user.id, clinicId: c.clinicId, action: "consultation.complete", entity: "consultation", entityId: id });
  revalidatePath("/app/clinical/consultations");
}

export async function createPrescriptionAction(formData: FormData) {
  const user = await requirePermission("consultations.create");
  const clinicId = String(formData.get("clinicId") || user.clinicId || "");
  const rx = await prisma.prescription.create({
    data: {
      clinicId,
      patientId: String(formData.get("patientId")),
      doctorId: user.id,
      consultationId: String(formData.get("consultationId") || "") || null,
      notes: String(formData.get("notes") || "") || null,
      items: {
        create: [
          {
            medicineName: String(formData.get("medicineName") || ""),
            productId: String(formData.get("productId") || "") || null,
            dosage: String(formData.get("dosage") || ""),
            frequency: String(formData.get("frequency") || ""),
            duration: String(formData.get("duration") || ""),
            quantity: Number(formData.get("quantity") || 1),
            instructions: String(formData.get("instructions") || "") || null,
          },
        ],
      },
    },
  });
  await audit({ userId: user.id, clinicId, action: "prescription.create", entity: "prescription", entityId: rx.id });
  revalidatePath("/app/clinical/prescriptions");
  redirect("/app/clinical/prescriptions");
}

export async function createTreatmentPlanAction(formData: FormData) {
  const user = await requirePermission("billing.create");
  const clinicId = String(formData.get("clinicId") || user.clinicId || "");
  const serviceId = String(formData.get("serviceId"));
  const patientId = String(formData.get("patientId"));
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return; // "Service not found." };
  const sessions = Number(formData.get("sessions") || service.sessions);
  const plan = await prisma.treatmentPlan.create({
    data: {
      clinicId,
      patientId,
      serviceId,
      name: service.name,
      totalSessions: sessions,
      priceCents: service.priceCents,
      sessions: {
        create: Array.from({ length: sessions }, (_, i) => ({
          sessionNumber: i + 1,
          status: "pending",
        })),
      },
    },
  });
  const invCount = await prisma.invoice.count();
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${String(invCount + 1).padStart(5, "0")}`,
      clinicId,
      patientId,
      status: "pending",
      subtotalCents: service.priceCents,
      totalCents: service.priceCents,
      dueDate: new Date(Date.now() + 14 * 86400000),
      items: {
        create: {
          serviceId,
          description: `${service.name} (${sessions} sessions)`,
          quantity: 1,
          unitCents: service.priceCents,
          totalCents: service.priceCents,
        },
      },
    },
  });
  await prisma.treatmentPlan.update({ where: { id: plan.id }, data: { invoiceId: invoice.id } });
  await audit({ userId: user.id, clinicId, action: "treatment.create", entity: "treatment_plan", entityId: plan.id });
  revalidatePath("/app/clinical/treatments");
  redirect(`/app/billing/invoices/${invoice.id}`);
}

export async function completeSessionAction(sessionId: string) {
  const user = await requireUser();
  const s = await prisma.treatmentSession.update({
    where: { id: sessionId },
    data: { status: "completed", completedAt: new Date() },
    include: { plan: true },
  });
  await audit({ userId: user.id, clinicId: s.plan.clinicId, action: "session.complete", entity: "session", entityId: sessionId });
  revalidatePath("/app/clinical/sessions");
}

export async function createInvoiceAction(formData: FormData) {
  const user = await requirePermission("billing.create");
  const clinicId = String(formData.get("clinicId") || user.clinicId || "");
  const patientId = String(formData.get("patientId"));
  const serviceId = String(formData.get("serviceId") || "") || null;
  const service = serviceId ? await prisma.service.findUnique({ where: { id: serviceId } }) : null;
  const amount = service ? service.priceCents : Math.round(Number(formData.get("amount") || 0) * 100);
  if (amount <= 0) return; // "Invoice total must be positive." };
  const count = await prisma.invoice.count();
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${String(count + 1).padStart(5, "0")}`,
      clinicId,
      patientId,
      status: "pending",
      subtotalCents: amount,
      totalCents: amount,
      dueDate: new Date(Date.now() + 14 * 86400000),
      items: {
        create: {
          serviceId,
          description: service?.name || String(formData.get("description") || "Service"),
          quantity: 1,
          unitCents: amount,
          totalCents: amount,
        },
      },
    },
  });
  await audit({ userId: user.id, clinicId, action: "invoice.create", entity: "invoice", entityId: invoice.id });
  revalidatePath("/app/billing");
  redirect(`/app/billing/invoices/${invoice.id}`);
}

export async function splitInstallmentsAction(formData: FormData) {
  const user = await requirePermission("billing.create");
  const invoiceId = String(formData.get("invoiceId"));
  const count = Number(formData.get("count") || 3);
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return; // "Invoice not found." };
  if (count < 2) return; // "Need at least 2 installments." };
  const share = Math.floor(invoice.totalCents / count);
  const remainder = invoice.totalCents - share * count;
  const existing = await prisma.paymentPlan.findUnique({ where: { invoiceId } });
  if (existing) return; // "Payment plan already exists." };
  await prisma.paymentPlan.create({
    data: {
      invoiceId,
      installmentsCount: count,
      installments: {
        create: Array.from({ length: count }, (_, i) => ({
          number: i + 1,
          amountCents: share + (i === 0 ? remainder : 0),
          dueDate: new Date(Date.now() + (i + 1) * 14 * 86400000),
          status: "pending",
        })),
      },
    },
  });
  await audit({ userId: user.id, clinicId: invoice.clinicId, action: "installments.create", entity: "invoice", entityId: invoiceId });
  revalidatePath(`/app/billing/invoices/${invoiceId}`);
}

export async function collectPaymentAction(formData: FormData) {
  const user = await requirePermission("payments.create");
  const invoiceId = String(formData.get("invoiceId"));
  const amount = Math.round(Number(formData.get("amount") || 0) * 100);
  const method = String(formData.get("method") || "cash");
  if (amount <= 0) return; // "Payment amount must be positive." };
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { paymentPlan: { include: { installments: true } } } });
  if (!invoice) return; // "Invoice not found." };
  const remaining = invoice.totalCents - invoice.paidCents;
  if (amount > remaining) return; // "Payment exceeds outstanding balance." };
  const payment = await prisma.payment.create({
    data: {
      clinicId: invoice.clinicId,
      patientId: invoice.patientId,
      invoiceId,
      amountCents: amount,
      method,
      reference: String(formData.get("reference") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      staffName: user.name,
      status: method === "mpesa" ? "pending_confirmation" : "completed",
    },
  });
  if (method === "mpesa") {
    // Integration point: STK push + webhook confirmation. Do not mark paid from the client alone.
    await notify({
      clinicId: invoice.clinicId,
      type: "mpesa_pending",
      title: "M-Pesa request queued",
      body: "Awaiting provider confirmation before updating the invoice.",
      relatedUrl: `/app/billing/invoices/${invoiceId}`,
    });
    return;
  }
  const paidCents = invoice.paidCents + amount;
  const status = paidCents >= invoice.totalCents ? "paid" : "partially_paid";
  await prisma.invoice.update({ where: { id: invoiceId }, data: { paidCents, status } });
  if (invoice.paymentPlan) {
    const next = invoice.paymentPlan.installments.find((i) => i.status === "pending");
    if (next) {
      await prisma.installment.update({
        where: { id: next.id },
        data: { status: "paid", paidAt: new Date(), method, reference: payment.reference },
      });
    }
  }
  await audit({ userId: user.id, clinicId: invoice.clinicId, action: "payment.create", entity: "payment", entityId: payment.id });
  await notify({
    clinicId: invoice.clinicId,
    type: "payment_received",
    title: "Payment received",
    body: `Payment recorded for invoice ${invoice.invoiceNumber}.`,
    relatedUrl: `/app/billing/invoices/${invoiceId}`,
  });
  revalidatePath(`/app/billing/invoices/${invoiceId}`);
  revalidatePath("/app");
}

export async function confirmMpesaWebhook(paymentId: string, providerRef: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || !payment.invoiceId) return;
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "completed", providerRef },
  });
  const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
  if (!invoice) return;
  const paidCents = invoice.paidCents + payment.amountCents;
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { paidCents, status: paidCents >= invoice.totalCents ? "paid" : "partially_paid" },
  });
}

export async function posSaleAction(formData: FormData) {
  const user = await requirePermission("inventory.sell");
  const clinicId = String(formData.get("clinicId") || user.clinicId || "");
  const productId = String(formData.get("productId"));
  const qty = Number(formData.get("quantity") || 1);
  const patientId = String(formData.get("patientId") || "") || null;
  const method = String(formData.get("method") || "cash");
  const discount = Math.round(Number(formData.get("discount") || 0) * 100);
  if (qty <= 0) return; // "Quantity must be positive." };
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { batches: { orderBy: { expiryDate: "asc" } } } });
  if (!product) return; // "Product not found." };
  const now = new Date();
  const available = product.batches.filter((b) => !b.expiryDate || b.expiryDate > now);
  const stock = available.reduce((s, b) => s + b.quantity, 0);
  if (stock < qty) return; // `Only ${stock} units are currently available.` };
  let remaining = qty;
  for (const batch of available) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    await prisma.inventoryBatch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - take } });
    remaining -= take;
  }
  const prev = stock;
  await prisma.inventoryMovement.create({
    data: {
      clinicId,
      productId,
      type: "sale",
      quantity: qty,
      previousQty: prev,
      newQty: prev - qty,
      staffName: user.name,
      reason: "POS sale",
    },
  });
  const subtotal = product.sellingCents * qty;
  const total = Math.max(0, subtotal - discount);
  const count = await prisma.sale.count();
  const sale = await prisma.sale.create({
    data: {
      receiptNumber: `RCT-${String(count + 1).padStart(5, "0")}`,
      clinicId,
      patientId,
      staffName: user.name,
      subtotalCents: subtotal,
      discountCents: discount,
      totalCents: total,
      method,
      items: { create: { productId, quantity: qty, unitCents: product.sellingCents, totalCents: subtotal } },
    },
  });
  await prisma.payment.create({
    data: {
      clinicId,
      patientId,
      saleId: sale.id,
      amountCents: total,
      method,
      staffName: user.name,
      status: "completed",
    },
  });
  await audit({ userId: user.id, clinicId, action: "sale.create", entity: "sale", entityId: sale.id });
  revalidatePath("/app/pos");
  redirect(`/app/pos/receipts/${sale.id}`);
}

export async function adjustStockAction(formData: FormData) {
  const user = await requirePermission("inventory.edit");
  const productId = String(formData.get("productId"));
  const qty = Number(formData.get("quantity"));
  const type = String(formData.get("type") || "adjustment");
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { batches: true } });
  if (!product) return; // "Product not found." };
  const prev = product.batches.reduce((s, b) => s + b.quantity, 0);
  const batch = product.batches[0];
  if (!batch) return; // "No batch to adjust." };
  const nextQty = batch.quantity + qty;
  if (nextQty < 0) return; // "Cannot reduce stock below zero." };
  await prisma.inventoryBatch.update({ where: { id: batch.id }, data: { quantity: nextQty } });
  await prisma.inventoryMovement.create({
    data: {
      clinicId: product.clinicId,
      productId,
      type,
      quantity: qty,
      previousQty: prev,
      newQty: prev + qty,
      staffName: user.name,
      reason: String(formData.get("reason") || "") || null,
    },
  });
  await audit({ userId: user.id, clinicId: product.clinicId, action: "inventory.adjust", entity: "product", entityId: productId });
  revalidatePath("/app/inventory");
}

export async function createTransferAction(formData: FormData) {
  const user = await requirePermission("inventory.edit");
  const fromClinicId = String(formData.get("fromClinicId"));
  const toClinicId = String(formData.get("toClinicId"));
  const productId = String(formData.get("productId"));
  const quantity = Number(formData.get("quantity"));
  if (fromClinicId === toClinicId) return; // "Choose different clinics." };
  const t = await prisma.stockTransfer.create({
    data: {
      fromClinicId,
      toClinicId,
      status: "requested",
      requestedBy: user.name,
      items: { create: { productId, quantity } },
    },
  });
  await notify({
    clinicId: toClinicId,
    type: "transfer_request",
    title: "Stock transfer requested",
    body: "A stock transfer is awaiting approval.",
    relatedUrl: "/app/inventory/transfers",
  });
  await audit({ userId: user.id, clinicId: fromClinicId, action: "transfer.request", entity: "transfer", entityId: t.id });
  revalidatePath("/app/inventory/transfers");
}

export async function approveTransferAction(id: string) {
  const user = await requirePermission("inventory.edit");
  const t = await prisma.stockTransfer.findUnique({ where: { id }, include: { items: { include: { product: { include: { batches: true } } } } } });
  if (!t) return;
  for (const item of t.items) {
    const src = await prisma.product.findFirst({
      where: { clinicId: t.fromClinicId, sku: item.product.sku },
      include: { batches: true },
    });
    if (!src) continue;
    const stock = src.batches.reduce((s, b) => s + b.quantity, 0);
    if (stock < item.quantity) return; // `Only ${stock} units available at source.` };
    let left = item.quantity;
    for (const b of src.batches) {
      if (left <= 0) break;
      const take = Math.min(b.quantity, left);
      await prisma.inventoryBatch.update({ where: { id: b.id }, data: { quantity: b.quantity - take } });
      left -= take;
    }
    let dest = await prisma.product.findFirst({ where: { clinicId: t.toClinicId, sku: item.product.sku } });
    if (!dest) {
      dest = await prisma.product.create({
        data: {
          clinicId: t.toClinicId,
          sku: item.product.sku,
          name: item.product.name,
          category: item.product.category,
          type: item.product.type,
          purchaseCents: item.product.purchaseCents,
          sellingCents: item.product.sellingCents,
          minQty: item.product.minQty,
          reorderLevel: item.product.reorderLevel,
        },
      });
    }
    await prisma.inventoryBatch.create({
      data: {
        clinicId: t.toClinicId,
        productId: dest.id,
        batchNumber: `TR-${Date.now()}`,
        quantity: item.quantity,
      },
    });
  }
  await prisma.stockTransfer.update({ where: { id }, data: { status: "received", approvedBy: user.name } });
  await notify({ clinicId: t.fromClinicId, type: "transfer_approved", title: "Transfer completed", body: "Stock transfer was received.", relatedUrl: "/app/inventory/transfers" });
  revalidatePath("/app/inventory/transfers");
}

export async function receivePurchaseAction(poId: string) {
  const user = await requirePermission("inventory.edit");
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId }, include: { items: true } });
  if (!po) return;
  for (const item of po.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId }, include: { batches: true } });
    if (!product) continue;
    const prev = product.batches.reduce((s, b) => s + b.quantity, 0);
    await prisma.inventoryBatch.create({
      data: {
        clinicId: po.clinicId,
        productId: product.id,
        batchNumber: `PO-${po.id.slice(-6)}`,
        quantity: item.quantity,
        expiryDate: new Date(Date.now() + 365 * 86400000),
      },
    });
    await prisma.purchaseOrderItem.update({ where: { id: item.id }, data: { receivedQty: item.quantity } });
    await prisma.inventoryMovement.create({
      data: {
        clinicId: po.clinicId,
        productId: product.id,
        type: "purchase",
        quantity: item.quantity,
        previousQty: prev,
        newQty: prev + item.quantity,
        staffName: user.name,
        reason: "PO received",
      },
    });
  }
  await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: "received" } });
  revalidatePath("/app/inventory/purchases");
}

export async function createClinicAction(formData: FormData) {
  const user = await requirePermission("settings.manage");
  if (!user.isOwner) return; // "Only the owner can add clinics." };
  const name = String(formData.get("name") || "").trim();
  if (!name) return; // "Name is required." };
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const clinic = await prisma.clinic.create({
    data: {
      name,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      address: String(formData.get("address") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
    },
  });
  await audit({ userId: user.id, clinicId: clinic.id, action: "clinic.create", entity: "clinic", entityId: clinic.id });
  revalidatePath("/app/clinics");
  redirect("/app/clinics");
}

export async function createStaffAction(formData: FormData) {
  const user = await requirePermission("staff.manage");
  const email = String(formData.get("email") || "").toLowerCase();
  const name = String(formData.get("name") || "");
  const roleId = String(formData.get("roleId"));
  const clinicId = String(formData.get("clinicId") || "") || null;
  if (!email || !name) return;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;
  const count = await prisma.user.count();
  await prisma.user.create({
    data: {
      staffId: `STF-${String(count + 1).padStart(4, "0")}`,
      email,
      name,
      phone: String(formData.get("phone") || "") || null,
      department: String(formData.get("department") || "") || null,
      passwordHash: await hashPassword(String(formData.get("password") || "Welcome123!")),
      roleId,
      clinicId,
    },
  });
  await notify({ type: "staff_new", title: "New staff account", body: `${name} was added to the platform.`, relatedUrl: "/app/staff" });
  await audit({ userId: user.id, clinicId, action: "staff.create", entity: "user" });
  revalidatePath("/app/staff");
}

export async function updateStaffRoleAction(formData: FormData) {
  const user = await requirePermission("staff.manage");
  const userId = String(formData.get("userId") || "");
  const roleId = String(formData.get("roleId") || "");
  const clinicIdRaw = String(formData.get("clinicId") || "");
  const clinicId = clinicIdRaw === "" ? null : clinicIdRaw;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return;
  await prisma.user.update({
    where: { id: userId },
    data: { roleId, clinicId },
  });
  await audit({
    userId: user.id,
    clinicId,
    action: "staff.role",
    entity: "user",
    entityId: userId,
    meta: { role: role.name },
  });
  revalidatePath("/app/staff");
}

export async function toggleUserStatusAction(id: string) {
  const user = await requirePermission("staff.manage");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return;
  await prisma.user.update({
    where: { id },
    data: { status: target.status === "active" ? "inactive" : "active" },
  });
  await audit({ userId: user.id, action: "staff.status", entity: "user", entityId: id });
  revalidatePath("/app/staff");
}

export async function savePlatformSettingsAction(formData: FormData) {
  const user = await requirePermission("settings.manage");
  await prisma.platformSetting.upsert({
    where: { id: "platform" },
    update: {
      name: String(formData.get("name") || "Aether Clinics"),
      primaryColor: String(formData.get("primaryColor") || "#0F766E"),
      secondaryColor: String(formData.get("secondaryColor") || "#0EA5E9"),
      receiptFooter: String(formData.get("receiptFooter") || ""),
      invoiceFooter: String(formData.get("invoiceFooter") || ""),
    },
    create: { id: "platform", name: String(formData.get("name") || "Aether Clinics") },
  });
  await audit({ userId: user.id, action: "settings.update", entity: "platform" });
  revalidatePath("/app/settings");
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { OR: [{ userId: user.id }, { userId: null }], read: false },
    data: { read: true },
  });
  revalidatePath("/app");
}

export async function addExpenseAction(formData: FormData) {
  const user = await requirePermission("billing.create");
  const clinicId = String(formData.get("clinicId") || user.clinicId || "");
  await prisma.expense.create({
    data: {
      clinicId,
      category: String(formData.get("category") || "general"),
      description: String(formData.get("description") || ""),
      amountCents: Math.round(Number(formData.get("amount") || 0) * 100),
    },
  });
  revalidatePath("/app/billing/expenses");
}

export async function createPurchaseOrderAction(formData: FormData) {
  const user = await requirePermission("inventory.create");
  const clinicId = String(formData.get("clinicId") || user.clinicId || "");
  const po = await prisma.purchaseOrder.create({
    data: {
      clinicId,
      supplierId: String(formData.get("supplierId")),
      status: "ordered",
      expectedAt: formData.get("expectedAt") ? new Date(String(formData.get("expectedAt"))) : null,
      items: {
        create: {
          productId: String(formData.get("productId")),
          quantity: Number(formData.get("quantity") || 1),
          unitCents: Math.round(Number(formData.get("unitPrice") || 0) * 100),
        },
      },
    },
  });
  await audit({ userId: user.id, clinicId, action: "po.create", entity: "purchase_order", entityId: po.id });
  revalidatePath("/app/inventory/purchases");
}

export async function addPatientNoteAction(formData: FormData) {
  await requirePermission("patients.edit");
  const patientId = String(formData.get("patientId"));
  await prisma.patientNote.create({
    data: { patientId, body: String(formData.get("body") || "") },
  });
  revalidatePath(`/app/patients/${patientId}`);
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Always succeed to avoid account enumeration. Integration point: email token.
  if (user) {
    await notify({
      userId: user.id,
      type: "password_reset",
      title: "Password reset requested",
      body: "Use the security settings with an administrator to reset access.",
    });
  }
  return { ok: true };
}

export async function dragRescheduleAppointmentAction(id: string, startIso: string) {
  const user = await requirePermission("appointments.edit");
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return { error: "Invalid date." };
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return { error: "Appointment not found." };
  const endAt = new Date(start.getTime() + appt.durationMin * 60000);
  if (appt.doctorId) {
    const clash = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId: appt.doctorId,
        archived: false,
        status: { notIn: ["cancelled", "no_show"] },
        startAt: { lt: endAt },
        endAt: { gt: start },
      },
    });
    if (clash) return { error: "This practitioner already has an appointment at this time." };
  }
  await prisma.appointment.update({ where: { id }, data: { startAt: start, endAt, status: "rescheduled" } });
  await prisma.appointmentStatusHistory.create({ data: { appointmentId: id, status: "rescheduled" } });
  await audit({ userId: user.id, clinicId: appt.clinicId, action: "appointment.reschedule", entity: "appointment", entityId: id });
  revalidatePath("/app/appointments");
  revalidatePath("/app/appointments/calendar");
  return { ok: true };
}

export async function beginTotpSetupAction() {
  const user = await requireUser();
  const { generateTotpSecret } = await import("@/lib/totp");
  const { secret, otpauthUrl, qrDataUrl } = await generateTotpSecret(user.email);
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: false } });
  await audit({ userId: user.id, action: "2fa.begin", entity: "user", entityId: user.id });
  return { otpauthUrl, qrDataUrl };
}

export async function confirmTotpSetupAction(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("code") || "").trim();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.totpSecret) return { error: "Start 2FA setup first." };
  const { verifyTotp } = await import("@/lib/totp");
  if (!verifyTotp(dbUser.totpSecret, code)) return { error: "Invalid authenticator code." };
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  await audit({ userId: user.id, action: "2fa.enable", entity: "user", entityId: user.id });
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function disableTotpAction(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("code") || "").trim();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.totpSecret || !dbUser.totpEnabled) return { error: "2FA is not enabled." };
  const { verifyTotp } = await import("@/lib/totp");
  if (!verifyTotp(dbUser.totpSecret, code)) return { error: "Invalid authenticator code." };
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null } });
  await audit({ userId: user.id, action: "2fa.disable", entity: "user", entityId: user.id });
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function verifyTotpLoginAction(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  const code = String(formData.get("code") || "").trim();
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser?.totpSecret || !dbUser.totpEnabled) return { error: "2FA is not configured." };
  const { verifyTotp } = await import("@/lib/totp");
  if (!verifyTotp(dbUser.totpSecret, code)) return { error: "Invalid authenticator code." };
  await createSession(dbUser.id);
  await audit({ userId: dbUser.id, clinicId: dbUser.clinicId, action: "login.2fa", entity: "user", entityId: dbUser.id });
  redirect("/app");
}

export async function createCustomRoleAction(formData: FormData) {
  const user = await requirePermission("staff.manage");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Role name is required." };
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) return { error: "A role with that name already exists." };
  const keys = formData.getAll("permissions").map(String);
  const perms = await prisma.permission.findMany({ where: { key: { in: keys } } });
  const role = await prisma.role.create({
    data: {
      name,
      description: String(formData.get("description") || "") || null,
      isSystem: false,
      permissions: { create: perms.map((p) => ({ permissionId: p.id })) },
    },
  });
  await audit({ userId: user.id, action: "role.create", entity: "role", entityId: role.id });
  revalidatePath("/app/staff/roles");
  return { ok: true };
}

export async function updateRolePermissionsAction(formData: FormData) {
  const user = await requirePermission("staff.manage");
  const roleId = String(formData.get("roleId") || "");
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return { error: "Role not found." };
  if (role.isSystem && role.name === "Super Admin") return { error: "Super Admin permissions cannot be edited." };
  const keys = formData.getAll("permissions").map(String);
  const perms = await prisma.permission.findMany({ where: { key: { in: keys } } });
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  await prisma.rolePermission.createMany({
    data: perms.map((p) => ({ roleId, permissionId: p.id })),
  });
  await audit({ userId: user.id, action: "role.permissions", entity: "role", entityId: roleId, meta: { keys } });
  revalidatePath("/app/staff/roles");
  return { ok: true };
}
