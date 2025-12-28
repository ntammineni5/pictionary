import { render, screen, fireEvent } from '@testing-library/react';
import Canvas from '../../components/Canvas';
import { DrawingStroke } from '../../types';

describe('Canvas Component', () => {
  const mockOnStroke = jest.fn();
  const mockOnClear = jest.fn();

  const defaultProps = {
    strokes: [] as DrawingStroke[],
    canDraw: true,
    onStroke: mockOnStroke,
    onClear: mockOnClear,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render canvas element', () => {
    render(<Canvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should show drawing tools when canDraw is true', () => {
    render(<Canvas {...defaultProps} />);

    expect(screen.getByText('Color:')).toBeInTheDocument();
    expect(screen.getByText('Width:')).toBeInTheDocument();
    expect(screen.getByText('Clear Canvas')).toBeInTheDocument();
  });

  it('should not show drawing tools when canDraw is false', () => {
    render(<Canvas {...defaultProps} canDraw={false} />);

    expect(screen.queryByText('Color:')).not.toBeInTheDocument();
    expect(screen.queryByText('Width:')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear Canvas')).not.toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', () => {
    render(<Canvas {...defaultProps} />);

    const clearButton = screen.getByText('Clear Canvas');
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('should have cursor-crosshair when canDraw is true', () => {
    render(<Canvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveClass('cursor-crosshair');
  });

  it('should have cursor-not-allowed when canDraw is false', () => {
    render(<Canvas {...defaultProps} canDraw={false} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveClass('cursor-not-allowed');
  });

  it('should render with correct canvas dimensions', () => {
    render(<Canvas {...defaultProps} />);

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });
});
