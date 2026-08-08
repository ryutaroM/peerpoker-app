/* eslint-disable svelte/prefer-svelte-reactivity --
   GameState.svelte と同じく素の Map を丸ごと差し替えて更新を通知する方式を再現するため、
   ここでも SvelteMap ではなく Map を使う。 */
import { vi } from 'vitest';
import type { Participant, PeerId, Vote } from '$lib/types';

/**
 * `getContext('gameState')` 経由でコンポーネントに渡されるオブジェクトの
 * テスト用実装。GameState.svelte と同じく getter/setter 越しに
 * `$state` を公開するため、テストから値を書き換えると再描画される。
 */
export interface MockGameState {
	peerId: PeerId;
	playerName: string;
	playerIcon: string;
	hasName: boolean;
	participants: Map<PeerId, Participant>;
	isRevealed: boolean;
	isConnected: boolean;
	isConnecting: boolean;
	isConnectingToPeer: boolean;
	isServerStarting: boolean;
	setPlayerName: (name: string) => void;
	connectToServer: () => void;
	startGame: (name: string) => void;
	connectToOpponent: (opponentId: string) => void;
	vote: (value: Vote) => void;
	reveal: () => void;
	reset: () => void;
}

export function createMockGameState(init: Partial<MockGameState> = {}) {
	const inner = $state({
		peerId: init.peerId ?? 'me',
		playerName: init.playerName ?? '',
		playerIcon: init.playerIcon ?? '',
		hasName: init.hasName ?? false,
		participants: init.participants ?? new Map<PeerId, Participant>(),
		isRevealed: init.isRevealed ?? false,
		isConnected: init.isConnected ?? false,
		isConnecting: init.isConnecting ?? false,
		isConnectingToPeer: init.isConnectingToPeer ?? false,
		isServerStarting: init.isServerStarting ?? false
	});

	return {
		get peerId() {
			return inner.peerId;
		},
		set peerId(value: PeerId) {
			inner.peerId = value;
		},
		get playerName() {
			return inner.playerName;
		},
		set playerName(value: string) {
			inner.playerName = value;
		},
		get playerIcon() {
			return inner.playerIcon;
		},
		set playerIcon(value: string) {
			inner.playerIcon = value;
		},
		get hasName() {
			return inner.hasName;
		},
		set hasName(value: boolean) {
			inner.hasName = value;
		},
		get participants() {
			return inner.participants;
		},
		set participants(value: Map<PeerId, Participant>) {
			inner.participants = value;
		},
		get isRevealed() {
			return inner.isRevealed;
		},
		set isRevealed(value: boolean) {
			inner.isRevealed = value;
		},
		get isConnected() {
			return inner.isConnected;
		},
		set isConnected(value: boolean) {
			inner.isConnected = value;
		},
		get isConnecting() {
			return inner.isConnecting;
		},
		set isConnecting(value: boolean) {
			inner.isConnecting = value;
		},
		get isConnectingToPeer() {
			return inner.isConnectingToPeer;
		},
		set isConnectingToPeer(value: boolean) {
			inner.isConnectingToPeer = value;
		},
		get isServerStarting() {
			return inner.isServerStarting;
		},
		set isServerStarting(value: boolean) {
			inner.isServerStarting = value;
		},
		setPlayerName: vi.fn(init.setPlayerName),
		connectToServer: vi.fn(init.connectToServer),
		startGame: vi.fn(init.startGame),
		connectToOpponent: vi.fn(init.connectToOpponent),
		vote: vi.fn(init.vote),
		reveal: vi.fn(init.reveal),
		reset: vi.fn(init.reset)
	};
}

/** `[id, 部分的な Participant]` の一覧から participants Map を組み立てる。 */
export function makeParticipants(
	entries: Array<[PeerId, Partial<Participant>]>
): Map<PeerId, Participant> {
	return new Map(
		entries.map(([id, participant]) => [
			id,
			{
				name: participant.name ?? id,
				hasVoted: participant.hasVoted ?? participant.vote !== undefined,
				vote: participant.vote,
				icon: participant.icon
			}
		])
	);
}
