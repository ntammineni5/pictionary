'use client';

import { useEffect, useRef, useState } from 'react';
import { DrawingStroke } from '../types';

interface CanvasProps {
  strokes: DrawingStroke[];
  canDraw: boolean;
  onStroke: (stroke: DrawingStroke) => void;
  onClear: () => void;
}

export default function Canvas({ strokes, canDraw, onStroke, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentWidth, setCurrentWidth] = useState(3);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  const widths = [1, 3, 5, 8, 12];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    });
  }, [strokes]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentStroke([coords]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw || !isDrawing) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const newStroke = [...currentStroke, coords];
    setCurrentStroke(newStroke);

    // Draw locally immediately for responsiveness
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (newStroke.length >= 2) {
      const prevPoint = newStroke[newStroke.length - 2];
      const currPoint = newStroke[newStroke.length - 1];

      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(currPoint.x, currPoint.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!canDraw || !isDrawing) return;

    if (currentStroke.length > 0) {
      const stroke: DrawingStroke = {
        color: currentColor,
        width: currentWidth,
        points: currentStroke,
      };
      onStroke(stroke);
    }

    setIsDrawing(false);
    setCurrentStroke([]);
  };

  return (
    <div className="flex flex-col gap-4">
      {canDraw && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Color:</span>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      currentColor === color ? 'border-primary-500 scale-110' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Width:</span>
              <div className="flex gap-2">
                {widths.map((width) => (
                  <button
                    key={width}
                    onClick={() => setCurrentWidth(width)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentWidth === width
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div
                      className="rounded-full bg-gray-700 dark:bg-gray-300"
                      style={{ width: `${width * 2}px`, height: `${width * 2}px` }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onClear}
              className="ml-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Clear Canvas
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-xl dark:shadow-gray-900/50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`w-full border-4 ${canDraw ? 'border-primary-500 cursor-crosshair' : 'border-gray-300 dark:border-gray-600 cursor-not-allowed'}`}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
}
