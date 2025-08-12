'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloorPlanExporter, ExportOptions } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorPlan: any;
  analysisData?: any;
  canvasElement?: HTMLCanvasElement | null;
  projectName?: string;
  isPro?: boolean;
}

const exportFormats = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Professional document with plans and analysis',
    icon: '📄',
    extension: '.pdf',
    isPro: false
  },
  {
    id: 'png',
    name: 'PNG Image',
    description: 'High-quality image for presentations',
    icon: '🖼️',
    extension: '.png',
    isPro: false
  },
  {
    id: 'svg',
    name: 'SVG Vector',
    description: 'Scalable vector graphics for web use',
    icon: '📐',
    extension: '.svg',
    isPro: false
  },
  {
    id: 'dxf',
    name: 'DXF CAD',
    description: 'AutoCAD compatible format',
    icon: '🏗️',
    extension: '.dxf',
    isPro: true
  },
  {
    id: 'json',
    name: 'JSON Data',
    description: 'Raw data for developers',
    icon: '💾',
    extension: '.json',
    isPro: false
  }
];

const qualityOptions = [
  { id: 'low', name: 'Draft', description: 'Fast, smaller file size' },
  { id: 'medium', name: 'Standard', description: 'Balanced quality and size' },
  { id: 'high', name: 'High Quality', description: 'Best quality, larger file size' }
];

const paperSizes = [
  { id: 'a4', name: 'A4', description: '210 × 297 mm' },
  { id: 'a3', name: 'A3', description: '297 × 420 mm' },
  { id: 'a2', name: 'A2', description: '420 × 594 mm' },
  { id: 'a1', name: 'A1', description: '594 × 841 mm' }
];

export default function ExportModal({ 
  isOpen, 
  onClose, 
  floorPlan, 
  analysisData, 
  canvasElement, 
  projectName = 'floor-plan',
  isPro = false
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    quality: 'high',
    includeAnalysis: true,
    includeSpecs: true,
    paperSize: 'a4'
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!floorPlan) return;

    setIsExporting(true);
    
    try {
      await FloorPlanExporter.exportFloorPlan(
        selectedFormat,
        canvasElement,
        floorPlan,
        analysisData,
        {
          ...exportOptions,
          format: selectedFormat as any
        }
      );
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormatData = exportFormats.find(f => f.id === selectedFormat);
  const canExport = !selectedFormatData?.isPro || isPro;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Export Floor Plan</h2>
                    <p className="text-gray-600 mt-1">Choose format and options for your export</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Format Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Export Format</h3>
                    <div className="space-y-3">
                      {exportFormats.map((format) => (
                        <div
                          key={format.id}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedFormat === format.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${!canExport && format.isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => {
                            if (!format.isPro || isPro) {
                              setSelectedFormat(format.id);
                            }
                          }}
                        >
                          {format.isPro && !isPro && (
                            <div className="absolute top-2 right-2">
                              <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                PRO
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{format.icon}</div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {format.name}
                                <span className="text-sm text-gray-500 ml-1">
                                  ({format.extension})
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {format.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Export Options</h3>
                    
                    {/* Quality Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality
                      </label>
                      <div className="space-y-2">
                        {qualityOptions.map((quality) => (
                          <label key={quality.id} className="flex items-center">
                            <input
                              type="radio"
                              name="quality"
                              value={quality.id}
                              checked={exportOptions.quality === quality.id}
                              onChange={(e) => setExportOptions({
                                ...exportOptions,
                                quality: e.target.value as any
                              })}
                              className="mr-3"
                            />
                            <div>
                              <div className="font-medium text-sm">{quality.name}</div>
                              <div className="text-xs text-gray-600">{quality.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Paper Size (for PDF) */}
                    {selectedFormat === 'pdf' && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paper Size
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {paperSizes.map((size) => (
                            <button
                              key={size.id}
                              onClick={() => setExportOptions({
                                ...exportOptions,
                                paperSize: size.id as any
                              })}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                exportOptions.paperSize === size.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-medium text-sm">{size.name}</div>
                              <div className="text-xs text-gray-600">{size.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Include Options */}
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeAnalysis}
                          onChange={(e) => setExportOptions({
                            ...exportOptions,
                            includeAnalysis: e.target.checked
                          })}
                          className="mr-3"
                          disabled={!isPro}
                        />
                        <div>
                          <div className="font-medium text-sm">Include Analysis Data</div>
                          <div className="text-xs text-gray-600">
                            Material estimation, costs, and structural analysis
                            {!isPro && <span className="text-purple-600 font-medium"> (Pro only)</span>}
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeSpecs}
                          onChange={(e) => setExportOptions({
                            ...exportOptions,
                            includeSpecs: e.target.checked
                          })}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-sm">Include Specifications</div>
                          <div className="text-xs text-gray-600">
                            Technical specifications and compliance notes
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Pro Upgrade Prompt */}
                    {!isPro && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <div className="text-sm font-medium text-purple-800 mb-1">
                          🚀 Unlock Pro Features
                        </div>
                        <div className="text-xs text-purple-700">
                          Get DXF exports, analysis data, and premium export options with Planix Pro
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Exporting: <strong>{projectName}</strong>
                    {selectedFormatData && (
                      <span className="ml-2">
                        as <strong>{selectedFormatData.name}</strong>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={isExporting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={isExporting || !canExport}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        canExport
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isExporting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Exporting...
                        </div>
                      ) : (
                        `Export ${selectedFormatData?.name || ''}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
