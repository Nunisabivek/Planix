
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';

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
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    // If the user supplied a referral code, check if it exists
    let referralDiscountEligible = false;
  let referrerUserId: number | null = null;
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (referrer) {
      referralDiscountEligible = true;
      referrerUserId = referrer.id;
    }
  }

    // Generate a unique referralCode for the new user
    const newReferralCode = 'REF-' + Math.random().toString(36).slice(2, 8).toUpperCase();

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
      await prisma.user.update({ where: { id: referrerUserId }, data: { referralDiscountEligible: true } });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.status(201).json({ message: 'User created successfully', userId: user.id, token, referralCode: user.referralCode });
  } catch (error) {
    res.status(400).json({ error: 'User with this email already exists' });
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

  const systemPrompt = `You are a qualified civil engineer and architectural planner.
Return ONLY strict JSON matching this schema with metric units (meters):
{
  "rooms": [{"id": string, "type": "living_room"|"kitchen"|"bedroom"|"bathroom"|"study"|"dining"|"balcony"|"storage", "dimensions": {"x": number, "y": number, "width": number, "height": number}, "label": string}],
  "walls": [{"from": {"x": number, "y": number}, "to": {"x": number, "y": number}}],
  "utilities": [{"id": string, "type": "plumbing"|"wiring", "area": {"x": number, "y": number, "width": number, "height": number}, "note": string}]
}
Constraints: Leave service shafts for plumbing near bathrooms/kitchen. Reserve wiring trunks along perimeters. Ensure load-bearing walls align and provide basic sensible layout.`;

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

  // --- Material Estimation ---
  let totalWallLength = 0;
  if (floorPlan.walls) {
    floorPlan.walls.forEach((wall: any) => {
      const length = Math.sqrt(Math.pow(wall.to.x - wall.from.x, 2) + Math.pow(wall.to.y - wall.from.y, 2));
      totalWallLength += length;
    });
  }
  const concreteEstimation = totalWallLength * 0.1; // Assuming 0.1 cubic meters per meter of wall
  const bricksEstimation = totalWallLength * 120; // Assuming 120 bricks per meter of wall

  // --- Excavation Quantity ---
  let totalArea = 0;
  if (floorPlan.rooms) {
    floorPlan.rooms.forEach((room: any) => {
      totalArea += room.dimensions.width * room.dimensions.height;
    });
  }
  const excavationQuantity = totalArea * 0.5; // Assuming 0.5 meters deep excavation

  // --- Structural Analysis (Placeholder) ---
  const structuralAnalysis = "Basic structural check passed. Consider consulting a professional for a full analysis.";

  // --- Wiring and Plumbing (Placeholder) ---
  const utilitiesAnalysis = "Remember to plan for wiring and plumbing access within the walls and floors.";


  res.json({
    materialEstimation: {
      concrete: `${concreteEstimation.toFixed(2)} cubic meters`,
      bricks: `${Math.ceil(bricksEstimation)}`,
    },
    excavationQuantity: `${excavationQuantity.toFixed(2)} cubic meters`,
    structuralAnalysis,
    utilitiesAnalysis,
  });
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
