
import type { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import nodemailer from 'nodemailer';

// Initialize Prisma with proper error handling and connection pooling fix
const prisma = new PrismaClient({
  log: ['error', 'warn']
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Environment validation
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app: Express = express();
const port = process.env.PORT || 8080;

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET',
});

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://*.vercel.app',
    'https://planix.vercel.app',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
  res.send('Welcome to the Planix Backend! Server is running correctly.');
});

// Database health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Use findFirst instead of raw query to avoid prepared statement conflicts
    const testQuery = await prisma.user.findFirst({
      take: 1,
      select: { id: true }
    });
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      test_query: 'success',
      env_check: {
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      env_check: {
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing'
      }
    });
  }
});

// Register a new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password, name, referralCode } = req.body as { email: string; password: string; name: string; referralCode?: string };

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
    let newReferralCode: string;
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
        referralCode: newReferralCode!,
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
  const { email, password } = req.body as { email: string; password: string };
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

// Forgot Password
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@planix.com',
      to: email,
      subject: 'Password Reset - Planix',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Password Reset Request</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>You requested a password reset for your Planix account. Click the link below to reset your password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The Planix Team
          </p>
        </div>
      `
    } as const;

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'If an account with that email exists, we have sent a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// Generate a floor plan with advanced AI
app.post('/api/generate-plan', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { prompt, projectId, requirements } = req.body as { 
    prompt: string; 
    projectId?: string;
    requirements?: {
      area?: number;
      bedrooms?: number;
      bathrooms?: number;
      floors?: number;
      style?: string;
      budget?: number;
      location?: string;
    };
  };
  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.plan !== 'PRO' && user.credits <= 0) {
    return res.status(402).json({ error: 'Insufficient credits' });
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  // Enhanced system prompt with requirements
  let enhancedPrompt = prompt;
  if (requirements) {
    enhancedPrompt += `\n\nSpecific Requirements:`;
    if (requirements.area) enhancedPrompt += `\n- Total area: ${requirements.area} sq.m`;
    if (requirements.bedrooms) enhancedPrompt += `\n- Bedrooms: ${requirements.bedrooms}`;
    if (requirements.bathrooms) enhancedPrompt += `\n- Bathrooms: ${requirements.bathrooms}`;
    if (requirements.floors) enhancedPrompt += `\n- Floors: ${requirements.floors}`;
    if (requirements.style) enhancedPrompt += `\n- Architectural style: ${requirements.style}`;
    if (requirements.budget) enhancedPrompt += `\n- Budget constraint: ₹${requirements.budget}`;
    if (requirements.location) enhancedPrompt += `\n- Location: ${requirements.location}`;
  }

  const systemPrompt = `You are a qualified civil engineer with 15+ years experience in structural design, architectural planning, and construction management.

EXPERTISE AREAS:
- Structural analysis and load calculations (IS 456:2000, IS 875:1987, IS 1893:2016)
- Building codes and safety standards compliance
- Material estimation and cost optimization
- MEP (Mechanical, Electrical, Plumbing) systems design
- Foundation design and excavation planning
- Construction sequencing and project management
- Energy-efficient design and green building practices
- Fire safety and accessibility compliance

Return ONLY strict JSON matching this schema with metric units (meters):
{
  "metadata": {
    "totalArea": number,
    "builtUpArea": number,
    "plotSize": {"width": number, "height": number},
    "floors": number,
    "orientation": string,
    "style": string
  },
  "rooms": [{"id": string, "type": "living_room"|"kitchen"|"bedroom"|"bathroom"|"study"|"dining"|"balcony"|"storage"|"garage"|"utility"|"entrance"|"staircase"|"toilet"|"master_bedroom"|"guest_room", "dimensions": {"x": number, "y": number, "width": number, "height": number}, "label": string, "floorLevel": number, "ceilingHeight": number, "area": number, "ventilation": {"windows": number, "doors": number}}],
  "walls": [{"id": string, "from": {"x": number, "y": number}, "to": {"x": number, "y": number}, "type": "load_bearing"|"partition"|"boundary", "thickness": number, "material": "concrete"|"brick"|"drywall"|"aac_block", "height": number}],
  "doors": [{"id": string, "position": {"x": number, "y": number}, "width": number, "height": number, "type": "main"|"room"|"bathroom"|"sliding", "direction": "inward"|"outward"}],
  "windows": [{"id": string, "position": {"x": number, "y": number}, "width": number, "height": number, "type": "casement"|"sliding"|"fixed", "sillHeight": number}],
  "utilities": [{"id": string, "type": "plumbing"|"wiring"|"hvac"|"gas"|"drainage"|"water_supply", "area": {"x": number, "y": number, "width": number, "height": number}, "note": string, "specifications": string, "capacity": string}],
  "structural": {
    "foundations": [{"id": string, "type": "strip"|"pad"|"raft"|"pile", "location": {"x": number, "y": number, "width": number, "height": number}, "depth": number, "material": "rcc", "reinforcement": string}],
    "beams": [{"id": string, "from": {"x": number, "y": number}, "to": {"x": number, "y": number}, "size": string, "material": "rcc"|"steel", "reinforcement": string, "load": string}],
    "columns": [{"id": string, "location": {"x": number, "y": number}, "size": string, "height": number, "material": "rcc"|"steel", "reinforcement": string, "load": string}],
    "slabs": [{"id": string, "area": {"x": number, "y": number, "width": number, "height": number}, "thickness": number, "type": "flat"|"waffle"|"ribbed", "reinforcement": string}]
  },
  "services": {
    "electrical": {"mainPanel": {"x": number, "y": number}, "circuits": number, "load": number, "points": [{"x": number, "y": number, "type": "socket"|"light"|"fan"|"ac"}]},
    "plumbing": {"mainSupply": {"x": number, "y": number}, "drainage": {"x": number, "y": number}, "fixtures": [{"x": number, "y": number, "type": "washbasin"|"toilet"|"shower"|"kitchen_sink"}]},
    "hvac": {"system": "natural"|"mechanical", "requirements": string}
  },
  "compliance": {
    "fireExits": [{"x": number, "y": number, "width": number}],
    "accessibility": {"ramps": [{"x": number, "y": number, "slope": number}], "doorWidths": boolean},
    "ventilation": {"naturalVent": number, "crossVent": boolean},
    "daylighting": {"windowToFloorRatio": number, "orientation": string}
  }
}

ENGINEERING CONSTRAINTS & BEST PRACTICES:
1. Follow IS codes: IS 456:2000 (concrete), IS 875:1987 (loads), IS 1893:2016 (seismic)
2. NBC 2016 (National Building Code) compliance
3. Minimum room sizes: bedroom(9m²), kitchen(5m²), bathroom(3m²), living(12m²)
4. Service corridors: minimum 600mm for utilities
5. Structural: Load-bearing walls ≥230mm, partition walls ≥100mm
6. Column grid: economical spans 4-6m, maximum 8m without drop beams
7. Foundation: minimum 1.5m depth, adequate for soil bearing capacity
8. Electrical: points every 3m, dedicated circuits for heavy loads
9. Plumbing: risers near wet areas, adequate pipe sizing
10. Natural ventilation: 10% of floor area, cross-ventilation mandatory
11. Fire safety: maximum travel distance 30m, adequate exit widths
12. Accessibility: door widths ≥800mm, ramps with 1:12 slope
13. Energy efficiency: proper orientation, insulation, daylighting
14. Water management: rainwater harvesting, greywater recycling
15. Seismic considerations: proper detailing, ductile design

DESIGN PHILOSOPHY:
- Prioritize functionality, safety, and sustainability
- Optimize space utilization and circulation
- Ensure structural integrity and durability
- Incorporate modern MEP systems efficiently
- Consider local climate and building practices
- Balance cost-effectiveness with quality`;

  let floorPlan: any | null = null;
  if (deepseekKey) {
    try {
      const { data } = await axios.post('https://api.deepseek.com/chat/completions', {
        model: deepseekModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a professional floor plan for: ${enhancedPrompt}` },
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

  // Update credits and usage history
  if (user.plan !== 'PRO') {
    await prisma.user.update({ where: { id: userId }, data: { credits: { decrement: 1 } } });
  }

  // Record usage
  await prisma.usageHistory.create({
    data: {
      userId,
      action: 'generate',
      creditsUsed: user.plan === 'PRO' ? 0 : 1,
      details: { prompt: enhancedPrompt, requirements }
    }
  });

  // Save or update project if projectId provided
  let savedProject = null;
  if (projectId) {
    try {
      savedProject = await prisma.project.update({
        where: { id: projectId, userId },
        data: {
          floorPlanData: floorPlan,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      // Project doesn't exist or user doesn't own it
      console.warn('Failed to update project:', error);
    }
  }

  res.json({ 
    floorPlan, 
    projectId: savedProject?.id,
    creditsRemaining: user.plan === 'PRO' ? 'unlimited' : (user.credits - 1)
  });
});

// Analyze a floor plan with advanced AI
app.post('/api/analyze-plan', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { floorPlan } = req.body as { floorPlan: any };

  if (!floorPlan) {
    return res.status(400).json({ error: 'floorPlan is required' });
  }

  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Only PRO users get advanced analysis
  if (user.plan !== 'PRO') {
    return res.status(403).json({ error: 'Pro subscription required for advanced analysis' });
  }

  // === COMPREHENSIVE CIVIL ENGINEERING ANALYSIS ===
  
  // Enhanced calculations with metadata
  const metadata = floorPlan.metadata || {};
  let totalWallLength = 0;
  let loadBearingWallLength = 0;
  let partitionWallLength = 0;
  
  if (floorPlan.walls) {
    floorPlan.walls.forEach((wall: any) => {
      const length = Math.sqrt(Math.pow(wall.to.x - wall.from.x, 2) + Math.pow(wall.to.y - wall.from.y, 2));
      totalWallLength += length;
      if (wall.type === 'load_bearing') {
        loadBearingWallLength += length;
      } else if (wall.type === 'partition') {
        partitionWallLength += length;
      }
    });
  }

  let totalBuiltArea = 0;
  let roomAnalysis: any[] = [];
  if (floorPlan.rooms) {
    totalBuiltArea = floorPlan.rooms.reduce((acc: number, room: any) => 
      acc + (room.dimensions.width * room.dimensions.height), 0);
    
    // Detailed room analysis
    roomAnalysis = floorPlan.rooms.map((room: any) => {
      const area = room.dimensions.width * room.dimensions.height;
      const perimeter = 2 * (room.dimensions.width + room.dimensions.height);
      const aspectRatio = room.dimensions.width / room.dimensions.height;
      
      return {
        id: room.id,
        type: room.type,
        area: area.toFixed(2),
        perimeter: perimeter.toFixed(2),
        aspectRatio: aspectRatio.toFixed(2),
        compliance: {
          minAreaCheck: area >= getMinRoomArea(room.type),
          ventilationCheck: room.ventilation ? room.ventilation.windows > 0 : false,
          accessibilityCheck: room.dimensions.width >= 0.8 && room.dimensions.height >= 0.8
        }
      };
    });
  }

  // Helper function for minimum room areas (IS codes)
  function getMinRoomArea(roomType: string): number {
    const minAreas: { [key: string]: number } = {
      'bedroom': 9.0,
      'master_bedroom': 12.0,
      'kitchen': 5.0,
      'bathroom': 3.0,
      'toilet': 1.2,
      'living_room': 12.0,
      'dining': 8.0,
      'study': 7.0
    };
    return minAreas[roomType] || 4.0;
  }

  // Structural load calculations
  const floors = metadata.floors || 1;
  const deadLoad = totalBuiltArea * 4; // kN (typical RCC slab)
  const liveLoad = totalBuiltArea * (floors > 1 ? 3 : 2); // kN (residential)
  const totalLoad = deadLoad + liveLoad;

  // Foundation analysis
  const foundationArea = totalBuiltArea * 1.2; // 20% extra for foundation
  const soilBearingCapacity = 150; // kN/m² (assumed medium soil)
  const requiredFoundationArea = totalLoad / soilBearingCapacity;

  // Advanced Analysis Results with AI insights
  const analysis = {
    summary: {
      totalArea: totalBuiltArea.toFixed(2),
      plotEfficiency: ((totalBuiltArea / (metadata.plotSize?.width * metadata.plotSize?.height || totalBuiltArea * 1.5)) * 100).toFixed(1),
      overallCompliance: roomAnalysis.every(r => r.compliance.minAreaCheck && r.compliance.accessibilityCheck) ? 'Compliant' : 'Needs Review',
      structuralEfficiency: foundationArea <= requiredFoundationArea ? 'Optimized' : 'Over-designed'
    },
    
    roomAnalysis,
    
    materialEstimation: {
      concrete: {
        foundation: `${(foundationArea * 0.6).toFixed(2)} m³`,
        beams: `${(totalWallLength * 0.23 * 0.3 * floors).toFixed(2)} m³`,
        columns: `${((floorPlan.structural?.columns?.length || Math.ceil(totalBuiltArea / 25)) * 0.3 * 0.3 * 3 * floors).toFixed(2)} m³`,
        slabs: `${(totalBuiltArea * 0.15 * floors).toFixed(2)} m³`,
        total: `${(foundationArea * 0.6 + totalWallLength * 0.23 * 0.3 * floors + (floorPlan.structural?.columns?.length || Math.ceil(totalBuiltArea / 25)) * 0.3 * 0.3 * 3 * floors + totalBuiltArea * 0.15 * floors).toFixed(2)} m³`
      },
      steel: {
        foundation: `${Math.floor(foundationArea * 15)} kg`,
        structural: `${Math.floor(totalBuiltArea * 45 * floors)} kg`,
        total: `${Math.floor(foundationArea * 15 + totalBuiltArea * 45 * floors)} kg (TMT bars)`
      },
      masonry: {
        loadBearing: `${Math.floor(loadBearingWallLength * 3 * 120)} nos (230mm thick)`,
        partition: `${Math.floor(partitionWallLength * 3 * 80)} nos (115mm thick)`,
        total: `${Math.floor(loadBearingWallLength * 3 * 120 + partitionWallLength * 3 * 80)} bricks`
      },
      cement: `${Math.floor(totalBuiltArea * 8)} bags (50kg each)`,
      sand: `${(totalBuiltArea * 0.6).toFixed(2)} m³`,
      aggregate: `${(totalBuiltArea * 0.9).toFixed(2)} m³`,
    },
    
    excavationQuantity: {
      foundationArea: `${foundationArea.toFixed(2)} m²`,
      depth: "1.5m (minimum as per IS 1904)",
      volume: `${(foundationArea * 1.5).toFixed(2)} m³`,
      backfill: `${(foundationArea * 0.8).toFixed(2)} m³`,
      soilDisposal: `${(foundationArea * 0.7).toFixed(2)} m³`,
    },
    
    structuralAnalysis: {
      loads: {
        deadLoad: `${deadLoad.toFixed(2)} kN`,
        liveLoad: `${liveLoad.toFixed(2)} kN`,
        totalLoad: `${totalLoad.toFixed(2)} kN`,
        loadPerSqm: `${(totalLoad / totalBuiltArea).toFixed(2)} kN/m²`
      },
      foundation: {
        type: requiredFoundationArea > foundationArea ? "Raft Foundation Required" : "Strip Foundation Adequate",
        bearingCapacity: `${soilBearingCapacity} kN/m² (assumed)`,
        requiredArea: `${requiredFoundationArea.toFixed(2)} m²`,
        providedArea: `${foundationArea.toFixed(2)} m²`,
        safetyFactor: (foundationArea / requiredFoundationArea).toFixed(2)
      },
      beamDesign: {
        main: `${Math.ceil(totalWallLength / 5)} nos (230x300mm RCC)`,
        secondary: `${Math.ceil(totalWallLength / 3)} nos (230x230mm RCC)`,
        lintel: `${(floorPlan.doors?.length || 0) + (floorPlan.windows?.length || 0)} nos (230x150mm)`
      },
      columnDesign: {
        count: floorPlan.structural?.columns?.length || Math.ceil(totalBuiltArea / 25),
        size: totalBuiltArea > 100 ? "300x300mm" : "230x230mm",
        reinforcement: totalBuiltArea > 100 ? "8-16mm + 8mm stirrups" : "4-12mm + 6mm stirrups"
      },
      compliance: {
        codes: ["IS 456:2000 (Concrete)", "IS 875:1987 (Loads)", "IS 1893:2016 (Seismic)"],
        status: "Preliminary design compliant, detailed analysis required"
      }
    },
    
    utilitiesAnalysis: {
      electrical: {
        connectedLoad: `${Math.floor(totalBuiltArea * 40)}W`,
        demandLoad: `${Math.floor(totalBuiltArea * 25)}W`,
        circuits: Math.ceil(totalBuiltArea / 30),
        points: {
          lights: Math.floor(totalBuiltArea / 10),
          fans: Math.floor(totalBuiltArea / 12),
          sockets: Math.floor(totalBuiltArea / 8),
          ac: Math.floor((floorPlan.rooms?.filter((r: any) => ['bedroom', 'living_room'].includes(r.type)).length || 0))
        },
        cabling: `${Math.floor(totalBuiltArea * 8)}m (2.5mm² & 4mm²)`,
        protection: `${Math.ceil(totalBuiltArea / 20)} MCBs, ELCB, Earthing`
      },
      plumbing: {
        waterDemand: `${Math.floor(totalBuiltArea * 135)}L/day (as per IS 1172)`,
        storage: `${Math.floor(totalBuiltArea * 0.5)}L overhead + ${Math.floor(totalBuiltArea * 0.3)}L underground`,
        supply: `${Math.floor(totalWallLength * 1.5)}m CPVC pipes`,
        drainage: `${Math.floor(totalBuiltArea * 1.2)}m PVC drainage`,
        fixtures: (floorPlan.services?.plumbing?.fixtures?.length || 0),
        hotWater: floorPlan.rooms?.filter((r: any) => ['bathroom', 'kitchen'].includes(r.type)).length || 0
      },
      hvac: {
        ventilationArea: `${Math.floor(totalBuiltArea * 0.1)}m² (10% of floor area)`,
        naturalVentilation: floorPlan.compliance?.ventilation?.crossVent ? 'Adequate' : 'Needs improvement',
        mechanicalSystems: `${floorPlan.rooms?.filter((r: any) => ['bathroom', 'kitchen'].includes(r.type)).length || 0} exhaust fans required`
      }
    },
    
    costEstimation: {
      breakdown: {
        civilWork: Math.floor(totalBuiltArea * 800),
        electrical: Math.floor(totalBuiltArea * 200),
        plumbing: Math.floor(totalBuiltArea * 150),
        finishes: Math.floor(totalBuiltArea * 450),
        fixtures: Math.floor(totalBuiltArea * 200),
        miscellaneous: Math.floor(totalBuiltArea * 100)
      },
      total: Math.floor(totalBuiltArea * 1900),
      perSqft: 1900,
      timeline: `${Math.ceil(totalBuiltArea / 8)} months`,
      contingency: Math.floor(totalBuiltArea * 190), // 10%
      grandTotal: Math.floor(totalBuiltArea * 2090)
    },
    
    complianceCheck: {
      buildingCodes: {
        NBC2016: roomAnalysis.every(r => r.compliance.minAreaCheck) ? 'Compliant' : 'Non-compliant',
        fireExit: (floorPlan.compliance?.fireExits?.length || 0) > 0 ? 'Provided' : 'Required',
        accessibility: roomAnalysis.every(r => r.compliance.accessibilityCheck) ? 'Compliant' : 'Needs ramps/wider doors',
        ventilation: floorPlan.compliance?.ventilation?.crossVent ? 'Adequate' : 'Insufficient'
      },
      recommendations: [
        roomAnalysis.some(r => !r.compliance.minAreaCheck) ? "Some rooms below minimum area requirements" : null,
        !floorPlan.compliance?.ventilation?.crossVent ? "Improve cross-ventilation design" : null,
        (floorPlan.compliance?.fireExits?.length || 0) === 0 ? "Add emergency exits as per NBC 2016" : null,
        foundationArea < requiredFoundationArea ? "Foundation area may be insufficient" : null
      ].filter(Boolean)
    },
    
    professionalAdvice: {
      criticalRecommendations: [
        foundationArea < requiredFoundationArea ? "⚠️ Foundation design needs review - consider raft foundation" : null,
        roomAnalysis.some(r => !r.compliance.minAreaCheck) ? "⚠️ Some rooms don't meet minimum area requirements" : null,
        !floorPlan.compliance?.ventilation?.crossVent ? "⚠️ Improve natural ventilation for comfort and code compliance" : null
      ].filter(Boolean),
      
      constructionPhases: [
        "1. Site survey and soil testing",
        "2. Excavation and foundation work",
        "3. Superstructure (columns, beams, slabs)",
        "4. Masonry and utility rough-in",
        "5. Plastering and utility finishing",
        "6. Flooring, painting, and fixtures",
        "7. Final inspections and handover"
      ],
      
      qualityControl: [
        "Concrete cube testing (28-day strength)",
        "Steel reinforcement inspection before concreting",
        "Electrical installation testing and certification",
        "Plumbing pressure testing",
        "Structural safety audit by qualified engineer",
        "Fire safety compliance check"
      ],
      
      sustainabilityFeatures: [
        "Rainwater harvesting system",
        "Solar water heating",
        "Energy-efficient lighting (LED)",
        "Proper insulation for thermal comfort",
        "Waste water recycling for gardening",
        "Natural lighting and ventilation optimization"
      ]
    }
  };

  // Record usage
  await prisma.usageHistory.create({
    data: {
      userId,
      action: 'analyze',
      creditsUsed: 0, // Free for PRO users
      details: { 
        totalArea: totalBuiltArea, 
        analysisType: 'comprehensive',
        roomCount: floorPlan.rooms?.length || 0
      }
    }
  });

  res.json(analysis);
});

// Get current user profile
app.get('/api/me', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, plan: user.plan, credits: user.credits, referralCode: user.referralCode, referralDiscountEligible: user.referralDiscountEligible, referralDiscountUsed: user.referralDiscountUsed });
});

// Create a Razorpay order with enhanced features
app.post('/api/payment/create-order', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { amount, currency, receipt, notes } = req.body as { 
    amount: number; 
    currency: string; 
    receipt: string; 
    notes?: any; 
  };
  
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let finalAmount = amount;
    let discountApplied = false;
    let discountReason = '';

    // Apply referral discount if eligible and not used
    const hasReferralDiscount = user.referralDiscountEligible && !user.referralDiscountUsed;
    
    // Check if referral code is provided in notes
    const referralCodeProvided = notes?.referralCode;
    
    if (hasReferralDiscount || referralCodeProvided) {
      if (referralCodeProvided && !hasReferralDiscount) {
        // Validate referral code
        const referrer = await prisma.user.findUnique({ 
          where: { referralCode: referralCodeProvided } 
        });
        
        if (referrer) {
          // Mark both users as eligible for referral discount
          await prisma.user.update({
            where: { id: req.userId! },
            data: { referralDiscountEligible: true, referredByCode: referralCodeProvided }
          });
          
          await prisma.user.update({
            where: { id: referrer.id },
            data: { referralDiscountEligible: true }
          });
          
          finalAmount = Math.floor(amount * 0.5);
          discountApplied = true;
          discountReason = 'referral_code';
        }
      } else if (hasReferralDiscount) {
        finalAmount = Math.floor(amount * 0.5);
        discountApplied = true;
        discountReason = 'referral_existing';
      }
    }

    // Set subscription expiry based on billing cycle
    const billingCycle = notes?.billing || 'monthly';
    const subscriptionExpiry = new Date();
    if (billingCycle === 'yearly') {
      subscriptionExpiry.setFullYear(subscriptionExpiry.getFullYear() + 1);
    } else {
      subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
    }

    const options = {
      amount: finalAmount * 100, // smallest currency unit
      currency,
      receipt,
      notes: {
        ...notes,
        originalAmount: amount,
        discountApplied,
        discountReason,
        subscriptionExpiry: subscriptionExpiry.toISOString()
      },
    } as const;
    
    const order = await razorpay.orders.create(options);
    
    res.json({ 
      ...order, 
      discounted: discountApplied, 
      finalAmount,
      originalAmount: amount,
      discountReason,
      savings: amount - finalAmount
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Verify a Razorpay payment
app.post('/api/payment/verify', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { order_id, payment_id, signature } = req.body as { order_id: string; payment_id: string; signature: string };

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(order_id + '|' + payment_id)
    .digest('hex');

  if (generated_signature === signature) {
    // Payment is successful
    try {
      // Get order details from Razorpay
      const order = await razorpay.orders.fetch(order_id);
      const notes = order.notes || {};
      
      // Set subscription expiry
      const subscriptionExpiry = notes.subscriptionExpiry 
        ? new Date(notes.subscriptionExpiry)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

      await prisma.user.update({
        where: { id: req.userId! },
        data: {
          plan: 'PRO',
          subscriptionId: order_id,
          subscriptionExpiry,
          referralDiscountUsed: notes.discountApplied ? true : undefined,
          credits: 9999,
        },
      });

      // Record subscription in usage history
      await prisma.usageHistory.create({
        data: {
          userId: req.userId!,
          action: 'subscription',
          creditsUsed: 0,
          details: {
            orderId: order_id,
            paymentId: payment_id,
            billing: notes.billing || 'monthly',
            amount: notes.originalAmount || order.amount_paid,
            discountApplied: notes.discountApplied || false,
            subscriptionExpiry: subscriptionExpiry.toISOString()
          }
        }
      });

      res.json({ 
        message: 'Payment verified successfully', 
        plan: 'PRO',
        subscriptionExpiry: subscriptionExpiry.toISOString(),
        discountApplied: notes.discountApplied || false
      });
    } catch (error) {
      console.error('Payment verification error:', error);
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
    } as const;
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Verify credits purchase and add to user
app.post('/api/payment/verify-credits', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { order_id, payment_id, signature } = req.body as { order_id: string; payment_id: string; signature: string };

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(order_id + '|' + payment_id)
    .digest('hex');

  if (generated_signature === signature) {
    try {
      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: { credits: { increment: 10 } },
      });
      
      // Record credit purchase
      await prisma.usageHistory.create({
        data: {
          userId: req.userId!,
          action: 'credit_purchase',
          creditsUsed: -10, // Negative indicates credits added
          details: { orderId: order_id, paymentId: payment_id }
        }
      });

      res.json({ message: 'Credits added successfully', credits: user.credits });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add credits' });
    }
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});

// === PROJECT MANAGEMENT APIs ===

// Create a new project
app.post('/api/projects', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { name, description, floorPlanData } = req.body as {
    name: string;
    description?: string;
    floorPlanData?: any;
  };

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        floorPlanData: floorPlanData || {},
        userId: req.userId!,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get user's projects
app.get('/api/projects', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
      },
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get a specific project
app.get('/api/projects/:id', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: req.userId! },
          { isPublic: true }
        ]
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update a project
app.put('/api/projects/:id', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { id } = req.params;
  const { name, description, floorPlanData, analysisData } = req.body as {
    name?: string;
    description?: string;
    floorPlanData?: any;
    analysisData?: any;
  };

  try {
    // Check if user owns the project
    const existingProject = await prisma.project.findFirst({
      where: { id, userId: req.userId! }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Create a version backup before updating
    await prisma.projectVersion.create({
      data: {
        projectId: id,
        version: existingProject.version,
        floorPlanData: existingProject.floorPlanData,
        analysisData: existingProject.analysisData,
        changeDescription: 'Auto-backup before update'
      }
    });

    // Update the project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(floorPlanData && { floorPlanData }),
        ...(analysisData && { analysisData }),
        version: { increment: 1 },
        updatedAt: new Date()
      },
    });

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
app.delete('/api/projects/:id', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId! }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project versions/history
app.get('/api/projects/:id/versions', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { id } = req.params;

  try {
    // Check if user owns the project
    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId! }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    const versions = await prisma.projectVersion.findMany({
      where: { projectId: id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        changeDescription: true,
        createdAt: true,
      }
    });

    res.json(versions);
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: 'Failed to fetch project versions' });
  }
});

// Restore project to a specific version
app.post('/api/projects/:id/restore/:versionId', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  const { id, versionId } = req.params;

  try {
    // Check if user owns the project
    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId! }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    const version = await prisma.projectVersion.findFirst({
      where: { id: versionId, projectId: id }
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Create backup of current version
    await prisma.projectVersion.create({
      data: {
        projectId: id,
        version: project.version,
        floorPlanData: project.floorPlanData,
        analysisData: project.analysisData,
        changeDescription: `Backup before restore to v${version.version}`
      }
    });

    // Restore the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        floorPlanData: version.floorPlanData,
        analysisData: version.analysisData,
        version: { increment: 1 },
        updatedAt: new Date()
      }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({ error: 'Failed to restore project version' });
  }
});

// Get user's usage history
app.get('/api/usage-history', requireAuth, async (req: Request & { userId?: number }, res: Response) => {
  try {
    const history = await prisma.usageHistory.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 entries
    });

    res.json(history);
  } catch (error) {
    console.error('Get usage history error:', error);
    res.status(500).json({ error: 'Failed to fetch usage history' });
  }
});

// Attempt to connect to DB with retries, but don't crash the server if unreachable
async function startServer() {
  const maxRetries = 5;
  let connected = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      connected = true;
      break;
    } catch (err: any) {
      console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, err?.message || err);
      if (attempt < maxRetries) {
        // Wait an increasing amount of time before retrying (exponential back-off)
        const delayMs = 2000 * attempt;
        console.log(`🔄 Retrying in ${delayMs / 1000}s...`);
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }

  if (!connected) {
    console.warn('⚠️  Could not connect to the database after retries. The server will still start; DB-dependent routes will error until connectivity is restored.');
  }

  app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
  });
}

// Start the server (async)
startServer();
