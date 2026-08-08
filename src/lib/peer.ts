import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { Message } from './types';

export class PeerWrapper {
	private peer: Peer | null = null;
	private conns: Map<string, DataConnection> = new Map();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 3;
	private reconnectDelay = 2000; // 2 seconds
	private isDestroyed = false;
	private pendingTimers: Set<ReturnType<typeof setTimeout>> = new Set();

	constructor(
		private peerId: string,
		private onData: (peerId: string, data: Message) => void,
		private onPeerConnected: (peerId: string) => void,
		private onPeerDisconnected: (peerId: string) => void,
		private onServerConnected?: () => void
	) {}

	public connect(): void {
		this.peer = new Peer(this.peerId, {
			host: 'peerpoker-signaling-server.onrender.com',
			port: 443,
			path: '/myapp',
			secure: true
		});

		this.peer.on('open', (id) => {
			console.log(`Peer connected with ID: ${id}`);
			this.reconnectAttempts = 0; // Reset on successful connection
			this.onServerConnected?.();
		});

		this.peer.on('connection', (conn) => {
			this.setupConnection(conn);
		});

		this.peer.on('error', (e) => {
			console.error(`Peer error: ${e}`);

			if (e.type === 'network' || e.type === 'server-error') {
				this.attemptReconnect();
			}
		});
	}

	public connectTo(peerId: string, maxRetries = 3): void {
		console.log('connectTo called with peerId:', peerId);
		if (!this.peer) {
			console.log('this.peer is null, returning');
			return;
		}

		const attemptConnection = (attempt: number) => {
			if (this.isDestroyed) return;
			console.log(`Connection attempt ${attempt}/${maxRetries} to ${peerId}`);

			if (!this.peer) {
				console.log('this.peer is null, returning');
				return;
			}

			const conn = this.peer.connect(peerId, {
				reliable: true
			});

			let isResolved = false;

			// Timeout for connection attempt
			const connectionTimeout = setTimeout(() => {
				this.pendingTimers.delete(connectionTimeout);
				if (!isResolved) {
					console.warn(`Connection timeout for peer ${peerId} (attempt ${attempt})`);
					conn.close();

					if (attempt < maxRetries) {
						console.log(`Retrying connection in 2 seconds... (${attempt + 1}/${maxRetries})`);
						const retryTimer = setTimeout(() => {
							this.pendingTimers.delete(retryTimer);
							attemptConnection(attempt + 1);
						}, 2000);
						this.pendingTimers.add(retryTimer);
					} else {
						console.error(`Failed to connect to ${peerId} after ${maxRetries} attempts`);
					}
				}
			}, 10000);
			this.pendingTimers.add(connectionTimeout);

			const cleanup = () => {
				this.pendingTimers.delete(connectionTimeout);
				clearTimeout(connectionTimeout);
				isResolved = true;
			};

			if (conn.open) {
				cleanup();
				console.log('Connection already open, setting up');
				this.setupConnection(conn);
			} else {
				conn.on('open', () => {
					if (this.isDestroyed) return;
					cleanup();
					console.log('Connection opened, setting up');
					this.setupConnection(conn);
				});

				conn.on('error', (err) => {
					cleanup();
					console.error(`Connection error on attempt ${attempt}:`, err);

					if (attempt < maxRetries) {
						console.log(`Retrying connection in 2 seconds... (${attempt + 1}/${maxRetries})`);
						const retryTimer = setTimeout(() => {
							this.pendingTimers.delete(retryTimer);
							attemptConnection(attempt + 1);
						}, 2000);
						this.pendingTimers.add(retryTimer);
					} else {
						console.error(`Failed to connect to ${peerId} after ${maxRetries} attempts`);
					}
				});
			}
		};

		attemptConnection(1);
	}

	private setupConnection(conn: DataConnection): void {
		console.log('setupConnection called for peer:', conn.peer);

		conn.on('data', (data: unknown) => {
			if (this.isDestroyed) return;
			if (data && typeof data === 'object' && 'type' in data && 'senderId' in data) {
				this.onData(conn.peer, data as Message);
			} else {
				console.warn('Invalid message format:', data);
			}
		});

		conn.on('close', () => {
			if (this.isDestroyed) return;
			console.log(`Disconnected from peer: ${conn.peer}`);
			this.conns.delete(conn.peer);
			this.onPeerDisconnected(conn.peer);
		});

		conn.on('error', (e) => {
			console.error(`Connection error with peer ${conn.peer}: ${e}`);
		});

		// 既に接続されている場合はすぐに処理
		if (conn.open) {
			console.log('Connection already open');
			this.conns.set(conn.peer, conn);
			this.onPeerConnected(conn.peer);
		} else {
			conn.on('open', () => {
				console.log(`Connected to peer: ${conn.peer}`);
				this.conns.set(conn.peer, conn);
				this.onPeerConnected(conn.peer);
			});
		}
	}

	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnect attempts reached. Could not reconnect.');
			return;
		}

		this.reconnectAttempts++;
		console.log(
			`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
		);

		setTimeout(() => {
			if (this.peer && !this.peer.destroyed) {
				this.peer.reconnect();
			}
		}, this.reconnectDelay * this.reconnectAttempts);
	}

	public broadcast(data: Message): void {
		this.conns.forEach((conn) => {
			conn.send(data);
		});
	}

	public sendTo(peerId: string, data: Message): void {
		const conn = this.conns.get(peerId);
		if (conn) {
			console.log(`Sending to ${peerId}:`, data);
			conn.send(data);
		} else {
			console.warn(
				`No connection found for peer: ${peerId}. Available connections:`,
				Array.from(this.conns.keys())
			);
		}
	}

	public disconnect(): void {
		this.isDestroyed = true;
		this.pendingTimers.forEach(clearTimeout);
		this.pendingTimers.clear();
		this.conns.forEach((conn) => {
			conn.close();
		});
		this.conns.clear();
		this.peer?.destroy();
	}

	public getPeerId(): string {
		return this.peerId;
	}
}
