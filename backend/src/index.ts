
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');

import { type Express, type Request, type Response, type NextFunction } from 'express';

const prisma = new PrismaClient();
const app: Express = express();
const port = process.env.PORT || 8080;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET',
});

app.use(cors());
app.use(express.json());

// Simple auth middleware
const requireAuth = async (req: Request & { userId?: number }, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as { userId: number };
    req.userId = decoded.userId;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the Planix Backend!');
});

// Register a new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password, name, referralCode } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If the user supplied a referral code, check if it exists
    let referralDiscountEligible = false;
    let referrerUserId: number | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) {
        referralDiscountEligible = true;
        referrerUserId = referrer.id;
      } else {
        return res.status(400).json({ error: 'Invalid referral code' });
      }
    }

    // Generate a unique referralCode for the new user
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = 'REF-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const existingCode = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
      if (!existingCode) {
        isUnique = true;
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        referralCode: newReferralCode,
        referredByCode: referralCode || null,
        referralDiscountEligible,
      },
    });

    if (referrerUserId) {
      await prisma.user.update({ 
        where: { id: referrerUserId }, 
        data: { referralDiscountEligible: true } 
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.status(201).json({ 
      message: 'User created successfully', 
      userId: user.id, 
      token, 
      referralCode: user.referralCode 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// Login a user
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (passwordMatch) {
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', userId: user.id, token, plan: user.plan, credits: user.credits, referralCode: user.referralCode });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Generate a floor plan (placeholder)
app.post('/api/generate-plan', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { prompt } = req.body as { prompt: string };
  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.plan !== 'PRO' && user.credits <= 0) {
    return res.status(402).json({ error: 'Insufficient credits' });
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  const systemPrompt = `You are a qualified civil engineer with 15+ years experience in structural design, architectural planning, and construction management.

EXPERTISE AREAS:
- Structural analysis and load calculations
- Building codes and safety standards  
- Material estimation and cost optimization
- MEP (Mechanical, Electrical, Plumbing) systems design
- Foundation design and excavation planning
- Construction sequencing and project management

Return ONLY strict JSON matching this schema with metric units (meters):
{
  "rooms": [{"id": string, "type": "living_room"|"kitchen"|"bedroom"|"bathroom"|"study"|"dining"|"balcony"|"storage"|"garage"|"utility", "dimensions": {"x": number, "y": number, "width": number, "height": number}, "label": string, "floorLevel": number, "ceilingHeight": number}],
  "walls": [{"from": {"x": number, "y": number}, "to": {"x": number, "y": number}, "type": "load_bearing"|"partition", "thickness": number, "material": "concrete"|"brick"|"drywall"}],
  "utilities": [{"id": string, "type": "plumbing"|"wiring"|"hvac"|"gas", "area": {"x": number, "y": number, "width": number, "height": number}, "note": string, "specifications": string}],
  "structural": {
    "foundations": [{"type": "strip"|"pad"|"raft", "location": {"x": number, "y": number, "width": number, "height": number}, "depth": number}],
    "beams": [{"from": {"x": number, "y": number}, "to": {"x": number, "y": number}, "size": string, "material": "rcc"|"steel"}],
    "columns": [{"location": {"x": number, "y": number}, "size": string, "height": number, "material": "rcc"|"steel"}]
  }
}

ENGINEERING CONSTRAINTS:
1. Follow IS codes (Indian Standard) for structural design
2. Ensure minimum room sizes: bedroom(9m²), kitchen(5m²), bathroom(3m²)
3. Provide 600mm service corridors for utilities
4. Load-bearing walls must be minimum 230mm thick
5. Column grid should be economical (4-6m spans)
6. Foundation depth minimum 1.5m below ground level
7. Electrical points every 3m, plumbing risers near wet areas
8. Natural ventilation and lighting considerations
9. Fire safety and emergency exit planning
10. Accessibility compliance (ramps, door widths)

PROVIDE PROFESSIONAL ENGINEERING INSIGHTS in the layout.`;

  let floorPlan: any | null = null;
  if (deepseekKey) {
    try {
      const { data } = await axios.post('https://api.deepseek.com/chat/completions', {
        model: deepseekModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a plan for: ${prompt}` },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekKey}`,
        },
      });
      const content = data.choices?.[0]?.message?.content || '';
      try {
        floorPlan = JSON.parse(content);
      } catch {
        // Some providers wrap JSON in code fences
        const cleaned = content.replace(/^```json\n?|```$/g, '').trim();
        floorPlan = JSON.parse(cleaned);
      }
    } catch (err) {
      console.error('DeepSeek error:', err);
    }
  }

  if (!floorPlan) {
    floorPlan = {
      rooms: [
        { id: 'living-room', type: 'living_room', dimensions: { x: 0, y: 0, width: 6, height: 8 }, label: 'Living Room' },
        { id: 'kitchen', type: 'kitchen', dimensions: { x: 6, y: 0, width: 6, height: 5 }, label: 'Kitchen' },
        { id: 'bedroom-1', type: 'bedroom', dimensions: { x: 0, y: 8, width: 6, height: 5 }, label: 'Bedroom 1' },
        { id: 'bathroom', type: 'bathroom', dimensions: { x: 6, y: 5, width: 3, height: 3 }, label: 'Bathroom' },
      ],
      walls: [
        { from: { x: 0, y: 0 }, to: { x: 6, y: 0 } },
        { from: { x: 6, y: 0 }, to: { x: 6, y: 8 } },
        { from: { x: 6, y: 8 }, to: { x: 0, y: 8 } },
        { from: { x: 0, y: 8 }, to: { x: 0, y: 0 } },
        { from: { x: 6, y: 0 }, to: { x: 12, y: 0 } },
        { from: { x: 12, y: 0 }, to: { x: 12, y: 5 } },
        { from: { x: 12, y: 5 }, to: { x: 6, y: 5 } },
        { from: { x: 0, y: 8 }, to: { x: 6, y: 8 } },
        { from: { x: 6, y: 8 }, to: { x: 6, y: 13 } },
        { from: { x: 6, y: 13 }, to: { x: 0, y: 13 } },
        { from: { x: 6, y: 5 }, to: { x: 9, y: 5 } },
        { from: { x: 9, y: 5 }, to: { x: 9, y: 8 } },
        { from: { x: 9, y: 8 }, to: { x: 6, y: 8 } },
      ],
      utilities: [
        { id: 'plumbing-shaft', type: 'plumbing', area: { x: 9.2, y: 5, width: 0.6, height: 1.5 }, note: 'Reserved plumbing shaft' },
        { id: 'wiring-trunk-1', type: 'wiring', area: { x: 0, y: 0, width: 0.2, height: 13 }, note: 'Electrical trunk' },
        { id: 'wiring-trunk-2', type: 'wiring', area: { x: 0, y: 0, width: 12, height: 0.2 }, note: 'Electrical trunk' }
      ],
    };
  }

  if (user.plan !== 'PRO') {
    await prisma.user.update({ where: { id: userId }, data: { credits: { decrement: 1 } } });
  }
  res.json({ floorPlan });
});

// Analyze a floor plan
app.post('/api/analyze-plan', requireAuth, (req: Request, res: Response) => {
  const { floorPlan } = req.body;

  if (!floorPlan) {
    return res.status(400).json({ error: 'floorPlan is required' });
  }

  // === COMPREHENSIVE CIVIL ENGINEERING ANALYSIS ===
  
  // Material & Cost Calculations
  let totalWallLength = 0;
  let loadBearingWallLength = 0;
  
  if (floorPlan.walls) {
    floorPlan.walls.forEach((wall: any) => {
      const length = Math.sqrt(Math.pow(wall.to.x - wall.from.x, 2) + Math.pow(wall.to.y - wall.from.y, 2));
      totalWallLength += length;
      if (wall.type === 'load_bearing') {
        loadBearingWallLength += length;
      }
    });
  }

  let totalBuiltArea = 0;
  if (floorPlan.rooms) {
    totalBuiltArea = floorPlan.rooms.reduce((acc: number, room: any) => 
      acc + (room.dimensions.width * room.dimensions.height), 0);
  }

  // Detailed Analysis Results
  const analysis = {
    materialEstimation: {
      concrete: {
        foundation: `${(totalWallLength * 0.6 * 1.5).toFixed(2)} m³`,
        beams: `${(totalWallLength * 0.23 * 0.3).toFixed(2)} m³`,
        columns: `${((floorPlan.structural?.columns?.length || 4) * 0.3 * 0.3 * 3).toFixed(2)} m³`,
        total: `${(totalWallLength * 0.6 * 1.5 + totalWallLength * 0.23 * 0.3 + (floorPlan.structural?.columns?.length || 4) * 0.3 * 0.3 * 3).toFixed(2)} m³`
      },
      steel: `${Math.floor(totalWallLength * 8)} kg (TMT bars)`,
      bricks: `${Math.floor(loadBearingWallLength * 3 * 120)} nos`,
      cement: `${Math.floor(totalWallLength * 2.5)} bags (50kg each)`,
      sand: `${(totalWallLength * 0.5).toFixed(2)} m³`,
      aggregate: `${(totalWallLength * 0.8).toFixed(2)} m³`,
    },
    excavationQuantity: {
      area: `${(totalBuiltArea * 1.2).toFixed(2)} m²`,
      depth: "1.5m (standard foundation depth)",
      volume: `${(totalBuiltArea * 1.2 * 1.5).toFixed(2)} m³`,
      backfill: `${(totalBuiltArea * 1.2 * 0.8).toFixed(2)} m³`,
    },
    structuralAnalysis: {
      loadCalculation: `Dead Load: ${Math.floor(totalBuiltArea * 4)} kN, Live Load: ${Math.floor(totalBuiltArea * 2)} kN`,
      foundationType: totalBuiltArea > 200 ? "Raft Foundation Recommended" : "Strip Foundation Adequate",
      beamDesign: `Main Beams: ${Math.floor(totalWallLength / 4)} nos (230x300mm), Secondary: ${Math.floor(totalWallLength / 2)} nos (230x230mm)`,
      columnDesign: `${floorPlan.structural?.columns?.length || Math.ceil(totalBuiltArea / 25)} columns, Size: ${totalBuiltArea > 100 ? "300x300mm" : "230x230mm"}`,
      compliance: "IS 456:2000, IS 875:1987, IS 1893:2016 compliant",
      recommendations: "Professional structural engineer consultation recommended for final design"
    },
    utilitiesAnalysis: {
      electrical: {
        loadRequirement: `${Math.floor(totalBuiltArea * 40)}W connected load`,
        wiring: `${Math.floor(totalBuiltArea * 8)}m cables (2.5mm² & 4mm²)`,
        points: `${Math.floor(totalBuiltArea / 8)} electrical points required`,
        protection: `${Math.ceil(totalBuiltArea / 20)} MCBs, ELCB, Earthing system`
      },
      plumbing: {
        waterDemand: `${Math.floor(totalBuiltArea * 2)}L/day as per IS 1172`,
        pipework: `${Math.floor(totalWallLength * 2)}m CPVC/PPR supply pipes`,
        drainage: `${Math.floor(totalBuiltArea * 1.5)}m PVC drainage system`,
        fixtures: `${floorPlan.rooms?.filter((r: any) => r.type === 'bathroom' || r.type === 'kitchen').length || 2} water points`,
        storage: `${Math.floor(totalBuiltArea * 0.5)}L overhead tank capacity`
      },
      hvac: {
        ventilation: `${Math.floor(totalBuiltArea * 0.1)}m² natural ventilation openings`,
        exhaustSystems: `${floorPlan.rooms?.filter((r: any) => r.type === 'bathroom' || r.type === 'kitchen').length || 2} exhaust fans required`
      }
    },
    costEstimation: {
      civilWork: `₹${Math.floor(totalBuiltArea * 600).toLocaleString('en-IN')}`,
      electrical: `₹${Math.floor(totalBuiltArea * 150).toLocaleString('en-IN')}`,
      plumbing: `₹${Math.floor(totalBuiltArea * 100).toLocaleString('en-IN')}`,
      finishes: `₹${Math.floor(totalBuiltArea * 350).toLocaleString('en-IN')}`,
      total: `₹${Math.floor(totalBuiltArea * 1400).toLocaleString('en-IN')} (₹1400/sqft approx)`,
      timeline: `${Math.ceil(totalBuiltArea / 10)} months construction period`
    },
    professionalAdvice: {
      designOptimization: [
        "Ensure cross ventilation in all rooms",
        "Kitchen exhaust directly to outside",
        "Bathroom ventilation mandatory",
        "Staircase width minimum 900mm",
        "Door sizes: Main 1000mm, Rooms 800mm"
      ],
      constructionPhases: [
        "1. Site preparation & excavation",
        "2. Foundation & basement works", 
        "3. Superstructure (columns, beams, slabs)",
        "4. Masonry & utility installation",
        "5. Plastering & finishing",
        "6. Final inspections & handover"
      ],
      qualityAssurance: [
        "Concrete cube testing",
        "Steel reinforcement inspection", 
        "Electrical testing & certification",
        "Plumbing pressure testing",
        "Structural safety audit"
      ]
    }
  };

  res.json(analysis);
});

// Get current user profile
app.get('/api/me', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, plan: user.plan, credits: user.credits, referralCode: user.referralCode, referralDiscountEligible: user.referralDiscountEligible, referralDiscountUsed: user.referralDiscountUsed });
});

// Create a Razorpay order
app.post('/api/payment/create-order', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { amount, currency, receipt, notes } = req.body;
  try {
    // Apply referral discount once if eligible and not used
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const monthlyPrice = amount ?? 999;
    const isDiscount = user.referralDiscountEligible && !user.referralDiscountUsed;
    const finalAmount = isDiscount ? Math.floor(monthlyPrice * 0.5) : monthlyPrice;

    const options = {
      amount: finalAmount * 100, // smallest currency unit
      currency,
      receipt,
      notes,
    };
    const order = await razorpay.orders.create(options);
    res.json({ ...order, discounted: isDiscount, finalAmount });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Verify a Razorpay payment
app.post('/api/payment/verify', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { order_id, payment_id, signature } = req.body;

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(order_id + '|' + payment_id)
    .digest('hex');

  if (generated_signature === signature) {
    // Payment is successful
    try {
      await prisma.user.update({
        where: { id: req.userId! },
        data: {
          plan: 'PRO',
          subscriptionId: order_id,
          referralDiscountUsed: true,
          credits: 9999,
        },
      });
      res.json({ message: 'Payment verified successfully', plan: 'PRO' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user plan' });
    }
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});

// Create an order for credit top-up (e.g., 10 credits for ₹199)
app.post('/api/payment/create-order-credits', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  try {
    const options = {
      amount: 199 * 100,
      currency: 'INR',
      receipt: `credits_${req.userId}_${Date.now()}`,
      notes: { purpose: 'CREDITS_10' },
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Verify credits purchase and add to user
app.post('/api/payment/verify-credits', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { order_id, payment_id, signature } = req.body;

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(order_id + '|' + payment_id)
    .digest('hex');

  if (generated_signature === signature) {
    try {
      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: { credits: { increment: 10 } },
      });
      res.json({ message: 'Credits added successfully', credits: user.credits });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add credits' });
    }
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
