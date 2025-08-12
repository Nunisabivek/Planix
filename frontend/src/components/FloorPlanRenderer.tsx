'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Room {
  id: string;
  type: string;
  dimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label: string;
  area?: number;
}

interface Wall {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: string;
  thickness?: number;
  material?: string;
}

interface Door {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  type?: string;
}

interface Window {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  type?: string;
}

interface FloorPlanData {
  rooms: Room[];
  walls?: Wall[];
  doors?: Door[];
  windows?: Window[];
  metadata?: {
    totalArea?: number;
    builtUpArea?: number;
    plotSize?: { width: number; height: number };
  };
}

interface FloorPlanRendererProps {
  floorPlan: FloorPlanData;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showDimensions?: boolean;
  interactive?: boolean;
  aiProvider?: string;
}

export default function FloorPlanRenderer({ 
  floorPlan, 
  width = 800, 
  height = 600, 
  showGrid = true,
  showDimensions = true,
  interactive = true,
  aiProvider = 'ai'
}: FloorPlanRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !floorPlan) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Calculate scale and offset to fit the floor plan
    const bounds = calculateBounds(floorPlan);
    const scaleX = (width - 100) / bounds.width;
    const scaleY = (height - 100) / bounds.height;
    const autoScale = Math.min(scaleX, scaleY, 1);
    
    setScale(autoScale);
    setOffset({
      x: (width - bounds.width * autoScale) / 2 - bounds.minX * autoScale,
      y: (height - bounds.height * autoScale) / 2 - bounds.minY * autoScale
    });

    renderFloorPlan(ctx, floorPlan, autoScale, {
      x: (width - bounds.width * autoScale) / 2 - bounds.minX * autoScale,
      y: (height - bounds.height * autoScale) / 2 - bounds.minY * autoScale
    });
  }, [floorPlan, width, height, selectedRoom]);

  const calculateBounds = (plan: FloorPlanData) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    plan.rooms.forEach(room => {
      const { x, y, width, height } = room.dimensions;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    return {
      minX: minX === Infinity ? 0 : minX,
      minY: minY === Infinity ? 0 : minY,
      maxX: maxX === -Infinity ? 10 : maxX,
      maxY: maxY === -Infinity ? 10 : maxY,
      width: maxX === -Infinity ? 10 : maxX - (minX === Infinity ? 0 : minX),
      height: maxY === -Infinity ? 10 : maxY - (minY === Infinity ? 0 : minY)
    };
  };

  const renderFloorPlan = (ctx: CanvasRenderingContext2D, plan: FloorPlanData, scale: number, offset: { x: number; y: number }) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, scale, offset);
    }

    // Draw walls first (if available)
    if (plan.walls && plan.walls.length > 0) {
      drawWalls(ctx, plan.walls, scale, offset);
    }

    // Draw rooms
    drawRooms(ctx, plan.rooms, scale, offset);

    // Draw doors and windows
    if (plan.doors) drawDoors(ctx, plan.doors, scale, offset);
    if (plan.windows) drawWindows(ctx, plan.windows, scale, offset);

    // Draw dimensions if enabled
    if (showDimensions) {
      drawDimensions(ctx, plan.rooms, scale, offset);
    }

    // Draw AI provider badge
    drawAIBadge(ctx, aiProvider);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, scale: number, offset: { x: number; y: number }) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;

    const gridSize = 1 * scale; // 1 meter grid
    
    for (let x = offset.x % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = offset.y % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawWalls = (ctx: CanvasRenderingContext2D, walls: Wall[], scale: number, offset: { x: number; y: number }) => {
    walls.forEach(wall => {
      const thickness = (wall.thickness || 0.2) * scale;
      
      ctx.strokeStyle = wall.type === 'load_bearing' ? '#2d3748' : '#4a5568';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(wall.from.x * scale + offset.x, wall.from.y * scale + offset.y);
      ctx.lineTo(wall.to.x * scale + offset.x, wall.to.y * scale + offset.y);
      ctx.stroke();
    });
  };

  const drawRooms = (ctx: CanvasRenderingContext2D, rooms: Room[], scale: number, offset: { x: number; y: number }) => {
    rooms.forEach(room => {
      const x = room.dimensions.x * scale + offset.x;
      const y = room.dimensions.y * scale + offset.y;
      const w = room.dimensions.width * scale;
      const h = room.dimensions.height * scale;

      // Room colors based on type
      const roomColors: { [key: string]: { fill: string; stroke: string } } = {
        living_room: { fill: '#fef3c7', stroke: '#f59e0b' },
        kitchen: { fill: '#dbeafe', stroke: '#3b82f6' },
        bedroom: { fill: '#fce7f3', stroke: '#ec4899' },
        master_bedroom: { fill: '#fce7f3', stroke: '#be185d' },
        bathroom: { fill: '#e0f2fe', stroke: '#0891b2' },
        dining: { fill: '#f3e8ff', stroke: '#8b5cf6' },
        study: { fill: '#ecfdf5', stroke: '#10b981' },
        balcony: { fill: '#fff7ed', stroke: '#ea580c' },
        garage: { fill: '#f1f5f9', stroke: '#475569' },
        utility: { fill: '#fafafa', stroke: '#737373' },
        entrance: { fill: '#fdf4ff', stroke: '#a855f7' },
        staircase: { fill: '#f8fafc', stroke: '#64748b' },
        default: { fill: '#f9fafb', stroke: '#6b7280' }
      };

      const colors = roomColors[room.type] || roomColors.default;
      const isSelected = selectedRoom === room.id;

      // Fill room
      ctx.fillStyle = isSelected ? '#3b82f620' : colors.fill;
      ctx.fillRect(x, y, w, h);

      // Room border
      ctx.strokeStyle = isSelected ? '#3b82f6' : colors.stroke;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(x, y, w, h);

      // Room label
      ctx.fillStyle = '#1f2937';
      ctx.font = `${Math.max(12, 8 * scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      
      // Room name
      ctx.fillText(room.label, centerX, centerY - 8);
      
      // Room area
      if (room.area) {
        ctx.font = `${Math.max(10, 6 * scale)}px Arial`;
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`${room.area.toFixed(1)}m²`, centerX, centerY + 8);
      } else {
        const area = room.dimensions.width * room.dimensions.height;
        ctx.font = `${Math.max(10, 6 * scale)}px Arial`;
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`${area.toFixed(1)}m²`, centerX, centerY + 8);
      }
    });
  };

  const drawDoors = (ctx: CanvasRenderingContext2D, doors: Door[], scale: number, offset: { x: number; y: number }) => {
    doors.forEach(door => {
      const x = door.position.x * scale + offset.x;
      const y = door.position.y * scale + offset.y;
      const w = door.width * scale;

      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.stroke();

      // Door swing arc
      ctx.strokeStyle = '#8b451350';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, w, 0, Math.PI / 2);
      ctx.stroke();
    });
  };

  const drawWindows = (ctx: CanvasRenderingContext2D, windows: Window[], scale: number, offset: { x: number; y: number }) => {
    windows.forEach(window => {
      const x = window.position.x * scale + offset.x;
      const y = window.position.y * scale + offset.y;
      const w = window.width * scale;

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.stroke();

      // Window frame
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 2, y - 2, w + 4, 4);
    });
  };

  const drawDimensions = (ctx: CanvasRenderingContext2D, rooms: Room[], scale: number, offset: { x: number; y: number }) => {
    ctx.fillStyle = '#374151';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    rooms.forEach(room => {
      const x = room.dimensions.x * scale + offset.x;
      const y = room.dimensions.y * scale + offset.y;
      const w = room.dimensions.width * scale;
      const h = room.dimensions.height * scale;

      // Width dimension (top)
      ctx.fillText(`${room.dimensions.width.toFixed(1)}m`, x + w / 2, y - 5);
      
      // Height dimension (left)
      ctx.save();
      ctx.translate(x - 15, y + h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${room.dimensions.height.toFixed(1)}m`, 0, 0);
      ctx.restore();
    });
  };

  const drawAIBadge = (ctx: CanvasRenderingContext2D, provider: string) => {
    const badgeText = `Generated by ${provider.charAt(0).toUpperCase() + provider.slice(1)} AI`;
    ctx.fillStyle = '#00000020';
    ctx.fillRect(10, height - 30, 150, 20);
    
    ctx.fillStyle = '#374151';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(badgeText, 15, height - 17);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Find clicked room
    const clickedRoom = floorPlan.rooms.find(room => {
      const x = room.dimensions.x * scale + offset.x;
      const y = room.dimensions.y * scale + offset.y;
      const w = room.dimensions.width * scale;
      const h = room.dimensions.height * scale;

      return clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h;
    });

    setSelectedRoom(clickedRoom ? clickedRoom.id : null);
  };

  const getRoomTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      living_room: '🛋️',
      kitchen: '🍳',
      bedroom: '🛏️',
      master_bedroom: '👑',
      bathroom: '🚿',
      dining: '🍽️',
      study: '📚',
      balcony: '🌿',
      garage: '🚗',
      utility: '🔧',
      entrance: '🚪',
      staircase: '🪜',
    };
    return icons[type] || '📐';
  };

  return (
    <div className="relative bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-800">Professional Floor Plan</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} AI
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {floorPlan.metadata?.totalArea && (
            <span>Total: {floorPlan.metadata.totalArea}m²</span>
          )}
          <span>Scale: 1:{Math.round(1/scale)}m</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`border-0 ${interactive ? 'cursor-pointer' : ''}`}
          onClick={handleCanvasClick}
        />
        
        {/* Room info panel */}
        {selectedRoom && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 border max-w-xs"
          >
            {(() => {
              const room = floorPlan.rooms.find(r => r.id === selectedRoom);
              if (!room) return null;
              
              return (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getRoomTypeIcon(room.type)}</span>
                    <h4 className="font-semibold text-gray-800">{room.label}</h4>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Type: {room.type.replace('_', ' ')}</p>
                    <p>Dimensions: {room.dimensions.width}m × {room.dimensions.height}m</p>
                    <p>Area: {(room.dimensions.width * room.dimensions.height).toFixed(1)}m²</p>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-t bg-gray-50 text-sm">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid && setShowGrid(e.target.checked)}
              className="rounded"
            />
            <span>Grid</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={showDimensions}
              onChange={(e) => setShowDimensions && setShowDimensions(e.target.checked)}
              className="rounded"
            />
            <span>Dimensions</span>
          </label>
        </div>
        <div className="text-gray-500">
          Click rooms to view details • Professional CAD-style rendering
        </div>
      </div>
    </div>
  );
}
