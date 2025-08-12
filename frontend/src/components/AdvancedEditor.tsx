'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { motion } from 'framer-motion';

interface Tool {
  id: string;
  name: string;
  icon: string;
  cursor: string;
  description: string;
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

interface AdvancedEditorProps {
  floorPlan?: any;
  onSave?: (data: any) => void;
  onExport?: (format: string) => void;
  className?: string;
}

const tools: Tool[] = [
  { id: 'select', name: 'Select', icon: '↖️', cursor: 'default', description: 'Select and move objects' },
  { id: 'wall', name: 'Wall', icon: '📏', cursor: 'crosshair', description: 'Draw walls' },
  { id: 'room', name: 'Room', icon: '⬜', cursor: 'crosshair', description: 'Create rooms' },
  { id: 'door', name: 'Door', icon: '🚪', cursor: 'crosshair', description: 'Add doors' },
  { id: 'window', name: 'Window', icon: '🪟', cursor: 'crosshair', description: 'Add windows' },
  { id: 'dimension', name: 'Dimension', icon: '📐', cursor: 'crosshair', description: 'Add dimensions' },
  { id: 'text', name: 'Text', icon: '📝', cursor: 'text', description: 'Add text labels' },
  { id: 'measure', name: 'Measure', icon: '📏', cursor: 'crosshair', description: 'Measure distances' },
  { id: 'pan', name: 'Pan', icon: '✋', cursor: 'move', description: 'Pan the view' },
  { id: 'zoom', name: 'Zoom', icon: '🔍', cursor: 'zoom-in', description: 'Zoom in/out' },
];

const defaultLayers: Layer[] = [
  { id: 'walls', name: 'Walls', visible: true, locked: false, color: '#374151' },
  { id: 'rooms', name: 'Rooms', visible: true, locked: false, color: '#3b82f6' },
  { id: 'doors', name: 'Doors', visible: true, locked: false, color: '#10b981' },
  { id: 'windows', name: 'Windows', visible: true, locked: false, color: '#06b6d4' },
  { id: 'dimensions', name: 'Dimensions', visible: true, locked: false, color: '#8b5cf6' },
  { id: 'text', name: 'Text', visible: true, locked: false, color: '#ef4444' },
  { id: 'utilities', name: 'Utilities', visible: true, locked: false, color: '#f59e0b' },
  { id: 'structural', name: 'Structural', visible: true, locked: false, color: '#6b7280' },
];

export default function AdvancedEditor({ floorPlan, onSave, onExport, className }: AdvancedEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [zoom, setZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);
  const [properties, setProperties] = useState<any>({});

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvas.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        selection: true,
      });

      // Add grid
      if (gridVisible) {
        drawGrid();
      }

      // Set up event listeners
      setupEventListeners();
    }

    return () => {
      fabricCanvas.current?.dispose();
    };
  }, []);

  // Update grid when settings change
  useEffect(() => {
    if (fabricCanvas.current) {
      if (gridVisible) {
        drawGrid();
      } else {
        removeGrid();
      }
    }
  }, [gridVisible, gridSize]);

  // Load floor plan data
  useEffect(() => {
    if (floorPlan && fabricCanvas.current) {
      loadFloorPlan(floorPlan);
    }
  }, [floorPlan]);

  const drawGrid = useCallback(() => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    const gridGroup = new fabric.Group([], {
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });

    // Vertical lines
    for (let i = 0; i <= canvas.width!; i += gridSize) {
      const line = new fabric.Line([i, 0, i, canvas.height!], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      gridGroup.addWithUpdate(line);
    }

    // Horizontal lines
    for (let i = 0; i <= canvas.height!; i += gridSize) {
      const line = new fabric.Line([0, i, canvas.width!, i], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      gridGroup.addWithUpdate(line);
    }

    canvas.add(gridGroup);
    canvas.sendToBack(gridGroup);
    canvas.renderAll();
  }, [gridSize]);

  const removeGrid = useCallback(() => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj.excludeFromExport) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
  }, []);

  const setupEventListeners = useCallback(() => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;

    // Selection events
    canvas.on('selection:created', (e) => {
      setSelectedObjects(e.selected || []);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObjects(e.selected || []);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObjects([]);
    });

    // Drawing events
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    // Zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom();
      newZoom *= 0.999 ** delta;
      if (newZoom > 20) newZoom = 20;
      if (newZoom < 0.01) newZoom = 0.01;
      
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }, []);

  const handleMouseDown = useCallback((opt: any) => {
    if (activeTool === 'select') return;

    const pointer = fabricCanvas.current?.getPointer(opt.e);
    if (!pointer) return;

    setIsDrawing(true);

    switch (activeTool) {
      case 'wall':
        startDrawingWall(pointer);
        break;
      case 'room':
        startDrawingRoom(pointer);
        break;
      case 'door':
        addDoor(pointer);
        break;
      case 'window':
        addWindow(pointer);
        break;
      case 'text':
        addText(pointer);
        break;
    }
  }, [activeTool]);

  const handleMouseMove = useCallback((opt: any) => {
    if (!isDrawing || activeTool === 'select') return;

    const pointer = fabricCanvas.current?.getPointer(opt.e);
    if (!pointer) return;

    // Handle drawing updates
    // Implementation depends on active tool
  }, [isDrawing, activeTool]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const startDrawingWall = useCallback((pointer: any) => {
    if (!fabricCanvas.current) return;

    const wall = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: '#374151',
      strokeWidth: 8,
      selectable: true,
      layer: 'walls',
    });

    fabricCanvas.current.add(wall);
  }, []);

  const startDrawingRoom = useCallback((pointer: any) => {
    if (!fabricCanvas.current) return;

    const room = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 100,
      height: 100,
      fill: 'rgba(59, 130, 246, 0.1)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      selectable: true,
      layer: 'rooms',
    });

    fabricCanvas.current.add(room);
  }, []);

  const addDoor = useCallback((pointer: any) => {
    if (!fabricCanvas.current) return;

    const door = new fabric.Rect({
      left: pointer.x - 15,
      top: pointer.y - 40,
      width: 30,
      height: 80,
      fill: '#10b981',
      stroke: '#065f46',
      strokeWidth: 2,
      selectable: true,
      layer: 'doors',
    });

    fabricCanvas.current.add(door);
  }, []);

  const addWindow = useCallback((pointer: any) => {
    if (!fabricCanvas.current) return;

    const window = new fabric.Rect({
      left: pointer.x - 25,
      top: pointer.y - 10,
      width: 50,
      height: 20,
      fill: '#06b6d4',
      stroke: '#0891b2',
      strokeWidth: 2,
      selectable: true,
      layer: 'windows',
    });

    fabricCanvas.current.add(window);
  }, []);

  const addText = useCallback((pointer: any) => {
    if (!fabricCanvas.current) return;

    const text = new fabric.Textbox('Label', {
      left: pointer.x,
      top: pointer.y,
      fontSize: 14,
      fontFamily: 'Inter',
      fill: '#1f2937',
      selectable: true,
      layer: 'text',
    });

    fabricCanvas.current.add(text);
  }, []);

  const loadFloorPlan = useCallback((plan: any) => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    canvas.clear();

    if (gridVisible) {
      drawGrid();
    }

    // Load rooms
    if (plan.rooms) {
      plan.rooms.forEach((room: any) => {
        const rect = new fabric.Rect({
          left: room.dimensions.x * 50,
          top: room.dimensions.y * 50,
          width: room.dimensions.width * 50,
          height: room.dimensions.height * 50,
          fill: 'rgba(59, 130, 246, 0.1)',
          stroke: '#3b82f6',
          strokeWidth: 2,
          selectable: true,
          layer: 'rooms',
        });

        const label = new fabric.Textbox(room.label, {
          left: room.dimensions.x * 50 + 10,
          top: room.dimensions.y * 50 + 10,
          fontSize: 14,
          fontFamily: 'Inter',
          fill: '#1f2937',
          selectable: true,
          layer: 'text',
        });

        canvas.add(rect, label);
      });
    }

    // Load walls
    if (plan.walls) {
      plan.walls.forEach((wall: any) => {
        const line = new fabric.Line([
          wall.from.x * 50,
          wall.from.y * 50,
          wall.to.x * 50,
          wall.to.y * 50
        ], {
          stroke: '#374151',
          strokeWidth: wall.thickness || 8,
          selectable: true,
          layer: 'walls',
        });

        canvas.add(line);
      });
    }

    // Load doors
    if (plan.doors) {
      plan.doors.forEach((door: any) => {
        const doorRect = new fabric.Rect({
          left: door.position.x * 50 - door.width * 25,
          top: door.position.y * 50 - door.height * 25,
          width: door.width * 50,
          height: door.height * 50,
          fill: '#10b981',
          stroke: '#065f46',
          strokeWidth: 2,
          selectable: true,
          layer: 'doors',
        });

        canvas.add(doorRect);
      });
    }

    // Load windows
    if (plan.windows) {
      plan.windows.forEach((window: any) => {
        const windowRect = new fabric.Rect({
          left: window.position.x * 50 - window.width * 25,
          top: window.position.y * 50 - window.height * 25,
          width: window.width * 50,
          height: window.height * 50,
          fill: '#06b6d4',
          stroke: '#0891b2',
          strokeWidth: 2,
          selectable: true,
          layer: 'windows',
        });

        canvas.add(windowRect);
      });
    }

    canvas.renderAll();
  }, [gridVisible, drawGrid]);

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);
    
    if (fabricCanvas.current) {
      fabricCanvas.current.defaultCursor = tools.find(t => t.id === toolId)?.cursor || 'default';
      
      if (toolId === 'select') {
        fabricCanvas.current.selection = true;
        fabricCanvas.current.forEachObject((obj) => {
          obj.selectable = true;
        });
      } else {
        fabricCanvas.current.selection = false;
        fabricCanvas.current.discardActiveObject();
        fabricCanvas.current.forEachObject((obj) => {
          obj.selectable = false;
        });
      }
      
      fabricCanvas.current.renderAll();
    }
  };

  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    let newZoom = canvas.getZoom();

    switch (direction) {
      case 'in':
        newZoom = Math.min(newZoom * 1.2, 20);
        break;
      case 'out':
        newZoom = Math.max(newZoom / 1.2, 0.01);
        break;
      case 'fit':
        newZoom = 1;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        break;
    }

    if (direction !== 'fit') {
      canvas.setZoom(newZoom);
    }
    
    setZoom(newZoom);
    canvas.renderAll();
  };

  const toggleLayer = (layerId: string) => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const newLayers = layers.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    setLayers(newLayers);

    // Toggle visibility of objects in this layer
    canvas.forEachObject((obj: any) => {
      if (obj.layer === layerId) {
        obj.visible = !layer.visible;
      }
    });

    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvas.current) return;

    const activeObjects = fabricCanvas.current.getActiveObjects();
    activeObjects.forEach(obj => {
      fabricCanvas.current?.remove(obj);
    });
    
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
  };

  const duplicateSelected = () => {
    if (!fabricCanvas.current) return;

    const activeObjects = fabricCanvas.current.getActiveObjects();
    activeObjects.forEach(obj => {
      obj.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        fabricCanvas.current?.add(cloned);
      });
    });

    fabricCanvas.current.renderAll();
  };

  const saveProject = () => {
    if (!fabricCanvas.current || !onSave) return;

    const canvasData = fabricCanvas.current.toJSON(['layer']);
    onSave(canvasData);
  };

  const exportProject = (format: string) => {
    if (!fabricCanvas.current || !onExport) return;

    onExport(format);
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Left Toolbar */}
      <motion.div
        className="w-16 bg-white border-r border-gray-200 flex flex-col"
        initial={{ x: -64 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-2 space-y-1">
          {tools.map((tool) => (
            <motion.button
              key={tool.id}
              onClick={() => handleToolChange(tool.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-colors ${
                activeTool === tool.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={tool.description}
            >
              {tool.icon}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <motion.div
          className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4"
          initial={{ y: -56 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoom('out')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Zoom Out"
              >
                🔍-
              </button>
              <span className="text-sm font-mono min-w-16 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom('in')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Zoom In"
              >
                🔍+
              </button>
              <button
                onClick={() => handleZoom('fit')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Fit to Screen"
              >
                📐
              </button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={gridVisible}
                  onChange={(e) => setGridVisible(e.target.checked)}
                />
                Grid
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                />
                Snap
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={duplicateSelected}
              disabled={selectedObjects.length === 0}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded"
            >
              Duplicate
            </button>
            <button
              onClick={deleteSelected}
              disabled={selectedObjects.length === 0}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 rounded"
            >
              Delete
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <button
              onClick={saveProject}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => exportProject('pdf')}
              className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Export
            </button>
          </div>
        </motion.div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="border-none"
            style={{ cursor: tools.find(t => t.id === activeTool)?.cursor }}
          />
        </div>
      </div>

      {/* Right Panel - Layers & Properties */}
      <motion.div
        className="w-80 bg-white border-l border-gray-200 flex flex-col"
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Layers Panel */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold mb-3">Layers</h3>
          <div className="space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
              >
                <button
                  onClick={() => toggleLayer(layer.id)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    layer.visible ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}
                >
                  {layer.visible && <span className="text-white text-xs">✓</span>}
                </button>
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-sm flex-1">{layer.name}</span>
                <button
                  className={`text-xs px-2 py-1 rounded ${
                    layer.locked ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {layer.locked ? '🔒' : '🔓'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="p-4 flex-1">
          <h3 className="font-semibold mb-3">Properties</h3>
          {selectedObjects.length > 0 ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Objects Selected</label>
                <p className="text-sm text-gray-600">{selectedObjects.length} item(s)</p>
              </div>
              
              {selectedObjects.length === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X"
                        className="input text-sm"
                        value={Math.round(selectedObjects[0].left || 0)}
                        onChange={(e) => {
                          if (selectedObjects[0]) {
                            selectedObjects[0].set('left', parseInt(e.target.value));
                            fabricCanvas.current?.renderAll();
                          }
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Y"
                        className="input text-sm"
                        value={Math.round(selectedObjects[0].top || 0)}
                        onChange={(e) => {
                          if (selectedObjects[0]) {
                            selectedObjects[0].set('top', parseInt(e.target.value));
                            fabricCanvas.current?.renderAll();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Width"
                        className="input text-sm"
                        value={Math.round(selectedObjects[0].width || 0)}
                        onChange={(e) => {
                          if (selectedObjects[0]) {
                            selectedObjects[0].set('width', parseInt(e.target.value));
                            fabricCanvas.current?.renderAll();
                          }
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        className="input text-sm"
                        value={Math.round(selectedObjects[0].height || 0)}
                        onChange={(e) => {
                          if (selectedObjects[0]) {
                            selectedObjects[0].set('height', parseInt(e.target.value));
                            fabricCanvas.current?.renderAll();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Rotation</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      className="w-full"
                      value={selectedObjects[0].angle || 0}
                      onChange={(e) => {
                        if (selectedObjects[0]) {
                          selectedObjects[0].set('angle', parseInt(e.target.value));
                          fabricCanvas.current?.renderAll();
                        }
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round(selectedObjects[0].angle || 0)}°
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select an object to view properties</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
