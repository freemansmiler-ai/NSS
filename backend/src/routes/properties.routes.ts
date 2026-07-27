import { Router, Request, Response } from "express";
import { getProperties, getPropertyById, createProperty, renewProperty } from "../lib/db.js";
import { getSessionFromRequest } from "../lib/auth.js";

const router = Router();

// GET /api/properties
router.get("/", async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: "Authentication required. Please sign in or register to access room listings." });
      return;
    }

    const search = (req.query.search as string) || undefined;
    const propertyType = (req.query.propertyType as string) || undefined;
    const facilityType = (req.query.facilityType as string) || undefined;
    const minLeasePeriod = (req.query.minLeasePeriod as string) || undefined;
    const maxPriceParam = req.query.maxPrice as string;
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;
    const includeInactive = req.query.includeInactive === "true";

    const properties = await getProperties({
      search,
      propertyType,
      facilityType,
      minLeasePeriod,
      maxPrice,
      includeInactive,
    });

    res.json({ properties });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch properties." });
  }
});

// GET /api/properties/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const property = await getPropertyById(id);

    if (!property) {
      res.status(404).json({ error: "Property listing not found or has expired beyond 93 days." });
      return;
    }

    res.json({ property });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch property details." });
  }
});

// POST /api/properties (Create listing)
router.post("/", async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: "Unauthorized. Please log in to post property listings." });
      return;
    }

    if (session.role !== "LANDLORD" && session.role !== "ADMIN") {
      res.status(403).json({ error: "Access Denied. Only registered Landlords and System Administrators are authorized to list properties." });
      return;
    }

    const {
      title,
      propertyType,
      facilityType,
      pricePerMonth,
      minLeasePeriod,
      generalArea,
      exactGhanaPostGps,
      exactStreetAddress,
      latitude,
      longitude,
      description,
      amenities,
      images,
      contactPhone,
      contactWhatsapp,
      paymentRef,
    } = req.body;

    if (
      !title ||
      !propertyType ||
      !facilityType ||
      !pricePerMonth ||
      !generalArea ||
      !exactGhanaPostGps ||
      !exactStreetAddress ||
      !contactPhone
    ) {
      res.status(400).json({ error: "Please fill in all required property details." });
      return;
    }

    // Landlords must pay GHC 30.00 via Paystack. Admin can list for FREE.
    if (session.role === "LANDLORD" && !paymentRef) {
      res.status(400).json({
        error: "Payment required: Landlords must make a payment of GHC 30.00 via Paystack before listing a room.",
        paymentRequired: true,
        amountGhc: 30,
      });
      return;
    }

    const effectivePaymentRef = session.role === "ADMIN" ? (paymentRef || "ADMIN_FREE") : paymentRef;

    const newProperty = await createProperty({
      landlordId: session.userId,
      title,
      propertyType,
      facilityType,
      pricePerMonth: Number(pricePerMonth),
      minLeasePeriod: minLeasePeriod || "TEN_MONTHS",
      generalArea,
      exactGhanaPostGps,
      exactStreetAddress,
      latitude: latitude ? Number(latitude) : 5.65,
      longitude: longitude ? Number(longitude) : -0.17,
      description: description || "No detailed description provided.",
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) && images.length > 0
        ? images
        : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"],
      contactPhone,
      contactWhatsapp: contactWhatsapp || contactPhone.replace(/[^0-9]/g, ""),
      paymentRef: effectivePaymentRef,
      isActive: true,
    });

    res.status(201).json({ property: newProperty, message: "Property listed successfully!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create listing." });
  }
});

// POST /api/properties/:id/renew (Renew listing with GHC 30.00 Paystack payment)
router.post("/:id/renew", async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: "Unauthorized. Please log in to renew room listings." });
      return;
    }

    const { paymentRef } = req.body;
    if (session.role === "LANDLORD" && !paymentRef) {
      res.status(400).json({ error: "Renewal payment of GHC 30.00 via Paystack is required to extend listing for another 90 days." });
      return;
    }

    const id = String(req.params.id);
    const effectiveRef = session.role === "ADMIN" ? (paymentRef || "ADMIN_FREE_RENEWAL") : paymentRef;

    const renewed = await renewProperty(id, effectiveRef);
    if (!renewed) {
      res.status(404).json({ error: "Listing not found or has exceeded 93 days and been delisted." });
      return;
    }

    res.json({ success: true, property: renewed, message: "Room listing renewed for another 90 days!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to renew room listing." });
  }
});

export default router;
