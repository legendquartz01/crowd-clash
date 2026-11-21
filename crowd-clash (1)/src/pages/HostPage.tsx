import { useEffect } from 'react';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { HostHeader } from '../components/HostHeader';
import { HostFinalWinnerView } from '../components/host/HostFinalWinnerView';
import { HostGameActiveView } from '../components/host/HostGameActiveView';
import { HostGameIntroView } from '../components/host/HostGameIntroView';
import { HostImposterView } from '../components/host/HostImposterView';
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
    imposterTimeLeft,
    onlineCount,
    connectionStatus,
    transportMode,
    setGameMode,
    togglePlaylistGame,
    goToTeamSelect,
    startGames,
    setRoundDuration,
    startRound,
    endRoundEarly,
    advanceAfterRound,
    playAgainSameRoom,
    playAgainNewRoom,
    updateImposterSettings,
    startImposterRound,
    beginImposterClues,
    revealImposterCluesNow,
    startImposterVoting,
    endImposterVotingNow,
    backToLobbyFromImposter,
  } = useHostRoom();

  useEffect(() => {
    document.title = `Host Stage (${roomCode}) — CROWD CLASH`;
  }, [roomCode]);

  const { meta, teams, players, imposter } = roomState;
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
            gameMode={meta.gameMode}
            playlist={meta.gamePlaylist}
            imposterSettings={imposter.settings}
            usedImposterWordsCount={imposter.usedWords.length}
            onSelectMode={setGameMode}
            onToggleGame={togglePlaylistGame}
            onNextTeamSelect={goToTeamSelect}
            onUpdateImposterSettings={updateImposterSettings}
            onStartImposterRound={startImposterRound}
          />
        )}

        {meta.state === 'IMPOSTER_ACTIVE' && imposter.round && (
          <HostImposterView
            round={imposter.round}
            settings={imposter.settings}
            players={playerList}
            timeLeft={imposterTimeLeft}
            onStartClues={beginImposterClues}
            onRevealCluesNow={revealImposterCluesNow}
            onStartVote={startImposterVoting}
            onEndVoteNow={endImposterVotingNow}
            onPlayAnotherRound={startImposterRound}
            onBackToLobby={backToLobbyFromImposter}
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

        {meta.state === 'COUNTDOWN' && currentGame && (
          <CountdownOverlay
            countdownEndsAt={meta.countdownEndsAt}
            game={currentGame}
            roundNumber={meta.currentRoundIndex + 1}
            totalRounds={meta.gamePlaylist.length}
            variant="host"
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
            roomCode={roomCode}
            teams={teams}
            players={playerList}
            onPlayAgainSameRoom={playAgainSameRoom}
            onNewRoom={playAgainNewRoom}
          />
        )}
      </main>
    </div>
  );
}
