import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PeerWrapper } from './peer';
import type { Message } from './types';

// vi.mock はファイル先頭へ巻き上げられるため、フェイク実装も vi.hoisted で先に定義する。
const { FakePeer, FakeConnection } = vi.hoisted(() => {
	type Handler = (...args: unknown[]) => void;

	/** peerjs の DataConnection を模したフェイク。テストから任意のイベントを発火できる。 */
	class FakeConnection {
		open = false;
		send = vi.fn();
		close = vi.fn();
		private handlers = new Map<string, Handler[]>();

		constructor(public peer: string) {}

		on(event: string, handler: Handler) {
			const list = this.handlers.get(event) ?? [];
			list.push(handler);
			this.handlers.set(event, list);
		}

		emit(event: string, ...args: unknown[]) {
			for (const handler of this.handlers.get(event) ?? []) handler(...args);
		}

		has(event: string) {
			return (this.handlers.get(event) ?? []).length > 0;
		}
	}

	/** peerjs の Peer を模したフェイク。 */
	class FakePeer {
		static instances: FakePeer[] = [];
		static outgoing: FakeConnection[] = [];

		destroyed = false;
		destroy = vi.fn(() => {
			this.destroyed = true;
		});
		reconnect = vi.fn();
		connect = vi.fn((peerId: string) => {
			const conn = new FakeConnection(peerId);
			FakePeer.outgoing.push(conn);
			return conn;
		});
		private handlers = new Map<string, Handler[]>();

		constructor(
			public id: string,
			public options: Record<string, unknown>
		) {
			FakePeer.instances.push(this);
		}

		on(event: string, handler: Handler) {
			const list = this.handlers.get(event) ?? [];
			list.push(handler);
			this.handlers.set(event, list);
		}

		emit(event: string, ...args: unknown[]) {
			for (const handler of this.handlers.get(event) ?? []) handler(...args);
		}
	}

	return { FakePeer, FakeConnection };
});

type FakePeer = InstanceType<typeof FakePeer>;

vi.mock('peerjs', () => ({ default: FakePeer }));

const MY_ID = 'my-peer-id';

function message(overrides: Partial<Message> = {}): Message {
	return { type: 'vote', senderId: 'peer-2', timestamp: 1, ...overrides };
}

function createWrapper() {
	const callbacks = {
		onData: vi.fn<(peerId: string, data: Message) => void>(),
		onPeerConnected: vi.fn<(peerId: string) => void>(),
		onPeerDisconnected: vi.fn<(peerId: string) => void>(),
		onServerConnected: vi.fn<() => void>()
	};
	const wrapper = new PeerWrapper(
		MY_ID,
		callbacks.onData,
		callbacks.onPeerConnected,
		callbacks.onPeerDisconnected,
		callbacks.onServerConnected
	);
	return { wrapper, callbacks };
}

/** connect() 済みの PeerWrapper と、生成された FakePeer を返す。 */
function createConnectedWrapper() {
	const { wrapper, callbacks } = createWrapper();
	wrapper.connect();
	const peer = FakePeer.instances.at(-1)!;
	return { wrapper, callbacks, peer };
}

/** 相手からの着信を確立済みの状態にして、その接続を返す。 */
function acceptIncoming(peer: FakePeer, peerId: string) {
	const conn = new FakeConnection(peerId);
	peer.emit('connection', conn);
	conn.open = true;
	conn.emit('open');
	return conn;
}

beforeEach(() => {
	FakePeer.instances = [];
	FakePeer.outgoing = [];
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('PeerWrapper', () => {
	describe('connect', () => {
		it('自分の peerId とシグナリングサーバーの設定で Peer を生成する', () => {
			const { wrapper } = createWrapper();

			wrapper.connect();

			const peer = FakePeer.instances.at(-1)!;
			expect(peer.id).toBe(MY_ID);
			expect(peer.options).toMatchObject({
				host: 'peerpoker-signaling-server.onrender.com',
				port: 443,
				path: '/myapp',
				secure: true
			});
		});

		it('open イベントで onServerConnected を呼ぶ', () => {
			const { callbacks, peer } = createConnectedWrapper();

			peer.emit('open', MY_ID);

			expect(callbacks.onServerConnected).toHaveBeenCalledTimes(1);
		});

		it('onServerConnected 未指定でも open イベントで落ちない', () => {
			const wrapper = new PeerWrapper(MY_ID, vi.fn(), vi.fn(), vi.fn());
			wrapper.connect();

			expect(() => FakePeer.instances.at(-1)!.emit('open', MY_ID)).not.toThrow();
		});
	});

	describe('着信接続', () => {
		it('接続が開いたら onPeerConnected を呼ぶ', () => {
			const { callbacks, peer } = createConnectedWrapper();

			acceptIncoming(peer, 'peer-2');

			expect(callbacks.onPeerConnected).toHaveBeenCalledExactlyOnceWith('peer-2');
		});

		it('既に開いている接続はその場で確立済みとして扱う', () => {
			const { callbacks, peer } = createConnectedWrapper();

			const conn = new FakeConnection('peer-2');
			conn.open = true;
			peer.emit('connection', conn);

			expect(callbacks.onPeerConnected).toHaveBeenCalledExactlyOnceWith('peer-2');
			expect(conn.has('open')).toBe(false);
		});

		it('受信データを onData に渡す', () => {
			const { callbacks, peer } = createConnectedWrapper();
			const conn = acceptIncoming(peer, 'peer-2');
			const data = message({ payload: { vote: 5 } });

			conn.emit('data', data);

			expect(callbacks.onData).toHaveBeenCalledExactlyOnceWith('peer-2', data);
		});

		it('type や senderId を欠くデータは無視する', () => {
			const { callbacks, peer } = createConnectedWrapper();
			const conn = acceptIncoming(peer, 'peer-2');

			conn.emit('data', { type: 'vote' });
			conn.emit('data', { senderId: 'peer-2' });
			conn.emit('data', 'not an object');
			conn.emit('data', null);

			expect(callbacks.onData).not.toHaveBeenCalled();
		});

		it('close イベントで onPeerDisconnected を呼ぶ', () => {
			const { callbacks, peer } = createConnectedWrapper();
			const conn = acceptIncoming(peer, 'peer-2');

			conn.emit('close');

			expect(callbacks.onPeerDisconnected).toHaveBeenCalledExactlyOnceWith('peer-2');
		});

		it('close 後はその相手に送信しなくなる', () => {
			const { wrapper, peer } = createConnectedWrapper();
			const conn = acceptIncoming(peer, 'peer-2');

			conn.emit('close');
			wrapper.sendTo('peer-2', message());

			expect(conn.send).not.toHaveBeenCalled();
		});

		it('接続エラーが起きても切断扱いにはしない', () => {
			const { callbacks, peer } = createConnectedWrapper();
			const conn = acceptIncoming(peer, 'peer-2');

			conn.emit('error', new Error('boom'));

			expect(callbacks.onPeerDisconnected).not.toHaveBeenCalled();
		});
	});

	describe('connectTo', () => {
		it('connect 前に呼ばれた場合は何もしない', () => {
			const { wrapper } = createWrapper();

			wrapper.connectTo('peer-2');

			expect(FakePeer.outgoing).toHaveLength(0);
		});

		it('reliable な接続を要求する', () => {
			const { wrapper, peer } = createConnectedWrapper();

			wrapper.connectTo('peer-2');

			expect(peer.connect).toHaveBeenCalledExactlyOnceWith('peer-2', { reliable: true });
		});

		it('開通したら onPeerConnected を呼ぶ', () => {
			const { wrapper, callbacks } = createConnectedWrapper();
			wrapper.connectTo('peer-2');

			const conn = FakePeer.outgoing.at(-1)!;
			conn.open = true;
			conn.emit('open');

			expect(callbacks.onPeerConnected).toHaveBeenCalledExactlyOnceWith('peer-2');
		});

		it('既に開いている接続はその場で確立済みとして扱う', () => {
			const { wrapper, callbacks, peer } = createConnectedWrapper();
			peer.connect.mockImplementationOnce((peerId: string) => {
				const conn = new FakeConnection(peerId);
				conn.open = true;
				FakePeer.outgoing.push(conn);
				return conn;
			});

			wrapper.connectTo('peer-2');

			expect(callbacks.onPeerConnected).toHaveBeenCalledExactlyOnceWith('peer-2');
		});

		it('10 秒開通しなければ接続を閉じて 2 秒後に再試行する', () => {
			vi.useFakeTimers();
			const { wrapper, peer } = createConnectedWrapper();

			wrapper.connectTo('peer-2');
			const first = FakePeer.outgoing.at(-1)!;

			vi.advanceTimersByTime(10000);
			expect(first.close).toHaveBeenCalledTimes(1);
			expect(peer.connect).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(2000);
			expect(peer.connect).toHaveBeenCalledTimes(2);
		});

		it('接続エラーでも 2 秒後に再試行する', () => {
			vi.useFakeTimers();
			const { wrapper, peer } = createConnectedWrapper();

			wrapper.connectTo('peer-2');
			FakePeer.outgoing.at(-1)!.emit('error', new Error('boom'));

			vi.advanceTimersByTime(2000);

			expect(peer.connect).toHaveBeenCalledTimes(2);
		});

		it('既定の 3 回を超えて再試行しない', () => {
			vi.useFakeTimers();
			const { wrapper, peer } = createConnectedWrapper();

			wrapper.connectTo('peer-2');
			for (let i = 0; i < 5; i++) {
				vi.advanceTimersByTime(12000);
			}

			expect(peer.connect).toHaveBeenCalledTimes(3);
		});

		it('maxRetries を指定すればその回数まで再試行する', () => {
			vi.useFakeTimers();
			const { wrapper, peer } = createConnectedWrapper();

			wrapper.connectTo('peer-2', 1);
			vi.advanceTimersByTime(12000);

			expect(peer.connect).toHaveBeenCalledTimes(1);
		});

		it('開通した接続はタイムアウトで閉じられない', () => {
			vi.useFakeTimers();
			const { wrapper, peer } = createConnectedWrapper();

			wrapper.connectTo('peer-2');
			const conn = FakePeer.outgoing.at(-1)!;
			conn.open = true;
			conn.emit('open');

			vi.advanceTimersByTime(30000);

			expect(conn.close).not.toHaveBeenCalled();
			expect(peer.connect).toHaveBeenCalledTimes(1);
		});
	});

	describe('シグナリングサーバーとの再接続', () => {
		it('ネットワークエラーなら遅延後に再接続する', () => {
			vi.useFakeTimers();
			const { peer } = createConnectedWrapper();

			peer.emit('error', { type: 'network' });
			expect(peer.reconnect).not.toHaveBeenCalled();

			vi.advanceTimersByTime(2000);

			expect(peer.reconnect).toHaveBeenCalledTimes(1);
		});

		it('サーバーエラーでも再接続する', () => {
			vi.useFakeTimers();
			const { peer } = createConnectedWrapper();

			peer.emit('error', { type: 'server-error' });
			vi.advanceTimersByTime(2000);

			expect(peer.reconnect).toHaveBeenCalledTimes(1);
		});

		it('それ以外のエラーでは再接続しない', () => {
			vi.useFakeTimers();
			const { peer } = createConnectedWrapper();

			peer.emit('error', { type: 'peer-unavailable' });
			vi.advanceTimersByTime(10000);

			expect(peer.reconnect).not.toHaveBeenCalled();
		});

		it('再接続の待ち時間は試行ごとに伸びる', () => {
			vi.useFakeTimers();
			const { peer } = createConnectedWrapper();

			peer.emit('error', { type: 'network' });
			vi.advanceTimersByTime(2000);
			expect(peer.reconnect).toHaveBeenCalledTimes(1);

			peer.emit('error', { type: 'network' });
			vi.advanceTimersByTime(2000);
			expect(peer.reconnect).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(2000);
			expect(peer.reconnect).toHaveBeenCalledTimes(2);
		});

		it('3 回を超えて再接続を試みない', () => {
			vi.useFakeTimers();
			const { peer } = createConnectedWrapper();

			for (let i = 0; i < 5; i++) {
				peer.emit('error', { type: 'network' });
				vi.advanceTimersByTime(10000);
			}

			expect(peer.reconnect).toHaveBeenCalledTimes(3);
		});

		it('接続に成功すると再試行回数がリセットされる', () => {
			vi.useFakeTimers();
			const { peer } = createConnectedWrapper();

			for (let i = 0; i < 3; i++) {
				peer.emit('error', { type: 'network' });
				vi.advanceTimersByTime(10000);
			}
			expect(peer.reconnect).toHaveBeenCalledTimes(3);

			peer.emit('open', MY_ID);
			peer.emit('error', { type: 'network' });
			vi.advanceTimersByTime(10000);

			expect(peer.reconnect).toHaveBeenCalledTimes(4);
		});

		it('破棄済みの Peer は再接続しない', () => {
			vi.useFakeTimers();
			const { wrapper, peer } = createConnectedWrapper();

			peer.emit('error', { type: 'network' });
			wrapper.disconnect();
			vi.advanceTimersByTime(10000);

			expect(peer.reconnect).not.toHaveBeenCalled();
		});
	});

	describe('接続の送受信', () => {
		it('broadcast は接続中のすべての相手に送る', () => {
			const { wrapper, peer } = createConnectedWrapper();
			const conn1 = acceptIncoming(peer, 'peer-2');
			const conn2 = acceptIncoming(peer, 'peer-3');
			const data = message({ type: 'reveal', senderId: MY_ID });

			wrapper.broadcast(data);

			expect(conn1.send).toHaveBeenCalledExactlyOnceWith(data);
			expect(conn2.send).toHaveBeenCalledExactlyOnceWith(data);
		});

		it('接続が無ければ broadcast は何もしない', () => {
			const { wrapper } = createConnectedWrapper();

			expect(() => wrapper.broadcast(message())).not.toThrow();
		});

		it('sendTo は指定した相手にだけ送る', () => {
			const { wrapper, peer } = createConnectedWrapper();
			const conn1 = acceptIncoming(peer, 'peer-2');
			const conn2 = acceptIncoming(peer, 'peer-3');
			const data = message({ senderId: MY_ID });

			wrapper.sendTo('peer-2', data);

			expect(conn1.send).toHaveBeenCalledExactlyOnceWith(data);
			expect(conn2.send).not.toHaveBeenCalled();
		});

		it('未接続の相手への sendTo は警告するだけで送らない', () => {
			const { wrapper } = createConnectedWrapper();

			wrapper.sendTo('unknown-peer', message());

			expect(console.warn).toHaveBeenCalled();
		});
	});

	describe('disconnect', () => {
		it('すべての接続を閉じて Peer を破棄する', () => {
			const { wrapper, peer } = createConnectedWrapper();
			const conn1 = acceptIncoming(peer, 'peer-2');
			const conn2 = acceptIncoming(peer, 'peer-3');

			wrapper.disconnect();

			expect(conn1.close).toHaveBeenCalledTimes(1);
			expect(conn2.close).toHaveBeenCalledTimes(1);
			expect(peer.destroy).toHaveBeenCalledTimes(1);
		});

		it('切断後は broadcast しても何も送らない', () => {
			const { wrapper, peer } = createConnectedWrapper();
			const conn = acceptIncoming(peer, 'peer-2');

			wrapper.disconnect();
			wrapper.broadcast(message());

			expect(conn.send).not.toHaveBeenCalled();
		});

		it('connect していなくても落ちない', () => {
			const { wrapper } = createWrapper();

			expect(() => wrapper.disconnect()).not.toThrow();
		});
	});

	describe('getPeerId', () => {
		it('自分の peerId を返す', () => {
			const { wrapper } = createWrapper();

			expect(wrapper.getPeerId()).toBe(MY_ID);
		});
	});
});
