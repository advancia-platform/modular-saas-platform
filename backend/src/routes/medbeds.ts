import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
import type { Server as IOServer } from "socket.io";
import Stripe from "stripe";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();
let ioRef: IOServer | null = null;
export function setMedbedsSocketIO(io: IOServer) {
  ioRef = io;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Book appointment with payment
router.post(
  "/book-with-payment",
  authenticateToken as any,
  async (req: any, res) => {
    const {
      chamberType,
      chamberName,
      sessionDate,
      duration,
      paymentMethod, // "balance" or "stripe"
      notes,
    } = req.body || {};

    if (
      !chamberType ||
      !chamberName ||
      !sessionDate ||
      !duration ||
      !paymentMethod
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      // Calculate cost: $150 per hour
      const cost = new Decimal(duration).div(60).mul(150);

      if (paymentMethod === "balance") {
        // Pay with USD balance
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { usdBalance: true, email: true, username: true },
        });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (user.usdBalance.lt(cost)) {
          return res.status(400).json({
            error: "Insufficient balance",
            required: cost.toString(),
            available: user.usdBalance.toString(),
          });
        }

        // Process payment with transaction
        const result = await prisma.$transaction(async (tx) => {
          // Deduct balance
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { usdBalance: { decrement: cost } },
          });

          // Create transaction record
          const transaction = await tx.transaction.create({
            data: {
              userId,
              amount: cost.toNumber(),
              type: "debit",
              category: "medbeds_booking",
              description: `Med Beds - ${chamberName} (${duration} min)`,
              status: "completed",
            },
          });

          // Create booking
          const booking = await tx.medBedsBooking.create({
            data: {
              userId,
              chamberType,
              chamberName,
              sessionDate: new Date(sessionDate),
              duration,
              cost,
              paymentMethod: "balance",
              paymentStatus: "paid",
              transactionId: transaction.id,
              status: "scheduled",
              notes,
            },
          });

          return { booking, transaction, newBalance: updatedUser.usdBalance };
        });

        // Emit socket event
        if (ioRef) {
          ioRef.to(`user-${userId}`).emit("balance-updated", {
            usdBalance: result.newBalance.toString(),
          });
          ioRef.to("admins").emit("admin:medbeds:booking", {
            bookingId: result.booking.id,
            userId,
            chamberName,
            sessionDate,
            paymentMethod: "balance",
          });
        }

        return res.json({
          success: true,
          booking: {
            ...result.booking,
            cost: result.booking.cost.toString(),
          },
          paymentMethod: "balance",
        });
      } else if (paymentMethod === "stripe") {
        // Create Stripe checkout session
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, username: true },
        });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Create pending booking first
        const booking = await prisma.medBedsBooking.create({
          data: {
            userId,
            chamberType,
            chamberName,
            sessionDate: new Date(sessionDate),
            duration,
            cost,
            paymentMethod: "stripe",
            paymentStatus: "pending",
            status: "scheduled",
            notes,
          },
        });

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Med Beds - ${chamberName}`,
                  description: `${duration} minute ${chamberType} session`,
                },
                unit_amount: Math.round(Number(cost) * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/medbeds/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${
            booking.id
          }`,
          cancel_url: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/medbeds?cancelled=true`,
          metadata: {
            userId,
            bookingId: booking.id,
            type: "medbeds_booking",
          },
        });

        // Update booking with Stripe session ID
        await prisma.medBedsBooking.update({
          where: { id: booking.id },
          data: { stripeSessionId: session.id },
        });

        return res.json({
          success: true,
          booking: {
            ...booking,
            cost: booking.cost.toString(),
          },
          paymentMethod: "stripe",
          checkoutUrl: session.url,
        });
      } else {
        return res.status(400).json({ error: "Invalid payment method" });
      }
    } catch (e) {
      console.error("Medbeds booking error", e);
      res.status(500).json({ error: "Failed to create booking" });
    }
  }
);

// Get user's bookings
router.get("/my-bookings", authenticateToken as any, async (req: any, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const bookings = await prisma.medBedsBooking.findMany({
      where: { userId },
      orderBy: { sessionDate: "desc" },
    });

    res.json(
      bookings.map((b) => ({
        ...b,
        cost: b.cost.toString(),
      }))
    );
  } catch (e) {
    console.error("Error fetching bookings", e);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Admin: Get all bookings
router.get("/admin/bookings", requireAdmin as any, async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const bookings = await prisma.medBedsBooking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { sessionDate: "desc" },
    });

    res.json(
      bookings.map((b) => ({
        ...b,
        cost: b.cost.toString(),
        user: b.user,
      }))
    );
  } catch (e) {
    console.error("Error fetching admin bookings", e);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Admin: Update booking
router.patch("/admin/bookings/:id", requireAdmin as any, async (req, res) => {
  const { id } = req.params;
  const { status, effectiveness, notes } = req.body || {};

  try {
    const booking = await prisma.medBedsBooking.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(effectiveness !== undefined && { effectiveness }),
        ...(notes && { notes }),
      },
    });

    // Notify user
    if (ioRef) {
      ioRef.to(`user-${booking.userId}`).emit("medbeds:booking-updated", {
        bookingId: id,
        status: booking.status,
        effectiveness: booking.effectiveness,
      });
    }

    res.json({
      ...booking,
      cost: booking.cost.toString(),
    });
  } catch (e) {
    console.error("Error updating booking", e);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// Keep old booking endpoint for backwards compatibility
router.post("/book", authenticateToken as any, async (req: any, res) => {
  const { fullName, email, phone, preferredDate, preferredTime, notes } =
    req.body || {};
  if (!fullName || !email || !phone || !preferredDate)
    return res.status(400).json({ error: "Missing required fields" });
  try {
    const userId = req.user?.userId;
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId,
        subject: "Med Beds Appointment Request",
        message: `Full Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nPreferred Date: ${preferredDate}\nPreferred Time: ${
          preferredTime || ""
        }\nNotes: ${notes || ""}`,
        category: "GENERAL",
        status: "OPEN",
      },
    });
    try {
      ioRef?.to("admins").emit("admin:medbeds:booking", {
        ticketId: ticket.id,
        userId,
        fullName,
        preferredDate,
        preferredTime,
      });
    } catch {}
    res.json({ success: true, ticketId: ticket.id });
  } catch (e) {
    console.error("Medbeds booking error", e);
    res.status(500).json({ error: "Failed to submit booking" });
  }
});

export default router;
