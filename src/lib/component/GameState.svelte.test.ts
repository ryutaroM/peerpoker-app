import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import GameStateHarness from '$lib/test-utils/GameStateHarness.svelte';
import { heroIcons } from '$lib/icons';
import type { Message, Participant, PeerId } from '$lib/types';

interface MockPeerWrapper {
	connect: ReturnType<typeof vi.fn>;
	connectTo: ReturnType<typeof vi.fn>;
	broadcast: ReturnType<typeof vi.fn>;
	sendTo: ReturnType<typeof vi.fn>;
	disconnect: ReturnType<typeof vi.fn>;
	peerId: string;
	onData: (peerId: string, data: Message) => void;
	onPeerConnected: (peerId: string) => void;
	onPeerDisconnected: (peerId: string) => void;
	onServerConnected?: () => void;
}

const { instances } = vi.hoisted(() => ({ instances: [] as MockPeerWrapper[] }));

vi.mock('$lib/peer', () => ({
	// クラス式で定義する。vi.fn() 由来のモックは restoreAllMocks で実装が失われ、
	// `new PeerWrapper(...)` が壊れてしまうため。
	PeerWrapper: class implements MockPeerWrapper {
		connect = vi.fn();
		connectTo = vi.fn();
		broadcast = vi.fn();
		sendTo = vi.fn();
		disconnect = vi.fn();

		constructor(
			public peerId: string,
			public onData: MockPeerWrapper['onData'],
			public onPeerConnected: MockPeerWrapper['onPeerConnected'],
			public onPeerDisconnected: MockPeerWrapper['onPeerDisconnected'],
			public onServerConnected?: MockPeerWrapper['onServerConnected']
		) {
			instances.push(this);
		}
	}
}));

interface GameStateContext {
	peerId: string;
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
	vote: (value: string | number) => void;
	reveal: () => void;
	reset: () => void;
}

const MY_ID = '11111111-1111-4111-8111-111111111111';

async function renderGameState() {
	let state!: GameStateContext;
	const { unmount } = await render(GameStateHarness, {
		onReady: (value: unknown) => {
			state = value as GameStateContext;
		}
	});
	await tick();
	return { state, unmount };
}

/** 直近に生成された PeerWrapper。GameState が接続を開始したあとに使う。 */
function peer(): MockPeerWrapper {
	const instance = instances.at(-1);
	if (!instance) throw new Error('PeerWrapper がまだ生成されていません');
	return instance;
}

function message(overrides: Partial<Message> & Pick<Message, 'type' | 'senderId'>): Message {
	return { timestamp: Date.now(), ...overrides };
}

beforeEach(() => {
	instances.length = 0;
	vi.spyOn(crypto, 'randomUUID').mockReturnValue(MY_ID);
	vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('GameState', () => {
	describe('初期化', () => {
		it('マウント時に自分の peerId とアイコンを用意する', async () => {
			const { state } = await renderGameState();

			expect(state.peerId).toBe(MY_ID);
			expect(heroIcons).toContain(state.playerIcon);
		});

		it('初期状態では未接続かつ名前未設定', async () => {
			const { state } = await renderGameState();

			expect(state.hasName).toBe(false);
			expect(state.isConnected).toBe(false);
			expect(state.isConnecting).toBe(false);
			expect(state.participants.size).toBe(0);
			expect(state.isRevealed).toBe(false);
		});

		it('接続前は PeerWrapper を生成しない', async () => {
			await renderGameState();

			expect(instances).toHaveLength(0);
		});
	});

	describe('setPlayerName', () => {
		it('名前を保存して hasName を立てる', async () => {
			const { state } = await renderGameState();

			state.setPlayerName('Alice');

			expect(state.playerName).toBe('Alice');
			expect(state.hasName).toBe(true);
		});
	});

	describe('startGame', () => {
		it('名前を確定して PeerWrapper を自分の peerId で接続させる', async () => {
			const { state } = await renderGameState();

			state.startGame('Alice');

			expect(state.playerName).toBe('Alice');
			expect(peer().peerId).toBe(MY_ID);
			expect(peer().connect).toHaveBeenCalledTimes(1);
		});

		it('自分を参加者に登録する', async () => {
			const { state } = await renderGameState();

			state.startGame('Alice');

			const me = state.participants.get(MY_ID);
			expect(me).toMatchObject({ name: 'Alice', hasVoted: false });
			expect(heroIcons).toContain(me?.icon);
		});

		it('接続中フラグを立てる', async () => {
			const { state } = await renderGameState();

			state.startGame('Alice');

			expect(state.isConnecting).toBe(true);
			expect(state.isConnected).toBe(false);
			expect(state.isServerStarting).toBe(false);
		});
	});

	describe('connectToServer', () => {
		it('設定済みの名前とアイコンで自分を参加者に登録する', async () => {
			const { state } = await renderGameState();
			state.setPlayerName('Bob');
			const icon = state.playerIcon;

			state.connectToServer();

			expect(state.participants.get(MY_ID)).toEqual({
				name: 'Bob',
				hasVoted: false,
				icon
			});
			expect(peer().connect).toHaveBeenCalledTimes(1);
		});
	});

	describe('シグナリングサーバーへの接続', () => {
		it('接続完了で isConnected に切り替える', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onServerConnected?.();

			expect(state.isConnected).toBe(true);
			expect(state.isConnecting).toBe(false);
			expect(state.isServerStarting).toBe(false);
		});

		it('5 秒経っても繋がらなければサーバー起動中とみなす', async () => {
			vi.useFakeTimers();
			const { state } = await renderGameState();
			state.startGame('Alice');

			expect(state.isServerStarting).toBe(false);

			vi.advanceTimersByTime(5000);

			expect(state.isServerStarting).toBe(true);
		});

		it('5 秒以内に接続できればサーバー起動中にはしない', async () => {
			vi.useFakeTimers();
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onServerConnected?.();
			vi.advanceTimersByTime(10000);

			expect(state.isServerStarting).toBe(false);
		});
	});

	describe('connectToOpponent', () => {
		it('相手 ID へ接続を試み、接続中フラグを立てる', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			state.connectToOpponent('other-peer');

			expect(peer().connectTo).toHaveBeenCalledExactlyOnceWith('other-peer');
			expect(state.isConnectingToPeer).toBe(true);
		});

		it('相手 ID が空なら何もしない', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			state.connectToOpponent('');

			expect(peer().connectTo).not.toHaveBeenCalled();
			expect(state.isConnectingToPeer).toBe(false);
		});

		it('サーバー未接続なら何もしない', async () => {
			const { state } = await renderGameState();

			state.connectToOpponent('other-peer');

			expect(instances).toHaveLength(0);
			expect(state.isConnectingToPeer).toBe(false);
		});
	});

	describe('投票操作', () => {
		it('vote で自分の投票を記録し、他のピアへ通知する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			state.vote(8);

			expect(state.participants.get(MY_ID)).toMatchObject({ vote: 8, hasVoted: true });
			expect(peer().broadcast).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({ type: 'vote', senderId: MY_ID, payload: { vote: 8 } })
			);
		});

		it('vote を繰り返すと最後の値で上書きする', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			state.vote(3);
			state.vote(13);

			expect(state.participants.get(MY_ID)).toMatchObject({ vote: 13, hasVoted: true });
		});

		it('reveal で公開状態にし、他のピアへ通知する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			state.reveal();

			expect(state.isRevealed).toBe(true);
			expect(peer().broadcast).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({ type: 'reveal', senderId: MY_ID })
			);
		});

		it('reset で全員の投票を破棄し、非公開に戻す', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			state.vote(5);
			state.reveal();

			state.reset();

			expect(state.isRevealed).toBe(false);
			expect(state.participants.get(MY_ID)).toMatchObject({ vote: undefined, hasVoted: false });
			expect(peer().broadcast).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'reset', senderId: MY_ID })
			);
		});
	});

	describe('ピアの接続と切断', () => {
		it('接続時に参加者を仮登録し、自分の情報を送る', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onPeerConnected('peer-2');

			expect(state.participants.get('peer-2')).toMatchObject({
				name: 'Connecting...',
				hasVoted: false
			});
			expect(peer().sendTo).toHaveBeenCalledExactlyOnceWith(
				'peer-2',
				expect.objectContaining({
					type: 'join',
					senderId: MY_ID,
					payload: expect.objectContaining({ name: 'Alice' })
				})
			);
		});

		it('接続時に既存のピアへ新しいピアの参加を通知する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onPeerConnected('peer-2');

			expect(peer().broadcast).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					type: 'peer-joined',
					senderId: MY_ID,
					payload: { peerId: 'peer-2' }
				})
			);
		});

		it('接続が確立するとピア接続中フラグを下ろす', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			state.connectToOpponent('peer-2');

			peer().onPeerConnected('peer-2');

			expect(state.isConnectingToPeer).toBe(false);
		});

		it('切断されたピアを参加者から取り除く', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-2');

			peer().onPeerDisconnected('peer-2');

			expect(state.participants.has('peer-2')).toBe(false);
			expect(state.participants.has(MY_ID)).toBe(true);
		});

		it('既に取り除かれたピアの切断通知では状態を変えない', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-2');
			peer().onPeerDisconnected('peer-2');
			const participantsAfterFirst = state.participants;

			peer().onPeerDisconnected('peer-2');

			expect(state.participants).toBe(participantsAfterFirst);
			expect(state.participants.size).toBe(1);
		});

		it('アンマウント時に離脱を通知してから接続を破棄する', async () => {
			const { state, unmount } = await renderGameState();
			state.startGame('Alice');
			const instance = peer();

			await unmount();

			expect(instance.broadcast).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({ type: 'leave', senderId: MY_ID })
			);
			expect(instance.disconnect).toHaveBeenCalledTimes(1);
		});
	});

	describe('受信メッセージの処理', () => {
		it('join: 未知のピアを参加者に加え、自分の情報を返信する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-2');
			peer().sendTo.mockClear();

			peer().onData(
				'peer-2',
				message({ type: 'join', senderId: 'peer-3', payload: { name: 'Carol', icon: '<svg />' } })
			);

			expect(state.participants.get('peer-3')).toEqual({
				name: 'Carol',
				hasVoted: false,
				icon: '<svg />'
			});
			expect(peer().sendTo).toHaveBeenCalledExactlyOnceWith(
				'peer-3',
				expect.objectContaining({ type: 'join', senderId: MY_ID })
			);
		});

		it('join: 名前が無ければ Unknown として登録する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onData('peer-2', message({ type: 'join', senderId: 'peer-2' }));

			expect(state.participants.get('peer-2')).toMatchObject({ name: 'Unknown' });
		});

		it('join: 既知のピアなら名前とアイコンを更新する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-2');

			peer().onData(
				'peer-2',
				message({ type: 'join', senderId: 'peer-2', payload: { name: 'Bob', icon: '<svg />' } })
			);

			expect(state.participants.get('peer-2')).toMatchObject({
				name: 'Bob',
				icon: '<svg />'
			});
		});

		it('peer-joined: 未接続のピアには自動で接続しにいく', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onData(
				'peer-2',
				message({ type: 'peer-joined', senderId: 'peer-2', payload: { peerId: 'peer-3' } })
			);

			expect(peer().connectTo).toHaveBeenCalledExactlyOnceWith('peer-3');
			expect(state.participants.has('peer-3')).toBe(false);
		});

		it('peer-joined: 接続済みのピアには接続しにいかない', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-3');
			peer().connectTo.mockClear();

			peer().onData(
				'peer-2',
				message({ type: 'peer-joined', senderId: 'peer-2', payload: { peerId: 'peer-3' } })
			);

			expect(peer().connectTo).not.toHaveBeenCalled();
		});

		it('peer-joined: 自分自身の ID には接続しにいかない', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().connectTo.mockClear();

			peer().onData(
				'peer-2',
				message({ type: 'peer-joined', senderId: 'peer-2', payload: { peerId: MY_ID } })
			);

			expect(peer().connectTo).not.toHaveBeenCalled();
		});

		it('vote: 送信元の投票を記録する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-2');

			peer().onData('peer-2', message({ type: 'vote', senderId: 'peer-2', payload: { vote: 21 } }));

			expect(state.participants.get('peer-2')).toMatchObject({ vote: 21, hasVoted: true });
		});

		it('vote: 未知の送信元は無視する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onData('peer-9', message({ type: 'vote', senderId: 'peer-9', payload: { vote: 21 } }));

			expect(state.participants.has('peer-9')).toBe(false);
		});

		it('reveal: 公開状態にする', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onData('peer-2', message({ type: 'reveal', senderId: 'peer-2' }));

			expect(state.isRevealed).toBe(true);
		});

		it('reset: 全員の投票を破棄して非公開に戻す', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-2');
			state.vote(5);
			peer().onData('peer-2', message({ type: 'vote', senderId: 'peer-2', payload: { vote: 5 } }));
			peer().onData('peer-2', message({ type: 'reveal', senderId: 'peer-2' }));

			peer().onData('peer-2', message({ type: 'reset', senderId: 'peer-2' }));

			expect(state.isRevealed).toBe(false);
			expect(state.participants.get(MY_ID)).toMatchObject({ vote: undefined, hasVoted: false });
			expect(state.participants.get('peer-2')).toMatchObject({ vote: undefined, hasVoted: false });
		});

		it('leave: 送信元自身の離脱通知で参加者から取り除く', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-2');

			peer().onData('peer-2', message({ type: 'leave', senderId: 'peer-2' }));

			expect(state.participants.has('peer-2')).toBe(false);
			expect(state.participants.has(MY_ID)).toBe(true);
		});

		it('leave: 別のピアを騙る離脱通知は無視する', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');
			peer().onPeerConnected('peer-2');
			peer().onPeerConnected('peer-3');

			peer().onData('peer-2', message({ type: 'leave', senderId: 'peer-3' }));

			expect(state.participants.has('peer-3')).toBe(true);
		});

		it('leave: 参加者にいないピアからの離脱通知でも状態を壊さない', async () => {
			const { state } = await renderGameState();
			state.startGame('Alice');

			peer().onData('peer-9', message({ type: 'leave', senderId: 'peer-9' }));

			expect(state.participants.size).toBe(1);
			expect(state.isRevealed).toBe(false);
		});
	});
});
