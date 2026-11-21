import { useEffect } from 'react';
import { HostHeader } from '../components/HostHeader';
import { HostFinalWinnerView } from '../components/host/HostFinalWinnerView';
import { HostGameActiveView } from '../components/host/HostGameActiveView';
import { HostGameIntroView } from '../components/host/HostGameIntroView';
import { HostLobbyView } from '../components/host/HostLobbyView';
import { HostRoundEndView } from '../components/host/HostRoundEndView';
import { HostTeamSelectView } from '../components/host/HostTeamSelectView';
import { getGameById } from '../games/registry';
import { useHostRoom } from '../hooks/useHostRoom';

export function HostPage() {
  const {
    roomCode,
    roomState,
    timeLeft,
    onlineCount,
    connectionStatus,
    transportMode,
    togglePlaylistGame,
    goToTeamSelect,
    startGames,
    setRoundDuration,
    startRound,
    endRoundEarly,
    advanceAfterRound,
    playAgainNewRoom,
  } = useHostRoom();

  useEffect(() => {
    document.title = `Host Stage (${roomCode}) — CROWD CLASH`;
  }, [roomCode]);

  const { meta, teams, players } = roomState;
  const playerList = Object.values(players);
  const currentGame = getGameById(meta.currentGameId);
  const nextGameId = meta.gamePlaylist[meta.currentRoundIndex + 1] ?? null;
  const nextGame = getGameById(nextGameId);

  return (
    <div className="host-stage-bg flex min-h-dvh flex-col text-white">
      <HostHeader
        roomCode={roomCode}
        onlineCount={onlineCount}
        totalPlayers={playerList.length}
        gameState={meta.state}
        connectionStatus={connectionStatus}
        transportMode={transportMode}
        onNewRoom={playAgainNewRoom}
      />

      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        {meta.state === 'LOBBY' && (
          <HostLobbyView
            roomCode={roomCode}
            onlineCount={onlineCount}
            players={playerList}
            playlist={meta.gamePlaylist}
            onToggleGame={togglePlaylistGame}
            onNextTeamSelect={goToTeamSelect}
          />
        )}

        {meta.state === 'TEAM_SELECT' && (
          <HostTeamSelectView
            players={playerList}
            playlistCount={meta.gamePlaylist.length}
            onStartGames={startGames}
          />
        )}

        {meta.state === 'GAME_INTRO' && currentGame && (
          <HostGameIntroView
            game={currentGame}
            roundNumber={meta.currentRoundIndex + 1}
            totalRounds={meta.gamePlaylist.length}
            durationSec={meta.roundDurationSec}
            onChangeDuration={setRoundDuration}
            onStartRound={startRound}
          />
        )}

        {meta.state === 'GAME_ACTIVE' && currentGame && (
          <HostGameActiveView
            game={currentGame}
            roundNumber={meta.currentRoundIndex + 1}
            totalRounds={meta.gamePlaylist.length}
            timeLeft={timeLeft}
            teams={teams}
            players={playerList}
            onEndRoundEarly={endRoundEarly}
          />
        )}

        {meta.state === 'ROUND_END' && (
          <HostRoundEndView
            game={currentGame}
            roundNumber={meta.currentRoundIndex + 1}
            totalRounds={meta.gamePlaylist.length}
            nextGameTitle={nextGame?.title ?? null}
            teams={teams}
            players={playerList}
            onAdvance={advanceAfterRound}
          />
        )}

        {meta.state === 'FINAL_WINNER' && (
          <HostFinalWinnerView
            teams={teams}
            players={playerList}
            onPlayAgain={playAgainNewRoom}
          />
        )}
      </main>
    </div>
  );
}
