// Improved AI generation system with better error handling and multiple providers

const improvedGenerateFloorPlan = async (req, res) => {
  try {
    console.log(`🚀 Generation request started at ${new Date().toISOString()}`);
    
    const { prompt, projectId, requirements } = req.body;
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Admin check
    const ADMIN_EMAILS = ['nunisaalex456@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    console.log(`👤 User: ${user.email} (${isAdmin ? 'ADMIN' : user.plan})`);
    
    // Skip limits for admin
    if (!isAdmin) {
      // Check limits here...
    }

    let floorPlan = null;
    let aiProvider = 'unknown';
    const errors = [];

    // Enhanced provider system
    const providers = [
      {
        name: 'gemini-pro-latest',
        priority: 1,
        generate: async () => {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) throw new Error('Gemini API key not configured');
          
          console.log('🔑 Gemini key found, making request...');
          
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-pro-latest',
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
            },
          });

          const result = await model.generateContent(buildFloorPlanPrompt(prompt, requirements));
          const text = result.response.text();
          
          if (!text || text.trim() === '') {
            throw new Error('Empty response from Gemini');
          }
          
          console.log(`✅ Gemini response: ${text.length} chars`);
          return JSON.parse(text);
        }
      },
      {
        name: 'openai-gpt4',
        priority: 2,
        generate: async () => {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) throw new Error('OpenAI API key not configured');
          
          console.log('🔑 OpenAI key found, making request...');
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4-turbo-preview',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert architect. Generate floor plans in JSON format only.'
                },
                {
                  role: 'user',
                  content: buildFloorPlanPrompt(prompt, requirements)
                }
              ],
              temperature: 0.2,
              max_tokens: 4000,
              response_format: { type: 'json_object' }
            })
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (!content) throw new Error('Empty response from OpenAI');
          
          return JSON.parse(content);
        }
      }
    ];

    // Try each provider
    for (const provider of providers.sort((a, b) => a.priority - b.priority)) {
      try {
        console.log(`🤖 [${provider.priority}] Trying ${provider.name}...`);
        
        // Add timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`${provider.name} timed out`)), 60000)
        );
        
        floorPlan = await Promise.race([provider.generate(), timeoutPromise]);
        aiProvider = provider.name;
        console.log(`✅ Success with ${provider.name}`);
        break;
        
      } catch (error) {
        const errorMsg = error.message || 'Unknown error';
        errors.push(`${provider.name}: ${errorMsg}`);
        console.error(`❌ ${provider.name} failed:`, errorMsg);
        
        if (errorMsg.includes('429') || errorMsg.includes('quota')) {
          console.log(`⏰ ${provider.name} rate limited`);
        } else if (errorMsg.includes('API key')) {
          console.log(`🔑 ${provider.name} API key issue`);
        }
        
        continue;
      }
    }

    // Fallback if all providers failed
    if (!floorPlan) {
      console.log('🛡️ All providers failed, using fallback...');
      aiProvider = 'fallback';
      
      floorPlan = {
        title: "Sample Floor Plan",
        description: "AI generation temporarily unavailable",
        totalArea: requirements?.area || 1500,
        rooms: [
          {
            id: "living-room",
            label: "Living Room", 
            type: "living",
            dimensions: { x: 2, y: 2, width: 8, height: 5 },
            area: 400,
            features: ["Large windows", "Open concept"]
          },
          {
            id: "kitchen",
            label: "Kitchen",
            type: "kitchen",
            dimensions: { x: 10, y: 2, width: 6, height: 4 },
            area: 240,
            features: ["Island", "Modern appliances"]
          }
        ],
        walls: [
          { id: "w1", start: { x: 0, y: 0 }, end: { x: 18, y: 0 }, thickness: 0.2, type: "exterior" },
          { id: "w2", start: { x: 18, y: 0 }, end: { x: 18, y: 12 }, thickness: 0.2, type: "exterior" },
          { id: "w3", start: { x: 18, y: 12 }, end: { x: 0, y: 12 }, thickness: 0.2, type: "exterior" },
          { id: "w4", start: { x: 0, y: 12 }, end: { x: 0, y: 0 }, thickness: 0.2, type: "exterior" }
        ],
        doors: [
          { id: "d1", position: { x: 9, y: 0 }, width: 0.9, orientation: "horizontal", type: "main" }
        ],
        windows: [
          { id: "win1", position: { x: 4, y: 0 }, width: 2, orientation: "horizontal" },
          { id: "win2", position: { x: 13, y: 0 }, width: 1.5, orientation: "horizontal" }
        ],
        engineeringNotes: [
          "Sample plan - AI services temporarily unavailable",
          "Professional structural analysis required",
          "All dimensions are approximate"
        ]
      };
    }

    // Save project
    let savedProject = null;
    try {
      if (projectId) {
        savedProject = await prisma.project.update({
          where: { id: projectId, userId },
          data: { floorPlan, updatedAt: new Date(), aiProvider }
        });
      } else {
        savedProject = await prisma.project.create({
          data: {
            name: `Floor Plan - ${new Date().toLocaleDateString()}`,
            description: prompt.substring(0, 200),
            floorPlan,
            userId,
            aiProvider
          }
        });
      }
      console.log(`💾 Project saved: ${savedProject.id}`);
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
    }

    // Update user stats (skip for admin)
    if (!isAdmin) {
      try {
        const updateData = { planGenerations: { increment: 1 } };
        if (user.plan === 'FREE') {
          updateData.credits = { decrement: 1 };
        }
        await prisma.user.update({ where: { id: userId }, data: updateData });
        console.log(`📊 User stats updated`);
      } catch (updateError) {
        console.error('❌ User update error:', updateError);
      }
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const planLimits = getPlanLimits(user.plan);

    const response = {
      floorPlan,
      projectId: savedProject?.id,
      aiProvider,
      planInfo: {
        currentPlan: isAdmin ? 'PRO_PLUS' : user.plan,
        generationsUsed: isAdmin ? 0 : (updatedUser?.planGenerations || 0),
        generationsLimit: isAdmin ? 'unlimited' : planLimits.maxGenerations,
        creditsRemaining: isAdmin ? 'unlimited' : (user.plan === 'FREE' ? (updatedUser?.credits || 0) : 'unlimited'),
        projectsCreated: updatedUser?.projectsCreated || 0,
        projectsLimit: isAdmin ? 'unlimited' : planLimits.maxProjects,
        canUpgrade: !isAdmin && user.plan !== 'PRO_PLUS'
      },
      message: aiProvider === 'fallback' 
        ? '⚠️ AI generation temporarily unavailable. Showing sample plan.' 
        : `✅ Generated with ${aiProvider}`,
      debug: process.env.NODE_ENV === 'development' ? { 
        errors, 
        isAdmin, 
        userEmail: user.email,
        apiKeysConfigured: {
          gemini: !!process.env.GEMINI_API_KEY,
          openai: !!process.env.OPENAI_API_KEY,
          deepseek: !!process.env.DEEPSEEK_API_KEY
        }
      } : undefined
    };

    console.log(`✅ Response ready: ${aiProvider}, ${floorPlan?.rooms?.length || 0} rooms`);
    res.json(response);

  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    
    res.json({
      floorPlan: {
        title: "Emergency Floor Plan",
        description: "Service error - minimal layout",
        totalArea: 1000,
        rooms: [{
          id: "room1",
          label: "Main Room",
          type: "room", 
          dimensions: { x: 2, y: 2, width: 6, height: 4 },
          area: 240
        }],
        walls: [
          { id: "w1", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, thickness: 0.2, type: "exterior" },
          { id: "w2", start: { x: 10, y: 0 }, end: { x: 10, y: 8 }, thickness: 0.2, type: "exterior" },
          { id: "w3", start: { x: 10, y: 8 }, end: { x: 0, y: 8 }, thickness: 0.2, type: "exterior" },
          { id: "w4", start: { x: 0, y: 8 }, end: { x: 0, y: 0 }, thickness: 0.2, type: "exterior" }
        ],
        doors: [{ id: "d1", position: { x: 5, y: 0 }, width: 0.9, orientation: "horizontal", type: "main" }],
        windows: [{ id: "win1", position: { x: 2, y: 0 }, width: 1.5, orientation: "horizontal" }]
      },
      aiProvider: 'emergency-fallback',
      message: '🚨 Service error. Please try again or contact support.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = { improvedGenerateFloorPlan };
