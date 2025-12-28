import { render, screen } from '@testing-library/react';
import Timer from '../../components/Timer';

describe('Timer Component', () => {
  it('should display timer value in seconds', () => {
    render(<Timer seconds={45} isActive={true} />);

    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('should show time remaining label', () => {
    render(<Timer seconds={30} isActive={true} />);

    expect(screen.getByText('Time Remaining')).toBeInTheDocument();
  });

  it('should apply low time styling when seconds <= 10', () => {
    const { container } = render(<Timer seconds={10} isActive={true} />);

    const timeDisplay = screen.getByText('10s');
    expect(timeDisplay).toHaveClass('text-red-500');
    expect(timeDisplay).toHaveClass('animate-pulse');
  });

  it('should apply normal styling when seconds > 10', () => {
    const { container } = render(<Timer seconds={30} isActive={true} />);

    const timeDisplay = screen.getByText('30s');
    expect(timeDisplay).toHaveClass('text-primary-600');
    expect(timeDisplay).not.toHaveClass('animate-pulse');
  });

  it('should calculate progress bar percentage correctly', () => {
    const { container } = render(<Timer seconds={30} isActive={true} />);

    const progressBar = container.querySelector('.h-full');
    expect(progressBar).toHaveStyle({ width: '50%' }); // 30/60 = 50%
  });

  it('should show red progress bar when time is low', () => {
    const { container } = render(<Timer seconds={5} isActive={true} />);

    const progressBar = container.querySelector('.h-full');
    expect(progressBar).toHaveClass('bg-red-500');
  });

  it('should show primary color progress bar when time is normal', () => {
    const { container } = render(<Timer seconds={30} isActive={true} />);

    const progressBar = container.querySelector('.h-full');
    expect(progressBar).toHaveClass('bg-primary-500');
  });
});
