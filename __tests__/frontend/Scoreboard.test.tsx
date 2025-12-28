import { render, screen } from '@testing-library/react';
import Scoreboard from '../../components/Scoreboard';
import { Player } from '../../types';

describe('Scoreboard Component', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      name: 'Alice',
      score: 100,
      isHost: true,
      connected: true,
    },
    {
      id: 'player-2',
      name: 'Bob',
      score: 50,
      isHost: false,
      connected: true,
    },
    {
      id: 'player-3',
      name: 'Charlie',
      score: 75,
      isHost: false,
      connected: true,
    },
  ];

  it('should render scoreboard title', () => {
    render(<Scoreboard players={mockPlayers} currentDrawer={null} currentPlayerId={null} />);

    expect(screen.getByText('Scoreboard')).toBeInTheDocument();
  });

  it('should display all players', () => {
    render(<Scoreboard players={mockPlayers} currentDrawer={null} currentPlayerId={null} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should sort players by score (highest first)', () => {
    render(<Scoreboard players={mockPlayers} currentDrawer={null} currentPlayerId={null} />);

    const playerElements = screen.getAllByText(/#\d/);
    const rankings = playerElements.map((el) => el.textContent);

    expect(rankings[0]).toBe('#1');
    expect(rankings[1]).toBe('#2');
    expect(rankings[2]).toBe('#3');
  });

  it('should show host badge', () => {
    render(<Scoreboard players={mockPlayers} currentDrawer={null} currentPlayerId={null} />);

    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('should show drawing badge for current drawer', () => {
    render(
      <Scoreboard players={mockPlayers} currentDrawer="player-2" currentPlayerId={null} />
    );

    expect(screen.getByText('Drawing')).toBeInTheDocument();
  });

  it('should show you badge for current player', () => {
    render(
      <Scoreboard players={mockPlayers} currentDrawer={null} currentPlayerId="player-3" />
    );

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('should display player scores', () => {
    render(<Scoreboard players={mockPlayers} currentDrawer={null} currentPlayerId={null} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should show disconnected status', () => {
    const disconnectedPlayers: Player[] = [
      {
        id: 'player-1',
        name: 'Alice',
        score: 100,
        isHost: true,
        connected: false,
      },
    ];

    render(
      <Scoreboard
        players={disconnectedPlayers}
        currentDrawer={null}
        currentPlayerId={null}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
});
