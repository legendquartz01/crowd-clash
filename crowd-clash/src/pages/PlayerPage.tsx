import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlayerFinalWinnerView } from '../components/player/PlayerFinalWinnerView';
import { PlayerGameActiveView } from '../components/player/PlayerGameActiveView';
import { PlayerGameIntroView } from '../components/player/PlayerGameIntroView';
import { PlayerJoinView } from '../components/player/PlayerJoinView';
import { PlayerLobbyView } from '../components/player/PlayerLobbyView';
import { PlayerRoundEndView } from '../components/player/PlayerRoundEndView';
import { PlayerTeamSelectView } from '../components/player/PlayerTeamSelectView';
import { getGameById } from '../games/registry';
import { usePlayerRoom } from '../hooks/usePlayerRoom';
import type { PlayerRecord } from '../types/game';

export function PlayerPage() {
  const [searchParams] = useSearchParams();
  const urlRoom = searchParams.get('room');

  const {
    session,
    savedNameHint,
    roomState,
    me,
    effectiveTeam,
    displayRoundScore,
    timeLeft,
    connectionStatus,
    transportMode,
    joinRoom,
    pickTeam,
    recordScore,
    leaveRoom,
  } = usePlayerRoom(urlRoom);

  useEffect(() => {
    document.title = session
      ? `Room ${session.roomCode} — CROWD CLASH`
      : 'Join Game — CROWD CLASH';
  }, [session]);

  // Not yet joined -> Join form with ?room= prefill
  if (!session) {
    return (
      <PlayerJoinView
        initialRoomCode={urlRoom ?? ''}
        initialName={savedNameHint}
        onJoin={joinRoom}
      />
    );
  }

  // Joined but waiting for initial STATE_SYNC or Host is in LOBBY
  if (!roomState || roomState.meta.state === 'LOBBY') {
    const connectedCount = roomState
      ? Object.values(roomState.players).filter((p) => p.online).length
      : 1;
    return (
      <PlayerLobbyView
        roomCode={session.roomCode}
        playerName={session.name}
        connectedPlayersCount={Math.max(1, connectedCount)}
        hasHostSynced={Boolean(roomState)}
        connectionStatus={connectionStatus}
        transportMode={transportMode}
        onLeave={leaveRoom}
      />
    );
  }

  const { meta, teams, players } = roomState;
  const allPlayers = Object.values(players);

  if (meta.state === 'TEAM_SELECT') {
    const redCount = allPlayers.filter((p) => p.team === 'red').length;
    const whiteCount = allPlayers.filter((p) => p.team === 'white').length;
    return (
      <PlayerTeamSelectView
        playerName={session.name}
        selectedTeam={effectiveTeam}
        redCount={redCount}
        whiteCount={whiteCount}
        onPickTeam={pickTeam}
      />
    );
  }

  const resolvedTeam = effectiveTeam ?? 'red';
  const resolvedMe: PlayerRecord = me ?? {
    id: session.playerId,
    name: session.name,
    team: resolvedTeam,
    totalScore: 0,
    roundScore: 0,
    online: true,
  };
  const currentGame = getGameById(meta.currentGameId);

  if (meta.state === 'GAME_INTRO' && currentGame) {
    return (
      <PlayerGameIntroView
        game={currentGame}
        team={resolvedTeam}
        roundNumber={meta.currentRoundIndex + 1}
        totalRounds={meta.gamePlaylist.length}
      />
    );
  }

  if (meta.state === 'GAME_ACTIVE' && currentGame) {
    return (
      <PlayerGameActiveView
        game={currentGame}
        team={resolvedTeam}
        timeLeft={timeLeft}
        roundScore={displayRoundScore}
        onScore={recordScore}
      />
    );
  }

  if (meta.state === 'ROUND_END') {
    return (
      <PlayerRoundEndView
        me={resolvedMe}
        team={resolvedTeam}
        teams={teams}
        allPlayers={allPlayers}
        gameTitle={currentGame?.title ?? 'Mini-Game'}
      />
    );
  }

  return (
    <PlayerFinalWinnerView
      me={resolvedMe}
      team={resolvedTeam}
      teams={teams}
      allPlayers={allPlayers}
      onLeave={leaveRoom}
    />
  );
}
