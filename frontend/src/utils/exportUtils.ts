// Export utilities for floor plans
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'svg' | 'dxf' | 'json';
  quality?: 'low' | 'medium' | 'high';
  includeAnalysis?: boolean;
  includeSpecs?: boolean;
  paperSize?: 'a4' | 'a3' | 'a2' | 'a1';
}

export class FloorPlanExporter {
  
  static async exportToPDF(
    canvasElement: HTMLCanvasElement | null, 
    floorPlan: any, 
    analysisData?: any,
    options: ExportOptions = { format: 'pdf' }
  ): Promise<void> {
    if (!canvasElement) {
      throw new Error('Canvas element not found');
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: options.paperSize || 'a4'
    });

    // Add title page
    pdf.setFontSize(24);
    pdf.text('Floor Plan Design', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    
    if (floorPlan.metadata) {
      pdf.text(`Total Area: ${floorPlan.metadata.totalArea || 'N/A'} sq.m`, 20, 55);
      pdf.text(`Style: ${floorPlan.metadata.style || 'Modern'}`, 20, 65);
      pdf.text(`Floors: ${floorPlan.metadata.floors || 1}`, 20, 75);
    }

    // Add floor plan image directly from the provided canvas
    try {
      const imgData = canvasElement.toDataURL('image/png');
      const imgWidth = 250; // mm
      const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;

      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Floor Plan Layout', 20, 20);
      pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error capturing canvas:', error);
    }

    // Add room details
    if (floorPlan.rooms) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Room Details', 20, 20);
      
      let yPos = 35;
      pdf.setFontSize(10);
      
      floorPlan.rooms.forEach((room: any, index: number) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.text(`${index + 1}. ${room.label}`, 20, yPos);
        pdf.text(`Type: ${room.type}`, 30, yPos + 8);
        pdf.text(`Dimensions: ${room.dimensions.width}m x ${room.dimensions.height}m`, 30, yPos + 16);
        pdf.text(`Area: ${(room.dimensions.width * room.dimensions.height).toFixed(2)} sq.m`, 30, yPos + 24);
        
        yPos += 35;
      });
    }

    // Add analysis data if available
    if (analysisData && options.includeAnalysis) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Engineering Analysis', 20, 20);
      
      let yPos = 35;
      pdf.setFontSize(10);

      // Material estimation
      if (analysisData.materialEstimation) {
        pdf.setFontSize(12);
        pdf.text('Material Estimation:', 20, yPos);
        yPos += 10;
        
        pdf.setFontSize(10);
        if (analysisData.materialEstimation.concrete) {
          pdf.text(`Concrete: ${analysisData.materialEstimation.concrete.total}`, 25, yPos);
          yPos += 8;
        }
        if (analysisData.materialEstimation.steel) {
          pdf.text(`Steel: ${analysisData.materialEstimation.steel.total || analysisData.materialEstimation.steel}`, 25, yPos);
          yPos += 8;
        }
        if (analysisData.materialEstimation.masonry) {
          pdf.text(`Bricks: ${analysisData.materialEstimation.masonry.total || analysisData.materialEstimation.bricks}`, 25, yPos);
          yPos += 8;
        }
        yPos += 10;
      }

      // Cost estimation
      if (analysisData.costEstimation) {
        pdf.setFontSize(12);
        pdf.text('Cost Estimation:', 20, yPos);
        yPos += 10;
        
        pdf.setFontSize(10);
        if (analysisData.costEstimation.breakdown) {
          Object.entries(analysisData.costEstimation.breakdown).forEach(([key, value]) => {
            pdf.text(`${key}: ₹${(value as number).toLocaleString('en-IN')}`, 25, yPos);
            yPos += 8;
          });
        }
        
        pdf.setFontSize(11);
        pdf.text(`Total: ₹${analysisData.costEstimation.grandTotal?.toLocaleString('en-IN') || analysisData.costEstimation.total?.toLocaleString('en-IN')}`, 25, yPos + 5);
      }
    }

    // Add specifications page
    if (options.includeSpecs) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Technical Specifications', 20, 20);
      
      const specs = [
        'Foundation: RCC strip foundation with 1.5m depth',
        'Walls: Load bearing - 230mm brick masonry, Partition - 115mm',
        'Roofing: RCC slab with 150mm thickness',
        'Electrical: As per IS 732, adequate points and circuits',
        'Plumbing: CPVC pipes for supply, PVC for drainage',
        'Compliance: IS 456:2000, IS 875:1987, NBC 2016',
        '',
        'Note: This is a preliminary design. Detailed structural',
        'analysis by a qualified engineer is recommended before construction.'
      ];
      
      let yPos = 35;
      pdf.setFontSize(10);
      
      specs.forEach(spec => {
        pdf.text(spec, 20, yPos);
        yPos += 8;
      });
    }

    // Save the PDF
    const fileName = `floor-plan-${Date.now()}.pdf`;
    pdf.save(fileName);
  }

  static async exportToPNG(
    canvasElement: HTMLCanvasElement | null,
    options: ExportOptions = { format: 'png' }
  ): Promise<void> {
    if (!canvasElement) {
      throw new Error('Canvas element not found');
    }

    try {
      // Create download link directly from the canvas element
      const link = document.createElement('a');
      link.download = `floor-plan-${Date.now()}.png`;
      link.href = canvasElement.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting PNG:', error);
      throw error;
    }
  }

  static async exportToSVG(floorPlan: any): Promise<void> {
    // Generate SVG from floor plan data
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .wall { stroke: #374151; stroke-width: 8; }
      .room { fill: rgba(59, 130, 246, 0.1); stroke: #3b82f6; stroke-width: 2; }
      .text { font-family: Arial; font-size: 14px; fill: #1f2937; }
      .utility { fill: rgba(245, 158, 11, 0.3); stroke: #f59e0b; stroke-width: 2; stroke-dasharray: 5,5; }
    </style>
  </defs>
`;

    // Add rooms
    if (floorPlan.rooms) {
      floorPlan.rooms.forEach((room: any) => {
        const x = room.dimensions.x * 50;
        const y = room.dimensions.y * 50;
        const width = room.dimensions.width * 50;
        const height = room.dimensions.height * 50;
        
        svgContent += `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" class="room" rx="4" />
  <text x="${x + 10}" y="${y + 20}" class="text">${room.label}</text>`;
      });
    }

    // Add walls
    if (floorPlan.walls) {
      floorPlan.walls.forEach((wall: any) => {
        svgContent += `
  <line x1="${wall.from.x * 50}" y1="${wall.from.y * 50}" x2="${wall.to.x * 50}" y2="${wall.to.y * 50}" class="wall" />`;
      });
    }

    // Add utilities
    if (floorPlan.utilities) {
      floorPlan.utilities.forEach((utility: any) => {
        const x = utility.area.x * 50;
        const y = utility.area.y * 50;
        const width = utility.area.width * 50;
        const height = utility.area.height * 50;
        
        svgContent += `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" class="utility" />
  <text x="${x + 5}" y="${y + 15}" class="text" font-size="11">${utility.note}</text>`;
      });
    }

    svgContent += '\n</svg>';

    // Download SVG
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `floor-plan-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async exportToDXF(floorPlan: any): Promise<void> {
    // Generate basic DXF content
    // Note: This is a simplified DXF export. For production use, consider using a proper DXF library
    let dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
WALLS
70
0
62
7
6
CONTINUOUS
0
LAYER
2
ROOMS
70
0
62
4
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    // Add walls as lines
    if (floorPlan.walls) {
      floorPlan.walls.forEach((wall: any) => {
        dxfContent += `0
LINE
8
WALLS
10
${wall.from.x}
20
${wall.from.y}
30
0
11
${wall.to.x}
21
${wall.to.y}
31
0
`;
      });
    }

    // Add rooms as polylines
    if (floorPlan.rooms) {
      floorPlan.rooms.forEach((room: any) => {
        const x = room.dimensions.x;
        const y = room.dimensions.y;
        const w = room.dimensions.width;
        const h = room.dimensions.height;
        
        dxfContent += `0
LWPOLYLINE
8
ROOMS
90
4
70
1
10
${x}
20
${y}
10
${x + w}
20
${y}
10
${x + w}
20
${y + h}
10
${x}
20
${y + h}
0
TEXT
8
ROOMS
10
${x + w/2}
20
${y + h/2}
30
0
40
0.5
1
${room.label}
`;
      });
    }

    dxfContent += `0
ENDSEC
0
EOF`;

    // Download DXF
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `floor-plan-${Date.now()}.dxf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async exportToJSON(floorPlan: any, analysisData?: any): Promise<void> {
    const exportData = {
      floorPlan,
      analysisData,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      software: 'Planix'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `floor-plan-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async exportFloorPlan(
    format: string,
    canvasElement: HTMLCanvasElement | null,
    floorPlan: any,
    analysisData?: any,
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const exportOptions: ExportOptions = {
      format: format as any,
      quality: 'high',
      includeAnalysis: true,
      includeSpecs: true,
      paperSize: 'a4',
      ...options
    };

    try {
      switch (format.toLowerCase()) {
        case 'pdf':
          await this.exportToPDF(canvasElement, floorPlan, analysisData, exportOptions);
          break;
        case 'png':
          await this.exportToPNG(canvasElement, exportOptions);
          break;
        case 'svg':
          await this.exportToSVG(floorPlan);
          break;
        case 'dxf':
          await this.exportToDXF(floorPlan);
          break;
        case 'json':
          await this.exportToJSON(floorPlan, analysisData);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
}
